import { CodeChunk, KnowledgeItem } from '../types';
import * as fs from 'fs/promises';
import * as path from 'path';
import { createHmac } from 'crypto';

// Interfaces for the embedding module
export interface EmbeddingVector {
  vector: number[];
  objectId: string;
  metadata: Record<string, any>;
}

export interface EmbeddingModel {
  name: string;
  dimension: number; 
  initialize(): Promise<void>;
  generateEmbedding(text: string): Promise<number[]>;
}

/**
 * Handles the generation of embeddings for code chunks and knowledge items
 * This is a crucial performance-critical component
 */
export class EmbeddingGenerator {
  private model: EmbeddingModel;
  private embeddingCache: Map<string, number[]> = new Map();
  private cacheDir: string;
  
  constructor(model: EmbeddingModel, cacheDir: string = '.aui-cache/embeddings') {
    this.model = model;
    this.cacheDir = cacheDir;
  }
  
  /**
   * Initialize the embedding generator and load cache
   */
  async initialize(): Promise<void> {
    await this.model.initialize();
    await this.ensureCacheDirectory();
    await this.loadCache();
  }
  
  /**
   * Generate embeddings for a code chunk
   */
  async generateCodeEmbedding(chunk: CodeChunk): Promise<EmbeddingVector> {
    // Generate a unique hash for the chunk content to use for caching
    const contentHash = this.hashContent(chunk.content);
    
    // Check cache first
    if (this.embeddingCache.has(contentHash)) {
      return {
        vector: this.embeddingCache.get(contentHash)!,
        objectId: chunk.id,
        metadata: {
          type: 'code',
          language: chunk.language,
          chunkType: chunk.type,
          filePath: chunk.filePath,
          lineStart: chunk.lineStart,
          lineEnd: chunk.lineEnd,
          ...chunk.metadata
        }
      };
    }
    
    // Generate embedding text representation based on chunk type and metadata
    const embeddingText = this.prepareCodeEmbeddingText(chunk);
    
    // Generate embedding
    const vector = await this.model.generateEmbedding(embeddingText);
    
    // Store in cache
    this.embeddingCache.set(contentHash, vector);
    this.persistEmbedding(contentHash, vector);
    
    return {
      vector,
      objectId: chunk.id,
      metadata: {
        type: 'code',
        language: chunk.language,
        chunkType: chunk.type,
        filePath: chunk.filePath,
        lineStart: chunk.lineStart,
        lineEnd: chunk.lineEnd,
        ...chunk.metadata
      }
    };
  }
  
  /**
   * Generate embeddings for a knowledge item
   */
  async generateKnowledgeEmbedding(item: KnowledgeItem): Promise<EmbeddingVector> {
    const contentHash = this.hashContent(item.content);
    
    // Check cache first
    if (this.embeddingCache.has(contentHash)) {
      return {
        vector: this.embeddingCache.get(contentHash)!,
        objectId: item.id,
        metadata: {
          type: 'knowledge',
          knowledgeType: item.type,
          source: item.source,
          tags: item.tags,
          timestamp: item.timestamp,
          ...item.metadata
        }
      };
    }
    
    // Prepare text for embedding
    const embeddingText = this.prepareKnowledgeEmbeddingText(item);
    
    // Generate embedding
    const vector = await this.model.generateEmbedding(embeddingText);
    
    // Store in cache
    this.embeddingCache.set(contentHash, vector);
    this.persistEmbedding(contentHash, vector);
    
    return {
      vector,
      objectId: item.id,
      metadata: {
        type: 'knowledge',
        knowledgeType: item.type,
        source: item.source,
        tags: item.tags,
        timestamp: item.timestamp,
        ...item.metadata
      }
    };
  }
  
  /**
   * Generate embedding for a search query
   */
  async generateQueryEmbedding(query: string): Promise<number[]> {
    return await this.model.generateEmbedding(query);
  }
  
  /**
   * Prepare text representation for code embedding
   * This is crucial for the quality of the embeddings and search results
   */
  private prepareCodeEmbeddingText(chunk: CodeChunk): string {
    // Create a structured text representation that captures the semantics
    let text = '';
    
    // Add file path context
    text += `File: ${chunk.filePath}\n`;
    
    // Add chunk type and name
    if (chunk.metadata.name) {
      text += `${chunk.type}: ${chunk.metadata.name}\n`;
    }
    
    // Add documentation if available
    if (chunk.metadata.documentation) {
      text += `Documentation: ${chunk.metadata.documentation}\n`;
    }
    
    // Add imports if available
    if (chunk.metadata.imports && chunk.metadata.imports.length > 0) {
      text += `Imports: ${chunk.metadata.imports.join(', ')}\n`;
    }
    
    // Add the actual code
    text += `\nCode:\n${chunk.content}`;
    
    return text;
  }
  
