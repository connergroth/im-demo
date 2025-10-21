import { Card, CardContent } from "@/components/ui/card";
import { MessageCircle, FileText, Brain, Share2 } from "lucide-react";

const features = [
  {
    icon: MessageCircle,
    title: "Guided Conversations",
    description: "Warm, natural dialogues with thoughtful prompts about your life experiences, achievements, and meaningful moments."
  },
  {
    icon: FileText,
    title: "Story Capture",
    description: "High-accuracy transcription of your stories, securely stored and organized for you and your loved ones."
  },
  {
    icon: Brain,
    title: "Profile Generation",
    description: "AI-powered analysis creates a psychographic profile highlighting your values, motivations, and personality insights."
  },
  {
    icon: Share2,
    title: "Meaningful Sharing",
    description: "Beautiful story summaries and profiles that help your family and care team understand you better."
  }
];

const Services = () => {
  return (
    <section className="py-24 px-6 bg-gradient-to-b from-background to-secondary">
      <div className="container mx-auto">
        <div className="text-center mb-16">
          <h2 className="font-serif text-4xl md:text-5xl font-light text-foreground mb-4">
            How It Works
          </h2>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            A simple, guided process that honors your life story and creates lasting insights
          </p>
        </div>
        
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {features.map((feature, index) => (
            <Card 
              key={index}
              className="border-0 shadow-[var(--shadow-soft)] hover:shadow-[var(--shadow-glow)] transition-all duration-300 hover:-translate-y-1 bg-card/80 backdrop-blur-sm"
              style={{ 
                background: 'var(--gradient-card)',
                animationDelay: `${index * 0.1}s`
              }}
            >
              <CardContent className="pt-10 pb-8 px-6 text-center">
                <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-primary/10 flex items-center justify-center">
                  <feature.icon className="h-8 w-8 text-primary" />
                </div>
                <h3 className="font-serif text-xl font-semibold mb-3 text-foreground">
                  {feature.title}
                </h3>
                <p className="text-muted-foreground leading-relaxed">
                  {feature.description}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Services;
