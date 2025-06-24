import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Activity, Brain, FileText, Search, Zap } from "lucide-react";
import { useState, useEffect } from "react";

interface AgentLog {
  id: number;
  agentName: string;
  message: string;
  level: string;
  createdAt: string;
}

export default function AgentDiagram() {
  const [activeAgents, setActiveAgents] = useState<Set<string>>(new Set());
  const [agentProgress, setAgentProgress] = useState<Record<string, number>>({});

  const { data: logs = [] } = useQuery<AgentLog[]>({
    queryKey: ["/api/system/logs"],
    refetchInterval: 2000,
  });

  // Agent configuration with icons and colors
  const agentConfig = {
    "Transcript Fetcher": {
      icon: FileText,
      color: "bg-blue-500",
      description: "Extracts YouTube transcripts"
    },
    "Text Chunker": {
      icon: Zap,
      color: "bg-green-500", 
      description: "Splits text into semantic chunks"
    },
    "Vector Embedder": {
      icon: Brain,
      color: "bg-purple-500",
      description: "Creates embeddings & vector search"
    },
    "Query Processor": {
      icon: Search,
      color: "bg-orange-500",
      description: "Generates AI responses"
    }
  };

  // Track active agents based on recent logs
  useEffect(() => {
    if (logs.length > 0) {
      const recentLogs = logs.slice(0, 10);
      const recentAgents = new Set(recentLogs.map(log => log.agentName));
      setActiveAgents(recentAgents);

      // Simulate progress based on agent activity
      const progress: Record<string, number> = {};
      recentLogs.forEach((log, index) => {
        const agent = log.agentName;
        if (!progress[agent]) {
          progress[agent] = Math.max(20, 100 - (index * 10));
        }
      });
      setAgentProgress(progress);
    }
  }, [logs]);

  const getAgentStatus = (agentName: string) => {
    const recentActivity = logs.find(log => log.agentName === agentName);
    const isActive = activeAgents.has(agentName);
    const lastActivity = recentActivity ? new Date(recentActivity.createdAt) : null;
    const isRecent = lastActivity && (Date.now() - lastActivity.getTime()) < 30000; // 30 seconds

    if (isActive && isRecent) return "active";
    if (recentActivity) return "completed";
    return "idle";
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active": return "bg-green-500 animate-pulse";
      case "completed": return "bg-blue-500";
      default: return "bg-gray-400";
    }
  };

  const getLatestMessage = (agentName: string) => {
    const latestLog = logs.find(log => log.agentName === agentName);
    return latestLog?.message.substring(0, 60) + "..." || "Ready";
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Activity className="w-5 h-5 text-primary" />
          <span>Agent Activity Diagram</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {Object.entries(agentConfig).map(([agentName, config]) => {
          const Icon = config.icon;
          const status = getAgentStatus(agentName);
          const progress = agentProgress[agentName] || 0;
          const message = getLatestMessage(agentName);

          return (
            <div key={agentName} className="border rounded-lg p-4 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className={`p-2 rounded-full ${config.color} text-white`}>
                    <Icon className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-sm">{agentName}</h3>
                    <p className="text-xs text-muted-foreground">{config.description}</p>
                  </div>
                </div>
                <Badge 
                  variant={status === "active" ? "default" : "secondary"}
                  className={status === "active" ? "animate-pulse" : ""}
                >
                  {status}
                </Badge>
              </div>
              
              {status === "active" && (
                <div className="space-y-2">
                  <Progress value={progress} className="h-2" />
                  <p className="text-xs text-muted-foreground">{message}</p>
                </div>
              )}
              
              {status === "completed" && (
                <p className="text-xs text-green-600">{message}</p>
              )}
              
              {status === "idle" && (
                <p className="text-xs text-gray-500">Waiting for tasks...</p>
              )}
            </div>
          );
        })}

        {/* Data Flow Arrows */}
        <div className="mt-6 space-y-2">
          <h4 className="font-semibold text-sm text-muted-foreground">Data Flow</h4>
          <div className="flex items-center justify-between text-xs">
            <span className="px-2 py-1 bg-blue-100 rounded">YouTube URL</span>
            <span>→</span>
            <span className="px-2 py-1 bg-green-100 rounded">Transcript</span>
            <span>→</span>
            <span className="px-2 py-1 bg-purple-100 rounded">Chunks</span>
            <span>→</span>
            <span className="px-2 py-1 bg-orange-100 rounded">AI Response</span>
          </div>
        </div>

        {/* System Stats */}
        <div className="grid grid-cols-2 gap-4 pt-4 border-t">
          <div className="text-center">
            <div className="text-lg font-semibold text-green-600">
              {logs.filter(log => log.level === "info").length}
            </div>
            <div className="text-xs text-muted-foreground">Successful Operations</div>
          </div>
          <div className="text-center">
            <div className="text-lg font-semibold text-red-600">
              {logs.filter(log => log.level === "error").length}
            </div>
            <div className="text-xs text-muted-foreground">Errors</div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}