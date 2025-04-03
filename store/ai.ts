import axios from 'axios';
import { Message, MessageRole } from '../shared/types/message';
import { spawn } from 'child_process';
import * as fs from 'fs/promises';
import * as path from 'path';
import { fileExists } from '../utils/fs';

/**
 * Interface for LLM providers
 */
export interface LLMProvider {
  name: string;
  maxContextTokens: number;
  initialize(): Promise<void>;
  generateResponse(
    messages: Message[],
    options?: LLMRequestOptions
  ): Promise<LLMResponse>;
  countTokens(text: string): Promise<number>;
  isInitialized(): boolean;
}

export interface LLMRequestOptions {
  temperature?: number;
  maxTokens?: number;
  stopSequences?: string[];
  stream?: boolean;
  onPartialResponse?: (text: string) => void;
}

export interface LLMResponse {
  text: string;
  totalTokens: number;
  promptTokens: number;
  completionTokens: number;
  finishReason: 'stop' | 'length' | 'content_filter' | 'error';
}

/**
 * Implementation of LLMProvider that uses locally running Ollama
 */
export class OllamaProvider implements LLMProvider {
  name: string;
  maxContextTokens: number;
  private model: string;
  private apiUrl: string;
  private initialized: boolean = false;
  
  constructor(model: string = 'mistral:latest', apiUrl: string = 'http://localhost:11434/api') {
    this.model = model;
    this.apiUrl = apiUrl;
    this.name = `Ollama (${model})`;
    
    // Set default max context tokens based on model
    if (model.includes('mistral')) {
      this.maxContextTokens = 8192;
    } else if (model.includes('llama')) {
      this.maxContextTokens = 4096;
    } else {
      this.maxContextTokens = 4096; // Default fallback
    }
  }
  
  async initialize(): Promise<void> {
    try {
      // Check if Ollama is running
      const response = await axios.get(`${this.apiUrl}/tags`);
      
      if (response.status === 200) {
        // Check if the model is available
        const models = response.data.models || [];
        const modelExists = models.some((m: any) => m.name === this.model);
        
        if (!modelExists) {
          console.log(`Model ${this.model} not found, pulling it now...`);
          await this.pullModel();
        }
        
        this.initialized = true;
        console.log(`Ollama provider initialized with model: ${this.model}`);
      }
    } catch (error) {
      console.error('Failed to initialize Ollama provider:', error);
      throw new Error(`Ollama is not running or not available at ${this.apiUrl}`);
    }
  }
  
  async generateResponse(
    messages: Message[],
    options: LLMRequestOptions = {}
  ): Promise<LLMResponse> {
    if (!this.initialized) {
      await this.initialize();
    }
    
    const {
      temperature = 0.7,
      maxTokens = 1024,
      stopSequences = [],
      stream = false,
      onPartialResponse
    } = options;
    
    try {
      // Convert messages to Ollama format
      const ollamaMessages = messages.map(msg => ({
        role: this.convertRole(msg.role),
        content: msg.content
      }));
      
      if (stream && onPartialResponse) {
        return await this.streamingRequest(ollamaMessages, temperature, maxTokens, stopSequences, onPartialResponse);
      } else {
        return await this.standardRequest(ollamaMessages, temperature, maxTokens, stopSequences);
      }
    } catch (error) {
      console.error('Error generating response from Ollama:', error);
      
      // Return a basic error response
      return {
        text: 'Error: Unable to generate a response from the local LLM.',
        totalTokens: 0,
        promptTokens: 0,
        completionTokens: 0,
        finishReason: 'error'
      };
    }
  }
  
  async countTokens(text: string): Promise<number> {
    if (!this.initialized) {
      await this.initialize();
    }
    
    try {
      const response = await axios.post(`${this.apiUrl}/tokenize`, {
        model: this.model,
        prompt: text
      });
      
      return response.data.tokens?.length || 0;
    } catch (error) {
      console.error('Error counting tokens:', error);
      
      // Fallback: Estimate tokens (1 token ≈ 4 characters)
      return Math.ceil(text.length / 4);
    }
  }
  
