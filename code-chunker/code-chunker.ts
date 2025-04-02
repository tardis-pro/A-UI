import * as fs from 'fs/promises';
import * as path from 'path';
import * as Parser from 'tree-sitter';
import { CodeChunk, CodeChunkType, CodeMetadata } from '../shared/types/code';
import { generateUniqueId } from '../utils/helpers';

// Import language parsers from tree-sitter
// In a real implementation, these would be dynamically loaded
// based on the languages needed
const LANGUAGE_PARSERS = {
  typescript: () => import('tree-sitter-typescript').then(m => m.typescript),
  javascript: () => import('tree-sitter-javascript').then(m => m.javascript),
  python: () => import('tree-sitter-python').then(m => m.python),
  // Add more language parsers as needed
};

/**
 * CodeChunker is responsible for parsing source code files and breaking
 * them down into semantic chunks at different granularity levels.
 */
export class CodeChunker {
  private parser: Parser;
  private languageParsers: Map<string, Parser.Language>;

  constructor() {
    this.parser = new Parser();
    this.languageParsers = new Map();
  }

  /**
   * Initialize the code chunker with required language parsers
   */
  async initialize(): Promise<void> {
    // Load language parsers
    for (const [lang, loader] of Object.entries(LANGUAGE_PARSERS)) {
      try {
        const language = await loader();
        this.languageParsers.set(lang, language);
      } catch (error) {
        console.error(`Failed to load ${lang} parser:`, error);
      }
    }
  }

  /**
   * Chunk a file into semantic code blocks at multiple granularity levels
   * 
   * @param filePath Path to the file to chunk
   * @returns Array of code chunks at different granularity levels
   */
  async chunkFile(filePath: string): Promise<CodeChunk[]> {
    const fileContent = await fs.readFile(filePath, 'utf-8');
    const language = this.detectLanguage(filePath);
    
    if (!language || !this.languageParsers.has(language)) {
      // Fallback to file-level chunking if language not supported
      return [this.createFileChunk(filePath, fileContent, language || 'unknown')];
    }

    // Set parser language
    this.parser.setLanguage(this.languageParsers.get(language)!);
    
    // Parse the file
    const tree = this.parser.parse(fileContent);
    const chunks: CodeChunk[] = [];
    
    // Add file-level chunk
    chunks.push(this.createFileChunk(filePath, fileContent, language));
    
    // Add more granular chunks based on AST parsing
    this.parseNode(tree.rootNode, filePath, fileContent, language, chunks);
    
    return chunks;
  }

  /**
   * Recursively parse AST nodes to extract semantic chunks
   */
  private parseNode(
    node: Parser.SyntaxNode,
    filePath: string,
    fileContent: string,
    language: string,
    chunks: CodeChunk[]
  ): void {
    // Handle different node types based on language
    switch (node.type) {
      // TypeScript/JavaScript
      case 'class_declaration':
        chunks.push(this.createClassChunk(node, filePath, fileContent, language));
        break;
      case 'function_declaration':
      case 'method_definition':
      case 'arrow_function':
        chunks.push(this.createFunctionChunk(node, filePath, fileContent, language));
        break;
      
      // Python
      case 'class_definition':
        chunks.push(this.createClassChunk(node, filePath, fileContent, language));
        break;
      case 'function_definition':
        chunks.push(this.createFunctionChunk(node, filePath, fileContent, language));
        break;
        
      // Add cases for other language-specific node types
    }

    // Recursively process children
    for (let i = 0; i < node.childCount; i++) {
      this.parseNode(node.child(i)!, filePath, fileContent, language, chunks);
    }
  }

  /**
   * Create a file-level chunk
   */
  private createFileChunk(
    filePath: string,
    content: string,
    language: string
  ): CodeChunk {
    const relativePath = path.relative(process.cwd(), filePath);
    const lineCount = content.split('\n').length;
    
    return {
      id: generateUniqueId(),
      content,
      type: CodeChunkType.FILE,
      filePath: relativePath,
      lineStart: 1,
      lineEnd: lineCount,
      language,
      metadata: {
        name: path.basename(filePath),
        imports: this.extractImports(content, language),
      }
    };
  }

  /**
   * Create a class-level chunk
   */
  private createClassChunk(
    node: Parser.SyntaxNode,
    filePath: string,
    fileContent: string,
    language: string
  ): CodeChunk {
    const relativePath = path.relative(process.cwd(), filePath);
    const content = fileContent.substring(node.startIndex, node.endIndex);
    
    // Find class name node based on language
    let nameNode = node.descendantsOfType('identifier')[0];
    if (!nameNode) {
      nameNode = node.descendantsOfType('type_identifier')[0] || node;
    }
    
    const className = nameNode ? fileContent.substring(nameNode.startIndex, nameNode.endIndex) : 'AnonymousClass';
    
    // Get line numbers
    const lines = fileContent.substring(0, node.startIndex).split('\n');
    const startLine = lines.length;
    const endLine = startLine + content.split('\n').length - 1;
    
    // Extract documentation comment if present
    const comment = this.extractDocComment(node, fileContent);
    
    return {
      id: generateUniqueId(),
      content,
      type: CodeChunkType.CLASS,
      filePath: relativePath,
      lineStart: startLine,
      lineEnd: endLine,
      language,
      metadata: {
        name: className,
        documentation: comment,
      }
    };
  }

