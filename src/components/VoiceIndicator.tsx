import { Card, CardContent } from "@/components/ui/card";
import { Mic, Volume2 } from "lucide-react";

interface VoiceIndicatorProps {
  isActive: boolean;
  isSpeaking: boolean;
  isListening: boolean;
}

const VoiceIndicator = ({ isActive, isSpeaking, isListening }: VoiceIndicatorProps) => {
  if (!isActive) {
    return null;
  }

  return (
    <Card className="shadow-[var(--shadow-soft)]">
      <CardContent className="py-6">
        <div className="flex items-center justify-center space-x-4">
          {isSpeaking && (
            <div className="flex items-center space-x-2 text-primary">
              <Volume2 className="h-6 w-6 animate-pulse" />
              <span className="font-medium">AI is speaking...</span>
            </div>
          )}
          
          {isListening && (
            <div className="flex items-center space-x-2 text-primary">
              <Mic className="h-6 w-6 animate-pulse" />
              <span className="font-medium">Listening...</span>
            </div>
          )}
          
          {!isSpeaking && !isListening && isActive && (
            <div className="flex items-center space-x-2 text-muted-foreground">
              <div className="h-3 w-3 rounded-full bg-primary animate-pulse"></div>
              <span className="font-medium">Voice active</span>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default VoiceIndicator;