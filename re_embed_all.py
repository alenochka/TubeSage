#!/usr/bin/env python3
"""
Re-embed all existing chunks from the database
"""
import asyncio
import os
import sys
import json
import requests
from typing import List, Dict, Any

# Add the server directory to path so we can import our agents
sys.path.append(os.path.join(os.path.dirname(__file__), 'server'))

async def get_all_videos_with_chunks():
    """Get all videos and their chunks from the Node.js API"""
    try:
        # Get all videos
        response = requests.get('http://localhost:3000/api/videos')
        if response.status_code != 200:
            raise Exception(f"Failed to get videos: {response.status_code}")
        
        videos = response.json()
        print(f"Found {len(videos)} videos")
        
        videos_with_chunks = []
        
        for video in videos:
            if video.get('status') == 'indexed' and video.get('chunkCount', 0) > 0:
                # Get chunks for this video
                chunks_response = requests.get(f"http://localhost:3000/api/videos/{video['id']}/chunks")
                if chunks_response.status_code == 200:
                    chunks = chunks_response.json()
                    if chunks:
                        videos_with_chunks.append({
                            'video': video,
                            'chunks': chunks
                        })
                        print(f"Video {video['youtubeId']}: {len(chunks)} chunks")
                else:
                    print(f"No chunks found for video {video['youtubeId']}")
        
        return videos_with_chunks
    
    except Exception as e:
        print(f"Error getting videos: {e}")
        return []

async def embed_video_chunks(video_data: Dict[str, Any]):
    """Embed chunks for a single video using Python agents"""
    try:
        from agents.vector_embedder import VectorEmbedder
        
        embedder = VectorEmbedder()
        video = video_data['video']
        chunks = video_data['chunks']
        
        # Prepare chunks in the format expected by the vector embedder
        formatted_chunks = []
        for chunk in chunks:
            formatted_chunks.append({
                'content': chunk['content'],
                'chunk_index': chunk['chunkIndex'],
                'start_time': chunk.get('startTime', '0:00'),
                'end_time': chunk.get('endTime', '0:00'),
                'video_title': video['title']
            })
        
        # Create embedding task
        task = {
            'type': 'create_embeddings',
            'chunks': formatted_chunks,
            'youtube_id': video['youtubeId']
        }
        
        # Process the task
        result = await embedder.process_task(task)
        print(f"✅ Embedded {result['total_embeddings']} chunks for video: {video['title'][:50]}...")
        
        return result
        
    except Exception as e:
        print(f"❌ Failed to embed video {video['youtubeId']}: {e}")
        return None

async def main():
    """Re-embed all chunks"""
    print("🚀 Starting re-embedding process...")
    
    # Check if services are running
    try:
        response = requests.get('http://localhost:3000/api/videos')
        if response.status_code != 200:
            print("❌ Node.js server not running on port 3000")
            return
    except:
        print("❌ Cannot connect to Node.js server on port 3000")
        return
    
    try:
        response = requests.post('http://localhost:8000/search-transcripts', 
                               json={'query': 'test', 'top_k': 1})
        if response.status_code != 200:
            print("❌ Python agent server not running on port 8000")
            return
    except:
        print("❌ Cannot connect to Python agent server on port 8000")
        return
    
    print("✅ Both servers are running")
    
    # Get all videos with chunks
    videos_with_chunks = await get_all_videos_with_chunks()
    
    if not videos_with_chunks:
        print("❌ No videos with chunks found")
        return
    
    print(f"🔄 Processing {len(videos_with_chunks)} videos...")
    
    # Process each video
    successful = 0
    failed = 0
    
    for video_data in videos_with_chunks:
        result = await embed_video_chunks(video_data)
        if result:
            successful += 1
        else:
            failed += 1
    
    print(f"\n📊 Re-embedding complete!")
    print(f"✅ Successfully embedded: {successful} videos")
    print(f"❌ Failed: {failed} videos")
    
    # Test the search
    print("\n🔍 Testing search...")
    try:
        test_response = requests.post('http://localhost:8000/search-transcripts', 
                                    json={'query': 'machine learning', 'top_k': 3})
        if test_response.status_code == 200:
            result = test_response.json()
            print(f"✅ Search test successful: {result['data']['total_results']} results found")
        else:
            print(f"❌ Search test failed: {test_response.status_code}")
    except Exception as e:
        print(f"❌ Search test error: {e}")

if __name__ == "__main__":
    asyncio.run(main()) 