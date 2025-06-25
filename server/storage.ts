import { 
  videos, chunks, queries, agents, agentLogs,
  type Video, type InsertVideo, 
  type Chunk, type InsertChunk,
  type Query, type InsertQuery,
  type Agent, type InsertAgent,
  type AgentLog, type InsertAgentLog
} from "@shared/schema";
import { eq, desc, count } from "drizzle-orm";
import { db } from "./db";

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

export class DatabaseStorage implements IStorage {
  constructor() {
    this.initializeAgents();
  }

  async initializeAgents() {
    try {
      // Check if agents already exist
      const existingAgents = await this.getAllAgents();
      if (existingAgents.length > 0) {
        return; // Agents already initialized
      }

      // Initialize default agents
      const defaultAgents = [
        {
          name: "Transcript Fetcher",
          description: "Retrieves YouTube video transcripts",
          status: "active",
          lastAction: "Waiting for tasks",
          queueCount: 0,
          uptime: 0,
          totalTasks: 0,
          successfulTasks: 0
        },
        {
          name: "Text Chunker", 
          description: "Splits transcripts into semantic chunks",
          status: "active",
          lastAction: "Waiting for tasks",
          queueCount: 0,
          uptime: 0,
          totalTasks: 0,
          successfulTasks: 0
        },
        {
          name: "Vector Embedder",
          description: "Creates embeddings and manages vector database",
          status: "active", 
          lastAction: "Waiting for tasks",
          queueCount: 0,
          uptime: 0,
          totalTasks: 0,
          successfulTasks: 0
        },
        {
          name: "Query Processor",
          description: "Processes user queries and generates responses",
          status: "active",
          lastAction: "Waiting for tasks", 
          queueCount: 0,
          uptime: 0,
          totalTasks: 0,
          successfulTasks: 0
        }
      ];

      for (const agentData of defaultAgents) {
        await this.createAgent(agentData);
      }
    } catch (error) {
      console.error("Error initializing agents:", error);
    }
  }

  // Video operations
  async getVideo(id: number): Promise<Video | undefined> {
    const [video] = await db.select().from(videos).where(eq(videos.id, id));
    return video || undefined;
  }

  async getVideoByYoutubeId(youtubeId: string): Promise<Video | undefined> {
    const [video] = await db.select().from(videos).where(eq(videos.youtubeId, youtubeId));
    return video || undefined;
  }

  async getAllVideos(): Promise<Video[]> {
    return await db.select().from(videos).orderBy(desc(videos.createdAt));
  }

  async createVideo(insertVideo: InsertVideo): Promise<Video> {
    const [video] = await db.insert(videos).values(insertVideo).returning();
    return video;
  }

  async updateVideo(id: number, updates: Partial<InsertVideo>): Promise<Video> {
    const [video] = await db.update(videos).set(updates).where(eq(videos.id, id)).returning();
    return video;
  }

  async deleteVideo(id: number): Promise<void> {
    await db.delete(videos).where(eq(videos.id, id));
  }

  // Chunk operations
  async getChunksByVideoId(videoId: number): Promise<Chunk[]> {
    return await db.select().from(chunks).where(eq(chunks.videoId, videoId)).orderBy(chunks.chunkIndex);
  }

  async createChunk(insertChunk: InsertChunk): Promise<Chunk> {
    const [chunk] = await db.insert(chunks).values(insertChunk).returning();
    return chunk;
  }

  async deleteChunksByVideoId(videoId: number): Promise<void> {
    await db.delete(chunks).where(eq(chunks.videoId, videoId));
  }

  // Query operations
  async getQuery(id: number): Promise<Query | undefined> {
    const [query] = await db.select().from(queries).where(eq(queries.id, id));
    return query || undefined;
  }

  async getAllQueries(): Promise<Query[]> {
    return await db.select().from(queries).orderBy(desc(queries.createdAt));
  }

  async createQuery(insertQuery: InsertQuery): Promise<Query> {
    const [query] = await db.insert(queries).values(insertQuery).returning();
    return query;
  }

  // Agent operations
  async getAgent(id: number): Promise<Agent | undefined> {
    const [agent] = await db.select().from(agents).where(eq(agents.id, id));
    return agent || undefined;
  }

  async getAgentByName(name: string): Promise<Agent | undefined> {
    const [agent] = await db.select().from(agents).where(eq(agents.name, name));
    return agent || undefined;
  }

  async getAllAgents(): Promise<Agent[]> {
    return await db.select().from(agents).orderBy(agents.name);
  }

  async createAgent(insertAgent: InsertAgent): Promise<Agent> {
    const [agent] = await db.insert(agents).values(insertAgent).returning();
    return agent;
  }

  async updateAgent(id: number, updates: Partial<InsertAgent>): Promise<Agent> {
    const [agent] = await db.update(agents).set(updates).where(eq(agents.id, id)).returning();
    return agent;
  }

  // Agent log operations
  async getAgentLogs(limit: number = 50): Promise<AgentLog[]> {
    return await db.select().from(agentLogs).orderBy(desc(agentLogs.createdAt)).limit(limit);
  }

  async getAgentLogsByAgent(agentId: number, limit: number = 20): Promise<AgentLog[]> {
    return await db.select().from(agentLogs)
      .where(eq(agentLogs.agentId, agentId))
      .orderBy(desc(agentLogs.createdAt))
      .limit(limit);
  }

  async createAgentLog(insertLog: InsertAgentLog): Promise<AgentLog> {
    const [log] = await db.insert(agentLogs).values(insertLog).returning();
    return log;
  }

  // Statistics
  async getVideoCount(): Promise<number> {
    const [result] = await db.select({ count: count() }).from(videos);
    return result.count;
  }

  async getTotalChunks(): Promise<number> {
    const [result] = await db.select({ count: count() }).from(chunks);
    return result.count;
  }

  async getSystemMetrics(): Promise<{
    apiCalls: number;
    avgResponseTime: number;
    successRate: number;
    memoryUsage: string;
  }> {
    // Calculate API calls from queries
    const totalCalls = await this.getTotalChunks();
    
    // Calculate average response time from recent queries
    const recentQueries = await db.select({ responseTime: queries.responseTime })
      .from(queries)
      .where(eq(queries.responseTime, queries.responseTime))
      .limit(100);
    
    const avgResponseTime = recentQueries.length > 0 
      ? recentQueries.reduce((sum, q) => sum + (q.responseTime || 0), 0) / recentQueries.length
      : 0;
    
    // Calculate success rate from agent tasks
    const allAgents = await this.getAllAgents();
    const totalTasks = allAgents.reduce((sum, agent) => sum + (agent.totalTasks || 0), 0);
    const successfulTasks = allAgents.reduce((sum, agent) => sum + (agent.successfulTasks || 0), 0);
    const successRate = totalTasks > 0 ? (successfulTasks / totalTasks) * 100 : 100;

    return {
      apiCalls: totalCalls,
      avgResponseTime: Math.round(avgResponseTime),
      successRate: Math.round(successRate),
      memoryUsage: "PostgreSQL"
    };
  }
}

export const storage = new DatabaseStorage();