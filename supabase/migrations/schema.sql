-- WARNING: This schema is for context only and is not meant to be run.
-- Table order and constraints may not be valid for execution.

CREATE TABLE public.answers (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  session_id uuid NOT NULL,
  user_id uuid,
  question_id uuid NOT NULL,
  answer_text text,
  option_id uuid,
  answer_numeric numeric,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT answers_pkey PRIMARY KEY (id),
  CONSTRAINT answers_session_id_fkey FOREIGN KEY (session_id) REFERENCES public.sessions(id),
  CONSTRAINT answers_question_id_fkey FOREIGN KEY (question_id) REFERENCES public.questions(id),
  CONSTRAINT answers_option_id_fkey FOREIGN KEY (option_id) REFERENCES public.question_options(id)
);
CREATE TABLE public.guest_sessions (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  created_at timestamp with time zone DEFAULT now(),
  last_active timestamp with time zone DEFAULT now(),
  metadata jsonb DEFAULT '{}'::jsonb,
  CONSTRAINT guest_sessions_pkey PRIMARY KEY (id)
);
CREATE TABLE public.nlp_extractions (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  user_id uuid,
  session_id uuid,
  source_type text NOT NULL CHECK (source_type = ANY (ARRAY['answer'::text, 'transcript'::text])),
  source_id uuid,
  entities jsonb DEFAULT '{}'::jsonb,
  sentiment numeric,
  values_json jsonb DEFAULT '{}'::jsonb,
  motivations_json jsonb DEFAULT '{}'::jsonb,
  archetypes_json jsonb DEFAULT '{}'::jsonb,
  barriers_json jsonb DEFAULT '{}'::jsonb,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT nlp_extractions_pkey PRIMARY KEY (id),
  CONSTRAINT nlp_extractions_session_id_fkey FOREIGN KEY (session_id) REFERENCES public.sessions(id)
);
CREATE TABLE public.profile_snapshots (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  user_id uuid,
  taken_at timestamp with time zone NOT NULL DEFAULT now(),
  profile jsonb NOT NULL,
  CONSTRAINT profile_snapshots_pkey PRIMARY KEY (id)
);
CREATE TABLE public.profiles (
  user_id uuid NOT NULL,
  display_name text,
  birth_year integer,
  last_generated_at timestamp with time zone,
  values_json jsonb DEFAULT '{}'::jsonb,
  motivations_json jsonb DEFAULT '{}'::jsonb,
  archetypes_json jsonb DEFAULT '{}'::jsonb,
  barriers_json jsonb DEFAULT '{}'::jsonb,
  tone_json jsonb DEFAULT '{}'::jsonb,
  human_summary text,
  CONSTRAINT profiles_pkey PRIMARY KEY (user_id)
);
CREATE TABLE public.question_options (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  question_id uuid NOT NULL,
  label text NOT NULL,
  value text,
  weight numeric,
  sort_index integer DEFAULT 0,
  CONSTRAINT question_options_pkey PRIMARY KEY (id),
  CONSTRAINT question_options_question_id_fkey FOREIGN KEY (question_id) REFERENCES public.questions(id)
);
CREATE TABLE public.questions (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  slug text UNIQUE,
  prompt text NOT NULL,
  kind text NOT NULL CHECK (kind = ANY (ARRAY['text'::text, 'multi'::text, 'scale'::text, 'boolean'::text])),
  category text,
  sort_index integer DEFAULT 0,
  is_active boolean DEFAULT true,
  CONSTRAINT questions_pkey PRIMARY KEY (id)
);
CREATE TABLE public.sessions (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  user_id uuid,
  channel text DEFAULT 'chat'::text CHECK (channel = ANY (ARRAY['voice'::text, 'chat'::text])),
  started_at timestamp with time zone NOT NULL DEFAULT now(),
  ended_at timestamp with time zone,
  CONSTRAINT sessions_pkey PRIMARY KEY (id)
);
CREATE TABLE public.transcripts (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  session_id uuid NOT NULL,
  user_id uuid,
  language text DEFAULT 'en'::text,
  text text,
  raw_json jsonb,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT transcripts_pkey PRIMARY KEY (id),
  CONSTRAINT transcripts_session_id_fkey FOREIGN KEY (session_id) REFERENCES public.sessions(id)
);
CREATE TABLE public.tts_cache (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  content_hash character varying NOT NULL UNIQUE,
  content_text text NOT NULL,
  voice character varying NOT NULL,
  audio_file_path text NOT NULL,
  audio_file_size integer,
  duration_seconds integer,
  content_type character varying NOT NULL DEFAULT 'narrative'::character varying,
  is_active boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT tts_cache_pkey PRIMARY KEY (id)
);
CREATE TABLE public.tts_cache_files (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  cache_id uuid NOT NULL,
  file_data bytea NOT NULL,
  file_size integer NOT NULL,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT tts_cache_files_pkey PRIMARY KEY (id),
  CONSTRAINT tts_cache_files_cache_id_fkey FOREIGN KEY (cache_id) REFERENCES public.tts_cache(id)
);