  isInitialized(): boolean {
    return this.initialized;
  }
  
  private async standardRequest(
    messages: any[],
    temperature: number,
    maxTokens: number,
    stopSequences: string[]
  ): Promise<LLMResponse> {
    const response = await axios.post(`${this.apiUrl}/chat/completions`, {
      model: this.model,
      messages,
      temperature,
      max_tokens: maxTokens,
      stop: stopSequences.length > 0 ? stopSequences : undefined
    });
    
    const result = response.data;
    
    return {
      text: result.choices[0].message.content,
      totalTokens: result.usage.total_tokens,
      promptTokens: result.usage.prompt_tokens,
      completionTokens: result.usage.completion_tokens,
      finishReason: result.choices[0].finish_reason
    };
  }
  
  private async streamingRequest(
    messages: any[],
    temperature: number,
    maxTokens: number,
    stopSequences: string[],
    onPartialResponse: (text: string) => void
  ): Promise<LLMResponse> {
    const response = await axios.post(
      `${this.apiUrl}/chat/completions`,
      {
        model: this.model,
        messages,
        temperature,
        max_tokens: maxTokens,
        stop: stopSequences.length > 0 ? stopSequences : undefined,
        stream: true
      },
      { responseType: 'stream' }
    );
    
    return new Promise((resolve, reject) => {
      let fullText = '';
      let totalTokens = 0;
      let promptTokens = 0;
      let completionTokens = 0;
      let finishReason = 'stop';
      
      response.data.on('data', (chunk: Buffer) => {
        const lines = chunk.toString().split('\n').filter(line => line.trim() !== '');
        
        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.substring(6);
            if (data === '[DONE]') continue;
            
            try {
              const parsedData = JSON.parse(data);
              
              if (parsedData.choices && parsedData.choices[0]) {
                const content = parsedData.choices[0].delta?.content || '';
                fullText += content;
                onPartialResponse(fullText);
                
                // Update token counts if available
                if (parsedData.usage) {
                  totalTokens = parsedData.usage.total_tokens;
                  promptTokens = parsedData.usage.prompt_tokens;
                  completionTokens = parsedData.usage.completion_tokens;
                } else {
                  // Increment completion tokens as an estimate
                  completionTokens += content.length > 0 ? 1 : 0;
                }
                
                if (parsedData.choices[0].finish_reason) {
                  finishReason = parsedData.choices[0].finish_reason;
                }
              }
            } catch (error) {
              console.error('Error parsing streaming response:', error);
            }
          }
        }
      });
      
      response.data.on('end', () => {
        resolve({
          text: fullText,
          totalTokens: totalTokens || promptTokens + completionTokens,
          promptTokens: promptTokens,
          completionTokens: completionTokens,
          finishReason: finishReason as any
        });
      });
      
      response.data.on('error', (error: Error) => {
        reject(error);
      });
    });
  }
  
  private convertRole(role: MessageRole): string {
    switch (role) {
      case MessageRole.USER:
        return 'user';
      case MessageRole.ASSISTANT:
        return 'assistant';
      case MessageRole.SYSTEM:
        return 'system';
      default:
        return 'user';
    }
  }
  
  private async pullModel(): Promise<void> {
    try {
      console.log(`Pulling model ${this.model}...`);
      const response = await axios.post(`${this.apiUrl}/pull`, {
        name: this.model
      });
      
      if (response.status === 200) {
        console.log(`Successfully pulled model ${this.model}`);
      }
    } catch (error) {
      console.error(`Failed to pull model ${this.model}:`, error);
      throw new Error(`Failed to pull model ${this.model}`);
    }
  }
}

/**
 * Implementation of LLMProvider using ONNX Runtime for models like Mistral
 */
export class ONNXProvider implements LLMProvider {
  name: string;
  maxContextTokens: number;
  private modelPath: string;
  private modelType: string;
  private initialized: boolean = false;
  private childProcess: any = null;
  private apiUrl: string = 'http://localhost:8080/v1';
  
