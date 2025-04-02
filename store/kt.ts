import { KnowledgeItem, KnowledgeType, KnowledgeSource, SourceType } from '../shared/types/knowledge';
import { EmbeddingGenerator } from './embedding-generator';
import { VectorDB } from './vector-database';
import { generateUniqueId } from '../utils/helpers';
import * as fs from 'fs/promises';
import * as path from 'path';

/**
 * KnowledgeManager handles the capture, classification, and storage of knowledge items
 */
export class KnowledgeManager {
  private embeddingGenerator: EmbeddingGenerator;
  private vectorDB: VectorDB;
  private knowledgeItems: Map<string, KnowledgeItem> = new Map();
  private storageDir: string;
  
  constructor(
    embeddingGenerator: EmbeddingGenerator,
    vectorDB: VectorDB,
    storageDir: string = '.aui-data/knowledge'
  ) {
    this.embeddingGenerator = embeddingGenerator;
    this.vectorDB = vectorDB;
    this.storageDir = storageDir;
  }
  
  /**
   * Initialize the knowledge manager
   */
  async initialize(): Promise<void> {
    // Ensure storage directory exists
    await fs.mkdir(this.storageDir, { recursive: true });
    
    // Load existing knowledge items
    await this.loadKnowledgeItems();
    
    console.log(`Knowledge manager initialized with ${this.knowledgeItems.size} items`);
  }
  
  /**
   * Add a new knowledge item
   */
  async addKnowledgeItem(
    content: string,
    type: KnowledgeType,
    source: KnowledgeSource,
    tags: string[] = [],
    relatedCodeIds: string[] = [],
    metadata: Record<string, any> = {}
  ): Promise<KnowledgeItem> {
    // Create the knowledge item
    const item: KnowledgeItem = {
      id: generateUniqueId(),
      content,
      type,
      source,
      tags,
      timestamp: new Date(),
      relatedCodeIds,
      confidence: 1.0, // Default confidence
      metadata
    };
    
    // Store the item
    this.knowledgeItems.set(item.id, item);
    await this.persistKnowledgeItem(item);
    
    // Generate embedding and add to vector DB
    const embedding = await this.embeddingGenerator.generateKnowledgeEmbedding(item);
    await this.vectorDB.addVectors([embedding]);
    
    console.log(`Added knowledge item: ${item.id} (${type})`);
    return item;
  }
  
  /**
   * Get a knowledge item by ID
   */
  getKnowledgeItem(id: string): KnowledgeItem | undefined {
    return this.knowledgeItems.get(id);
  }
  
  /**
   * Update an existing knowledge item
   */
  async updateKnowledgeItem(id: string, updates: Partial<KnowledgeItem>): Promise<KnowledgeItem | null> {
    const existingItem = this.knowledgeItems.get(id);
    if (!existingItem) {
      return null;
    }
    
    // Update the item
    const updatedItem = {
      ...existingItem,
      ...updates,
      id, // Ensure ID doesn't change
      timestamp: new Date() // Update timestamp
    };
    
    // Store updated item
    this.knowledgeItems.set(id, updatedItem);
    await this.persistKnowledgeItem(updatedItem);
    
    // Update embedding if content changed
    if (updates.content && updates.content !== existingItem.content) {
      // Delete old vector
      await this.vectorDB.deleteVectors([id]);
      
      // Generate and add new vector
      const embedding = await this.embeddingGenerator.generateKnowledgeEmbedding(updatedItem);
      await this.vectorDB.addVectors([embedding]);
    }
    
    return updatedItem;
  }
  
  /**
   * Delete a knowledge item
   */
  async deleteKnowledgeItem(id: string): Promise<boolean> {
    if (!this.knowledgeItems.has(id)) {
      return false;
    }
    
    // Remove from memory
    this.knowledgeItems.delete(id);
    
    // Remove from storage
    try {
      const filePath = path.join(this.storageDir, `${id}.json`);
      await fs.unlink(filePath);
    } catch (error) {
      console.error(`Failed to delete knowledge item file: ${id}`, error);
    }
    
    // Remove from vector DB
    await this.vectorDB.deleteVectors([id]);
    
    return true;
  }
  
