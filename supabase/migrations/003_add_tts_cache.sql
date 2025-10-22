-- Migration: Add TTS cache tables for permanent storage of audio files
-- Created: 2025-01-27
-- Purpose: Store pre-generated TTS audio files for narratives and questions

-- Create the update_updated_at_column function if it doesn't exist
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Table: tts_cache
-- Stores pre-generated TTS audio files with metadata
CREATE TABLE IF NOT EXISTS tts_cache (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    content_hash VARCHAR(64) NOT NULL UNIQUE, -- MD5 hash of text + voice
    content_text TEXT NOT NULL,
    voice VARCHAR(50) NOT NULL,
    audio_file_path TEXT NOT NULL,
    audio_file_size INTEGER,
    duration_seconds INTEGER,
    content_type VARCHAR(50) NOT NULL DEFAULT 'narrative', -- 'narrative', 'question', 'greeting', etc.
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Table: tts_cache_files
-- Stores the actual audio file data (base64 encoded for Supabase storage)
CREATE TABLE IF NOT EXISTS tts_cache_files (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    cache_id UUID NOT NULL REFERENCES tts_cache(id) ON DELETE CASCADE,
    file_data BYTEA NOT NULL, -- Store binary audio data
    file_size INTEGER NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_tts_cache_content_hash ON tts_cache(content_hash);
CREATE INDEX IF NOT EXISTS idx_tts_cache_content_type ON tts_cache(content_type);
CREATE INDEX IF NOT EXISTS idx_tts_cache_voice ON tts_cache(voice);
CREATE INDEX IF NOT EXISTS idx_tts_cache_active ON tts_cache(is_active);
CREATE INDEX IF NOT EXISTS idx_tts_cache_files_cache_id ON tts_cache_files(cache_id);

-- Add RLS (Row Level Security) policies
ALTER TABLE tts_cache ENABLE ROW LEVEL SECURITY;
ALTER TABLE tts_cache_files ENABLE ROW LEVEL SECURITY;

-- Allow read access to all authenticated and anonymous users
CREATE POLICY "Allow read access to tts_cache" ON tts_cache
    FOR SELECT USING (is_active = true);

CREATE POLICY "Allow read access to tts_cache_files" ON tts_cache_files
    FOR SELECT USING (true);

-- Allow insert/update for service operations (in production, restrict to service role)
CREATE POLICY "Allow insert to tts_cache" ON tts_cache
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow update to tts_cache" ON tts_cache
    FOR UPDATE USING (true);

CREATE POLICY "Allow insert to tts_cache_files" ON tts_cache_files
    FOR INSERT WITH CHECK (true);

-- Add trigger to update updated_at timestamp
CREATE TRIGGER update_tts_cache_updated_at BEFORE UPDATE ON tts_cache
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Comments for documentation
COMMENT ON TABLE tts_cache IS 'Stores metadata for pre-generated TTS audio files';
COMMENT ON TABLE tts_cache_files IS 'Stores the actual binary audio file data';
COMMENT ON COLUMN tts_cache.content_hash IS 'MD5 hash of text + voice for deduplication';
COMMENT ON COLUMN tts_cache.content_type IS 'Type: narrative, question, greeting, outro, etc.';
COMMENT ON COLUMN tts_cache.duration_seconds IS 'Audio duration in seconds';



