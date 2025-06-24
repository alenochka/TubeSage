import os
import asyncio
from typing import Dict, Any
from youtube_transcript_api import YouTubeTranscriptApi
import re
from .base_agent import BaseAgent

class TranscriptFetcher(BaseAgent):
    """Agent responsible for fetching YouTube video transcripts"""
    
    def __init__(self):
        super().__init__(
            name="Transcript Fetcher",
            description="Retrieves and processes YouTube video transcripts using the youtube-transcript-api"
        )
        self.youtube_api_key = os.getenv('YOUTUBE_API_KEY', '')
    
    async def process_task(self, task: Dict[str, Any]) -> Dict[str, Any]:
        """Process a transcript fetching task"""
        
        if task.get('type') != 'fetch_transcript':
            raise ValueError(f"Invalid task type: {task.get('type')}")
        
        youtube_id = task.get('youtube_id')
        if not youtube_id:
            raise ValueError("YouTube ID is required")
        
        self.log_action(f"Fetching transcript for video {youtube_id}")
        
        try:
            # Fetch transcript using youtube-transcript-api
            transcript_list = YouTubeTranscriptApi.get_transcript(youtube_id)
            
            # Process transcript data
            processed_transcript = self._process_transcript(transcript_list)
            
            # Get video metadata (title, duration) if API key is available
            video_info = await self._get_video_info(youtube_id)
            
            result = {
                'youtube_id': youtube_id,
                'transcript': processed_transcript,
                'raw_transcript': transcript_list,
                'video_info': video_info,
                'total_duration': self._calculate_duration(transcript_list),
                'word_count': len(processed_transcript.split())
            }
            
            self.log_action(f"Successfully fetched transcript for {youtube_id} ({result['word_count']} words)")
            return result
            
        except Exception as e:
            self.log_action(f"Failed to fetch transcript for {youtube_id}: {str(e)}", "error")
            raise
    
    def _process_transcript(self, transcript_list) -> str:
        """Process raw transcript into clean text"""
        
        # Combine all transcript entries
        full_text = " ".join([entry['text'] for entry in transcript_list])
        
        # Clean up the text
        # Remove extra whitespace
        full_text = re.sub(r'\s+', ' ', full_text)
        
        # Remove common transcript artifacts
        full_text = re.sub(r'\[.*?\]', '', full_text)  # Remove [Music], [Applause], etc.
        full_text = re.sub(r'\(.*?\)', '', full_text)  # Remove parenthetical notes
        
        # Fix common transcription issues
        full_text = full_text.replace(' .', '.')
        full_text = full_text.replace(' ,', ',')
        full_text = full_text.replace(' ?', '?')
        full_text = full_text.replace(' !', '!')
        
        return full_text.strip()
    
    async def _get_video_info(self, youtube_id: str) -> Dict[str, Any]:
        """Get video metadata using YouTube API if available"""
        
        if not self.youtube_api_key:
            return {
                'title': f'Video {youtube_id}',
                'description': '',
                'duration': '00:00'
            }
        
        # TODO: Implement YouTube API call to get video metadata
        # For now, return placeholder data
        return {
            'title': f'Video {youtube_id}',
            'description': 'Video description not available',
            'duration': '00:00'
        }
    
    def _calculate_duration(self, transcript_list) -> str:
        """Calculate video duration from transcript timestamps"""
        
        if not transcript_list:
            return "00:00"
        
        last_entry = transcript_list[-1]
        total_seconds = int(last_entry.get('start', 0) + last_entry.get('duration', 0))
        
        hours = total_seconds // 3600
        minutes = (total_seconds % 3600) // 60
        seconds = total_seconds % 60
        
        if hours > 0:
            return f"{hours:02d}:{minutes:02d}:{seconds:02d}"
        else:
            return f"{minutes:02d}:{seconds:02d}"