  /**
   * Search for knowledge items by semantic similarity
   */
  async searchKnowledge(query: string, options: KnowledgeSearchOptions = {}): Promise<KnowledgeSearchResult[]> {
    const { limit = 10, threshold = 0.6, types, tags, sourceTypes } = options;
    
    // Generate query embedding
    const queryVector = await this.embeddingGenerator.generateQueryEmbedding(query);
    
    // Build filters
    const filters = [];
    
    // Filter by type
    if (types && types.length > 0) {
      filters.push({
        field: 'knowledgeType',
        operator: 'in',
        value: types
      });
    }
    
    // Filter by source type
    if (sourceTypes && sourceTypes.length > 0) {
      filters.push({
        field: 'source.type',
        operator: 'in',
        value: sourceTypes
      });
    }
    
    // Search vector DB
    const results = await this.vectorDB.searchVectors(queryVector, {
      limit,
      threshold,
      filters
    });
    
    // Map results to knowledge items
    const knowledgeResults = results
      .map(result => {
        const item = this.knowledgeItems.get(result.id);
        if (!item) return null;
        
        // Filter by tags if specified
        if (tags && tags.length > 0) {
          const hasMatchingTag = tags.some(tag => item.tags.includes(tag));
          if (!hasMatchingTag) return null;
        }
        
        return {
          item,
          score: result.score
        };
      })
      .filter((result): result is KnowledgeSearchResult => result !== null);
    
    return knowledgeResults;
  }
  
  /**
   * Get all knowledge items
   */
  getAllKnowledgeItems(): KnowledgeItem[] {
    return Array.from(this.knowledgeItems.values());
  }
  
  /**
   * Get knowledge items by type
   */
  getKnowledgeItemsByType(type: KnowledgeType): KnowledgeItem[] {
    return Array.from(this.knowledgeItems.values())
      .filter(item => item.type === type);
  }
  
  /**
   * Get knowledge items by tag
   */
  getKnowledgeItemsByTag(tag: string): KnowledgeItem[] {
    return Array.from(this.knowledgeItems.values())
      .filter(item => item.tags.includes(tag));
  }
  
  /**
   * Get knowledge items related to specific code chunks
   */
  getKnowledgeItemsForCode(codeId: string): KnowledgeItem[] {
    return Array.from(this.knowledgeItems.values())
      .filter(item => item.relatedCodeIds.includes(codeId));
  }
  
  /**
   * Extract knowledge from a document (e.g., README, comments)
   */
  async extractKnowledgeFromDocument(
    content: string,
    source: KnowledgeSource,
    options: {
      type?: KnowledgeType,
      tags?: string[],
      relatedCodeIds?: string[]
    } = {}
  ): Promise<KnowledgeItem[]> {
    const { 
      type = KnowledgeType.EXPLICIT, 
      tags = [], 
      relatedCodeIds = [] 
    } = options;
    
    // Simplified implementation for MVP
    // In a real system, we would use NLP to break down the document
    // into smaller, semantically meaningful chunks
    
    // Simple approach: split by headings/sections for documentation
    const sections = this.splitIntoSections(content);
    
    const items: KnowledgeItem[] = [];
    
    for (const section of sections) {
      // Skip empty sections
      if (!section.content.trim()) continue;
      
      // Create a knowledge item for each section
      const item = await this.addKnowledgeItem(
        section.content,
        type,
        source,
        [...tags, ...section.tags],
        relatedCodeIds,
        { title: section.title }
      );
      
      items.push(item);
    }
    
    return items;
  }
  
  /**
   * Extract knowledge from conversation (e.g., PR comments, code reviews)
   */
  async extractKnowledgeFromConversation(
    content: string,
    source: KnowledgeSource,
    options: {
      tags?: string[],
      relatedCodeIds?: string[]
    } = {}
  ): Promise<KnowledgeItem[]> {
    const { tags = [], relatedCodeIds = [] } = options;
    
    // Simplified for MVP
    // In a real system, we would:
    // 1. Use NLP to identify key points, decisions, explanations
    // 2. Classify the tacit knowledge type
    // 3. Extract relevant metadata
    
    // For MVP, just treat each message as a separate knowledge item
    const messages = this.splitIntoMessages(content);
    
    const items: KnowledgeItem[] = [];
    
    for (const message of messages) {
      // Skip empty or very short messages
      if (message.content.trim().length < 10) continue;
      
      // Classify the message
      const messageType = this.classifyMessage(message.content);
      
      // Create a knowledge item
      const item = await this.addKnowledgeItem(
        message.content,
        KnowledgeType.TACIT,
        source,
        [...tags, messageType],
        relatedCodeIds,
        { 
          author: message.author,
          timestamp: message.timestamp
        }
      );
      
      items.push(item);
    }
    
    return items;
  }
  
