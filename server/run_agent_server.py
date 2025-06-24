#!/usr/bin/env python3
"""Simple script to run the agent server with proper imports"""
import os
import sys
import uvicorn

# Set up paths
current_dir = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, current_dir)
sys.path.insert(0, os.path.join(current_dir, 'agents'))
sys.path.insert(0, os.path.join(current_dir, 'services'))

# Set environment
os.environ['PYTHONPATH'] = current_dir

# Import and run
try:
    from python_agent_server import app
    print("Starting Python agent server on port 8000...")
    uvicorn.run(app, host="0.0.0.0", port=8000, log_level="info")
except Exception as e:
    print(f"Failed to start server: {e}")
    import traceback
    traceback.print_exc()