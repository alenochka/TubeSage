import { useState } from "react";
import { List, Plus, Play, Clock, Eye, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

interface PlaylistVideo {
  videoId: string;
  title: string;
  description: string;
  publishedAt: string;
  channelTitle: string;
  duration: string;
  viewCount: number;
  thumbnail: string;
}

export default function PlaylistProcessor() {
  const [playlistUrl, setPlaylistUrl] = useState("");
  const [fetchedVideos, setFetchedVideos] = useState<PlaylistVideo[]>([]);
  const [processingVideos, setProcessingVideos] = useState<Set<string>>(new Set());
  const { toast } = useToast();

  // Get existing videos to check processing status
  const { data: existingVideos = [] } = useQuery({
    queryKey: ["/api/videos"],
    refetchInterval: 2000,
  });

  const fetchPlaylistMutation = useMutation({
    mutationFn: async (url: string) => {
      console.log("Fetching playlist:", url);
      const response = await apiRequest("POST", "/api/playlists/process", { 
        playlistUrl: url, 
        maxResults: 50 
      });
      const data = await response.json();
      console.log("Playlist response:", data);
      return data;
    },
    onSuccess: (data) => {
      console.log("Playlist fetch success:", data);
      setFetchedVideos(data.videos || []);
      toast({
        title: "Playlist Loaded",
        description: `Found ${data.videos?.length || 0} videos in playlist`,
      });
    },
    onError: (error: any) => {
      console.error("Playlist fetch error:", error);
      toast({
        title: "Failed to Load Playlist",
        description: error.message || "Please check the playlist URL and try again.",
        variant: "destructive",
      });
    },
  });

  const processVideoMutation = useMutation({
    mutationFn: async (youtubeId: string) => {
      const response = await apiRequest("POST", "/api/videos/process", { 
        youtubeUrl: `https://www.youtube.com/watch?v=${youtubeId}` 
      });
      return response.json();
    },
    onSuccess: (data, youtubeId) => {
      setProcessingVideos(prev => {
        const newSet = new Set(prev);
        newSet.delete(youtubeId);
        return newSet;
      });
      
      toast({
        title: "Video Processing Started",
        description: "Video has been added to the processing queue",
      });
    },
    onError: (error: any, youtubeId) => {
      setProcessingVideos(prev => {
        const newSet = new Set(prev);
        newSet.delete(youtubeId);
        return newSet;
      });
      
      toast({
        title: "Processing Failed",
        description: error.message || "Failed to process video",
        variant: "destructive",
      });
    },
  });

  const handleFetchPlaylist = (e: React.FormEvent) => {
    e.preventDefault();
    if (!playlistUrl.trim()) return;
    
    setFetchedVideos([]);
    fetchPlaylistMutation.mutate(playlistUrl);
  };

  const handleProcessVideo = (video: PlaylistVideo) => {
    setProcessingVideos(prev => new Set(prev).add(video.videoId));
    processVideoMutation.mutate(video.videoId);
  };

  const handleProcessAll = () => {
    const unprocessedVideos = fetchedVideos.filter(video => 
      !existingVideos.some((existing: any) => existing.youtubeId === video.videoId)
    );
    
    unprocessedVideos.forEach(video => {
      setProcessingVideos(prev => new Set(prev).add(video.videoId));
      processVideoMutation.mutate(video.videoId);
    });
  };

  const getVideoStatus = (videoId: string) => {
    if (processingVideos.has(videoId)) return "processing";
    const existing = existingVideos.find((v: any) => v.youtubeId === videoId);
    if (existing) {
      return existing.status === "indexed" ? "indexed" : "processing";
    }
    return "unprocessed";
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "indexed":
        return <Badge className="bg-green-100 text-green-800">Indexed</Badge>;
      case "processing":
        return <Badge className="bg-yellow-100 text-yellow-800">Processing</Badge>;
      default:
        return <Badge variant="outline">Not Processed</Badge>;
    }
  };

  const formatNumber = (num: number) => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num.toString();
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  const unprocessedCount = fetchedVideos.filter(video => 
    getVideoStatus(video.videoId) === "unprocessed"
  ).length;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <List className="w-5 h-5 text-primary" />
          <span>Playlist Processor</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <form onSubmit={handleFetchPlaylist} className="space-y-4">
          <div>
            <Label htmlFor="playlistUrl">YouTube Playlist URL</Label>
            <div className="flex space-x-2 mt-2">
              <Input
                id="playlistUrl"
                type="url"
                placeholder="https://www.youtube.com/playlist?list=..."
                value={playlistUrl}
                onChange={(e) => setPlaylistUrl(e.target.value)}
                disabled={fetchPlaylistMutation.isPending}
                className="flex-1"
              />
              <Button 
                type="submit" 
                disabled={!playlistUrl.trim() || fetchPlaylistMutation.isPending}
              >
                <List className="w-4 h-4 mr-2" />
                Load Playlist
              </Button>
            </div>
          </div>
        </form>

        {fetchPlaylistMutation.isPending && (
          <div className="text-center py-8">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            <p className="mt-2 text-neutral-600">Loading playlist videos...</p>
          </div>
        )}

        {fetchedVideos.length > 0 && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">
                Playlist Videos ({fetchedVideos.length})
              </h3>
              {unprocessedCount > 0 && (
                <Button 
                  onClick={handleProcessAll}
                  disabled={processVideoMutation.isPending}
                  size="sm"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Process All Unprocessed ({unprocessedCount})
                </Button>
              )}
            </div>

            <div className="grid gap-4 max-h-96 overflow-y-auto">
              {fetchedVideos.map((video) => {
                const status = getVideoStatus(video.videoId);
                
                return (
                  <div key={video.videoId} className="flex items-start space-x-4 p-4 border rounded-lg hover:bg-neutral-50">
                    <img 
                      src={video.thumbnail} 
                      alt={video.title}
                      className="w-24 h-16 object-cover rounded flex-shrink-0"
                    />
                    
                    <div className="flex-1 min-w-0">
                      <h4 className="font-medium text-sm line-clamp-2 mb-1">
                        {video.title}
                      </h4>
                      
                      <div className="flex items-center space-x-4 text-xs text-neutral-600 mb-2">
                        <span className="flex items-center">
                          <Play className="w-3 h-3 mr-1" />
                          {video.channelTitle}
                        </span>
                        <span className="flex items-center">
                          <Clock className="w-3 h-3 mr-1" />
                          {video.duration}
                        </span>
                        <span className="flex items-center">
                          <Eye className="w-3 h-3 mr-1" />
                          {formatNumber(video.viewCount)}
                        </span>
                        <span>{formatDate(video.publishedAt)}</span>
                      </div>
                      
                      <div className="flex items-center justify-between">
                        {getStatusBadge(status)}
                        
                        <div className="flex items-center space-x-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => window.open(`https://www.youtube.com/watch?v=${video.videoId}`, '_blank')}
                          >
                            <ExternalLink className="w-3 h-3" />
                          </Button>
                          
                          {status === "unprocessed" && (
                            <Button
                              size="sm"
                              onClick={() => handleProcessVideo(video)}
                              disabled={processingVideos.has(video.videoId)}
                            >
                              <Plus className="w-3 h-3 mr-1" />
                              Process
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}