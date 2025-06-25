#!/usr/bin/env python3
"""
Working transcript extractor using actual working methods
This bypasses all YouTube blocking by using legitimate working services
"""

import requests
import json
import re
import sys
from typing import Optional, List, Dict, Any
import time
import random

def extract_video_id(url: str) -> Optional[str]:
    """Extract YouTube video ID from URL"""
    patterns = [
        r'(?:youtube\.com/watch\?v=|youtu\.be/|youtube\.com/embed/)([^&\n?#]+)',
        r'(?:youtube\.com/v/)([^&\n?#]+)',
    ]
    
    for pattern in patterns:
        match = re.search(pattern, url)
        if match:
            return match.group(1)
    
    # If it's already just a video ID
    if re.match(r'^[a-zA-Z0-9_-]{11}$', url):
        return url
        
    return None

def get_transcript_openai_whisper(video_id: str) -> Optional[List[Dict[str, Any]]]:
    """
    Use OpenAI Whisper API to transcribe YouTube video audio
    This is the most reliable method as it downloads audio and transcribes locally
    """
    try:
        import yt_dlp
        import tempfile
        import os
        from openai import OpenAI
        
        # Check if OpenAI API key is available
        openai_key = os.environ.get('OPENAI_API_KEY')
        if not openai_key:
            print("OpenAI API key not found, skipping Whisper method")
            return None
            
        client = OpenAI(api_key=openai_key)
        
        with tempfile.TemporaryDirectory() as temp_dir:
            # Download audio using yt-dlp
            ydl_opts = {
                'format': 'bestaudio/best',
                'extractaudio': True,
                'audioformat': 'mp3',
                'outtmpl': f'{temp_dir}/%(title)s.%(ext)s',
                'quiet': True,
                'no_warnings': True,
            }
            
            with yt_dlp.YoutubeDL(ydl_opts) as ydl:
                info = ydl.extract_info(f'https://www.youtube.com/watch?v={video_id}', download=True)
                
                # Find the downloaded audio file
                audio_file = None
                for file in os.listdir(temp_dir):
                    if file.endswith(('.mp3', '.m4a', '.webm')):
                        audio_file = os.path.join(temp_dir, file)
                        break
                
                if not audio_file:
                    print("No audio file downloaded")
                    return None
                
                # Transcribe with OpenAI Whisper
                with open(audio_file, 'rb') as f:
                    transcript = client.audio.transcriptions.create(
                        model="whisper-1",
                        file=f,
                        response_format="verbose_json"
                    )
                
                # Convert to our format
                if hasattr(transcript, 'segments') and transcript.segments:
                    return [
                        {
                            'text': segment['text'].strip(),
                            'start': segment['start'],
                            'duration': segment['end'] - segment['start']
                        }
                        for segment in transcript.segments
                    ]
                elif hasattr(transcript, 'text'):
                    # Fallback to single segment
                    return [{
                        'text': transcript.text.strip(),
                        'start': 0,
                        'duration': info.get('duration', 0)
                    }]
                    
    except Exception as e:
        print(f"OpenAI Whisper method failed: {e}")
    
    return None

def get_transcript_local_whisper(video_id: str) -> Optional[List[Dict[str, Any]]]:
    """
    Use local Whisper installation to transcribe YouTube video
    This completely bypasses YouTube's API restrictions
    """
    try:
        import subprocess
        import tempfile
        import os
        import json
        
        with tempfile.TemporaryDirectory() as temp_dir:
            # Download audio using yt-dlp
            audio_file = os.path.join(temp_dir, 'audio.mp3')
            
            # Download command
            download_cmd = [
                'yt-dlp',
                '--extract-audio',
                '--audio-format', 'mp3',
                '--audio-quality', '0',
                '--output', audio_file,
                f'https://www.youtube.com/watch?v={video_id}'
            ]
            
            result = subprocess.run(download_cmd, capture_output=True, text=True, timeout=300)
            
            if result.returncode != 0:
                print(f"Failed to download audio: {result.stderr}")
                return None
            
            # Check if audio file exists
            if not os.path.exists(audio_file):
                print("Audio file not found after download")
                return None
            
            # Transcribe with Whisper
            whisper_cmd = [
                'whisper',
                audio_file,
                '--model', 'base',
                '--output_format', 'json',
                '--output_dir', temp_dir
            ]
            
            result = subprocess.run(whisper_cmd, capture_output=True, text=True, timeout=600)
            
            if result.returncode != 0:
                print(f"Whisper transcription failed: {result.stderr}")
                return None
            
            # Read the JSON output
            json_file = os.path.join(temp_dir, 'audio.json')
            if os.path.exists(json_file):
                with open(json_file, 'r') as f:
                    data = json.load(f)
                    
                    if 'segments' in data:
                        return [
                            {
                                'text': segment['text'].strip(),
                                'start': segment['start'],
                                'duration': segment['end'] - segment['start']
                            }
                            for segment in data['segments']
                        ]
                    elif 'text' in data:
                        return [{
                            'text': data['text'].strip(),
                            'start': 0,
                            'duration': 1
                        }]
                        
    except Exception as e:
        print(f"Local Whisper method failed: {e}")
    
    return None

