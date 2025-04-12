from typing import List, Optional
from transformers import AutoTokenizer, AutoModel
import torch
from pydantic import BaseModel

class CodeEmbeddingService:
    """Service for generating embeddings from code chunks"""
    
    def __init__(self, model_name: str = "microsoft/codebert-base"):
        self.tokenizer = AutoTokenizer.from_pretrained(model_name)
        self.model = AutoModel.from_pretrained(model_name)
        self.model.eval()
        
    async def generate_embedding(self, code: str) -> List[float]:
        """Generate embedding for a code chunk"""
        # Tokenize and prepare input
        inputs = self.tokenizer(
            code,
            padding=True,
            truncation=True,
            max_length=512,
            return_tensors="pt"
        )
        
        # Generate embedding
        with torch.no_grad():
            outputs = self.model(**inputs)
            # Use mean pooling over token embeddings
            embedding = outputs.last_hidden_state.mean(dim=1)
            
        return embedding[0].tolist()
        
    async def generate_batch_embeddings(self, code_chunks: List[str]) -> List[List[float]]:
        """Generate embeddings for multiple code chunks in batch"""
        # Tokenize all chunks
        inputs = self.tokenizer(
            code_chunks,
            padding=True,
            truncation=True,
            max_length=512,
            return_tensors="pt"
        )
        
        # Generate embeddings
        with torch.no_grad():
            outputs = self.model(**inputs)
            # Use mean pooling over token embeddings for each chunk
            embeddings = outputs.last_hidden_state.mean(dim=1)
            
        return embeddings.tolist() 