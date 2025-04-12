from datetime import datetime
from typing import Dict, List, Optional, Any
from pydantic import BaseModel, Field

class CodeRelation(BaseModel):
    """Represents a relationship between code chunks"""
    target_id: str
    relation_type: str  # "imports", "calls", "inherits", etc.
    confidence: float = 1.0

class CodeMetadata(BaseModel):
    """Metadata extracted from a code chunk"""
    name: Optional[str] = None  
    documentation: Optional[str] = None
    imports: List[str] = []
    complexity: Optional[int] = None
    last_modified: Optional[datetime] = None
    author: Optional[str] = None
    relations: List[CodeRelation] = []

class CodeChunk(BaseModel):
    """A chunk of code extracted from a file"""
    id: str
    content: str
    type: str  # "function", "class", "method", etc.
    file_path: str
    line_start: int
    line_end: int
    language: str
    metadata: CodeMetadata = Field(default_factory=CodeMetadata)
    embedding: Optional[List[float]] = None
    
class CodeChunkRequest(BaseModel):
    """Request model for processing code files"""
    file_paths: List[str]
    
class CodeChunkResponse(BaseModel):
    """Response model for code chunks"""
    chunks: List[CodeChunk]
    count: int
    
class CodeSearchRequest(BaseModel):
    """Request model for semantic code search"""
    query: str
    limit: int = 10
    filters: Optional[Dict[str, Any]] = None
    
class CodeSearchResponse(BaseModel):
    """Response model for code search results"""
    results: List[CodeChunk]
    count: int 