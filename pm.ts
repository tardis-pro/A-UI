import { Message, MessageRole, Conversation } from '../shared/types/message';
import { CodeChunk } from '../shared/types/code';
import { KnowledgeItem } from '../shared/types/knowledge';
import { CommandHistoryEntry } from './command-history-analyzer';
import { generateUniqueId } from '../utils/helpers';

/**
 * PromptManager handles the construction of prompts for LLMs
 * with appropriate context and manages token limits
 */
export class PromptManager {
  private maxContextTokens: number;
  private systemPrompt: string;
  private tokenCounter: (text: string) => Promise<number>;
  
  constructor(
    maxContextTokens: number = 8192,
    tokenCounter: (text: string) => Promise<number>
  ) {
    this.maxContextTokens = maxContextTokens;
    this.tokenCounter = tokenCounter;
    this.systemPrompt = this.getDefaultSystemPrompt();
  }
  
  /**
   * Set the system prompt
   */
  setSystemPrompt(prompt: string): void {
    this.systemPrompt = prompt;
  }
  
  /**
   * Set the maximum context tokens
   */
  setMaxContextTokens(tokens: number): void {
    this.maxContextTokens = tokens;
  }
  
  /**
   * Create a new conversation
   */
  async createConversation(title: string = 'New Conversation'): Promise<Conversation> {
    const systemMessage: Message = {
      id: generateUniqueId(),
      content: this.systemPrompt,
      role: MessageRole.SYSTEM,
      timestamp: new Date()
    };
    
    return {
      id: generateUniqueId(),
      title,
      messages: [systemMessage],
      startTime: new Date(),
      lastActivity: new Date(),
      context: {
        focusedCodeIds: [],
        focusedKnowledgeIds: [],
        activeIntegrations: []
      }
    };
  }
  
  /**
   * Construct a prompt for generating a response
   */
  async constructPrompt(
    conversation: Conversation,
    userQuery: string,
    contextItems: PromptContext
  ): Promise<{
    messages: Message[];
    truncated: boolean;
    totalTokens: number;
  }> {
    // Start with system prompt and previous messages
    const messages = [...conversation.messages];
    
    // Add context items
    const contextMessage = await this.createContextMessage(contextItems);
    
    // Add user query
    const userMessage: Message = {
      id: generateUniqueId(),
      content: userQuery,
      role: MessageRole.USER,
      timestamp: new Date()
    };
    
    // Combine all messages
    const allMessages = [...messages];
    
    // If we have context, add it before the user query
    if (contextMessage) {
      allMessages.push(contextMessage);
    }
    
    allMessages.push(userMessage);
    
    // Check token count and truncate if necessary
    const { messages: truncatedMessages, truncated, totalTokens } = 
      await this.truncateMessages(allMessages);
    
    return {
      messages: truncatedMessages,
      truncated,
      totalTokens
    };
  }
  
  /**
   * Truncate messages to fit within token limits
   */
  private async truncateMessages(
    messages: Message[]
  ): Promise<{
    messages: Message[];
    truncated: boolean;
    totalTokens: number;
  }> {
    // Reserve tokens for response
    const reservedTokens = Math.min(2048, Math.floor(this.maxContextTokens * 0.25));
    const maxInputTokens = this.maxContextTokens - reservedTokens;
    
    // Calculate token count for all messages
    const tokenCounts: number[] = await Promise.all(
      messages.map(msg => this.tokenCounter(msg.content))
    );
    
    const totalTokens = tokenCounts.reduce((sum, count) => sum + count, 0);
    
    // If we're within limits, return all messages
    if (totalTokens <= maxInputTokens) {
      return {
        messages,
        truncated: false,
        totalTokens
      };
    }
    
    // We need to truncate
    const truncatedMessages: Message[] = [];
    let currentTokens = 0;
    let truncated = false;
    
    // Always keep system message
    const systemMessage = messages.find(msg => msg.role === MessageRole.SYSTEM);
    if (systemMessage) {
      truncatedMessages.push(systemMessage);
      currentTokens += tokenCounts[messages.indexOf(systemMessage)];
    }
    
    // Always include the most recent user message
    const lastUserMessage = [...messages].reverse().find(msg => msg.role === MessageRole.USER);
    const lastUserMessageTokens = lastUserMessage ? 
      tokenCounts[messages.indexOf(lastUserMessage)] : 0;
    
    // Reserve space for the last user message
    const remainingTokens = maxInputTokens - currentTokens - lastUserMessageTokens;
    
    // Add as many messages as possible, starting from the most recent
    // Skip the system message and the last user message (already handled)
    const messagesToConsider = messages.filter(msg => 
      msg !== systemMessage && msg !== lastUserMessage
    );
    
    let tokensUsed = 0;
    
    for (let i = messagesToConsider.length - 1; i >= 0; i--) {
      const msg = messagesToConsider[i];
      const msgTokens = tokenCounts[messages.indexOf(msg)];
      
      if (tokensUsed + msgTokens <= remainingTokens) {
        truncatedMessages.push(msg);
        tokensUsed += msgTokens;
      } else {
        // We can't add this message in full
        truncated = true;
        
        // If it's a context message, we might be able to truncate it
        if (msg.role === MessageRole.SYSTEM && msg.content.includes('CONTEXT:')) {
          const truncatedContent = await this.truncateContextMessage(
            msg.content, 
            remainingTokens - tokensUsed
          );
          
          if (truncatedContent) {
            const truncatedMsg = {
              ...msg,
              content: truncatedContent
            };
            
            truncatedMessages.push(truncatedMsg);
            tokensUsed += await this.tokenCounter(truncatedContent);
          }
        }
        
        // For other message types, we skip entirely
        break;
      }
    }
    
    // Add the last user message
    if (lastUserMessage) {
      truncatedMessages.push(lastUserMessage);
    }
    
    // Sort messages back into chronological order
    truncatedMessages.sort((a, b) => {
      // System message always comes first
      if (a.role === MessageRole.SYSTEM && a === systemMessage) return -1;
      if (b.role === MessageRole.SYSTEM && b === systemMessage) return 1;
      
      // Sort by timestamp
      return a.timestamp.getTime() - b.timestamp.getTime();
    });
    
    return {
      messages: truncatedMessages,
      truncated,
      totalTokens: await this.calculateTotalTokens(truncatedMessages)
    };
  }
  
