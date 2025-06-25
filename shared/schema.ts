import { pgTable, text, serial, integer, boolean, jsonb, timestamp, real } from "drizzle-orm/pg-core";
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

export const courses = pgTable("courses", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  topic: text("topic").notNull(),
  description: text("description"),
  level: text("level").notNull().default("graduate"), // undergraduate, graduate, doctoral
  field: text("field").notNull(), // computer science, physics, biology, etc.
  status: text("status").notNull().default("draft"), // draft, published, archived
  videoCount: integer("video_count").notNull().default(0),
  totalDuration: text("total_duration").default("0:00"),
  prerequisites: text("prerequisites").array().default([]),
  learningOutcomes: text("learning_outcomes").array().default([]),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const courseModules = pgTable("course_modules", {
  id: serial("id").primaryKey(),
  courseId: integer("course_id").references(() => courses.id, { onDelete: "cascade" }).notNull(),
  title: text("title").notNull(),
  description: text("description"),
  orderIndex: integer("order_index").notNull(),
  objectives: text("objectives").array().default([]),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const courseLectures = pgTable("course_lectures", {
  id: serial("id").primaryKey(),
  moduleId: integer("module_id").references(() => courseModules.id, { onDelete: "cascade" }).notNull(),
  videoId: integer("video_id").references(() => videos.id, { onDelete: "cascade" }).notNull(),
  title: text("title").notNull(),
  orderIndex: integer("order_index").notNull(),
  keyTopics: text("key_topics").array().default([]),
  theoreticalConcepts: text("theoretical_concepts").array().default([]),
  practicalApplications: text("practical_applications").array().default([]),
  relevanceScore: real("relevance_score").notNull().default(0),
  createdAt: timestamp("created_at").defaultNow().notNull(),
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

export const insertCourseModuleSchema = createInsertSchema(courseModules).omit({
  id: true,
  createdAt: true,
});

export const insertCourseLectureSchema = createInsertSchema(courseLectures).omit({
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
export type CourseModule = typeof courseModules.$inferSelect;
export type InsertCourseModule = z.infer<typeof insertCourseModuleSchema>;
export type CourseLecture = typeof courseLectures.$inferSelect;
export type InsertCourseLecture = z.infer<typeof insertCourseLectureSchema>;
export type Course = typeof courses.$inferSelect;
export type InsertCourse = z.infer<typeof insertCourseSchema>;
export type CourseModule = typeof courseModules.$inferSelect;
export type InsertCourseModule = z.infer<typeof insertCourseModuleSchema>;
export type CourseLecture = typeof courseLectures.$inferSelect;
export type InsertCourseLecture = z.infer<typeof insertCourseLectureSchema>;

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

export const topicSearchRequestSchema = z.object({
  topic: z.string().min(1),
  field: z.string().min(1), // academic field
  level: z.enum(["undergraduate", "graduate", "doctoral"]).default("graduate"),
  videoCount: z.number().min(5).max(15).default(8),
  focusAreas: z.array(z.string()).optional(),
});

export const courseGenerationRequestSchema = z.object({
  title: z.string().min(1),
  topic: z.string().min(1),
  field: z.string().min(1),
  level: z.enum(["undergraduate", "graduate", "doctoral"]),
  description: z.string().optional(),
  prerequisites: z.array(z.string()).default([]),
  learningOutcomes: z.array(z.string()).default([]),
  videos: z.array(z.object({
    youtubeId: z.string(),
    title: z.string(),
    duration: z.string(),
    relevanceScore: z.number(),
    keyTopics: z.array(z.string()),
    theoreticalDepth: z.number(),
    practicalValue: z.number(),
  })),
});

export type ProcessVideoRequest = z.infer<typeof processVideoRequestSchema>;
export type QueryRequest = z.infer<typeof queryRequestSchema>;
export type SystemMetrics = z.infer<typeof systemMetricsSchema>;
export type TopicSearchRequest = z.infer<typeof topicSearchRequestSchema>;
export type CourseGenerationRequest = z.infer<typeof courseGenerationRequestSchema>;
