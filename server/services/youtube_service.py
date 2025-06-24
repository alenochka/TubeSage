import os
import re
from typing import Dict, Any, Optional
import asyncio

class YouTubeService:
    """Service for YouTube-related operations"""
    
    def __init__(self):
        self.api_key = os.getenv('YOUTUBE_API_KEY', '')
    
    def extract_video_id(self, url: str) -> Optional[str]:
        """Extract YouTube video ID from URL"""
        
        patterns = [
            r'(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\n?#]+)',
            r'youtube\.com\/embed\/([^&\n?#]+)',
            r'youtube\.com\/v\/([^&\n?#]+)',
            r'youtube\.com\/.*[?&]v=([^&\n?#]+)'
        ]
        
        for pattern in patterns:
            match = re.search(pattern, url)
            if match:
                return match.group(1)
        
        return None
    
    def validate_youtube_url(self, url: str) -> bool:
        """Validate if URL is a valid YouTube URL"""
        
        return self.extract_video_id(url) is not None
    
    async def get_video_metadata(self, video_id: str) -> Dict[str, Any]:
        """Get video metadata from YouTube API"""
        
        if not self.api_key:
            return self._get_default_metadata(video_id)
        
        # TODO: Implement actual YouTube API call
        # For now, return mock data
        return self._get_default_metadata(video_id)
    
    def _get_default_metadata(self, video_id: str) -> Dict[str, Any]:
        """Get default metadata when API is not available"""
        
        return {
            'id': video_id,
            'title': f'YouTube Video {video_id}',
            'description': 'Video description not available',
            'duration': 'Unknown',
            'channel_title': 'Unknown Channel',
            'published_at': None,
            'view_count': 0,
            'thumbnail_url': f'https://img.youtube.com/vi/{video_id}/hqdefault.jpg'
        }
    
    def format_duration(self, duration_string: str) -> str:
        """Format YouTube duration string to readable format"""
        
        # YouTube API returns duration in ISO 8601 format (PT#M#S)
        import re
        
        if not duration_string or not duration_string.startswith('PT'):
            return "00:00"
        
        # Extract hours, minutes, seconds
        hours_match = re.search(r'(\d+)H', duration_string)
        minutes_match = re.search(r'(\d+)M', duration_string)
        seconds_match = re.search(r'(\d+)S', duration_string)
        
        hours = int(hours_match.group(1)) if hours_match else 0
        minutes = int(minutes_match.group(1)) if minutes_match else 0
        seconds = int(seconds_match.group(1)) if seconds_match else 0
        
        if hours > 0:
            return f"{hours:02d}:{minutes:02d}:{seconds:02d}"
        else:
            return f"{minutes:02d}:{seconds:02d}"
    
    def create_video_url(self, video_id: str) -> str:
        """Create YouTube video URL from video ID"""
        
        return f"https://www.youtube.com/watch?v={video_id}"
    
    def create_thumbnail_url(self, video_id: str, quality: str = 'hqdefault') -> str:
        """Create YouTube thumbnail URL"""
        
        return f"https://img.youtube.com/vi/{video_id}/{quality}.jpg"

# Global YouTube service instance
youtube_service = YouTubeService()
