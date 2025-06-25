import { useState } from "react";
import { Search, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useMutation } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

interface QueryInterfaceProps {
  onQuerySelect: (query: any) => void;
}

export default function QueryInterface({ onQuerySelect }: QueryInterfaceProps) {
  const [question, setQuestion] = useState("");
  const { toast } = useToast();

  const suggestedQueries = [
    "What is vibe coding and how does it relate to AI development?",
    "How are graph neural networks used in biological research?",
    "What are the latest developments in AI agents?",
    "Explain the role of variational autoencoders in machine learning",
    "What quantum effects Babcock describes in biology?"
  ];

  const submitQueryMutation = useMutation({
    mutationFn: async (question: string) => {
      const response = await apiRequest("POST", "/api/query", { question });
      return response.json();
    },
    onSuccess: (data) => {
      onQuerySelect(data);
      setQuestion("");
      
      toast({
        title: "Query Processed",
        description: "AI response generated successfully.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Query Failed",
        description: error.message || "Failed to process query. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!question.trim()) return;
    
    submitQueryMutation.mutate(question);
  };

  const handleSuggestedQuery = (suggestedQuestion: string) => {
    setQuestion(suggestedQuestion);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Search className="w-5 h-5 text-primary" />
          <span>Intelligent Query System</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="question">Ask a question about the video content</Label>
            <div className="relative mt-2">
              <Textarea
                id="question"
                rows={3}
                placeholder="What is vibe coding and how does it relate to AI development?"
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                disabled={submitQueryMutation.isPending}
                className="resize-none pr-16"
              />
              <Button
                type="submit"
                size="sm"
                disabled={!question.trim() || submitQueryMutation.isPending}
                className="absolute bottom-3 right-3"
              >
                <Send className="w-4 h-4 mr-1" />
                Ask
              </Button>
            </div>
          </div>

          <div className="flex flex-wrap gap-2 items-center">
            <span className="text-xs text-neutral-500">Suggested queries:</span>
            {suggestedQueries.map((query, index) => (
              <Badge
                key={index}
                variant="outline"
                className="cursor-pointer hover:bg-neutral-100"
                onClick={() => handleSuggestedQuery(query)}
              >
                {query}
              </Badge>
            ))}
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
