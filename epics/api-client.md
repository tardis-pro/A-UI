# API Client Architecture

## Overview
This document outlines the design of the TypeScript API client that bridges the frontend components with the FastAPI backend. The client provides a type-safe interface to all backend services and handles authentication, request/response processing, and real-time communication.

## Core Design Principles

1. **Type Safety**: Leverage TypeScript's type system for compile-time validation
2. **Modularity**: Separate clients for different service domains
3. **Consistency**: Uniform error handling and response processing
4. **Efficiency**: Support for request batching and response streaming
5. **Resilience**: Built-in retry mechanisms and fallback strategies

## Client Structure

```typescript
// Core API client
export interface APIClientConfig {
  baseUrl: string;
  timeout?: number;
  retryCount?: number;
  retryDelay?: number;
  authToken?: string;
}

export class APIClient {
  private config: APIClientConfig;
  private httpClient: AxiosInstance;
  private webSocketClient: WebSocketManager;
  
  constructor(config: APIClientConfig) {
    this.config = config;
    this.httpClient = axios.create({
      baseURL: config.baseUrl,
      timeout: config.timeout || 30000,
      headers: {
        'Content-Type': 'application/json',
        ...(config.authToken ? { 'Authorization': `Bearer ${config.authToken}` } : {})
      }
    });
    this.webSocketClient = new WebSocketManager(config.baseUrl);
    
    // Set up interceptors for request/response
    this.setupInterceptors();
  }
  
  // Domain-specific clients
  get ai(): AIClient {
    return new AIClient(this.httpClient, this.webSocketClient);
  }
  
  get knowledge(): KnowledgeClient {
    return new KnowledgeClient(this.httpClient);
  }
  
  get code(): CodeClient {
    return new CodeClient(this.httpClient);
  }
  
  // Authentication methods
  async login(username: string, password: string): Promise<AuthResponse> {
    // Implementation
  }
  
  setAuthToken(token: string): void {
    this.config.authToken = token;
    this.httpClient.defaults.headers.common['Authorization'] = `Bearer ${token}`;
  }
  
  // WebSocket connection management
  connectWebSocket(): Promise<void> {
    return this.webSocketClient.connect();
  }
  
  private setupInterceptors(): void {
    // Request/response interceptors
  }
}
```

## Domain-Specific Clients

### AI Client

```typescript
export interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface ChatCompletionOptions {
  model: string;
  temperature?: number;
  maxTokens?: number;
  stream?: boolean;
  stopSequences?: string[];
}

export interface ChatCompletionResponse {
  id: string;
  choices: Array<{
    message: ChatMessage;
    finishReason: string;
  }>;
  usage: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
}

export class AIClient {
  constructor(
    private httpClient: AxiosInstance,
    private webSocketClient: WebSocketManager
  ) {}
  
  async listModels(): Promise<ModelInfo[]> {
    const response = await this.httpClient.get('/api/ai/models');
    return response.data.models;
  }
  
  async createChatCompletion(
    messages: ChatMessage[],
    options: ChatCompletionOptions,
    onPartialResponse?: (text: string) => void
  ): Promise<ChatCompletionResponse> {
    if (options.stream && onPartialResponse) {
      return this.streamChatCompletion(messages, options, onPartialResponse);
    } else {
      const response = await this.httpClient.post('/api/ai/chat', {
        messages,
        ...options
      });
      return response.data;
    }
  }
  
  private async streamChatCompletion(
    messages: ChatMessage[],
    options: ChatCompletionOptions,
    onPartialResponse: (text: string) => void
  ): Promise<ChatCompletionResponse> {
    // Implementation using WebSockets
  }
  
  async countTokens(text: string): Promise<number> {
    const response = await this.httpClient.post('/api/ai/tokens', { text });
    return response.data.count;
  }
}
```

### Knowledge Client

