import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Loader2, PlayCircle, Home } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { getGuestId } from "@/lib/guestSession";
import { ProfileOverview } from "@/components/dashboard/ProfileOverview";
import { MetricsSection } from "@/components/dashboard/MetricsSection";
import { SessionAnalysis } from "@/components/dashboard/SessionAnalysis";
import { apiClient } from "@/lib/api-client";

interface DashboardData {
  user_id: string;
  display_name: string;
  sessions_count: number;
  answers_count: number;
  last_session_end: string | null;
  avg_sentiment: number | null;
  values_json: Record<string, number>;
  motivations_json: Record<string, number>;
  archetypes_json: Record<string, number>;
  barriers_json: Record<string, number>;
  tone_json: Record<string, any>;
  human_summary: string | null;
  last_generated_at: string | null;
}

interface Session {
  id: string;
  user_id: string;
  channel: string;
  started_at: string;
  ended_at: string | null;
}

const Dashboard = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [sessionAnalysis, setSessionAnalysis] = useState<any | null>(null);
  const [analyzingSession, setAnalyzingSession] = useState(false);
  const [sessionTranscript, setSessionTranscript] = useState<Array<{question: string, answer: string}>>([]);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    const guestId = getGuestId();

    if (!guestId) {
      setError('No guest session found. Please start a demo session first.');
      setLoading(false);
      return;
    }

    try {
      // Load dashboard view data
      const { data: viewData, error: viewError } = await supabase
        .from('v_profile_dashboard')
        .select('*')
        .eq('user_id', guestId)
        .single();

      if (viewError) {
        console.error('Error loading dashboard view:', viewError);
        // If view doesn't exist or no data, load basic profile data
        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .select('*')
          .eq('user_id', guestId)
          .single();

        if (profileError && profileError.code !== 'PGRST116') {
          throw profileError;
        }

        // Set default data if no profile exists yet
        setDashboardData({
          user_id: guestId,
          display_name: '',
          sessions_count: 0,
          answers_count: 0,
          last_session_end: null,
          avg_sentiment: null,
          values_json: {},
          motivations_json: {},
          archetypes_json: {},
          barriers_json: {},
          tone_json: {},
          human_summary: null,
          last_generated_at: null,
          ...profileData,
        });
      } else {
        setDashboardData(viewData);
      }

      // Load sessions separately
      const { data: sessionsData, error: sessionsError } = await supabase
        .from('sessions')
        .select('*')
        .eq('user_id', guestId)
        .order('started_at', { ascending: false })
        .limit(10);

      if (sessionsError) {
        console.error('Error loading sessions:', sessionsError);
      } else {
        setSessions(sessionsData || []);
        
        // If we have sessions, analyze the most recent session (completed or in-progress)
        if (sessionsData && sessionsData.length > 0) {
          // Try to find a completed session first, then fall back to any session
          const lastSession = sessionsData.find(s => s.ended_at !== null) || sessionsData[0];
          if (lastSession) {
            analyzeSessionData(lastSession.id);
          }
        }
      }

    } catch (err) {
      console.error('Error loading dashboard:', err);
      setError('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const analyzeSessionData = async (sessionId: string) => {
    setAnalyzingSession(true);
    try {
      // Fetch all answers for this session
      const { data: answers, error: answersError } = await supabase
        .from('answers')
        .select(`
          answer_text,
          questions (prompt)
        `)
        .eq('session_id', sessionId)
        .order('created_at', { ascending: true });

      if (answersError) {
        console.error('Error fetching answers:', answersError);
        return;
      }

      // Generate analysis even with just 1 answer
      if (!answers || answers.length === 0) {
        console.log('No answers found for session');
        return;
      }

      console.log(`Analyzing session with ${answers.length} answer(s)`);

      // Format the session data for analysis
      const sessionData = answers.map((a: any) => ({
        question: a.questions?.prompt || 'Unknown question',
        answer: a.answer_text
      }));

      // Store the transcript for display
      setSessionTranscript(sessionData);

      // Call the backend API for comprehensive analysis
      const result = await apiClient.analyzeSession(sessionData);
      
      if (result.success && result.analysis) {
        setSessionAnalysis(result.analysis);
        console.log('Session analysis complete');
      }

    } catch (err) {
      console.error('Error analyzing session:', err);
      // Don't show error to user - analysis is optional
    } finally {
      setAnalyzingSession(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center animate-fade-in">
          <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto mb-4" />
          <p className="text-muted-foreground font-light">Loading your insights...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center max-w-xl mx-auto px-6 space-y-6 animate-fade-in">
          <h2 className="text-3xl font-bold">Welcome to Your Life Review</h2>
          <p className="text-muted-foreground font-light leading-relaxed">{error}</p>
          <Button
            onClick={() => navigate('/demo')}
            size="lg"
            className="px-10 py-7 text-lg rounded-full shadow-lg hover:shadow-xl transition-all duration-300 font-medium"
          >
            <PlayCircle className="mr-2 h-5 w-5" />
            Begin Your Journey
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Minimal Top Navigation */}
      <nav className="border-b border-border/50 bg-background/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <button
              onClick={() => navigate('/')}
              className="text-sm font-light tracking-[0.3em] text-foreground/60 hover:text-foreground transition-colors"
            >
              IM
            </button>
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate('/')}
                className="text-sm font-light"
              >
                <Home className="mr-2 h-4 w-4" />
                Home
              </Button>
              <Button
                size="sm"
                onClick={() => navigate('/demo')}
                className="text-sm font-medium rounded-full"
              >
                <PlayCircle className="mr-2 h-4 w-4" />
                Continue
              </Button>
            </div>
          </div>
        </div>
      </nav>


      {/* Content Area */}
      <div className="container mx-auto px-4 py-12 space-y-16">
        {/* Session Analysis with Loading State */}
        {analyzingSession && (
          <div className="animate-fade-in" style={{ animationDelay: '100ms' }}>
            <div className="max-w-6xl mx-auto text-center py-20 space-y-6">
              <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto mb-4" />
              <h3 className="text-2xl font-bold">Analyzing Your Session</h3>
              <p className="text-muted-foreground font-light max-w-xl mx-auto leading-relaxed">
                Our AI is carefully reviewing your responses to generate deep, personalized insights. This will just take a moment...
              </p>
            </div>
          </div>
        )}

        {/* Session Analysis Results */}
        {sessionAnalysis && !analyzingSession && (
          <div className="animate-fade-in" style={{ animationDelay: '150ms' }}>
            <SessionAnalysis 
              analysis={sessionAnalysis} 
              sessionData={sessionTranscript}
              sessionsCount={dashboardData?.sessions_count}
              answersCount={dashboardData?.answers_count}
            />
          </div>
        )}

        {/* Metrics Section - Only show if no session analysis available */}
        {dashboardData && !sessionAnalysis && !analyzingSession && (
          <div className="animate-fade-in" style={{ animationDelay: '200ms' }}>
            <MetricsSection
              valuesJson={dashboardData.values_json}
              motivationsJson={dashboardData.motivations_json}
              archetypesJson={dashboardData.archetypes_json}
              avgSentiment={dashboardData.avg_sentiment}
              sessions={sessions}
            />
          </div>
        )}

        {/* Empty State */}
        {dashboardData && dashboardData.sessions_count === 0 && (
          <div className="text-center py-20 space-y-6 animate-fade-in">
            <h3 className="text-3xl font-bold">Your Story Awaits</h3>
            <p className="text-muted-foreground font-light max-w-xl mx-auto leading-relaxed">
              Begin your life review journey to discover insights about your experiences and values.
            </p>
            <Button
              onClick={() => navigate('/demo')}
              size="lg"
              className="px-10 py-7 text-lg rounded-full shadow-lg hover:shadow-xl transition-all duration-300 font-medium"
            >
              <PlayCircle className="mr-2 h-5 w-5" />
              Start Your First Session
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;
