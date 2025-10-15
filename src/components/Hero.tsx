import { Button } from "@/components/ui/button";
import { Circle } from "lucide-react";
import { useNavigate } from "react-router-dom";
import heroBg from "@/assets/hero-bg.jpg";

const Hero = () => {
  const navigate = useNavigate();

  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden grainy">
      {/* Hero Background */}
      <div 
        className="absolute inset-0 bg-cover bg-center"
        style={{ backgroundImage: `url(${heroBg})` }}
      />
      <div className="absolute inset-0 bg-gradient-to-b from-primary/10 to-background/80" />
      
      {/* Floating Memory Bubbles */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="bubble-float absolute top-1/4 left-1/4 w-16 h-16 memory-bubble opacity-60" />
        <div className="bubble-float absolute top-1/3 right-1/4 w-12 h-12 memory-bubble opacity-70" style={{animationDelay: '-2s'}} />
        <div className="bubble-float absolute bottom-1/3 left-1/3 w-20 h-20 memory-bubble opacity-50" style={{animationDelay: '-4s'}} />
        <div className="bubble-float absolute bottom-1/4 right-1/3 w-14 h-14 memory-bubble opacity-65" style={{animationDelay: '-1s'}} />
        <div className="bubble-float absolute top-1/2 left-1/6 w-10 h-10 memory-bubble opacity-75" style={{animationDelay: '-3s'}} />
        <div className="bubble-float absolute top-3/4 right-1/6 w-18 h-18 memory-bubble opacity-55" style={{animationDelay: '-5s'}} />
      </div>

      {/* Sol - Glowing Orb */}
      <div className="absolute top-20 right-20 w-8 h-8 rounded-full sol-glow opacity-80" />

      {/* Hero Content */}
      <div className="relative z-10 text-center max-w-4xl mx-auto px-6">
        <div className="animate-fade-in-up">
          <h1 className="text-5xl md:text-7xl font-serif font-light text-foreground mb-6 leading-tight">
            Your story deserves{" "}
            <span className="relative">
              to be heard
              <div className="absolute -bottom-2 left-0 w-full h-1 bg-gradient-to-r from-primary to-primary-glow opacity-60" />
            </span>
          </h1>
          
          <p className="text-xl md:text-2xl text-muted-foreground mb-8 font-light leading-relaxed max-w-2xl mx-auto">
            Share your life's meaningful moments in guided conversations. Create a legacy that helps your family and care team understand you better.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Button
              size="lg"
              className="bg-primary hover:bg-primary-glow text-primary-foreground px-8 py-4 text-lg rounded-full shadow-soft"
              onClick={() => navigate('/demo')}
            >
              Start Your Life Review
            </Button>
            <Button
              variant="outline"
              size="lg"
              className="border-primary text-primary hover:bg-primary/10 px-8 py-4 text-lg rounded-full"
              onClick={() => navigate('/demo')}
            >
              View Demo
            </Button>
          </div>

          {/* Trust Indicator */}
          <div className="mt-12 flex items-center justify-center gap-2 text-muted-foreground">
            <Circle className="w-2 h-2 fill-current" />
            <span className="text-sm">Helping seniors share their stories with compassion</span>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Hero;