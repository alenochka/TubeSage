import { useState } from "react";
import { Link } from "wouter";
import { 
  Search, 
  Video, 
  Database, 
  TrendingUp, 
  Plus, 
  Trash2,
  Clock
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useQuery } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";

export default function Sidebar() {
  const { toast } = useToast();
  
  const { data: recentVideos = [] } = useQuery({
    queryKey: ["/api/videos"],
  });

  const handleAddVideo = () => {
    toast({
      title: "Add Video",
      description: "Scroll down to the Video Processing section to add a new YouTube URL.",
    });
  };

  const handleClearDatabase = () => {
    toast({
      title: "Clear Database",
      description: "This feature will be available in the vector database section.",
    });
  };

  return (
    <aside className="w-64 bg-white border-r border-gray-200 overflow-y-auto">
      <div className="p-6">
        <nav className="space-y-2">
          <Link href="/">
            <a className="flex items-center space-x-3 px-3 py-2 bg-primary/10 text-primary rounded-lg font-medium">
              <Search className="w-5 h-5" />
              <span>Search Transcripts</span>
            </a>
          </Link>
          <a href="#videos" className="flex items-center space-x-3 px-3 py-2 text-neutral-500 hover:bg-neutral-100 rounded-lg">
            <Video className="w-5 h-5" />
            <span>Video Library</span>
          </a>
          <a href="#vector-db" className="flex items-center space-x-3 px-3 py-2 text-neutral-500 hover:bg-neutral-100 rounded-lg">
            <Database className="w-5 h-5" />
            <span>Vector Database</span>
          </a>
          <a href="#analytics" className="flex items-center space-x-3 px-3 py-2 text-neutral-500 hover:bg-neutral-100 rounded-lg">
            <TrendingUp className="w-5 h-5" />
            <span>Analytics</span>
          </a>
        </nav>

        <div className="mt-8">
          <h3 className="text-sm font-semibold text-neutral-400 uppercase tracking-wider mb-3">Quick Actions</h3>
          <div className="space-y-2">
            <Button 
              onClick={handleAddVideo}
              className="w-full justify-start bg-primary text-white hover:bg-primary/90"
              size="sm"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add YouTube URL
            </Button>
            <Button 
              onClick={handleClearDatabase}
              variant="outline" 
              className="w-full justify-start"
              size="sm"
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Clear Database
            </Button>
          </div>
        </div>

        <div className="mt-8">
          <h3 className="text-sm font-semibold text-neutral-400 uppercase tracking-wider mb-3">Recent Videos</h3>
          <div className="space-y-2">
            {recentVideos.slice(0, 3).map((video: any) => (
              <div key={video.id} className="p-2 text-xs text-neutral-500 bg-neutral-100 rounded">
                <div className="font-medium text-neutral-700 truncate" title={video.title}>
                  {video.title}
                </div>
                <div className="flex items-center space-x-1 mt-1">
                  <Clock className="w-3 h-3" />
                  <span>{video.duration}</span>
                </div>
              </div>
            ))}
            {recentVideos.length === 0 && (
              <div className="p-2 text-xs text-neutral-400 bg-neutral-50 rounded">
                No videos processed yet
              </div>
            )}
          </div>
        </div>
      </div>
    </aside>
  );
}
