import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { BookOpen, Clock, Video, Users, Search, Filter } from "lucide-react";

interface CourseLibraryProps {
  onCourseSelect?: (course: any) => void;
}

export default function CourseLibrary({ onCourseSelect }: CourseLibraryProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [levelFilter, setLevelFilter] = useState<string>("all");
  const [fieldFilter, setFieldFilter] = useState<string>("all");

  const { data: courses = [], isLoading } = useQuery({
    queryKey: ['/api/courses'],
  });

  const filteredCourses = courses.filter((course: any) => {
    const matchesSearch = course.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         course.topic.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         course.field.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesLevel = levelFilter === "all" || course.level === levelFilter;
    const matchesField = fieldFilter === "all" || course.field.toLowerCase().includes(fieldFilter.toLowerCase());
    
    return matchesSearch && matchesLevel && matchesField;
  });

  const getLevelColor = (level: string) => {
    switch (level) {
      case "undergraduate": return "bg-green-100 text-green-800";
      case "graduate": return "bg-blue-100 text-blue-800";
      case "doctoral": return "bg-purple-100 text-purple-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "published": return "bg-green-100 text-green-800";
      case "draft": return "bg-yellow-100 text-yellow-800";
      case "archived": return "bg-gray-100 text-gray-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center">Loading courses...</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <BookOpen className="w-5 h-5 text-primary" />
            <span>Course Library</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3 top-3 text-muted-foreground" />
                <Input
                  placeholder="Search courses..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div className="flex gap-2">
              <Select value={levelFilter} onValueChange={setLevelFilter}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="All Levels" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Levels</SelectItem>
                  <SelectItem value="undergraduate">Undergraduate</SelectItem>
                  <SelectItem value="graduate">Graduate</SelectItem>
                  <SelectItem value="doctoral">Doctoral</SelectItem>
                </SelectContent>
              </Select>
              <Select value={fieldFilter} onValueChange={setFieldFilter}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="All Fields" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Fields</SelectItem>
                  <SelectItem value="computer science">Computer Science</SelectItem>
                  <SelectItem value="physics">Physics</SelectItem>
                  <SelectItem value="biology">Biology</SelectItem>
                  <SelectItem value="mathematics">Mathematics</SelectItem>
                  <SelectItem value="engineering">Engineering</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4">
        {filteredCourses.length === 0 ? (
          <Card>
            <CardContent className="p-6 text-center">
              <p className="text-muted-foreground">
                {courses.length === 0 
                  ? "No courses available yet. Create your first course!" 
                  : "No courses match your filters."}
              </p>
            </CardContent>
          </Card>
        ) : (
          filteredCourses.map((course: any) => (
            <Card key={course.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h3 className="text-lg font-semibold">{course.title}</h3>
                        <p className="text-muted-foreground mt-1">{course.topic} • {course.field}</p>
                      </div>
                      <div className="flex gap-2">
                        <Badge className={getLevelColor(course.level)}>
                          {course.level}
                        </Badge>
                        <Badge className={getStatusColor(course.status)}>
                          {course.status}
                        </Badge>
                      </div>
                    </div>

                    {course.description && (
                      <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
                        {course.description}
                      </p>
                    )}

                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <Video className="w-4 h-4" />
                        <span>{course.videoCount} lectures</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Clock className="w-4 h-4" />
                        <span>{course.totalDuration}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Users className="w-4 h-4" />
                        <span>Created {new Date(course.createdAt).toLocaleDateString()}</span>
                      </div>
                    </div>

                    {course.prerequisites && course.prerequisites.length > 0 && (
                      <div className="mt-3">
                        <p className="text-sm font-medium mb-1">Prerequisites:</p>
                        <div className="flex flex-wrap gap-1">
                          {course.prerequisites.slice(0, 3).map((prereq: string, index: number) => (
                            <Badge key={index} variant="outline" className="text-xs">
                              {prereq}
                            </Badge>
                          ))}
                          {course.prerequisites.length > 3 && (
                            <Badge variant="outline" className="text-xs">
                              +{course.prerequisites.length - 3} more
                            </Badge>
                          )}
                        </div>
                      </div>
                    )}

                    {course.learningOutcomes && course.learningOutcomes.length > 0 && (
                      <div className="mt-3">
                        <p className="text-sm font-medium mb-1">Learning Outcomes:</p>
                        <ul className="text-sm text-muted-foreground list-disc list-inside">
                          {course.learningOutcomes.slice(0, 2).map((outcome: string, index: number) => (
                            <li key={index} className="truncate">{outcome}</li>
                          ))}
                          {course.learningOutcomes.length > 2 && (
                            <li className="text-xs">+{course.learningOutcomes.length - 2} more outcomes</li>
                          )}
                        </ul>
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex justify-end mt-4">
                  <Button
                    onClick={() => onCourseSelect && onCourseSelect(course)}
                    variant="outline"
                  >
                    View Course
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}