import numpy as np
from typing import Dict, Any, List, Optional
import json
import os

class VectorDatabase:
    """Simple in-memory vector database (would use FAISS in production)"""
    
    def __init__(self, dimension: int = 1536):
        self.dimension = dimension
        self.vectors = {}
        self.metadata = {}
        self.index_dirty = False
        
    def add_vector(self, vector_id: str, vector: np.ndarray, metadata: Dict[str, Any]):
        """Add a vector to the database"""
        
        if len(vector) != self.dimension:
            raise ValueError(f"Vector dimension {len(vector)} does not match database dimension {self.dimension}")
        
        self.vectors[vector_id] = vector.copy()
        self.metadata[vector_id] = metadata.copy()
        self.index_dirty = True
    
    def search_similar(self, query_vector: np.ndarray, top_k: int = 10, threshold: float = 0.0) -> List[Dict[str, Any]]:
        """Search for similar vectors"""
        
        if len(query_vector) != self.dimension:
            raise ValueError(f"Query vector dimension {len(query_vector)} does not match database dimension {self.dimension}")
        
        if not self.vectors:
            return []
        
        # Calculate similarities
        similarities = []
        
        for vector_id, vector in self.vectors.items():
            similarity = self._cosine_similarity(query_vector, vector)
            
            if similarity >= threshold:
                result = {
                    'id': vector_id,
                    'similarity': float(similarity),
                    'metadata': self.metadata.get(vector_id, {})
                }
                similarities.append(result)
        
        # Sort by similarity (descending) and return top k
        similarities.sort(key=lambda x: x['similarity'], reverse=True)
        return similarities[:top_k]
    
    def remove_vector(self, vector_id: str):
        """Remove a vector from the database"""
        
        self.vectors.pop(vector_id, None)
        self.metadata.pop(vector_id, None)
        self.index_dirty = True
    
    def remove_by_metadata(self, key: str, value: Any):
        """Remove vectors by metadata criteria"""
        
        to_remove = []
        
        for vector_id, metadata in self.metadata.items():
            if metadata.get(key) == value:
                to_remove.append(vector_id)
        
        for vector_id in to_remove:
            self.remove_vector(vector_id)
    
    def get_stats(self) -> Dict[str, Any]:
        """Get database statistics"""
        
        return {
            'total_vectors': len(self.vectors),
            'dimension': self.dimension,
            'memory_usage_mb': self._estimate_memory_usage(),
            'index_dirty': self.index_dirty
        }
    
    def clear(self):
        """Clear the entire database"""
        
        self.vectors.clear()
        self.metadata.clear()
        self.index_dirty = False
    
    def save_to_file(self, filepath: str):
        """Save database to file"""
        
        data = {
            'dimension': self.dimension,
            'vectors': {k: v.tolist() for k, v in self.vectors.items()},
            'metadata': self.metadata
        }
        
        with open(filepath, 'w') as f:
            json.dump(data, f)
    
    def load_from_file(self, filepath: str):
        """Load database from file"""
        
        if not os.path.exists(filepath):
            return
        
        with open(filepath, 'r') as f:
            data = json.load(f)
        
        self.dimension = data['dimension']
        self.vectors = {k: np.array(v) for k, v in data['vectors'].items()}
        self.metadata = data['metadata']
        self.index_dirty = False
    
    def _cosine_similarity(self, vec1: np.ndarray, vec2: np.ndarray) -> float:
        """Calculate cosine similarity between two vectors"""
        
        dot_product = np.dot(vec1, vec2)
        norm1 = np.linalg.norm(vec1)
        norm2 = np.linalg.norm(vec2)
        
        if norm1 == 0 or norm2 == 0:
            return 0.0
        
        return dot_product / (norm1 * norm2)
    
    def _estimate_memory_usage(self) -> float:
        """Estimate memory usage in MB"""
        
        vector_memory = len(self.vectors) * self.dimension * 8  # 8 bytes per float64
        metadata_memory = sum(len(str(m)) for m in self.metadata.values()) * 2  # Rough estimate
        
        return (vector_memory + metadata_memory) / (1024 * 1024)

# Global vector database instance
vector_db = VectorDatabase()
