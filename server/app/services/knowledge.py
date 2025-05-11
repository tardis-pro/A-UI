from typing import Dict, List, Optional, Any, Union
from datetime import datetime
import re
import json
from uuid import uuid4
from sqlalchemy.orm import Session
from sqlalchemy import select, and_, or_, text

from ..models.knowledge import (
    KnowledgeItem, 
    KnowledgeSourceModel, 
    KnowledgeItemModel, 
    KnowledgeRelationModel, 
    knowledge_relation,
    entity_knowledge
)
from .vector_store import VectorStoreService

class KnowledgeService:
    """Service for managing knowledge items, relationships, and extraction"""
    
    def __init__(self, db: Session, vector_store: VectorStoreService):
        self.db = db
        self.vector_store = vector_store
        self.collection_name = "knowledge_items"
    
    async def initialize(self):
        """Initialize the knowledge service"""
        await self.vector_store.create_collection(self.collection_name)
    
    async def create_knowledge_item(
        self, 
        content: str,
        type: str,
        source: KnowledgeSourceModel,
        subtype: Optional[str] = None,
        tags: List[str] = [],
        metadata: Dict[str, Any] = {},
        confidence: float = 1.0,
        relations: List[KnowledgeRelationModel] = []
    ) -> KnowledgeItem:
        """Create a new knowledge item"""
        # Create knowledge item in database
        item = KnowledgeItem(
            content=content,
            type=type,
            subtype=subtype,
            source_type=source.type,
            source_identifier=source.identifier,
            source_url=source.url,
            source_author=source.author,
            source_timestamp=source.timestamp,
            tags=tags,
            metadata=metadata,
            confidence=confidence
        )
        
        self.db.add(item)
        self.db.commit()
        self.db.refresh(item)
        
        # Generate embedding and store in vector DB
        embedding_id = await self._add_to_vector_store(item)
        
        # Update with embedding ID
        item.embedding_id = embedding_id
        self.db.commit()
        
        # Create relationships if provided
        if relations:
            await self.create_knowledge_relations(item.id, relations)
        
        return item
    
    async def _add_to_vector_store(self, item: KnowledgeItem) -> str:
        """Add knowledge item to vector store"""
        embedding_id = str(uuid4())
        
        # Prepare metadata for vector store
        metadata = {
            "id": item.id,
            "type": item.type,
            "subtype": item.subtype,
            "source_type": item.source_type,
            "source_identifier": item.source_identifier,
            "tags": json.dumps(item.tags),
            "confidence": item.confidence,
            "created_at": item.created_at.isoformat()
        }
        
        # Add to vector store
        await self.vector_store.add_documents(
            self.collection_name,
            [
                {
                    "id": embedding_id,
                    "text": item.content,
                    "metadata": metadata
                }
            ]
        )
        
        return embedding_id
    
    async def get_knowledge_item(self, item_id: int) -> Optional[KnowledgeItem]:
        """Get a knowledge item by ID"""
        return self.db.query(KnowledgeItem).filter(KnowledgeItem.id == item_id).first()
    
    async def search_knowledge(
        self,
        query: str,
        types: Optional[List[str]] = None,
        subtypes: Optional[List[str]] = None,
        tags: Optional[List[str]] = None,
        source_types: Optional[List[str]] = None,
        min_confidence: float = 0.0,
        limit: int = 10,
        include_relations: bool = False,
        time_range: Optional[Dict[str, datetime]] = None
    ) -> List[KnowledgeItem]:
        """Search for knowledge items by semantic similarity"""
        # First, search in vector database
        where_clause = {}
        
        if types:
            where_clause["type"] = {"$in": types}
        
        if min_confidence > 0:
            where_clause["confidence"] = {"$gte": min_confidence}
        
        if source_types:
            where_clause["source_type"] = {"$in": source_types}
        
        # Perform vector search
        search_results = await self.vector_store.search(
            self.collection_name,
            query,
            n_results=limit,
            where=where_clause
        )
        
        # Get item IDs from results
        item_ids = [int(result["metadata"]["id"]) for result in search_results]
        
        if not item_ids:
            return []
        
        # Query database for these items
        items = self.db.query(KnowledgeItem).filter(KnowledgeItem.id.in_(item_ids))

        # Apply time range filter
        if time_range:
            start_time = time_range.get("start")
            end_time = time_range.get("end")
            if start_time:
                items = items.filter(KnowledgeItem.source_timestamp >= start_time)
            if end_time:
                items = items.filter(KnowledgeItem.source_timestamp <= end_time)

        # Apply additional filters
        if subtypes:
            items = items.filter(KnowledgeItem.subtype.in_(subtypes))
        
        if tags:
            # Note: Filtering by JSON array elements requires special handling
            # This is a simplified approach that works for PostgreSQL
            tag_conditions = []
            for tag in tags:
                tag_conditions.append(
                    text(f"tags @> '[{tag}]'")
                )
            items = items.filter(or_(*tag_conditions))
        
        # Get results
        items = items.all()
        
        # Load related items if requested
        if include_relations:
            for item in items:
                item.related_items
        
        return items
    
    async def create_knowledge_relations(
        self,
        source_id: int,
        relations: List[KnowledgeRelationModel]
    ) -> None:
        """Create relationships between knowledge items"""
        for relation in relations:
            # Check if target exists
            target = await self.get_knowledge_item(relation.target_id)
            if not target:
                continue
            
            # Create relation in the association table
            stmt = knowledge_relation.insert().values(
                source_id=source_id,
                target_id=relation.target_id,
                relation_type=relation.relation_type,
                confidence=relation.confidence,
                metadata=relation.metadata or {}
            )
            self.db.execute(stmt)
        
        self.db.commit()
    
    async def link_entity_to_knowledge(
        self,
        entity_id: str,
        entity_type: str,
        knowledge_id: int,
        relation_type: str
    ) -> bool:
        """Link an entity (code, discussion, etc.) to a knowledge item"""
        # Check if knowledge item exists
        knowledge = await self.get_knowledge_item(knowledge_id)
        if not knowledge:
            return False
        
        # Create entity relationship
        stmt = entity_knowledge.insert().values(
            entity_id=entity_id,
            entity_type=entity_type,
            knowledge_id=knowledge_id,
            relation_type=relation_type
        )
        self.db.execute(stmt)
        self.db.commit()
        
        return True
    
    async def get_knowledge_for_entity(
        self,
        entity_id: str,
        entity_type: Optional[str] = None
    ) -> List[KnowledgeItem]:
        """Get knowledge items linked to a specific entity"""
        query = select(KnowledgeItem).join(
            entity_knowledge,
            KnowledgeItem.id == entity_knowledge.c.knowledge_id
        ).where(entity_knowledge.c.entity_id == entity_id)
        
        if entity_type:
            query = query.where(entity_knowledge.c.entity_type == entity_type)
        
        result = self.db.execute(query)
        return result.scalars().all()

    async def update_knowledge_item(
        self,
        item_id: int,
        content: Optional[str] = None,
        type: Optional[str] = None,
        subtype: Optional[str] = None,
        tags: Optional[List[str]] = None,
        metadata: Optional[Dict[str, Any]] = None,
        confidence: Optional[float] = None
    ) -> Optional[KnowledgeItem]:
        """Update an existing knowledge item"""
        item = await self.get_knowledge_item(item_id)
        if not item:
            return None

        if content is not None:
            item.content = content
        if type is not None:
            item.type = type
        if subtype is not None:
            item.subtype = subtype
        if tags is not None:
            item.tags = tags
        if metadata is not None:
            item.metadata = metadata
        if confidence is not None:
            item.confidence = confidence

        self.db.commit()
        self.db.refresh(item)

        # Update embedding in vector DB
        if content is not None:
            await self._update_vector_store(item)

        return item

    async def _update_vector_store(self, item: KnowledgeItem) -> None:
        """Update knowledge item in vector store"""
        if not item.embedding_id:
            return

        # Prepare metadata for vector store
        metadata = {
            "id": item.id,
            "type": item.type,
            "subtype": item.subtype,
            "source_type": item.source_type,
            "source_identifier": item.source_identifier,
            "tags": json.dumps(item.tags),
            "confidence": item.confidence,
            "created_at": item.created_at.isoformat()
        }

        # Update in vector store
        await self.vector_store.add_documents(
            self.collection_name,
            [
                {
                    "id": item.embedding_id,
                    "text": item.content,
                    "metadata": metadata
                }
            ]
        )

    async def delete_knowledge_item(self, item_id: int) -> bool:
        """Delete a knowledge item"""
        item = await self.get_knowledge_item(item_id)
        if not item:
            return False

        self.db.delete(item)
        self.db.commit()

        # Delete from vector DB
        if item.embedding_id:
            await self.vector_store.delete_documents(self.collection_name, [item.embedding_id])

        return True

    async def extract_knowledge_from_text(
        self,
        content: str,
        source: KnowledgeSourceModel,
        type: str = "explicit",
        subtype: Optional[str] = None,
        tags: List[str] = [],
        metadata: Dict[str, Any] = {}
    ) -> List[KnowledgeItem]:
        """Extract knowledge items from text content"""
        items = []
        
        # Simple extraction: split by sections for documentation
        sections = self._split_into_sections(content)
        
        for section in sections:
            if not section.get("content", "").strip():
                continue
            
            # Create section-based tags
            section_tags = tags.copy()
            if section.get("title"):
                section_tags.append(f"section:{section['title']}")
            
            # Create section metadata
            section_metadata = metadata.copy()
            if section.get("title"):
                section_metadata["section_title"] = section["title"]
            
            # Create knowledge item
            item = await self.create_knowledge_item(
                content=section["content"],
                type=type,
                subtype=subtype,
                source=source,
                tags=section_tags,
                metadata=section_metadata
            )
            
            items.append(item)
        
        return items
    
    async def extract_knowledge_from_conversation(
        self,
        content: str,
        source: KnowledgeSourceModel,
        tags: List[str] = [],
        metadata: Dict[str, Any] = {}
    ) -> List[KnowledgeItem]:
        """Extract knowledge from conversation content (e.g., PR comments, discussions)"""
        items = []
        
        # Split into messages
        messages = self._split_into_messages(content)
        
        for message in messages:
            if len(message.get("content", "").strip()) < 10:
                continue
            
            # Classify the message
            message_type = self._classify_message(message["content"])
            
            # Set message-specific tags
            message_tags = tags.copy()
            message_tags.append(message_type)
            
            # Create message-specific metadata
            message_metadata = metadata.copy()
            if message.get("author"):
                message_metadata["author"] = message["author"]
            if message.get("timestamp"):
                message_metadata["timestamp"] = message["timestamp"]
            
            # Create knowledge item
            item = await self.create_knowledge_item(
                content=message["content"],
                type="tacit",  # Conversations are typically tacit knowledge
                source=source,
                tags=message_tags,
                metadata=message_metadata
            )
            
            items.append(item)
        
        return items
    
    def _split_into_sections(self, content: str) -> List[Dict[str, str]]:
        """Split content into sections based on headings"""
        # Simple regex-based section splitter
        sections = []
        
        # Match Markdown headings of various levels
        headings = re.finditer(r'^(#{1,6})\s+(.+)$', content, re.MULTILINE)
        
        last_pos = 0
        last_title = None
        
        for match in headings:
            heading_pos = match.start()
            heading_text = match.group(2).strip()
            
            # If we have content from a previous section, add it
            if last_pos < heading_pos and last_title:
                section_content = content[last_pos:heading_pos].strip()
                sections.append({
                    "title": last_title,
                    "content": section_content
                })
            
            last_pos = match.end()
            last_title = heading_text
        
        # Add the last section
        if last_pos < len(content) and last_title:
            section_content = content[last_pos:].strip()
            sections.append({
                "title": last_title,
                "content": section_content
            })
        
        # If no sections were found, treat the entire content as one section
        if not sections:
            sections.append({
                "title": "Content",
                "content": content
            })
        
        return sections
    
    def _split_into_messages(self, content: str) -> List[Dict[str, Any]]:
        """Split conversation content into individual messages"""
        # Simple regex-based message splitter
        messages = []
        
        # Pattern for message format like: "username: message content"
        message_pattern = r'^([^:]+):\s*(.+(?:\n(?!\S+:).+)*)$'
        
        for match in re.finditer(message_pattern, content, re.MULTILINE):
            author = match.group(1).strip()
            message_content = match.group(2).strip()
            
            messages.append({
                "author": author,
                "content": message_content,
                "timestamp": None  # Could be extracted if available in the format
            })
        
        # If no messages were found, treat the entire content as one message
        if not messages:
            messages.append({
                "author": "Unknown",
                "content": content,
                "timestamp": None
            })
        
        return messages
    
    def _classify_message(self, content: str) -> str:
        """Classify a message into a tag/category"""
        # Simple rule-based classification
        lower_content = content.lower()
        
        if any(keyword in lower_content for keyword in ["decision", "decided", "choose", "selected", "agreement"]):
            return "decision"
        
        if any(keyword in lower_content for keyword in ["problem", "issue", "bug", "error", "fail"]):
            return "problem"
        
        if any(keyword in lower_content for keyword in ["solution", "fixed", "resolved", "implemented", "addressed"]):
            return "solution"
        
        if any(keyword in lower_content for keyword in ["question", "?"]):
            return "question"
        
        if any(keyword in lower_content for keyword in ["todo", "task", "should", "need to", "must", "implement"]):
            return "todo"
        
        if any(keyword in lower_content for keyword in ["idea", "suggest", "proposal", "concept", "consider"]):
            return "idea"
        
        # Default classification
        return "information"
        
    async def get_related_knowledge(
        self,
        item_id: int,
        relation_types: Optional[List[str]] = None,
        max_depth: int = 1
    ) -> List[Dict[str, Any]]:
        """Get knowledge items related to the given item, up to a maximum depth"""
        if max_depth <= 0:
            return []
        
        # Start with the direct relationships
        query = select(
            KnowledgeItem,
            knowledge_relation.c.relation_type,
            knowledge_relation.c.confidence
        ).join(
            knowledge_relation,
            and_(
                KnowledgeItem.id == knowledge_relation.c.target_id,
                knowledge_relation.c.source_id == item_id
            )
        )
        
        if relation_types:
            query = query.where(knowledge_relation.c.relation_type.in_(relation_types))
        
        result = self.db.execute(query)
        related_items = []
        
        for row in result:
            item, relation_type, confidence = row
            
            # Process the item
            item_data = {
                "item": item,
                "relation_type": relation_type,
                "confidence": confidence,
                "related_items": []
            }
            
            # Recursively get deeper relationships if needed
            if max_depth > 1:
                item_data["related_items"] = await self.get_related_knowledge(
                    item.id,
                    relation_types,
                    max_depth - 1
                )
            
            related_items.append(item_data)
        
        return related_items 