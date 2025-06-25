import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { BookOpen, Video, Clock, Users, ChevronDown, ChevronRight, Play, CheckCircle } from "lucide-react";

interface CourseViewerProps {
  courseId: number;
  onBack?: () => void;
}

export default function CourseViewer({ courseId, onBack }: CourseViewerProps) {
  const [openModules, setOpenModules] = useState<number[]>([]);
  const [completedLectures, setCompletedLectures] = useState<number[]>([]);

  const { data: course, isLoading } = useQuery({
    queryKey: [`/api/courses/${courseId}`],
  });

  const toggleModule = (moduleId: number) => {
    setOpenModules(prev => 
      prev.includes(moduleId) 
        ? prev.filter(id => id !== moduleId)
        : [...prev, moduleId]
    );
  };

  const toggleLectureComplete = (lectureId: number) => {
    setCompletedLectures(prev => 
      prev.includes(lectureId) 
        ? prev.filter(id => id !== lectureId)
        : [...prev, lectureId]
    );
  };

  const calculateProgress = () => {
    if (!course?.modules) return 0;
    const totalLectures = course.modules.reduce((total: number, module: any) => 
      total + (module.lectures?.length || 0), 0);
    return totalLectures > 0 ? (completedLectures.length / totalLectures) * 100 : 0;
  };

  const getLevelColor = (level: string) => {
    switch (level) {
      case "undergraduate": return "bg-green-100 text-green-800";
      case "graduate": return "bg-blue-100 text-blue-800";
      case "doctoral": return "bg-purple-100 text-purple-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center">Loading course...</div>
        </CardContent>
      </Card>
    );
  }

  if (!course) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center">Course not found</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Course Header */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-start">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <BookOpen className="w-6 h-6 text-primary" />
                <h1 className="text-2xl font-bold">{course.title}</h1>
                {onBack && (
                  <Button variant="outline" size="sm" onClick={onBack}>
                    Back to Library
                  </Button>
                )}
              </div>
              <p className="text-muted-foreground mb-4">{course.description}</p>
              
              <div className="flex items-center gap-4 mb-4">
                <Badge className={getLevelColor(course.level)}>
                  {course.level}
                </Badge>
                <span className="text-sm text-muted-foreground">{course.field}</span>
                <div className="flex items-center gap-1">
                  <Video className="w-4 h-4" />
                  <span className="text-sm">{course.videoCount} lectures</span>
                </div>
                <div className="flex items-center gap-1">
                  <Clock className="w-4 h-4" />
                  <span className="text-sm">{course.totalDuration}</span>
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Progress</span>
                  <span>{Math.round(calculateProgress())}%</span>
                </div>
                <Progress value={calculateProgress()} className="h-2" />
              </div>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Prerequisites */}
      {course.prerequisites && course.prerequisites.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Prerequisites</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {course.prerequisites.map((prereq: string, index: number) => (
                <Badge key={index} variant="outline">
                  {prereq}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Learning Outcomes */}
      {course.learningOutcomes && course.learningOutcomes.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Learning Outcomes</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {course.learningOutcomes.map((outcome: string, index: number) => (
                <li key={index} className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                  <span className="text-sm">{outcome}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      {/* Course Modules */}
      <div className="space-y-4">
        {course.modules?.map((module: any, moduleIndex: number) => (
          <Card key={module.id}>
            <Collapsible
              open={openModules.includes(module.id)}
              onOpenChange={() => toggleModule(module.id)}
            >
              <CollapsibleTrigger asChild>
                <CardHeader className="cursor-pointer hover:bg-muted/50">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      {openModules.includes(module.id) ? (
                        <ChevronDown className="w-4 h-4" />
                      ) : (
                        <ChevronRight className="w-4 h-4" />
                      )}
                      <div>
                        <CardTitle className="text-lg">
                          Module {moduleIndex + 1}: {module.title}
                        </CardTitle>
                        <p className="text-sm text-muted-foreground mt-1">
                          {module.description}
                        </p>
                      </div>
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {module.lectures?.length || 0} lectures
                    </div>
                  </div>
                </CardHeader>
              </CollapsibleTrigger>

              <CollapsibleContent>
                <CardContent className="pt-0">
                  {/* Module Objectives */}
                  {module.objectives && module.objectives.length > 0 && (
                    <div className="mb-4 p-3 bg-muted/30 rounded-lg">
                      <h4 className="font-medium text-sm mb-2">Learning Objectives:</h4>
                      <ul className="text-sm space-y-1">
                        {module.objectives.map((objective: string, index: number) => (
                          <li key={index} className="flex items-start gap-2">
                            <span className="w-1 h-1 bg-primary rounded-full mt-2 flex-shrink-0" />
                            {objective}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Lectures */}
                  <div className="space-y-3">
                    {module.lectures?.map((lecture: any, lectureIndex: number) => (
                      <div key={lecture.id} className="border rounded-lg p-4">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => toggleLectureComplete(lecture.id)}
                                className={completedLectures.includes(lecture.id) ? "bg-green-100" : ""}
                              >
                                {completedLectures.includes(lecture.id) ? (
                                  <CheckCircle className="w-4 h-4" />
                                ) : (
                                  <Play className="w-4 h-4" />
                                )}
                              </Button>
                              <h5 className="font-medium">
                                Lecture {lectureIndex + 1}: {lecture.title}
                              </h5>
                            </div>

                            {lecture.keyTopics && lecture.keyTopics.length > 0 && (
                              <div className="mb-2">
                                <span className="text-xs text-muted-foreground">Key Topics: </span>
                                <div className="flex flex-wrap gap-1 mt-1">
                                  {lecture.keyTopics.slice(0, 4).map((topic: string, index: number) => (
                                    <Badge key={index} variant="secondary" className="text-xs">
                                      {topic}
                                    </Badge>
                                  ))}
                                </div>
                              </div>
                            )}

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs text-muted-foreground">
                              {lecture.theoreticalConcepts && lecture.theoreticalConcepts.length > 0 && (
                                <div>
                                  <span className="font-medium">Theory:</span>
                                  <ul className="mt-1 space-y-1">
                                    {lecture.theoreticalConcepts.slice(0, 2).map((concept: string, index: number) => (
                                      <li key={index}>• {concept}</li>
                                    ))}
                                  </ul>
                                </div>
                              )}

                              {lecture.practicalApplications && lecture.practicalApplications.length > 0 && (
                                <div>
                                  <span className="font-medium">Applications:</span>
                                  <ul className="mt-1 space-y-1">
                                    {lecture.practicalApplications.slice(0, 2).map((app: string, index: number) => (
                                      <li key={index}>• {app}</li>
                                    ))}
                                  </ul>
                                </div>
                              )}
                            </div>
                          </div>

                          <div className="text-right ml-4">
                            <div className="text-sm font-medium">
                              Relevance: {Math.round((lecture.relevanceScore || 0) * 100)}%
                            </div>
                            <Button
                              variant="outline"
                              size="sm"
                              className="mt-2"
                              onClick={() => {
                                // Use the actual YouTube ID from the joined data
                                const youtubeId = (lecture as any).youtubeId;
                                if (youtubeId) {
                                  window.open(`https://www.youtube.com/watch?v=${youtubeId}`, '_blank');
                                } else {
                                  console.error('No YouTube ID found for lecture:', lecture);
                                }
                              }}
                            >
                              Watch Video
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </CollapsibleContent>
            </Collapsible>
          </Card>
        ))}
      </div>
    </div>
  );
}