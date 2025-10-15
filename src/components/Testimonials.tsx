import { Circle } from "lucide-react";

const Testimonials = () => {
  const testimonials = [
    {
      quote: "Talking through my life brought back memories I thought I'd forgotten. My daughter learned so much about me.",
      author: "Margaret S.",
      role: "Age 78"
    },
    {
      quote: "The questions were thoughtful and kind. I felt truly heard for the first time in years.",
      author: "Robert K.", 
      role: "Age 82"
    },
    {
      quote: "My care team now understands what motivates me. It's made such a difference in how they support me.",
      author: "Eleanor T.",
      role: "Age 75"
    }
  ];

  return (
    <section className="py-32 organic-texture relative overflow-hidden">
      {/* Floating decorative bubbles */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="bubble-float absolute top-1/4 left-1/6 w-32 h-32 memory-bubble opacity-30" />
        <div className="bubble-float absolute bottom-1/4 right-1/6 w-24 h-24 memory-bubble opacity-40" style={{animationDelay: '-3s'}} />
        <div className="bubble-float absolute top-1/2 left-3/4 w-40 h-40 memory-bubble opacity-25" style={{animationDelay: '-1s'}} />
      </div>

      <div className="container mx-auto px-6 relative z-10">
        {/* Section Header */}
        <div className="text-center mb-20">
          <h2 className="text-4xl md:text-5xl font-serif text-foreground mb-6">
            Voices from our community
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Real seniors sharing how Life Review has helped them connect with loved ones
          </p>
        </div>

        {/* Testimonials Grid */}
        <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {testimonials.map((testimonial, index) => (
            <div
              key={index}
              className="group p-8 rounded-3xl bg-card/80 backdrop-blur-sm border border-border shadow-soft hover:shadow-bubble transition-all duration-300"
              style={{
                animationDelay: `${index * 0.2}s`
              }}
            >
              {/* Quote */}
              <blockquote className="text-lg text-foreground leading-relaxed mb-6 font-serif italic">
                "{testimonial.quote}"
              </blockquote>

              {/* Author Info */}
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-gradient-to-r from-bubble-primary to-bubble-secondary flex items-center justify-center">
                  <Circle className="w-6 h-6 text-primary-foreground" />
                </div>
                <div>
                  <div className="font-medium text-foreground">
                    {testimonial.author}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {testimonial.role}
                  </div>
                </div>
              </div>

              {/* Decorative Sol Glow */}
              <div className="absolute -top-2 -right-2 w-6 h-6 rounded-full sol-glow opacity-60" />
            </div>
          ))}
        </div>

        {/* Community Stats */}
        <div className="flex flex-wrap justify-center gap-12 mt-20 text-center">
          <div className="flex flex-col items-center">
            <div className="text-3xl font-serif text-primary mb-2">5k+</div>
            <div className="text-muted-foreground">Life stories captured</div>
          </div>
          <div className="flex flex-col items-center">
            <div className="text-3xl font-serif text-primary mb-2">85%</div>
            <div className="text-muted-foreground">Transcription accuracy</div>
          </div>
          <div className="flex flex-col items-center">
            <div className="text-3xl font-serif text-primary mb-2">10-min</div>
            <div className="text-muted-foreground">Average session time</div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Testimonials;