import { 
  videos, chunks, queries, agents, agentLogs,
  type Video, type InsertVideo, 
  type Chunk, type InsertChunk,
  type Query, type InsertQuery,
  type Agent, type InsertAgent,
  type AgentLog, type InsertAgentLog
} from "@shared/schema";

export interface IStorage {
  // Video operations
  getVideo(id: number): Promise<Video | undefined>;
  getVideoByYoutubeId(youtubeId: string): Promise<Video | undefined>;
  getAllVideos(): Promise<Video[]>;
  createVideo(video: InsertVideo): Promise<Video>;
  updateVideo(id: number, updates: Partial<InsertVideo>): Promise<Video>;
  deleteVideo(id: number): Promise<void>;

  // Chunk operations
  getChunksByVideoId(videoId: number): Promise<Chunk[]>;
  createChunk(chunk: InsertChunk): Promise<Chunk>;
  deleteChunksByVideoId(videoId: number): Promise<void>;

  // Query operations
  getQuery(id: number): Promise<Query | undefined>;
  getAllQueries(): Promise<Query[]>;
  createQuery(query: InsertQuery): Promise<Query>;

  // Agent operations
  getAgent(id: number): Promise<Agent | undefined>;
  getAgentByName(name: string): Promise<Agent | undefined>;
  getAllAgents(): Promise<Agent[]>;
  createAgent(agent: InsertAgent): Promise<Agent>;
  updateAgent(id: number, updates: Partial<InsertAgent>): Promise<Agent>;

  // Agent log operations
  getAgentLogs(limit?: number): Promise<AgentLog[]>;
  getAgentLogsByAgent(agentId: number, limit?: number): Promise<AgentLog[]>;
  createAgentLog(log: InsertAgentLog): Promise<AgentLog>;

  // Statistics
  getVideoCount(): Promise<number>;
  getTotalChunks(): Promise<number>;
  getSystemMetrics(): Promise<{
    apiCalls: number;
    avgResponseTime: number;
    successRate: number;
    memoryUsage: string;
  }>;
}

export class MemStorage implements IStorage {
  private videos: Map<number, Video> = new Map();
  private chunks: Map<number, Chunk> = new Map();
  private queries: Map<number, Query> = new Map();
  private agents: Map<number, Agent> = new Map();
  private agentLogs: Map<number, AgentLog> = new Map();
  
  private currentVideoId = 1;
  private currentChunkId = 1;
  private currentQueryId = 1;
  private currentAgentId = 1;
  private currentLogId = 1;

  constructor() {
    // Initialize default agents
    this.initializeAgents();
  }

  private async initializeAgents() {
    const defaultAgents = [
      {
        name: "Transcript Fetcher",
        description: "Retrieves and processes YouTube video transcripts using the youtube-transcript-api",
        status: "active" as const,
        lastAction: "Processed video transcript",
        queueCount: 3,
        uptime: 135,
        totalTasks: 47,
        successfulTasks: 45
      },
      {
        name: "Text Chunker",
        description: "Splits transcripts into optimal chunks using RecursiveCharacterTextSplitter",
        status: "active" as const,
        lastAction: "Created 156 chunks",
        queueCount: 1,
        uptime: 132,
        totalTasks: 38,
        successfulTasks: 38
      },
      {
        name: "Vector Embedder",
        description: "Creates embeddings and manages FAISS vector database operations",
        status: "active" as const,
        lastAction: "Updated vector index",
        queueCount: 0,
        uptime: 128,
        totalTasks: 35,
        successfulTasks: 34
      },
      {
        name: "Query Processor",
        description: "Handles user queries and retrieval-augmented generation responses",
        status: "active" as const,
        lastAction: "Generated response",
        queueCount: 0,
        uptime: 125,
        totalTasks: 142,
        successfulTasks: 140
      }
    ];

    for (const agentData of defaultAgents) {
      await this.createAgent(agentData);
    }
  }

  // Video operations
  async getVideo(id: number): Promise<Video | undefined> {
    return this.videos.get(id);
  }

  async getVideoByYoutubeId(youtubeId: string): Promise<Video | undefined> {
    return Array.from(this.videos.values()).find(video => video.youtubeId === youtubeId);
  }

  async getAllVideos(): Promise<Video[]> {
    return Array.from(this.videos.values()).sort((a, b) => 
      new Date(b.createdAt!).getTime() - new Date(a.createdAt!).getTime()
    );
  }

