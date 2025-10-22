import Hero from "@/components/Hero";
import Features from "@/components/Features";
import Philosophy from "@/components/Philosophy";
import CallToAction from "@/components/CallToAction";
import { useNavigate } from "react-router-dom";
import { hasGuestSession } from "@/lib/guestSession";

const Index = () => {
  const navigate = useNavigate();
  const hasSession = hasGuestSession();

  return (
    <div className="min-h-screen">
      <Hero />
      <Features />
      <Philosophy />
      <CallToAction />

      {/* Footer */}
      <footer className="bg-card py-12 border-t border-border">
        <div className="container px-4">
          <div className="max-w-6xl mx-auto">
            <div className="flex flex-col md:flex-row justify-between items-center gap-6">
              <div className="text-center md:text-left">
                <h3 className="text-2xl font-bold mb-2">IM Life Review</h3>
                <p className="text-sm text-muted-foreground">Powered by PEACE OS</p>
              </div>

              <div className="flex gap-8 text-sm text-muted-foreground">
                <button onClick={() => navigate('/demo')} className="hover:text-foreground transition-colors">
                  {hasSession ? 'Continue Session' : 'Try Demo'}
                </button>
                {hasSession && (
                  <button onClick={() => navigate('/dashboard')} className="hover:text-foreground transition-colors">
                    Dashboard
                  </button>
                )}
                <a href="#" className="hover:text-foreground transition-colors">Privacy</a>
                <a href="#" className="hover:text-foreground transition-colors">Contact</a>
              </div>
            </div>

            <div className="mt-8 pt-8 border-t border-border text-center text-sm text-muted-foreground">
              <p>© 2025 IM. All rights reserved.</p>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Index;
