// src/shared/types/code.ts
export interface CodeChunk {
  id: string;               // Unique identifier
  content: string;          // Code content
  type: CodeChunkType;      // Type of chunk
  filePath: string;         // Path to source file
  lineStart: number;        // Starting line number
  lineEnd: number;          // Ending line number
  language: string;         // Programming language
  metadata: CodeMetadata;   // Additional metadata
}

export enum CodeChunkType {
  FILE = 'file',
  CLASS = 'class',
  FUNCTION = 'function',
  METHOD = 'method',
  BLOCK = 'block',
  STATEMENT = 'statement'
}

export interface CodeMetadata {
  name?: string;            // Name (e.g., function name, class name)
  documentation?: string;   // Associated documentation
  imports?: string[];       // Import statements
  complexity?: number;      // Cyclomatic complexity
  lastModified?: Date;      // Last modification timestamp
  author?: string;          // Author from git blame
  relations?: CodeRelation[]; // Related code chunks
}

export interface CodeRelation {
  targetId: string;         // ID of related chunk
  relationType: RelationType; // Type of relationship
  confidence: number;       // Confidence score
}

export enum RelationType {
  CALLS = 'calls',
  IMPORTS = 'imports',
  INHERITS = 'inherits',
  IMPLEMENTS = 'implements',
  REFERENCES = 'references'
}

// src/shared/types/knowledge.ts
export interface KnowledgeItem {
  id: string;                 // Unique identifier
  content: string;            // Knowledge content
  type: KnowledgeType;        // Type of knowledge
  source: KnowledgeSource;    // Source of knowledge
  tags: string[];             // Categorization tags
  timestamp: Date;            // Creation/update timestamp
  relatedCodeIds: string[];   // Related code chunks
  confidence: number;         // Confidence score (0-1)
  metadata: Record<string, any>; // Additional metadata
}

export enum KnowledgeType {
  EXPLICIT = 'explicit',      // Documentation, specs
  TACIT = 'tacit',            // Insights, Q&A
  PROCEDURAL = 'procedural',  // Steps, workflows
  CONTEXTUAL = 'contextual'   // Project-specific conventions
}

export interface KnowledgeSource {
  type: SourceType;           // Type of source
  identifier: string;         // Source-specific identifier
  url?: string;               // URL if applicable
  author?: string;            // Author if known
}

export enum SourceType {
  JIRA = 'jira',
  GITHUB = 'github',
  DOCUMENT = 'document',
  CONVERSATION = 'conversation',
  MANUAL = 'manual'
}

// src/shared/types/message.ts
export interface Message {
  id: string;                 // Unique identifier
  content: string;            // Message content
  role: MessageRole;          // User or assistant
  timestamp: Date;            // Creation timestamp
  tools?: ToolCall[];         // Tool calls within message
  codeReferences?: string[];  // Referenced code chunks
  knowledgeReferences?: string[]; // Referenced knowledge items
}

export enum MessageRole {
  USER = 'user',
  ASSISTANT = 'assistant',
  SYSTEM = 'system'
}

export interface Conversation {
  id: string;                 // Unique identifier
  title: string;              // Conversation title
  messages: Message[];        // Messages in conversation
  startTime: Date;            // Start timestamp
  lastActivity: Date;         // Last activity timestamp
  context: ConversationContext; // Conversation context
}

export interface ConversationContext {
  focusedCodeIds: string[];     // Currently focused code chunks
  focusedKnowledgeIds: string[]; // Currently focused knowledge items
  activeIntegrations: IntegrationType[]; // Active integration types
  taskType?: TaskType;          // Current task type if applicable
}

export enum IntegrationType {
  GITHUB = 'github',
  JIRA = 'jira',
  SONAR = 'sonar',
  CI = 'ci',
  TERMINAL = 'terminal'
}

export enum TaskType {
  BUG_FIX = 'bug_fix',
  FEATURE = 'feature',
  REFACTOR = 'refactor',
  DOCUMENTATION = 'documentation',
  DEPLOYMENT = 'deployment'
}

// src/shared/types/tool.ts
export interface ToolCall {
  id: string;                 // Unique identifier
  tool: ToolType;             // Type of tool
  parameters: Record<string, any>; // Tool parameters
  result?: ToolResult;        // Tool execution result
  timestamp: Date;            // Execution timestamp
}

export enum ToolType {
  CODE_SEARCH = 'code_search',
  FILE_READ = 'file_read',
  FILE_WRITE = 'file_write',
  TERMINAL_EXEC = 'terminal_exec',
  GIT_OPERATION = 'git_operation',
  JIRA_UPDATE = 'jira_update',
  KNOWLEDGE_QUERY = 'knowledge_query',
  CI_MONITOR = 'ci_monitor'
}

export interface ToolResult {
  success: boolean;           // Execution success
  data?: any;                 // Result data
  error?: string;             // Error message if failed
  duration: number;           // Execution duration in ms
}

// src/shared/types/vector.ts
export interface VectorQuery {
  text: string;               // Query text or code
  filters?: VectorFilter[];   // Optional filters
  limit?: number;             // Max results
  minScore?: number;          // Minimum similarity score
}

export interface VectorFilter {
  field: string;              // Field to filter on
  operator: FilterOperator;   // Filter operator
  value: any;                 // Filter value
}

export enum FilterOperator {
  EQUALS = 'equals',
  NOT_EQUALS = 'not_equals',
  CONTAINS = 'contains',
  GREATER_THAN = 'greater_than',
  LESS_THAN = 'less_than'
}

export interface VectorSearchResult {
  item: CodeChunk | KnowledgeItem; // Matched item
  score: number;              // Similarity score
  type: 'code' | 'knowledge'; // Type of result
}