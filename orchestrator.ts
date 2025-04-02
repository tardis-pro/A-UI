import { EventEmitter } from 'events';
import * as path from 'path';
import * as fs from 'fs/promises';
import { Message, MessageRole, Conversation } from '../shared/types/message';
import { PromptManager, PromptContext } from './prompt-manager';
import { VectorDB, VectorFilter, FilterOperator } from './vector-database';
import { CodeChunker } from './code-chunking';
import { EmbeddingGenerator } from './embedding-generator';
import { KnowledgeManager } from './knowledge-capture';
import { CommandHistoryAnalyzer, CommandHistoryEntry } from './command-history-analyzer';
import { LLMProvider, LLMResponse, OllamaProvider } from './local-llm-integration';
import { CICDTracker, CIPipeline, DeploymentEnvironment, QualityMetrics } from './cicd-tracker';
import { TaskManager, Task, TaskStatus } from './task-manager';
import { Tool, ToolRegistry, ToolResult } from './tool-registry';
import { generateUniqueId } from '../utils/helpers';

/**
 * Agent Orchestrator Options
 */
export interface AgentOrchestratorOptions {
  dataDir?: string;
  maxContextTokens?: number;
  localLLMProvider?: LLMProvider;
  externalLLMProvider?: LLMProvider;
  enableExternalLLM?: boolean;
  vectorDB?: VectorDB;
  embeddingGenerator?: EmbeddingGenerator;
  knowledgeManager?: KnowledgeManager;
  commandHistoryAnalyzer?: CommandHistoryAnalyzer;
  cicdTracker?: CICDTracker;
  taskManager?: TaskManager;
  toolRegistry?: ToolRegistry;
  systemPrompt?: string;
}

/**
 * Agent Orchestrator Core
 * 
 * The central coordination module that manages interactions between
 * all other components of the system.
 */
export class AgentOrchestrator extends EventEmitter {
  private dataDir: string;
  private promptManager: PromptManager;
  private localLLMProvider: LLMProvider;
  private externalLLMProvider?: LLMProvider;
  private enableExternalLLM: boolean;
  private vectorDB: VectorDB;
  private codeChunker: CodeChunker;
  private embeddingGenerator: EmbeddingGenerator;
  private knowledgeManager: KnowledgeManager;
  private commandHistoryAnalyzer: CommandHistoryAnalyzer;
  private cicdTracker: CICDTracker;
  private taskManager: TaskManager;
  private toolRegistry: ToolRegistry;
  private activeConversation?: Conversation;
  private isProcessingMessage: boolean = false;
  
  constructor(options: AgentOrchestratorOptions = {}) {
    super();
    
    this.dataDir = options.dataDir || '.aui-data';
    this.enableExternalLLM = options.enableExternalLLM || false;
    
    // Initialize components or use provided instances
    this.localLLMProvider = options.localLLMProvider || new OllamaProvider();
    this.externalLLMProvider = options.externalLLMProvider;
    
    this.promptManager = new PromptManager(
      options.maxContextTokens || this.localLLMProvider.maxContextTokens,
      this.countTokens.bind(this)
    );
    
    if (options.systemPrompt) {
      this.promptManager.setSystemPrompt(options.systemPrompt);
    }
    
    this.vectorDB = options.vectorDB || null;
    this.embeddingGenerator = options.embeddingGenerator || null;
    this.codeChunker = new CodeChunker();
    this.knowledgeManager = options.knowledgeManager || null;
    this.commandHistoryAnalyzer = options.commandHistoryAnalyzer || null;
    this.cicdTracker = options.cicdTracker || null;
    this.taskManager = options.taskManager || new TaskManager();
    this.toolRegistry = options.toolRegistry || new ToolRegistry();
    
    // Register default tool handlers
    this.registerDefaultTools();
  }
  
  /**
   * Initialize the agent orchestrator and all dependent components
   */
  async initialize(): Promise<void> {
    console.log('Initializing Agent Orchestrator...');
    
    // Ensure data directory exists
    await fs.mkdir(this.dataDir, { recursive: true });
    
    // Initialize dependent components if not already provided
    await this.initializeComponents();
    
    // Load active conversation if one exists
    await this.loadActiveConversation();
    
    // Register event listeners
    this.registerEventListeners();
    
    console.log('Agent Orchestrator initialized');
  }
  
