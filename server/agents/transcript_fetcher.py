import os
import asyncio
import sys
from typing import Dict, Any
from .base_agent import BaseAgent

# Add parent directory to path for imports
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

try:
    from services.youtube_api import YouTubeAPI
except ImportError:
    YouTubeAPI = None

class TranscriptFetcher(BaseAgent):
    """Agent responsible for fetching YouTube video transcripts"""
    
    def __init__(self):
        super().__init__(
            name="Transcript Fetcher",
            description="Fetches YouTube video metadata and captions using YouTube Data API v3"
        )
        self.youtube_api = YouTubeAPI() if YouTubeAPI else None
    
    async def process_task(self, task: Dict[str, Any]) -> Dict[str, Any]:
        """Process a transcript fetching task"""
        
        if task.get('type') != 'fetch_transcript':
            raise ValueError(f"Invalid task type: {task.get('type')}")
        
        youtube_id = task.get('youtube_id')
        if not youtube_id:
            raise ValueError("YouTube ID is required")
        
        self.log_action(f"Fetching transcript for video {youtube_id}")
        
        try:
            if not self.youtube_api:
                raise ValueError("YouTube API not available")
            
            # Get video metadata using official API
            video_details = await self.youtube_api.get_video_details(youtube_id)
            self.log_action(f"Retrieved video: {video_details['title']}")
            
            # Try to get captions if available
            captions_data = None
            if video_details.get('caption_available'):
                self.log_action("Attempting to fetch captions...")
                captions_data = await self.youtube_api.get_video_captions(youtube_id)
            
            if captions_data:
                # Process captions into chunks
                chunks = self._create_chunks_from_transcript(captions_data['transcript'])
                
                result = {
                    "success": True,
                    "youtube_id": youtube_id,
                    "title": video_details['title'],
                    "duration": video_details['duration'],
                    "channel_title": video_details['channel_title'],
                    "view_count": video_details['view_count'],
                    "published_at": video_details['published_at'],
                    "transcript": captions_data['transcript'],
                    "full_text": captions_data['full_text'],
                    "chunks": chunks,
                    "source": "youtube_api_captions"
                }
            else:
                # No captions - use description and metadata
                description_chunks = self._create_chunks_from_description(
                    video_details['description'], 
                    video_details['title']
                )
                
                result = {
                    "success": True,
                    "youtube_id": youtube_id,
                    "title": video_details['title'],
                    "duration": video_details['duration'],
                    "channel_title": video_details['channel_title'],
                    "view_count": video_details['view_count'],
                    "published_at": video_details['published_at'],
                    "transcript": [],
                    "full_text": video_details['description'],
                    "chunks": description_chunks,
                    "source": "youtube_api_metadata"
                }
            
            self.log_action(f"Successfully processed video with {len(result['chunks'])} chunks")
            return result
                
        except Exception as e:
            self.log_action(f"Failed to process video: {str(e)}", "error")
            return {
                "success": False,
                "error": str(e)
            }
    
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
