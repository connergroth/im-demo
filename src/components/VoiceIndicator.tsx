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
    <div className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-50 pointer-events-none">
      {/* Main floating orb */}
      <div className="relative flex items-center justify-center">
        {/* Outer glow rings - animate outward */}
        <div className={`absolute inset-0 rounded-full bg-pink-300/30 blur-2xl ${
          isSpeaking ? 'animate-ping-slow scale-150' : 'animate-pulse scale-125'
        }`} style={{ width: '200px', height: '200px' }} />

        <div className={`absolute inset-0 rounded-full bg-pink-200/40 blur-xl ${
          isSpeaking ? 'animate-ping-slower scale-125' : 'animate-pulse scale-110'
        }`} style={{ width: '160px', height: '160px' }} />

        {/* Main orb */}
        <div className={`relative rounded-full bg-gradient-to-br from-pink-200 via-pink-300 to-pink-400 shadow-2xl transition-all duration-700 ${
          isSpeaking ? 'scale-110' : isListening ? 'scale-105' : 'scale-100'
        }`} style={{ width: '120px', height: '120px' }}>
          {/* Inner glow */}
          <div className="absolute inset-2 rounded-full bg-gradient-to-br from-pink-100/60 to-transparent animate-pulse" />

          {/* Shimmer effect */}
          <div className="absolute inset-0 rounded-full overflow-hidden">
            <div className={`absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent ${
              isSpeaking ? 'animate-shimmer-fast' : 'animate-shimmer'
            }`} style={{ width: '200%' }} />
          </div>

          {/* Listening waves - concentric circles that pulse */}
          {isListening && (
            <>
              <div className="absolute inset-0 rounded-full border-2 border-pink-400/40 animate-ping" style={{ animationDuration: '1.5s' }} />
              <div className="absolute inset-0 rounded-full border-2 border-pink-300/30 animate-ping" style={{ animationDuration: '2s', animationDelay: '0.3s' }} />
              <div className="absolute inset-0 rounded-full border-2 border-pink-200/20 animate-ping" style={{ animationDuration: '2.5s', animationDelay: '0.6s' }} />
            </>
          )}
        </div>

        {/* Status text below orb */}
        <div className="absolute top-full mt-8 text-center pointer-events-none whitespace-nowrap">
          <p className="text-sm font-light tracking-wide text-foreground/60">
            {isSpeaking ? 'AI is speaking...' : isListening ? 'Listening...' : 'Voice active'}
          </p>
        </div>
      </div>

      {/* Background overlay to dim content */}
      <div className="fixed inset-0 bg-background/60 backdrop-blur-sm -z-10" />
    </div>
  );
};

export default VoiceIndicator;