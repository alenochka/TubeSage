import os
import asyncio
import numpy as np
from typing import Dict, Any, List
import json
from .base_agent import BaseAgent

class VectorEmbedder(BaseAgent):
    """Agent responsible for creating embeddings and managing vector database"""
    
    def __init__(self):
        super().__init__(
            name="Vector Embedder",
            description="Creates embeddings and manages FAISS vector database operations"
        )
        self.embedding_model = "text-embedding-ada-002"  # OpenAI model
        self.vector_dimension = 1536
        self.openai_api_key = os.getenv('OPENAI_API_KEY', '')
        self.google_api_key = os.getenv('GOOGLE_API_KEY', '')
        
        # Initialize FAISS-powered vector database
        import sys
        import os
        sys.path.append(os.path.join(os.path.dirname(__file__), '..'))
        from services.vector_db import VectorDatabase
        self.vector_db = VectorDatabase(dimension=1536)
        self.embeddings_cache = {}
    
    async def process_task(self, task: Dict[str, Any]) -> Dict[str, Any]:
        """Process a vector embedding task"""
        
        task_type = task.get('type')
        
        if task_type == 'create_embeddings':
            return await self._create_embeddings(task)
        elif task_type == 'search_similar':
            return await self._search_similar(task)
        elif task_type == 'update_index':
            return await self._update_index(task)
        else:
            raise ValueError(f"Invalid task type: {task_type}")
    
    async def _create_embeddings(self, task: Dict[str, Any]) -> Dict[str, Any]:
        """Create embeddings for text chunks"""
        
        chunks = task.get('chunks', [])
        youtube_id = task.get('youtube_id')
        
        if not chunks:
            raise ValueError("Chunks are required for embedding creation")
        
        self.log_action(f"Creating embeddings for {len(chunks)} chunks from video {youtube_id}")
        
        try:
            embedded_chunks = []
            
            for chunk in chunks:
                content = chunk.get('content', '')
                
                # Create embedding (mock implementation)
                embedding = await self._get_embedding(content)
                
                chunk_with_embedding = {
                    **chunk,
                    'embedding': embedding.tolist(),
                    'youtube_id': youtube_id
                }
                
                embedded_chunks.append(chunk_with_embedding)
                
                # Store in vector database
                chunk_id = f"{youtube_id}_{chunk.get('chunk_index', 0)}"
                self.vector_store[chunk_id] = chunk_with_embedding
            
            result = {
                'youtube_id': youtube_id,
                'embedded_chunks': embedded_chunks,
                'total_embeddings': len(embedded_chunks),
                'vector_dimension': self.vector_dimension
            }
            
            self.log_action(f"Successfully created {len(embedded_chunks)} embeddings for {youtube_id}")
            return result
            
        except Exception as e:
            self.log_action(f"Failed to create embeddings for {youtube_id}: {str(e)}", "error")
            raise
    
    async def _search_similar(self, task: Dict[str, Any]) -> Dict[str, Any]:
        """Search for similar chunks based on query embedding"""
        
        query = task.get('query')
        top_k = task.get('top_k', 5)
        
        if not query:
            raise ValueError("Query is required for similarity search")
        
        self.log_action(f"Searching for similar chunks to query: {query[:50]}...")
        
        try:
            # Get query embedding
            query_embedding = await self._get_embedding(query)
            
            # Calculate similarities
            similarities = []
            
            for chunk_id, chunk_data in self.vector_store.items():
                chunk_embedding = np.array(chunk_data.get('embedding', []))
                
                if len(chunk_embedding) == self.vector_dimension:
                    similarity = self._cosine_similarity(query_embedding, chunk_embedding)
                    
                    similarities.append({
                        'chunk_id': chunk_id,
                        'similarity': similarity,
                        'content': chunk_data.get('content', ''),
                        'youtube_id': chunk_data.get('youtube_id'),
                        'start_time': chunk_data.get('start_time'),
                        'end_time': chunk_data.get('end_time')
                    })
            
            # Sort by similarity and return top k
            similarities.sort(key=lambda x: x['similarity'], reverse=True)
            top_results = similarities[:top_k]
            
            result = {
                'query': query,
                'top_matches': top_results,
                'total_searched': len(similarities)
            }
            
            self.log_action(f"Found {len(top_results)} similar chunks for query")
            return result
            
        except Exception as e:
            self.log_action(f"Failed to search similar chunks: {str(e)}", "error")
            raise
    
    async def _update_index(self, task: Dict[str, Any]) -> Dict[str, Any]:
        """Update the vector index"""
        
        self.log_action("Updating vector index")
        
        try:
            # In a real implementation, this would rebuild/optimize the FAISS index
            index_stats = {
                'total_vectors': len(self.vector_store),
                'vector_dimension': self.vector_dimension,
                'memory_usage': len(self.vector_store) * self.vector_dimension * 4,  # 4 bytes per float
                'index_type': 'flat'  # Would be more sophisticated in FAISS
            }
            
            self.log_action(f"Vector index updated. {index_stats['total_vectors']} vectors indexed")
            return index_stats
            
        except Exception as e:
            self.log_action(f"Failed to update vector index: {str(e)}", "error")
            raise
    
    async def _get_embedding(self, text: str) -> np.ndarray:
        """Get embedding for text (mock implementation)"""
        
        # Check cache first
        if text in self.embeddings_cache:
            return self.embeddings_cache[text]
        
        # Use OpenAI API for embeddings
        try:
            import openai
            api_key = os.getenv('OPENAI_API_KEY')
            if api_key:
                client = openai.OpenAI(api_key=api_key)
                response = client.embeddings.create(
                    model="text-embedding-ada-002",
                    input=text
                )
                embedding = np.array(response.data[0].embedding, dtype=np.float32)
                self.embeddings_cache[text] = embedding
                return embedding
        except Exception as e:
            self.log_action(f"OpenAI embedding failed: {e}", "error")
        
        # This should never happen in production
        raise Exception("OpenAI API not available - check OPENAI_API_KEY")
    
    def _cosine_similarity(self, vec1: np.ndarray, vec2: np.ndarray) -> float:
        """Calculate cosine similarity between two vectors"""
        
        dot_product = np.dot(vec1, vec2)
        norm1 = np.linalg.norm(vec1)
        norm2 = np.linalg.norm(vec2)
        
        if norm1 == 0 or norm2 == 0:
            return 0.0
        
        return dot_product / (norm1 * norm2)
    
    def get_vector_stats(self) -> Dict[str, Any]:
        """Get statistics about the vector database"""
        
        return {
            'total_vectors': len(self.vector_store),
            'vector_dimension': self.vector_dimension,
            'memory_usage_mb': (len(self.vector_store) * self.vector_dimension * 4) / (1024 * 1024),
            'unique_videos': len(set(chunk.get('youtube_id', '') for chunk in self.vector_store.values()))
        }
