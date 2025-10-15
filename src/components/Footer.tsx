import { Button } from "@/components/ui/button";
import { Circle } from "lucide-react";

const Footer = () => {
  return (
    <footer className="relative py-32 bg-primary text-primary-foreground overflow-hidden">
      {/* Background Pattern */}
      <div className="absolute inset-0 organic-texture opacity-20" />
      
      {/* Floating Memory Bubbles */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="bubble-float absolute top-1/4 left-1/4 w-20 h-20 rounded-full bg-primary-foreground/10 backdrop-blur-sm" />
        <div className="bubble-float absolute bottom-1/4 right-1/4 w-16 h-16 rounded-full bg-primary-foreground/15 backdrop-blur-sm" style={{animationDelay: '-2s'}} />
        <div className="bubble-float absolute top-1/2 left-1/6 w-24 h-24 rounded-full bg-primary-foreground/8 backdrop-blur-sm" style={{animationDelay: '-4s'}} />
      </div>

      <div className="container mx-auto px-6 relative z-10">
        {/* Main CTA */}
        <div className="text-center mb-16">
          <div className="flex justify-center mb-8">
            <div className="w-20 h-20 rounded-full sol-glow" />
          </div>
          
          <h2 className="text-4xl md:text-6xl font-serif mb-6 leading-tight">
            Your story matters
          </h2>
          
          <p className="text-xl text-primary-foreground/80 mb-8 max-w-2xl mx-auto">
            Join seniors who are sharing their wisdom and helping their families understand them better.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button 
              size="lg" 
              variant="secondary"
              className="bg-primary-foreground text-primary hover:bg-primary-foreground/90 px-8 py-4 text-lg rounded-full"
            >
              Begin Your Life Review
            </Button>
            <Button 
              size="lg" 
              variant="outline"
              className="border-primary-foreground text-primary-foreground hover:bg-primary-foreground/10 px-8 py-4 text-lg rounded-full"
            >
              See How It Works
            </Button>
          </div>
        </div>

        {/* Bottom Section */}
        <div className="border-t border-primary-foreground/20 pt-12 flex flex-col md:flex-row justify-between items-center gap-8">
          {/* Logo & Tagline */}
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-full sol-glow" />
            <div>
              <div className="text-2xl font-serif">Life Review</div>
              <div className="text-sm text-primary-foreground/60">by IM</div>
            </div>
          </div>

          {/* Navigation Links */}
          <div className="flex items-center gap-8 text-sm">
            <a href="#" className="text-primary-foreground/80 hover:text-primary-foreground transition-colors">
              Privacy
            </a>
            <a href="#" className="text-primary-foreground/80 hover:text-primary-foreground transition-colors">
              Terms
            </a>
            <a href="#" className="text-primary-foreground/80 hover:text-primary-foreground transition-colors">
              Support
            </a>
          </div>

          {/* Company Touch */}
          <div className="flex items-center gap-2 text-primary-foreground/60">
            <Circle className="w-3 h-3 fill-current" />
            <span className="text-sm">Built with compassion by IM</span>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;