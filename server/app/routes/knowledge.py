from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from ..models.knowledge import (
    KnowledgeItemCreateRequest,
    KnowledgeItemResponse,
    KnowledgeSearchRequest,
    KnowledgeSearchResponse,
    KnowledgeRelationRequest,
    EntityKnowledgeRequest,
    KnowledgeItemModel
)
from ..services.knowledge import KnowledgeService
from ..services.vector_store import VectorStoreService
from ..dependencies import get_db, get_current_user

router = APIRouter(prefix="/knowledge", tags=["knowledge"])

def get_knowledge_service(
    db: Session = Depends(get_db),
    vector_store: VectorStoreService = Depends(VectorStoreService)
) -> KnowledgeService:
    """Dependency to get the knowledge service"""
    return KnowledgeService(db, vector_store)

@router.post("/items", response_model=KnowledgeItemModel)
async def create_knowledge_item(
    request: KnowledgeItemCreateRequest,
    service: KnowledgeService = Depends(get_knowledge_service),
    _: dict = Depends(get_current_user)
):
    """Create a new knowledge item"""
    item = await service.create_knowledge_item(
        content=request.content,
        type=request.type,
        subtype=request.subtype,
        source=request.source,
        tags=request.tags,
        metadata=request.metadata,
        relations=request.relations
    )
    
    # Convert to response model
    return KnowledgeItemModel(
        id=item.id,
        content=item.content,
        type=item.type,
        subtype=item.subtype,
        source={
            "type": item.source_type,
            "identifier": item.source_identifier,
            "url": item.source_url,
            "author": item.source_author,
            "timestamp": item.source_timestamp
        },
        tags=item.tags,
        confidence=item.confidence,
        is_validated=item.is_validated,
        metadata=item.metadata,
        embedding_id=item.embedding_id,
        created_at=item.created_at,
        updated_at=item.updated_at
    )

@router.get("/items/{item_id}", response_model=KnowledgeItemResponse)
async def get_knowledge_item(
    item_id: int,
    include_related: bool = False,
    max_depth: int = 1,
    service: KnowledgeService = Depends(get_knowledge_service),
    _: dict = Depends(get_current_user)
):
    """Get a knowledge item by ID with optional related items"""
    item = await service.get_knowledge_item(item_id)
    
    if not item:
        raise HTTPException(status_code=404, detail="Knowledge item not found")
    
    # Convert to response model
    response = KnowledgeItemModel(
        id=item.id,
        content=item.content,
        type=item.type,
        subtype=item.subtype,
        source={
            "type": item.source_type,
            "identifier": item.source_identifier,
            "url": item.source_url,
            "author": item.source_author,
            "timestamp": item.source_timestamp
        },
        tags=item.tags,
        confidence=item.confidence,
        is_validated=item.is_validated,
        metadata=item.metadata,
        embedding_id=item.embedding_id,
        created_at=item.created_at,
        updated_at=item.updated_at
    )
    
    # Get related items if requested
    related_items = []
    if include_related:
        related_data = await service.get_related_knowledge(item_id, max_depth=max_depth)
        
        for data in related_data:
            related_item = data["item"]
            related_items.append(
                KnowledgeItemModel(
                    id=related_item.id,
                    content=related_item.content,
                    type=related_item.type,
                    subtype=related_item.subtype,
                    source={
                        "type": related_item.source_type,
                        "identifier": related_item.source_identifier,
                        "url": related_item.source_url,
                        "author": related_item.source_author,
                        "timestamp": related_item.source_timestamp
                    },
                    tags=related_item.tags,
                    confidence=related_item.confidence,
                    is_validated=related_item.is_validated,
                    metadata={
                        **related_item.metadata,
                        "relation_type": data["relation_type"],
                        "relation_confidence": data["confidence"]
                    },
                    embedding_id=related_item.embedding_id,
                    created_at=related_item.created_at,
                    updated_at=related_item.updated_at
                )
            )
    
    return KnowledgeItemResponse(item=response, related_items=related_items)

@router.post("/search", response_model=KnowledgeSearchResponse)
async def search_knowledge(
    request: KnowledgeSearchRequest,
    service: KnowledgeService = Depends(get_knowledge_service),
    _: dict = Depends(get_current_user)
):
    """Search for knowledge items"""
    items = await service.search_knowledge(
        query=request.query,
        types=request.types,
        subtypes=request.subtypes,
        tags=request.tags,
        source_types=request.source_types,
        min_confidence=request.min_confidence,
        limit=request.limit,
        include_relations=request.include_relations
    )
    
    # Convert to response models
    result_items = []
    for item in items:
        result_items.append(
            KnowledgeItemModel(
                id=item.id,
                content=item.content,
                type=item.type,
                subtype=item.subtype,
                source={
                    "type": item.source_type,
                    "identifier": item.source_identifier,
                    "url": item.source_url,
                    "author": item.source_author,
                    "timestamp": item.source_timestamp
                },
                tags=item.tags,
                confidence=item.confidence,
                is_validated=item.is_validated,
                metadata=item.metadata,
                embedding_id=item.embedding_id,
                created_at=item.created_at,
                updated_at=item.updated_at
            )
        )
    
    return KnowledgeSearchResponse(results=result_items, count=len(result_items))