  constructor(modelPath: string, modelType: string = 'mistral') {
    this.modelPath = modelPath;
    this.modelType = modelType;
    this.name = `Local (${modelType})`;
    
    // Set max context tokens based on model type
    switch (modelType) {
      case 'mistral':
        this.maxContextTokens = 8192;
        break;
      case 'qwen':
        this.maxContextTokens = 8192;
        break;
      default:
        this.maxContextTokens = 4096;
    }
  }
  
  async initialize(): Promise<void> {
    if (this.initialized) return;
    
    try {
      // Check if model files exist
      const modelExists = await fileExists(this.modelPath);
      if (!modelExists) {
        throw new Error(`Model not found at ${this.modelPath}`);
      }
      
      // Start the local server
      await this.startServer();
      
      // Wait for server to be ready
      await this.waitForServer();
      
      this.initialized = true;
      console.log(`ONNX provider initialized with model: ${this.modelPath}`);
    } catch (error) {
      console.error('Failed to initialize ONNX provider:', error);
      throw error;
    }
  }
  
  async generateResponse(
    messages: Message[],
    options: LLMRequestOptions = {}
  ): Promise<LLMResponse> {
    if (!this.initialized) {
      await this.initialize();
    }
    
    const {
      temperature = 0.7,
      maxTokens = 1024,
      stopSequences = [],
      stream = false,
      onPartialResponse
    } = options;
    
    try {
      // Convert messages to the API format
      const apiMessages = messages.map(msg => ({
        role: this.convertRole(msg.role),
        content: msg.content
      }));
      
      if (stream && onPartialResponse) {
        return await this.streamingRequest(apiMessages, temperature, maxTokens, stopSequences, onPartialResponse);
      } else {
        return await this.standardRequest(apiMessages, temperature, maxTokens, stopSequences);
      }
    } catch (error) {
      console.error('Error generating response from ONNX provider:', error);
      
      return {
        text: 'Error: Unable to generate a response from the local LLM.',
        totalTokens: 0,
        promptTokens: 0,
        completionTokens: 0,
        finishReason: 'error'
      };
    }
  }
  
  async countTokens(text: string): Promise<number> {
    if (!this.initialized) {
      await this.initialize();
    }
    
    try {
      const response = await axios.post(`${this.apiUrl}/tokenize`, {
        input: text
      });
      
      return response.data.tokens?.length || 0;
    } catch (error) {
      console.error('Error counting tokens:', error);
      
      // Fallback: Estimate tokens (1 token ≈ 4 characters)
      return Math.ceil(text.length / 4);
    }
  }
  
  isInitialized(): boolean {
    return this.initialized;
  }
  
  async shutdown(): Promise<void> {
    if (this.childProcess) {
      this.childProcess.kill();
      this.childProcess = null;
      this.initialized = false;
    }
  }
  
  private async standardRequest(
    messages: any[],
    temperature: number,
    maxTokens: number,
    stopSequences: string[]
  ): Promise<LLMResponse> {
    const response = await axios.post(`${this.apiUrl}/chat/completions`, {
      model: path.basename(this.modelPath),
      messages,
      temperature,
      max_tokens: maxTokens,
      stop: stopSequences.length > 0 ? stopSequences : undefined
    });
    
    const result = response.data;
    
    return {
      text: result.choices[0].message.content,
      totalTokens: result.usage.total_tokens,
      promptTokens: result.usage.prompt_tokens,
      completionTokens: result.usage.completion_tokens,
      finishReason: result.choices[0].finish_reason
    };
  }
  
