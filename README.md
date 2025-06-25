# YouTube AI Agent System

A sophisticated multi-agent YouTube transcript processing system built with a modern full-stack architecture. Process YouTube videos, extract transcripts, create vector embeddings for semantic search, and query content using AI-powered responses.

## Features

- **Multi-Agent Architecture**: Specialized agents for transcript fetching, text chunking, vector embedding, query processing, and reflection
- **ReAct Pattern**: Intelligent response evaluation with suggestions for refined queries
- **Real-time Monitoring**: Live agent status updates and system metrics with WebSocket integration
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
- WebSocket for real-time updates
- Framer Motion for animations

### Backend
- Node.js with Express.js
- Python FastAPI for multi-agent system
- PostgreSQL with Drizzle ORM
- FAISS vector database for embeddings
- OpenAI API integration (GPT-4o)
- YouTube Data API v3
- WebSocket server for real-time communication

### Agent Architecture
1. **Transcript Fetcher Agent**: Retrieves YouTube video transcripts
2. **Text Chunker Agent**: Splits transcripts into semantic chunks
3. **Vector Embedder Agent**: Creates and manages vector embeddings
4. **Query Processor Agent**: Handles user queries with RAG
5. **Reflection Agent**: Evaluates responses using ReAct pattern

## Getting Started

### Prerequisites

- **Node.js** 20+
- **Python** 3.11+
- **PostgreSQL** (or use Replit's built-in database)
- **OpenAI API key**
- **YouTube Data API key** (optional, for enhanced features)

### Installation

#### 1. Clone the repository
```bash
git clone https://github.com/alenochka/MultiAgentCollab2.git
cd MultiAgentCollab2
```

#### 2. Install Node.js dependencies
```bash
npm install
```

#### 3. Install Python dependencies using uv (Recommended for macOS)

**Install uv package manager:**
```bash
# macOS (using Homebrew)
brew install uv

# macOS (using curl)
curl -LsSf https://astral.sh/uv/install.sh | sh

# Alternative: using pip
pip install uv
```

**Set up Python environment with uv:**
```bash
# Create virtual environment with Python 3.11
uv venv --python 3.11

# Activate virtual environment
source .venv/bin/activate  # On Windows: .venv\Scripts\activate

# Install dependencies
uv pip install -r server/requirements.txt

# Alternative: Install dependencies directly
uv pip install fastapi uvicorn websockets aiofiles pydantic python-dotenv requests youtube-transcript-api google-api-python-client langchain langchain-openai langchain-google-genai faiss-cpu numpy python-multipart
```

#### 4. Set up environment variables
```bash
# Copy environment template
cp .env.example .env

# Edit .env file with your API keys:
# OPENAI_API_KEY=your_openai_api_key_here
# YOUTUBE_API_KEY=your_youtube_api_key_here (optional)
# DATABASE_URL=your_database_url_here
```

#### 5. Initialize database
```bash
npm run db:push
```

## Running the Application

### Development Mode

#### Option 1: Using npm (recommended)
```bash
# Start both frontend and backend
npm run dev
```

#### Option 2: Manual startup
```bash
# Terminal 1: Start main Node.js server
npm run dev

# Terminal 2: Start Python agent server
source .venv/bin/activate  # Activate virtual environment
cd server
python -m uvicorn python_agent_server:app --host 0.0.0.0 --port 8000
```

### Production Mode
```bash
# Build the application
npm run build

# Start production server
npm run start
```

### Access the application
Open [http://localhost:5000](http://localhost:5000) in your browser

## Usage

### Processing YouTube Content
1. **Single Video**: Enter a YouTube video URL to extract and process transcripts
2. **Bulk Channel Processing**: Process entire channels by entering channel URLs
3. **Playlist Processing**: Import and process YouTube playlists efficiently

### AI-Powered Queries
1. **Ask Questions**: Submit natural language queries about processed video content
2. **View Sources**: See relevant transcript chunks with clickable timestamps
3. **Reflection Suggestions**: Get intelligent suggestions for refined queries and related questions

### Real-time Monitoring
- **Agent Activity**: Monitor the 5-agent pipeline in real-time
- **System Metrics**: Track API calls, response times, and success rates
- **Processing Logs**: View detailed logs of all agent activities

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

### Real-time Updates
- `WebSocket /ws` - Real-time agent status and system updates

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
│   ├── services/           # Business logic
│   ├── routes.ts           # Express routes
│   ├── storage.ts          # Database operations
│   └── python_agent_server.py  # FastAPI server
├── shared/                 # Shared types and schemas
└── database/               # Database migrations and schema
```

## Environment Variables

Required environment variables:
```bash
# Database
DATABASE_URL=postgresql://user:password@host:port/database

# AI Services
OPENAI_API_KEY=sk-...your_openai_key
YOUTUBE_API_KEY=your_youtube_api_key  # Optional

# Application
NODE_ENV=development
PORT=5000
```

## Troubleshooting

### Common Issues on macOS

1. **Python Environment Issues**:
   ```bash
   # Ensure you're using the correct Python version
   uv venv --python 3.11
   source .venv/bin/activate
   which python  # Should point to .venv/bin/python
   ```

2. **Package Installation Failures**:
   ```bash
   # Update uv to latest version
   uv self update
   
   # Clear cache and reinstall
   uv cache clean
   uv pip install -r server/requirements.txt --force-reinstall
   ```

3. **FAISS Installation Issues**:
   ```bash
   # Install FAISS specifically for CPU
   uv pip install faiss-cpu
   ```

4. **Database Connection Issues**:
   ```bash
   # Check database connection
   npm run db:push
   
   # Reset database if needed
   npm run db:reset
   ```

### Performance Tips

- Use the built-in PostgreSQL database for optimal performance
- Enable YouTube API key for better rate limits and metadata
- Process videos in batches for better resource utilization
- Monitor system metrics to optimize agent performance

## Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/your-feature`
3. Make your changes and add tests if applicable
4. Commit your changes: `git commit -m "Add your feature"`
5. Push to the branch: `git push origin feature/your-feature`
6. Submit a pull request

## License

MIT License - see [LICENSE](LICENSE) file for details

## Acknowledgments

- OpenAI for GPT-4o API
- YouTube for transcript and API access
- FAISS for high-performance vector search
- Replit for development and deployment platform