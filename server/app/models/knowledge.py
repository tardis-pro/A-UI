from datetime import datetime
from typing import Dict, List, Optional, Any, Literal
from pydantic import BaseModel, Field
from sqlalchemy import Column, String, Float, Boolean, DateTime, ForeignKey, Table, JSON
from sqlalchemy.orm import relationship
from .base import Base

# Association table for many-to-many relationships between knowledge items
knowledge_relation = Table(
    'knowledge_relation',
    Base.metadata,
    Column('source_id', ForeignKey('knowledgeitem.id'), primary_key=True),
    Column('target_id', ForeignKey('knowledgeitem.id'), primary_key=True),
    Column('relation_type', String(255), nullable=False),
    Column('confidence', Float, default=1.0),
    Column('metadata', JSON, nullable=True),
    Column('created_at', DateTime, default=datetime.utcnow)
)

# Association table for entity-knowledge relationships
entity_knowledge = Table(
    'entity_knowledge',
    Base.metadata,
    Column('entity_id', String(255), primary_key=True),
    Column('entity_type', String(50), primary_key=True),
    Column('knowledge_id', ForeignKey('knowledgeitem.id'), primary_key=True),
    Column('relation_type', String(255), nullable=False),
    Column('created_at', DateTime, default=datetime.utcnow)
)

class KnowledgeSource(BaseModel):
    """Source information for a knowledge item"""
    type: str  # "documentation", "code", "conversation", "issue", etc.
    identifier: str  # File path, URL, issue ID, etc.
    url: Optional[str] = None
    author: Optional[str] = None
    timestamp: Optional[datetime] = None

class KnowledgeItem(Base):
    """Database model for knowledge items"""
    
    content = Column(String(4000), nullable=False)
    type = Column(String(50), nullable=False)  # "explicit", "tacit", "procedural", "contextual"
    subtype = Column(String(100), nullable=True)  # More specific categorization
    source_type = Column(String(50), nullable=False)
    source_identifier = Column(String(255), nullable=False)
    source_url = Column(String(1000), nullable=True)
    source_author = Column(String(255), nullable=True)
    source_timestamp = Column(DateTime, nullable=True)
    confidence = Column(Float, default=1.0)
    is_validated = Column(Boolean, default=False)
    embedding_id = Column(String(255), nullable=True)  # ID in vector database
    
    # JSON fields for flexible storage
    tags = Column(JSON, default=list)
    metadata = Column(JSON, default=dict)
    
    # Relationships (self-referential for knowledge items)
    related_items = relationship(
        "KnowledgeItem",
        secondary=knowledge_relation,
        primaryjoin=(id == knowledge_relation.c.source_id),
        secondaryjoin=(id == knowledge_relation.c.target_id),
        backref="referenced_by"
    )

# Pydantic models for API requests/responses

class KnowledgeSourceModel(BaseModel):
    """Pydantic model for knowledge source"""
    type: str
    identifier: str
    url: Optional[str] = None
    author: Optional[str] = None
    timestamp: Optional[datetime] = None

class KnowledgeRelationModel(BaseModel):
    """Pydantic model for knowledge relationships"""
    target_id: str
    relation_type: str
    confidence: float = 1.0
    metadata: Optional[Dict[str, Any]] = None

class KnowledgeItemModel(BaseModel):
    """Pydantic model for knowledge items"""
    id: Optional[str] = None
    content: str
    type: Literal["explicit", "tacit", "procedural", "contextual"]
    subtype: Optional[str] = None
    source: KnowledgeSourceModel
    tags: List[str] = []
    confidence: float = 1.0
    is_validated: bool = False
    metadata: Dict[str, Any] = Field(default_factory=dict)
    relations: List[KnowledgeRelationModel] = []
    embedding_id: Optional[str] = None
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None
    
    class Config:
        orm_mode = True

class KnowledgeItemCreateRequest(BaseModel):
    """Request model for creating knowledge items"""
    content: str
    type: Literal["explicit", "tacit", "procedural", "contextual"]
    subtype: Optional[str] = None
    source: KnowledgeSourceModel
    tags: List[str] = []
    metadata: Dict[str, Any] = Field(default_factory=dict)
    relations: List[KnowledgeRelationModel] = []

class KnowledgeItemResponse(BaseModel):
    """Response model for knowledge items"""
    item: KnowledgeItemModel
    related_items: List[KnowledgeItemModel] = []

class KnowledgeSearchRequest(BaseModel):
    """Request model for knowledge search"""
    query: str
    types: Optional[List[str]] = None
    subtypes: Optional[List[str]] = None
    tags: Optional[List[str]] = None
    source_types: Optional[List[str]] = None
    min_confidence: float = 0.0
    limit: int = 10
    include_relations: bool = False
    time_range: Optional[Dict[str, datetime]] = None

class KnowledgeSearchResponse(BaseModel):
    """Response model for knowledge search results"""
    results: List[KnowledgeItemModel]
    count: int

class KnowledgeRelationRequest(BaseModel):
    """Request model for creating knowledge relations"""
    source_id: str
    target_id: str
    relation_type: str
    confidence: float = 1.0
    metadata: Optional[Dict[str, Any]] = None

class EntityKnowledgeRequest(BaseModel):
    """Request model for linking entities to knowledge"""
    entity_id: str
    entity_type: str
    knowledge_id: str
    relation_type: str 