  /**
   * Initialize required components
   */
  private async initializeComponents(): Promise<void> {
    // Initialize vector database if not provided
    if (!this.vectorDB) {
      const { VectorDBFactory } = await import('./vector-database');
      this.vectorDB = await VectorDBFactory.create('local', {
        path: path.join(this.dataDir, 'vector-db')
      });
    }
    
    // Initialize embedding generator if not provided
    if (!this.embeddingGenerator) {
      const { LocalEmbeddingModel } = await import('./embedding-generator');
      const embeddingModel = new LocalEmbeddingModel(
        path.join(this.dataDir, 'models', 'embedding-model')
      );
      
      const { EmbeddingGenerator } = await import('./embedding-generator');
      this.embeddingGenerator = new EmbeddingGenerator(
        embeddingModel,
        path.join(this.dataDir, 'embeddings-cache')
      );
      
      await this.embeddingGenerator.initialize();
    }
    
    // Initialize code chunker
    await this.codeChunker.initialize();
    
    // Initialize knowledge manager if not provided
    if (!this.knowledgeManager) {
      const { KnowledgeManager } = await import('./knowledge-capture');
      this.knowledgeManager = new KnowledgeManager(
        this.embeddingGenerator,
        this.vectorDB,
        path.join(this.dataDir, 'knowledge')
      );
      
      await this.knowledgeManager.initialize();
    }
    
    // Initialize command history analyzer if not provided
    if (!this.commandHistoryAnalyzer) {
      const { CommandHistoryAnalyzer } = await import('./command-history-analyzer');
      this.commandHistoryAnalyzer = new CommandHistoryAnalyzer(
        path.join(this.dataDir, 'command-history')
      );
      
      await this.commandHistoryAnalyzer.initialize();
    }
    
    // Initialize CI/CD tracker if not provided
    if (!this.cicdTracker) {
      const { CICDTracker } = await import('./cicd-tracker');
      this.cicdTracker = new CICDTracker({
        dataDir: path.join(this.dataDir, 'cicd'),
        refreshInterval: 60000, // 1 minute
        enableNotifications: true
      });
      
      await this.cicdTracker.initialize();
    }
    
    // Initialize local LLM provider if not already initialized
    if (!this.localLLMProvider.isInitialized()) {
      await this.localLLMProvider.initialize();
    }
    
    // Initialize external LLM provider if available and enabled
    if (this.enableExternalLLM && this.externalLLMProvider && !this.externalLLMProvider.isInitialized()) {
      await this.externalLLMProvider.initialize();
    }
    
    // Initialize task manager
    await this.taskManager.initialize(path.join(this.dataDir, 'tasks'));
  }
  
  /**
   * Register event listeners for dependent components
   */
  private registerEventListeners(): void {
    // CI/CD tracker events
    this.cicdTracker.on('pipeline:statusChanged', (data) => {
      this.emit('notification', {
        type: 'cicd',
        title: 'Pipeline Status Changed',
        message: `Pipeline ${data.pipeline.name} changed from ${data.previousStatus} to ${data.newStatus}`
      });
    });
    
    this.cicdTracker.on('environment:statusChanged', (data) => {
      this.emit('notification', {
        type: 'deployment',
        title: 'Deployment Status Changed',
        message: `Environment ${data.environment.name} changed from ${data.previousStatus} to ${data.newStatus}`
      });
    });
    
    this.cicdTracker.on('qualityGate:failed', (metrics) => {
      this.emit('notification', {
        type: 'quality',
        title: 'Quality Gate Failed',
        message: `Quality gate failed for project ${metrics.projectKey}`
      });
    });
    
    // Task manager events
    this.taskManager.on('task:statusChanged', (task) => {
      this.emit('task:statusChanged', task);
    });
    
    this.taskManager.on('task:completed', (task) => {
      this.emit('task:completed', task);
    });
  }
  
