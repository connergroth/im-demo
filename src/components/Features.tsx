import { Circle } from "lucide-react";

const Features = () => {
  const features = [
    {
      title: "Guided Conversations",
      description: "Warm, compassionate AI guides you through meaningful life stories",
      size: "large",
      position: "top-left"
    },
    {
      title: "Voice-First Design", 
      description: "Simply speak naturally — our AI transcribes and understands your stories",
      size: "medium",
      position: "top-right"
    },
    {
      title: "Values Discovery",
      description: "Uncover what matters most through your own life experiences",
      size: "small",
      position: "center-left"
    },
    {
      title: "Personal Profile",
      description: "Create a psychographic snapshot that helps caregivers understand you",
      size: "medium", 
      position: "center-right"
    },
    {
      title: "Legacy Preservation",
      description: "Share your wisdom with family and future generations",
      size: "large",
      position: "bottom-center"
    }
  ];

  const getSizeClasses = (size: string) => {
    switch (size) {
      case 'large':
        return 'w-80 h-80 md:w-96 md:h-96';
      case 'medium':
        return 'w-64 h-64 md:w-72 md:h-72';
      case 'small':
        return 'w-48 h-48 md:w-56 md:h-56';
      default:
        return 'w-64 h-64';
    }
  };

  const getPositionClasses = (position: string, index: number) => {
    const positions = {
      'top-left': 'top-8 left-8',
      'top-right': 'top-16 right-16',
      'center-left': 'top-1/2 left-20 -translate-y-1/2',
      'center-right': 'top-1/2 right-20 -translate-y-1/2',
      'bottom-center': 'bottom-16 left-1/2 -translate-x-1/2'
    };
    return positions[position as keyof typeof positions] || '';
  };

  return (
    <section className="relative py-32 organic-texture min-h-screen flex items-center">
      <div className="container mx-auto px-6">
        {/* Section Header */}
        <div className="text-center mb-20">
          <h2 className="text-4xl md:text-5xl font-serif text-foreground mb-6">
            How Life Review works
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Every feature designed to honor your story with care and dignity
          </p>
        </div>

        {/* Floating Feature Bubbles */}
        <div className="relative h-[800px] md:h-[900px]">
          {features.map((feature, index) => (
            <div
              key={feature.title}
              className={`absolute memory-bubble p-8 text-center ${getSizeClasses(feature.size)} ${getPositionClasses(feature.position, index)}`}
              style={{
                animationDelay: `${index * 0.5}s`,
              }}
            >
              <div className="flex flex-col items-center justify-center h-full">
                <div className="w-12 h-12 rounded-full bg-sol-glow mb-4 flex items-center justify-center sol-glow">
                  <Circle className="w-6 h-6 text-primary" />
                </div>
                <h3 className="text-xl md:text-2xl font-serif text-foreground mb-3">
                  {feature.title}
                </h3>
                <p className="text-muted-foreground text-sm md:text-base leading-relaxed">
                  {feature.description}
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* AI Indicator */}
        <div className="text-center mt-16">
          <div className="w-16 h-16 rounded-full sol-glow mx-auto mb-4" />
          <p className="text-muted-foreground">
            Your compassionate AI companion for life review
          </p>
        </div>
      </div>
    </section>
  );
};

export default Features;