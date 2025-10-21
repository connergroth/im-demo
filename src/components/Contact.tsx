import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Mail, Phone, FileJson } from "lucide-react";

const Contact = () => {
  return (
    <section className="py-24 px-6 bg-gradient-to-b from-secondary to-background">
      <div className="container mx-auto max-w-4xl">
        <div className="text-center mb-16">
          <h2 className="font-serif text-4xl md:text-5xl font-light text-foreground mb-4">
            Ready to Share Your Story?
          </h2>
          <p className="text-muted-foreground text-lg">
            Start your first life review session today
          </p>
        </div>
        
        <Card className="border-0 shadow-[var(--shadow-soft)] bg-card/80 backdrop-blur-sm mb-12">
          <CardContent className="p-8 md:p-12">
            <div className="grid md:grid-cols-3 gap-8 mb-8">
              <div className="text-center">
                <div className="w-14 h-14 mx-auto mb-4 rounded-full bg-primary/10 flex items-center justify-center">
                  <Phone className="h-6 w-6 text-primary" />
                </div>
                <div className="text-sm text-muted-foreground mb-1">Phone Access</div>
                <div className="text-foreground font-medium">Call anytime</div>
              </div>
              
              <div className="text-center">
                <div className="w-14 h-14 mx-auto mb-4 rounded-full bg-primary/10 flex items-center justify-center">
                  <Mail className="h-6 w-6 text-primary" />
                </div>
                <div className="text-sm text-muted-foreground mb-1">Email Support</div>
                <div className="text-foreground font-medium">hello@lifereview.ai</div>
              </div>
              
              <div className="text-center">
                <div className="w-14 h-14 mx-auto mb-4 rounded-full bg-primary/10 flex items-center justify-center">
                  <FileJson className="h-6 w-6 text-primary" />
                </div>
                <div className="text-sm text-muted-foreground mb-1">Developer API</div>
                <div className="text-foreground font-medium">JSON Output</div>
              </div>
            </div>
            
            <div className="text-center pt-8 border-t border-border">
              <Button 
                size="lg"
                className="px-10 py-6 text-lg rounded-full shadow-[var(--shadow-glow)] hover:shadow-[var(--shadow-soft)] transition-all duration-300"
              >
                Begin Your First Session
              </Button>
              <p className="text-sm text-muted-foreground mt-4">
                Web, phone, and smart speaker enabled • No account required to start
              </p>
            </div>
          </CardContent>
        </Card>
        
        <div className="bg-muted/30 rounded-2xl p-8 text-center">
          <h3 className="font-serif text-2xl font-semibold text-foreground mb-4">
            For Developers & Care Teams
          </h3>
          <p className="text-muted-foreground mb-6">
            Access psychographic profiles via API for personalized intervention design. 
            Profile includes values, motivations, archetypes, barriers, and tone preferences.
          </p>
          <Button variant="outline" size="lg" className="rounded-full">
            View API Documentation
          </Button>
        </div>
      </div>
    </section>
  );
};

export default Contact;