  /**
   * Register default tool handlers
   */
  private registerDefaultTools(): void {
    // Code search tool
    this.toolRegistry.registerTool({
      name: 'code_search',
      description: 'Search for code semantically across the codebase',
      parameters: [
        {
          name: 'query',
          type: 'string',
          description: 'The search query'
        },
        {
          name: 'limit',
          type: 'number',
          description: 'Maximum number of results',
          default: 5
        },
        {
          name: 'language',
          type: 'string',
          description: 'Filter by programming language',
          optional: true
        }
      ],
      handler: this.handleCodeSearchTool.bind(this)
    });
    
    // File read tool
    this.toolRegistry.registerTool({
      name: 'file_read',
      description: 'Read file content',
      parameters: [
        {
          name: 'path',
          type: 'string',
          description: 'Path to the file'
        }
      ],
      handler: this.handleFileReadTool.bind(this)
    });
    
    // File write tool
    this.toolRegistry.registerTool({
      name: 'file_write',
      description: 'Write content to a file',
      parameters: [
        {
          name: 'path',
          type: 'string',
          description: 'Path to the file'
        },
        {
          name: 'content',
          type: 'string',
          description: 'Content to write'
        },
        {
          name: 'createDirectory',
          type: 'boolean',
          description: 'Create parent directories if they don\'t exist',
          default: true
        }
      ],
      handler: this.handleFileWriteTool.bind(this)
    });
    
    // Terminal execute tool
    this.toolRegistry.registerTool({
      name: 'terminal_execute',
      description: 'Execute a command in the terminal',
      parameters: [
        {
          name: 'command',
          type: 'string',
          description: 'Command to execute'
        },
        {
          name: 'directory',
          type: 'string',
          description: 'Working directory',
          default: '.'
        }
      ],
      handler: this.handleTerminalExecuteTool.bind(this)
    });
    
    // Knowledge query tool
    this.toolRegistry.registerTool({
      name: 'knowledge_query',
      description: 'Query the knowledge base',
      parameters: [
        {
          name: 'query',
          type: 'string',
          description: 'The search query'
        },
        {
          name: 'limit',
          type: 'number',
          description: 'Maximum number of results',
          default: 5
        },
        {
          name: 'types',
          type: 'array',
          description: 'Filter by knowledge types',
          optional: true
        }
      ],
      handler: this.handleKnowledgeQueryTool.bind(this)
    });
    
    // CI/CD status tool
    this.toolRegistry.registerTool({
      name: 'cicd_status',
      description: 'Get CI/CD pipeline status',
      parameters: [
        {
          name: 'pipeline',
          type: 'string',
          description: 'Pipeline name or ID (optional)',
          optional: true
        }
      ],
      handler: this.handleCICDStatusTool.bind(this)
    });
  }
  
  /**
   * Start a new conversation
   */
  async startConversation(title: string = 'New Conversation'): Promise<Conversation> {
    this.activeConversation = await this.promptManager.createConversation(title);
    await this.saveActiveConversation();
    return this.activeConversation;
  }
  
  /**
   * Get the active conversation
   */
  getActiveConversation(): Conversation | undefined {
    return this.activeConversation;
  }
  
  /**
   * Process a user message
   */
  async processUserMessage(
    userMessage: string,
    options: {
      stream?: boolean;
      onPartialResponse?: (text: string) => void;
      customContextItems?: PromptContext;
      useExternalLLM?: boolean;
    } = {}
  ): Promise<Message> {
    if (this.isProcessingMessage) {
      throw new Error('Already processing a message');
    }
    
    this.isProcessingMessage = true;
    
    try {
      // Ensure we have an active conversation
      if (!this.activeConversation) {
        await this.startConversation();
      }
      
      // Gather context for the prompt
      const contextItems = await this.gatherContext(userMessage, options.customContextItems);
      
      // Construct the prompt
      const { messages, truncated, totalTokens } = await this.promptManager.constructPrompt(
        this.activeConversation!,
        userMessage,
        contextItems
      );
      
      // Log if the context was truncated
      if (truncated) {
        console.log(`Context was truncated. Total tokens: ${totalTokens}`);
      }
      
      // Add user message to conversation
      const userMessageObj: Message = {
        id: generateUniqueId(),
        content: userMessage,
        role: MessageRole.USER,
        timestamp: new Date()
      };
      
      this.activeConversation!.messages.push(userMessageObj);
      this.activeConversation!.lastActivity = new Date();
      
      // Determine which LLM to use
      const llmProvider = (options.useExternalLLM && this.enableExternalLLM && this.externalLLMProvider) ?
        this.externalLLMProvider : this.localLLMProvider;
      
      // Generate response
      const llmResponse = await llmProvider.generateResponse(
        messages,
        {
          temperature: 0.7,
          maxTokens: 2048,
          stream: options.stream,
          onPartialResponse: options.onPartialResponse
        }
      );
      
      // Parse the response for potential tool calls
      const { responseText, toolCalls } = this.parseResponseForToolCalls(llmResponse.text);
      
      // Create assistant message
      const assistantMessage: Message = {
        id: generateUniqueId(),
        content: responseText,
        role: MessageRole.ASSISTANT,
        timestamp: new Date(),
        tools: toolCalls
      };
      
      // Add to conversation
      this.activeConversation!.messages.push(assistantMessage);
      await this.saveActiveConversation();
      
      // Execute tool calls if any
      if (toolCalls.length > 0) {
        for (const toolCall of toolCalls) {
          // Check if user approval is needed (could be configured per tool)
          const needsApproval = true; // For simplicity, always require approval in MVP
          
          if (needsApproval) {
            // Emit event for UI to handle approval
            this.emit('tool:needsApproval', {
              messageId: assistantMessage.id,
              toolCall
            });
            
            // Wait for approval (handled by external code that will call approveToolCall)
          } else {
            // Execute the tool directly
            await this.executeToolCall(assistantMessage.id, toolCall.id);
          }
        }
      }
      
      return assistantMessage;
    } finally {
      this.isProcessingMessage = false;
    }
  }
  
