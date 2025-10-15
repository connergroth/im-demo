import { Circle } from "lucide-react";

const HowItWorks = () => {
  const steps = [
    {
      number: "01",
      title: "Share your story",
      description: "Answer guided questions about meaningful moments in your life. Simply speak naturally — we'll listen with care.",
      icon: <Circle className="w-8 h-8" />
    },
    {
      number: "02", 
      title: "AI understands you",
      description: "Our compassionate AI captures your values, motivations, and what makes you unique.",
      icon: <Circle className="w-8 h-8" />
    },
    {
      number: "03",
      title: "Create your profile",
      description: "Receive a personal snapshot that helps your family and care team understand and support you better.",
      icon: <Circle className="w-8 h-8" />
    }
  ];

  return (
    <section className="py-32 bg-secondary">
      <div className="container mx-auto px-6">
        {/* Section Header */}
        <div className="text-center mb-20">
          <h2 className="text-4xl md:text-5xl font-serif text-foreground mb-6">
            Three simple steps to share your life
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            A gentle, guided process designed for your comfort
          </p>
        </div>

        {/* Steps */}
        <div className="max-w-6xl mx-auto">
          <div className="grid md:grid-cols-3 gap-12 md:gap-8">
            {steps.map((step, index) => (
              <div 
                key={step.number}
                className="text-center group"
                style={{
                  animationDelay: `${index * 0.2}s`
                }}
              >
                {/* Step Number */}
                <div className="text-6xl md:text-7xl font-serif text-primary/20 mb-4 group-hover:text-primary/40 transition-colors">
                  {step.number}
                </div>

                {/* Icon in Sol Glow */}
                <div className="w-16 h-16 rounded-full sol-glow mx-auto mb-6 flex items-center justify-center text-primary">
                  {step.icon}
                </div>

                {/* Content */}
                <h3 className="text-2xl font-serif text-foreground mb-4">
                  {step.title}
                </h3>
                <p className="text-muted-foreground leading-relaxed">
                  {step.description}
                </p>

                {/* Connection Line (except for last item) */}
                {index < steps.length - 1 && (
                  <div className="hidden md:block absolute top-1/2 left-full w-8 h-px bg-primary/30 -translate-y-1/2 translate-x-4" />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Bottom CTA */}
        <div className="text-center mt-20">
          <div className="inline-flex items-center gap-3 px-6 py-3 rounded-full bg-card border border-border shadow-soft">
            <div className="w-3 h-3 rounded-full sol-glow" />
            <span className="text-muted-foreground">Ready to share your story?</span>
          </div>
        </div>
      </div>
    </section>
  );
};

export default HowItWorks;