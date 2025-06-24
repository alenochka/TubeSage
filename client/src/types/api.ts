// Video-related types
export interface Video {
  id: number;
  youtubeId: string;
  title: string;
  duration: string;
  status: 'pending' | 'processing' | 'indexed' | 'error';
  transcriptData?: any;
  chunkCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface ProcessVideoRequest {
  youtubeUrl: string;
}

export interface ProcessVideoResponse {
  message: string;
  video: Video;
}

// Chunk-related types
export interface Chunk {
  id: number;
  videoId: number;
  content: string;
  startTime?: string;
  endTime?: string;
  chunkIndex: number;
  embedding?: number[];
  createdAt: string;
}

// Query-related types
export interface SourceContext {
  videoTitle: string;
  timestamp: string;
  excerpt: string;
  confidence: number;
  relevance: string;
}

export interface Query {
  id: number;
  question: string;
  response?: string;
  sourceContexts?: SourceContext[];
  confidence?: number;
  responseTime?: number;
  createdAt: string;
}

export interface QueryRequest {
  question: string;
}

export interface QueryResponse extends Query {}

// Agent-related types
export interface Agent {
  id: number;
  name: string;
  description: string;
  status: 'active' | 'inactive' | 'busy';
  lastAction?: string;
  queueCount: number;
  uptime: number;
  totalTasks: number;
  successfulTasks: number;
  createdAt: string;
  updatedAt: string;
}

export interface AgentLog {
  id: number;
  agentId: number;
  agentName: string;
  message: string;
  level: 'info' | 'warning' | 'error';
  createdAt: string;
}

// System metrics types
export interface SystemMetrics {
  apiCalls: number;
  avgResponseTime: number;
  successRate: number;
  memoryUsage: string;
  totalVideos: number;
  totalChunks: number;
  vectorDimensions: number;
}

export interface VectorDatabaseStats {
  totalChunks: number;
  totalVideos: number;
  vectorDimensions: number;
}

// WebSocket message types
export interface WebSocketMessage {
  type: 'agent-status' | 'system-logs' | 'system-metrics' | 'video-processed' | 'processing-update';
  data: any;
}

export interface ProcessingUpdate {
  workflowId: string;
  currentStep: string;
  progress: number;
  status: 'processing' | 'completed' | 'error';
  activeAgent?: string;
  message?: string;
}

// API response wrapper types
export interface ApiResponse<T = any> {
  data?: T;
  message?: string;
  error?: string;
  details?: any;
}

export interface ApiError {
  message: string;
  details?: any;
  status?: number;
}

// Form validation types
export interface VideoProcessingFormData {
  youtubeUrl: string;
}

export interface QueryFormData {
  question: string;
}

// Processing status types
export interface ProcessingStatus {
  isProcessing: boolean;
  currentStep: string;
  progress: number;
  activeAgent: string;
  workflowId?: string;
}

// Agent orchestrator types
export interface WorkflowStatus {
  workflowId: string;
  status: 'processing' | 'completed' | 'error';
  currentStep: string;
  progress: number;
  startTime: string;
  endTime?: string;
  error?: string;
}

// Vector database operation types
export interface VectorSearchRequest {
  query: string;
  topK?: number;
  threshold?: number;
}

export interface VectorSearchResult {
  id: string;
  similarity: number;
  content: string;
  metadata: {
    youtubeId: string;
    videoTitle: string;
    startTime?: string;
    endTime?: string;
    chunkIndex: number;
  };
}

// YouTube service types
export interface YouTubeVideoInfo {
  id: string;
  title: string;
  description: string;
  duration: string;
  channelTitle: string;
  publishedAt?: string;
  viewCount: number;
  thumbnailUrl: string;
}

// Agent task types
export interface AgentTask {
  type: string;
  id: string;
  priority: number;
  data: any;
  createdAt: string;
  timeout?: number;
}

export interface AgentTaskResult {
  taskId: string;
  status: 'success' | 'error' | 'timeout';
  result?: any;
  error?: string;
  duration: number;
}

// Configuration types
export interface SystemConfiguration {
  maxConcurrentTasks: number;
  defaultTimeout: number;
  vectorDimensions: number;
  chunkSize: number;
  chunkOverlap: number;
  similarityThreshold: number;
}

export interface AgentConfiguration {
  name: string;
  enabled: boolean;
  maxQueueSize: number;
  timeout: number;
  retryAttempts: number;
  settings: Record<string, any>;
}