  /**
   * Approve and execute a tool call
   */
  async approveToolCall(messageId: string, toolCallId: string): Promise<ToolResult> {
    // Find the message
    if (!this.activeConversation) {
      throw new Error('No active conversation');
    }
    
    const message = this.activeConversation.messages.find(m => m.id === messageId);
    if (!message) {
      throw new Error(`Message not found: ${messageId}`);
    }
    
    // Find the tool call
    const toolCall = message.tools?.find(t => t.id === toolCallId);
    if (!toolCall) {
      throw new Error(`Tool call not found: ${toolCallId}`);
    }
    
    // Execute the tool
    return this.executeToolCall(messageId, toolCallId);
  }
  
  /**
   * Execute a tool call
   */
  private async executeToolCall(messageId: string, toolCallId: string): Promise<ToolResult> {
    // Find the message and tool call
    if (!this.activeConversation) {
      throw new Error('No active conversation');
    }
    
    const message = this.activeConversation.messages.find(m => m.id === messageId);
    if (!message || !message.tools) {
      throw new Error(`Message not found or has no tools: ${messageId}`);
    }
    
    const toolCallIndex = message.tools.findIndex(t => t.id === toolCallId);
    if (toolCallIndex === -1) {
      throw new Error(`Tool call not found: ${toolCallId}`);
    }
    
    const toolCall = message.tools[toolCallIndex];
    
    // Get the tool
    const tool = this.toolRegistry.getTool(toolCall.tool);
    if (!tool) {
      throw new Error(`Tool not found: ${toolCall.tool}`);
    }
    
    // Execute the tool
    try {
      this.emit('tool:executing', {
        messageId,
        toolCall
      });
      
      const result = await tool.handler(toolCall.parameters);
      
      // Update the tool call with the result
      message.tools[toolCallIndex].result = result;
      
      // Save conversation
      await this.saveActiveConversation();
      
      // Emit event
      this.emit('tool:executed', {
        messageId,
        toolCall: message.tools[toolCallIndex]
      });
      
      return result;
    } catch (error) {
      // Update the tool call with the error
      message.tools[toolCallIndex].result = {
        success: false,
        error: error.toString()
      };
      
      // Save conversation
      await this.saveActiveConversation();
      
      // Emit event
      this.emit('tool:failed', {
        messageId,
        toolCall: message.tools[toolCallIndex],
        error
      });
      
      throw error;
    }
  }
  
  /**
   * Parse LLM response for tool calls
   */
  private parseResponseForToolCalls(responseText: string): {
    responseText: string;
    toolCalls: Tool[];
  } {
    const toolCalls: Tool[] = [];
    
    // Simple JSON pattern matching for MVP
    // In a real system, this would be more robust
    const toolCallPattern = /```json\s*\n([\s\S]*?)\n```/g;
    
    // Remove tool calls from text and collect them
    const cleanedText = responseText.replace(toolCallPattern, (match, json) => {
      try {
        const toolCall = JSON.parse(json);
        
        // Validate it looks like a tool call
        if (toolCall.tool && typeof toolCall.tool === 'string' && 
            toolCall.parameters && typeof toolCall.parameters === 'object') {
          
          toolCalls.push({
            id: generateUniqueId(),
            tool: toolCall.tool,
            parameters: toolCall.parameters,
            timestamp: new Date()
          });
          
          // Replace with a reference to the tool call
          return `[Tool Call: ${toolCall.tool}]`;
        }
      } catch (e) {
        // Not valid JSON, leave as is
        console.log('Invalid tool call JSON:', e);
      }
      
      // If we couldn't parse it as a tool call, keep the original text
      return match;
    });
    
    return {
      responseText: cleanedText,
      toolCalls
    };
  }
  