  /**
   * Create a context message from various context items
   */
  private async createContextMessage(
    context: PromptContext
  ): Promise<Message | null> {
    if (
      !context.codeChunks?.length &&
      !context.knowledgeItems?.length &&
      !context.commandHistory?.length &&
      !context.ciStatus?.length &&
      !context.activeTickets?.length
    ) {
      // No context items to add
      return null;
    }
    
    let contextContent = 'CONTEXT:\n\n';
    
    // Add code chunks
    if (context.codeChunks && context.codeChunks.length > 0) {
      contextContent += '## CODE CHUNKS\n\n';
      
      for (const chunk of context.codeChunks) {
        contextContent += `### ${chunk.filePath}`;
        
        if (chunk.metadata?.name) {
          contextContent += ` - ${chunk.metadata.name}`;
        }
        
        contextContent += '\n';
        
        // For functions/methods, add the signature only
        if (chunk.type === 'function' || chunk.type === 'method') {
          const lines = chunk.content.split('\n');
          const signatureLines = lines.slice(0, Math.min(5, lines.length));
          
          contextContent += '```' + chunk.language + '\n';
          contextContent += signatureLines.join('\n');
          
          if (lines.length > 5) {
            contextContent += '\n// ... rest of function ...\n';
          }
          
          contextContent += '\n```\n\n';
        } else {
          // For other chunk types, include full content
          contextContent += '```' + chunk.language + '\n';
          contextContent += chunk.content;
          contextContent += '\n```\n\n';
        }
      }
    }
    
    // Add knowledge items
    if (context.knowledgeItems && context.knowledgeItems.length > 0) {
      contextContent += '## KNOWLEDGE ITEMS\n\n';
      
      for (const item of context.knowledgeItems) {
        contextContent += `### ${item.type} from ${item.source.type}`;
        
        if (item.metadata?.title) {
          contextContent += ` - ${item.metadata.title}`;
        }
        
        contextContent += '\n';
        contextContent += item.content;
        contextContent += '\n\n';
      }
    }
    
    // Add command history
    if (context.commandHistory && context.commandHistory.length > 0) {
      contextContent += '## RECENT COMMANDS\n\n';
      
      for (const cmd of context.commandHistory) {
        const timestamp = cmd.timestamp.toLocaleString();
        contextContent += `[${timestamp}] ${cmd.command}\n`;
        
        if (cmd.output) {
          contextContent += '```\n';
          contextContent += cmd.output.substring(0, 500); // Limit output length
          
          if (cmd.output.length > 500) {
            contextContent += '\n... (output truncated) ...';
          }
          
          contextContent += '\n```\n';
        }
        
        contextContent += '\n';
      }
    }
    
    // Add CI status
    if (context.ciStatus && context.ciStatus.length > 0) {
      contextContent += '## CI/CD STATUS\n\n';
      
      for (const status of context.ciStatus) {
        contextContent += `### ${status.pipeline}\n`;
        contextContent += `Status: ${status.status}\n`;
        contextContent += `Last Updated: ${status.lastUpdated.toLocaleString()}\n`;
        
        if (status.details) {
          contextContent += 'Details:\n';
          contextContent += status.details;
        }
        
        contextContent += '\n\n';
      }
    }
    
    // Add active tickets
    if (context.activeTickets && context.activeTickets.length > 0) {
      contextContent += '## ACTIVE TICKETS\n\n';
      
      for (const ticket of context.activeTickets) {
        contextContent += `### ${ticket.id} - ${ticket.title}\n`;
        contextContent += `Status: ${ticket.status}\n`;
        contextContent += `Type: ${ticket.type}\n`;
        
        if (ticket.description) {
          contextContent += 'Description:\n';
          contextContent += ticket.description;
        }
        
        contextContent += '\n\n';
      }
    }
    
    return {
      id: generateUniqueId(),
      content: contextContent,
      role: MessageRole.SYSTEM,
      timestamp: new Date()
    };
  }
  
