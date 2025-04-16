from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks
from typing import List, Dict, Any, Optional
import os

from ..models.code import (
    CodeChunkRequest, 
    CodeChunkResponse, 
    CodeSearchRequest, 
    CodeSearchResponse,
    CodeChunk,
    CodeMetadata
)
from ..services.code_chunker import CodeChunkerService
from ..services.vector_store import VectorStoreService
from ..services.code_embedding import CodeEmbeddingService
from ..core.cache import get_cache_manager

router = APIRouter(prefix="/code", tags=["code"])

# Services dependency injection
async def get_code_chunker_service():
    return CodeChunkerService()
    
async def get_vector_store_service():
    service = VectorStoreService()
    await service.initialize()
    return service
    
async def get_code_embedding_service():
    return CodeEmbeddingService()

@router.post("/process", response_model=CodeChunkResponse)
async def process_code_files(
    request: CodeChunkRequest,
    background_tasks: BackgroundTasks,
    code_chunker_service: CodeChunkerService = Depends(get_code_chunker_service),
    vector_store: VectorStoreService = Depends(get_vector_store_service),
    embedding_service: CodeEmbeddingService = Depends(get_code_embedding_service)
):
    """
    Process code files to extract chunks and metadata.
    
    This endpoint:
    1. Extracts code chunks from the provided files
    2. Extracts metadata for each chunk
    3. Generates embeddings for the chunks
    4. Stores chunks and embeddings in vector DB
    """
    all_chunks = []
    
    # Process each file to extract chunks
    for file_path in request.file_paths:
        if not os.path.exists(file_path):
            raise HTTPException(status_code=404, detail=f"File not found: {file_path}")
        
        # Extract code chunks
        chunks = await code_chunker_service.process_file(file_path)
        
        # Generate embeddings for chunks
        for chunk in chunks:
            embedding = await embedding_service.generate_embedding(chunk.content)
            chunk.embedding = embedding
            
        all_chunks.extend(chunks)
    
    # Store chunks in vector database in background
    if all_chunks:
        background_tasks.add_task(
            vector_store.batch_process_code_chunks,
            all_chunks,
            batch_size=100
        )
    
    return CodeChunkResponse(chunks=all_chunks, count=len(all_chunks))

@router.get("/metadata/{file_path:path}", response_model=List[CodeChunk])
async def get_file_metadata(
    file_path: str,
    code_chunker_service: CodeChunkerService = Depends(get_code_chunker_service)
):
    """Get code chunks and metadata for a specific file"""
    if not os.path.exists(file_path):
        raise HTTPException(status_code=404, detail=f"File not found: {file_path}")
    
    # Process the file to extract chunks and metadata
    chunks = await code_chunker_service.process_file(file_path)
    
    if not chunks:
        raise HTTPException(status_code=404, detail=f"No code chunks found in file: {file_path}")
    
    return chunks

@router.post("/search", response_model=CodeSearchResponse)
async def search_code(
    request: CodeSearchRequest,
    vector_store: VectorStoreService = Depends(get_vector_store_service),
    embedding_service: CodeEmbeddingService = Depends(get_code_embedding_service),
    cache_manager = Depends(get_cache_manager)
):
    """
    Semantic search for code based on query.
    
    This endpoint:
    1. Generates embeddings for the search query
    2. Finds similar code chunks in the vector store
    3. Returns ranked results with metadata
    """
    # Check cache first
    cache_key = f"code_search:{request.query}:{request.limit}:{hash(str(request.filters))}"
    cached_result = await cache_manager.get(cache_key)
    
    if cached_result:
        return cached_result
    
    # Generate embedding for query
    query_embedding = await embedding_service.generate_embedding(request.query)
    
    # Perform semantic search
    results = await vector_store.search_code_chunks(
        query=request.query,
        filters=request.filters,
        limit=request.limit
    )
    
    response = CodeSearchResponse(results=results, count=len(results))
    
    # Cache the result
    await cache_manager.set(cache_key, response, expire=60*15)  # 15 minutes cache
    
    return response

@router.post("/batch-process")
async def batch_process_code(
    request: CodeChunkRequest,
    background_tasks: BackgroundTasks,
    code_chunker_service: CodeChunkerService = Depends(get_code_chunker_service),
    vector_store: VectorStoreService = Depends(get_vector_store_service),
    embedding_service: CodeEmbeddingService = Depends(get_code_embedding_service)
):
    """
    Process large codebases in batches.
    
    This endpoint:
    1. Accepts multiple file paths
    2. Processes them in batches
    3. Stores results incrementally
    """
    total_chunks = 0
    batch_size = 100
    
    for i in range(0, len(request.file_paths), batch_size):
        batch = request.file_paths[i:i + batch_size]
        
        # Process batch
        chunks = []
        for file_path in batch:
            if os.path.exists(file_path):
                file_chunks = await code_chunker_service.process_file(file_path)
                chunks.extend(file_chunks)
                
        # Generate embeddings
        if chunks:
            contents = [chunk.content for chunk in chunks]
            embeddings = await embedding_service.generate_batch_embeddings(contents)
            
            for chunk, embedding in zip(chunks, embeddings):
                chunk.embedding = embedding
                
            # Store in vector DB
            background_tasks.add_task(
                vector_store.batch_process_code_chunks,
                chunks,
                batch_size=100
            )
            
            total_chunks += len(chunks)
            
    return {"message": f"Successfully processed {total_chunks} code chunks"}

@router.get("/stats", response_model=Dict[str, Any])
async def get_code_stats(
    vector_store: VectorStoreService = Depends(get_vector_store_service)
):
    """Get statistics about indexed code"""
    stats = await vector_store.get_code_stats()
    return stats 