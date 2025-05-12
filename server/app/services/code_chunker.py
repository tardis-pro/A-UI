import os
import re
import ast
from typing import Dict, List, Optional, Union, Any
from datetime import datetime
import subprocess
from pydantic import BaseModel

class CodeRelation(BaseModel):
    """Represents a relationship between code chunks"""
    target_id: str
    relation_type: str  # "imports", "calls", "inherits", etc.
    confidence: float = 1.0

class CodeMetadata(BaseModel):
    """Metadata extracted from a code chunk"""
    name: Optional[str] = None             # Name (e.g., function name, class name)
    documentation: Optional[str] = None    # Associated documentation
    imports: List[str] = []                # Import statements
    complexity: Optional[int] = None       # Cyclomatic complexity
    last_modified: Optional[datetime] = None  # Last modification timestamp
    author: Optional[str] = None           # Author from git blame
    relations: List[CodeRelation] = []     # Related code chunks
    git: Dict[str, Any] = {}               # Git metadata

class CodeChunk(BaseModel):
    """A chunk of code extracted from a file"""
    id: str
    content: str
    type: str  # "function", "class", "method", etc.
    file_path: str
    line_start: int
    line_end: int
    language: str
    metadata: CodeMetadata = CodeMetadata()
    embedding: Optional[List[float]] = None
    ast: Optional[str] = None
    