```typescript
export interface KnowledgeItem {
  id: string;
  content: string;
  type: KnowledgeType;
  source: KnowledgeSource;
  tags: string[];
  timestamp: string;
  relatedCodeIds: string[];
  confidence: number;
  metadata: Record<string, any>;
}

export interface KnowledgeSearchOptions {
  limit?: number;
  threshold?: number;
  types?: KnowledgeType[];
  tags?: string[];
  sourceTypes?: SourceType[];
}

export class KnowledgeClient {
  constructor(private httpClient: AxiosInstance) {}
  
  async getKnowledgeItem(id: string): Promise<KnowledgeItem> {
    const response = await this.httpClient.get(`/api/knowledge/items/${id}`);
    return response.data;
  }
  
  async addKnowledgeItem(item: Omit<KnowledgeItem, 'id'>): Promise<KnowledgeItem> {
    const response = await this.httpClient.post('/api/knowledge/items', item);
    return response.data;
  }
  
  async updateKnowledgeItem(id: string, updates: Partial<KnowledgeItem>): Promise<KnowledgeItem> {
    const response = await this.httpClient.patch(`/api/knowledge/items/${id}`, updates);
    return response.data;
  }
  
  async deleteKnowledgeItem(id: string): Promise<boolean> {
    const response = await this.httpClient.delete(`/api/knowledge/items/${id}`);
    return response.data.success;
  }
  
  async searchKnowledge(query: string, options: KnowledgeSearchOptions = {}): Promise<Array<{
    item: KnowledgeItem;
    score: number;
  }>> {
    const response = await this.httpClient.post('/api/knowledge/search', {
      query,
      options
    });
    return response.data.results;
  }
}
```

### Code Client

```typescript
export interface CodeChunk {
  id: string;
  content: string;
  type: CodeChunkType;
  filePath: string;
  lineStart: number;
  lineEnd: number;
  language: string;
  metadata: Record<string, any>;
}

export class CodeClient {
  constructor(private httpClient: AxiosInstance) {}
  
  async chunkFile(filePath: string): Promise<CodeChunk[]> {
    const response = await this.httpClient.post('/api/code/chunk', {
      filePath
    });
    return response.data.chunks;
  }
  
  async searchCode(query: string, options: CodeSearchOptions = {}): Promise<Array<{
    chunk: CodeChunk;
    score: number;
  }>> {
    const response = await this.httpClient.post('/api/code/search', {
      query,
      options
    });
    return response.data.results;
  }
  
  async indexCodebase(rootDir: string): Promise<string> {
    const response = await this.httpClient.post('/api/code/index', {
      rootDir
    });
    return response.data.jobId;
  }
  
  async getIndexingStatus(jobId: string): Promise<{
    status: 'pending' | 'processing' | 'completed' | 'failed';
    progress: number;
    filesProcessed: number;
    totalFiles: number;
  }> {
    const response = await this.httpClient.get(`/api/code/index/${jobId}/status`);
    return response.data;
  }
}
```

## WebSocket Manager

```typescript
export class WebSocketManager {
  private wsBaseUrl: string;
  private socket: WebSocket | null = null;
  private messageHandlers: Map<string, (data: any) => void> = new Map();
  
  constructor(baseUrl: string) {
    // Convert HTTP URL to WebSocket URL
    this.wsBaseUrl = baseUrl.replace(/^http/, 'ws');
  }
  
  async connect(): Promise<void> {
    return new Promise((resolve, reject) => {
      this.socket = new WebSocket(`${this.wsBaseUrl}/ws`);
      
      this.socket.onopen = () => {
        resolve();
      };
      
      this.socket.onerror = (error) => {
        reject(error);
      };
      
      this.socket.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data);
          
          if (message.type && this.messageHandlers.has(message.type)) {
            this.messageHandlers.get(message.type)!(message.data);
          }
        } catch (error) {
          console.error('Error parsing WebSocket message', error);
        }
      };
    });
  }
  
  addEventListener(type: string, handler: (data: any) => void): void {
    this.messageHandlers.set(type, handler);
  }
  
  removeEventListener(type: string): void {
    this.messageHandlers.delete(type);
  }
  
  sendMessage(type: string, data: any): void {
    if (!this.socket || this.socket.readyState !== WebSocket.OPEN) {
      throw new Error('WebSocket is not connected');
    }
    
    this.socket.send(JSON.stringify({
      type,
      data
    }));
  }
  
  disconnect(): void {
    if (this.socket) {
      this.socket.close();
      this.socket = null;
    }
  }
}
```

## React Hooks