  /**
   * Import knowledge from Jira or issue tracking system
   */
  async importKnowledgeFromIssues(
    issues: any[],
    sourceType: SourceType
  ): Promise<KnowledgeItem[]> {
    const items: KnowledgeItem[] = [];
    
    for (const issue of issues) {
      // Create source
      const source: KnowledgeSource = {
        type: sourceType,
        identifier: issue.id || issue.key,
        url: issue.url,
        author: issue.reporter || issue.author
      };
      
      // Generate tags
      const tags = [
        issue.type || 'issue',
        issue.status || 'unknown',
        ...(issue.labels || [])
      ];
      
      // Create base knowledge item from issue summary/description
      const baseItem = await this.addKnowledgeItem(
        `${issue.summary || issue.title}\n\n${issue.description || ''}`,
        KnowledgeType.EXPLICIT,
        source,
        tags,
        [],
        {
          title: issue.summary || issue.title,
          status: issue.status,
          priority: issue.priority,
          created: issue.created,
          updated: issue.updated
        }
      );
      
      items.push(baseItem);
      
      // Process comments if available
      if (issue.comments && issue.comments.length > 0) {
        // Combine comments into a conversation
        const commentsText = issue.comments
          .map((comment: any) => `${comment.author}: ${comment.body}`)
          .join('\n\n');
        
        // Extract knowledge from comments
        const commentItems = await this.extractKnowledgeFromConversation(
          commentsText,
          {
            type: sourceType,
            identifier: `${issue.id || issue.key}-comments`,
            url: issue.url
          },
          {
            tags: [...tags, 'comment'],
            relatedCodeIds: baseItem.relatedCodeIds
          }
        );
        
        items.push(...commentItems);
      }
    }
    
    return items;
  }
  
  /**
   * Import knowledge from Git commit history
   */
  async importKnowledgeFromCommits(
    commits: any[]
  ): Promise<KnowledgeItem[]> {
    const items: KnowledgeItem[] = [];
    
    for (const commit of commits) {
      // Skip commits with empty messages
      if (!commit.message || commit.message.trim().length < 5) continue;
      
      // Create source
      const source: KnowledgeSource = {
        type: SourceType.GITHUB,
        identifier: commit.hash,
        url: commit.url,
        author: commit.author
      };
      
      // Extract potential issue references
      const issueRefs = this.extractIssueReferences(commit.message);
      
      // Create knowledge item
      const item = await this.addKnowledgeItem(
        commit.message,
        KnowledgeType.EXPLICIT,
        source,
        ['commit', ...issueRefs.map(ref => `issue-${ref}`)],
        [], // Related code IDs would be populated later
        {
          date: commit.date,
          files: commit.files,
          issueRefs
        }
      );
      
      items.push(item);
    }
    
    return items;
  }
  
  /**
   * Load knowledge items from storage
   */
  private async loadKnowledgeItems(): Promise<void> {
    try {
      const files = await fs.readdir(this.storageDir);
      
      for (const file of files) {
        if (file.endsWith('.json')) {
          const filePath = path.join(this.storageDir, file);
          const content = await fs.readFile(filePath, 'utf-8');
          const item = JSON.parse(content) as KnowledgeItem;
          
          // Ensure date objects are properly deserialized
          item.timestamp = new Date(item.timestamp);
          
          this.knowledgeItems.set(item.id, item);
        }
      }
    } catch (error) {
      console.error('Failed to load knowledge items:', error);
    }
  }
  
  /**
   * Persist a knowledge item to storage
   */
  private async persistKnowledgeItem(item: KnowledgeItem): Promise<void> {
    try {
      const filePath = path.join(this.storageDir, `${item.id}.json`);
      await fs.writeFile(filePath, JSON.stringify(item), 'utf-8');
    } catch (error) {
      console.error('Failed to persist knowledge item:', error);
    }
  }
  
