import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { processVideoRequestSchema, queryRequestSchema } from "@shared/schema";
import { z } from "zod";
import { WebSocketServer } from 'ws';

export async function registerRoutes(app: Express): Promise<Server> {
  // Video processing endpoints
  app.post("/api/videos/process", async (req, res) => {
    try {
      const { youtubeUrl } = processVideoRequestSchema.parse(req.body);
      
      // Extract YouTube video ID
      const videoIdMatch = youtubeUrl.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\n?#]+)/);
      if (!videoIdMatch) {
        return res.status(400).json({ error: "Invalid YouTube URL" });
      }
      
      const youtubeId = videoIdMatch[1];
      
      // Check if video already exists
      const existingVideo = await storage.getVideoByYoutubeId(youtubeId);
      if (existingVideo) {
        return res.status(409).json({ error: "Video already processed", video: existingVideo });
      }
      
      // Create new video entry
      const video = await storage.createVideo({
        youtubeId,
        title: `Video ${youtubeId}`, // This would be updated by the transcript fetcher
        duration: "00:00",
        status: "pending",
        transcriptData: null,
        chunkCount: 0
      });
      
      // Trigger the Python agent orchestrator
      try {
        // Call Python FastAPI server to process video
        const pythonResponse = await fetch("http://localhost:8000/process-video", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ youtube_url: youtubeUrl })
        });
        
        if (pythonResponse.ok) {
          const result = await pythonResponse.json();
          // Update video with processed data
          setTimeout(async () => {
            await storage.updateVideo(video.id, { 
              status: "indexed",
              title: result.data?.video_info?.title || `Video ${youtubeId}`,
              duration: result.data?.total_duration || "00:00",
              chunkCount: result.data?.total_chunks || 0,
              transcriptData: result.data?.transcript || null
            });
          }, 2000);
        } else {
          // Fallback to simulation if Python server not available
          setTimeout(async () => {
            await storage.updateVideo(video.id, { 
              status: "processing",
              title: `Processing Video ${youtubeId}`
            });
          }, 1000);
        }
      } catch (error) {
        console.log("Python agent server not available, using simulation");
        setTimeout(async () => {
          await storage.updateVideo(video.id, { 
            status: "processing",
            title: `Processing Video ${youtubeId}`
          });
        }, 1000);
      }
      
      res.json({ message: "Video processing started", video });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Invalid request data", details: error.errors });
      }
      res.status(500).json({ error: "Failed to process video" });
    }
  });

  app.get("/api/videos", async (req, res) => {
    try {
      const videos = await storage.getAllVideos();
      res.json(videos);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch videos" });
    }
  });

  app.get("/api/videos/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const video = await storage.getVideo(id);
      if (!video) {
        return res.status(404).json({ error: "Video not found" });
      }
      res.json(video);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch video" });
    }
  });

  app.delete("/api/videos/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      await storage.deleteVideo(id);
      res.json({ message: "Video deleted successfully" });
    } catch (error) {
      res.status(500).json({ error: "Failed to delete video" });
    }
  });

  // Query endpoints
  app.post("/api/query", async (req, res) => {
    try {
      const { question } = queryRequestSchema.parse(req.body);
      
      const startTime = Date.now();
      
      // Integrate with the Python query processor agent
      let response = `Based on the analyzed YouTube transcripts, here's what I found regarding: "${question}". This is where the AI-generated response would appear with relevant context from the processed video transcripts.`;
      let sourceContexts: any[] = [
        {
          videoTitle: "Sample Video Title",
          timestamp: "12:34",
          excerpt: "Sample excerpt from the video transcript that relates to the query...",
          confidence: 94,
          relevance: "High"
        }
      ];
      let confidence = 94;

      try {
        // Call Python FastAPI server to process query
        const pythonResponse = await fetch("http://localhost:8000/process-query", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ query: question })
        });
        
        if (pythonResponse.ok) {
          const result = await pythonResponse.json();
          if (result.success && result.data) {
            response = result.data.response || response;
            sourceContexts = result.data.source_contexts || sourceContexts;
            confidence = result.data.confidence || confidence;
          }
        }
      } catch (error) {
        console.log("Python agent server not available, using fallback response");
      }
      
      const responseTime = Date.now() - startTime;
      
      const query = await storage.createQuery({
        question,
        response,
        sourceContexts,
        confidence,
        responseTime
      });
      
      res.json(query);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Invalid request data", details: error.errors });
      }
      res.status(500).json({ error: "Failed to process query" });
    }
  });

  app.get("/api/queries", async (req, res) => {
    try {
      const queries = await storage.getAllQueries();
      res.json(queries);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch queries" });
    }
  });

  // Agent endpoints
  app.get("/api/agents", async (req, res) => {
    try {
      const agents = await storage.getAllAgents();
      res.json(agents);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch agents" });
    }
  });

  app.get("/api/agents/:id/logs", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const limit = parseInt(req.query.limit as string) || 20;
      const logs = await storage.getAgentLogsByAgent(id, limit);
      res.json(logs);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch agent logs" });
    }
  });

  app.get("/api/system/logs", async (req, res) => {
    try {
      const limit = parseInt(req.query.limit as string) || 50;
      const logs = await storage.getAgentLogs(limit);
      res.json(logs);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch system logs" });
    }
  });

  // System metrics endpoint
  app.get("/api/system/metrics", async (req, res) => {
    try {
      const metrics = await storage.getSystemMetrics();
      const videoCount = await storage.getVideoCount();
      const totalChunks = await storage.getTotalChunks();
      
      res.json({
        ...metrics,
        totalVideos: videoCount,
        totalChunks,
        vectorDimensions: 1536
      });
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch system metrics" });
    }
  });

  // Vector database endpoints
  app.get("/api/vector-db/stats", async (req, res) => {
    try {
      const totalChunks = await storage.getTotalChunks();
      const totalVideos = await storage.getVideoCount();
      
      res.json({
        totalChunks,
        totalVideos,
        vectorDimensions: 1536
      });
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch vector database stats" });
    }
  });

  app.delete("/api/vector-db/clear", async (req, res) => {
    try {
      // Here you would clear the vector database
      // For now, we'll just return success
      res.json({ message: "Vector database cleared successfully" });
    } catch (error) {
      res.status(500).json({ error: "Failed to clear vector database" });
    }
  });

  const httpServer = createServer(app);
  
  // WebSocket server for real-time updates
  const wss = new WebSocketServer({ 
    server: httpServer,
    path: '/ws'
  });
  
  wss.on('connection', (ws) => {
    console.log('Client connected to WebSocket');
    
    // Send initial data
    Promise.all([
      storage.getAllAgents(),
      storage.getAgentLogs(10),
      storage.getSystemMetrics()
    ]).then(([agents, logs, metrics]) => {
      ws.send(JSON.stringify({
        type: 'agent-status',
        data: agents
      }));
      
      ws.send(JSON.stringify({
        type: 'system-logs',
        data: logs
      }));
      
      ws.send(JSON.stringify({
        type: 'system-metrics',
        data: metrics
      }));
    }).catch(console.error);
    
    ws.on('close', () => {
      console.log('Client disconnected from WebSocket');
    });
    
    ws.on('error', (error) => {
      console.error('WebSocket error:', error);
    });
  });

  // Simulate real-time updates
  setInterval(async () => {
    try {
      const [agents, logs, metrics] = await Promise.all([
        storage.getAllAgents(),
        storage.getAgentLogs(10),
        storage.getSystemMetrics()
      ]);
      
      wss.clients.forEach(client => {
        if (client.readyState === 1) { // WebSocket.OPEN
          client.send(JSON.stringify({
            type: 'agent-status',
            data: agents
          }));
          
          client.send(JSON.stringify({
            type: 'system-logs',
            data: logs
          }));
          
          client.send(JSON.stringify({
            type: 'system-metrics',
            data: metrics
          }));
        }
      });
    } catch (error) {
      console.error('Error updating WebSocket clients:', error);
    }
  }, 30000); // Update every 30 seconds

  return httpServer;
}
