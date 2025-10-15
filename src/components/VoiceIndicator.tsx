import { Card, CardContent } from "@/components/ui/card";
import { Volume2, Mic } from "lucide-react";
import { useEffect, useState } from "react";

interface VoiceIndicatorProps {
  isActive: boolean;
  isSpeaking?: boolean;
  isListening?: boolean;
}

const VoiceIndicator = ({ isActive, isSpeaking, isListening }: VoiceIndicatorProps) => {
  const [bars, setBars] = useState<number[]>([3, 6, 4, 8, 5, 7, 4, 6]);

  useEffect(() => {
    if (!isActive) {
      setBars([3, 6, 4, 8, 5, 7, 4, 6]);
      return;
    }

    const interval = setInterval(() => {
      setBars(prev => prev.map(() => Math.random() * 10 + 2));
    }, 100);

    return () => clearInterval(interval);
  }, [isActive]);

  const getStatusText = () => {
    if (isSpeaking) return "AI Speaking";
    if (isListening) return "Listening";
    return "Idle";
  };

  const getStatusColor = () => {
    if (isSpeaking) return "text-blue-600";
    if (isListening) return "text-red-600";
    return "text-gray-400";
  };

  const getBarColor = () => {
    if (isSpeaking) return "bg-gradient-to-t from-blue-500 to-blue-300";
    if (isListening) return "bg-gradient-to-t from-red-500 to-red-300";
    return "bg-gray-300";
  };

  return (
    <Card className={`transition-all duration-300 ${isActive ? 'ring-2 ring-offset-2' : ''} ${isSpeaking ? 'ring-blue-500' : isListening ? 'ring-red-500' : ''}`}>
      <CardContent className="p-6">
        <div className="space-y-4">
          {/* Status Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {isSpeaking ? (
                <Volume2 className={`h-5 w-5 ${getStatusColor()} ${isActive ? 'animate-pulse' : ''}`} />
              ) : (
                <Mic className={`h-5 w-5 ${getStatusColor()} ${isActive ? 'animate-pulse' : ''}`} />
              )}
              <span className={`font-medium ${getStatusColor()}`}>
                {getStatusText()}
              </span>
            </div>
            {isActive && (
              <div className="flex gap-1">
                <div className={`h-2 w-2 rounded-full ${isSpeaking ? 'bg-blue-500' : 'bg-red-500'} animate-pulse`}></div>
                <div className={`h-2 w-2 rounded-full ${isSpeaking ? 'bg-blue-500' : 'bg-red-500'} animate-pulse delay-75`}></div>
                <div className={`h-2 w-2 rounded-full ${isSpeaking ? 'bg-blue-500' : 'bg-red-500'} animate-pulse delay-150`}></div>
              </div>
            )}
          </div>

          {/* Animated Bars Visualizer */}
          <div className="flex items-end justify-center gap-2 h-32 bg-gradient-to-b from-gray-50 to-gray-100 rounded-lg p-4">
            {bars.map((height, index) => (
              <div
                key={index}
                className={`w-4 rounded-t-full transition-all duration-100 ease-out ${getBarColor()}`}
                style={{
                  height: isActive ? `${height * 10}%` : '20%',
                  opacity: isActive ? 1 : 0.3,
                }}
              />
            ))}
          </div>

          {/* Waveform Effect */}
          <div className="relative h-16 bg-gray-900 rounded-lg overflow-hidden">
            <div className="absolute inset-0 flex items-center justify-center">
              <svg className="w-full h-full" viewBox="0 0 400 100" preserveAspectRatio="none">
                <defs>
                  <linearGradient id="waveGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor={isSpeaking ? "#3b82f6" : isListening ? "#ef4444" : "#6b7280"} stopOpacity="0.2" />
                    <stop offset="50%" stopColor={isSpeaking ? "#3b82f6" : isListening ? "#ef4444" : "#6b7280"} stopOpacity="0.8" />
                    <stop offset="100%" stopColor={isSpeaking ? "#3b82f6" : isListening ? "#ef4444" : "#6b7280"} stopOpacity="0.2" />
                  </linearGradient>
                </defs>

                {isActive ? (
                  <>
                    <path
                      d={`M 0 50 ${bars.map((h, i) => `L ${i * 50} ${50 - h * 3} L ${(i + 1) * 50} ${50 + h * 3}`).join(' ')} L 400 50`}
                      fill="none"
                      stroke="url(#waveGradient)"
                      strokeWidth="2"
                      className="animate-pulse"
                    />
                    <path
                      d={`M 0 50 ${bars.map((h, i) => `L ${i * 50} ${50 + h * 2} L ${(i + 1) * 50} ${50 - h * 2}`).join(' ')} L 400 50`}
                      fill="none"
                      stroke="url(#waveGradient)"
                      strokeWidth="1.5"
                      opacity="0.5"
                    />
                  </>
                ) : (
                  <line x1="0" y1="50" x2="400" y2="50" stroke="url(#waveGradient)" strokeWidth="2" />
                )}
              </svg>
            </div>
          </div>

          {/* Status Info */}
          <div className="text-center text-sm text-muted-foreground">
            {isActive ? (
              <p className="animate-pulse">
                {isSpeaking ? "AI is speaking..." : "Recording your response..."}
              </p>
            ) : (
              <p>Ready to start</p>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default VoiceIndicator;
