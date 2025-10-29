import { useEffect, useState } from "react";
import { Mic, Volume2, Heart } from "lucide-react";

interface AnimatedSpeakerProps {
  isListening: boolean;
  isSpeaking: boolean;
}

export const AnimatedSpeaker = ({ isListening, isSpeaking }: AnimatedSpeakerProps) => {
  const [barHeights, setBarHeights] = useState<number[]>([16, 20, 26, 20, 16]);

  useEffect(() => {
    let intervalId: number | null = null;
    if (isSpeaking) {
      intervalId = window.setInterval(() => {
        // Generate larger, high-contrast symmetric heights for visibility
        const center = 40 + Math.floor(Math.random() * 10); // 40-49
        const mid = 28 + Math.floor(Math.random() * 10); // 28-37
        const edge = 18 + Math.floor(Math.random() * 8); // 18-25
        setBarHeights([edge, mid, center, mid, edge]);
      }, 120);
    } else {
      // Reset to a soft smile baseline when not speaking
      setBarHeights([18, 24, 30, 24, 18]);
    }
    return () => {
      if (intervalId) {
        clearInterval(intervalId);
      }
    };
  }, [isSpeaking]);
  return (
    <div className="relative flex items-center justify-center">
      {/* Multi-layered ambient glow */}
      {(isListening || isSpeaking) && (
        <>
          <div 
            className="absolute inset-0 rounded-full blur-3xl animate-glow-pulse"
            style={{ 
              background: 'var(--gradient-glow)',
              width: '400px', 
              height: '400px' 
            }} 
          />
          <div 
            className="absolute inset-0 rounded-full blur-2xl opacity-40 animate-gentle-pulse"
            style={{ 
              background: 'radial-gradient(circle, hsl(var(--accent)) 0%, transparent 60%)',
              width: '350px', 
              height: '350px',
              animationDelay: '0.5s'
            }} 
          />
        </>
      )}
      
      {/* Outer rotating gradient ring */}
      <div className={`relative flex items-center justify-center transition-all duration-700 ${
        isListening ? 'scale-110' : isSpeaking ? 'scale-105' : ''
      }`}>
        <div className="absolute inset-0 w-80 h-80 rounded-full bg-gradient-to-br from-primary via-accent to-secondary opacity-25 blur-xl animate-gentle-pulse" />
        <div className="absolute inset-0 w-72 h-72 rounded-full bg-gradient-to-tr from-secondary via-primary to-accent opacity-20 blur-lg animate-gentle-pulse" 
             style={{ animationDelay: '1s' }} />
        
        {/* Main companion body with enhanced gradient */}
        <div className="relative w-64 h-64 rounded-full bg-gradient-to-br from-primary via-accent to-secondary shadow-[var(--shadow-glow)] backdrop-blur-sm flex items-center justify-center">
          {/* Animated gradient overlay */}
          <div className="absolute inset-0 rounded-full bg-gradient-to-tr from-transparent via-white/10 to-transparent animate-gentle-pulse" />
          
          {/* Inner face area */}
          <div className="w-52 h-52 rounded-full bg-background/98 shadow-[inset_0_8px_24px_rgba(0,0,0,0.1)] flex items-center justify-center relative overflow-hidden">
            {/* Soft inner gradient glow */}
            <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-accent/5 to-secondary/10 animate-gentle-pulse" />
            
            {/* Eyes - more expressive with animation */}
            <div className="absolute top-14 flex gap-12 z-10">
              <div className="relative">
                <div className={`w-8 h-8 rounded-full bg-white border border-foreground/40 transition-all duration-500 shadow-[0_2px_8px_rgba(0,0,0,0.25)] ${
                  isListening || isSpeaking ? 'scale-125' : ''
                }`}>
                  {/* Dark ring around pupil */}
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-5 h-5 rounded-full border-2 border-foreground/80" />
                  </div>
                  {/* Pupil */}
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-4 h-4 rounded-full bg-foreground animate-gentle-pulse" />
                  </div>
                </div>
                {/* Enhanced sparkle */}
                <div className="absolute top-1.5 left-2 w-2.5 h-2.5 rounded-full bg-white shadow-[0_0_8px_rgba(255,255,255,0.7)] animate-gentle-pulse" />
              </div>
              <div className="relative">
                <div className={`w-8 h-8 rounded-full bg-white border border-foreground/40 transition-all duration-500 shadow-[0_2px_8px_rgba(0,0,0,0.25)] ${
                  isListening || isSpeaking ? 'scale-125' : ''
                }`} style={{ animationDelay: '0.1s' }}>
                  {/* Dark ring around pupil */}
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-5 h-5 rounded-full border-2 border-foreground/80" />
                  </div>
                  {/* Pupil */}
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-4 h-4 rounded-full bg-foreground animate-gentle-pulse" style={{ animationDelay: '0.2s' }} />
                  </div>
                </div>
                <div className="absolute top-1.5 left-2 w-2.5 h-2.5 rounded-full bg-white shadow-[0_0_8px_rgba(255,255,255,0.7)] animate-gentle-pulse" style={{ animationDelay: '0.1s' }} />
              </div>
            </div>

            {/* Animated blush marks */}
            {(isListening || isSpeaking) && (
              <>
                <div className="absolute left-6 top-20 w-10 h-5 rounded-full bg-primary/30 blur-sm animate-glow-pulse" />
                <div className="absolute right-6 top-20 w-10 h-5 rounded-full bg-primary/30 blur-sm animate-glow-pulse" style={{ animationDelay: '0.3s' }} />
              </>
            )}
            
            {/* Enhanced mouth with gradient */}
            <div className="absolute bottom-12 flex flex-col items-center gap-1.5">
              {isSpeaking ? (
                // Animated speaking waves with gradient and dynamic heights
                <div className="flex gap-2">
                  {barHeights.map((h, i) => (
                    <div
                      key={i}
                      className="w-2 rounded-full bg-gradient-to-t from-primary via-white/80 to-secondary shadow-[0_4px_10px_rgba(0,0,0,0.15)]"
                      style={{
                        height: `${h}px`,
                        transition: 'height 120ms ease-out'
                      }}
                    />
                  ))}
                </div>
              ) : (
                // Enhanced smile with gradient
                <svg width="56" height="28" viewBox="0 0 56 28" fill="none" className="opacity-90 drop-shadow">
                  <defs>
                    <linearGradient id="smileGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                      <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity="0.6" />
                      <stop offset="50%" stopColor="hsl(var(--accent))" stopOpacity="0.8" />
                      <stop offset="100%" stopColor="hsl(var(--secondary))" stopOpacity="0.6" />
                    </linearGradient>
                  </defs>
                  <path 
                    d="M6 8C6 8 16 24 28 24C40 24 50 8 50 8" 
                    stroke="url(#smileGradient)" 
                    strokeWidth="5" 
                    strokeLinecap="round"
                  />
                </svg>
              )}
            </div>

            {/* Enhanced listening indicator - animated sound waves */}
            {isListening && (
              <div className="absolute -right-6 top-1/2 -translate-y-1/2 flex gap-1.5">
                {[...Array(4)].map((_, i) => (
                  <div
                    key={i}
                    className="w-1.5 rounded-full bg-gradient-to-t from-primary to-secondary animate-listening-pulse shadow-lg"
                    style={{
                      height: `${14 + i * 5}px`,
                      animationDelay: `${i * 0.12}s`
                    }}
                  />
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Floating decorative elements with enhanced animation */}
        <div className="absolute -top-8 -right-8 animate-float">
          <div className="w-14 h-14 rounded-full bg-gradient-to-br from-secondary via-accent/50 to-primary/50 backdrop-blur-sm flex items-center justify-center shadow-[var(--shadow-medium)]">
            <Heart className="w-6 h-6 text-white animate-gentle-pulse" fill="currentColor" />
          </div>
        </div>
        
        <div className="absolute -bottom-10 -left-8 w-16 h-16 rounded-full bg-gradient-to-br from-accent via-primary/50 to-secondary/50 backdrop-blur-sm shadow-[var(--shadow-medium)] animate-float" 
             style={{ animationDelay: '1.5s' }}>
          <div className="w-full h-full rounded-full bg-gradient-to-tr from-white/20 to-transparent animate-gentle-pulse" />
        </div>
        
        <div className="absolute top-1/2 -right-12 w-10 h-10 rounded-full bg-gradient-to-br from-primary/40 to-accent/40 backdrop-blur-sm shadow-lg animate-float" 
             style={{ animationDelay: '0.8s' }} />
      </div>

      {/* Status indicator with better styling */}
      <div className="absolute -bottom-6 left-1/2 -translate-x-1/2 px-6 py-3 rounded-full bg-card/95 backdrop-blur-md shadow-[var(--shadow-soft)] border border-border/50 flex items-center gap-3 min-w-[180px] justify-center">
        {isListening && (
          <>
            <Mic className="w-4 h-4 text-primary animate-gentle-pulse" />
            <span className="text-sm font-medium text-foreground">Listening...</span>
          </>
        )}
        {isSpeaking && !isListening && (
          <>
            <Volume2 className="w-4 h-4 text-accent animate-gentle-pulse" />
            <span className="text-sm font-medium text-foreground">Speaking...</span>
          </>
        )}
        {!isListening && !isSpeaking && (
          <span className="text-sm font-medium text-muted-foreground">Ready to chat</span>
        )}
      </div>
    </div>
  );
};