  private async streamingRequest(
    messages: any[],
    temperature: number,
    maxTokens: number,
    stopSequences: string[],
    onPartialResponse: (text: string) => void
  ): Promise<LLMResponse> {
    const response = await axios.post(
      `${this.apiUrl}/chat/completions`,
      {
        model: path.basename(this.modelPath),
        messages,
        temperature,
        max_tokens: maxTokens,
        stop: stopSequences.length > 0 ? stopSequences : undefined,
        stream: true
      },
      { responseType: 'stream' }
    );
    
    return new Promise((resolve, reject) => {
      let fullText = '';
      let totalTokens = 0;
      let promptTokens = 0;
      let completionTokens = 0;
      let finishReason = 'stop';
      
      response.data.on('data', (chunk: Buffer) => {
        const lines = chunk.toString().split('\n').filter(line => line.trim() !== '');
        
        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.substring(6);
            if (data === '[DONE]') continue;
            
            try {
              const parsedData = JSON.parse(data);
              
              if (parsedData.choices && parsedData.choices[0]) {
                const content = parsedData.choices[0].delta?.content || '';
                fullText += content;
                onPartialResponse(fullText);
                
                if (parsedData.usage) {
                  totalTokens = parsedData.usage.total_tokens;
                  promptTokens = parsedData.usage.prompt_tokens;
                  completionTokens = parsedData.usage.completion_tokens;
                } else {
                  completionTokens += content.length > 0 ? 1 : 0;
                }
                
                if (parsedData.choices[0].finish_reason) {
                  finishReason = parsedData.choices[0].finish_reason;
                }
              }
            } catch (error) {
              console.error('Error parsing streaming response:', error);
            }
          }
        }
      });
      
      response.data.on('end', () => {
        resolve({
          text: fullText,
          totalTokens: totalTokens || promptTokens + completionTokens,
          promptTokens: promptTokens,
          completionTokens: completionTokens,
          finishReason: finishReason as any
        });
      });
      
      response.data.on('error', (error: Error) => {
        reject(error);
      });
    });
  }
  
  private async startServer(): Promise<void> {
    const serverScript = path.join(__dirname, '..', 'scripts', 'start_onnx_server.py');
    
    // Check if server script exists
    const scriptExists = await fileExists(serverScript);
    if (!scriptExists) {
      throw new Error(`Server script not found at ${serverScript}`);
    }
    
    // Start the server process
    this.childProcess = spawn('python', [serverScript, '--model', this.modelPath], {
      detached: false, // Keep process attached to parent
      stdio: 'pipe'    // Capture output
    });
    
    // Handle process output
    this.childProcess.stdout.on('data', (data: Buffer) => {
      console.log(`ONNX Server: ${data.toString().trim()}`);
    });
    
    this.childProcess.stderr.on('data', (data: Buffer) => {
      console.error(`ONNX Server Error: ${data.toString().trim()}`);
    });
    
    this.childProcess.on('error', (error: Error) => {
      console.error('Failed to start ONNX server:', error);
      this.childProcess = null;
      throw error;
    });
    
    this.childProcess.on('close', (code: number) => {
      console.log(`ONNX server process exited with code ${code}`);
      this.childProcess = null;
      this.initialized = false;
    });
  }
  
  private async waitForServer(): Promise<void> {
    const maxAttempts = 30;
    const delayMs = 1000;
    
    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      try {
        await axios.get(`${this.apiUrl}/health`);
        console.log('ONNX server is ready');
        return;
      } catch (error) {
        if (attempt === maxAttempts - 1) {
          throw new Error('Timed out waiting for ONNX server to start');
        }
        
        // Wait before next attempt
        await new Promise(resolve => setTimeout(resolve, delayMs));
      }
    }
  }
  
  private convertRole(role: MessageRole): string {
    switch (role) {
      case MessageRole.USER:
        return 'user';
      case MessageRole.ASSISTANT:
        return 'assistant';
      case MessageRole.SYSTEM:
        return 'system';
      default:
        return 'user';
    }
  }
}

/**
 * LLM Provider Factory to create appropriate providers
 */