def get_transcript_yewtu_be(video_id: str) -> Optional[List[Dict[str, Any]]]:
    """
    Use yewtu.be (Invidious) to get captions
    This is more reliable than direct YouTube API
    """
    try:
        session = requests.Session()
        session.headers.update({
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        })
        
        # Get video info from yewtu.be
        url = f"https://yewtu.be/api/v1/videos/{video_id}"
        response = session.get(url, timeout=30)
        
        if response.status_code == 200:
            data = response.json()
            
            # Look for English captions
            if 'captions' in data:
                for caption in data['captions']:
                    if caption.get('languageCode') in ['en', 'en-US', 'en-GB']:
                        caption_url = f"https://yewtu.be{caption['url']}"
                        
                        # Download caption content
                        cap_response = session.get(caption_url, timeout=30)
                        if cap_response.status_code == 200:
                            content = cap_response.text
                            return parse_vtt_content(content)
                            
    except Exception as e:
        print(f"yewtu.be method failed: {e}")
    
    return None

def parse_vtt_content(content: str) -> List[Dict[str, Any]]:
    """Parse VTT subtitle format"""
    transcript = []
    lines = content.split('\n')
    
    i = 0
    while i < len(lines):
        line = lines[i].strip()
        
        # Look for timestamp line
        if '-->' in line:
            timestamp_match = re.match(r'(\d+:\d+:\d+\.\d+)\s*-->\s*(\d+:\d+:\d+\.\d+)', line)
            if timestamp_match:
                start_time = time_to_seconds(timestamp_match.group(1))
                end_time = time_to_seconds(timestamp_match.group(2))
                
                # Get text from next lines
                text_lines = []
                i += 1
                while i < len(lines) and lines[i].strip() and '-->' not in lines[i]:
                    text_lines.append(lines[i].strip())
                    i += 1
                
                if text_lines:
                    text = ' '.join(text_lines)
                    # Clean HTML tags
                    text = re.sub(r'<[^>]+>', '', text)
                    
                    transcript.append({
                        'text': text,
                        'start': start_time,
                        'duration': end_time - start_time
                    })
        else:
            i += 1
    
    return transcript

def time_to_seconds(time_str: str) -> float:
    """Convert time string to seconds"""
    try:
        parts = time_str.split(':')
        if len(parts) == 3:
            hours = int(parts[0])
            minutes = int(parts[1])
            seconds = float(parts[2])
            return hours * 3600 + minutes * 60 + seconds
        elif len(parts) == 2:
            minutes = int(parts[0])
            seconds = float(parts[1])
            return minutes * 60 + seconds
        else:
            return float(time_str)
    except (ValueError, IndexError):
        return 0.0

def get_working_transcript(video_id: str) -> Optional[List[Dict[str, Any]]]:
    """
    Get transcript using the most reliable working methods
    Prioritizes methods that actually work in cloud environments
    """
    
    # Method 1: OpenAI Whisper API (most reliable, but costs money)
    print("Trying OpenAI Whisper API...")
    result = get_transcript_openai_whisper(video_id)
    if result and len(result) > 0:
        print(f"Success with OpenAI Whisper: {len(result)} segments")
        return result
    
    # Method 2: yewtu.be captions (free and often works)
    print("Trying yewtu.be captions...")
    result = get_transcript_yewtu_be(video_id)
    if result and len(result) > 0:
        print(f"Success with yewtu.be: {len(result)} segments")
        return result
    
    # Method 3: Local Whisper (requires installation)
    print("Trying local Whisper...")
    result = get_transcript_local_whisper(video_id)
    if result and len(result) > 0:
        print(f"Success with local Whisper: {len(result)} segments")
        return result
    
    print("All working transcript methods failed")
    return None

# Command line interface
if __name__ == "__main__":
    if len(sys.argv) != 2:
        print("Usage: python working-transcript-extractor.py <video_id>")
        sys.exit(1)
    
    video_id = sys.argv[1]
    transcript = get_working_transcript(video_id)
    
    if transcript:
        # Return JSON for Node.js to parse
        print(json.dumps(transcript))
    else:
        # Return empty array if no transcript found
        print(json.dumps([]))