  /**
   * Prepare text representation for knowledge embedding
   */
  private prepareKnowledgeEmbeddingText(item: KnowledgeItem): string {
    let text = '';
    
    // Add knowledge type
    text += `Type: ${item.type}\n`;
    
    // Add source information
    text += `Source: ${item.source.type} - ${item.source.identifier}\n`;
    
    // Add tags
    if (item.tags.length > 0) {
      text += `Tags: ${item.tags.join(', ')}\n`;
    }
    
    // Add content
    text += `\nContent:\n${item.content}`;
    
    return text;
  }
  
  /**
   * Generate a hash for content to use for caching
   */
  private hashContent(content: string): string {
    return createHmac('sha256', 'AUI-embedding-salt')
      .update(content)
      .digest('hex');
  }
  
  /**
   * Ensure the cache directory exists
   */
  private async ensureCacheDirectory(): Promise<void> {
    try {
      await fs.mkdir(this.cacheDir, { recursive: true });
    } catch (error) {
      console.error('Failed to create cache directory:', error);
    }
  }
  
  /**
   * Load embeddings from cache
   */
  private async loadCache(): Promise<void> {
    try {
      const files = await fs.readdir(this.cacheDir);
      
      for (const file of files) {
        if (file.endsWith('.json')) {
          const filePath = path.join(this.cacheDir, file);
          const content = await fs.readFile(filePath, 'utf-8');
          const { hash, vector } = JSON.parse(content);
          
          this.embeddingCache.set(hash, vector);
        }
      }
      
      console.log(`Loaded ${this.embeddingCache.size} embeddings from cache`);
    } catch (error) {
      console.error('Failed to load embeddings cache:', error);
    }
  }
  
  /**
   * Persist an embedding to the cache
   */
  private async persistEmbedding(hash: string, vector: number[]): Promise<void> {
    try {
      const filePath = path.join(this.cacheDir, `${hash}.json`);
      await fs.writeFile(
        filePath,
        JSON.stringify({ hash, vector, timestamp: Date.now() }),
        'utf-8'
      );
    } catch (error) {
      console.error('Failed to persist embedding:', error);
    }
  }
}

/**
 * Implementation of a local embedding model using a pre-trained model
 * For the MVP, we'll use a simple model loaded via ONNX Runtime
 */
export class LocalEmbeddingModel implements EmbeddingModel {
  name: string = 'local-codebert';
  dimension: number = 768; // CodeBERT dimension
  private modelPath: string;
  private initialized: boolean = false;
  private tokenizer: any; // Simplified - would use actual tokenizer in real implementation
  private session: any; // ONNX session
  
  constructor(modelPath: string) {
    this.modelPath = modelPath;
  }
  
  async initialize(): Promise<void> {
    if (this.initialized) return;
    
    try {
      // In a real implementation, we would:
      // 1. Load the ONNX model using onnxruntime-node
      // 2. Initialize the tokenizer
      // This is simplified for the MVP
      console.log(`Initializing embedding model from ${this.modelPath}`);
      
      // Simulate model loading
      this.initialized = true;
      
      console.log('Embedding model initialized successfully');
    } catch (error) {
      console.error('Failed to initialize embedding model:', error);
      throw error;
    }
  }
  
  async generateEmbedding(text: string): Promise<number[]> {
    if (!this.initialized) {
      await this.initialize();
    }
    
    // Simplified implementation for MVP
    // In a real implementation, we would:
    // 1. Tokenize the text
    // 2. Run inference using the ONNX session
    // 3. Extract and process the embeddings
    
    // For MVP, generate a deterministic pseudo-random vector based on text content
    // This would be replaced with actual model inference
    const seed = this.hashString(text);
    const vector = new Array(this.dimension).fill(0);
    
    for (let i = 0; i < this.dimension; i++) {
      // Generate a deterministic value based on the seed and position
      vector[i] = Math.sin(seed * (i + 1)) * 0.5;
    }
    
    // Normalize the vector
    const magnitude = Math.sqrt(vector.reduce((sum, val) => sum + val * val, 0));
    return vector.map(val => val / magnitude);
  }
  
  private hashString(text: string): number {
    let hash = 0;
    for (let i = 0; i < text.length; i++) {
      hash = ((hash << 5) - hash) + text.charCodeAt(i);
      hash |= 0; // Convert to 32bit integer
    }
    return hash;
  }
}