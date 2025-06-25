#!/usr/bin/env python3
"""
FastAPI server for Python agents integration with the Node.js Express server
"""

import asyncio
import json
import os
import sys
from typing import Dict, Any, List
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import uvicorn

# Set up environment
os.environ.setdefault('PYTHONPATH', os.path.dirname(__file__))

# Add the agents directory to the Python path
current_dir = os.path.dirname(os.path.abspath(__file__))
agents_dir = os.path.join(current_dir, 'agents')
services_dir = os.path.join(current_dir, 'services')
sys.path.insert(0, current_dir)
sys.path.insert(0, agents_dir)
sys.path.insert(0, services_dir)

from agents.orchestrator import AgentOrchestrator

app = FastAPI(title="YouTube AI Agent System - Python Backend")

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, specify actual origins
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize the agent orchestrator
orchestrator = AgentOrchestrator()

@app.on_event("startup")
async def startup_event():
    """Initialize agents on startup"""
    print("Starting Python agent orchestrator...")
    print(f"Available agents: {[agent.name for agent in [orchestrator.transcript_fetcher, orchestrator.text_chunker, orchestrator.vector_embedder, orchestrator.query_processor]]}")

@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {"status": "healthy", "service": "python-agents"}

@app.post("/process-video")
async def process_video(request: Dict[str, Any]):
    """Process a YouTube video through the agent pipeline"""
    try:
        youtube_url = request.get("youtube_url")
        if not youtube_url:
            raise HTTPException(status_code=400, detail="youtube_url is required")
        
        result = await orchestrator.process_video(youtube_url)
        return {"success": True, "data": result}
    
    except Exception as e:
        print(f"Error processing video: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to process video: {str(e)}")

@app.post("/process-query")
async def process_query(request: Dict[str, Any]):
    """Process a user query through the agent pipeline"""
    try:
        query = request.get("query")
        if not query:
            raise HTTPException(status_code=400, detail="query is required")
        
        result = await orchestrator.process_query(query)
        return {"success": True, "data": result}
    
    except Exception as e:
        print(f"Error processing query: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to process query: {str(e)}")

@app.get("/agents/status")
async def get_agent_status():
    """Get status of all agents"""
    try:
        statuses = orchestrator.get_agent_statuses()
        return {"success": True, "data": statuses}
    
    except Exception as e:
        print(f"Error getting agent status: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to get agent status: {str(e)}")

@app.get("/system/metrics")
async def get_system_metrics():
    """Get system metrics"""
    try:
        metrics = orchestrator.get_system_metrics()
        return {"success": True, "data": metrics}
    
    except Exception as e:
        print(f"Error getting system metrics: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to get system metrics: {str(e)}")

if __name__ == "__main__":
    # Run the FastAPI server
    port = int(os.environ.get("PYTHON_AGENT_PORT", "8000"))
    print(f"Starting Python agent server on port {port}...")
    uvicorn.run(
        app,
        host="0.0.0.0",
        port=port,
        log_level="info"
    )