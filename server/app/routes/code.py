from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks
from typing import List, Dict, Any, Optional
import os
from ..services import code_tokenizer, code_embedding_generator, similarity_search, source_management

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
from ..services.code_tokenizer import tokenize_code
from ..services.code_embedding_generator import CodeEmbeddingGenerator
from ..services.similarity_search import find_similar_codes
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

async def get_code_embedding_generator():
    return code_embedding_generator.CodeEmbeddingGenerator()

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
    code_embedding_generator: CodeEmbeddingGenerator = Depends(get_code_embedding_generator),
    cache_manager = Depends(get_cache_manager)
):
    """
    Semantic search for code based on query.
    
    This endpoint:
    1. Generates embeddings for the search query
    2. Finds similar code chunks using cosine similarity
    3. Returns ranked results with metadata
    """
    # Tokenize the query
    query_tokens = tokenize_code(request.query)
    
    # Get all files in the project
    all_files = await source_management.get_all_files()
    
    # Create a code chunk for each file
    all_chunks = []
    for file_path in all_files:
        try:
            # Check if the file is in the cache
            cached_content = await cache_manager.get(file_path)
            if cached_content:
                content = cached_content
            else:
                # Check if the file is a binary file
                if file_path.endswith((".png", ".jpg", ".jpeg", ".gif", ".bmp", ".pdf", ".ico")):
                    print(f"Skipping binary file: {file_path}")
                    continue
                    
                # Read the file contents
                with open(file_path, "r") as f:
                    content = f.read()
                    
                # Store the file contents in the cache
                await cache_manager.set(file_path, content)
                
            chunk = CodeChunk(file_path=file_path, content=content)
            all_chunks.append(chunk)
        except Exception as e:
            print(f"Error reading file {file_path}: {e}")
            continue
    
    # Find similar code chunks using AST-based search
    top_indices, similarities = find_similar_codes(request.query, all_chunks, top_n=request.limit)
    
    # Prepare the results
    results = [all_chunks[i] for i in top_indices]
    
    response = CodeSearchResponse(results=results, count=len(results))
    
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
from fastapi import APIRouter, HTTPException
from server.app.services import create_python_agent

router = APIRouter()

@router.post("/analyze_code")
async def analyze_code(code: str):
    try:
        agent = create_python_agent()
        analysis = agent(code)
        return {"analysis": analysis}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))