```typescript
// Example React hook for AI chat
export function useAIChat() {
  const apiClient = useContext(APIClientContext);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  
  const sendMessage = async (content: string, options: Partial<ChatCompletionOptions> = {}) => {
    setIsLoading(true);
    setError(null);
    
    try {
      // Add user message
      const userMessage: ChatMessage = {
        role: 'user',
        content
      };
      
      const newMessages = [...messages, userMessage];
      setMessages(newMessages);
      
      // Get response from AI
      let assistantContent = '';
      
      await apiClient.ai.createChatCompletion(
        newMessages,
        {
          model: options.model || 'mistral',
          temperature: options.temperature || 0.7,
          stream: true,
          ...options
        },
        (partialText) => {
          assistantContent = partialText;
          
          // Update assistant message in real-time
          setMessages([
            ...newMessages,
            {
              role: 'assistant',
              content: assistantContent
            }
          ]);
        }
      );
      
      // Final message update after streaming completes
      setMessages([
        ...newMessages,
        {
          role: 'assistant',
          content: assistantContent
        }
      ]);
    } catch (err) {
      setError(err as Error);
    } finally {
      setIsLoading(false);
    }
  };
  
  return {
    messages,
    sendMessage,
    isLoading,
    error,
    clearMessages: () => setMessages([])
  };
}
```

## Integration with Existing Components

### Integrating with ai.ts

The `ai.ts` component will be updated to use the API client when running in the context of the full application:

```typescript
export class OllamaProvider implements LLMProvider {
  // ... existing implementation ...
  
  async generateResponse(
    messages: Message[],
    options: LLMRequestOptions = {}
  ): Promise<LLMResponse> {
    // Check if we should use API client
    if (useAPIClient()) {
      return this.generateResponseViaAPI(messages, options);
    }
    
    // ... existing local implementation ...
  }
  
  private async generateResponseViaAPI(
    messages: Message[],
    options: LLMRequestOptions
  ): Promise<LLMResponse> {
    const apiClient = getAPIClient();
    
    // Convert to API format
    const apiMessages = messages.map(msg => ({
      role: this.convertRole(msg.role),
      content: msg.content
    }));
    
    // Handle streaming
    if (options.stream && options.onPartialResponse) {
      const response = await apiClient.ai.createChatCompletion(
        apiMessages,
        {
          model: this.model,
          temperature: options.temperature,
          maxTokens: options.maxTokens,
          stopSequences: options.stopSequences,
          stream: true
        },
        options.onPartialResponse
      );
      
      return {
        text: response.choices[0].message.content,
        totalTokens: response.usage.totalTokens,
        promptTokens: response.usage.promptTokens,
        completionTokens: response.usage.completionTokens,
        finishReason: response.choices[0].finishReason as any
      };
    }
    
    // ... implementation for non-streaming ...
  }
}
```

### Integrating with kt.ts

The `KnowledgeManager` class will be updated similarly:

```typescript
export class KnowledgeManager {
  // ... existing implementation ...
  
  async searchKnowledge(query: string, options: KnowledgeSearchOptions = {}): Promise<KnowledgeSearchResult[]> {
    // Check if we should use API client
    if (useAPIClient()) {
      return this.searchKnowledgeViaAPI(query, options);
    }
    
    // ... existing local implementation ...
  }
  
  private async searchKnowledgeViaAPI(query: string, options: KnowledgeSearchOptions): Promise<KnowledgeSearchResult[]> {
    const apiClient = getAPIClient();
    
    const results = await apiClient.knowledge.searchKnowledge(query, options);
    
    return results;
  }
}
```

## API Client Instance Management

The API client will be initialized at application startup and made available through a React context:

```typescript
// Create context
export const APIClientContext = React.createContext<APIClient | null>(null);

// Provider component
export const APIClientProvider: React.FC<{
  children: React.ReactNode;
  config: APIClientConfig;
}> = ({ children, config }) => {
  const [apiClient] = useState(() => new APIClient(config));
  
  return (
    <APIClientContext.Provider value={apiClient}>
      {children}
    </APIClientContext.Provider>
  );
};

// Hook for accessing client
export function useAPIClient() {
  const apiClient = useContext(APIClientContext);
  
  if (!apiClient) {
    throw new Error('useAPIClient must be used within an APIClientProvider');
  }
  
  return apiClient;
}
```

## Error Handling Strategy

The API client implements a standardized error handling strategy:

1. **Network-level errors**: Handled by interceptors with automatic retry
2. **API-level errors**: Transformed into typed error objects with appropriate status codes
3. **WebSocket errors**: Connection retry with exponential backoff
4. **React component level**: Error boundaries catch rendering errors 