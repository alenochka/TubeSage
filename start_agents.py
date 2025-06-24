#!/usr/bin/env python3
"""
Standalone script to start the Python agent server
"""
import subprocess
import os
import sys

def start_python_agents():
    """Start the Python FastAPI agent server"""
    try:
        # Change to server directory
        server_dir = os.path.join(os.path.dirname(__file__), 'server')
        
        # Start the Python agent server
        cmd = [sys.executable, 'python_agent_server.py']
        process = subprocess.Popen(
            cmd,
            cwd=server_dir,
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
            text=True
        )
        
        print(f"Started Python agent server with PID: {process.pid}")
        
        # Monitor the process
        stdout, stderr = process.communicate()
        
        if process.returncode != 0:
            print(f"Python agent server failed: {stderr}")
        else:
            print("Python agent server started successfully")
            
    except Exception as e:
        print(f"Failed to start Python agent server: {e}")

if __name__ == "__main__":
    start_python_agents()