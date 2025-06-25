# YouTube AI Agent System

A sophisticated multi-agent YouTube transcript processing system built with a modern full-stack architecture. Process YouTube videos, extract transcripts, create vector embeddings for semantic search, and query content using AI-powered responses.

## Features

- **Multi-Agent Architecture**: Specialized agents for transcript fetching, text chunking, vector embedding, and query processing
- **Real-time Monitoring**: Live agent status updates and system metrics
- **Bulk Channel Processing**: Process entire YouTube channels efficiently
- **AI-Powered Queries**: Semantic search with retrieval-augmented generation
- **Vector Database**: FAISS-powered similarity search for high-performance queries
- **Modern UI**: React with Tailwind CSS and shadcn/ui components

## Tech Stack

### Frontend
- React with TypeScript
- Tailwind CSS + shadcn/ui
- TanStack Query for state management
- Wouter for routing
- WebSocket for real-time updates

### Backend
- Node.js with Express
- Python FastAPI for agent system
- PostgreSQL with Drizzle ORM
- FAISS vector database
- OpenAI API integration

## Getting Started

### Prerequisites
- Node.js 18+
- Python 3.11+
- PostgreSQL
- OpenAI API key

### Installation

1. **Clone the repository**
```bash
git clone https://github.com/YOUR_USERNAME/youtube-ai-agent-system.git
cd youtube-ai-agent-system
```

2. **Install dependencies**
```bash
# Node.js dependencies
npm install

# Python dependencies
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt
```

3. **Set up environment variables**
```bash
cp .env.example .env
# Edit .env with your database URL and OpenAI API key
```

4. **Initialize database**
```bash
npm run db:push
```

### Running the Application

1. **Start the main server**
```bash
npm run dev
```

2. **Start the Python agent server** (in another terminal)
```bash
source venv/bin/activate
cd server
python -m uvicorn python_agent_server:app --host 0.0.0.0 --port 8000
```

3. **Access the application**
Open http://localhost:5000 in your browser

## Usage

1. **Process YouTube Videos**: Enter a YouTube URL to extract and process transcripts
2. **Bulk Channel Processing**: Process entire channels by entering channel URLs
3. **AI Queries**: Ask questions about processed video content
4. **Monitor Agents**: View real-time agent activity and system metrics

## API Endpoints

- `POST /api/videos/process` - Process a YouTube video
- `POST /api/query` - Submit AI-powered queries
- `GET /api/agents` - Get agent status
- `GET /api/system/metrics` - Get system metrics
- `WebSocket /ws` - Real-time updates

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

MIT License - see LICENSE file for details