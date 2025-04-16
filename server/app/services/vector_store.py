from typing import List, Optional, Dict, Any
import chromadb
from chromadb.config import Settings
from pydantic import BaseModel

from ..models.code import CodeChunk, CodeMetadata
from ..config import get_settings

settings = get_settings()

class VectorDocument(BaseModel):
    """Model for vector store document"""
    id: str
    text: str
    metadata: Optional[dict] = None

class VectorStoreService:
    """Service for managing vector embeddings using ChromaDB"""
    
    def __init__(self):
        self.client = chromadb.PersistentClient(
            path=settings.VECTOR_DB_PATH,
            settings=Settings(
                anonymized_telemetry=False,
                allow_reset=True
            )
        )
        self.code_collection_name = "code_chunks"
        
    async def initialize(self):
        """Initialize collections"""
        try:
            self.client.create_collection(name=self.code_collection_name)
        except ValueError:  # Collection already exists
            pass
            
    async def add_code_chunks(self, chunks: List[CodeChunk]) -> None:
        """Add code chunks to vector store"""
        collection = self.client.get_collection(self.code_collection_name)
        
        # Prepare data for insertion
        ids = [chunk.id for chunk in chunks]
        texts = [chunk.content for chunk in chunks]
        metadatas = []
        
        for chunk in chunks:
            metadata = {
                'type': chunk.type,
                'language': chunk.language,
                'file_path': chunk.file_path,
                'line_start': chunk.line_start,
                'line_end': chunk.line_end,
                'complexity': chunk.metadata.complexity.get('cyclomatic', 1) if chunk.metadata.complexity else 1,
                'author': chunk.metadata.git.get('author') if chunk.metadata.git else None,
                'last_modified': chunk.metadata.git.get('last_modified') if chunk.metadata.git else None
            }
            metadatas.append(metadata)
            
        # Add to collection
        collection.add(
            ids=ids,
            documents=texts,
            metadatas=metadatas
        )
        
    async def search_code_chunks(
        self,
        query: str,
        filters: Optional[Dict[str, Any]] = None,
        limit: int = 10
    ) -> List[CodeChunk]:
        """Search for similar code chunks"""
        collection = self.client.get_collection(self.code_collection_name)
        
        # Prepare filter conditions
        where = {}
        if filters:
            if 'language' in filters:
                where['language'] = filters['language']
            if 'type' in filters:
                where['type'] = filters['type']
            if 'max_complexity' in filters:
                where['complexity'] = {'$lte': filters['max_complexity']}
                
        # Perform search
        results = collection.query(
            query_texts=[query],
            n_results=limit,
            where=where
        )
        
        # Convert results to CodeChunks
        chunks = []
        for i in range(len(results['ids'][0])):
            metadata = results['metadatas'][0][i]
            
            chunk = CodeChunk(
                id=results['ids'][0][i],
                content=results['documents'][0][i],
                type=metadata['type'],
                language=metadata['language'],
                file_path=metadata['file_path'],
                line_start=metadata['line_start'],
                line_end=metadata['line_end'],
                metadata=CodeMetadata(
                    complexity={'cyclomatic': metadata.get('complexity', 1)},
                    git={
                        'author': metadata.get('author'),
                        'last_modified': metadata.get('last_modified')
                    }
                )
            )
            chunks.append(chunk)
            
        return chunks
        
    async def batch_process_code_chunks(
        self,
        chunks: List[CodeChunk],
        batch_size: int = 100
    ) -> None:
        """Process and store code chunks in batches"""
        for i in range(0, len(chunks), batch_size):
            batch = chunks[i:i + batch_size]
            await self.add_code_chunks(batch)
        
    async def create_collection(self, name: str) -> None:
        """Create a new collection"""
        try:
            self.client.create_collection(name=name)
        except ValueError:  # Collection already exists
            pass
            
    async def add_documents(
        self,
        collection_name: str,
        documents: List[VectorDocument]
    ) -> None:
        """Add documents to collection"""
        collection = self.client.get_collection(collection_name)
        
        # Prepare data for insertion
        ids = [doc.id for doc in documents]
        texts = [doc.text for doc in documents]
        metadatas = [doc.metadata or {} for doc in documents]
        
        # Add to collection
        collection.add(
            ids=ids,
            documents=texts,
            metadatas=metadatas
        )
        
    async def search(
        self,
        collection_name: str,
        query: str,
        n_results: int = 5,
        where: Optional[dict] = None
    ) -> List[VectorDocument]:
        """Search for similar documents"""
        collection = self.client.get_collection(collection_name)
        
        results = collection.query(
            query_texts=[query],
            n_results=n_results,
            where=where
        )
        
        # Convert results to VectorDocuments
        documents = []
        for i in range(len(results['ids'][0])):
            doc = VectorDocument(
                id=results['ids'][0][i],
                text=results['documents'][0][i],
                metadata=results['metadatas'][0][i] if results['metadatas'] else None
            )
            documents.append(doc)
            
        return documents
        
    async def delete_documents(
        self,
        collection_name: str,
        ids: List[str]
    ) -> None:
        """Delete documents from collection"""
        collection = self.client.get_collection(collection_name)
        collection.delete(ids=ids)
        
    async def get_document(
        self,
        collection_name: str,
        id: str
    ) -> Optional[VectorDocument]:
        """Get a specific document by ID"""
        collection = self.client.get_collection(collection_name)
        
        try:
            result = collection.get(ids=[id])
            if result['ids']:
                return VectorDocument(
                    id=result['ids'][0],
                    text=result['documents'][0],
                    metadata=result['metadatas'][0] if result['metadatas'] else None
                )
        except:
            return None
            
        return None

# Create singleton instance
vector_store = VectorStoreService() 