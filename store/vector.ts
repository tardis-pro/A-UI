import { EmbeddingVector, VectorQuery, VectorFilter, FilterOperator } from '../shared/types';
import * as fs from 'fs/promises';
import * as path from 'path';

/**
 * Interface for vector database operations
 */
export interface VectorDB {
  initialize(): Promise<void>;
  addVectors(vectors: EmbeddingVector[]): Promise<void>;
  searchVectors(queryVector: number[], options: VectorSearchOptions): Promise<VectorSearchResult[]>;
  deleteVectors(ids: string[]): Promise<void>;
  getVectorCount(): Promise<{ code: number; knowledge: number }>;
}

export interface VectorSearchOptions {
  limit?: number;
  threshold?: number;
  filters?: VectorFilter[];
}

export interface VectorSearchResult {
  id: string;
  score: number;
  metadata: Record<string, any>;
}

/**
 * Local vector database implementation using flat file storage
 * For the MVP, we'll use a simple file-based approach
 * In a production setting, this would be replaced with Chroma or Qdrant
 */
export class LocalVectorDB implements VectorDB {
  private dbPath: string;
  private vectors: EmbeddingVector[] = [];
  private initialized: boolean = false;
  
  constructor(dbPath: string = '.aui-data/vector-db') {
    this.dbPath = dbPath;
  }
  
  async initialize(): Promise<void> {
    if (this.initialized) return;
    
    try {
      // Ensure DB directory exists
      await fs.mkdir(this.dbPath, { recursive: true });
      
      // Load existing vectors if any
      await this.loadVectors();
      
      this.initialized = true;
      console.log(`Vector DB initialized with ${this.vectors.length} vectors`);
    } catch (error) {
      console.error('Failed to initialize vector database:', error);
      throw error;
    }
  }
  
  async addVectors(vectors: EmbeddingVector[]): Promise<void> {
    if (!this.initialized) await this.initialize();
    
    // Filter out vectors that already exist
    const newVectors = vectors.filter(v => 
      !this.vectors.some(existing => existing.objectId === v.objectId)
    );
    
    if (newVectors.length === 0) return;
    
    // Add new vectors to memory
    this.vectors.push(...newVectors);
    
    // Persist to disk
    await this.persistVectors(newVectors);
    
    console.log(`Added ${newVectors.length} vectors to database`);
  }
  
  async searchVectors(queryVector: number[], options: VectorSearchOptions): Promise<VectorSearchResult[]> {
    if (!this.initialized) await this.initialize();
    
    const { limit = 10, threshold = 0.5, filters = [] } = options;
    
    // Apply filters first
    let filteredVectors = this.vectors;
    
    if (filters.length > 0) {
      filteredVectors = this.vectors.filter(vector => 
        filters.every(filter => this.applyFilter(vector, filter))
      );
    }
    
    // Calculate cosine similarity for each vector
    const results = filteredVectors.map(vector => {
      const similarity = this.calculateCosineSimilarity(queryVector, vector.vector);
      return {
        id: vector.objectId,
        score: similarity,
        metadata: vector.metadata,
      };
    });
    
    // Sort by similarity score (descending)
    results.sort((a, b) => b.score - a.score);
    
    // Apply threshold and limit
    return results
      .filter(result => result.score >= threshold)
      .slice(0, limit);
  }
  
  async deleteVectors(ids: string[]): Promise<void> {
    if (!this.initialized) await this.initialize();
    
    const initialCount = this.vectors.length;
    
    // Remove vectors from memory
    this.vectors = this.vectors.filter(v => !ids.includes(v.objectId));
    
    // Persist the updated collection
    await this.saveAllVectors();
    
    console.log(`Deleted ${initialCount - this.vectors.length} vectors from database`);
  }
  
  async getVectorCount(): Promise<{ code: number; knowledge: number }> {
    if (!this.initialized) await this.initialize();
    
    const codeVectors = this.vectors.filter(v => v.metadata.type === 'code');
    const knowledgeVectors = this.vectors.filter(v => v.metadata.type === 'knowledge');
    
    return {
      code: codeVectors.length,
      knowledge: knowledgeVectors.length,
    };
  }
  
  /**
   * Load vectors from disk
   */
  private async loadVectors(): Promise<void> {
    try {
      const indexPath = path.join(this.dbPath, 'index.json');
      
      // Check if index exists
      try {
        await fs.access(indexPath);
      } catch {
        // No index yet, so nothing to load
        return;
      }
      
      // Load index
      const indexContent = await fs.readFile(indexPath, 'utf-8');
      const index = JSON.parse(indexContent);
      
      // Load each vector file
      for (const entry of index.vectors) {
        const filePath = path.join(this.dbPath, `${entry.id}.vector`);
        const vectorContent = await fs.readFile(filePath, 'utf-8');
        const vector = JSON.parse(vectorContent);
        
        this.vectors.push(vector);
      }
    } catch (error) {
      console.error('Failed to load vectors:', error);
      // Start with empty vectors
      this.vectors = [];
    }
  }
  
