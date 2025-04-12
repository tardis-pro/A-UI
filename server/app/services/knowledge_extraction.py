from typing import List, Dict, Any, Optional
from datetime import datetime
import numpy as np
from transformers import AutoTokenizer, AutoModel
import torch
from pydantic import BaseModel

class ExtractedKnowledge(BaseModel):
    """Represents extracted knowledge with metadata"""
    id: str
    content: str
    source: str
    source_type: str
    timestamp: datetime
    confidence: float
    embedding: Optional[List[float]] = None
    metadata: Dict[str, Any] = {}

class CustomEmbeddingModel:
    """Custom embedding model using transformers"""
    
    def __init__(self, model_name: str = "sentence-transformers/all-MiniLM-L6-v2"):
        self.tokenizer = AutoTokenizer.from_pretrained(model_name)
        self.model = AutoModel.from_pretrained(model_name)
        self.model.eval()
        
    def get_embedding(self, text: str) -> List[float]:
        """Generate embedding for input text"""
        inputs = self.tokenizer(text, return_tensors="pt", padding=True, truncation=True, max_length=512)
        with torch.no_grad():
            outputs = self.model(**inputs)
            # Use mean pooling
            embeddings = outputs.last_hidden_state.mean(dim=1)
            return embeddings[0].tolist()

class KnowledgeExtractionService:
    """Service for extracting knowledge from various sources"""
    
    def __init__(self):
        self.embedding_model = CustomEmbeddingModel()
        
    async def extract_from_text(self, text: str, source: str, source_type: str) -> ExtractedKnowledge:
        """Extract knowledge from text content"""
        # Generate embedding
        embedding = self.embedding_model.get_embedding(text)
        
        # Create knowledge item
        knowledge = ExtractedKnowledge(
            id=f"k_{datetime.utcnow().timestamp()}",
            content=text,
            source=source,
            source_type=source_type,
            timestamp=datetime.utcnow(),
            confidence=0.8,  # Default confidence
            embedding=embedding,
            metadata={
                "char_count": len(text),
                "word_count": len(text.split())
            }
        )
        return knowledge
        
    async def extract_from_code(self, code: str, file_path: str) -> ExtractedKnowledge:
        """Extract knowledge from code content"""
        # Generate embedding
        embedding = self.embedding_model.get_embedding(code)
        
        # Create knowledge item with code-specific metadata
        knowledge = ExtractedKnowledge(
            id=f"k_{datetime.utcnow().timestamp()}",
            content=code,
            source=file_path,
            source_type="code",
            timestamp=datetime.utcnow(),
            confidence=0.9,  # Higher confidence for code
            embedding=embedding,
            metadata={
                "file_path": file_path,
                "line_count": len(code.splitlines()),
                "language": self._detect_language(file_path)
            }
        )
        return knowledge
        
    async def extract_from_discussion(self, text: str, participants: List[str]) -> ExtractedKnowledge:
        """Extract knowledge from discussion content"""
        # Generate embedding
        embedding = self.embedding_model.get_embedding(text)
        
        # Create knowledge item with discussion-specific metadata
        knowledge = ExtractedKnowledge(
            id=f"k_{datetime.utcnow().timestamp()}",
            content=text,
            source="discussion",
            source_type="conversation",
            timestamp=datetime.utcnow(),
            confidence=0.7,  # Lower confidence for discussions
            embedding=embedding,
            metadata={
                "participants": participants,
                "message_count": len(text.split("\n"))
            }
        )
        return knowledge
        
    def _detect_language(self, file_path: str) -> str:
        """Detect programming language from file extension"""
        ext = file_path.split(".")[-1].lower()
        language_map = {
            "py": "python",
            "js": "javascript",
            "ts": "typescript",
            "java": "java",
            "cpp": "c++",
            "cs": "c#",
            "go": "golang",
            "rs": "rust",
            "rb": "ruby",
            "php": "php",
            "swift": "swift",
            "kt": "kotlin"
        }
        return language_map.get(ext, "unknown") 