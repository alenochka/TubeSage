import os
import asyncio
from typing import Dict, Any, List
from .base_agent import BaseAgent

class QueryProcessor(BaseAgent):
    """Agent responsible for processing user queries and generating responses"""
    
    def __init__(self):
        super().__init__(
            name="Query Processor",
            description="Handles user queries and retrieval-augmented generation responses"
        )
        self.openai_api_key = os.getenv('OPENAI_API_KEY', '')
        self.google_api_key = os.getenv('GOOGLE_API_KEY', '')
        self.max_context_chunks = 5
        self.min_similarity_threshold = 0.3
    
    async def process_task(self, task: Dict[str, Any]) -> Dict[str, Any]:
        """Process a query task"""
        
        if task.get('type') != 'process_query':
            raise ValueError(f"Invalid task type: {task.get('type')}")
        
        query = task.get('query')
        similar_chunks = task.get('similar_chunks', [])
        
        if not query:
            raise ValueError("Query is required")
        
        self.log_action(f"Processing query: {query[:50]}...")
        
        try:
            # Filter chunks by similarity threshold
            relevant_chunks = [
                chunk for chunk in similar_chunks 
                if chunk.get('similarity', 0) >= self.min_similarity_threshold
            ][:self.max_context_chunks]
            
            if not relevant_chunks:
                return await self._generate_no_context_response(query)
            
            # Generate response with context
            response = await self._generate_contextual_response(query, relevant_chunks)
            
            # Prepare source contexts for frontend
            source_contexts = self._prepare_source_contexts(relevant_chunks)
            
            result = {
                'query': query,
                'response': response,
                'source_contexts': source_contexts,
                'chunks_used': len(relevant_chunks),
                'confidence': self._calculate_confidence(relevant_chunks)
            }
            
            self.log_action(f"Generated response using {len(relevant_chunks)} context chunks")
            return result
            
        except Exception as e:
            self.log_action(f"Failed to process query: {str(e)}", "error")
            raise
    
    async def _generate_contextual_response(self, query: str, chunks: List[Dict]) -> str:
        """Generate response using retrieved context chunks"""
        
        # Prepare context from chunks
        context_parts = []
        for chunk in chunks:
            content = chunk.get('content', '')
            youtube_id = chunk.get('youtube_id', '')
            timestamp = chunk.get('start_time', '')
            
            context_part = f"From video {youtube_id} at {timestamp}:\n{content}\n"
            context_parts.append(context_part)
        
        context = "\n".join(context_parts)
        
        # Create prompt for LLM
        prompt = f"""Based on the following video transcript excerpts, please answer the user's question.

Context from YouTube videos:
{context}

User Question: {query}

Please provide a comprehensive answer based on the provided context. If the context doesn't fully answer the question, mention what information is available and what might be missing.

Answer:"""
        
        # Mock LLM response (in production, use OpenAI or Google Gemini API)
        response = await self._mock_llm_response(query, context)
        
        return response
    
    async def _generate_no_context_response(self, query: str) -> Dict[str, Any]:
        """Generate response when no relevant context is found"""
        
        response = f"I couldn't find specific information about '{query}' in the processed YouTube video transcripts. This could mean:\n\n1. The topic hasn't been covered in the videos that have been processed\n2. The information might be there but with different terminology\n3. More videos might need to be processed to find relevant content\n\nTry rephrasing your question or adding more videos to the database."
        
        return {
            'query': query,
            'response': response,
            'source_contexts': [],
            'chunks_used': 0,
            'confidence': 0
        }
    
    async def _mock_llm_response(self, query: str, context: str) -> str:
        """Mock LLM response for demonstration (replace with real API call)"""
        
        # Simulate processing time
        await asyncio.sleep(0.5)
        
        # Generate a contextual response based on the query and context
        query_lower = query.lower()
        
        if 'quantum' in query_lower and 'biology' in query_lower:
            return """Based on the analyzed YouTube transcripts, quantum effects in biology represent a fascinating intersection of quantum physics and biological systems. The transcripts reveal several key points:

**Quantum Coherence in Photosynthesis**: The videos explain how plants utilize quantum mechanical principles to achieve remarkable energy transfer efficiency in their light-harvesting complexes. This involves quantum superposition states that allow energy to "try" multiple pathways simultaneously, finding the most efficient route.

**Quantum Tunneling in Enzymatic Reactions**: The content describes how enzymes can facilitate reactions through quantum tunneling effects, where particles can pass through energy barriers that would be classically forbidden.

**Coherent Energy Transfer**: The transcripts highlight how biological systems maintain quantum coherence at biological temperatures, which was previously thought to be impossible due to environmental noise.

The research suggests that rather than being mere accidents, these quantum effects may be fundamental to how biological systems operate efficiently."""

        elif 'photosynthesis' in query_lower:
            return """According to the video transcripts, photosynthesis demonstrates remarkable quantum effects that enable its high efficiency:

**Energy Transfer Mechanism**: The light-harvesting complexes in plants use quantum coherence to create superposition states, allowing excitation energy to simultaneously explore multiple pathways and select the most efficient route to the reaction center.

**Quantum Beats**: The transcripts describe observations of quantum beats in photosynthetic systems, indicating maintained coherence over timescales relevant to energy transfer.

**Evolutionary Advantage**: The videos suggest that evolution has optimized these quantum mechanical properties to achieve near-perfect energy transfer efficiency, something that classical systems struggle to match."""

        else:
            # Generic response
            return f"""Based on the YouTube transcript analysis regarding "{query}", the available content provides several relevant insights:

The processed video transcripts contain information that addresses your question, though the specific details depend on the context and scope of the videos analyzed. The content suggests multiple perspectives and approaches to understanding this topic.

Key themes that emerge from the analysis include detailed explanations of the underlying mechanisms, practical applications, and theoretical frameworks that help explain the phenomena you're asking about.

For more specific information, you might want to review the source contexts below, which show the exact excerpts from the videos that relate to your question."""
        
    def _prepare_source_contexts(self, chunks: List[Dict]) -> List[Dict[str, Any]]:
        """Prepare source contexts for the frontend display"""
        
        contexts = []
        
        for chunk in chunks:
            # Mock video title extraction (in production, get from video metadata)
            youtube_id = chunk.get('youtube_id', '')
            video_title = f"Video {youtube_id}"
            
            if 'quantum' in chunk.get('content', '').lower():
                video_title = "Quantum Biology: From Photons to Physiology"
            elif 'photosynthesis' in chunk.get('content', '').lower():
                video_title = "Photosynthesis and Energy Transfer"
            
            context = {
                'videoTitle': video_title,
                'timestamp': chunk.get('start_time', '00:00'),
                'excerpt': chunk.get('content', '')[:200] + "..." if len(chunk.get('content', '')) > 200 else chunk.get('content', ''),
                'confidence': int(chunk.get('similarity', 0) * 100),
                'relevance': self._calculate_relevance(chunk.get('similarity', 0))
            }
            
            contexts.append(context)
        
        return contexts
    
    def _calculate_confidence(self, chunks: List[Dict]) -> int:
        """Calculate overall confidence score for the response"""
        
        if not chunks:
            return 0
        
        # Average similarity score
        avg_similarity = sum(chunk.get('similarity', 0) for chunk in chunks) / len(chunks)
        
        # Convert to percentage and adjust based on number of chunks
        confidence = int(avg_similarity * 100)
        
        # Bonus for having multiple supporting chunks
        if len(chunks) >= 3:
            confidence = min(confidence + 10, 100)
        
        return confidence
    
    def _calculate_relevance(self, similarity: float) -> str:
        """Calculate relevance level based on similarity score"""
        
        if similarity >= 0.8:
            return "Very High"
        elif similarity >= 0.6:
            return "High"
        elif similarity >= 0.4:
            return "Medium"
        elif similarity >= 0.2:
            return "Low"
        else:
            return "Very Low"
