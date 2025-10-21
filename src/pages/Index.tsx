import Hero from "@/components/Hero";
import Services from "@/components/Services";
import About from "@/components/About";
import Contact from "@/components/Contact";

const Index = () => {
  return (
    <div className="min-h-screen">
      <Hero />
      <Services />
      <About />
      <Contact />
      
      <footer className="py-8 px-6 border-t border-border bg-background">
        <div className="container mx-auto text-center text-sm text-muted-foreground">
          <p>© 2025 Life Review AI. Secure, private conversations. HIPAA-compliant storage.</p>
        </div>
      </footer>
    </div>
  );
};

export default Index;
