import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { hasGuestSession } from "@/lib/guestSession";
import { BarChart3 } from "lucide-react";
import heroBg from "@/assets/hero-bg-clean.jpg";

const Hero = () => {
  const navigate = useNavigate();
  const hasSession = hasGuestSession();

  const handleStartReview = () => {
    navigate('/demo');
  };

  const handleViewDashboard = () => {
    navigate('/dashboard');
  };

  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
      {/* Background Image */}
      <div
        className="absolute inset-0 z-0"
        style={{
          backgroundImage: `url(${heroBg})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
      >
        <div className="absolute inset-0 bg-background/60 backdrop-blur-sm" />
      </div>

      {/* Content */}
      <div className="container relative z-10 px-4 py-20">
        <div className="max-w-4xl mx-auto text-center space-y-8 animate-fade-in-slow">
          {/* Logo/Brand */}
          <div className="inline-block mb-4">
            <h2 className="text-xl font-light tracking-[0.3em] text-foreground/60">IM</h2>
          </div>

          {/* Main Headline */}
          <h1 className="text-5xl md:text-7xl font-bold tracking-tight leading-tight">
            Your Life,<br />Your Story,<br />Your Wisdom
          </h1>

          {/* Subheadline */}
          <p className="text-xl md:text-2xl text-muted-foreground max-w-2xl mx-auto font-light leading-relaxed">
            A gentle companion to help you share your life's experiences and discover the wisdom within your own story
          </p>

          {/* Tagline */}
          <div className="space-y-2 pt-4">
            <p className="text-base text-foreground/60 font-light">
              Not a chatbot. Not a tool. A guide for life review.
            </p>
          </div>

          {/* CTA Buttons */}
          <div className="pt-8 flex flex-col sm:flex-row gap-4 justify-center">
            <Button
              size="lg"
              onClick={handleStartReview}
              className="bg-primary hover:bg-primary/80 text-primary-foreground px-10 py-7 text-lg rounded-full shadow-lg hover:shadow-xl transition-all duration-300 font-medium"
            >
              {hasSession ? 'Continue Your Life Review' : 'Start Your Life Review'}
            </Button>
            {hasSession && (
              <Button
                size="lg"
                variant="outline"
                onClick={handleViewDashboard}
                className="px-10 py-7 text-lg rounded-full border-2 font-medium"
              >
                <BarChart3 className="mr-2 h-5 w-5" />
                View Dashboard
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Decorative Element */}
      <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-background to-transparent z-10" />
    </section>
  );
};

export default Hero;
