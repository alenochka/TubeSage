import { useState } from "react";
import { Bot, Cog, Circle } from "lucide-react";
import Sidebar from "@/components/sidebar";
import VideoInput from "@/components/video-input";
import QueryInterface from "@/components/query-interface";
import ResultsDisplay from "@/components/results-display";
import VectorDatabase from "@/components/vector-database";

import AgentDiagram from "@/components/agent-diagram";
import ChannelProcessor from "@/components/channel-processor";
import CourseBuilderSimple from "@/components/course-builder-simple";
import CourseLibrary from "@/components/course-library";
import CourseViewer from "@/components/course-viewer";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useWebSocket } from "@/hooks/use-websocket";

export default function Home() {
  const [activeAgentCount, setActiveAgentCount] = useState(4);
  const [selectedQuery, setSelectedQuery] = useState<any>(null);
  const [selectedCourse, setSelectedCourse] = useState<any>(null);
  
  // WebSocket connection for real-time updates
  useWebSocket("/ws");

  return (
    <div className="min-h-screen bg-neutral-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 fixed w-full top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <Bot className="text-primary text-2xl" />
                <h1 className="text-xl font-bold text-neutral-800">YouTube AI Agent System</h1>
              </div>
              <Badge variant="secondary" className="bg-secondary/10 text-secondary">
                v2.0 Multi-Agent
              </Badge>
            </div>
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2 text-sm">
                <Circle className="w-2 h-2 text-secondary fill-current status-pulse" />
                <span className="text-neutral-500">{activeAgentCount} Agents Active</span>
              </div>
              <Button variant="ghost" size="sm">
                <Cog className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Layout */}
      <div className="flex h-screen pt-16">
        {/* Sidebar */}
        <Sidebar />

        {/* Main Content */}
        <main className="flex-1 overflow-y-auto">
          <div className="max-w-4xl mx-auto p-6 space-y-6">
            {/* Video Input */}
            <VideoInput />
            
            {/* Channel Processor */}
            <ChannelProcessor />

            {/* Course Builder */}
            <CourseBuilderSimple onCourseCreated={(course) => {
              setSelectedCourse(course);
            }} />

            {/* Course Library */}
            {!selectedCourse ? (
              <CourseLibrary onCourseSelect={setSelectedCourse} />
            ) : (
              <CourseViewer 
                courseId={selectedCourse.id} 
                onBack={() => setSelectedCourse(null)} 
              />
            )}

            {/* Query Interface */}
            <QueryInterface onQuerySelect={setSelectedQuery} />

            {/* Results Display */}
            {selectedQuery && <ResultsDisplay query={selectedQuery} />}

            {/* Agent Orchestration */}
            <div id="agent-orchestration" className="scroll-mt-20">
              <AgentDiagram />
            </div>
            
            {/* Vector Database */}
            <VectorDatabase />
          </div>
        </main>
      </div>
    </div>
  );
}
