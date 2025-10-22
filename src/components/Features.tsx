import lifeStoriesImg from "@/assets/life-stories.jpg";
import compassionateImg from "@/assets/compassionate-guide.jpg";
import growthImg from "@/assets/personal-growth.jpg";

const features = [
  {
    title: "Share Your Stories",
    description: "Guided conversations help you reflect on meaningful moments from your life journey",
    image: lifeStoriesImg,
  },
  {
    title: "A Compassionate Listener",
    description: "An AI companion that truly understands and respects your experiences and emotions",
    image: compassionateImg,
  },
  {
    title: "Discover Your Wisdom",
    description: "Help your family understand you better while uncovering insights about yourself",
    image: growthImg,
  },
];

const Features = () => {
  return (
    <section className="py-24 bg-card">
      <div className="container px-4">
        <div className="max-w-6xl mx-auto">
          {/* Section Header */}
          <div className="text-center mb-16 space-y-4 animate-fade-in">
            <h2 className="text-4xl md:text-5xl font-bold leading-tight">
              How It Works
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
              Simple, gentle conversations that capture your life experiences and create a meaningful record for you and your loved ones.
            </p>
          </div>

          {/* Features Grid */}
          <div className="grid md:grid-cols-3 gap-8 mt-16">
            {features.map((feature, index) => (
              <div 
                key={index} 
                className="group animate-fade-in"
                style={{ animationDelay: `${index * 200}ms` }}
              >
                <div className="relative overflow-hidden rounded-2xl aspect-square mb-6 shadow-lg">
                  <img
                    src={feature.image}
                    alt={feature.title}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-foreground/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                </div>
                <h3 className="text-2xl font-bold mb-3">{feature.title}</h3>
                <p className="text-muted-foreground leading-relaxed">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default Features;
