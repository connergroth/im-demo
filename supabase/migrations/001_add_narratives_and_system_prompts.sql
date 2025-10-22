-- Migration: Add system_prompts and narratives tables
-- Created: 2025-10-22
-- Purpose: Store system prompts, intro/outro narratives, and configurable content

-- Table: system_prompts
-- Stores AI system prompts with versioning
CREATE TABLE IF NOT EXISTS system_prompts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL UNIQUE,
    description TEXT,
    prompt_text TEXT NOT NULL,
    version INTEGER NOT NULL DEFAULT 1,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Table: narratives
-- Stores intro/outro voice narratives and system messages
CREATE TABLE IF NOT EXISTS narratives (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL UNIQUE,
    description TEXT,
    content TEXT NOT NULL,
    narrative_type VARCHAR(50) NOT NULL, -- 'intro', 'outro', 'greeting', 'help', etc.
    duration_seconds INTEGER, -- For voice narratives
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Add indexes for common queries
CREATE INDEX IF NOT EXISTS idx_system_prompts_active ON system_prompts(is_active);
CREATE INDEX IF NOT EXISTS idx_system_prompts_name ON system_prompts(name);
CREATE INDEX IF NOT EXISTS idx_narratives_active ON narratives(is_active);
CREATE INDEX IF NOT EXISTS idx_narratives_type ON narratives(narrative_type);

-- Add RLS (Row Level Security) policies
ALTER TABLE system_prompts ENABLE ROW LEVEL SECURITY;
ALTER TABLE narratives ENABLE ROW LEVEL SECURITY;

-- Allow read access to all authenticated and anonymous users
CREATE POLICY "Allow read access to system_prompts" ON system_prompts
    FOR SELECT USING (is_active = true);

CREATE POLICY "Allow read access to narratives" ON narratives
    FOR SELECT USING (is_active = true);

-- Add trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_system_prompts_updated_at BEFORE UPDATE ON system_prompts
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_narratives_updated_at BEFORE UPDATE ON narratives
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Comments for documentation
COMMENT ON TABLE system_prompts IS 'Stores AI system prompts with version control';
COMMENT ON TABLE narratives IS 'Stores intro/outro voice narratives and system messages';
COMMENT ON COLUMN narratives.narrative_type IS 'Type: intro, outro, greeting, help, error, etc.';
COMMENT ON COLUMN narratives.duration_seconds IS 'Approximate duration for voice narratives';
