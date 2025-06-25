"""
Academic Web Scraper Agent - Finds educational content from academic sources
"""

import asyncio
import re
import json
from typing import Dict, List, Any, Optional
from .base_agent import BaseAgent
import logging
# Note: aiohttp would be used for real web scraping but we'll use mock data for now

class AcademicScraper(BaseAgent):
    """Agent responsible for finding academic course content from university websites"""
    
    def __init__(self):
        super().__init__("Academic Scraper", "Searches academic websites for educational content and YouTube videos")
        self.academic_domains = [
            'mit.edu',
            'stanford.edu', 
            'harvard.edu',
            'berkeley.edu',
            'cmu.edu',
            'coursera.org',
            'edx.org',
            'khanacademy.org',
            'ocw.mit.edu',
            'cs.stanford.edu',
            'www.cs.cmu.edu',
            'www.edx.org',
            'www.coursera.org'
        ]
        
        self.youtube_patterns = [
            r'youtube\.com/watch\?v=([a-zA-Z0-9_-]+)',
            r'youtu\.be/([a-zA-Z0-9_-]+)',
            r'youtube\.com/embed/([a-zA-Z0-9_-]+)'
        ]

    async def process_task(self, task: Dict[str, Any]) -> Dict[str, Any]:
        """Process an academic content search task"""
        try:
            action = task.get('action')
            
            if action == 'search_academic_content':
                return await self._search_academic_content(
                    task.get('topic'),
                    task.get('field'),
                    task.get('level', 'graduate')
                )
            elif action == 'scrape_course_page':
                return await self._scrape_course_page(task.get('url'))
            else:
                return {"error": "Unknown action", "action": action}
                
        except Exception as e:
            self.log_action(f"Error processing task: {str(e)}", "error")
            return {"error": str(e)}

    async def _search_academic_content(self, topic: str, field: str, level: str) -> Dict[str, Any]:
        """Search academic websites for course content"""
        self.log_action(f"Searching academic content for: {topic} in {field}")
        
        search_queries = self._build_academic_queries(topic, field, level)
        found_content = []
        
        # Simulate academic search - in production would use real web scraping
        for query in search_queries:
            try:
                content = await self._search_with_query(None, query, topic, field)
                found_content.extend(content)
            except Exception as e:
                self.log_action(f"Error with query '{query}': {str(e)}", "warning")
                continue
        
        # Deduplicate and rank content
        unique_content = self._deduplicate_content(found_content)
        ranked_content = await self._rank_content(unique_content, topic, field)
        
        return {
            "success": True,
            "topic": topic,
            "field": field,
            "content_found": len(ranked_content),
            "academic_videos": ranked_content[:20]  # Return top 20
        }

    def _build_academic_queries(self, topic: str, field: str, level: str) -> List[str]:
        """Build search queries for academic content"""
        base_terms = [
            f"{topic} {field} course",
            f"{topic} {field} lecture",
            f"{topic} {field} tutorial",
            f"{topic} {field} introduction",
            f"{field} {topic} basics"
        ]
        
        academic_modifiers = [
            "site:mit.edu",
            "site:stanford.edu", 
            "site:coursera.org",
            "site:edx.org",
            "site:ocw.mit.edu",
            "\"youtube.com\" OR \"youtu.be\""
        ]
        
        queries = []
        for term in base_terms:
            for modifier in academic_modifiers:
                queries.append(f"{term} {modifier}")
        
        return queries

    async def _search_with_query(self, session, query: str, topic: str, field: str) -> List[Dict]:
        """Search with a specific query and extract YouTube content"""
        # Use a simple search approach - in production, you'd use Google Custom Search API
        # For now, we'll simulate finding academic content
        
        mock_academic_results = await self._get_mock_academic_content(topic, field)
        return mock_academic_results

    async def _get_mock_academic_content(self, topic: str, field: str) -> List[Dict]:
        """Get curated academic content - replace with real scraping in production"""
        
        # Academic video collections by topic
        academic_videos = {
            "machine learning": [
                {
                    "title": "MIT 6.034 Artificial Intelligence, Fall 2010 - Lecture 1",
                    "youtube_id": "TjZBTDzGeGg",
                    "source": "MIT OpenCourseWare",
                    "description": "Introduction to Artificial Intelligence course from MIT",
                    "duration": "48:48",
                    "academic_score": 0.95,
                    "university": "MIT"
                },
                {
                    "title": "Stanford CS229: Machine Learning - Lecture 1",
                    "youtube_id": "jGwO_UgTS7I", 
                    "source": "Stanford Online",
                    "description": "Andrew Ng's famous machine learning course",
                    "duration": "1:18:49",
                    "academic_score": 0.98,
                    "university": "Stanford"
                },
                {
                    "title": "Neural Networks for Machine Learning - Geoffrey Hinton",
                    "youtube_id": "cbeTc-Urqak",
                    "source": "University of Toronto",
                    "description": "Deep learning fundamentals by Geoffrey Hinton", 
                    "duration": "1:15:23",
                    "academic_score": 0.96,
                    "university": "University of Toronto"
                }
            ],
            "deep learning": [
                {
                    "title": "MIT 6.S191: Introduction to Deep Learning",
                    "youtube_id": "njKP3FqW3Sk",
                    "source": "MIT",
                    "description": "Comprehensive introduction to deep learning",
                    "duration": "45:07",
                    "academic_score": 0.94,
                    "university": "MIT"
                },
                {
                    "title": "CS231n: Convolutional Neural Networks - Stanford",
                    "youtube_id": "OoUX-nOEjG0",
                    "source": "Stanford",
                    "description": "Visual recognition with convolutional networks",
                    "duration": "1:16:26", 
                    "academic_score": 0.97,
                    "university": "Stanford"
                }
            ],
            "algorithms": [
                {
                    "title": "MIT 6.006 Introduction to Algorithms, Fall 2011 - Lecture 1",
                    "youtube_id": "HtSuA80QTyo",
                    "source": "MIT OpenCourseWare",
                    "description": "Peak Finding algorithm introduction",
                    "duration": "47:26",
                    "academic_score": 0.96,
                    "university": "MIT"
                },
                {
                    "title": "Algorithms Specialization - Stanford (Coursera)",
                    "youtube_id": "yRM3sc57q0c",
                    "source": "Stanford/Coursera", 
                    "description": "Divide and conquer algorithms",
                    "duration": "13:52",
                    "academic_score": 0.93,
                    "university": "Stanford"
                }
            ],
            "computer science": [
                {
                    "title": "Harvard CS50 2021 - Lecture 0 - Scratch",
                    "youtube_id": "YoXxevp1WRQ",
                    "source": "Harvard",
                    "description": "Introduction to Computer Science",
                    "duration": "1:47:13",
                    "academic_score": 0.95,
                    "university": "Harvard"
                },
                {
                    "title": "MIT 6.001 Structure and Interpretation of Computer Programs",
                    "youtube_id": "2Op3QLzMgSY",
                    "source": "MIT",
                    "description": "Classic computer science fundamentals",
                    "duration": "1:05:58",
                    "academic_score": 0.97,
                    "university": "MIT"
                }
            ]
        }
        
        # Find matching content
        matching_videos = []
        topic_lower = topic.lower()
        
        for key, videos in academic_videos.items():
            if any(word in topic_lower for word in key.split()):
                matching_videos.extend(videos)
        
        # If no direct match, return general computer science content
        if not matching_videos and field.lower() == "computer science":
            matching_videos = academic_videos.get("computer science", [])
        
        return matching_videos

    def _deduplicate_content(self, content: List[Dict]) -> List[Dict]:
        """Remove duplicate content based on YouTube ID"""
        seen_ids = set()
        unique_content = []
        
        for item in content:
            youtube_id = item.get('youtube_id')
            if youtube_id and youtube_id not in seen_ids:
                seen_ids.add(youtube_id)
                unique_content.append(item)
        
        return unique_content

    async def _rank_content(self, content: List[Dict], topic: str, field: str) -> List[Dict]:
        """Rank content by academic quality and relevance"""
        
        for item in content:
            score = 0
            
            # Academic source bonus
            if item.get('university') in ['MIT', 'Stanford', 'Harvard', 'CMU']:
                score += 0.3
            elif item.get('source', '').lower() in ['coursera', 'edx']:
                score += 0.2
            
            # Title relevance
            title_lower = item.get('title', '').lower()
            topic_words = topic.lower().split()
            matching_words = sum(1 for word in topic_words if word in title_lower)
            score += (matching_words / len(topic_words)) * 0.3
            
            # Duration preference (10-60 minutes ideal for lectures)
            duration = item.get('duration', '0:00')
            minutes = self._parse_duration_minutes(duration)
            if 10 <= minutes <= 60:
                score += 0.2
            elif 5 <= minutes <= 90:
                score += 0.1
            
            # Academic score from source
            score += item.get('academic_score', 0.5) * 0.2
            
            item['final_score'] = min(score, 1.0)
        
        # Sort by final score
        return sorted(content, key=lambda x: x.get('final_score', 0), reverse=True)

    def _parse_duration_minutes(self, duration: str) -> int:
        """Parse duration string to minutes"""
        try:
            parts = duration.split(':')
            if len(parts) == 2:  # MM:SS
                return int(parts[0])
            elif len(parts) == 3:  # HH:MM:SS
                return int(parts[0]) * 60 + int(parts[1])
            return 0
        except:
            return 0

    async def _scrape_course_page(self, url: str) -> Dict[str, Any]:
        """Scrape a specific course page for video content"""
        # Mock implementation - in production would scrape actual course pages
        return {
            "success": True,
            "url": url,
            "youtube_videos": ["TjZBTDzGeGg", "jGwO_UgTS7I"],  # Mock MIT and Stanford videos
            "video_count": 2
        }