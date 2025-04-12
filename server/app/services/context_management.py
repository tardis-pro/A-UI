from typing import Dict, List, Optional, Any
from datetime import datetime
from neo4j import GraphDatabase
from pydantic import BaseModel

class ContextNode(BaseModel):
    """Represents a context node in the knowledge graph"""
    id: str
    type: str
    content: str
    timestamp: datetime
    metadata: Dict[str, Any] = {}
    embedding: Optional[List[float]] = None

class ContextManagementService:
    """Service for managing context in the knowledge graph"""
    
    def __init__(self, uri: str, user: str, password: str):
        self.driver = GraphDatabase.driver(uri, auth=(user, password))
        
    async def create_context(self, context: ContextNode) -> str:
        """Create a new context node in Neo4j"""
        query = """
        CREATE (c:Context {
            id: $id,
            type: $type,
            content: $content,
            timestamp: datetime($timestamp),
            metadata: $metadata,
            embedding: $embedding
        })
        RETURN c.id
        """
        with self.driver.session() as session:
            result = session.run(query, 
                id=context.id,
                type=context.type,
                content=context.content,
                timestamp=context.timestamp.isoformat(),
                metadata=context.metadata,
                embedding=context.embedding
            )
            return result.single()[0]
            
    async def link_contexts(self, source_id: str, target_id: str, relation_type: str) -> None:
        """Create a relationship between two context nodes"""
        query = """
        MATCH (source:Context {id: $source_id})
        MATCH (target:Context {id: $target_id})
        CREATE (source)-[r:RELATES_TO {type: $relation_type}]->(target)
        """
        with self.driver.session() as session:
            session.run(query,
                source_id=source_id,
                target_id=target_id,
                relation_type=relation_type
            )
            
    async def get_related_contexts(self, context_id: str, max_depth: int = 2) -> List[Dict]:
        """Get contexts related to the given context up to max_depth"""
        query = """
        MATCH path = (source:Context {id: $context_id})-[*1..$max_depth]-(related:Context)
        RETURN related, length(path) as depth
        ORDER BY depth
        """
        with self.driver.session() as session:
            result = session.run(query,
                context_id=context_id,
                max_depth=max_depth
            )
            return [dict(record["related"]) for record in result]
            
    async def update_context(self, context: ContextNode) -> None:
        """Update an existing context node"""
        query = """
        MATCH (c:Context {id: $id})
        SET c.content = $content,
            c.metadata = $metadata,
            c.embedding = $embedding,
            c.timestamp = datetime($timestamp)
        """
        with self.driver.session() as session:
            session.run(query,
                id=context.id,
                content=context.content,
                metadata=context.metadata,
                embedding=context.embedding,
                timestamp=context.timestamp.isoformat()
            )
            
    async def delete_context(self, context_id: str) -> None:
        """Delete a context node and its relationships"""
        query = """
        MATCH (c:Context {id: $context_id})
        DETACH DELETE c
        """
        with self.driver.session() as session:
            session.run(query, context_id=context_id)
            
    def close(self):
        """Close the Neo4j driver connection"""
        self.driver.close() 