  /**
   * Split document content into sections
   */
  private splitIntoSections(content: string): Array<{
    title: string;
    content: string;
    tags: string[];
  }> {
    // Simple implementation using markdown-style headings
    const headingRegex = /^(#{1,6})\s+(.+)$/gm;
    const sections: Array<{
      title: string;
      content: string;
      tags: string[];
      level: number;
    }> = [];
    
    let lastIndex = 0;
    let match;
    
    // Find all headings
    while ((match = headingRegex.exec(content)) !== null) {
      const level = match[1].length;
      const title = match[2].trim();
      const startIndex = match.index;
      
      // If this isn't the first heading, save the previous section
      if (startIndex > 0 && sections.length > 0) {
        const prevSection = sections[sections.length - 1];
        prevSection.content = content.substring(lastIndex, startIndex).trim();
      }
      
      sections.push({
        title,
        content: '',
        tags: [this.normalizeTag(title)],
        level
      });
      
      lastIndex = startIndex + match[0].length;
    }
    
    // Handle the last section
    if (sections.length > 0) {
      const lastSection = sections[sections.length - 1];
      lastSection.content = content.substring(lastIndex).trim();
    } else {
      // No headings found, treat the entire content as one section
      sections.push({
        title: 'Document',
        content: content.trim(),
        tags: [],
        level: 0
      });
    }
    
    // Remove level property before returning
    return sections.map(({ title, content, tags }) => ({ title, content, tags }));
  }
  
  /**
   * Split conversation content into messages
   */
  private splitIntoMessages(content: string): Array<{
    author: string;
    content: string;
    timestamp: Date;
  }> {
    // Simple implementation assuming a format like:
    // Author: Message content
    const messageRegex = /^([^:]+):\s*(.+)(?:\n|$)/gm;
    const messages: Array<{
      author: string;
      content: string;
      timestamp: Date;
    }> = [];
    
    let match;
    
    while ((match = messageRegex.exec(content)) !== null) {
      const author = match[1].trim();
      const messageContent = match[2].trim();
      
      messages.push({
        author,
        content: messageContent,
        timestamp: new Date() // In real implementation, we'd parse this from the content if available
      });
    }
    
    // If no messages found with the pattern, treat the entire content as one message
    if (messages.length === 0) {
      messages.push({
        author: 'Unknown',
        content: content.trim(),
        timestamp: new Date()
      });
    }
    
    return messages;
  }
  
  /**
   * Classify a message into a tag/category
   */
  private classifyMessage(content: string): string {
    // Simplified implementation for MVP
    // In a real system, we would use ML/NLP for more accurate classification
    
    const lowerContent = content.toLowerCase();
    
    if (lowerContent.includes('decision') || lowerContent.includes('decided') || lowerContent.includes('choose')) {
      return 'decision';
    }
    
    if (lowerContent.includes('problem') || lowerContent.includes('issue') || lowerContent.includes('bug')) {
      return 'problem';
    }
    
    if (lowerContent.includes('solution') || lowerContent.includes('fixed') || lowerContent.includes('resolved')) {
      return 'solution';
    }
    
    if (lowerContent.includes('question') || lowerContent.includes('?')) {
      return 'question';
    }
    
    if (lowerContent.includes('todo') || lowerContent.includes('task') || lowerContent.includes('should')) {
      return 'todo';
    }
    
    // Default
    return 'information';
  }
  
  /**
   * Extract issue references from text (e.g., JIRA-123, #456)
   */
  private extractIssueReferences(text: string): string[] {
    const references: string[] = [];
    
    // Match JIRA-style references (e.g., PROJ-123)
    const jiraRefRegex = /([A-Z]+-\d+)/g;
    let match;
    while ((match = jiraRefRegex.exec(text)) !== null) {
      references.push(match[1]);
    }
    
    // Match GitHub-style references (e.g., #123)
    const githubRefRegex = /#(\d+)/g;
    while ((match = githubRefRegex.exec(text)) !== null) {
      references.push(match[1]);
    }
    
    return references;
  }
  
  /**
   * Normalize a string into a tag (lowercase, spaces to hyphens)
   */
  private normalizeTag(text: string): string {
    return text
      .toLowerCase()
      .replace(/[^\w\s-]/g, '')
      .replace(/\s+/g, '-');
  }
}

export interface KnowledgeSearchOptions {
  limit?: number;
  threshold?: number;
  types?: KnowledgeType[];
  tags?: string[];
  sourceTypes?: SourceType[];
}

export interface KnowledgeSearchResult {
  item: KnowledgeItem;
  score: number;
}