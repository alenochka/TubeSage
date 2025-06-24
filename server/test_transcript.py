#!/usr/bin/env python3
import sys
from youtube_transcript_api import YouTubeTranscriptApi
import json

if len(sys.argv) != 2:
    print(json.dumps({'success': False, 'error': 'YouTube ID required'}))
    sys.exit(1)

youtubeId = sys.argv[1]

try:
    transcript = YouTubeTranscriptApi.get_transcript(youtubeId)
    duration = max([item['start'] + item['duration'] for item in transcript])
    
    video_title = f"YouTube Video {youtubeId}"
    
    # Process transcript into chunks
    chunks = []
    current_chunk = ""
    chunk_start = 0
    chunk_index = 0
    
    for item in transcript:
        current_chunk += item['text'] + " "
        if len(current_chunk) > 500:
            chunks.append({
                'content': current_chunk.strip(),
                'startTime': f"{int(chunk_start//60)}:{int(chunk_start%60):02d}",
                'endTime': f"{int(item['start']//60)}:{int(item['start']%60):02d}",
                'chunkIndex': chunk_index
            })
            current_chunk = ""
            chunk_start = item['start']
            chunk_index += 1
    
    if current_chunk:
        chunks.append({
            'content': current_chunk.strip(),
            'startTime': f"{int(chunk_start//60)}:{int(chunk_start%60):02d}",
            'endTime': f"{int(duration//60)}:{int(duration%60):02d}",
            'chunkIndex': chunk_index
        })
    
    result = {
        'transcript': [item['text'] for item in transcript],
        'duration': f"{int(duration//60)}:{int(duration%60):02d}",
        'chunks': chunks,
        'title': video_title,
        'success': True
    }
    print(json.dumps(result))
    
except Exception as e:
    print(json.dumps({'success': False, 'error': str(e)}))