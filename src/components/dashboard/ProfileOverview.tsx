import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { User, Calendar, MessageSquare } from "lucide-react";

interface ProfileOverviewProps {
  displayName: string | null;
  sessionsCount: number;
  answersCount: number;
  lastSessionEnd: string | null;
  humanSummary: string | null;
  valuesJson: Record<string, number>;
  archetypesJson: Record<string, number>;
}

export function ProfileOverview({
  displayName,
  sessionsCount,
  answersCount,
  lastSessionEnd,
  humanSummary,
  valuesJson,
  archetypesJson,
}: ProfileOverviewProps) {
  // Get top value
  const topValue = Object.entries(valuesJson || {})
    .sort(([, a], [, b]) => b - a)[0];

  // Get top archetype
  const topArchetype = Object.entries(archetypesJson || {})
    .sort(([, a], [, b]) => b - a)[0];

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'Never';
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header Section */}
      <div className="text-center space-y-4 mb-12">
        <div className="inline-block">
          <span className="text-xs font-light tracking-[0.3em] text-foreground/60 uppercase">Session Summary</span>
        </div>
        <h2 className="text-4xl md:text-5xl font-bold tracking-tight leading-tight">
          Your Profile
        </h2>
        {lastSessionEnd && (
          <p className="text-sm text-muted-foreground font-light flex items-center gap-2 justify-center">
            <Calendar className="h-4 w-4" />
            Last session: {formatDate(lastSessionEnd)}
          </p>
        )}
      </div>

      {/* Stats - Floating Style */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
        <div className="text-center p-8 bg-gradient-to-br from-primary/10 to-primary/5 rounded-3xl border border-primary/10 hover:shadow-lg transition-all duration-300">
          <div className="text-6xl font-bold text-primary mb-2">{sessionsCount}</div>
          <div className="text-sm font-light text-muted-foreground tracking-wide">Sessions Completed</div>
        </div>
        <div className="text-center p-8 bg-gradient-to-br from-primary/10 to-primary/5 rounded-3xl border border-primary/10 hover:shadow-lg transition-all duration-300">
          <div className="text-6xl font-bold text-primary mb-2">{answersCount}</div>
          <div className="text-sm font-light text-muted-foreground tracking-wide">Stories Shared</div>
        </div>
      </div>

    </div>
  );
}
