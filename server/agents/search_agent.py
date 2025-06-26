import os
import asyncio
import numpy as np
from typing import Dict, Any, List

from .base_agent import BaseAgent

class SearchAgent(BaseAgent):
    """Agent responsible for searching through indexed video transcripts using keywords and semantic search"""
    
    def __init__(self):
        super().__init__(
            name="Search Agent",
            description="Searches through indexed video transcripts using keywords and semantic search"
        )

        # API key for embeddings
        self.openai_api_key = os.getenv("OPENAI_API_KEY", "")

        # Shared vector database (imported lazily to avoid circular imports)
        try:
            import sys
            sys.path.append(os.getenv('VECTOR_DB_PATH', os.path.dirname(os.path.dirname(__file__))))
            from services.vector_db import vector_db

            self.vector_db = vector_db
        except Exception as e:
            # This should not happen – fallback to None so we can raise later
            self.vector_db = None
            self.log_action(f"Failed to import shared VectorDatabase: {e}", "error")

        # Config
        self.max_results = 15  # Increased for better recall
        self.min_similarity_threshold = 0.2  # Lower threshold for more results
        
        # Optional re-ranking model (e.g. OpenAI text-embedding-3-small). Set RERANK_MODEL to empty to disable
        self.rerank_model = os.getenv("RERANK_MODEL", "text-embedding-3-small")  # leave default empty string to skip

    async def process_task(self, task: Dict[str, Any]) -> Dict[str, Any]:
        """Handle a task coming from the orchestrator"""

        task_type = task.get("type")

        # Legacy compatibility: orchestrator may send 'update_search_index' – we can safely ignore now
        if task_type == "update_search_index":
            # No-op because VectorEmbedder already writes to the shared DB
            return {"status": "ok", "message": "search index updated (noop)"}

        if task_type != "search":
            raise ValueError("SearchAgent only handles tasks of type 'search'")

        query = task.get("query", "").strip()
        search_type = task.get("search_type", "hybrid")

        if not query:
            raise ValueError("query text is required")

        # Dispatch
        if search_type == "keyword":
            return await self._keyword_search(query)
        elif search_type == "semantic":
            return await self._semantic_search(query)
        else:
            return await self._hybrid_search(query)

    # ------------------------- Internal helpers -----------------------------

    async def _keyword_search(self, query: str) -> Dict[str, Any]:
        """Naive keyword search over metadata/content in the vector store."""

        if not self.vector_db:
            raise RuntimeError("Vector database not initialised")

        matches = []

        for vector_id, meta in self.vector_db.metadata.items():
            content = meta.get("content", "")
            if query.lower() in content.lower():
                matches.append({
                    "id": vector_id,
                    "similarity": 1.0,  # full keyword match scored high
                    "metadata": meta,
                })

        return {
            "query": query,
            "total_results": len(matches),
            "results": matches[: self.max_results],
        }

    async def _semantic_search(self, query: str) -> Dict[str, Any]:
        """Embedding-based similarity search via OpenAI + vector DB."""

        if not self.vector_db:
            raise RuntimeError("Vector database not initialised")

        embedding = await self._get_embedding(query)

        matches = self.vector_db.search_similar(
            embedding, top_k=self.max_results, threshold=self.min_similarity_threshold
        )

        # Optional re-ranking step using smaller cross-encoder-style model
        if self.rerank_model:
            matches = await self._rerank(query, matches)

        return {
            "query": query,
            "total_results": len(matches),
            "results": matches,
        }

    async def _hybrid_search(self, query: str) -> Dict[str, Any]:
        """Combine keyword & semantic search with simple union & re-rank."""

        kw_res = await self._keyword_search(query)
        sem_res = await self._semantic_search(query)

        combined = {item["id"]: item for item in sem_res["results"]}
        for m in kw_res["results"]:
            combined.setdefault(m["id"], m)

        # Re-rank by similarity if available else by keyword presence
        ranked = sorted(combined.values(), key=lambda x: x.get("similarity", 0), reverse=True)

        return {
            "query": query,
            "total_results": len(ranked),
            "results": ranked[: self.max_results],
        }

    async def _rerank(self, query: str, matches: List[Dict[str, Any]]):
        """Re-rank retrieved passages using a (smaller) embedding model on the full chunk text."""

        try:
            query_emb = await self._get_embedding(query, model=self.rerank_model)
        except Exception:
            # Fallback – if rerank model fails, keep original ordering
            return matches

        # Compute similarity with the rerank model per passage (sync within thread pool)
        scored = []
        for m in matches:
            content = m["metadata"].get("content", "")
            try:
                chunk_emb = await self._get_embedding(content[:8192], model=self.rerank_model)
                sim = float(np.dot(query_emb, chunk_emb) / (np.linalg.norm(query_emb) * np.linalg.norm(chunk_emb)))
            except Exception:
                sim = m.get("similarity", 0)
            m["similarity_rerank"] = sim
            scored.append(m)

        # Sort by new score (fallback to original)
        return sorted(scored, key=lambda x: x.get("similarity_rerank", x.get("similarity", 0)), reverse=True)

    async def _get_embedding(self, text: str, *, model: str = "text-embedding-ada-002") -> np.ndarray:
        """Obtain OpenAI embedding for the given text using the specified model (async wrapper)."""

        import openai

        if not self.openai_api_key:
            raise RuntimeError("OPENAI_API_KEY not set")

        try:
            client = openai.OpenAI(api_key=self.openai_api_key)
            response = await asyncio.to_thread(
                client.embeddings.create,
                model=model,
                input=text,
            )
            return np.array(response.data[0].embedding, dtype=np.float32)
        except Exception as e:
            self.log_action(f"Embedding request failed: {e}", "error")
            raise 