  /**
   * Create a function-level chunk
   */
  private createFunctionChunk(
    node: Parser.SyntaxNode,
    filePath: string,
    fileContent: string,
    language: string
  ): CodeChunk {
    const relativePath = path.relative(process.cwd(), filePath);
    const content = fileContent.substring(node.startIndex, node.endIndex);
    
    // Find function name based on node type and language
    let nameNode: Parser.SyntaxNode | null = null;
    
    if (node.type === 'function_declaration' || node.type === 'function_definition') {
      nameNode = node.descendantsOfType('identifier')[0];
    } else if (node.type === 'method_definition') {
      nameNode = node.descendantsOfType('property_identifier')[0];
    } else if (node.type === 'arrow_function') {
      // For arrow functions, try to get variable name it's assigned to
      const parent = node.parent;
      if (parent && parent.type === 'variable_declarator') {
        nameNode = parent.descendantsOfType('identifier')[0];
      }
    }
    
    const functionName = nameNode ? 
      fileContent.substring(nameNode.startIndex, nameNode.endIndex) : 
      'AnonymousFunction';
    
    // Get line numbers
    const lines = fileContent.substring(0, node.startIndex).split('\n');
    const startLine = lines.length;
    const endLine = startLine + content.split('\n').length - 1;
    
    // Extract documentation comment if present
    const comment = this.extractDocComment(node, fileContent);
    
    // Analyze complexity (simplified example)
    const complexity = this.calculateComplexity(node);
    
    return {
      id: generateUniqueId(),
      content,
      type: node.type === 'method_definition' ? CodeChunkType.METHOD : CodeChunkType.FUNCTION,
      filePath: relativePath,
      lineStart: startLine,
      lineEnd: endLine,
      language,
      metadata: {
        name: functionName,
        documentation: comment,
        complexity,
      }
    };
  }

  /**
   * Extract documentation comment for a node
   */
  private extractDocComment(node: Parser.SyntaxNode, fileContent: string): string | undefined {
    // Find previous sibling that might be a comment
    let commentNode = node.previousSibling;
    
    while (commentNode && commentNode.type === 'comment') {
      const commentText = fileContent.substring(commentNode.startIndex, commentNode.endIndex);
      
      // Simple check for doc comment format (can be improved for various languages)
      if (commentText.startsWith('/**') || commentText.startsWith('"""') || commentText.startsWith('\'\'\'')) {
        return commentText;
      }
      
      commentNode = commentNode.previousSibling;
    }
    
    return undefined;
  }

  /**
   * Calculate cyclomatic complexity (simplified)
   */
  private calculateComplexity(node: Parser.SyntaxNode): number {
    // Base complexity
    let complexity = 1;
    
    // Count decision points
    const decisionPoints = [
      'if_statement',
      'for_statement',
      'while_statement',
      'do_statement',
      'conditional_expression',
      'case',
      'catch',
      '&&',
      '||',
    ];
    
    // Count occurrences of decision points
    for (const point of decisionPoints) {
      complexity += node.descendantsOfType(point).length;
    }
    
    return complexity;
  }

  /**
   * Extract import statements from code
   */
  private extractImports(content: string, language: string): string[] {
    const imports: string[] = [];
    
    // Simplistic regex-based approach for demo purposes
    // In a real implementation, this would use AST parsing for accuracy
    
    // JavaScript/TypeScript imports
    if (language === 'javascript' || language === 'typescript') {
      const importRegex = /import\s+.*?from\s+['"](.+?)['"]/g;
      let match;
      while ((match = importRegex.exec(content)) !== null) {
        imports.push(match[1]);
      }
    }
    // Python imports
    else if (language === 'python') {
      const importRegex = /(?:from\s+(.+?)\s+import|import\s+(.+?)(?:\s+as\s+|$))/g;
      let match;
      while ((match = importRegex.exec(content)) !== null) {
        imports.push(match[1] || match[2]);
      }
    }
    // Add more language-specific import extraction
    
    return imports;
  }

  /**
   * Detect programming language from file extension
   */
  private detectLanguage(filePath: string): string | null {
    const ext = path.extname(filePath).toLowerCase();
    
    switch (ext) {
      case '.ts':
      case '.tsx':
        return 'typescript';
      case '.js':
      case '.jsx':
        return 'javascript';
      case '.py':
        return 'python';
      // Add more language mappings
      default:
        return null;
    }
  }
}