import { Brain, Clock, ExternalLink, Lightbulb, Search, TrendingUp, Star, ArrowRight, MessageSquare, CheckCircle, AlertCircle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface ResultsDisplayProps {
  query: any;
  onQuerySelect?: (query: string) => void;
}

export default function ResultsDisplay({ query, onQuerySelect }: ResultsDisplayProps) {
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
                      {context.youtubeUrl ? (
                        <a 
                          href={context.youtubeUrl} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-xs text-blue-600 hover:text-blue-800 underline flex items-center space-x-1"
                        >
                          <span>{context.timestamp}</span>
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      ) : (
                        <span className="text-xs text-neutral-500">{context.timestamp}</span>
                      )}
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

        {/* Reflection Section */}
        {query.reflection && (
          <div className="mt-6 p-6 bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-900/20 dark:to-blue-900/20 rounded-lg border border-purple-200 dark:border-purple-700">
            <div className="flex items-center gap-2 mb-4">
              <Brain className="h-5 w-5 text-purple-600 dark:text-purple-400" />
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                AI Reflection & Suggestions
              </h3>
              <div className="ml-auto flex items-center gap-2">
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  Quality Score:
                </div>
                <Badge variant={
                  query.reflection.qualityScore >= 80 ? "default" :
                  query.reflection.qualityScore >= 60 ? "secondary" : "destructive"
                }>
                  {query.reflection.qualityScore}/100
                </Badge>
              </div>
            </div>

            <Tabs defaultValue="suggestions" className="w-full">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="suggestions">Suggestions</TabsTrigger>
                <TabsTrigger value="refined">Refined Queries</TabsTrigger>
                <TabsTrigger value="related">Related Topics</TabsTrigger>
                <TabsTrigger value="analysis">Analysis</TabsTrigger>
              </TabsList>

              <TabsContent value="suggestions" className="mt-4">
                <div className="space-y-4">
                  <div>
                    <h4 className="font-medium text-gray-900 dark:text-gray-100 mb-2">Next Steps</h4>
                    <div className="space-y-2">
                      {query.reflection.nextSteps?.map((step: string, index: number) => (
                        <div key={index} className="flex items-start gap-2 p-3 bg-white dark:bg-gray-800 rounded border">
                          <ArrowRight className="h-4 w-4 text-purple-600 dark:text-purple-400 mt-0.5 flex-shrink-0" />
                          <span className="text-sm text-gray-700 dark:text-gray-300">{step}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div>
                    <h4 className="font-medium text-gray-900 dark:text-gray-100 mb-2">YouTube Search Keywords</h4>
                    <div className="flex flex-wrap gap-2">
                      {query.reflection.searchKeywords?.map((keyword: string, index: number) => (
                        <a
                          key={index}
                          href={`https://www.youtube.com/results?search_query=${encodeURIComponent(keyword)}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 px-3 py-1 bg-red-100 hover:bg-red-200 dark:bg-red-900/20 dark:hover:bg-red-800/30 text-red-800 dark:text-red-400 rounded-full text-sm transition-colors"
                        >
                          <Search className="h-3 w-3" />
                          {keyword}
                          <ExternalLink className="h-3 w-3" />
                        </a>
                      ))}
                    </div>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="refined" className="mt-4">
                <div className="space-y-3">
                  <h4 className="font-medium text-gray-900 dark:text-gray-100">Try these more specific questions:</h4>
                  {query.reflection.refinedQueries?.map((refinedQuery: string, index: number) => (
                    <Button
                      key={index}
                      variant="outline"
                      className="w-full justify-start h-auto p-3"
                      onClick={() => {
                        if (onQuerySelect) {
                          onQuerySelect(refinedQuery);
                        }
                      }}
                    >
                      <div className="flex items-start gap-2">
                        <MessageSquare className="h-4 w-4 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
                        <span className="text-sm text-left">{refinedQuery}</span>
                      </div>
                    </Button>
                  ))}
                </div>
              </TabsContent>

              <TabsContent value="related" className="mt-4">
                <div className="space-y-3">
                  <h4 className="font-medium text-gray-900 dark:text-gray-100">Explore related topics:</h4>
                  {query.reflection.relatedQueries?.map((relatedQuery: string, index: number) => (
                    <Button
                      key={index}
                      variant="outline"
                      className="w-full justify-start h-auto p-3"
                      onClick={() => {
                        if (onQuerySelect) {
                          onQuerySelect(relatedQuery);
                        }
                      }}
                    >
                      <div className="flex items-start gap-2">
                        <Lightbulb className="h-4 w-4 text-yellow-600 dark:text-yellow-400 mt-0.5 flex-shrink-0" />
                        <span className="text-sm text-left">{relatedQuery}</span>
                      </div>
                    </Button>
                  ))}
                </div>
              </TabsContent>

              <TabsContent value="analysis" className="mt-4">
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <h4 className="font-medium text-green-700 dark:text-green-400 mb-2 flex items-center gap-2">
                      <CheckCircle className="h-4 w-4" />
                      Strengths
                    </h4>
                    <div className="space-y-2">
                      {query.reflection.strengths?.map((strength: string, index: number) => (
                        <div key={index} className="p-2 bg-green-50 dark:bg-green-900/20 rounded text-sm text-green-800 dark:text-green-300">
                          {strength}
                        </div>
                      ))}
                    </div>
                  </div>

                  <div>
                    <h4 className="font-medium text-orange-700 dark:text-orange-400 mb-2 flex items-center gap-2">
                      <AlertCircle className="h-4 w-4" />
                      Areas for Improvement
                    </h4>
                    <div className="space-y-2">
                      {query.reflection.weaknesses?.map((weakness: string, index: number) => (
                        <div key={index} className="p-2 bg-orange-50 dark:bg-orange-900/20 rounded text-sm text-orange-800 dark:text-orange-300">
                          {weakness}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
