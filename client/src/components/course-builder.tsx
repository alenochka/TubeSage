import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { useMutation, useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { GraduationCap, Search, Video, BookOpen, Clock, Users } from "lucide-react";

interface CourseBuilderProps {
  onCourseCreated?: (course: any) => void;
}

interface SearchResult {
  youtubeId: string;
  title: string;
  duration: string;
  relevanceScore: number;
  theoreticalDepth: number;
  practicalValue: number;
  keyTopics: string[];
  channelTitle: string;
  publishedAt: string;
}

interface SearchStatus {
  isSearching: boolean;
  currentStep: string;
  progress: number;
  videosFound: number;
}

export default function CourseBuilder({ onCourseCreated }: CourseBuilderProps) {
  const [topic, setTopic] = useState("");
  const [field, setField] = useState("");
  const [level, setLevel] = useState<"undergraduate" | "graduate" | "doctoral">("graduate");
  const [videoCount, setVideoCount] = useState(8);
  const [focusAreas, setFocusAreas] = useState<string[]>([]);
  const [newFocusArea, setNewFocusArea] = useState("");
  
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [searchStatus, setSearchStatus] = useState<SearchStatus>({
    isSearching: false,
    currentStep: "Ready",
    progress: 0,
    videosFound: 0
  });

  const [courseGeneration, setCourseGeneration] = useState({
    isGenerating: false,
    currentStep: "",
    progress: 0
  });

  const { toast } = useToast();

  const searchVideosMutation = useMutation({
    mutationFn: async (searchData: any) => {
      return await apiRequest(`/api/courses/search`, {
        method: "POST",
        body: JSON.stringify(searchData)
      });
    },
    onSuccess: (data) => {
      setSearchResults(data.videos || []);
      setSearchStatus({
        isSearching: false,
        currentStep: "Search Complete",
        progress: 100,
        videosFound: data.videos?.length || 0
      });
      toast({
        title: "Video Search Complete",
        description: `Found ${data.videos?.length || 0} relevant videos for ${topic}`,
      });
    },
    onError: (error: any) => {
      setSearchStatus({
        isSearching: false,
        currentStep: "Error",
        progress: 0,
        videosFound: 0
      });
      toast({
        title: "Search Failed",
        description: error.message || "Failed to search for videos",
        variant: "destructive",
      });
    },
  });

  const generateCourseMutation = useMutation({
    mutationFn: async (courseData: any) => {
      return await apiRequest(`/api/courses/generate`, {
        method: "POST",
        body: JSON.stringify(courseData)
      });
    },
    onSuccess: (data) => {
      setCourseGeneration({
        isGenerating: false,
        currentStep: "Course Generated",
        progress: 100
      });
      toast({
        title: "Course Generated Successfully",
        description: `Created "${data.title}" with ${data.modules?.length || 0} modules`,
      });
      if (onCourseCreated) {
        onCourseCreated(data);
      }
    },
    onError: (error: any) => {
      setCourseGeneration({
        isGenerating: false,
        currentStep: "Error",
        progress: 0
      });
      toast({
        title: "Course Generation Failed",
        description: error.message || "Failed to generate course",
        variant: "destructive",
      });
    },
  });

  const handleSearch = () => {
    if (!topic.trim() || !field.trim()) {
      toast({
        title: "Missing Information",
        description: "Please enter both topic and academic field",
        variant: "destructive",
      });
      return;
    }

    setSearchStatus({
      isSearching: true,
      currentStep: "Searching YouTube...",
      progress: 20,
      videosFound: 0
    });

    // Simulate progressive search steps
    const steps = [
      { step: "Analyzing topic keywords...", progress: 40 },
      { step: "Filtering by academic quality...", progress: 60 },
      { step: "Ranking by relevance...", progress: 80 },
      { step: "Finalizing results...", progress: 90 }
    ];

    let currentIndex = 0;
    const updateStep = () => {
      if (currentIndex < steps.length) {
        setSearchStatus(prev => ({
          ...prev,
          currentStep: steps[currentIndex].step,
          progress: steps[currentIndex].progress
        }));
        currentIndex++;
        setTimeout(updateStep, 1500);
      }
    };

    setTimeout(updateStep, 1000);

    searchVideosMutation.mutate({
      topic,
      field,
      level,
      videoCount,
      focusAreas
    });
  };

  const handleGenerateCourse = () => {
    if (searchResults.length === 0) {
      toast({
        title: "No Videos Selected",
        description: "Please search for videos first",
        variant: "destructive",
      });
      return;
    }

    setCourseGeneration({
      isGenerating: true,
      currentStep: "Analyzing video content...",
      progress: 25
    });

    // Simulate course generation steps
    const steps = [
      { step: "Creating course structure...", progress: 50 },
      { step: "Organizing into modules...", progress: 75 },
      { step: "Generating learning outcomes...", progress: 90 }
    ];

    let currentIndex = 0;
    const updateStep = () => {
      if (currentIndex < steps.length) {
        setCourseGeneration(prev => ({
          ...prev,
          currentStep: steps[currentIndex].step,
          progress: steps[currentIndex].progress
        }));
        currentIndex++;
        setTimeout(updateStep, 2000);
      }
    };

    setTimeout(updateStep, 2000);

    generateCourseMutation.mutate({
      title: `${topic} - ${level.charAt(0).toUpperCase() + level.slice(1)} Course`,
      topic,
      field,
      level,
      description: `A comprehensive ${level}-level course on ${topic} in ${field}`,
      prerequisites: [],
      learningOutcomes: [],
      videos: searchResults
    });
  };

  const addFocusArea = () => {
    if (newFocusArea.trim() && !focusAreas.includes(newFocusArea.trim())) {
      setFocusAreas([...focusAreas, newFocusArea.trim()]);
      setNewFocusArea("");
    }
  };

  const removeFocusArea = (area: string) => {
    setFocusAreas(focusAreas.filter(a => a !== area));
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <GraduationCap className="w-5 h-5 text-primary" />
            <span>Graduate Course Builder</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="topic">Course Topic</Label>
              <Input
                id="topic"
                placeholder="e.g., Quantum Computing, Machine Learning"
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="field">Academic Field</Label>
              <Input
                id="field"
                placeholder="e.g., Computer Science, Physics"
                value={field}
                onChange={(e) => setField(e.target.value)}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="level">Academic Level</Label>
              <Select value={level} onValueChange={(value: any) => setLevel(value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="undergraduate">Undergraduate</SelectItem>
                  <SelectItem value="graduate">Graduate</SelectItem>
                  <SelectItem value="doctoral">Doctoral</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="videoCount">Number of Videos</Label>
              <Input
                id="videoCount"
                type="number"
                min="5"
                max="15"
                value={videoCount}
                onChange={(e) => setVideoCount(Number(e.target.value))}
              />
            </div>
          </div>

          <div>
            <Label htmlFor="focusAreas">Focus Areas (Optional)</Label>
            <div className="flex space-x-2 mt-2">
              <Input
                id="focusAreas"
                placeholder="e.g., Algorithms, Applications"
                value={newFocusArea}
                onChange={(e) => setNewFocusArea(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && addFocusArea()}
              />
              <Button onClick={addFocusArea} variant="outline">Add</Button>
            </div>
            {focusAreas.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-2">
                {focusAreas.map((area) => (
                  <Badge key={area} variant="secondary" className="cursor-pointer" onClick={() => removeFocusArea(area)}>
                    {area} ×
                  </Badge>
                ))}
              </div>
            )}
          </div>

          <Button 
            onClick={handleSearch} 
            disabled={searchStatus.isSearching}
            className="w-full"
          >
            <Search className="w-4 h-4 mr-2" />
            {searchStatus.isSearching ? "Searching..." : "Search Videos"}
          </Button>

          {searchStatus.isSearching && (
            <div className="space-y-2">
              <Progress value={searchStatus.progress} />
              <p className="text-sm text-muted-foreground text-center">
                {searchStatus.currentStep}
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {searchResults.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span className="flex items-center space-x-2">
                <Video className="w-5 h-5" />
                <span>Found Videos ({searchResults.length})</span>
              </span>
              <Button 
                onClick={handleGenerateCourse}
                disabled={courseGeneration.isGenerating}
              >
                <BookOpen className="w-4 h-4 mr-2" />
                Generate Course
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4">
              {searchResults.map((video, index) => (
                <div key={video.youtubeId} className="border rounded-lg p-4">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <h4 className="font-medium">{video.title}</h4>
                      <p className="text-sm text-muted-foreground mt-1">
                        {video.channelTitle} • {video.duration}
                      </p>
                      <div className="flex flex-wrap gap-1 mt-2">
                        {video.keyTopics.slice(0, 3).map((topic) => (
                          <Badge key={topic} variant="outline" className="text-xs">
                            {topic}
                          </Badge>
                        ))}
                      </div>
                    </div>
                    <div className="text-right space-y-1">
                      <div className="text-sm">
                        <span className="text-muted-foreground">Relevance:</span>
                        <span className="ml-1 font-medium">{Math.round(video.relevanceScore * 100)}%</span>
                      </div>
                      <div className="text-xs text-muted-foreground">
                        Theory: {Math.round(video.theoreticalDepth * 100)}% | 
                        Practice: {Math.round(video.practicalValue * 100)}%
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {courseGeneration.isGenerating && (
              <div className="mt-4 space-y-2">
                <Progress value={courseGeneration.progress} />
                <p className="text-sm text-muted-foreground text-center">
                  {courseGeneration.currentStep}
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}