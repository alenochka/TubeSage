import { useState } from "react";
import { Play, Video } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

interface ProcessingStatus {
  isProcessing: boolean;
  currentStep: string;
  progress: number;
  activeAgent: string;
}

export default function VideoInput() {
  const [youtubeUrl, setYoutubeUrl] = useState("");
  const [processingStatus, setProcessingStatus] = useState<ProcessingStatus>({
    isProcessing: false,
    currentStep: "",
    progress: 0,
    activeAgent: ""
  });

  const { toast } = useToast();
  const queryClient = useQueryClient();

  const processVideoMutation = useMutation({
    mutationFn: async (youtubeUrl: string) => {
      const response = await apiRequest("POST", "/api/videos/process", { youtubeUrl });
      return response.json();
    },
    onMutate: () => {
      setProcessingStatus({
        isProcessing: true,
        currentStep: "Initializing...",
        progress: 10,
        activeAgent: "System"
      });
    },
    onSuccess: (data) => {
      // Simulate processing steps
      simulateProcessing();
      
      toast({
        title: "Video Processing Started",
        description: `Processing video ${data.video.youtubeId}. This may take a few minutes.`,
      });

      queryClient.invalidateQueries({ queryKey: ["/api/videos"] });
      setYoutubeUrl("");
    },
    onError: (error: any) => {
      setProcessingStatus(prev => ({ ...prev, isProcessing: false }));
      
      toast({
        title: "Processing Failed",
        description: error.message || "Failed to process video. Please check the URL and try again.",
        variant: "destructive",
      });
    },
  });

  const simulateProcessing = () => {
    const steps = [
      { step: "Fetching transcript...", progress: 25, agent: "Transcript Fetcher" },
      { step: "Chunking text...", progress: 50, agent: "Text Chunker" },
      { step: "Creating embeddings...", progress: 75, agent: "Vector Embedder" },
      { step: "Updating index...", progress: 90, agent: "Vector Embedder" },
      { step: "Completed", progress: 100, agent: "System" }
    ];

    let currentIndex = 0;

    const updateStep = () => {
      if (currentIndex < steps.length) {
        const current = steps[currentIndex];
        setProcessingStatus({
          isProcessing: currentIndex < steps.length - 1,
          currentStep: current.step,
          progress: current.progress,
          activeAgent: current.agent
        });
        currentIndex++;
        
        if (currentIndex < steps.length) {
          setTimeout(updateStep, 2000);
        }
      }
    };

    setTimeout(updateStep, 1000);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!youtubeUrl.trim()) return;
    
    processVideoMutation.mutate(youtubeUrl);
  };

  const getStepIcon = (step: string) => {
    if (step.includes("transcript")) return "🎬";
    if (step.includes("chunk")) return "✂️";
    if (step.includes("embedding")) return "🧠";
    if (step.includes("index")) return "📊";
    return "✅";
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Video className="w-5 h-5 text-primary" />
          <span>YouTube Video Processing</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="youtube-url">YouTube URL</Label>
            <div className="flex space-x-2 mt-2">
              <Input
                id="youtube-url"
                type="url"
                placeholder="https://www.youtube.com/watch?v=..."
                value={youtubeUrl}
                onChange={(e) => setYoutubeUrl(e.target.value)}
                disabled={processingStatus.isProcessing}
                className="flex-1"
              />
              <Button 
                type="submit" 
                disabled={!youtubeUrl.trim() || processingStatus.isProcessing}
              >
                <Play className="w-4 h-4 mr-2" />
                Process
              </Button>
            </div>
          </div>

          {processingStatus.isProcessing && (
            <Card className="bg-neutral-50">
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-neutral-700">Processing Video</span>
                  <span className="text-xs text-neutral-500">
                    {getStepIcon(processingStatus.currentStep)} {processingStatus.currentStep}
                  </span>
                </div>
                <Progress value={processingStatus.progress} className="mb-2" />
                <div className="flex items-center justify-between text-xs text-neutral-500">
                  <span>Agent Status:</span>
                  <Badge variant="secondary" className="text-secondary">
                    {processingStatus.activeAgent}
                  </Badge>
                </div>
              </CardContent>
            </Card>
          )}
        </form>
      </CardContent>
    </Card>
  );
}