  /**
   * Truncate a context message to fit within token limits
   */
  private async truncateContextMessage(
    content: string,
    maxTokens: number
  ): Promise<string | null> {
    // If the context is already small enough, return as is
    const contentTokens = await this.tokenCounter(content);
    if (contentTokens <= maxTokens) {
      return content;
    }
    
    // Split content into sections
    const sections = content.split('##').filter(Boolean);
    
    if (sections.length <= 1) {
      // Can't truncate further
      return null;
    }
    
    let truncatedContent = 'CONTEXT (truncated):\n\n';
    let tokensUsed = await this.tokenCounter(truncatedContent);
    
    // Add sections until we hit the limit
    for (const section of sections) {
      const sectionContent = '##' + section;
      const sectionTokens = await this.tokenCounter(sectionContent);
      
      if (tokensUsed + sectionTokens <= maxTokens) {
        truncatedContent += sectionContent;
        tokensUsed += sectionTokens;
      } else {
        // Try to add a truncated version of this section
        const sectionHeader = sectionContent.split('\n')[0] + '\n';
        const headerTokens = await this.tokenCounter(sectionHeader);
        
        if (tokensUsed + headerTokens + 20 <= maxTokens) { // 20 tokens for truncation notice
          truncatedContent += sectionHeader;
          truncatedContent += '[Section truncated due to length]\n\n';
        }
        
        break;
      }
    }
    
    return truncatedContent;
  }
  
  /**
   * Calculate total tokens for a set of messages
   */
  private async calculateTotalTokens(messages: Message[]): Promise<number> {
    const tokenCounts = await Promise.all(
      messages.map(msg => this.tokenCounter(msg.content))
    );
    
    return tokenCounts.reduce((sum, count) => sum + count, 0);
  }
  
  /**
   * Get the default system prompt
   */
  private getDefaultSystemPrompt(): string {
    return `You are AUTONOMOUS ULTRA INSTINCT (AUI), an AI-powered developer agent designed to streamline complex developer workflows.

Your capabilities include:
1. Analyzing and understanding code across multiple programming languages
2. Providing context-aware assistance for debugging, feature development, and code review
3. Automating repetitive tasks through CLI interactions
4. Monitoring CI/CD pipelines and deployment status
5. Capturing and retrieving relevant knowledge from project documentation and discussions

When assisting developers, you should:
- Provide detailed, accurate responses based on the context provided
- Write complete, well-tested code that follows best practices
- Explain your reasoning and approach clearly
- Be honest about limitations and uncertainties
- Respect privacy by operating locally first, and only using external resources with explicit permission

You use specific tools to accomplish tasks:
- Code search to find relevant code snippets
- File operations to read and write code
- Terminal commands to execute development tasks
- Knowledge base queries to retrieve project information
- CI/CD monitoring to track build and deployment status

You are helping a developer with their project. Be concise but thorough in your responses.`;
  }
}

/**
 * Interface for context items to include in prompts
 */
export interface PromptContext {
  codeChunks?: CodeChunk[];
  knowledgeItems?: KnowledgeItem[];
  commandHistory?: CommandHistoryEntry[];
  ciStatus?: CIStatus[];
  activeTickets?: Ticket[];
}

/**
 * Interface for CI/CD status
 */
export interface CIStatus {
  pipeline: string;
  status: 'success' | 'failure' | 'running' | 'pending';
  lastUpdated: Date;
  details?: string;
}

/**
 * Interface for ticket information
 */
export interface Ticket {
  id: string;
  title: string;
  status: string;
  type: string;
  description?: string;
}