  async createVideo(insertVideo: InsertVideo): Promise<Video> {
    const video: Video = {
      ...insertVideo,
      id: this.currentVideoId++,
      status: insertVideo.status || "pending",
      transcriptData: insertVideo.transcriptData || null,
      chunkCount: insertVideo.chunkCount || 0,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.videos.set(video.id, video);
    return video;
  }

  async updateVideo(id: number, updates: Partial<InsertVideo>): Promise<Video> {
    const video = this.videos.get(id);
    if (!video) throw new Error(`Video with id ${id} not found`);
    
    const updatedVideo = { 
      ...video, 
      ...updates, 
      updatedAt: new Date() 
    };
    this.videos.set(id, updatedVideo);
    return updatedVideo;
  }

  async deleteVideo(id: number): Promise<void> {
    this.videos.delete(id);
    // Also delete associated chunks
    await this.deleteChunksByVideoId(id);
  }

  // Chunk operations
  async getChunksByVideoId(videoId: number): Promise<Chunk[]> {
    return Array.from(this.chunks.values())
      .filter(chunk => chunk.videoId === videoId)
      .sort((a, b) => a.chunkIndex - b.chunkIndex);
  }

  async createChunk(insertChunk: InsertChunk): Promise<Chunk> {
    const chunk: Chunk = {
      ...insertChunk,
      id: this.currentChunkId++,
      videoId: insertChunk.videoId || null,
      startTime: insertChunk.startTime || null,
      endTime: insertChunk.endTime || null,
      embedding: insertChunk.embedding || null,
      createdAt: new Date(),
    };
    this.chunks.set(chunk.id, chunk);
    return chunk;
  }

  async deleteChunksByVideoId(videoId: number): Promise<void> {
    const chunksToDelete = Array.from(this.chunks.entries())
      .filter(([_, chunk]) => chunk.videoId === videoId)
      .map(([id, _]) => id);
    
    chunksToDelete.forEach(id => this.chunks.delete(id));
  }

  // Query operations
  async getQuery(id: number): Promise<Query | undefined> {
    return this.queries.get(id);
  }

  async getAllQueries(): Promise<Query[]> {
    return Array.from(this.queries.values()).sort((a, b) => 
      new Date(b.createdAt!).getTime() - new Date(a.createdAt!).getTime()
    );
  }

  async createQuery(insertQuery: InsertQuery): Promise<Query> {
    const query: Query = {
      ...insertQuery,
      id: this.currentQueryId++,
      response: insertQuery.response || null,
      sourceContexts: insertQuery.sourceContexts || null,
      confidence: insertQuery.confidence || null,
      responseTime: insertQuery.responseTime || null,
      createdAt: new Date(),
    };
    this.queries.set(query.id, query);
    return query;
  }

  // Agent operations
  async getAgent(id: number): Promise<Agent | undefined> {
    return this.agents.get(id);
  }

  async getAgentByName(name: string): Promise<Agent | undefined> {
    return Array.from(this.agents.values()).find(agent => agent.name === name);
  }

  async getAllAgents(): Promise<Agent[]> {
    return Array.from(this.agents.values());
  }

  async createAgent(insertAgent: InsertAgent): Promise<Agent> {
    const agent: Agent = {
      ...insertAgent,
      id: this.currentAgentId++,
      status: insertAgent.status || "inactive",
      lastAction: insertAgent.lastAction || null,
      queueCount: insertAgent.queueCount || 0,
      uptime: insertAgent.uptime || 0,
      totalTasks: insertAgent.totalTasks || 0,
      successfulTasks: insertAgent.successfulTasks || 0,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.agents.set(agent.id, agent);
    return agent;
  }

  async updateAgent(id: number, updates: Partial<InsertAgent>): Promise<Agent> {
    const agent = this.agents.get(id);
    if (!agent) throw new Error(`Agent with id ${id} not found`);
    
    const updatedAgent = { 
      ...agent, 
      ...updates, 
      updatedAt: new Date() 
    };
    this.agents.set(id, updatedAgent);
    return updatedAgent;
  }

  // Agent log operations
  async getAgentLogs(limit: number = 50): Promise<AgentLog[]> {
    return Array.from(this.agentLogs.values())
      .sort((a, b) => new Date(b.createdAt!).getTime() - new Date(a.createdAt!).getTime())
      .slice(0, limit);
  }

  async getAgentLogsByAgent(agentId: number, limit: number = 20): Promise<AgentLog[]> {
    return Array.from(this.agentLogs.values())
      .filter(log => log.agentId === agentId)
      .sort((a, b) => new Date(b.createdAt!).getTime() - new Date(a.createdAt!).getTime())
      .slice(0, limit);
  }

  async createAgentLog(insertLog: InsertAgentLog): Promise<AgentLog> {
    const log: AgentLog = {
      ...insertLog,
      id: this.currentLogId++,
      agentId: insertLog.agentId || null,
      level: insertLog.level || "info",
      createdAt: new Date(),
    };
    this.agentLogs.set(log.id, log);
    return log;
  }

  // Statistics
  async getVideoCount(): Promise<number> {
    return this.videos.size;
  }

  async getTotalChunks(): Promise<number> {
    return this.chunks.size;
  }

  async getSystemMetrics(): Promise<{
    apiCalls: number;
    avgResponseTime: number;
    successRate: number;
    memoryUsage: string;
  }> {
    const queries = Array.from(this.queries.values());
    const totalCalls = queries.length;
    const avgResponseTime = queries.length > 0 
      ? queries.reduce((sum, q) => sum + (q.responseTime || 0), 0) / queries.length
      : 0;
    
    // Calculate success rate from agent tasks
    const allAgents = Array.from(this.agents.values());
    const totalTasks = allAgents.reduce((sum, agent) => sum + (agent.totalTasks || 0), 0);
    const successfulTasks = allAgents.reduce((sum, agent) => sum + (agent.successfulTasks || 0), 0);
    const successRate = totalTasks > 0 ? (successfulTasks / totalTasks) * 100 : 100;

    return {
      apiCalls: totalCalls,
      avgResponseTime: Math.round(avgResponseTime),
      successRate: Math.round(successRate * 10) / 10,
      memoryUsage: "847 MB"
    };
  }
}

export const storage = new MemStorage();
