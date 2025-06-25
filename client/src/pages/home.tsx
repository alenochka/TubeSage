import { useState } from "react";
import { Bot, Cog, Circle } from "lucide-react";
import Sidebar from "@/components/sidebar";
import VideoInput from "@/components/video-input";
import QueryInterface from "@/components/query-interface";
import ResultsDisplay from "@/components/results-display";
import VectorDatabase from "@/components/vector-database";
import AgentDiagram from "@/components/agent-diagram";
import ChannelProcessor from "@/components/channel-processor";
import PlaylistProcessor from "@/components/playlist-processor";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useWebSocket } from "@/hooks/use-websocket";

export default function Home() {
  const [activeAgentCount, setActiveAgentCount] = useState(4);
  const [selectedQuery, setSelectedQuery] = useState<any>(null);
  
  // WebSocket connection for real-time updates
  useWebSocket("/ws");

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 fixed top-0 left-0 right-0 z-10">
        <div className="px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Bot className="w-8 h-8 text-primary" />
              <h1 className="text-2xl font-bold text-gray-900">
                YouTube AI Agent System
              </h1>
            </div>
            
            {/* System Status */}
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <Circle className="w-3 h-3 fill-current text-green-500" />
                <span className="text-sm text-gray-600">System Active</span>
              </div>
              <Badge variant="secondary" className="flex items-center space-x-1">
                <Cog className="w-3 h-3" />
                <span>{activeAgentCount} Agents Running</span>
              </Badge>
            </div>
          </div>
        </div>
      </header>

      <div className="flex h-screen pt-16">
        {/* Sidebar */}
        <Sidebar />

        {/* Main Content */}
        <main className="flex-1 overflow-y-auto">
          <div className="max-w-4xl mx-auto p-4 space-y-3">
            {/* Video Input */}
            <VideoInput />
            
            {/* Channel Processor */}
            <ChannelProcessor />
            
            {/* Playlist Processor */}
            <PlaylistProcessor />

            {/* Query Interface */}
            <QueryInterface onQuerySelect={setSelectedQuery} />

            {/* Results Display */}
            {selectedQuery && <ResultsDisplay query={selectedQuery} />}
            
            {/* Vector Database */}
            <VectorDatabase />
          </div>
        </main>

        {/* Agent Activity Diagram Only */}
        <div className="w-80 bg-white border-l border-gray-200 overflow-y-auto p-6">
          <AgentDiagram />
        </div>
      </div>
    </div>
  );
}
