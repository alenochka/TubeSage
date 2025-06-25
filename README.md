# YouTube AI Agent System

A sophisticated multi-agent YouTube transcript processing system built with a modern full-stack architecture. Process YouTube videos, extract transcripts, create vector embeddings for semantic search, and query content using AI-powered responses.

## Features

- **Multi-Agent Architecture**: Specialized agents for transcript fetching, text chunking, vector embedding, and query processing
- **ReAct Pattern**: Intelligent response evaluation with suggestions for refined queries
- **Real-time Monitoring**: Live agent status updates with visual pipeline diagram
- **Bulk Processing**: Process entire YouTube channels and playlists efficiently
- **AI-Powered Queries**: Semantic search with retrieval-augmented generation using OpenAI GPT-4o
- **Vector Database**: FAISS-powered similarity search for high-performance queries
- **Modern UI**: React with Tailwind CSS and shadcn/ui components
- **Clickable Timestamps**: Interactive video references with direct navigation

## Tech Stack

### Frontend
- React with TypeScript
- Tailwind CSS + shadcn/ui component library
- TanStack Query for state management
- Wouter for client-side routing
- Framer Motion for animations

### Backend
- Node.js with Express.js
- Python FastAPI for multi-agent system
- PostgreSQL with Drizzle ORM
- FAISS vector database for embeddings
- OpenAI API integration (GPT-4o)
- YouTube Data API v3

## Agent Architecture

- **Transcript Fetcher Agent**: Retrieves YouTube video transcripts
- **Text Chunker Agent**: Splits transcripts into semantic chunks
- **Vector Embedder Agent**: Creates and manages vector embeddings
- **Query Processor Agent**: Handles user queries with RAG

## Getting Started

### Prerequisites
- Node.js 20+
- Python 3.11+
- PostgreSQL
- OpenAI API key
- YouTube Data API key (optional, for enhanced features)

### Installation

1. **Clone the repository**
```bash
git clone https://github.com/alenochka/MultiAgentCollab2.git
cd MultiAgentCollab2
```

2. **Install Node.js dependencies**
```bash
npm install
```

3. **Install Python dependencies using uv (Recommended for macOS)**

Install uv package manager:
```bash
# macOS (using Homebrew)
brew install uv

# macOS (using curl)
curl -LsSf https://astral.sh/uv/install.sh | sh
```

Set up Python environment with uv:
```bash
# Create virtual environment with Python 3.11
uv venv --python 3.11

# Activate virtual environment
source .venv/bin/activate  # On Windows: .venv\Scripts\activate

# Install dependencies from pyproject.toml
uv pip install -e .
```

4. **Set up PostgreSQL database**
```bash
# Create database (adjust username as needed)
createdb youtube_ai_agents
```

5. **Set up environment variables**
```bash
# Copy environment template
cp .env.example .env

# Edit .env file with your configuration:
DATABASE_URL="postgresql://your_username@localhost:5432/youtube_ai_agents"
OPENAI_API_KEY="your_openai_api_key_here"
YOUTUBE_API_KEY="your_youtube_api_key_here"  # Optional
```

6. **Initialize database**
```bash
npm run db:push
```

### Running the Application

**Development Mode (Two Terminal Approach)**

Terminal 1 - Start Python agent server:
```bash
source .venv/bin/activate
python -m uvicorn server.python_agent_server:app --host 0.0.0.0 --port 8000
```

Terminal 2 - Start Node.js frontend server:
```bash
npm run dev
```

**Access the application**
- Frontend: http://localhost:5173
- Python API: http://localhost:8000
- Health check: http://localhost:8000/health

## Usage

### Processing YouTube Content
- **Single Video**: Enter a YouTube video URL to extract and process transcripts
- **Bulk Channel Processing**: Process entire channels by entering channel URLs
- **Playlist Processing**: Import and process YouTube playlists efficiently

### AI-Powered Queries
- **Ask Questions**: Submit natural language queries about processed video content
- **View Sources**: See relevant transcript chunks with clickable timestamps
- **Reflection Suggestions**: Get intelligent suggestions for refined queries and related questions

### Real-time Monitoring
- **Agent Activity**: Monitor the 4-agent pipeline with visual status indicators
- **Processing Status**: Track video processing progress in real-time

## API Endpoints

### Video Processing
- `POST /api/videos/process` - Process a single YouTube video
- `POST /api/videos/process-channel` - Process entire YouTube channel
- `POST /api/videos/process-playlist` - Process YouTube playlist
- `GET /api/videos` - Get all processed videos
- `DELETE /api/videos/:id` - Delete a video and its chunks

### Query System
- `POST /api/query` - Submit AI-powered queries with reflection
- `GET /api/queries` - Get query history

### Agent Management
- `GET /api/agents` - Get agent status and metrics
- `GET /api/system/metrics` - Get overall system metrics
- `GET /api/system/logs` - Get system activity logs

### Python Agent Server
- `GET /health` - Health check endpoint
- `POST /process_video` - Process video through agent pipeline
- `POST /query` - Query processed content

## Project Structure

```
├── client/                 # React frontend
│   ├── src/
│   │   ├── components/     # UI components
│   │   ├── pages/          # Page components
│   │   ├── hooks/          # Custom hooks
│   │   └── lib/            # Utilities
├── server/                 # Backend services
│   ├── agents/             # Python agent system
│   │   ├── __init__.py
│   │   ├── orchestrator.py
│   │   ├── transcript_fetcher.py
│   │   ├── text_chunker.py
│   │   ├── vector_embedder.py
│   │   └── query_processor.py
│   ├── services/           # Business logic
│   │   ├── __init__.py
│   │   └── vector_db.py
│   ├── routes.ts           # Express routes
│   ├── storage.ts          # Database operations
│   ├── index.ts            # Main Express server
│   └── python_agent_server.py  # FastAPI server
├── shared/                 # Shared types and schemas
└── database/               # Database migrations and schema
```

## Environment Variables

```bash
# Required
OPENAI_API_KEY=sk-...openai_key
DATABASE_URL=postgresql://username@localhost:5432/youtube_ai_agents

# Optional
YOUTUBE_API_KEY=youtube_api_key  # For enhanced metadata
```

## Database Schema

The system uses PostgreSQL with the following main tables:

- **videos**: Stores video metadata and processing status
- **transcripts**: Raw transcript data with timestamps
- **chunks**: Processed text chunks for vector search
- **embeddings**: Vector embeddings for semantic search
- **queries**: Query history and responses
- **agents**: Agent status and metrics
- **system_logs**: Detailed activity logs

## Troubleshooting

### Common Issues

1. **Port conflicts**: If ports 5173 or 8000 are in use, kill processes with:
   ```bash
   lsof -ti:5173 | xargs kill -9
   lsof -ti:8000 | xargs kill -9
   ```

2. **Python import errors**: Ensure you're in the project root and virtual environment is activated:
   ```bash
   source .venv/bin/activate
   ```

3. **Database connection**: Verify PostgreSQL is running and database exists:
   ```bash
   psql -d youtube_ai_agents -c "SELECT 1;"
   ```

## Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/new-feature`
3. Make changes and add tests if applicable
4. Commit changes: `git commit -m "Add new feature"`
5. Push to the branch: `git push origin feature/new-feature`
6. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Credits

Built with modern web technologies and AI frameworks:

- **Frontend**: React, TypeScript, Tailwind CSS, shadcn/ui
- **Backend**: Node.js, Express, Python FastAPI
- **Database**: PostgreSQL, Drizzle ORM
- **AI/ML**: OpenAI API, LangChain, FAISS
- **Development**: Vite, uv package manager