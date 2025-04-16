from typing import List, Dict, Any, Optional
from datetime import datetime
from pydantic import BaseModel
from neo4j import GraphDatabase
import numpy as np
from .knowledge_extraction import CustomEmbeddingModel

class ClassificationLabel(BaseModel):
    """Represents a classification label with metadata"""
    id: str
    name: str
    description: str
    parent_id: Optional[str] = None
    metadata: Dict[str, Any] = {}

class ClassificationResult(BaseModel):
    """Represents a classification result"""
    content_id: str
    labels: List[str]
    confidence_scores: Dict[str, float]
    timestamp: datetime
    metadata: Dict[str, Any] = {}

class ClassificationService:
    """Service for content classification using custom embeddings"""
    
    def __init__(self, neo4j_uri: str, neo4j_user: str, neo4j_password: str):
        self.driver = GraphDatabase.driver(neo4j_uri, auth=(neo4j_user, neo4j_password))
        self.embedding_model = CustomEmbeddingModel()
        
    async def create_label(self, label: ClassificationLabel) -> str:
        """Create a new classification label in Neo4j"""
        query = """
        CREATE (l:ClassificationLabel {
            id: $id,
            name: $name,
            description: $description,
            parent_id: $parent_id,
            metadata: $metadata
        })
        RETURN l.id
        """
        with self.driver.session() as session:
            result = session.run(query,
                id=label.id,
                name=label.name,
                description=label.description,
                parent_id=label.parent_id,
                metadata=label.metadata
            )
            return result.single()[0]
            
    async def get_label_hierarchy(self) -> List[Dict]:
        """Get the complete label hierarchy"""
        query = """
        MATCH (l:ClassificationLabel)
        OPTIONAL MATCH (l)-[:PARENT_OF]->(child:ClassificationLabel)
        RETURN l, collect(child) as children
        """
        with self.driver.session() as session:
            result = session.run(query)
            return [self._process_hierarchy_record(record) for record in result]
            
    async def classify_content(self, content: str, content_id: str) -> ClassificationResult:
        """Classify content using embeddings and label matching"""
        # Generate content embedding
        content_embedding = self.embedding_model.get_embedding(content)
        
        # Get all labels with their embeddings
        labels = await self._get_all_labels()
        
        # Calculate similarity scores
        scores = {}
        for label in labels:
            if "embedding" in label["metadata"]:
                label_embedding = label["metadata"]["embedding"]
                similarity = self._calculate_similarity(content_embedding, label_embedding)
                scores[label["name"]] = float(similarity)
        
        # Filter labels above threshold
        threshold = 0.5
        selected_labels = [label for label, score in scores.items() if score > threshold]
        
        # Create classification result
        result = ClassificationResult(
            content_id=content_id,
            labels=selected_labels,
            confidence_scores=scores,
            timestamp=datetime.utcnow(),
            metadata={
                "threshold": threshold,
                "embedding_model": self.embedding_model.__class__.__name__
            }
        )
        
        # Store result in Neo4j
        await self._store_classification(result)
        
        return result
        
    async def _get_all_labels(self) -> List[Dict]:
        """Get all classification labels from Neo4j"""
        query = """
        MATCH (l:ClassificationLabel)
        RETURN l
        """
        with self.driver.session() as session:
            result = session.run(query)
            return [dict(record["l"]) for record in result]
            
    async def _store_classification(self, result: ClassificationResult) -> None:
        """Store classification result in Neo4j"""
        query = """
        MATCH (c:Content {id: $content_id})
        SET c.classification = $classification,
            c.confidence_scores = $confidence_scores,
            c.classification_timestamp = datetime($timestamp)
        """
        with self.driver.session() as session:
            session.run(query,
                content_id=result.content_id,
                classification=result.labels,
                confidence_scores=result.confidence_scores,
                timestamp=result.timestamp.isoformat()
            )
            
    def _calculate_similarity(self, embedding1: List[float], embedding2: List[float]) -> float:
        """Calculate cosine similarity between embeddings"""
        vec1 = np.array(embedding1)
        vec2 = np.array(embedding2)
        return np.dot(vec1, vec2) / (np.linalg.norm(vec1) * np.linalg.norm(vec2))
        
    def _process_hierarchy_record(self, record) -> Dict:
        """Process Neo4j record into hierarchy dict"""
        label = dict(record["l"])
        children = [dict(child) for child in record["children"]]
        label["children"] = children
        return label
        
    def close(self):
        """Close the Neo4j driver connection"""
        self.driver.close() 