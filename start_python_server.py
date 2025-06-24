#!/usr/bin/env python3
import subprocess
import sys
import os

# Change to server directory
os.chdir('server')

# Set environment variables
env = os.environ.copy()
env['OPENAI_API_KEY'] = env.get('OPENAI_API_KEY', '')
env['PYTHONPATH'] = '.'

# Start the server
cmd = [sys.executable, 'python_agent_server.py']
process = subprocess.Popen(cmd, env=env)

print(f"Started Python agent server with PID: {process.pid}")
process.wait()