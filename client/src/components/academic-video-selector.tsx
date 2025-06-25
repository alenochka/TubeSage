import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Loader2, Search, Play, GraduationCap, Star } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface AcademicVideo {
  title: string;
  youtube_id: string;
  source: string;
  description: string;
  duration: string;
  academic_score: number;
  university: string;
  final_score: number;
}

interface AcademicVideoSelectorProps {
  onVideosSelected: (videos: AcademicVideo[]) => void;
  onClose: () => void;
}

export default function AcademicVideoSelector({ onVideosSelected, onClose }: AcademicVideoSelectorProps) {
  const [topic, setTopic] = useState("");
  const [field, setField] = useState("");
  const [level, setLevel] = useState("graduate");
  const [isSearching, setIsSearching] = useState(false);
  const [academicVideos, setAcademicVideos] = useState<AcademicVideo[]>([]);
  const [selectedVideos, setSelectedVideos] = useState<Set<string>>(new Set());
  const { toast } = useToast();

  const searchAcademicContent = async () => {
    if (!topic.trim() || !field.trim()) {
      toast({
        title: "Missing Information",
        description: "Please enter both topic and field",
        variant: "destructive"
      });
      return;
    }

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
      
      if (result.success && result.academic_videos) {
        setAcademicVideos(result.academic_videos);
        toast({
          title: "Academic Content Found",
          description: `Found ${result.academic_videos.length} high-quality academic videos`
        });
      } else {
        toast({
          title: "No Content Found",
          description: "No academic videos found for this topic",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('Academic search error:', error);
      toast({
        title: "Search Failed",
        description: "Failed to search academic content",
        variant: "destructive"
      });
    } finally {
      setIsSearching(false);
    }
  };

  const toggleVideoSelection = (videoId: string) => {
    const newSelected = new Set(selectedVideos);
    if (newSelected.has(videoId)) {
      newSelected.delete(videoId);
    } else {
      newSelected.add(videoId);
    }
    setSelectedVideos(newSelected);
  };

  const handleSelectVideos = () => {
    const selected = academicVideos.filter(video => selectedVideos.has(video.youtube_id));
    onVideosSelected(selected);
  };

  const getUniversityColor = (university: string) => {
    const colors: Record<string, string> = {
      'MIT': 'bg-red-100 text-red-800',
      'Stanford': 'bg-red-100 text-red-900',
      'Harvard': 'bg-red-100 text-red-900',
      'CMU': 'bg-blue-100 text-blue-800',
      'University of Toronto': 'bg-blue-100 text-blue-800'
    };
    return colors[university] || 'bg-gray-100 text-gray-800';
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <GraduationCap className="w-5 h-5" />
            Academic Video Search
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="topic">Topic</Label>
              <Input
                id="topic"
                placeholder="e.g., Machine Learning"
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="field">Field</Label>
              <Input
                id="field"
                placeholder="e.g., Computer Science"
                value={field}
                onChange={(e) => setField(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="level">Academic Level</Label>
              <Select value={level} onValueChange={setLevel}>
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
          </div>
          
          <div className="flex gap-2">
            <Button 
              onClick={searchAcademicContent} 
              disabled={isSearching}
              className="flex items-center gap-2"
            >
              {isSearching ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Search className="w-4 h-4" />
              )}
              Search Academic Content
            </Button>
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
          </div>
        </CardContent>
      </Card>

      {academicVideos.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Academic Videos Found ({academicVideos.length})</CardTitle>
            <div className="flex gap-2">
              <Button 
                onClick={handleSelectVideos}
                disabled={selectedVideos.size === 0}
                className="flex items-center gap-2"
              >
                Add Selected Videos ({selectedVideos.size})
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4 max-h-96 overflow-y-auto">
              {academicVideos.map((video) => (
                <div
                  key={video.youtube_id}
                  className="border rounded-lg p-4 space-y-3"
                >
                  <div className="flex items-start gap-3">
                    <Checkbox
                      checked={selectedVideos.has(video.youtube_id)}
                      onCheckedChange={() => toggleVideoSelection(video.youtube_id)}
                    />
                    <div className="flex-1 space-y-2">
                      <div className="flex items-start justify-between">
                        <h4 className="font-medium text-sm line-clamp-2">
                          {video.title}
                        </h4>
                        <div className="flex items-center gap-1 ml-2">
                          <Star className="w-3 h-3 text-yellow-500" />
                          <span className="text-xs text-muted-foreground">
                            {Math.round(video.final_score * 100)}%
                          </span>
                        </div>
                      </div>
                      
                      <p className="text-xs text-muted-foreground line-clamp-2">
                        {video.description}
                      </p>
                      
                      <div className="flex items-center gap-2 flex-wrap">
                        <Badge className={getUniversityColor(video.university)}>
                          {video.university}
                        </Badge>
                        <Badge variant="secondary" className="text-xs">
                          {video.duration}
                        </Badge>
                        <Badge variant="outline" className="text-xs">
                          Academic Score: {Math.round(video.academic_score * 100)}%
                        </Badge>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => window.open(`https://www.youtube.com/watch?v=${video.youtube_id}`, '_blank')}
                          className="flex items-center gap-1"
                        >
                          <Play className="w-3 h-3" />
                          Preview
                        </Button>
                        <span className="text-xs text-muted-foreground">
                          Source: {video.source}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}