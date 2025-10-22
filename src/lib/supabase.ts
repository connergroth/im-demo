import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('Supabase credentials not found. Please set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in .env.local');
}

export const supabase = createClient(supabaseUrl || '', supabaseAnonKey || '');

// Database types for type safety
export type Database = {
  public: {
    Tables: {
      guest_sessions: {
        Row: {
          id: string;
          created_at: string;
          last_active: string;
          metadata: Record<string, any>;
        };
        Insert: {
          id?: string;
          created_at?: string;
          last_active?: string;
          metadata?: Record<string, any>;
        };
        Update: {
          id?: string;
          created_at?: string;
          last_active?: string;
          metadata?: Record<string, any>;
        };
      };
      profiles: {
        Row: {
          user_id: string;
          display_name: string | null;
          birth_year: number | null;
          last_generated_at: string | null;
          values_json: Record<string, number>;
          motivations_json: Record<string, number>;
          archetypes_json: Record<string, number>;
          barriers_json: Record<string, number>;
          tone_json: Record<string, any>;
          human_summary: string | null;
        };
        Insert: {
          user_id: string;
          display_name?: string | null;
          birth_year?: number | null;
          last_generated_at?: string | null;
          values_json?: Record<string, number>;
          motivations_json?: Record<string, number>;
          archetypes_json?: Record<string, number>;
          barriers_json?: Record<string, number>;
          tone_json?: Record<string, any>;
          human_summary?: string | null;
        };
        Update: {
          user_id?: string;
          display_name?: string | null;
          birth_year?: number | null;
          last_generated_at?: string | null;
          values_json?: Record<string, number>;
          motivations_json?: Record<string, number>;
          archetypes_json?: Record<string, number>;
          barriers_json?: Record<string, number>;
          tone_json?: Record<string, any>;
          human_summary?: string | null;
        };
      };
      sessions: {
        Row: {
          id: string;
          user_id: string | null; // nullable for guest sessions
          channel: 'voice' | 'chat';
          started_at: string;
          ended_at: string | null;
        };
        Insert: {
          id?: string;
          user_id?: string | null; // nullable for guest sessions
          channel?: 'voice' | 'chat';
          started_at?: string;
          ended_at?: string | null;
        };
        Update: {
          id?: string;
          user_id?: string | null;
          channel?: 'voice' | 'chat';
          started_at?: string;
          ended_at?: string | null;
        };
      };
      questions: {
        Row: {
          id: string;
          slug: string | null;
          prompt: string;
          kind: 'text' | 'multi' | 'scale' | 'boolean';
          category: string | null;
          sort_index: number | null;
          is_active: boolean | null;
        };
      };
      answers: {
        Row: {
          id: string;
          session_id: string;
          user_id: string | null; // nullable for guest sessions
          question_id: string;
          answer_text: string | null;
          option_id: string | null;
          answer_numeric: number | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          session_id: string;
          user_id?: string | null; // nullable for guest sessions
          question_id: string;
          answer_text?: string | null;
          option_id?: string | null;
          answer_numeric?: number | null;
          created_at?: string;
        };
      };
      transcripts: {
        Row: {
          id: string;
          session_id: string;
          user_id: string | null; // nullable for guest sessions
          language: string | null;
          text: string | null;
          raw_json: Record<string, any> | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          session_id: string;
          user_id?: string | null; // nullable for guest sessions
          language?: string | null;
          text?: string | null;
          raw_json?: Record<string, any> | null;
          created_at?: string;
        };
      };
      nlp_extractions: {
        Row: {
          id: string;
          user_id: string | null; // nullable for guest sessions
          session_id: string | null;
          source_type: 'answer' | 'transcript';
          source_id: string | null;
          entities: Record<string, any>;
          sentiment: number | null;
          values_json: Record<string, number>;
          motivations_json: Record<string, number>;
          archetypes_json: Record<string, number>;
          barriers_json: Record<string, number>;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id?: string | null; // nullable for guest sessions
          session_id?: string | null;
          source_type: 'answer' | 'transcript';
          source_id?: string | null;
          entities?: Record<string, any>;
          sentiment?: number | null;
          values_json?: Record<string, number>;
          motivations_json?: Record<string, number>;
          archetypes_json?: Record<string, number>;
          barriers_json?: Record<string, number>;
          created_at?: string;
        };
      };
    };
    Views: {
      v_profile_dashboard: {
        Row: {
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
        };
      };
    };
    Functions: {
      recompute_profile: {
        Args: { target_user: string };
        Returns: Record<string, any>;
      };
    };
  };
};
