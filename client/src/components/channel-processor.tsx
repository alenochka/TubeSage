import { useState } from "react";
import { Play, Pause, SkipForward, AlertCircle, CheckCircle, Clock } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";

interface ChannelVideo {
  id: string;
  title: string;
  duration: string;
  publishedAt: string;
  thumbnailUrl: string;
  url: string;
}

interface ProcessingStatus {
  isProcessing: boolean;
  currentVideoIndex: number;
  totalVideos: number;
  currentVideo: ChannelVideo | null;
  processedVideos: string[];
  failedVideos: { id: string; error: string; }[];
  isPaused: boolean;
  startTime: Date | null;
}

export default function ChannelProcessor() {
  const [channelUrl, setChannelUrl] = useState("");
  const [channelVideos, setChannelVideos] = useState<ChannelVideo[]>([]);
  const [processingStatus, setProcessingStatus] = useState<ProcessingStatus>({
    isProcessing: false,
    currentVideoIndex: 0,
    totalVideos: 0,
    currentVideo: null,
    processedVideos: [],
    failedVideos: [],
    isPaused: false,
    startTime: null,
  });

  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch channel videos
  const fetchChannelMutation = useMutation({
    mutationFn: async (url: string) => {
      const response = await apiRequest("POST", "/api/channels/videos", { channelUrl: url });
      return response.json();
    },
    onSuccess: (data) => {
      setChannelVideos(data.videos);
      toast({
        title: "Channel Videos Fetched",
        description: `Found ${data.videos.length} videos in the channel.`,
      });
    },
    onError: (error: any) => {
      toast({
        title: "Failed to Fetch Channel",
        description: error.message || "Could not fetch channel videos.",
        variant: "destructive",
      });
    },
  });

  // Process channel videos in bulk
  const processChannelMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("POST", "/api/channels/process", { 
        channelUrl,
        videos: channelVideos 
      });
      return response.json();
    },
  });

  const handleFetchChannel = async () => {
    if (!channelUrl.trim()) {
      toast({
        title: "Channel URL Required",
        description: "Please enter a valid YouTube channel URL.",
        variant: "destructive",
      });
      return;
    }

    fetchChannelMutation.mutate(channelUrl);
  };

  const handleStartProcessing = async () => {
    if (channelVideos.length === 0) return;

    setProcessingStatus({
      isProcessing: true,
      currentVideoIndex: 0,
      totalVideos: channelVideos.length,
      currentVideo: channelVideos[0],
      processedVideos: [],
      failedVideos: [],
      isPaused: false,
      startTime: new Date(),
    });

    // Process videos one by one with delay to avoid overwhelming the system
    for (let i = 0; i < channelVideos.length; i++) {
      if (processingStatus.isPaused) break;

      const video = channelVideos[i];
      
      setProcessingStatus(prev => ({
        ...prev,
        currentVideoIndex: i,
        currentVideo: video,
      }));

      try {
        const response = await apiRequest("POST", "/api/videos/process", {
          youtubeUrl: video.url
        });
        
        const result = await response.json();
        
        setProcessingStatus(prev => ({
          ...prev,
          processedVideos: [...prev.processedVideos, video.id],
        }));

        toast({
          title: "Video Processed",
          description: `"${video.title}" has been processed successfully.`,
        });

        // Wait 2 seconds between videos to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 2000));

      } catch (error: any) {
        // Don't count duplicates as failures
        if (error.message && error.message.includes("already processed")) {
          setProcessingStatus(prev => ({
            ...prev,
            processedVideos: [...prev.processedVideos, video.id],
          }));
        } else {
          setProcessingStatus(prev => ({
            ...prev,
            failedVideos: [...prev.failedVideos, { id: video.id, error: error.message }],
          }));
        }

        // Handle duplicate video case
        if (error.message && error.message.includes("already processed")) {
          toast({
            title: "Video Skipped",
            description: `"${video.title}" - Already processed`,
            variant: "default",
          });
        } else {
          toast({
            title: "Processing Failed",
            description: `Failed to process "${video.title}": ${error.message}`,
            variant: "destructive",
          });
        }
      }
    }

    setProcessingStatus(prev => ({
      ...prev,
      isProcessing: false,
      currentVideo: null,
    }));

    // Refresh video list after processing
    queryClient.invalidateQueries({ queryKey: ["/api/videos"] });
    queryClient.invalidateQueries({ queryKey: ["/api/system/metrics"] });

    toast({
      title: "Channel Processing Complete",
      description: `Processed ${processingStatus.processedVideos.length} videos successfully.`,
    });
  };

  const handlePauseResume = () => {
    setProcessingStatus(prev => ({
      ...prev,
      isPaused: !prev.isPaused,
    }));
  };

  const handleStop = () => {
    setProcessingStatus({
      isProcessing: false,
      currentVideoIndex: 0,
      totalVideos: 0,
      currentVideo: null,
      processedVideos: [],
      failedVideos: [],
      isPaused: false,
      startTime: null,
    });
  };

  const getProcessingProgress = () => {
    if (processingStatus.totalVideos === 0) return 0;
    return Math.round(((processingStatus.processedVideos.length + processingStatus.failedVideos.length) / processingStatus.totalVideos) * 100);
  };

  const getEstimatedTimeRemaining = () => {
    if (!processingStatus.startTime || processingStatus.totalVideos === 0) return "Unknown";
    
    const elapsed = Date.now() - processingStatus.startTime.getTime();
    const processed = processingStatus.processedVideos.length + processingStatus.failedVideos.length;
    const remaining = processingStatus.totalVideos - processed;
    
    if (processed === 0) return "Calculating...";
    
    const avgTimePerVideo = elapsed / processed;
    const estimatedRemaining = (avgTimePerVideo * remaining) / 1000 / 60; // in minutes
    
    return `${Math.round(estimatedRemaining)} min`;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Play className="w-5 h-5 text-primary" />
          <span>Bulk Channel Processor</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Channel Input */}
        <div className="space-y-4">
          <div className="flex space-x-2">
            <Input
              placeholder="Enter YouTube channel URL (@drbabcock or full URL)"
              value={channelUrl}
              onChange={(e) => setChannelUrl(e.target.value)}
              disabled={processingStatus.isProcessing}
            />
            <Button
              onClick={handleFetchChannel}
              disabled={fetchChannelMutation.isPending || processingStatus.isProcessing}
            >
              {fetchChannelMutation.isPending ? "Fetching..." : "Fetch Videos"}
            </Button>
          </div>

          {channelVideos.length > 0 && (
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-secondary/10 rounded-lg">
                <div>
                  <div className="font-semibold">Channel Videos Found</div>
                  <div className="text-sm text-muted-foreground">
                    {channelVideos.length} videos ready for processing
                  </div>
                </div>
                <Button
                  onClick={handleStartProcessing}
                  disabled={processingStatus.isProcessing}
                >
                  Start Processing
                </Button>
              </div>

              {/* Video Grid Display */}
              <div className="space-y-2">
                <h3 className="font-semibold">Available Videos</h3>
                <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3 max-h-96 overflow-y-auto">
                  {channelVideos.map((video, index) => (
                    <div key={video.id} className="p-3 border rounded-lg hover:bg-gray-50">
                      <div className="space-y-2">
                        <div className="font-medium text-sm truncate" title={video.title}>
                          {video.title}
                        </div>
                        <div className="flex justify-between text-xs text-muted-foreground">
                          <span>{video.duration}</span>
                          <span>{video.publishedAt}</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <Badge variant={
                            processingStatus.processedVideos.includes(video.id) ? "default" :
                            processingStatus.failedVideos.some(f => f.id === video.id) ? "destructive" :
                            processingStatus.currentVideo?.id === video.id ? "secondary" : "outline"
                          }>
                            {processingStatus.processedVideos.includes(video.id) ? "Processed" :
                             processingStatus.failedVideos.some(f => f.id === video.id) ? "Failed" :
                             processingStatus.currentVideo?.id === video.id ? "Processing" : "Pending"}
                          </Badge>
                          <a 
                            href={video.url} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="text-xs text-blue-500 hover:underline"
                          >
                            View
                          </a>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="text-center text-sm text-muted-foreground">
                  Total videos: {channelVideos.length}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Processing Status */}
        {processingStatus.isProcessing && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold">Processing Status</h3>
              <div className="flex space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handlePauseResume}
                >
                  {processingStatus.isPaused ? (
                    <>
                      <Play className="w-4 h-4 mr-1" />
                      Resume
                    </>
                  ) : (
                    <>
                      <Pause className="w-4 h-4 mr-1" />
                      Pause
                    </>
                  )}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleStop}
                >
                  <SkipForward className="w-4 h-4 mr-1" />
                  Stop
                </Button>
              </div>
            </div>

            <Progress value={getProcessingProgress()} className="h-3" />

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div>
                <div className="text-muted-foreground">Progress</div>
                <div className="font-semibold">
                  {processingStatus.processedVideos.length + processingStatus.failedVideos.length} / {processingStatus.totalVideos}
                </div>
              </div>
              <div>
                <div className="text-muted-foreground">Success</div>
                <div className="font-semibold text-green-600">
                  {processingStatus.processedVideos.length}
                </div>
              </div>
              <div>
                <div className="text-muted-foreground">Failed</div>
                <div className="font-semibold text-red-600">
                  {processingStatus.failedVideos.length}
                </div>
              </div>
              <div>
                <div className="text-muted-foreground">Time Remaining</div>
                <div className="font-semibold">
                  {getEstimatedTimeRemaining()}
                </div>
              </div>
            </div>

            {processingStatus.currentVideo && (
              <div className="p-4 border rounded-lg">
                <div className="flex items-center space-x-2 mb-2">
                  <Clock className="w-4 h-4 text-blue-500" />
                  <span className="font-medium">Currently Processing</span>
                </div>
                <div className="text-sm text-muted-foreground truncate">
                  {processingStatus.currentVideo.title}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Processing Summary */}
        {(processingStatus.processedVideos.length > 0 || processingStatus.failedVideos.length > 0) && (
          <div className="space-y-4">
            <h3 className="font-semibold">Processing Summary</h3>
            
            <div className="grid grid-cols-2 gap-4">
              <Card>
                <CardContent className="p-4 text-center">
                  <CheckCircle className="w-8 h-8 text-green-500 mx-auto mb-2" />
                  <div className="text-2xl font-bold text-green-600">
                    {processingStatus.processedVideos.length}
                  </div>
                  <div className="text-sm text-muted-foreground">Successfully Processed</div>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="p-4 text-center">
                  <AlertCircle className="w-8 h-8 text-red-500 mx-auto mb-2" />
                  <div className="text-2xl font-bold text-red-600">
                    {processingStatus.failedVideos.length}
                  </div>
                  <div className="text-sm text-muted-foreground">Failed</div>
                </CardContent>
              </Card>
            </div>

            {processingStatus.failedVideos.length > 0 && (
              <div className="space-y-2">
                <h4 className="font-medium text-red-600">Failed Videos</h4>
                {processingStatus.failedVideos.map((failed, index) => (
                  <div key={index} className="p-2 bg-red-50 rounded text-sm">
                    <div className="font-medium">Video ID: {failed.id}</div>
                    <div className="text-red-600">{failed.error}</div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}