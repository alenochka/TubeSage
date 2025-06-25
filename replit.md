# YouTube AI Agent System

## Overview

This is a sophisticated multi-agent YouTube transcript processing system built with a modern full-stack architecture. The application allows users to process YouTube videos, extract transcripts, create vector embeddings for semantic search, and query the content using AI-powered responses. The system employs a multi-agent architecture where specialized agents handle different aspects of the pipeline: transcript fetching, text chunking, vector embedding, and query processing.

## System Architecture

### Frontend Architecture
- **Framework**: React with TypeScript
- **UI Components**: Radix UI with shadcn/ui component library
- **Styling**: Tailwind CSS with custom theming
- **State Management**: TanStack Query for server state management
- **Routing**: Wouter for client-side routing
- **Build Tool**: Vite with custom configuration
- **Real-time Updates**: WebSocket integration for live agent status and system logs

### Backend Architecture
- **Runtime**: Node.js with Express.js server
- **Language**: TypeScript with ES modules
- **API Pattern**: RESTful endpoints with structured error handling
- **Agent System**: Python-based multi-agent architecture with FastAPI integration
- **Real-time Communication**: WebSocket server for live updates

### Data Storage Solutions
- **Primary Database**: PostgreSQL with Neon serverless driver for structured data
- **ORM**: Drizzle ORM with TypeScript schema definitions
- **Vector Storage**: FAISS-powered vector database for high-performance similarity search
- **Hybrid Architecture**: PostgreSQL for metadata/relational data, FAISS for vector operations
- **Session Management**: PostgreSQL-based session storage

## Key Components

### Multi-Agent System
The system implements four specialized agents:

1. **Transcript Fetcher Agent**: Retrieves YouTube video transcripts using the youtube-transcript-api
2. **Text Chunker Agent**: Splits transcripts into semantic chunks using recursive character splitting
3. **Vector Embedder Agent**: Creates embeddings and manages vector database operations
4. **Query Processor Agent**: Handles user queries with retrieval-augmented generation

### Database Schema
- **Videos Table**: Stores YouTube video metadata, processing status, and transcript data
- **Chunks Table**: Contains text chunks with embeddings and timestamp information
- **Queries Table**: Logs user queries, responses, and performance metrics
- **Agents Table**: Tracks agent status, performance metrics, and system health

### API Structure
- `/api/videos/*` - Video processing and management endpoints
- `/api/query` - Query processing endpoint
- `/api/agents` - Agent status and management
- `/api/system/*` - System metrics and logging
- `/ws` - WebSocket endpoint for real-time updates

## Data Flow

1. **Video Processing Pipeline**:
   - User submits YouTube URL
   - Transcript Fetcher Agent extracts video transcript
   - Text Chunker Agent splits content into semantic chunks
   - Vector Embedder Agent creates embeddings and stores in vector database
   - System updates video status to "indexed"

2. **Query Processing Flow**:
   - User submits natural language query
   - Vector Embedder Agent performs similarity search
   - Query Processor Agent generates contextual response using retrieved chunks
   - Response includes source contexts and confidence metrics

3. **Real-time Updates**:
   - WebSocket connection provides live agent status updates
   - System logs and metrics are streamed to frontend
   - Processing progress is communicated in real-time

## External Dependencies

### AI Services
- **OpenAI API**: Text embeddings and completion generation
- **Google Generative AI**: Alternative AI provider integration
- **YouTube Transcript API**: Automated transcript extraction

### Infrastructure
- **Neon Database**: Serverless PostgreSQL hosting
- **Replit**: Development and deployment platform
- **WebSocket**: Real-time communication protocol

### Key Libraries
- **Frontend**: React, TanStack Query, Radix UI, Tailwind CSS, Wouter
- **Backend**: Express.js, Drizzle ORM, WebSocket, Python FastAPI
- **Utilities**: Zod validation, date-fns, class-variance-authority

## Deployment Strategy

### Development Environment
- **Runtime**: Node.js 20 with PostgreSQL 16
- **Build Process**: Vite for frontend, esbuild for backend bundling
- **Hot Reload**: Vite development server with middleware integration
- **Process Management**: Single npm script manages both frontend and backend

### Production Deployment
- **Target Platform**: Replit Autoscale deployment
- **Build Command**: `npm run build` (Vite + esbuild)
- **Start Command**: `npm run start` (production Node.js server)
- **Port Configuration**: Internal port 5000, external port 80
- **Static Assets**: Served from dist/public directory

### Database Management
- **Schema Migrations**: Drizzle Kit for database schema management
- **Connection**: Environment-based DATABASE_URL configuration
- **Session Storage**: PostgreSQL-based session management

## Changelog

Changelog:
- June 24, 2025: Initial setup with multi-agent YouTube transcript system
- June 24, 2025: Added PostgreSQL database integration with Drizzle ORM
- June 24, 2025: Upgraded to hybrid FAISS + PostgreSQL architecture for optimal performance
- June 24, 2025: Resolved Python import issues and activated real OpenAI API integration
- June 24, 2025: Enhanced system with video snippets, clickable timestamps, and database clearing functionality
- June 24, 2025: Successfully implemented real YouTube transcript processing with authentic AI-powered responses and clickable video references
- June 24, 2025: Fixed context retrieval to provide actual transcript fragments to LLM for accurate responses based on video content
- June 24, 2025: Successfully implemented authentic AI responses using real YouTube transcript content with proper context passing to OpenAI GPT-3.5-turbo
- June 24, 2025: Added real-time agent activity diagram showing multi-agent workflow visualization with live status updates
- June 24, 2025: Implemented bulk channel processing feature for efficiently processing all videos from YouTube channels with batch processing and progress tracking
- June 24, 2025: Fixed mock video generation to use only real YouTube videos, eliminating transcript fetch errors and improving user experience
- June 25, 2025: Added playlist processing functionality for bulk importing videos from YouTube playlists with individual and batch processing options
- June 25, 2025: Implemented ReAct pattern Reflection Agent that evaluates response quality and provides intelligent suggestions for refined queries, related questions, YouTube search keywords, and actionable next steps
- June 25, 2025: Fixed playlist processing endpoint integration and updated agent diagram to include all 5 agents in the multi-agent workflow
- June 25, 2025: Resolved git configuration to connect project to GitHub repository https://github.com/alenochka/MultiAgentCollab2.git

## User Preferences

Preferred communication style: Simple, everyday language.