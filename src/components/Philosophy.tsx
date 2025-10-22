const philosophyPoints = [
  {
    label: "5-10 Minute Sessions",
    description: "Short, comfortable conversations at your own pace",
  },
  {
    label: "Your Stories, Captured",
    description: "We record and transcribe your memories securely",
  },
  {
    label: "Understanding You",
    description: "Create a profile that reflects your values and experiences",
  },
];

const Philosophy = () => {
  return (
    <section className="py-24 bg-gradient-to-b from-background to-secondary/30">
      <div className="container px-4">
        <div className="max-w-4xl mx-auto">
          {/* Main Statement */}
          <div className="text-center mb-16 animate-fade-in">
            <h2 className="text-4xl md:text-5xl font-bold mb-6 leading-tight">
              Your Life Review,<br />Made Simple
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
              We guide you through meaningful questions about your life, capturing your stories so your family and care team can understand you better.
            </p>
          </div>

          {/* Philosophy Points */}
          <div className="grid md:grid-cols-3 gap-8 mt-16">
            {philosophyPoints.map((point, index) => (
              <div 
                key={index}
                className="text-center p-8 rounded-2xl bg-card hover:shadow-xl transition-shadow duration-300 animate-scale-in"
                style={{ animationDelay: `${index * 150}ms` }}
              >
                <h3 className="text-2xl font-bold mb-3">{point.label}</h3>
                <p className="text-muted-foreground">{point.description}</p>
              </div>
            ))}
          </div>

          {/* Closing Statement */}
          <div className="mt-20 text-center animate-fade-in-slow">
            <blockquote className="text-2xl md:text-3xl font-light text-foreground/70 leading-relaxed">
              "Tell me about a time you overcame a challenge..."
            </blockquote>
            <p className="text-base text-muted-foreground mt-4">Sample question from your life review session</p>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Philosophy;
