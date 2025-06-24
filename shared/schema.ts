import { pgTable, text, serial, integer, boolean, jsonb, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const videos = pgTable("videos", {
  id: serial("id").primaryKey(),
  youtubeId: text("youtube_id").notNull().unique(),
  title: text("title").notNull(),
  duration: text("duration").notNull(),
  status: text("status").notNull().default("pending"), // pending, processing, indexed, error
  transcriptData: jsonb("transcript_data"),
  chunkCount: integer("chunk_count").default(0),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const chunks = pgTable("chunks", {
  id: serial("id").primaryKey(),
  videoId: integer("video_id").references(() => videos.id),
  content: text("content").notNull(),
  startTime: text("start_time"),
  endTime: text("end_time"),
  chunkIndex: integer("chunk_index").notNull(),
  embedding: jsonb("embedding"), // Vector embedding data
  createdAt: timestamp("created_at").defaultNow(),
});

export const queries = pgTable("queries", {
  id: serial("id").primaryKey(),
  question: text("question").notNull(),
  response: text("response"),
  sourceContexts: jsonb("source_contexts"),
  confidence: integer("confidence"),
  responseTime: integer("response_time"), // in milliseconds
  createdAt: timestamp("created_at").defaultNow(),
});

export const agents = pgTable("agents", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description").notNull(),
  status: text("status").notNull().default("inactive"), // active, inactive, busy
  lastAction: text("last_action"),
  queueCount: integer("queue_count").default(0),
  uptime: integer("uptime").default(0), // in minutes
  totalTasks: integer("total_tasks").default(0),
  successfulTasks: integer("successful_tasks").default(0),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const agentLogs = pgTable("agent_logs", {
  id: serial("id").primaryKey(),
  agentId: integer("agent_id").references(() => agents.id),
  agentName: text("agent_name").notNull(),
  message: text("message").notNull(),
  level: text("level").notNull().default("info"), // info, warning, error
  createdAt: timestamp("created_at").defaultNow(),
});

// Insert schemas
export const insertVideoSchema = createInsertSchema(videos).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertChunkSchema = createInsertSchema(chunks).omit({
  id: true,
  createdAt: true,
});

export const insertQuerySchema = createInsertSchema(queries).omit({
  id: true,
  createdAt: true,
});

export const insertAgentSchema = createInsertSchema(agents).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertAgentLogSchema = createInsertSchema(agentLogs).omit({
  id: true,
  createdAt: true,
});

// Types
export type Video = typeof videos.$inferSelect;
export type InsertVideo = z.infer<typeof insertVideoSchema>;
export type Chunk = typeof chunks.$inferSelect;
export type InsertChunk = z.infer<typeof insertChunkSchema>;
export type Query = typeof queries.$inferSelect;
export type InsertQuery = z.infer<typeof insertQuerySchema>;
export type Agent = typeof agents.$inferSelect;
export type InsertAgent = z.infer<typeof insertAgentSchema>;
export type AgentLog = typeof agentLogs.$inferSelect;
export type InsertAgentLog = z.infer<typeof insertAgentLogSchema>;

// API response types
export const processVideoRequestSchema = z.object({
  youtubeUrl: z.string().url(),
});

export const queryRequestSchema = z.object({
  question: z.string().min(1),
});

export const systemMetricsSchema = z.object({
  apiCalls: z.number(),
  avgResponseTime: z.number(),
  successRate: z.number(),
  memoryUsage: z.string(),
});

export type ProcessVideoRequest = z.infer<typeof processVideoRequestSchema>;
export type QueryRequest = z.infer<typeof queryRequestSchema>;
export type SystemMetrics = z.infer<typeof systemMetricsSchema>;