  /**
   * Persist vectors to disk
   */
  private async persistVectors(newVectors: EmbeddingVector[]): Promise<void> {
    try {
      // Generate index file if it doesn't exist
      const indexPath = path.join(this.dbPath, 'index.json');
      let index: { vectors: { id: string; type: string }[] } = { vectors: [] };
      
      // Load existing index if it exists
      try {
        const indexContent = await fs.readFile(indexPath, 'utf-8');
        index = JSON.parse(indexContent);
      } catch {
        // Index doesn't exist yet
      }
      
      // Add new vectors to index
      for (const vector of newVectors) {
        // Write vector to file
        const vectorPath = path.join(this.dbPath, `${vector.objectId}.vector`);
        await fs.writeFile(vectorPath, JSON.stringify(vector), 'utf-8');
        
        // Add to index
        index.vectors.push({
          id: vector.objectId,
          type: vector.metadata.type,
        });
      }
      
      // Update index
      await fs.writeFile(indexPath, JSON.stringify(index), 'utf-8');
    } catch (error) {
      console.error('Failed to persist vectors:', error);
      throw error;
    }
  }
  
  /**
   * Save all vectors (used after deletion)
   */
  private async saveAllVectors(): Promise<void> {
    try {
      // Clear directory (except for metadata files)
      const files = await fs.readdir(this.dbPath);
      for (const file of files) {
        if (file.endsWith('.vector')) {
          await fs.unlink(path.join(this.dbPath, file));
        }
      }
      
      // Create fresh index
      const index = {
        vectors: this.vectors.map(v => ({
          id: v.objectId,
          type: v.metadata.type,
        })),
      };
      
      // Write vectors and index
      for (const vector of this.vectors) {
        const vectorPath = path.join(this.dbPath, `${vector.objectId}.vector`);
        await fs.writeFile(vectorPath, JSON.stringify(vector), 'utf-8');
      }
      
      const indexPath = path.join(this.dbPath, 'index.json');
      await fs.writeFile(indexPath, JSON.stringify(index), 'utf-8');
    } catch (error) {
      console.error('Failed to save vectors:', error);
      throw error;
    }
  }
  
  /**
   * Apply a filter to a vector
   */
  private applyFilter(vector: EmbeddingVector, filter: VectorFilter): boolean {
    const { field, operator, value } = filter;
    
    // Get the field value, supporting nested paths with dot notation
    const fieldValue = field.split('.').reduce((obj, path) => obj?.[path], vector.metadata);
    
    if (fieldValue === undefined) return false;
    
    switch (operator) {
      case FilterOperator.EQUALS:
        return fieldValue === value;
      case FilterOperator.NOT_EQUALS:
        return fieldValue !== value;
      case FilterOperator.CONTAINS:
        if (Array.isArray(fieldValue)) {
          return fieldValue.includes(value);
        }
        if (typeof fieldValue === 'string' && typeof value === 'string') {
          return fieldValue.includes(value);
        }
        return false;
      case FilterOperator.GREATER_THAN:
        return fieldValue > value;
      case FilterOperator.LESS_THAN:
        return fieldValue < value;
      default:
        return false;
    }
  }
  
  /**
   * Calculate cosine similarity between two vectors
   */
  private calculateCosineSimilarity(a: number[], b: number[]): number {
    if (a.length !== b.length) {
      throw new Error('Vectors must have the same dimension');
    }
    
    let dotProduct = 0;
    let magnitudeA = 0;
    let magnitudeB = 0;
    
    for (let i = 0; i < a.length; i++) {
      dotProduct += a[i] * b[i];
      magnitudeA += a[i] * a[i];
      magnitudeB += b[i] * b[i];
    }
    
    magnitudeA = Math.sqrt(magnitudeA);
    magnitudeB = Math.sqrt(magnitudeB);
    
    if (magnitudeA === 0 || magnitudeB === 0) {
      return 0;
    }
    
    return dotProduct / (magnitudeA * magnitudeB);
  }
}

/**
 * Factory for creating vector database instances
 */
export class VectorDBFactory {
  static async create(type: 'local' | 'chroma' | 'qdrant', options: any = {}): Promise<VectorDB> {
    switch (type) {
      case 'local':
        const localDB = new LocalVectorDB(options.path);
        await localDB.initialize();
        return localDB;
      
      case 'chroma':
      case 'qdrant':
        // These would be implemented in a full product
        throw new Error(`Vector DB type '${type}' not implemented in MVP`);
      
      default:
        throw new Error(`Unknown vector DB type: ${type}`);
    }
  }
}