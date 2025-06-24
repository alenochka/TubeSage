import { useState } from "react";
import { Database, RefreshCw, Eye, Trash2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

export default function VectorDatabase() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: videos = [], isLoading } = useQuery({
    queryKey: ["/api/videos"],
  });

  const { data: metrics } = useQuery({
    queryKey: ["/api/system/metrics"],
  });

  const refreshMutation = useMutation({
    mutationFn: async () => {
      await queryClient.invalidateQueries({ queryKey: ["/api/videos"] });
      await queryClient.invalidateQueries({ queryKey: ["/api/system/metrics"] });
    },
    onSuccess: () => {
      toast({
        title: "Database Refreshed",
        description: "Vector database information has been updated.",
      });
    },
  });

  const deleteVideoMutation = useMutation({
    mutationFn: async (videoId: number) => {
      const response = await apiRequest("DELETE", `/api/videos/${videoId}`);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/videos"] });
      queryClient.invalidateQueries({ queryKey: ["/api/system/metrics"] });
      
      toast({
        title: "Video Deleted",
        description: "Video and associated data have been removed from the database.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Delete Failed",
        description: error.message || "Failed to delete video.",
        variant: "destructive",
      });
    },
  });

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      pending: { variant: "outline" as const, color: "text-yellow-600" },
      processing: { variant: "secondary" as const, color: "text-blue-600" },
      indexed: { variant: "secondary" as const, color: "text-green-600" },
      error: { variant: "destructive" as const, color: "text-red-600" },
    };

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.pending;
    
    return (
      <Badge variant={config.variant} className={config.color}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    );
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center space-x-2">
            <Database className="w-5 h-5 text-primary" />
            <span>Vector Database</span>
          </CardTitle>
          <Button
            variant="outline"
            size="sm"
            onClick={() => refreshMutation.mutate()}
            disabled={refreshMutation.isPending}
          >
            <RefreshCw className={`w-4 h-4 mr-1 ${refreshMutation.isPending ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-primary">
                {metrics?.totalChunks || 0}
              </div>
              <div className="text-sm text-neutral-500">Total Chunks</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-secondary">
                {metrics?.totalVideos || 0}
              </div>
              <div className="text-sm text-neutral-500">Videos Processed</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-accent">
                {metrics?.vectorDimensions || 1536}
              </div>
              <div className="text-sm text-neutral-500">Vector Dimensions</div>
            </CardContent>
          </Card>
        </div>

        {/* Videos Table */}
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Video</TableHead>
                <TableHead>Chunks</TableHead>
                <TableHead>Duration</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8">
                    Loading videos...
                  </TableCell>
                </TableRow>
              ) : videos.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8 text-neutral-500">
                    No videos processed yet. Add a YouTube URL to get started.
                  </TableCell>
                </TableRow>
              ) : (
                videos.map((video: any) => (
                  <TableRow key={video.id}>
                    <TableCell>
                      <div>
                        <div className="font-medium text-neutral-800 truncate max-w-xs" title={video.title}>
                          {video.title}
                        </div>
                        <div className="text-xs text-neutral-500">{video.youtubeId}</div>
                      </div>
                    </TableCell>
                    <TableCell className="text-neutral-600">{video.chunkCount}</TableCell>
                    <TableCell className="text-neutral-600">{video.duration}</TableCell>
                    <TableCell>
                      {getStatusBadge(video.status)}
                    </TableCell>
                    <TableCell>
                      <div className="flex space-x-2">
                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                          <Eye className="w-4 h-4" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="h-8 w-8 p-0 text-red-500 hover:text-red-700"
                          onClick={() => deleteVideoMutation.mutate(video.id)}
                          disabled={deleteVideoMutation.isPending}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}