@router.post("/relations", status_code=201)
async def create_knowledge_relation(
    request: KnowledgeRelationRequest,
    service: KnowledgeService = Depends(get_knowledge_service),
    _: dict = Depends(get_current_user)
):
    """Create a relationship between knowledge items"""
    await service.create_knowledge_relations(
        request.source_id,
        [
            {
                "target_id": request.target_id,
                "relation_type": request.relation_type,
                "confidence": request.confidence,
                "metadata": request.metadata
            }
        ]
    )
    
    return {"message": "Relation created successfully"}

@router.post("/entity-links", status_code=201)
async def link_entity_to_knowledge(
    request: EntityKnowledgeRequest,
    service: KnowledgeService = Depends(get_knowledge_service),
    _: dict = Depends(get_current_user)
):
    """Link an entity to a knowledge item"""
    success = await service.link_entity_to_knowledge(
        request.entity_id,
        request.entity_type,
        request.knowledge_id,
        request.relation_type
    )
    
    if not success:
        raise HTTPException(status_code=404, detail="Knowledge item not found")
    
    return {"message": "Entity linked successfully"}

@router.get("/entity/{entity_id}", response_model=List[KnowledgeItemModel])
async def get_knowledge_for_entity(
    entity_id: str,
    entity_type: Optional[str] = None,
    service: KnowledgeService = Depends(get_knowledge_service),
    _: dict = Depends(get_current_user)
):
    """Get knowledge items linked to a specific entity"""
    items = await service.get_knowledge_for_entity(entity_id, entity_type)
    
    # Convert to response models
    result_items = []
    for item in items:
        result_items.append(
            KnowledgeItemModel(
                id=item.id,
                content=item.content,
                type=item.type,
                subtype=item.subtype,
                source={
                    "type": item.source_type,
                    "identifier": item.source_identifier,
                    "url": item.source_url,
                    "author": item.source_author,
                    "timestamp": item.source_timestamp
                },
                tags=item.tags,
                confidence=item.confidence,
                is_validated=item.is_validated,
                metadata=item.metadata,
                embedding_id=item.embedding_id,
                created_at=item.created_at,
                updated_at=item.updated_at
            )
        )
    
    return result_items

@router.post("/extract/text", response_model=List[KnowledgeItemModel])
async def extract_knowledge_from_text(
    content: str,
    source_type: str,
    source_identifier: str,
    source_url: Optional[str] = None,
    source_author: Optional[str] = None,
    knowledge_type: str = "explicit",
    subtype: Optional[str] = None,
    tags: List[str] = Query(default=[]),
    service: KnowledgeService = Depends(get_knowledge_service),
    _: dict = Depends(get_current_user)
):
    """Extract knowledge items from text content"""
    source = {
        "type": source_type,
        "identifier": source_identifier,
        "url": source_url,
        "author": source_author
    }
    
    items = await service.extract_knowledge_from_text(
        content=content,
        source=source,
        type=knowledge_type,
        subtype=subtype,
        tags=tags
    )
    
    # Convert to response models
    result_items = []
    for item in items:
        result_items.append(
            KnowledgeItemModel(
                id=item.id,
                content=item.content,
                type=item.type,
                subtype=item.subtype,
                source={
                    "type": item.source_type,
                    "identifier": item.source_identifier,
                    "url": item.source_url,
                    "author": item.source_author,
                    "timestamp": item.source_timestamp
                },
                tags=item.tags,
                confidence=item.confidence,
                is_validated=item.is_validated,
                metadata=item.metadata,
                embedding_id=item.embedding_id,
                created_at=item.created_at,
                updated_at=item.updated_at
            )
        )
    
    return result_items

@router.post("/extract/conversation", response_model=List[KnowledgeItemModel])
async def extract_knowledge_from_conversation(
    content: str,
    source_type: str,
    source_identifier: str,
    source_url: Optional[str] = None,
    source_author: Optional[str] = None,
    tags: List[str] = Query(default=[]),
    service: KnowledgeService = Depends(get_knowledge_service),
    _: dict = Depends(get_current_user)
):
    """Extract knowledge from conversation content"""
    source = {
        "type": source_type,
        "identifier": source_identifier,
        "url": source_url,
        "author": source_author
    }
    
    items = await service.extract_knowledge_from_conversation(
        content=content,
        source=source,
        tags=tags
    )
    
    # Convert to response models
    result_items = []
    for item in items:
        result_items.append(
            KnowledgeItemModel(
                id=item.id,
                content=item.content,
                type=item.type,
                subtype=item.subtype,
                source={
                    "type": item.source_type,
                    "identifier": item.source_identifier,
                    "url": item.source_url,
                    "author": item.source_author,
                    "timestamp": item.source_timestamp
                },
                tags=item.tags,
                confidence=item.confidence,
                is_validated=item.is_validated,
                metadata=item.metadata,
                embedding_id=item.embedding_id,
                created_at=item.created_at,
                updated_at=item.updated_at
            )
        )
    
    return result_items 