  /**
   * Count tokens in a text string
   */
  private async countTokens(text: string): Promise<number> {
    return await this.localLLMProvider.countTokens(text);
  }
  
  /**
   * Gather context for a prompt
   */
  private async gatherContext(
    userMessage: string,
    customContext?: PromptContext
  ): Promise<PromptContext> {
    // Start with any custom context
    const context: PromptContext = customContext || {};
    
    // If we're already providing custom context, don't auto-gather
    if (customContext) {
      return context;
    }
    
    // Search for relevant code
    if (!context.codeChunks) {
      try {
        const codeSearchResults = await this.searchCode(userMessage, 5);
        context.codeChunks = codeSearchResults;
      } catch (error) {
        console.error('Error searching code:', error);
      }
    }
    
    // Search for relevant knowledge
    if (!context.knowledgeItems) {
      try {
        const knowledgeSearchResults = await this.searchKnowledge(userMessage, 3);
        context.knowledgeItems = knowledgeSearchResults;
      } catch (error) {
        console.error('Error searching knowledge:', error);
      }
    }
    
    // Get recent command history
    if (!context.commandHistory) {
      try {
        const commandHistory = this.commandHistoryAnalyzer.getHistoryEntries(5);
        context.commandHistory = commandHistory;
      } catch (error) {
        console.error('Error getting command history:', error);
      }
    }
    
    // Get CI/CD status
    if (!context.ciStatus) {
      try {
        const pipelines = this.cicdTracker.getPipelines();
        
        // Only include non-successful pipelines to reduce noise
        const relevantPipelines = pipelines
          .filter(p => p.status !== 'succeeded' && p.status !== 'unknown')
          .slice(0, 3)
          .map(p => ({
            pipeline: p.name,
            status: p.status,
            lastUpdated: p.lastRun?.endTime || new Date(),
            details: `${p.project} (${p.branch || 'unknown branch'})`
          }));
        
        if (relevantPipelines.length > 0) {
          context.ciStatus = relevantPipelines;
        }
      } catch (error) {
        console.error('Error getting CI/CD status:', error);
      }
    }
    
    // Get active tickets if relevant keywords in message
    if (!context.activeTickets && 
        (userMessage.toLowerCase().includes('ticket') || 
         userMessage.toLowerCase().includes('issue') || 
         userMessage.toLowerCase().includes('task') || 
         userMessage.toLowerCase().includes('bug'))) {
      
      // For MVP, this would integrate with Jira/GitHub issues
      // Placeholder for now
      context.activeTickets = [];
    }
    
    return context;
  }
  
  /**
   * Search for code relevant to a query
   */
  private async searchCode(query: string, limit: number = 5): Promise<any[]> {
    // Generate query embedding
    const queryEmbedding = await this.embeddingGenerator.generateQueryEmbedding(query);
    
    // Search vector DB
    const searchResults = await this.vectorDB.searchVectors(queryEmbedding, {
      limit,
      filters: [
        {
          field: 'type',
          operator: FilterOperator.EQUALS,
          value: 'code'
        }
      ]
    });
    
    // Fetch the actual code chunks
    const codeChunks = await Promise.all(
      searchResults.map(async result => {
        // In a real implementation, we would fetch the code chunk from storage
        // For MVP, assume the metadata contains what we need
        return result.metadata;
      })
    );
    
    return codeChunks;
  }
  
  /**
   * Search for knowledge relevant to a query
   */
  private async searchKnowledge(query: string, limit: number = 3): Promise<any[]> {
    const searchResults = await this.knowledgeManager.searchKnowledge(query, {
      limit
    });
    
    return searchResults.map(result => result.item);
  }
  
