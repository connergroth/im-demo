import { Progress } from "@/components/ui/progress";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  Heart, 
  Users, 
  Lightbulb, 
  TrendingUp, 
  Sparkles, 
  Target,
  Brain,
  Shield,
  BookOpen
} from "lucide-react";

interface SessionAnalysisProps {
  analysis: {
    core_themes: string[];
    personality_insights: string;
    emotional_landscape: string;
    key_relationships: string;
    values_and_beliefs: string;
    life_trajectory: string;
    strengths: string;
    care_recommendations: string;
    metrics: {
      emotional_expressiveness: number;
      life_satisfaction: number;
      social_connectedness: number;
      resilience: number;
      optimism: number;
      introspection: number;
    };
  };
  sessionData?: Array<{
    question: string;
    answer: string;
  }>;
  sessionsCount?: number;
  answersCount?: number;
}

export function SessionAnalysis({ analysis, sessionData, sessionsCount, answersCount }: SessionAnalysisProps) {
  const metrics = [
    {
      name: "Emotional Expressiveness",
      value: analysis.metrics.emotional_expressiveness,
      icon: Heart,
      color: "text-pink-500",
      bgColor: "bg-pink-500/10",
    },
    {
      name: "Life Satisfaction",
      value: analysis.metrics.life_satisfaction,
      icon: Sparkles,
      color: "text-yellow-500",
      bgColor: "bg-yellow-500/10",
    },
    {
      name: "Social Connectedness",
      value: analysis.metrics.social_connectedness,
      icon: Users,
      color: "text-blue-500",
      bgColor: "bg-blue-500/10",
    },
    {
      name: "Resilience",
      value: analysis.metrics.resilience,
      icon: Shield,
      color: "text-green-500",
      bgColor: "bg-green-500/10",
    },
    {
      name: "Optimism",
      value: analysis.metrics.optimism,
      icon: TrendingUp,
      color: "text-purple-500",
      bgColor: "bg-purple-500/10",
    },
    {
      name: "Introspection",
      value: analysis.metrics.introspection,
      icon: Brain,
      color: "text-indigo-500",
      bgColor: "bg-indigo-500/10",
    },
  ];

  return (
    <div className="max-w-6xl mx-auto space-y-12">
      {/* Section Header */}
      <div className="text-center space-y-4">
        <div className="inline-block">
          <span className="text-xs font-light tracking-[0.3em] text-foreground/60 uppercase">
            Comprehensive Analysis
          </span>
        </div>
        <h2 className="text-4xl md:text-5xl font-bold tracking-tight leading-tight">
          Your Life Review Insights
        </h2>
        <p className="text-muted-foreground font-light max-w-2xl mx-auto leading-relaxed">
          A deep analysis of your complete session, revealing patterns, strengths, and meaningful connections
        </p>
      </div>

      {/* Core Themes */}
      <Card className="border-primary/20 shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-2xl">
            <Target className="h-6 w-6 text-primary" />
            Core Themes
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-3">
            {analysis.core_themes.map((theme, index) => (
              <div
                key={index}
                className="px-6 py-3 bg-gradient-to-br from-primary/10 to-primary/5 rounded-full border border-primary/20 text-sm font-medium"
              >
                {theme}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Metrics Section */}
      <div className="space-y-6">
        <div className="text-center space-y-2">
          <div className="inline-block">
            <span className="text-xs font-light tracking-[0.3em] text-foreground/60 uppercase">
              Personal Metrics
            </span>
          </div>
          <h3 className="text-3xl font-bold tracking-tight">Your Profile Scores</h3>
          <p className="text-muted-foreground font-light max-w-xl mx-auto">
            Based on your responses and communication style
          </p>
        </div>

        {/* Metrics Grid - Inline Style */}
        <div className="max-w-3xl mx-auto space-y-3">
        {metrics.map((metric) => {
          const Icon = metric.icon;
          return (
            <div key={metric.name} className="flex items-center gap-4 p-4 bg-gradient-to-r from-primary/5 to-transparent rounded-xl border border-primary/10 hover:shadow-md transition-all duration-300">
              <div className={`p-3 rounded-xl ${metric.bgColor} flex-shrink-0`}>
                <Icon className={`h-5 w-5 ${metric.color}`} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-3 mb-2">
                  <p className="text-sm font-medium text-foreground/80 truncate">{metric.name}</p>
                  <span className="text-lg font-bold text-foreground flex-shrink-0">{metric.value}</span>
                </div>
                <Progress value={metric.value} className="h-2" />
              </div>
            </div>
          );
        })}
        </div>
      </div>

      {/* Detailed Insights Section */}
      <div className="space-y-6">
        <div className="text-center space-y-2">
          <div className="inline-block">
            <span className="text-xs font-light tracking-[0.3em] text-foreground/60 uppercase">
              Deep Insights
            </span>
          </div>
          <h3 className="text-3xl font-bold tracking-tight">Understanding You Better</h3>
          <p className="text-muted-foreground font-light max-w-xl mx-auto">
            Comprehensive analysis of your personality, relationships, and life journey
          </p>
        </div>

        {/* Insights Grid */}
        <div className="grid md:grid-cols-2 gap-6">
        {/* Personality Insights */}
        <Card className="border-border/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Brain className="h-5 w-5 text-primary" />
              Personality Insights
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-foreground/80 font-light leading-relaxed">
              {analysis.personality_insights}
            </p>
          </CardContent>
        </Card>

        {/* Emotional Landscape */}
        <Card className="border-border/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Heart className="h-5 w-5 text-primary" />
              Emotional Landscape
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-foreground/80 font-light leading-relaxed">
              {analysis.emotional_landscape}
            </p>
          </CardContent>
        </Card>

        {/* Key Relationships */}
        <Card className="border-border/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5 text-primary" />
              Key Relationships
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-foreground/80 font-light leading-relaxed">
              {analysis.key_relationships}
            </p>
          </CardContent>
        </Card>

        {/* Values & Beliefs */}
        <Card className="border-border/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5 text-primary" />
              Values & Beliefs
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-foreground/80 font-light leading-relaxed">
              {analysis.values_and_beliefs}
            </p>
          </CardContent>
        </Card>

        {/* Life Trajectory */}
        <Card className="border-border/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-primary" />
              Life Trajectory
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-foreground/80 font-light leading-relaxed">
              {analysis.life_trajectory}
            </p>
          </CardContent>
        </Card>

        {/* Strengths */}
        <Card className="border-border/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-primary" />
              Strengths
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-foreground/80 font-light leading-relaxed">
              {analysis.strengths}
            </p>
          </CardContent>
        </Card>
        </div>
      </div>

      {/* Care Recommendations - Full Width */}
      <Card className="border-primary/20 shadow-lg bg-gradient-to-br from-primary/5 to-primary/10">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-2xl">
            <Lightbulb className="h-6 w-6 text-primary" />
            Care Recommendations
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-foreground/80 font-light leading-relaxed text-lg">
            {analysis.care_recommendations}
          </p>
        </CardContent>
      </Card>

      {/* Your Story So Far - Session Transcript */}
      {sessionData && sessionData.length > 0 && (
        <div className="space-y-8">
          <div className="text-center space-y-2">
            <div className="inline-block">
              <span className="text-xs font-light tracking-[0.3em] text-foreground/60 uppercase">
                Complete Transcript
              </span>
            </div>
            <h3 className="text-3xl font-bold tracking-tight">Your Story So Far</h3>
            <p className="text-muted-foreground font-light max-w-xl mx-auto">
              The full conversation from your life review session
            </p>
          </div>

          {/* Stats Inside Story Section */}
          {(sessionsCount !== undefined || answersCount !== undefined) && (
            <div className="max-w-3xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
              {sessionsCount !== undefined && (
                <div className="text-center p-6 bg-gradient-to-br from-primary/10 to-primary/5 rounded-2xl border border-primary/10">
                  <div className="text-5xl font-bold text-primary mb-1">{sessionsCount}</div>
                  <div className="text-sm font-light text-muted-foreground tracking-wide">Sessions Completed</div>
                </div>
              )}
              {answersCount !== undefined && (
                <div className="text-center p-6 bg-gradient-to-br from-primary/10 to-primary/5 rounded-2xl border border-primary/10">
                  <div className="text-5xl font-bold text-primary mb-1">{answersCount}</div>
                  <div className="text-sm font-light text-muted-foreground tracking-wide">Stories Shared</div>
                </div>
              )}
            </div>
          )}

          <div className="max-w-4xl mx-auto space-y-6">
            {sessionData.map((qa, index) => (
              <Card key={index} className="border-border/50 bg-card/50">
                <CardHeader>
                  <div className="flex items-start gap-3">
                    <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                      <span className="text-sm font-semibold text-primary">{index + 1}</span>
                    </div>
                    <div className="flex-1">
                      <CardTitle className="text-base font-medium text-foreground/80 mb-3">
                        {qa.question}
                      </CardTitle>
                      <div className="pl-4 border-l-2 border-primary/20">
                        <p className="text-foreground/90 font-light leading-relaxed">
                          {qa.answer}
                        </p>
                      </div>
                    </div>
                  </div>
                </CardHeader>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

