from typing import List, Dict, Any, Optional
from datetime import datetime
from pydantic import BaseModel
from neo4j import GraphDatabase
import hashlib

class Source(BaseModel):
    """Represents a knowledge source"""
    id: str
    name: str
    type: str  # e.g., "file", "api", "database", "user_input"
    location: str
    created_at: datetime
    last_updated: datetime
    metadata: Dict[str, Any] = {}
    checksum: Optional[str] = None

class SourceUpdate(BaseModel):
    """Represents a source update event"""
    source_id: str
    timestamp: datetime
    changes: Dict[str, Any]
    metadata: Dict[str, Any] = {}

class SourceManagementService:
    """Service for managing knowledge sources"""
    
    def __init__(self, neo4j_uri: str, neo4j_user: str, neo4j_password: str):
        self.driver = GraphDatabase.driver(neo4j_uri, auth=(neo4j_user, neo4j_password))
        
    async def register_source(self, source: Source) -> str:
        """Register a new knowledge source"""
        query = """
        CREATE (s:Source {
            id: $id,
            name: $name,
            type: $type,
            location: $location,
            created_at: datetime($created_at),
            last_updated: datetime($last_updated),
            metadata: $metadata,
            checksum: $checksum
        })
        RETURN s.id
        """
        with self.driver.session() as session:
            result = session.run(query,
                id=source.id,
                name=source.name,
                type=source.type,
                location=source.location,
                created_at=source.created_at.isoformat(),
                last_updated=source.last_updated.isoformat(),
                metadata=source.metadata,
                checksum=source.checksum
            )
            return result.single()[0]
            
    async def update_source(self, source_id: str, update: SourceUpdate) -> None:
        """Record a source update"""
        query = """
        MATCH (s:Source {id: $source_id})
        SET s.last_updated = datetime($timestamp),
            s.metadata = $metadata
        CREATE (u:SourceUpdate {
            source_id: $source_id,
            timestamp: datetime($timestamp),
            changes: $changes,
            metadata: $update_metadata
        })
        CREATE (s)-[:HAS_UPDATE]->(u)
        """
        with self.driver.session() as session:
            session.run(query,
                source_id=source_id,
                timestamp=update.timestamp.isoformat(),
                metadata=update.metadata,
                changes=update.changes,
                update_metadata=update.metadata
            )
            
    async def get_source_history(self, source_id: str) -> List[Dict]:
        """Get update history for a source"""
        query = """
        MATCH (s:Source {id: $source_id})-[:HAS_UPDATE]->(u:SourceUpdate)
        RETURN u
        ORDER BY u.timestamp DESC
        """
        with self.driver.session() as session:
            result = session.run(query, source_id=source_id)
            return [dict(record["u"]) for record in result]
            
    async def calculate_checksum(self, content: str) -> str:
        """Calculate SHA-256 checksum for content"""
        return hashlib.sha256(content.encode()).hexdigest()
        
    async def verify_source_integrity(self, source_id: str, content: str) -> bool:
        """Verify source content integrity using stored checksum"""
        query = """
        MATCH (s:Source {id: $source_id})
        RETURN s.checksum
        """
        with self.driver.session() as session:
            result = session.run(query, source_id=source_id)
            stored_checksum = result.single()[0]
            
        current_checksum = await self.calculate_checksum(content)
        return stored_checksum == current_checksum
        
    async def link_sources(self, source_id1: str, source_id2: str, relation_type: str) -> None:
        """Create a relationship between two sources"""
        query = """
        MATCH (s1:Source {id: $source_id1})
        MATCH (s2:Source {id: $source_id2})
        CREATE (s1)-[r:RELATES_TO {type: $relation_type}]->(s2)
        """
        with self.driver.session() as session:
            session.run(query,
                source_id1=source_id1,
                source_id2=source_id2,
                relation_type=relation_type
            )
            
    async def get_related_sources(self, source_id: str) -> List[Dict]:
        """Get sources related to the given source"""
        query = """
        MATCH (s:Source {id: $source_id})-[r:RELATES_TO]-(related:Source)
        RETURN related, type(r) as relation_type
        """
        with self.driver.session() as session:
            result = session.run(query, source_id=source_id)
            return [{
                "source": dict(record["related"]),
                "relation_type": record["relation_type"]
            } for record in result]
            
    def close(self):
        """Close the Neo4j driver connection"""
        self.driver.close()

import os

async def get_all_files(path: str = ".") -> List[str]:
    """Get a list of all files in the project"""
    all_files = []
    for root, _, files in os.walk(path):
        for file in files:
            all_files.append(os.path.join(root, file))
    return all_files