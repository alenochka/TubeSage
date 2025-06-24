import asyncio
from typing import Dict, Any, List
from .base_agent import BaseAgent

class TextChunker(BaseAgent):
    """Agent responsible for splitting transcripts into semantic chunks"""
    
    def __init__(self):
        super().__init__(
            name="Text Chunker",
            description="Splits transcripts into optimal chunks using RecursiveCharacterTextSplitter"
        )
        self.chunk_size = 1000
        self.chunk_overlap = 200
        self.separators = ["\n\n", "\n", ". ", "? ", "! ", " "]
    
    async def process_task(self, task: Dict[str, Any]) -> Dict[str, Any]:
        """Process a text chunking task"""
        
        if task.get('type') != 'chunk_text':
            raise ValueError(f"Invalid task type: {task.get('type')}")
        
        transcript = task.get('transcript')
        youtube_id = task.get('youtube_id')
        raw_transcript = task.get('raw_transcript', [])
        
        if not transcript:
            raise ValueError("Transcript text is required")
        
        self.log_action(f"Chunking transcript for video {youtube_id}")
        
        try:
            # Split text into chunks
            chunks = self._recursive_split(transcript)
            
            # Add timestamp information to chunks
            timestamped_chunks = self._add_timestamps(chunks, raw_transcript)
            
            result = {
                'youtube_id': youtube_id,
                'chunks': timestamped_chunks,
                'total_chunks': len(timestamped_chunks),
                'avg_chunk_size': sum(len(chunk['content']) for chunk in timestamped_chunks) / len(timestamped_chunks)
            }
            
            self.log_action(f"Successfully created {len(timestamped_chunks)} chunks for {youtube_id}")
            return result
            
        except Exception as e:
            self.log_action(f"Failed to chunk text for {youtube_id}: {str(e)}", "error")
            raise
    
    def _recursive_split(self, text: str) -> List[str]:
        """Recursively split text using different separators"""
        
        if len(text) <= self.chunk_size:
            return [text]
        
        chunks = []
        
        for separator in self.separators:
            if separator in text:
                splits = text.split(separator)
                
                current_chunk = ""
                for split in splits:
                    # If adding this split would exceed chunk size, save current chunk
                    if len(current_chunk) + len(split) + len(separator) > self.chunk_size:
                        if current_chunk:
                            chunks.append(current_chunk.strip())
                            # Start new chunk with overlap
                            overlap_text = self._get_overlap_text(current_chunk)
                            current_chunk = overlap_text + split
                        else:
                            # Split is too large, recursively split it
                            sub_chunks = self._recursive_split(split)
                            chunks.extend(sub_chunks[:-1])
                            current_chunk = sub_chunks[-1] if sub_chunks else ""
                    else:
                        if current_chunk:
                            current_chunk += separator + split
                        else:
                            current_chunk = split
                
                # Add the last chunk
                if current_chunk:
                    chunks.append(current_chunk.strip())
                
                return chunks
        
        # If no separators found, split by character limit
        return self._split_by_characters(text)
    
    def _get_overlap_text(self, text: str) -> str:
        """Get overlap text for the next chunk"""
        
        if len(text) <= self.chunk_overlap:
            return text + " "
        
        # Try to find a good break point for overlap
        overlap_candidates = text[-self.chunk_overlap:].split(' ')
        
        # Remove the first word to avoid cutting in the middle
        if len(overlap_candidates) > 1:
            overlap_text = ' '.join(overlap_candidates[1:])
        else:
            overlap_text = text[-self.chunk_overlap:]
        
        return overlap_text + " " if overlap_text else ""
    
    def _split_by_characters(self, text: str) -> List[str]:
        """Split text by character limit as fallback"""
        
        chunks = []
        start = 0
        
        while start < len(text):
            end = start + self.chunk_size
            
            if end >= len(text):
                chunks.append(text[start:])
                break
            
            # Try to find a space near the end to avoid cutting words
            space_pos = text.rfind(' ', start, end)
            if space_pos > start:
                end = space_pos
            
            chunks.append(text[start:end])
            start = end - self.chunk_overlap if end - self.chunk_overlap > start else end
        
        return chunks
    
    def _add_timestamps(self, chunks: List[str], raw_transcript: List[Dict]) -> List[Dict[str, Any]]:
        """Add timestamp information to chunks based on original transcript"""
        
        timestamped_chunks = []
        
        for i, chunk in enumerate(chunks):
            # Try to find matching timestamp from original transcript
            start_time, end_time = self._find_chunk_timestamps(chunk, raw_transcript)
            
            timestamped_chunks.append({
                'content': chunk,
                'chunk_index': i,
                'start_time': start_time,
                'end_time': end_time,
                'word_count': len(chunk.split())
            })
        
        return timestamped_chunks
    
    def _find_chunk_timestamps(self, chunk: str, raw_transcript: List[Dict]) -> tuple:
        """Find start and end timestamps for a chunk"""
        
        if not raw_transcript:
            return "00:00", "00:00"
        
        # Simple approach: find first and last words in the chunk within the transcript
        chunk_words = chunk.split()[:5]  # Use first 5 words for matching
        
        start_time = None
        end_time = None
        
        # Look for the first few words of the chunk in the transcript
        for entry in raw_transcript:
            transcript_text = entry.get('text', '').lower()
            chunk_start = ' '.join(chunk_words).lower()
            
            if chunk_start in transcript_text:
                start_time = self._format_timestamp(entry.get('start', 0))
                break
        
        # Use a similar approach for end time (simplified)
        if start_time:
            chunk_end_words = chunk.split()[-5:]  # Use last 5 words
            for entry in raw_transcript:
                transcript_text = entry.get('text', '').lower()
                chunk_end = ' '.join(chunk_end_words).lower()
                
                if chunk_end in transcript_text:
                    end_time = self._format_timestamp(entry.get('start', 0) + entry.get('duration', 0))
                    break
        
        return start_time or "00:00", end_time or "00:00"
    
    def _format_timestamp(self, seconds: float) -> str:
        """Format seconds into MM:SS or HH:MM:SS format"""
        
        total_seconds = int(seconds)
        hours = total_seconds // 3600
        minutes = (total_seconds % 3600) // 60
        secs = total_seconds % 60
        
        if hours > 0:
            return f"{hours:02d}:{minutes:02d}:{secs:02d}"
        else:
            return f"{minutes:02d}:{secs:02d}"
