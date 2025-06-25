import asyncio
from typing import Dict, Any, List
import logging
from transcript_fetcher import TranscriptFetcher
from text_chunker import TextChunker
from vector_embedder import VectorEmbedder
from query_processor import QueryProcessor

logger = logging.getLogger(__name__)

class AgentOrchestrator:
    """Orchestrates the multi-agent system for YouTube transcript processing"""
    
    def __init__(self):
        # Initialize all agents
        self.transcript_fetcher = TranscriptFetcher()
        self.text_chunker = TextChunker()
        self.vector_embedder = VectorEmbedder()
        self.query_processor = QueryProcessor()
        self.academic_scraper = AcademicScraper()
        
        # Set all agents to active status
        self.transcript_fetcher.status = "active"
        self.text_chunker.status = "active" 
        self.vector_embedder.status = "active"
        self.query_processor.status = "active"
        
        # Track active workflows
        self.active_workflows = {}
        
    async def process_video(self, youtube_url: str) -> Dict[str, Any]:
        """Process a YouTube video through the complete pipeline"""
        
        # Extract YouTube ID
        youtube_id = self._extract_youtube_id(youtube_url)
        if not youtube_id:
            raise ValueError("Invalid YouTube URL")
        
        workflow_id = f"video_{youtube_id}"
        self.active_workflows[workflow_id] = {
            'status': 'processing',
            'current_step': 'fetching_transcript',
            'progress': 0
        }
        
        try:
            logger.info(f"Starting video processing pipeline for {youtube_id}")
            
            # Step 1: Fetch transcript
            self._update_workflow(workflow_id, 'fetching_transcript', 25)
            transcript_task = {
                'type': 'fetch_transcript',
                'youtube_id': youtube_id
            }
            transcript_result = await self.transcript_fetcher.process_task(transcript_task)
            
            # Step 2: Chunk transcript
            self._update_workflow(workflow_id, 'chunking_text', 50)
            chunking_task = {
                'type': 'chunk_text',
                'transcript': transcript_result['transcript'],
                'youtube_id': youtube_id,
                'raw_transcript': transcript_result['raw_transcript']
            }
            chunking_result = await self.text_chunker.process_task(chunking_task)
            
            # Step 3: Create embeddings
            self._update_workflow(workflow_id, 'creating_embeddings', 75)
            embedding_task = {
                'type': 'create_embeddings',
                'chunks': chunking_result['chunks'],
                'youtube_id': youtube_id
            }
            embedding_result = await self.vector_embedder.process_task(embedding_task)
            
            # Step 4: Update vector index
            self._update_workflow(workflow_id, 'updating_index', 90)
            index_task = {
                'type': 'update_index'
            }
            await self.vector_embedder.process_task(index_task)
            
            # Complete workflow
            self._update_workflow(workflow_id, 'completed', 100)
            
            # Combine results
            result = {
                'youtube_id': youtube_id,
                'video_info': transcript_result['video_info'],
                'transcript': transcript_result['transcript'],
                'chunks': embedding_result['embedded_chunks'],
                'total_chunks': len(embedding_result['embedded_chunks']),
                'workflow_id': workflow_id,
                'status': 'completed'
            }
            
            logger.info(f"Video processing pipeline completed for {youtube_id}")
            return result
            
        except Exception as e:
            self._update_workflow(workflow_id, 'error', 0)
            logger.error(f"Video processing pipeline failed for {youtube_id}: {str(e)}")
            raise
        finally:
            # Clean up workflow tracking
            self.active_workflows.pop(workflow_id, None)
    
    async def process_query(self, query: str) -> Dict[str, Any]:
        """Process a user query through the search and response pipeline"""
        
        try:
            logger.info(f"Processing query: {query[:50]}...")
            
            # Step 1: Search for similar chunks
            search_task = {
                'type': 'search_similar',
                'query': query,
                'top_k': 10
            }
            search_result = await self.vector_embedder.process_task(search_task)
            
            # Step 2: Generate response
            response_task = {
                'type': 'process_query',
                'query': query,
                'similar_chunks': search_result['top_matches']
            }
            response_result = await self.query_processor.process_task(response_task)
            
            logger.info(f"Query processing completed for: {query[:50]}...")
            return response_result
            
        except Exception as e:
            logger.error(f"Query processing failed: {str(e)}")
            raise
    
    def get_agent_statuses(self) -> List[Dict[str, Any]]:
        """Get status of all agents"""
        
        return [
            self.transcript_fetcher.get_status(),
            self.text_chunker.get_status(),
            self.vector_embedder.get_status(),
            self.query_processor.get_status()
        ]
    
    def get_system_metrics(self) -> Dict[str, Any]:
        """Get overall system metrics"""
        
        agent_statuses = self.get_agent_statuses()
        
        total_tasks = sum(agent['total_tasks'] for agent in agent_statuses)
        successful_tasks = sum(agent['successful_tasks'] for agent in agent_statuses)
        
        return {
            'total_agents': len(agent_statuses),
            'active_agents': len([a for a in agent_statuses if a['status'] == 'active']),
            'total_tasks_processed': total_tasks,
            'success_rate': (successful_tasks / max(1, total_tasks)) * 100,
            'active_workflows': len(self.active_workflows),
            'vector_stats': self.vector_embedder.get_vector_stats()
        }
    
    def _extract_youtube_id(self, url: str) -> str:
        """Extract YouTube video ID from URL"""
        
        import re
        
        patterns = [
            r'(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\n?#]+)',
            r'youtube\.com\/embed\/([^&\n?#]+)',
            r'youtube\.com\/v\/([^&\n?#]+)'
        ]
        
        for pattern in patterns:
            match = re.search(pattern, url)
            if match:
                return match.group(1)
        
        return ""
    
    def _update_workflow(self, workflow_id: str, step: str, progress: int):
        """Update workflow status"""
        
        if workflow_id in self.active_workflows:
            self.active_workflows[workflow_id].update({
                'current_step': step,
                'progress': progress
            })
