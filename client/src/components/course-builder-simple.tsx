import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { GraduationCap, Search, Video, BookOpen } from "lucide-react";

interface CourseBuilderProps {
  onCourseCreated?: (course: any) => void;
}

export default function CourseBuilderSimple({ onCourseCreated }: CourseBuilderProps) {
  const [topic, setTopic] = useState("");
  const [field, setField] = useState("");
  const [level, setLevel] = useState<"undergraduate" | "graduate" | "doctoral">("graduate");
  const [videoCount, setVideoCount] = useState(6);
  
  const [isSearching, setIsSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [showResults, setShowResults] = useState(false);
  
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationProgress, setGenerationProgress] = useState(0);
  
  const { toast } = useToast();

  const handleSearch = async () => {
    if (!topic || !field) {
      toast({
        title: "Missing Information",
        description: "Please enter both topic and field",
        variant: "destructive"
      });
      return;
    }

    setIsSearching(true);
    
    try {
      const response = await fetch('/api/courses/search', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          topic,
          field,
          level,
          videoCount,
          focusAreas: []
        })
      });
      
      if (!response.ok) {
        throw new Error(`Search failed: ${response.statusText}`);
      }
      
      const data = await response.json();
      setSearchResults(data.videos || []);
      setShowResults(true);
      
      toast({
        title: "Videos Found",
        description: `Found ${data.videos?.length || 0} relevant videos for your course.`
      });
    } catch (error: any) {
      console.error("Search error:", error);
      toast({
        title: "Search Failed",
        description: error.message || "Failed to search for videos",
        variant: "destructive"
      });
    } finally {
      setIsSearching(false);
    }
  };

  const handleGenerateCourse = async () => {
    if (searchResults.length === 0) {
      toast({
        title: "No Videos Selected",
        description: "Please search for videos first",
        variant: "destructive"
      });
      return;
    }

    setIsGenerating(true);
    setGenerationProgress(0);

    // Simulate progress
    const progressSteps = [25, 50, 75, 90];
    let currentStep = 0;
    
    const updateProgress = () => {
      if (currentStep < progressSteps.length) {
        setGenerationProgress(progressSteps[currentStep]);
        currentStep++;
        setTimeout(updateProgress, 1000);
      }
    };
    
    updateProgress();

    try {
      const courseData = {
        title: `${topic} in ${field}`,
        topic,
        field,
        level,
        description: `A comprehensive ${level}-level course on ${topic} in ${field}`,
        prerequisites: [],
        learningOutcomes: [],
        videos: searchResults
      };

      const response = await fetch('/api/courses/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(courseData)
      });
      
      if (!response.ok) {
        throw new Error(`Course generation failed: ${response.statusText}`);
      }
      
      const data = await response.json();
      
      setGenerationProgress(100);
      
      toast({
        title: "Course Generated Successfully",
        description: `${data.title} has been created with ${data.modules?.length || 0} modules.`
      });
      
      onCourseCreated?.(data);
      
      // Reset form after success
      setTimeout(() => {
        setTopic("");
        setField("");
        setLevel("graduate");
        setVideoCount(6);
        setSearchResults([]);
        setShowResults(false);
        setIsGenerating(false);
        setGenerationProgress(0);
      }, 2000);
      
    } catch (error: any) {
      console.error("Generation error:", error);
      setIsGenerating(false);
      setGenerationProgress(0);
      
      toast({
        title: "Course Generation Failed",
        description: error.message || "Failed to generate course",
        variant: "destructive"
      });
    }
  };

  const resetSearch = () => {
    setSearchResults([]);
    setShowResults(false);
    setIsGenerating(false);
    setGenerationProgress(0);
  };

  const searchAcademicContent = async () => {
    setIsSearching(true);
    
    try {
      const response = await fetch('/api/academic/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ topic, field, level })
      });

      if (!response.ok) {
        throw new Error('Academic search failed');
      }

      const result = await response.json();
      
      if (result.success && result.academic_videos && result.academic_videos.length > 0) {
        const academicResults = result.academic_videos.map((video: any) => ({
          youtubeId: video.youtube_id,
          title: video.title,
          duration: video.duration,
          channelTitle: video.source,
          publishedAt: new Date().toISOString(),
          relevanceScore: video.final_score,
          theoreticalDepth: video.academic_score,
          practicalValue: video.academic_score,
          keyTopics: [topic, field],
          field: field.toLowerCase(),
          isAcademic: true,
          university: video.university
        }));
        
        console.log('Academic search results:', academicResults);
        setSearchResults(academicResults);
        setShowResults(true);
        
        toast({
          title: "Academic Content Found",
          description: `Found ${academicResults.length} high-quality academic videos from universities`
        });
      } else {
        toast({
          title: "No Academic Content Found", 
          description: "No academic videos found for this topic",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('Academic search error:', error);
      toast({
        title: "Search Failed",
        description: "Academic search is not yet available. Using regular YouTube search instead.",
        variant: "destructive"
      });
      await handleSearch();
    } finally {
      setIsSearching(false);
    }
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
          {!showResults ? (
            // Search Form
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="topic">Course Topic</Label>
                  <Input
                    id="topic"
                    placeholder="e.g., Machine Learning, Quantum Computing"
                    value={topic}
                    onChange={(e) => setTopic(e.target.value)}
                    disabled={isSearching}
                  />
                </div>
                <div>
                  <Label htmlFor="field">Academic Field</Label>
                  <Input
                    id="field"
                    placeholder="e.g., Computer Science, Physics"
                    value={field}
                    onChange={(e) => setField(e.target.value)}
                    disabled={isSearching}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="level">Academic Level</Label>
                  <select 
                    value={level} 
                    onChange={(e) => setLevel(e.target.value as any)}
                    disabled={isSearching}
                    className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <option value="undergraduate">Undergraduate</option>
                    <option value="graduate">Graduate</option>
                    <option value="doctoral">Doctoral</option>
                  </select>
                </div>
                <div>
                  <Label htmlFor="videoCount">Number of Videos</Label>
                  <Input
                    id="videoCount"
                    type="number"
                    min="3"
                    max="12"
                    value={videoCount}
                    onChange={(e) => setVideoCount(parseInt(e.target.value) || 6)}
                    disabled={isSearching}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Button 
                  onClick={handleSearch} 
                  disabled={isSearching || !topic || !field}
                  className="w-full"
                >
                  {isSearching ? (
                    <>
                      <Search className="w-4 h-4 mr-2 animate-spin" />
                      Searching YouTube...
                    </>
                  ) : (
                    <>
                      <Search className="w-4 h-4 mr-2" />
                      Search for Videos
                    </>
                  )}
                </Button>
                
                <Button 
                  onClick={searchAcademicContent}
                  variant="outline"
                  disabled={isSearching || !topic || !field}
                  className="w-full"
                >
                  <GraduationCap className="w-4 h-4 mr-2" />
                  Search Academic Sources
                </Button>
              </div>
            </>
          ) : (
            // Results and Generation
            <>
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-medium">
                  Found {searchResults.length} Videos
                  {searchResults.some((v: any) => v.isAcademic) && 
                    <Badge className="ml-2 bg-blue-100 text-blue-800">Academic</Badge>
                  }
                </h3>
                <Button variant="outline" onClick={resetSearch} disabled={isGenerating}>
                  New Search
                </Button>
              </div>

              {/* Video Results */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-60 overflow-y-auto">
                {searchResults.map((video: any, index: number) => (
                  <div key={index} className="border rounded-lg p-3">
                    <div className="flex items-start gap-3">
                      <Video className="w-4 h-4 text-primary mt-1 flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <h4 className="font-medium text-sm line-clamp-2">
                          {video.title}
                        </h4>
                        <p className="text-xs text-muted-foreground mt-1">
                          {video.channelTitle} • {video.duration}
                        </p>
                        {video.university && 
                          <Badge className="mt-1 text-xs bg-green-100 text-green-800">
                            {video.university}
                          </Badge>
                        }
                        <div className="mt-1 flex items-center gap-2">
                          {video.relevanceScore && (
                            <Badge variant="secondary" className="text-xs">
                              {Math.round(video.relevanceScore * 100)}% relevant
                            </Badge>
                          )}
                          <a 
                            href={`https://www.youtube.com/watch?v=${video.youtubeId}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs text-blue-600 hover:text-blue-800 underline"
                          >
                            Watch on YouTube
                          </a>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Generation Progress */}
              {isGenerating && (
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Generating course structure...</span>
                    <span>{generationProgress}%</span>
                  </div>
                  <Progress value={generationProgress} className="h-2" />
                </div>
              )}

              {/* Generate Button */}
              <Button 
                onClick={handleGenerateCourse} 
                disabled={isGenerating}
                className="w-full"
              >
                {isGenerating ? (
                  <>
                    <BookOpen className="w-4 h-4 mr-2 animate-pulse" />
                    Generating Course...
                  </>
                ) : (
                  <>
                    <BookOpen className="w-4 h-4 mr-2" />
                    Generate Graduate Course
                  </>
                )}
              </Button>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}