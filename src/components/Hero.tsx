import { Button } from "@/components/ui/button";
import { ArrowRight, Mic } from "lucide-react";
import { useNavigate } from "react-router-dom";
import heroImage from "@/assets/hero-life-review.jpg";

const Hero = () => {
  const navigate = useNavigate();

  const handleStartStory = () => {
    navigate('/demo');
  };

  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
      <div 
        className="absolute inset-0 bg-cover bg-center opacity-20"
        style={{ backgroundImage: `url(${heroImage})` }}
      />
      <div className="absolute inset-0" style={{ background: 'var(--gradient-hero)' }} />
      
      <div className="relative z-10 container mx-auto px-6 py-24 text-center">
        <div className="inline-flex items-center gap-2 mb-6 px-4 py-2 rounded-full bg-primary/10 backdrop-blur-sm animate-fade-in">
          <Mic className="h-4 w-4 text-primary" />
          <span className="text-sm font-medium text-foreground">AI-Powered Life Story Companion</span>
        </div>
        
        <h1 className="font-serif text-5xl md:text-7xl font-light text-foreground mb-6 animate-fade-in">
          Your Story
          <span className="block font-semibold mt-2 text-6xl md:text-8xl text-foreground">
            Deserves to Be Heard
          </span>
        </h1>
        
        <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-10 animate-fade-in" style={{ animationDelay: '0.2s' }}>
          Share your life experiences through natural conversation. Our AI companion guides you 
          through meaningful storytelling sessions, preserving your memories and creating insights 
          for personalized care.
        </p>
        
        <div className="flex flex-col sm:flex-row gap-4 justify-center animate-fade-in" style={{ animationDelay: '0.4s' }}>
          <Button 
            size="lg" 
            onClick={handleStartStory}
            className="text-lg px-8 py-6 rounded-full shadow-[var(--shadow-glow)] hover:shadow-[var(--shadow-soft)] transition-all duration-300"
          >
            Start Your Story
            <ArrowRight className="ml-2 h-5 w-5" />
          </Button>
          <Button 
            variant="outline" 
            size="lg"
            className="text-lg px-8 py-6 rounded-full border-2"
          >
            See How It Works
          </Button>
        </div>
        
        <div className="mt-16 text-sm text-muted-foreground animate-fade-in" style={{ animationDelay: '0.6s' }}>
          <p>✓ Voice-enabled conversations  ✓ Secure & private  ✓ 5-10 minute sessions</p>
        </div>
      </div>
    </section>
  );
};

export default Hero;
