import { useEffect } from "react";
import { UserCog, Circle, Activity, Monitor } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useQuery } from "@tanstack/react-query";

interface AgentPanelProps {
  onActiveCountChange: (count: number) => void;
}

export default function AgentPanel({ onActiveCountChange }: AgentPanelProps) {
  const { data: agents = [] } = useQuery({
    queryKey: ["/api/agents"],
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  const { data: systemMetrics } = useQuery({
    queryKey: ["/api/system/metrics"],
    refetchInterval: 30000,
  });

  const { data: systemLogs = [] } = useQuery({
    queryKey: ["/api/system/logs"],
    refetchInterval: 10000, // Refresh every 10 seconds
  });

  useEffect(() => {
    const activeCount = agents.filter((agent: any) => agent.status === "active").length;
    onActiveCountChange(activeCount);
  }, [agents, onActiveCountChange]);

  const getStatusIndicator = (status: string) => {
    const statusConfig = {
      active: { color: "text-green-500", animate: false },
      busy: { color: "text-yellow-500", animate: true },
      inactive: { color: "text-gray-400", animate: false },
    };

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.inactive;
    
    return (
      <Circle 
        className={`w-3 h-3 fill-current ${config.color} ${config.animate ? 'status-pulse' : ''}`} 
      />
    );
  };

  const formatUptime = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
  };

  const formatTimestamp = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: false,
    });
  };

  const getLogColor = (agentName: string) => {
    const colors = {
      "TRANSCRIPT FETCHER": "text-green-400",
      "TEXT CHUNKER": "text-blue-400", 
      "VECTOR EMBEDDER": "text-purple-400",
      "QUERY PROCESSOR": "text-orange-400",
    };
    return colors[agentName as keyof typeof colors] || "text-neutral-300";
  };

  return (
    <aside className="w-80 bg-white border-l border-gray-200 overflow-y-auto">
      <div className="p-6 space-y-6">
        {/* Header */}
        <CardTitle className="flex items-center space-x-2">
          <UserCog className="w-5 h-5 text-primary" />
          <span>Agent Logs</span>
        </CardTitle>

        {/* Agents Status */}
        <div className="space-y-4">
          {agents.map((agent: any) => (
            <Card key={agent.id} className="bg-neutral-50">
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center space-x-2">
                    {getStatusIndicator(agent.status)}
                    <span className="font-medium text-neutral-800">{agent.name}</span>
                  </div>
                  <span className="text-xs text-neutral-500">
                    {formatUptime(agent.uptime || 0)}
                  </span>
                </div>
                <div className="text-sm text-neutral-600 mb-2">
                  {agent.description}
                </div>
                <div className="space-y-1 text-xs text-neutral-500">
                  <div>
                    Last Action: <span className="text-neutral-700">{agent.lastAction || "None"}</span>
                  </div>
                  <div>
                    Queue: <span className="text-neutral-700">{agent.queueCount || 0} tasks</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* System Metrics */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center space-x-2">
              <Monitor className="w-4 h-4" />
              <span>System Metrics</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between text-sm">
              <span className="text-neutral-600">API Calls (Last Hour)</span>
              <span className="font-medium">{systemMetrics?.apiCalls || 0}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-neutral-600">Response Time</span>
              <Badge variant="secondary" className="text-secondary">
                {systemMetrics?.avgResponseTime || 0}ms
              </Badge>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-neutral-600">Success Rate</span>
              <Badge variant="secondary" className="text-secondary">
                {systemMetrics?.successRate || 0}%
              </Badge>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-neutral-600">Memory Usage</span>
              <span className="font-medium">{systemMetrics?.memoryUsage || "0 MB"}</span>
            </div>
          </CardContent>
        </Card>

        {/* Agent Logs */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center space-x-2">
              <Activity className="w-4 h-4" />
              <span>Agent Logs</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="bg-neutral-900 rounded-lg p-3 text-xs font-mono text-neutral-300 max-h-32 overflow-y-auto agent-logs">
              {systemLogs.length === 0 ? (
                <div className="text-neutral-500">No recent logs</div>
              ) : (
                systemLogs.slice(0, 10).map((log: any, index: number) => (
                  <div key={index} className="mb-1">
                    <span className="text-neutral-500">
                      {formatTimestamp(log.createdAt)}
                    </span>{" "}
                    <span className={getLogColor(log.agentName.toUpperCase())}>
                      [{log.agentName.toUpperCase()}]
                    </span>{" "}
                    <span>{log.message}</span>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </aside>
  );
}
