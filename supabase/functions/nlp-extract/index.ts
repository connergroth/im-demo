// Supabase Edge Function for NLP Extraction
// This function extracts sentiment, entities, and psychographic cues from user responses

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ExtractRequest {
  user_id: string;
  session_id: string;
  source_type: 'answer' | 'transcript';
  source_id: string;
  text: string;
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { user_id, session_id, source_type, source_id, text }: ExtractRequest = await req.json();

    if (!user_id || !text) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Simple sentiment analysis (keyword-based for MVP)
    const sentiment = analyzeSentiment(text);

    // Extract entities (people, places)
    const entities = extractEntities(text);

    // Extract value cues
    const values_json = extractValues(text);

    // Extract motivation cues
    const motivations_json = extractMotivations(text);

    // Extract archetype cues
    const archetypes_json = extractArchetypes(text);

    // Extract barrier cues
    const barriers_json = extractBarriers(text);

    // Save NLP extraction to database
    const { error: nlpError } = await supabaseClient
      .from('nlp_extractions')
      .insert({
        user_id,
        session_id,
        source_type,
        source_id,
        entities,
        sentiment,
        values_json,
        motivations_json,
        archetypes_json,
        barriers_json,
      });

    if (nlpError) {
      console.error('Error saving NLP extraction:', nlpError);
      return new Response(
        JSON.stringify({ error: 'Failed to save NLP extraction' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Trigger profile recomputation
    const { error: rpcError } = await supabaseClient.rpc('recompute_profile', {
      target_user: user_id,
    });

    if (rpcError) {
      console.error('Error recomputing profile:', rpcError);
    }

    return new Response(
      JSON.stringify({
        success: true,
        sentiment,
        entities,
        values_json,
        motivations_json,
        archetypes_json,
        barriers_json,
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Edge function error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

// Simple sentiment analysis using keyword matching
function analyzeSentiment(text: string): number {
  const lowerText = text.toLowerCase();

  const positiveWords = [
    'happy', 'joy', 'love', 'proud', 'amazing', 'wonderful', 'great', 'excellent',
    'fantastic', 'blessed', 'grateful', 'thankful', 'beautiful', 'success', 'accomplish',
    'overcome', 'achieve', 'win', 'best', 'favorite', 'enjoy', 'smile', 'laugh'
  ];

  const negativeWords = [
    'sad', 'difficult', 'hard', 'struggle', 'pain', 'hurt', 'challenge', 'loss',
    'fear', 'worry', 'stress', 'angry', 'frustrated', 'disappointed', 'regret',
    'fail', 'terrible', 'awful', 'bad', 'worst', 'hate', 'alone', 'lonely'
  ];

  let positiveCount = 0;
  let negativeCount = 0;

  positiveWords.forEach(word => {
    if (lowerText.includes(word)) positiveCount++;
  });

  negativeWords.forEach(word => {
    if (lowerText.includes(word)) negativeCount++;
  });

  const total = positiveCount + negativeCount;
  if (total === 0) return 0;

  return (positiveCount - negativeCount) / total;
}

// Extract entities (simplified version)
function extractEntities(text: string): Record<string, any> {
  // Simple extraction - look for capitalized words as potential names/places
  const capitalizedWords = text.match(/\b[A-Z][a-z]+(?:\s+[A-Z][a-z]+)?\b/g) || [];

  return {
    people: capitalizedWords.slice(0, 5), // Take first 5 as potential names
    places: [],
    organizations: [],
  };
}

// Extract value cues
function extractValues(text: string): Record<string, number> {
  const lowerText = text.toLowerCase();
  const values: Record<string, number> = {};

  const valueKeywords = {
    family: ['family', 'children', 'kids', 'spouse', 'parent', 'mother', 'father', 'brother', 'sister'],
    independence: ['independent', 'freedom', 'autonomy', 'self', 'own', 'myself'],
    achievement: ['accomplish', 'achieve', 'success', 'goal', 'proud', 'win', 'complete'],
    connection: ['friend', 'relationship', 'together', 'community', 'connect', 'belong'],
    creativity: ['create', 'art', 'music', 'paint', 'write', 'design', 'imagine'],
    health: ['health', 'wellness', 'exercise', 'fitness', 'active', 'energy'],
    learning: ['learn', 'education', 'knowledge', 'study', 'school', 'teach', 'discover'],
  };

  Object.entries(valueKeywords).forEach(([value, keywords]) => {
    let count = 0;
    keywords.forEach(keyword => {
      if (lowerText.includes(keyword)) count++;
    });
    if (count > 0) {
      values[value] = Math.min(count / 3, 1); // Normalize to 0-1
    }
  });

  return values;
}

// Extract motivation cues (approach vs. avoidance)
function extractMotivations(text: string): Record<string, number> {
  const lowerText = text.toLowerCase();

  const approachWords = ['achieve', 'gain', 'pursue', 'goal', 'aspire', 'want', 'hope', 'dream'];
  const avoidanceWords = ['avoid', 'prevent', 'protect', 'safe', 'careful', 'worry', 'fear', 'risk'];

  let approachCount = 0;
  let avoidanceCount = 0;

  approachWords.forEach(word => {
    if (lowerText.includes(word)) approachCount++;
  });

  avoidanceWords.forEach(word => {
    if (lowerText.includes(word)) avoidanceCount++;
  });

  return {
    approach: Math.min(approachCount / 3, 1),
    avoidance: Math.min(avoidanceCount / 3, 1),
  };
}

// Extract archetype cues
function extractArchetypes(text: string): Record<string, number> {
  const lowerText = text.toLowerCase();
  const archetypes: Record<string, number> = {};

  const archetypeKeywords = {
    caregiver: ['care', 'help', 'support', 'nurture', 'protect', 'family', 'children'],
    explorer: ['explore', 'adventure', 'travel', 'discover', 'new', 'experience', 'journey'],
    creator: ['create', 'build', 'make', 'design', 'art', 'craft', 'innovate'],
    sage: ['learn', 'wisdom', 'knowledge', 'understand', 'think', 'reflect', 'study'],
    hero: ['overcome', 'challenge', 'achieve', 'succeed', 'victory', 'courage', 'brave'],
  };

  Object.entries(archetypeKeywords).forEach(([archetype, keywords]) => {
    let count = 0;
    keywords.forEach(keyword => {
      if (lowerText.includes(keyword)) count++;
    });
    if (count > 0) {
      archetypes[archetype] = Math.min(count / 3, 1);
    }
  });

  return archetypes;
}

// Extract barrier cues
function extractBarriers(text: string): Record<string, number> {
  const lowerText = text.toLowerCase();
  const barriers: Record<string, number> = {};

  const barrierKeywords = {
    tech_anxiety: ['technology', 'computer', 'phone', 'difficult', 'confusing', 'complicated'],
    physical_limitation: ['pain', 'mobility', 'walk', 'move', 'tired', 'energy', 'health'],
    social_isolation: ['alone', 'lonely', 'isolated', 'miss', 'distance', 'away'],
    memory: ['forget', 'remember', 'memory', 'recall', 'confused'],
  };

  Object.entries(barrierKeywords).forEach(([barrier, keywords]) => {
    let count = 0;
    keywords.forEach(keyword => {
      if (lowerText.includes(keyword)) count++;
    });
    if (count > 0) {
      barriers[barrier] = Math.min(count / 3, 1);
    }
  });

  return barriers;
}