class CodeChunkerService:
    """Service for extracting code chunks and metadata from source code files"""
    
    def __init__(self):
        self.supported_languages = {
            '.py': 'python',
            '.js': 'javascript',
            '.jsx': 'javascript',
            '.ts': 'typescript',
            '.tsx': 'typescript',
            '.java': 'java',
            '.cpp': 'cpp',
            '.hpp': 'cpp',
            '.h': 'cpp',
            '.c': 'c',
            '.go': 'go',
            '.rs': 'rust',
            '.rb': 'ruby'
        }
    
    async def process_file(self, file_path: str) -> List[CodeChunk]:
        """Process a file to extract code chunks"""
        ext = os.path.splitext(file_path)[1].lower()
        language = self.supported_languages.get(ext)
        
        if not language:
            return await self._process_generic_file(file_path, ext[1:] if ext else 'unknown')
            
        processor_map = {
            'python': self._process_python_file,
            'javascript': self._process_js_file,
            'typescript': self._process_js_file,
        }
        
        processor = processor_map.get(language, self._process_generic_file)
        chunks = await processor(file_path)
        
        # Extract additional metadata for each chunk
        for chunk in chunks:
            # Get Git metadata
            git_metadata = await self._extract_git_metadata(chunk)
            chunk.metadata.git = git_metadata
            
            # Extract relations
            relations = await self._extract_relations(chunk)
            chunk.metadata.relations = [relation.dict() for relation in relations]
            
            # Extract complexity metrics
            complexity = await self._calculate_complexity(chunk)
            chunk.metadata.complexity = complexity
            
        return chunks
        
    async def _calculate_complexity(self, chunk: CodeChunk) -> Dict[str, Any]:
        """Calculate complexity metrics for a code chunk"""
        metrics = {
            'lines': len(chunk.content.splitlines()),
            'characters': len(chunk.content),
            'cyclomatic': 1  # Base complexity
        }
        
        # Calculate cyclomatic complexity
        if chunk.language == 'python':
            # Count branching statements
            keywords = ['if', 'elif', 'for', 'while', 'and', 'or']
            for keyword in keywords:
                metrics['cyclomatic'] += chunk.content.count(f' {keyword} ')
        elif chunk.language in ['javascript', 'typescript']:
            # Count branching statements
            keywords = ['if', 'else if', 'for', 'while', '&&', '||']
            for keyword in keywords:
                metrics['cyclomatic'] += chunk.content.count(keyword)
                
        return metrics
    
    async def extract_metadata(self, code_chunk: CodeChunk) -> CodeMetadata:
        """Extract metadata from a code chunk"""
        metadata = CodeMetadata()
        
        # Extract various metadata based on the language
        language = code_chunk.language
        
        # Extract name (already in chunk)
        metadata.name = code_chunk.metadata.name
        
        # Extract documentation
        metadata.documentation = self._extract_documentation(code_chunk)
        
        # Extract imports
        metadata.imports = await self._extract_imports(code_chunk)
        
        # Extract complexity
        metadata.complexity = await self._calculate_complexity(code_chunk)
        
        # Git metadata (if available)
        git_metadata = await self._extract_git_metadata(code_chunk)
        if git_metadata:
            metadata.last_modified = git_metadata.get('last_modified')
            metadata.author = git_metadata.get('author')
            
        # Extract relations
        metadata.relations = await self._extract_relations(code_chunk)
        
        return metadata
    
    def _extract_documentation(self, code_chunk: CodeChunk) -> Optional[str]:
        """Extract documentation comments from code chunk"""
        if code_chunk.metadata.documentation:
            return code_chunk.metadata.documentation
            
        content = code_chunk.content
        language = code_chunk.language
        
        # Python docstrings
        if language == 'python':
            docstring_pattern = r'"""(.*?)"""'
            matches = re.findall(docstring_pattern, content, re.DOTALL)
            if matches:
                return matches[0].strip()
                
        # JSDoc comments
        elif language in ['javascript', 'typescript']:
            jsdoc_pattern = r'/\*\*(.*?)\*/'
            matches = re.findall(jsdoc_pattern, content, re.DOTALL)
            if matches:
                return matches[0].strip()
        
        return None
    
    async def _extract_imports(self, code_chunk: CodeChunk) -> List[str]:
        """Extract import statements from code chunk"""
        content = code_chunk.content
        language = code_chunk.language
        imports = []
        
        if language == 'python':
            try:
                tree = ast.parse(content)
                for node in ast.walk(tree):
                    if isinstance(node, ast.Import):
                        for name in node.names:
                            imports.append(name.name)
                    elif isinstance(node, ast.ImportFrom):
                        module = node.module or ''
                        for name in node.names:
                            imports.append(f"{module}.{name.name}")
            except SyntaxError:
                # If parsing the chunk fails, try extracting imports using regex
                import_pattern = r'^\s*(?:from\s+(\S+)\s+)?import\s+(.+)$'
                for line in content.split('\n'):
                    match = re.match(import_pattern, line)
                    if match:
                        from_module, import_names = match.groups()
                        if from_module:
                            for name in import_names.split(','):
                                imports.append(f"{from_module}.{name.strip()}")
                        else:
                            for name in import_names.split(','):
                                imports.append(name.strip())
        
        elif language in ['javascript', 'typescript']:
            import_pattern = r'(?:import\s+{([^}]+)}\s+from\s+[\'"]([^\'"]+)[\'"])|(?:import\s+(\w+)\s+from\s+[\'"]([^\'"]+)[\'"])'
            for match in re.finditer(import_pattern, content):
                named_imports, named_module, default_import, default_module = match.groups()
                if named_imports and named_module:
                    for name in named_imports.split(','):
                        imports.append(f"{named_module}.{name.strip()}")
                elif default_import and default_module:
                    imports.append(f"{default_module}.{default_import}")
        
        return imports
    
    async def _extract_git_metadata(self, code_chunk: CodeChunk) -> Dict[str, Any]:
        """Extract Git metadata for the code chunk"""
        try:
            file_path = os.path.abspath(code_chunk.file_path)
            line_start = code_chunk.line_start
            
            # Get the last modified date and author using git blame
            blame_cmd = f"git blame -L {line_start},{line_start} --porcelain {file_path}"
            result = subprocess.run(blame_cmd, shell=True, capture_output=True, text=True)
            
            if result.returncode == 0:
                output = result.stdout
                
                # Extract author
                author_match = re.search(r'author (.+)', output)
                author = author_match.group(1) if author_match else None
                
                # Extract timestamp
                time_match = re.search(r'author-time (\d+)', output)
                timestamp = int(time_match.group(1)) if time_match else None
                last_modified = datetime.fromtimestamp(timestamp) if timestamp else None
                
                return {
                    'author': author,
                    'last_modified': last_modified
                }
        except Exception:
            pass
            
        return {}
    
    async def _extract_relations(self, code_chunk: CodeChunk) -> List[CodeRelation]:
        """Extract relationships between this chunk and other code elements"""
        # This would be expanded based on the codebase's specific needs
        # For example, detecting function calls, class inheritance, etc.
        return []
        
    async def _process_python_file(self, file_path: str) -> List[CodeChunk]:
        """Process Python file to extract code chunks"""
        chunks = []
        
        try:
            with open(file_path, 'r', encoding='utf-8') as f:
                content = f.read()
            
            from tree_sitter import Parser
            
            parser = Parser()
            parser.set_language("python")
            tree = parser.parse(bytes(content, "utf8"))
            root_node = tree.root_node

            for node in root_node.children:
                chunk_id = f"{file_path}:{id(node)}"
                
                if node.type == "class_definition":
                    # Extract class definition
                    start_line = node.start_point[0] + 1
                    end_line = node.end_point[0] + 1
                    class_content = '\\n'.join(content.split('\\n')[start_line-1:end_line])
                    
                    # Extract docstring
                    docstring = ast.get_docstring(node)
                    
                    chunks.append(CodeChunk(
                        id=chunk_id,
                        content=class_content,
                        type="class",
                        file_path=file_path,
                        line_start=start_line,
                        line_end=end_line,
                        language="python",
                        metadata=CodeMetadata(
                            name=node.name,
                            documentation=docstring
                        ),
                        ast=str(node.sexp())  # Store AST as string
                    ))
                    
                elif node.type == "function_definition":
                    # Extract function definition
                    start_line = node.start_point[0] + 1
                    end_line = node.end_lineno if hasattr(node, 'end_lineno') else start_line
                    func_content = '\\n'.join(content.split('\\n')[start_line-1:end_line])
                    
                    # Extract docstring
                    docstring = ast.get_docstring(node)
                    
                    chunks.append(CodeChunk(
                        id=chunk_id,
                        content=func_content,
                        type="function",
                        file_path=file_path,
                        line_start=start_line,
                        line_end=end_line,
                        language="python",
                        metadata=CodeMetadata(
                            name=node.name,
                            documentation=docstring
                        ),
                        ast=str(node.sexp())
                    ))
                    
        except Exception as e:
            print(f"Error processing file: {file_path} - {e}")
            
        return chunks

    async def _process_js_file(self, file_path: str) -> List[CodeChunk]:
        """Process JavaScript/TypeScript file to extract code chunks"""
        chunks = []
        
        try:
            from tree_sitter import Parser
            
            parser = Parser()
            parser.set_language("javascript")
            with open(file_path, 'r', encoding='utf-8') as f:
                content = f.read()
            tree = parser.parse(bytes(content, "utf8"))
            root_node = tree.root_node
            
            def traverse_tree(node, chunks):
                if node.type == "class_declaration":
                    class_name = node.children[1].text.decode()
                    start_line = node.start_point[0] + 1
                    end_line = node.end_point[0] + 1
                    class_content = content.splitlines()[start_line - 1:end_line]
                    class_content = "\\n".join(class_content)
                    
                    chunk_id = f"{file_path}:{start_line}"
                    chunk = CodeChunk(
                        id=chunk_id,
                        content=class_content,
                        type="class",
                        file_path=file_path,
                        line_start=start_line,
                        line_end=end_line,
                        language="javascript",
                        metadata=CodeMetadata(name=class_name),
                        ast=str(node.sexp())
                    )
                    chunks.append(chunk)
                    
                elif node.type == "function_declaration":
                    func_name = node.children[1].text.decode()
                    start_line = node.start_point[0] + 1
                    end_line = node.end_point[0] + 1
                    func_content = content.splitlines()[start_line - 1:end_line]
                    func_content = "\\n".join(func_content)
                    
                    chunk_id = f"{file_path}:{start_line}"
                    chunk = CodeChunk(
                        id=chunk_id,
                        content=func_content,
                        type="function",
                        file_path=file_path,
                        line_start=start_line,
                        line_end=end_line,
                        language="javascript",
                        metadata=CodeMetadata(name=func_name),
                        ast=str(node.sexp())
                    )
                    chunks.append(chunk)
                    
                for child in node.children:
                    traverse_tree(child, chunks)
            
            traverse_tree(root_node, chunks)
        
        except FileNotFoundError:
            print(f"File not found: {file_path}")
        except Exception as e:
            print(f"Error processing file: {file_path} - {e}")
            
        return chunks

    async def _process_generic_file(self, file_path: str, language: str) -> List[CodeChunk]:
        """Process any supported file to extract basic code chunks"""
        chunks = []
        
        try:
            with open(file_path, 'r', encoding='utf-8') as f:
                content = f.read()
                
            # Split the content into lines and create a single code chunk
            lines = content.splitlines()
            chunk = CodeChunk(
                id=file_path,
                content=content,
                type="file",
                file_path=file_path,
                line_start=1,
                line_end=len(lines),
                language=language
            )
            chunks.append(chunk)
        except Exception as e:
            print(f"Error processing file: {file_path} - {e}")
            
        return chunks