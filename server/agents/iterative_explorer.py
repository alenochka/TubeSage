import os
import asyncio
from typing import Dict, Any, List, Optional, Tuple
from .base_agent import BaseAgent
import json
from datetime import datetime

class IterativeExplorerAgent(BaseAgent):
    """Agent that performs iterative exploration of video transcripts with query refinement"""
    
    def __init__(self):
        super().__init__(
            name="Iterative Explorer",
            description="Performs multi-hop exploration of video transcripts with intelligent query refinement"
        )
        self.openai_api_key = os.getenv('OPENAI_API_KEY', '')
        self.max_iterations = 5
        self.exploration_depth = 3
        self.similarity_threshold = 0.7
        
    async def process_task(self, task: Dict[str, Any]) -> Dict[str, Any]:
        """Process an iterative exploration task"""
        
        task_type = task.get('type')
        
        if task_type == 'explore_topic':
            return await self._explore_topic(
                initial_query=task.get('query', ''),
                learning_goal=task.get('learning_goal', ''),
                max_hops=task.get('max_hops', self.exploration_depth)
            )
        elif task_type == 'refine_search':
            return await self._refine_search(
                query=task.get('query', ''),
                previous_results=task.get('previous_results', []),
                context=task.get('context', '')
            )
        else:
            raise ValueError(f"Unknown task type: {task_type}")
    
    async def _explore_topic(self, initial_query: str, learning_goal: str, max_hops: int) -> Dict[str, Any]:
        """Perform iterative exploration starting from initial query"""
        
        self.log_action(f"Starting iterative exploration for: {initial_query}")
        
        exploration_graph = {
            'nodes': [],
            'edges': [],
            'queries': [initial_query],
            'insights': []
        }
        
        current_query = initial_query
        visited_videos = set()
        iteration = 0
        
        while iteration < max_hops:
            self.log_action(f"Iteration {iteration + 1}: Exploring '{current_query}'")
            
            # Search for relevant content
            search_results = await self._search_transcripts(current_query)
            
            if not search_results:
                self.log_action("No results found, generating alternative query")
                current_query = await self._generate_alternative_query(current_query, learning_goal)
                if current_query in exploration_graph['queries']:
                    break  # Avoid loops
                exploration_graph['queries'].append(current_query)
                continue
            
            # Process results and extract insights
            new_insights = []
            for result in search_results[:3]:  # Top 3 results
                video_id = result.get('video_id')
                if video_id in visited_videos:
                    continue
                    
                visited_videos.add(video_id)
                
                # Add to exploration graph
                node = {
                    'id': f"video_{video_id}",
                    'type': 'video',
                    'title': result.get('title', ''),
                    'relevance': result.get('score', 0),
                    'iteration': iteration
                }
                exploration_graph['nodes'].append(node)
                
                # Extract key concepts and insights
                insights = await self._extract_insights(result, learning_goal)
                new_insights.extend(insights)
                exploration_graph['insights'].extend(insights)
                
                # Create edges in graph
                if iteration > 0:
                    exploration_graph['edges'].append({
                        'from': exploration_graph['queries'][iteration - 1],
                        'to': video_id,
                        'type': 'discovered_via'
                    })
            
            # Generate follow-up queries based on insights
            follow_up_queries = await self._generate_follow_up_queries(
                new_insights, 
                learning_goal,
                exploration_graph['queries']
            )
            
            if not follow_up_queries:
                break
                
            # Select most promising follow-up query
            current_query = follow_up_queries[0]
            exploration_graph['queries'].append(current_query)
            
            iteration += 1
        
        # Synthesize findings
        synthesis = await self._synthesize_exploration(exploration_graph, learning_goal)
        
        return {
            'success': True,
            'exploration_graph': exploration_graph,
            'synthesis': synthesis,
            'total_videos_explored': len(visited_videos),
            'total_iterations': iteration + 1,
            'queries_used': exploration_graph['queries']
        }
    
    async def _search_transcripts(self, query: str) -> List[Dict[str, Any]]:
        """Search transcripts using the search agent"""
        
        # This would call the search agent
        # For now, returning empty list as search index is empty
        return []
    
    async def _extract_insights(self, search_result: Dict[str, Any], learning_goal: str) -> List[Dict[str, Any]]:
        """Extract key insights from a search result"""
        
        try:
            import openai
            
            if not self.openai_api_key:
                return []
            
            openai.api_key = self.openai_api_key
            
            prompt = f"""
            Given this transcript snippet and learning goal, extract key insights:
            
            Learning Goal: {learning_goal}
            
            Transcript: {search_result.get('text', '')[:1000]}
            
            Extract:
            1. Key concepts mentioned
            2. Related topics to explore
            3. Surprising or novel information
            4. Connections to the learning goal
            
            Format as JSON with keys: concepts, related_topics, novel_info, connections
            """
            
            response = await asyncio.to_thread(
                openai.ChatCompletion.create,
                model="gpt-3.5-turbo",
                messages=[{"role": "user", "content": prompt}],
                temperature=0.7
            )
            
            insights_data = json.loads(response.choices[0].message.content)
            
            return [{
                'video_id': search_result.get('video_id'),
                'timestamp': search_result.get('timestamp', 0),
                **insights_data
            }]
            
        except Exception as e:
            self.log_action(f"Failed to extract insights: {e}", "error")
            return []
    
    async def _generate_follow_up_queries(self, insights: List[Dict], learning_goal: str, previous_queries: List[str]) -> List[str]:
        """Generate intelligent follow-up queries based on insights"""
        
        try:
            import openai
            
            if not self.openai_api_key or not insights:
                return []
            
            openai.api_key = self.openai_api_key
            
            # Aggregate concepts and topics from insights
            all_concepts = []
            all_topics = []
            for insight in insights:
                all_concepts.extend(insight.get('concepts', []))
                all_topics.extend(insight.get('related_topics', []))
            
            prompt = f"""
            Based on these discovered concepts and the learning goal, generate follow-up search queries:
            
            Learning Goal: {learning_goal}
            
            Discovered Concepts: {', '.join(all_concepts[:10])}
            Related Topics: {', '.join(all_topics[:10])}
            Previous Queries: {', '.join(previous_queries)}
            
            Generate 3 follow-up queries that:
            1. Explore deeper into promising concepts
            2. Bridge gaps in understanding
            3. Find practical applications or examples
            
            Avoid repeating previous queries. Return as JSON array.
            """
            
            response = await asyncio.to_thread(
                openai.ChatCompletion.create,
                model="gpt-3.5-turbo",
                messages=[{"role": "user", "content": prompt}],
                temperature=0.8
            )
            
            queries = json.loads(response.choices[0].message.content)
            return queries[:3]  # Top 3 queries
            
        except Exception as e:
            self.log_action(f"Failed to generate follow-up queries: {e}", "error")
            return []
    
    async def _generate_alternative_query(self, original_query: str, learning_goal: str) -> str:
        """Generate alternative query when no results found"""
        
        try:
            import openai
            
            if not self.openai_api_key:
                return original_query + " tutorial"  # Simple fallback
            
            openai.api_key = self.openai_api_key
            
            prompt = f"""
            The search query "{original_query}" returned no results.
            Learning goal: {learning_goal}
            
            Generate an alternative search query that:
            1. Uses simpler or more common terms
            2. Focuses on fundamental concepts
            3. Might find introductory content
            
            Return only the query text.
            """
            
            response = await asyncio.to_thread(
                openai.ChatCompletion.create,
                model="gpt-3.5-turbo",
                messages=[{"role": "user", "content": prompt}],
                temperature=0.7
            )
            
            return response.choices[0].message.content.strip()
            
        except Exception as e:
            self.log_action(f"Failed to generate alternative query: {e}", "error")
            return original_query + " basics"
    
    async def _synthesize_exploration(self, exploration_graph: Dict[str, Any], learning_goal: str) -> Dict[str, Any]:
        """Synthesize findings from the exploration"""
        
        try:
            import openai
            
            if not self.openai_api_key:
                return {
                    'summary': 'Exploration completed',
                    'key_findings': exploration_graph['insights'][:5],
                    'recommended_path': exploration_graph['queries']
                }
            
            openai.api_key = self.openai_api_key
            
            prompt = f"""
            Synthesize the exploration results for this learning goal:
            
            Learning Goal: {learning_goal}
            
            Queries Used: {', '.join(exploration_graph['queries'])}
            Videos Explored: {len(exploration_graph['nodes'])}
            Key Insights: {json.dumps(exploration_graph['insights'][:10], indent=2)}
            
            Provide:
            1. A coherent learning path summary
            2. Key takeaways
            3. Suggested next steps
            4. Gaps that still need exploration
            
            Format as JSON with keys: summary, key_takeaways, next_steps, gaps
            """
            
            response = await asyncio.to_thread(
                openai.ChatCompletion.create,
                model="gpt-3.5-turbo",
                messages=[{"role": "user", "content": prompt}],
                temperature=0.7
            )
            
            synthesis = json.loads(response.choices[0].message.content)
            synthesis['exploration_graph_summary'] = {
                'total_queries': len(exploration_graph['queries']),
                'total_videos': len(exploration_graph['nodes']),
                'total_insights': len(exploration_graph['insights'])
            }
            
            return synthesis
            
        except Exception as e:
            self.log_action(f"Failed to synthesize exploration: {e}", "error")
            return {
                'summary': 'Exploration completed with errors',
                'key_findings': exploration_graph['insights'][:5],
                'recommended_path': exploration_graph['queries']
            }
    
    async def _refine_search(self, query: str, previous_results: List[Dict], context: str) -> Dict[str, Any]:
        """Refine search based on previous results and context"""
        
        try:
            import openai
            
            if not self.openai_api_key:
                return {'refined_query': query, 'strategy': 'no_refinement'}
            
            openai.api_key = self.openai_api_key
            
            # Analyze why previous results might not be satisfactory
            result_summary = []
            for r in previous_results[:5]:
                result_summary.append({
                    'title': r.get('title', ''),
                    'relevance': r.get('score', 0)
                })
            
            prompt = f"""
            Refine this search query based on context and previous results:
            
            Original Query: {query}
            Context: {context}
            Previous Results: {json.dumps(result_summary, indent=2)}
            
            Suggest:
            1. A refined query that better captures intent
            2. Alternative search strategies
            3. Filters or constraints to apply
            
            Format as JSON with keys: refined_query, strategy, filters
            """
            
            response = await asyncio.to_thread(
                openai.ChatCompletion.create,
                model="gpt-3.5-turbo",
                messages=[{"role": "user", "content": prompt}],
                temperature=0.7
            )
            
            refinement = json.loads(response.choices[0].message.content)
            refinement['original_query'] = query
            
            return refinement
            
        except Exception as e:
            self.log_action(f"Failed to refine search: {e}", "error")
            return {
                'refined_query': query,
                'strategy': 'fallback',
                'error': str(e)
            } 