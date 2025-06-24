import { Brain, Clock, ExternalLink } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

interface ResultsDisplayProps {
  query: any;
}

export default function ResultsDisplay({ query }: ResultsDisplayProps) {
  if (!query) return null;

  const formatResponseTime = (ms: number) => {
    return ms < 1000 ? `${ms}ms` : `${(ms / 1000).toFixed(1)}s`;
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 80) return "text-green-600";
    if (confidence >= 60) return "text-yellow-600";
    return "text-red-600";
  };

  const getRelevanceColor = (relevance: string) => {
    switch (relevance.toLowerCase()) {
      case "very high":
      case "high":
        return "text-green-600";
      case "medium":
        return "text-yellow-600";
      default:
        return "text-red-600";
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center space-x-2">
            <Brain className="w-5 h-5 text-primary" />
            <span>AI Response</span>
          </CardTitle>
          <div className="flex items-center space-x-2 text-xs text-neutral-500">
            <Clock className="w-4 h-4" />
            <span>{formatResponseTime(query.responseTime || 2300)}</span>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {query.response && (
          <div className="prose max-w-none">
            <div className="bg-gradient-to-r from-primary/5 to-secondary/5 rounded-lg p-4">
              <div className="text-neutral-700 leading-relaxed whitespace-pre-wrap">
                {query.response}
              </div>
            </div>
          </div>
        )}

        {query.sourceContexts && query.sourceContexts.length > 0 && (
          <div className="border-t pt-4">
            <h3 className="text-sm font-semibold text-neutral-700 mb-3">Source Context</h3>
            <div className="space-y-3">
              {query.sourceContexts.map((context: any, index: number) => (
                <div key={index} className="bg-neutral-50 rounded-lg p-3 border-l-4 border-primary">
                  <div className="flex items-start justify-between mb-2">
                    <div className="text-sm font-medium text-neutral-800">
                      {context.videoTitle}
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className="text-xs text-neutral-500">{context.timestamp}</span>
                      <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                        <ExternalLink className="w-3 h-3" />
                      </Button>
                    </div>
                  </div>
                  <p className="text-sm text-neutral-600 mb-2">
                    {context.excerpt}
                  </p>
                  <div className="flex items-center space-x-4 text-xs text-neutral-500">
                    <span>
                      Confidence: 
                      <span className={`font-medium ml-1 ${getConfidenceColor(context.confidence)}`}>
                        {context.confidence}%
                      </span>
                    </span>
                    <span>
                      Relevance: 
                      <span className={`font-medium ml-1 ${getRelevanceColor(context.relevance)}`}>
                        {context.relevance}
                      </span>
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {query.confidence && (
          <div className="flex items-center justify-between text-sm">
            <span className="text-neutral-600">Overall Confidence:</span>
            <Badge 
              variant="secondary" 
              className={getConfidenceColor(query.confidence)}
            >
              {query.confidence}%
            </Badge>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
