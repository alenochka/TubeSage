import { Card, CardContent } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertTriangle, Info } from "lucide-react";

export default function TranscriptStatusBanner() {
  return (
    <Alert className="mb-6 border-amber-200 bg-amber-50">
      <AlertTriangle className="h-4 w-4 text-amber-600" />
      <AlertDescription className="text-amber-800">
        <strong>Transcript Status:</strong> YouTube blocks transcript extraction from cloud environments. 
        Current videos use placeholder content for system demonstration. 
        Real transcript extraction requires non-cloud infrastructure.
      </AlertDescription>
    </Alert>
  );
}