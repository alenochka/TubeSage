"""
YouTube Data API v3 integration for reliable video data retrieval
"""
import os
import requests
from typing import Dict, List, Optional, Any
import xml.etree.ElementTree as ET
from urllib.parse import parse_qs, urlparse

class YouTubeAPI:
    """YouTube Data API v3 client for fetching video metadata and captions"""
    
    def __init__(self):
        self.api_key = os.getenv('YOUTUBE_API_KEY')
        self.base_url = 'https://www.googleapis.com/youtube/v3'
        
    def extract_video_id(self, url: str) -> Optional[str]:
        """Extract video ID from various YouTube URL formats"""
        patterns = [
            r'(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})',
            r'^[a-zA-Z0-9_-]{11}$'
        ]
        
        import re
        for pattern in patterns:
            match = re.search(pattern, url)
            if match:
                return match.group(1) if len(match.groups()) > 0 else match.group(0)
        return None
    
    async def get_video_details(self, video_id: str) -> Dict[str, Any]:
        """Get video metadata using YouTube Data API v3"""
        if not self.api_key:
            raise ValueError("YouTube API key not configured")
            
        url = f"{self.base_url}/videos"
        params = {
            'id': video_id,
            'key': self.api_key,
            'part': 'snippet,contentDetails,statistics'
        }
        
        try:
            response = requests.get(url, params=params, timeout=10)
            response.raise_for_status()
            data = response.json()
            
            if not data.get('items'):
                raise ValueError(f"Video {video_id} not found or not accessible")
                
            item = data['items'][0]
            snippet = item['snippet']
            content_details = item['contentDetails']
            
            return {
                'id': video_id,
                'title': snippet['title'],
                'description': snippet.get('description', ''),
                'duration': self._parse_duration(content_details['duration']),
                'published_at': snippet['publishedAt'],
                'channel_title': snippet['channelTitle'],
                'channel_id': snippet['channelId'],
                'view_count': item.get('statistics', {}).get('viewCount', '0'),
                'thumbnail_url': snippet['thumbnails']['high']['url'],
                'caption_available': content_details.get('caption', 'false') == 'true'
            }
            
        except requests.RequestException as e:
            raise Exception(f"YouTube API request failed: {str(e)}")
    
    async def get_video_captions(self, video_id: str) -> Optional[Dict[str, Any]]:
        """Get video captions using YouTube Data API v3"""
        if not self.api_key:
            raise ValueError("YouTube API key not configured")
            
        # First, get available caption tracks
        url = f"{self.base_url}/captions"
        params = {
            'videoId': video_id,
            'key': self.api_key,
            'part': 'snippet'
        }
        
        try:
            response = requests.get(url, params=params, timeout=10)
            response.raise_for_status()
            data = response.json()
            
            if not data.get('items'):
                return None
                
            # Find English captions (auto or manual)
            caption_track = None
            for item in data['items']:
                snippet = item['snippet']
                if snippet['language'] == 'en':
                    caption_track = item
                    break
            
            if not caption_track:
                # Fallback to first available track
                caption_track = data['items'][0]
            
            # Download caption content
            caption_id = caption_track['id']
            download_url = f"{self.base_url}/captions/{caption_id}"
            download_params = {
                'key': self.api_key,
                'tfmt': 'srt'  # SubRip format
            }
            
            caption_response = requests.get(download_url, params=download_params, timeout=10)
            caption_response.raise_for_status()
            
            # Parse SRT format to extract text and timestamps
            return self._parse_srt_captions(caption_response.text)
            
        except requests.RequestException as e:
            print(f"Caption retrieval failed: {str(e)}")
            return None
    
    def _parse_duration(self, duration_str: str) -> str:
        """Parse ISO 8601 duration to readable format"""
        import re
        
        # Pattern for PT#H#M#S format
        pattern = r'PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?'
        match = re.match(pattern, duration_str)
        
        if not match:
            return "0:00"
            
        hours = int(match.group(1) or 0)
        minutes = int(match.group(2) or 0)
        seconds = int(match.group(3) or 0)
        
        if hours > 0:
            return f"{hours}:{minutes:02d}:{seconds:02d}"
        else:
            return f"{minutes}:{seconds:02d}"
    
    def _parse_srt_captions(self, srt_content: str) -> Dict[str, Any]:
        """Parse SRT caption format to extract text and timestamps"""
        import re
        
        # Split into subtitle blocks
        blocks = re.split(r'\n\s*\n', srt_content.strip())
        
        transcript = []
        full_text = ""
        
        for block in blocks:
            lines = block.strip().split('\n')
            if len(lines) < 3:
                continue
                
            # Parse timestamp line (format: 00:00:01,000 --> 00:00:03,000)
            timestamp_line = lines[1]
            times = timestamp_line.split(' --> ')
            if len(times) != 2:
                continue
                
            start_time = self._srt_time_to_seconds(times[0])
            end_time = self._srt_time_to_seconds(times[1])
            
            # Extract text (everything after timestamp)
            text = ' '.join(lines[2:]).strip()
            # Remove HTML tags if present
            text = re.sub(r'<[^>]+>', '', text)
            
            transcript.append({
                'start': start_time,
                'duration': end_time - start_time,
                'text': text
            })
            
            full_text += text + " "
        
        return {
            'transcript': transcript,
            'full_text': full_text.strip()
        }
    
    def _srt_time_to_seconds(self, time_str: str) -> float:
        """Convert SRT timestamp to seconds"""
        # Format: 00:01:23,456
        time_part, ms_part = time_str.split(',')
        hours, minutes, seconds = map(int, time_part.split(':'))
        milliseconds = int(ms_part)
        
        return hours * 3600 + minutes * 60 + seconds + milliseconds / 1000.0

    async def get_channel_videos(self, channel_url: str, max_results: int = 50) -> List[Dict[str, Any]]:
        """Get videos from a YouTube channel"""
        if not self.api_key:
            raise ValueError("YouTube API key not configured")
        
        # Extract channel ID from URL
        channel_id = self._extract_channel_id(channel_url)
        if not channel_id:
            raise ValueError("Invalid channel URL")
        
        # Get channel's upload playlist
        channel_url = f"{self.base_url}/channels"
        channel_params = {
            'id': channel_id,
            'key': self.api_key,
            'part': 'contentDetails'
        }
        
        try:
            response = requests.get(channel_url, params=channel_params, timeout=10)
            response.raise_for_status()
            data = response.json()
            
            if not data.get('items'):
                raise ValueError("Channel not found")
            
            uploads_playlist_id = data['items'][0]['contentDetails']['relatedPlaylists']['uploads']
            
            # Get videos from uploads playlist
            playlist_url = f"{self.base_url}/playlistItems"
            playlist_params = {
                'playlistId': uploads_playlist_id,
                'key': self.api_key,
                'part': 'snippet',
                'maxResults': min(max_results, 50)  # API limit
            }
            
            videos = []
            next_page_token = None
            
            while len(videos) < max_results:
                if next_page_token:
                    playlist_params['pageToken'] = next_page_token
                
                response = requests.get(playlist_url, params=playlist_params, timeout=10)
                response.raise_for_status()
                data = response.json()
                
                for item in data.get('items', []):
                    snippet = item['snippet']
                    video_id = snippet['resourceId']['videoId']
                    
                    videos.append({
                        'id': video_id,
                        'title': snippet['title'],
                        'publishedAt': snippet['publishedAt'],
                        'thumbnailUrl': snippet['thumbnails']['medium']['url'],
                        'url': f"https://www.youtube.com/watch?v={video_id}"
                    })
                
                next_page_token = data.get('nextPageToken')
                if not next_page_token or len(videos) >= max_results:
                    break
            
            return videos[:max_results]
            
        except requests.RequestException as e:
            raise Exception(f"Channel videos request failed: {str(e)}")
    
    def _extract_channel_id(self, url: str) -> Optional[str]:
        """Extract channel ID from various YouTube channel URL formats"""
        import re
        
        # Handle different channel URL formats
        patterns = [
            r'youtube\.com/channel/([a-zA-Z0-9_-]+)',
            r'youtube\.com/c/([a-zA-Z0-9_-]+)',
            r'youtube\.com/user/([a-zA-Z0-9_-]+)',
            r'youtube\.com/@([a-zA-Z0-9_-]+)'
        ]
        
        for pattern in patterns:
            match = re.search(pattern, url)
            if match:
                identifier = match.group(1)
                
                # If it's already a channel ID (starts with UC), return it
                if identifier.startswith('UC'):
                    return identifier
                
                # Otherwise, we need to resolve it via the API
                return self._resolve_channel_identifier(identifier, url)
        
        return None
    
    def _resolve_channel_identifier(self, identifier: str, original_url: str) -> Optional[str]:
        """Resolve channel username/handle to channel ID"""
        if not self.api_key:
            return None
            
        # Try different API endpoints to resolve the identifier
        endpoints = [
            ('forUsername', identifier),
            ('forHandle', f"@{identifier}" if not identifier.startswith('@') else identifier)
        ]
        
        for param_name, param_value in endpoints:
            try:
                url = f"{self.base_url}/channels"
                params = {
                    param_name: param_value,
                    'key': self.api_key,
                    'part': 'id'
                }
                
                response = requests.get(url, params=params, timeout=10)
                if response.status_code == 200:
                    data = response.json()
                    if data.get('items'):
                        return data['items'][0]['id']
                        
            except requests.RequestException:
                continue
        
        return None