import { Progress } from "@/components/ui/progress";
import { TrendingUp, Heart, Target, Sparkles, MessageCircle } from "lucide-react";

interface MetricsSectionProps {
  valuesJson: Record<string, number>;
  motivationsJson: Record<string, number>;
  archetypesJson: Record<string, number>;
  avgSentiment: number | null;
  sessions: Array<{
    id: string;
    started_at: string;
    ended_at: string | null;
    channel: string;
  }>;
}

export function MetricsSection({
  valuesJson,
  motivationsJson,
  archetypesJson,
  avgSentiment,
  sessions,
}: MetricsSectionProps) {
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getSentimentLabel = (sentiment: number | null) => {
    if (sentiment === null) return 'Neutral';
    if (sentiment > 0.3) return 'Positive';
    if (sentiment < -0.3) return 'Reflective';
    return 'Balanced';
  };

  const getSentimentGradient = (sentiment: number | null) => {
    if (sentiment === null) return 'from-gray-500/10 to-gray-600/10';
    if (sentiment > 0.3) return 'from-green-500/10 to-emerald-600/10';
    if (sentiment < -0.3) return 'from-blue-500/10 to-indigo-600/10';
    return 'from-gray-500/10 to-gray-600/10';
  };

  const hasData = Object.keys(valuesJson || {}).length > 0 ||
                  Object.keys(motivationsJson || {}).length > 0 ||
                  Object.keys(archetypesJson || {}).length > 0;

  return (
    <div className="max-w-6xl mx-auto space-y-16">
      {/* Section Header */}
      <div className="text-center space-y-4">
        <div className="inline-block">
          <span className="text-xs font-light tracking-[0.3em] text-foreground/60 uppercase">Insights</span>
        </div>
        <h2 className="text-4xl md:text-5xl font-bold tracking-tight leading-tight">
          Discover Your Patterns
        </h2>
      </div>

      {/* Sentiment Overview - Hero Style */}
      <div className={`text-center p-12 bg-gradient-to-br ${getSentimentGradient(avgSentiment)} rounded-3xl border border-primary/10`}>
        <div className="inline-flex items-center gap-2 text-sm font-light text-foreground/60 mb-4">
          <TrendingUp className="h-4 w-4" />
          <span className="tracking-wide">Overall Tone</span>
        </div>
        <div className="text-5xl font-bold mb-2">{getSentimentLabel(avgSentiment)}</div>
        {avgSentiment !== null && (
          <div className="text-sm text-muted-foreground font-light">
            Sentiment Score: {(avgSentiment * 100).toFixed(0)}
          </div>
        )}
      </div>

      {/* Values, Motivations, Archetypes */}
      {hasData ? (
        <div className="grid md:grid-cols-3 gap-8">
          {/* Core Values */}
          {Object.entries(valuesJson || {}).length > 0 && (
            <div className="space-y-6">
              <div className="text-center space-y-2">
                <Heart className="h-8 w-8 text-primary mx-auto" />
                <h3 className="text-2xl font-bold">Core Values</h3>
                <p className="text-sm text-muted-foreground font-light">What matters most</p>
              </div>
              <div className="space-y-4">
                {Object.entries(valuesJson)
                  .sort(([, a], [, b]) => b - a)
                  .slice(0, 5)
                  .map(([value, score]) => (
                    <div key={value} className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="font-medium capitalize">{value}</span>
                        <span className="text-muted-foreground">{Math.round(score * 100)}%</span>
                      </div>
                      <Progress value={score * 100} className="h-2" />
                    </div>
                  ))}
              </div>
            </div>
          )}

          {/* Motivations */}
          {Object.entries(motivationsJson || {}).length > 0 && (
            <div className="space-y-6">
              <div className="text-center space-y-2">
                <Target className="h-8 w-8 text-primary mx-auto" />
                <h3 className="text-2xl font-bold">Motivations</h3>
                <p className="text-sm text-muted-foreground font-light">How you approach goals</p>
              </div>
              <div className="space-y-4">
                {Object.entries(motivationsJson)
                  .sort(([, a], [, b]) => b - a)
                  .map(([motivation, score]) => (
                    <div key={motivation} className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="font-medium capitalize">{motivation}</span>
                        <span className="text-muted-foreground">{Math.round(score * 100)}%</span>
                      </div>
                      <Progress value={score * 100} className="h-2" />
                    </div>
                  ))}
              </div>
            </div>
          )}

          {/* Archetypes */}
          {Object.entries(archetypesJson || {}).length > 0 && (
            <div className="space-y-6">
              <div className="text-center space-y-2">
                <Sparkles className="h-8 w-8 text-primary mx-auto" />
                <h3 className="text-2xl font-bold">Archetypes</h3>
                <p className="text-sm text-muted-foreground font-light">Your personality patterns</p>
              </div>
              <div className="space-y-4">
                {Object.entries(archetypesJson)
                  .sort(([, a], [, b]) => b - a)
                  .slice(0, 5)
                  .map(([archetype, score]) => (
                    <div key={archetype} className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="font-medium capitalize">{archetype}</span>
                        <span className="text-muted-foreground">{Math.round(score * 100)}%</span>
                      </div>
                      <Progress value={score * 100} className="h-2" />
                    </div>
                  ))}
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="text-center py-16 space-y-4">
          <p className="text-muted-foreground font-light text-lg max-w-xl mx-auto leading-relaxed">
            Complete more sessions to unlock deeper insights about your values, motivations, and personality patterns.
          </p>
        </div>
      )}

      {/* Session History */}
      {sessions.length > 0 && (
        <div className="space-y-6">
          <div className="text-center space-y-2">
            <MessageCircle className="h-8 w-8 text-primary mx-auto" />
            <h3 className="text-2xl font-bold">Your Sessions</h3>
            <p className="text-sm text-muted-foreground font-light">Journey timeline</p>
          </div>
          <div className="max-w-2xl mx-auto space-y-3">
            {sessions.slice(0, 5).map((session) => (
              <div
                key={session.id}
                className="flex items-center justify-between p-4 bg-gradient-to-r from-primary/5 to-primary/10 rounded-2xl border border-primary/10 hover:shadow-lg transition-all duration-300"
              >
                <div className="flex items-center gap-3">
                  <div className={`w-3 h-3 rounded-full ${
                    session.ended_at ? 'bg-green-500' : 'bg-yellow-500'
                  }`} />
                  <span className="text-sm font-medium capitalize">{session.channel} Session</span>
                </div>
                <span className="text-xs text-muted-foreground font-light">
                  {formatDate(session.started_at)}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