  /**
   * Handle code search tool
   */
  private async handleCodeSearchTool(parameters: Record<string, any>): Promise<ToolResult> {
    const { query, limit = 5, language } = parameters;
    
    try {
      // Base search
      const searchResults = await this.searchCode(query, limit);
      
      // Filter by language if specified
      const filteredResults = language ?
        searchResults.filter(chunk => chunk.language === language) :
        searchResults;
      
      return {
        success: true,
        data: filteredResults
      };
    } catch (error) {
      return {
        success: false,
        error: error.toString()
      };
    }
  }
  
  /**
   * Handle file read tool
   */
  private async handleFileReadTool(parameters: Record<string, any>): Promise<ToolResult> {
    const { path: filePath } = parameters;
    
    try {
      const content = await fs.readFile(filePath, 'utf-8');
      
      // If this is a code file, try to add it to the code index
      const fileExt = filePath.split('.').pop()?.toLowerCase();
      const codeFileExtensions = ['js', 'ts', 'py', 'java', 'c', 'cpp', 'go', 'rs', 'php', 'rb', 'cs'];
      
      if (fileExt && codeFileExtensions.includes(fileExt)) {
        try {
          // Parse and index the file
          const chunks = await this.codeChunker.chunkFile(filePath);
          
          // Generate embeddings and store in vector DB
          const embeddings = await Promise.all(
            chunks.map(chunk => this.embeddingGenerator.generateCodeEmbedding(chunk))
          );
          
          await this.vectorDB.addVectors(embeddings);
        } catch (indexError) {
          console.error(`Error indexing file ${filePath}:`, indexError);
          // Continue anyway, as the read was successful
        }
      }
      
      return {
        success: true,
        data: {
          content,
          path: filePath
        }
      };
    } catch (error) {
      return {
        success: false,
        error: error.toString()
      };
    }
  }
  
  /**
   * Handle file write tool
   */
  private async handleFileWriteTool(parameters: Record<string, any>): Promise<ToolResult> {
    const { path: filePath, content, createDirectory = true } = parameters;
    
    try {
      // Create directory if needed
      if (createDirectory) {
        const dirPath = path.dirname(filePath);
        await fs.mkdir(dirPath, { recursive: true });
      }
      
      await fs.writeFile(filePath, content, 'utf-8');
      
      // If this is a code file, try to add it to the code index
      const fileExt = filePath.split('.').pop()?.toLowerCase();
      const codeFileExtensions = ['js', 'ts', 'py', 'java', 'c', 'cpp', 'go', 'rs', 'php', 'rb', 'cs'];
      
      if (fileExt && codeFileExtensions.includes(fileExt)) {
        try {
          // Parse and index the file
          const chunks = await this.codeChunker.chunkFile(filePath);
          
          // Generate embeddings and store in vector DB
          const embeddings = await Promise.all(
            chunks.map(chunk => this.embeddingGenerator.generateCodeEmbedding(chunk))
          );
          
          await this.vectorDB.addVectors(embeddings);
        } catch (indexError) {
          console.error(`Error indexing file ${filePath}:`, indexError);
          // Continue anyway, as the write was successful
        }
      }
      
      return {
        success: true,
        data: {
          path: filePath
        }
      };
    } catch (error) {
      return {
        success: false,
        error: error.toString()
      };
    }
  }
  
  /**
   * Handle terminal execute tool
   */
  private async handleTerminalExecuteTool(parameters: Record<string, any>): Promise<ToolResult> {
    const { command, directory = '.' } = parameters;
    
    try {
      // This is a placeholder for actual terminal execution
      // In a real implementation, this would use Node's child_process or similar
      
      // For MVP, simulate a response
      const output = `Executed command: ${command} in directory: ${directory}\n\nSimulated output...`;
      
      // Record the command in history
      await this.commandHistoryAnalyzer.recordCommand(
        command,
        directory,
        0, // Exit code
        output
      );
      
      return {
        success: true,
        data: {
          command,
          directory,
          output,
          exitCode: 0
        }
      };
    } catch (error) {
      return {
        success: false,
        error: error.toString()
      };
    }
  }
  
  /**
   * Handle knowledge query tool
   */
  private async handleKnowledgeQueryTool(parameters: Record<string, any>): Promise<ToolResult> {
    const { query, limit = 5, types } = parameters;
    
    try {
      const searchOptions: any = {
        limit
      };
      
      if (types && Array.isArray(types)) {
        searchOptions.types = types;
      }
      
      const searchResults = await this.knowledgeManager.searchKnowledge(query, searchOptions);
      
      return {
        success: true,
        data: searchResults.map(result => ({
          item: result.item,
          score: result.score
        }))
      };
    } catch (error) {
      return {
        success: false,
        error: error.toString()
      };
    }
  }
  
