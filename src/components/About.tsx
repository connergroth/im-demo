import { CheckCircle } from "lucide-react";

const benefits = [
  "Preserve memories for family & loved ones",
  "Generate personalized care insights",
  "Voice-enabled, no typing required",
  "Private, secure conversation storage"
];

const About = () => {
  return (
    <section className="py-24 px-6 bg-background">
      <div className="container mx-auto">
        <div className="grid md:grid-cols-2 gap-16 items-center">
          <div className="space-y-6">
            <h2 className="font-serif text-4xl md:text-5xl font-light text-foreground">
              Every Story
              <span className="block font-semibold mt-2 text-primary">Creates Connection</span>
            </h2>
            
            <p className="text-muted-foreground text-lg leading-relaxed">
              Life Review AI guides you through meaningful conversations about your life experiences. 
              In just 5-10 minutes per session, you'll share stories that matter while our AI companion 
              listens, understands, and helps preserve your unique perspective.
            </p>
            
            <p className="text-muted-foreground text-lg leading-relaxed">
              After 3-5 sessions, we generate a comprehensive psychographic profile that captures 
              your values, motivations, and personality. This "Whole-Person Snapshot" helps your 
              family understand you better and enables personalized care approaches.
            </p>
            
            <div className="space-y-4 pt-4">
              {benefits.map((benefit, index) => (
                <div key={index} className="flex items-start gap-3">
                  <CheckCircle className="h-6 w-6 text-primary flex-shrink-0 mt-0.5" />
                  <span className="text-foreground">{benefit}</span>
                </div>
              ))}
            </div>
          </div>
          
          <div className="relative">
            <div 
              className="rounded-3xl overflow-hidden shadow-[var(--shadow-soft)] aspect-square bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center p-12"
            >
              <div className="text-center space-y-12">
                <div>
                  <div className="font-serif text-6xl font-light text-primary mb-4">3-5</div>
                  <div className="text-foreground text-lg">Sessions to Complete</div>
                </div>
                <div>
                  <div className="font-serif text-6xl font-light text-primary mb-4">85%+</div>
                  <div className="text-foreground text-lg">Transcription Accuracy</div>
                </div>
                <div>
                  <div className="font-serif text-6xl font-light text-primary mb-4">5+</div>
                  <div className="text-foreground text-lg">Profile Dimensions</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default About;
