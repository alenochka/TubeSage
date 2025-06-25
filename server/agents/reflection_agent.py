"""
Reflection Agent implementing ReAct pattern for evaluating responses and suggesting improvements
"""

import json
import openai
import os
from typing import Dict, Any, List
from .base_agent import BaseAgent


class ReflectionAgent(BaseAgent):
    """Agent that reflects on generated responses and provides improvement suggestions"""
    
    def __init__(self):
        super().__init__(
            name="Reflection Agent",
            description="Evaluates response quality and suggests improvements using ReAct pattern"
        )
        self.openai_client = openai.OpenAI(api_key=os.getenv('OPENAI_API_KEY'))
    
    async def process_task(self, task: Dict[str, Any]) -> Dict[str, Any]:
        """Process a reflection task"""
        try:
            task_type = task.get('type', 'evaluate_response')
            
            if task_type == 'evaluate_response':
                return await self._evaluate_response(task)
            else:
                return {
                    'success': False,
                    'error': f'Unknown task type: {task_type}'
                }
                
        except Exception as e:
            self.log_action(f"Error processing reflection task: {e}", "error")
            return {
                'success': False,
                'error': str(e)
            }
    
    async def _evaluate_response(self, task: Dict[str, Any]) -> Dict[str, Any]:
        """Evaluate response quality and suggest improvements"""
        try:
            query = task.get('query', '')
            response = task.get('response', '')
            source_contexts = task.get('source_contexts', [])
            
            # Construct evaluation prompt
            evaluation_prompt = self._build_evaluation_prompt(query, response, source_contexts)
            
            # Get LLM evaluation
            evaluation = await self._get_llm_evaluation(evaluation_prompt)
            
            # Parse evaluation results
            parsed_evaluation = self._parse_evaluation(evaluation)
            
            # Generate suggestions based on evaluation
            suggestions = await self._generate_suggestions(query, response, parsed_evaluation, source_contexts)
            
            return {
                'success': True,
                'evaluation': parsed_evaluation,
                'suggestions': suggestions,
                'reflection_score': parsed_evaluation.get('overall_score', 0)
            }
            
        except Exception as e:
            self.log_action(f"Error evaluating response: {e}", "error")
            return {
                'success': False,
                'error': str(e)
            }
    
    def _build_evaluation_prompt(self, query: str, response: str, source_contexts: List[Dict]) -> str:
        """Build comprehensive evaluation prompt"""
        
        context_summary = "\n".join([
            f"Source {i+1}: {ctx.get('content', '')[:200]}..."
            for i, ctx in enumerate(source_contexts[:3])
        ])
        
        return f"""
You are an expert AI response evaluator. Analyze the quality of this Q&A interaction:

ORIGINAL QUERY: {query}

AI RESPONSE: {response}

SOURCE CONTEXTS USED:
{context_summary}

Evaluate the response on these dimensions (scale 1-10):

1. RELEVANCE: How well does the response address the specific question?
2. ACCURACY: How factually correct is the information based on source contexts?
3. COMPLETENESS: Does the response fully answer the question?
4. CLARITY: How clear and understandable is the response?
5. SOURCE_UTILIZATION: How effectively are the source contexts used?

Respond in JSON format:
{{
    "relevance_score": <1-10>,
    "accuracy_score": <1-10>,
    "completeness_score": <1-10>,
    "clarity_score": <1-10>,
    "source_utilization_score": <1-10>,
    "overall_score": <1-10>,
    "strengths": ["list", "of", "strengths"],
    "weaknesses": ["list", "of", "weaknesses"],
    "missing_information": ["what", "could", "be", "added"],
    "factual_concerns": ["any", "potential", "inaccuracies"]
}}
"""
    
    async def _get_llm_evaluation(self, prompt: str) -> str:
        """Get LLM evaluation of the response"""
        try:
            if not self.openai_client.api_key:
                # Mock evaluation for demonstration
                return self._mock_evaluation()
            
            response = self.openai_client.chat.completions.create(
                model="gpt-4o",  # the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
                messages=[
                    {
                        "role": "system",
                        "content": "You are an expert AI response evaluator. Provide detailed, objective analysis in JSON format."
                    },
                    {
                        "role": "user",
                        "content": prompt
                    }
                ],
                response_format={"type": "json_object"},
                temperature=0.3
            )
            
            return response.choices[0].message.content
            
        except Exception as e:
            self.log_action(f"Error getting LLM evaluation: {e}", "error")
            return self._mock_evaluation()
    
    def _mock_evaluation(self) -> str:
        """Mock evaluation for demonstration purposes"""
        return json.dumps({
            "relevance_score": 7,
            "accuracy_score": 8,
            "completeness_score": 6,
            "clarity_score": 8,
            "source_utilization_score": 7,
            "overall_score": 7,
            "strengths": ["Clear explanation", "Good use of sources", "Well structured"],
            "weaknesses": ["Could be more comprehensive", "Missing some context"],
            "missing_information": ["More specific examples", "Additional background context"],
            "factual_concerns": []
        })
    
    def _parse_evaluation(self, evaluation_json: str) -> Dict[str, Any]:
        """Parse and validate evaluation JSON"""
        try:
            evaluation = json.loads(evaluation_json)
            
            # Ensure all required fields exist with defaults
            required_fields = {
                'relevance_score': 5,
                'accuracy_score': 5,
                'completeness_score': 5,
                'clarity_score': 5,
                'source_utilization_score': 5,
                'overall_score': 5,
                'strengths': [],
                'weaknesses': [],
                'missing_information': [],
                'factual_concerns': []
            }
            
            for field, default in required_fields.items():
                if field not in evaluation:
                    evaluation[field] = default
            
            return evaluation
            
        except json.JSONDecodeError:
            self.log_action("Failed to parse evaluation JSON", "error")
            return {
                'relevance_score': 5,
                'accuracy_score': 5,
                'completeness_score': 5,
                'clarity_score': 5,
                'source_utilization_score': 5,
                'overall_score': 5,
                'strengths': [],
                'weaknesses': ["Evaluation parsing failed"],
                'missing_information': [],
                'factual_concerns': []
            }
    
    async def _generate_suggestions(self, query: str, response: str, evaluation: Dict[str, Any], source_contexts: List[Dict]) -> Dict[str, Any]:
        """Generate actionable suggestions based on evaluation"""
        
        suggestions = {
            'refined_queries': [],
            'related_queries': [],
            'search_suggestions': [],
            'next_steps': []
        }
        
        overall_score = evaluation.get('overall_score', 5)
        weaknesses = evaluation.get('weaknesses', [])
        missing_info = evaluation.get('missing_information', [])
        
        # Generate refined queries if response needs improvement
        if overall_score < 7:
            suggestions['refined_queries'] = await self._suggest_refined_queries(query, weaknesses, missing_info)
        
        # Generate related queries for exploration
        suggestions['related_queries'] = await self._suggest_related_queries(query, source_contexts)
        
        # Generate search suggestions for external research
        if overall_score < 6 or 'incomplete' in str(weaknesses).lower():
            suggestions['search_suggestions'] = self._suggest_search_keywords(query, missing_info)
        
        # Generate next steps based on evaluation
        suggestions['next_steps'] = self._suggest_next_steps(evaluation, query)
        
        return suggestions
    
    async def _suggest_refined_queries(self, original_query: str, weaknesses: List[str], missing_info: List[str]) -> List[str]:
        """Generate refined query suggestions"""
        
        # Base refined queries on identified issues
        refined_queries = []
        
        if 'more specific' in str(weaknesses).lower() or 'vague' in str(weaknesses).lower():
            refined_queries.append(f"Can you provide more specific details about {original_query.lower()}?")
            refined_queries.append(f"What are the key technical aspects of {original_query.lower()}?")
        
        if 'context' in str(missing_info).lower():
            refined_queries.append(f"What is the background context for {original_query.lower()}?")
            refined_queries.append(f"How does {original_query.lower()} relate to the broader field?")
        
        if 'examples' in str(missing_info).lower():
            refined_queries.append(f"Can you provide concrete examples of {original_query.lower()}?")
            refined_queries.append(f"What are real-world applications of {original_query.lower()}?")
        
        # Generic improvements if no specific issues identified
        if not refined_queries:
            refined_queries = [
                f"What are the most important points about {original_query.lower()}?",
                f"Can you explain {original_query.lower()} in more detail?",
                f"What are the practical implications of {original_query.lower()}?"
            ]
        
        return refined_queries[:3]  # Return top 3 suggestions
    
    async def _suggest_related_queries(self, original_query: str, source_contexts: List[Dict]) -> List[str]:
        """Generate related query suggestions based on available content"""
        
        related_queries = []
        
        # Extract key topics from source contexts
        topics = set()
        for context in source_contexts[:5]:
            content = context.get('content', '').lower()
            video_title = context.get('videoTitle', '').lower()
            
            # Extract potential topics (simple keyword extraction)
            words = content.split() + video_title.split()
            technical_terms = [word for word in words if len(word) > 5 and word.isalpha()]
            topics.update(technical_terms[:3])
        
        # Generate related queries from topics
        for topic in list(topics)[:3]:
            related_queries.append(f"What is the significance of {topic} in this context?")
            related_queries.append(f"How does {topic} compare to other approaches?")
        
        # Add some generic related queries
        generic_related = [
            f"What are the limitations of {original_query.lower()}?",
            f"What future developments are expected in {original_query.lower()}?",
            f"Who are the key researchers working on {original_query.lower()}?"
        ]
        
        related_queries.extend(generic_related)
        
        return list(set(related_queries))[:4]  # Return unique queries, max 4
    
    def _suggest_search_keywords(self, query: str, missing_info: List[str]) -> List[str]:
        """Suggest YouTube search keywords for additional research"""
        
        # Extract key terms from query
        query_words = query.lower().split()
        key_terms = [word for word in query_words if len(word) > 3 and word.isalpha()]
        
        search_suggestions = []
        
        # Build search suggestions
        if len(key_terms) >= 2:
            search_suggestions.append(f"{key_terms[0]} {key_terms[1]} tutorial")
            search_suggestions.append(f"{key_terms[0]} {key_terms[1]} explained")
            search_suggestions.append(f"{key_terms[0]} {key_terms[1]} research")
        
        # Add missing information searches
        for info in missing_info[:2]:
            if len(info) > 5:
                search_suggestions.append(f"{info} examples")
        
        # Generic search patterns
        search_suggestions.extend([
            f"{' '.join(key_terms[:2])} conference talk",
            f"{' '.join(key_terms[:2])} deep dive",
            f"{' '.join(key_terms[:2])} latest research"
        ])
        
        return list(set(search_suggestions))[:4]
    
    def _suggest_next_steps(self, evaluation: Dict[str, Any], query: str) -> List[str]:
        """Suggest concrete next steps based on evaluation"""
        
        overall_score = evaluation.get('overall_score', 5)
        next_steps = []
        
        if overall_score >= 8:
            next_steps = [
                "The response looks comprehensive. Consider exploring related topics.",
                "Try asking about specific applications or implementations.",
                "Look for recent developments or research updates."
            ]
        elif overall_score >= 6:
            next_steps = [
                "The response is good but could be improved. Try a more specific query.",
                "Consider asking for examples or practical applications.",
                "Search for additional sources to supplement the information."
            ]
        else:
            next_steps = [
                "The response needs improvement. Try rephrasing your question.",
                "Consider breaking down your query into smaller, specific questions.",
                "Search for foundational content to build understanding first."
            ]
        
        return next_steps