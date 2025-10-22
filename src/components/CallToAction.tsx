import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { hasGuestSession } from "@/lib/guestSession";

const CallToAction = () => {
  const navigate = useNavigate();
  const hasSession = hasGuestSession();

  const handleStartReview = () => {
    navigate('/demo');
  };

  const handleLearnMore = () => {
    // Scroll to features section
    const featuresSection = document.querySelector('section');
    featuresSection?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <section className="py-24 bg-primary text-primary-foreground">
      <div className="container px-4">
        <div className="max-w-3xl mx-auto text-center space-y-8">
          <h2 className="text-4xl md:text-5xl font-bold animate-fade-in leading-tight">
            Ready to Share Your Story?
          </h2>

          <p className="text-xl opacity-90 animate-fade-in leading-relaxed" style={{ animationDelay: '200ms' }}>
            Start your first life review session today. Simple, comfortable, and meaningful.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center pt-8 animate-fade-in" style={{ animationDelay: '400ms' }}>
            <Button
              size="lg"
              variant="secondary"
              onClick={handleStartReview}
              className="px-10 py-7 text-lg rounded-full shadow-lg hover:shadow-xl transition-all duration-300 font-medium"
            >
              {hasSession ? 'Continue Your Life Review' : 'Begin Your Life Review'}
            </Button>
            <Button
              size="lg"
              variant="outline"
              onClick={handleLearnMore}
              className="px-10 py-7 text-lg rounded-full border-2 border-primary-foreground text-primary-foreground hover:bg-primary-foreground/10 font-medium"
            >
              How It Works
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
};

export default CallToAction;