export class LLMProviderFactory {
  static async create(
    type: 'ollama' | 'onnx' | 'external',
    options: Record<string, any> = {}
  ): Promise<LLMProvider> {
    switch (type) {
      case 'ollama':
        const model = options.model || 'mistral:latest';
        const ollamaProvider = new OllamaProvider(model, options.apiUrl);
        await ollamaProvider.initialize();
        return ollamaProvider;
        
      case 'onnx':
        const modelPath = options.modelPath;
        if (!modelPath) {
          throw new Error('modelPath is required for ONNX provider');
        }
        const onnxProvider = new ONNXProvider(modelPath, options.modelType);
        await onnxProvider.initialize();
        return onnxProvider;
        
      case 'external':
        // This would be implemented separately in an external LLM module
        throw new Error('External LLM provider not implemented in this module');
        
      default:
        throw new Error(`Unknown LLM provider type: ${type}`);
    }
  }
}

/**
 * Script to generate the Python ONNX server script
 * This would be written to the specified location during installation
 */
export async function generateONNXServerScript(outputPath: string): Promise<void> {
  const scriptContent = `
#!/usr/bin/env python
# ONNX Runtime server for local LLM inference
# This script starts a simple server that provides an OpenAI-compatible API for local models

import argparse
import json
import logging
import os
import sys
from typing import List, Dict, Any, Optional, Union

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse, StreamingResponse
from pydantic import BaseModel
import uvicorn

# Set up logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

# Parse arguments
parser = argparse.ArgumentParser(description='Start ONNX Runtime server for LLM inference')
parser.add_argument('--model', type=str, required=True, help='Path to the model directory')
parser.add_argument('--host', type=str, default='localhost', help='Host to bind to')
parser.add_argument('--port', type=int, default=8080, help='Port to bind to')
args = parser.parse_args()

# Check if model exists
if not os.path.exists(args.model):
    logger.error(f"Model not found at {args.model}")
    sys.exit(1)

logger.info(f"Starting server with model: {args.model}")

# Try to load optimum for ONNX runtime
try:
    from optimum.onnxruntime import ORTModelForCausalLM
    from transformers import AutoTokenizer
    
    # Load tokenizer and model
    logger.info("Loading tokenizer and model...")
    tokenizer = AutoTokenizer.from_pretrained(args.model)
    model = ORTModelForCausalLM.from_pretrained(args.model)
    logger.info("Model loaded successfully!")
except ImportError:
    logger.error("Failed to import optimum or transformers. Please install with: pip install optimum[onnxruntime] transformers")
    sys.exit(1)
except Exception as e:
    logger.error(f"Failed to load model: {e}")
    sys.exit(1)

# Create FastAPI app
app = FastAPI(title="ONNX Runtime LLM Server")

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Define API models
class Message(BaseModel):
    role: str
    content: str

class ChatCompletionRequest(BaseModel):
    model: str
    messages: List[Message]
    temperature: Optional[float] = 0.7
    max_tokens: Optional[int] = 1024
    stop: Optional[Union[str, List[str]]] = None
    stream: Optional[bool] = False

class TokenizeRequest(BaseModel):
    input: str

# Endpoints
@app.get("/health")
async def health_check():
    return {"status": "ok"}

@app.post("/v1/tokenize")
async def tokenize(request: TokenizeRequest):
    tokens = tokenizer.encode(request.input)
    return {"tokens": tokens, "count": len(tokens)}

@app.post("/v1/chat/completions")
async def chat_completions(request: ChatCompletionRequest):
    try:
        # Process messages
        prompt = ""
        for msg in request.messages:
            if msg.role == "system":
                prompt += f"<|system|>\\n{msg.content}\\n"
            elif msg.role == "user":
                prompt += f"<|user|>\\n{msg.content}\\n"
            elif msg.role == "assistant":
                prompt += f"<|assistant|>\\n{msg.content}\\n"
        
        # Add assistant prefix for the response
        prompt += "<|assistant|>\\n"
        
        # Tokenize the prompt
        input_ids = tokenizer.encode(prompt, return_tensors="pt")
        prompt_tokens = len(input_ids[0])
        
        # Generate response
        if request.stream:
            return StreamingResponse(
                generate_stream(prompt, request.temperature, request.max_tokens, request.stop),
                media_type="text/event-stream"
            )
        else:
            outputs = model.generate(
                input_ids,
                max_new_tokens=request.max_tokens,
                temperature=request.temperature,
                do_sample=request.temperature > 0,
            )
            
            output_text = tokenizer.decode(outputs[0][input_ids.shape[1]:], skip_special_tokens=True)
            completion_tokens = len(outputs[0]) - prompt_tokens
            
            # Check for stop sequences
            if request.stop:
                stop_sequences = request.stop if isinstance(request.stop, list) else [request.stop]
                for stop_seq in stop_sequences:
                    if stop_seq in output_text:
                        output_text = output_text.split(stop_seq)[0]
            
            return {
                "id": "chatcmpl-" + os.urandom(4).hex(),
                "object": "chat.completion",
                "created": int(time.time()),
                "model": request.model,
                "choices": [
                    {
                        "index": 0,
                        "message": {
                            "role": "assistant",
                            "content": output_text
                        },
                        "finish_reason": "stop"
                    }
                ],
                "usage": {
                    "prompt_tokens": prompt_tokens,
                    "completion_tokens": completion_tokens,
                    "total_tokens": prompt_tokens + completion_tokens
                }
            }
    except Exception as e:
        logger.error(f"Error generating completion: {e}")
        raise HTTPException(status_code=500, detail=str(e))

async def generate_stream(prompt, temperature, max_tokens, stop_sequences):
    try:
        input_ids = tokenizer.encode(prompt, return_tensors="pt")
        prompt_tokens = len(input_ids[0])
        
        # Setup generation parameters
        gen_kwargs = {
            "max_new_tokens": max_tokens,
            "temperature": temperature,
            "do_sample": temperature > 0,
        }
        
        # Stream setup
        generated_ids = []
        completion_tokens = 0
        
        # Start generating token by token
        for generated_id in model.generate_token_by_token(input_ids, **gen_kwargs):
            generated_ids.append(generated_id.item())
            completion_tokens += 1
            
            # Decode the current token
            current_token = tokenizer.decode([generated_id.item()], skip_special_tokens=True)
            
            # Check if we need to stop
            if stop_sequences:
                stop_seqs = stop_sequences if isinstance(stop_sequences, list) else [stop_sequences]
                full_text = tokenizer.decode(generated_ids, skip_special_tokens=True)
                
                should_stop = False
                for stop_seq in stop_seqs:
                    if stop_seq in full_text:
                        should_stop = True
                        break
                
                if should_stop:
                    finish_reason = "stop"
                    break
            
            # Create the delta event
            event_data = {
                "id": "chatcmpl-" + os.urandom(4).hex(),
                "object": "chat.completion.chunk",
                "created": int(time.time()),
                "model": "onnx-model",
                "choices": [
                    {
                        "index": 0,
                        "delta": {
                            "content": current_token
                        },
                        "finish_reason": None
                    }
                ]
            }
            
            # Yield the event
            yield f"data: {json.dumps(event_data)}\\n\\n"
        
        # Send the final event
        final_event = {
            "id": "chatcmpl-" + os.urandom(4).hex(),
            "object": "chat.completion.chunk",
            "created": int(time.time()),
            "model": "onnx-model",
            "choices": [
                {
                    "index": 0,
                    "delta": {},
                    "finish_reason": "stop"
                }
            ],
            "usage": {
                "prompt_tokens": prompt_tokens,
                "completion_tokens": completion_tokens,
                "total_tokens": prompt_tokens + completion_tokens
            }
        }
        
        yield f"data: {json.dumps(final_event)}\\n\\n"
        yield "data: [DONE]\\n\\n"
    
    except Exception as e:
        logger.error(f"Error in stream generation: {e}")
        error_event = {
            "error": {
                "message": str(e),
                "type": "server_error"
            }
        }
        yield f"data: {json.dumps(error_event)}\\n\\n"

if __name__ == "__main__":
    # Start the server
    uvicorn.run(app, host=args.host, port=args.port)
  `;
  
  await fs.writeFile(outputPath, scriptContent, 'utf-8');
  console.log(`ONNX server script written to ${outputPath}`);
}