  /**
   * Handle CI/CD status tool
   */
  private async handleCICDStatusTool(parameters: Record<string, any>): Promise<ToolResult> {
    const { pipeline } = parameters;
    
    try {
      if (pipeline) {
        // Get specific pipeline
        const pipelineObj = this.cicdTracker.getPipeline(pipeline) || 
          this.cicdTracker.getPipelines().find(p => p.name === pipeline);
        
        if (!pipelineObj) {
          return {
            success: false,
            error: `Pipeline not found: ${pipeline}`
          };
        }
        
        return {
          success: true,
          data: {
            pipeline: pipelineObj
          }
        };
      } else {
        // Get all pipelines
        const pipelines = this.cicdTracker.getPipelines();
        
        // Get environments
        const environments = this.cicdTracker.getEnvironments();
        
        // Get quality metrics
        const qualityMetrics = this.cicdTracker.getQualityMetrics();
        
        return {
          success: true,
          data: {
            pipelines,
            environments,
            qualityMetrics
          }
        };
      }
    } catch (error) {
      return {
        success: false,
        error: error.toString()
      };
    }
  }
  
  /**
   * Load active conversation from storage
   */
  private async loadActiveConversation(): Promise<void> {
    try {
      const conversationPath = path.join(this.dataDir, 'active-conversation.json');
      
      // Check if file exists
      try {
        await fs.access(conversationPath);
      } catch {
        // No active conversation file yet
        return;
      }
      
      const data = await fs.readFile(conversationPath, 'utf-8');
      const conversation = JSON.parse(data);
      
      // Convert date strings to Date objects
      conversation.startTime = new Date(conversation.startTime);
      conversation.lastActivity = new Date(conversation.lastActivity);
      
      for (const message of conversation.messages) {
        message.timestamp = new Date(message.timestamp);
        
        if (message.tools) {
          for (const tool of message.tools) {
            tool.timestamp = new Date(tool.timestamp);
          }
        }
      }
      
      this.activeConversation = conversation;
    } catch (error) {
      console.error('Failed to load active conversation:', error);
    }
  }
  
  /**
   * Save active conversation to storage
   */
  private async saveActiveConversation(): Promise<void> {
    if (!this.activeConversation) return;
    
    try {
      const conversationPath = path.join(this.dataDir, 'active-conversation.json');
      await fs.writeFile(conversationPath, JSON.stringify(this.activeConversation), 'utf-8');
    } catch (error) {
      console.error('Failed to save active conversation:', error);
    }
  }
  
  /**
   * Create a new task
   */
  async createTask(
    title: string,
    description: string,
    type: string,
    priority: number = 1
  ): Promise<Task> {
    return this.taskManager.createTask(title, description, type, priority);
  }
  
  /**
   * Get all tasks
   */
  getTasks(): Task[] {
    return this.taskManager.getTasks();
  }
  
  /**
   * Get a specific task
   */
  getTask(id: string): Task | undefined {
    return this.taskManager.getTask(id);
  }
  
  /**
   * Update a task
   */
  async updateTask(id: string, updates: Partial<Task>): Promise<Task | null> {
    return this.taskManager.updateTask(id, updates);
  }
  
  /**
   * Complete a task
   */
  async completeTask(id: string, outcome: string = ''): Promise<Task | null> {
    return this.taskManager.updateTask(id, {
      status: TaskStatus.COMPLETED,
      completedAt: new Date(),
      outcome
    });
  }
  
  /**
   * Cancel a task
   */
  async cancelTask(id: string, reason: string = ''): Promise<Task | null> {
    return this.taskManager.updateTask(id, {
      status: TaskStatus.CANCELED,
      outcome: reason
    });
  }
  
  /**
   * Register a custom tool
   */
  registerTool(tool: Tool): void {
    this.toolRegistry.registerTool(tool);
  }
  
  /**
   * Clean up resources
   */
  async dispose(): Promise<void> {
    // Stop CI/CD tracker
    this.cicdTracker.stopRefreshTimer();
    
    // Save conversation
    await this.saveActiveConversation();
    
    // Remove event listeners
    this.removeAllListeners();
  }
}