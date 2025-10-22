-- Migration: Populate narratives and questions
-- Created: 2025-10-22
-- Purpose: Insert initial narratives (intro/outro) and structured question sequence

-- ============================================
-- INSERT NARRATIVES (Intro/Outro)
-- ============================================

-- 30-Second Voice Intro Narrative
INSERT INTO narratives (name, description, content, narrative_type, duration_seconds, is_active)
VALUES (
    'session_intro_v1',
    'Welcome message explaining how the life review conversation works',
    'Welcome! You''re about to begin a conversation that puts your memories and experiences at the heart of it all. Here''s how it works: You''ll see a button that says ''Get Question.'' When you''re ready, press it—and you''ll hear a question meant just for you. To answer, simply push the ''Talk'' button and speak your response out loud. When you are ready for the next question, press the ''Get Question'' button again. That''s it!

There''s no need to worry about saying the right thing. Share whatever comes to mind, big or small, at your own pace. You can say as much or as little as you''d like—this system is here to listen to what matters to you. If you ever get stuck or want a different question, just ask for help or press ''Next.'' Your story is yours to tell, and there''s no wrong way to begin. Ready? Let''s take the first step together.',
    'intro',
    30,
    true
)
ON CONFLICT (name) DO UPDATE SET
    content = EXCLUDED.content,
    description = EXCLUDED.description,
    duration_seconds = EXCLUDED.duration_seconds,
    updated_at = now();

-- 30-Second Voice Closing Narrative
INSERT INTO narratives (name, description, content, narrative_type, duration_seconds, is_active)
VALUES (
    'session_outro_v1',
    'Thank you message at the end of a life review session',
    'Thank you for sharing your stories and memories today. Every conversation is a step toward keeping your mind active, your heart connected, and your legacy alive. Remember, your experiences and wisdom matter—not just to family, but to the world. Whenever you wish to continue, reflect, or simply talk, this space is here for you. Until next time, take care of yourself and know that your story continues to inspire.',
    'outro',
    30,
    true
)
ON CONFLICT (name) DO UPDATE SET
    content = EXCLUDED.content,
    description = EXCLUDED.description,
    duration_seconds = EXCLUDED.duration_seconds,
    updated_at = now();

-- Initial Greeting (used when session starts)
INSERT INTO narratives (name, description, content, narrative_type, is_active)
VALUES (
    'session_greeting_v1',
    'Warm greeting when user starts their first question',
    'Hello! I''m so glad to spend time with you today. I''ll ask you questions about your life and capture your stories so your family and care team can understand you better. Let''s start with our first question.',
    'greeting',
    true
)
ON CONFLICT (name) DO UPDATE SET
    content = EXCLUDED.content,
    description = EXCLUDED.description,
    updated_at = now();

-- Help Message
INSERT INTO narratives (name, description, content, narrative_type, is_active)
VALUES (
    'help_message_v1',
    'Message shown when user asks for help',
    'No problem! You can press ''Get Question'' to hear a new question, or press ''Talk'' when you''re ready to share your answer. Take your time—there''s no rush. If you''d like to skip a question, just press ''Get Question'' again.',
    'help',
    true
)
ON CONFLICT (name) DO UPDATE SET
    content = EXCLUDED.content,
    description = EXCLUDED.description,
    updated_at = now();

-- ============================================
-- INSERT SYSTEM PROMPT
-- ============================================

INSERT INTO system_prompts (name, description, prompt_text, version, is_active)
VALUES (
    'life_review_assistant_v1',
    'Main system prompt for the empathetic life review AI assistant',
    'You are a warm, empathetic conversational AI companion conducting a life review interview. Your role is to help individuals reflect on their life experiences, memories, and wisdom in a way that feels natural, respectful, and deeply personal.

Your approach:
- Be warm and conversational, like a trusted friend or counselor
- Show genuine curiosity and interest in their stories
- Create a safe, non-judgmental space for sharing
- Honor the pace and comfort level of the person
- Recognize that every story matters, regardless of how "big" or "small" it seems

When responding to their answers:
1. Acknowledge their story with warmth and empathy
2. Reflect back the key emotions or themes you heard
3. Ask a natural follow-up question that:
   - Invites them to go deeper or share more details
   - Connects to what they just shared
   - Feels curious rather than interrogative
   - Allows them to elaborate at their own comfort level

Guidelines:
- Keep your responses conversational and natural (2-4 sentences)
- Use their name if they''ve shared it
- Avoid clinical or overly formal language
- Don''t rush them or push for answers they''re not ready to share
- Celebrate their willingness to share, especially on difficult topics
- If they seem stuck, offer encouragement or suggest they can skip the question
- Remember that silence and reflection are okay

Your ultimate goal is to help them feel heard, valued, and supported in exploring and preserving their life story.',
    1,
    true
)
ON CONFLICT (name) DO UPDATE SET
    prompt_text = EXCLUDED.prompt_text,
    description = EXCLUDED.description,
    version = system_prompts.version + 1,
    updated_at = now();

-- ============================================
-- INSERT QUESTIONS (Structured Sequence)
-- ============================================

-- Clear existing demo questions if they exist
DELETE FROM questions WHERE category = 'demo';

-- Opening, Comfort Questions (sort_index 1-2)
INSERT INTO questions (slug, prompt, kind, category, sort_index, is_active)
VALUES
    ('name-preference', 'What name would you like to go by today?', 'text', 'opening', 1, true),
    ('current-feeling', 'How are you feeling right now?', 'text', 'opening', 2, true)
ON CONFLICT (slug) DO UPDATE SET
    prompt = EXCLUDED.prompt,
    sort_index = EXCLUDED.sort_index,
    updated_at = now();

-- Light Memory Activation (sort_index 3-5)
INSERT INTO questions (slug, prompt, kind, category, sort_index, is_active)
VALUES
    ('childhood-place', 'Can you tell me about where you grew up?', 'text', 'light_memory', 3, true),
    ('favorite-food', 'What''s one favorite food or dish from your childhood?', 'text', 'light_memory', 4, true),
    ('memorable-song', 'Do you have a song that always brings back memories?', 'text', 'light_memory', 5, true)
ON CONFLICT (slug) DO UPDATE SET
    prompt = EXCLUDED.prompt,
    sort_index = EXCLUDED.sort_index,
    updated_at = now();

-- Building Connection (sort_index 6-8)
INSERT INTO questions (slug, prompt, kind, category, sort_index, is_active)
VALUES
    ('important-people', 'Who has been important in your life—family, friends, mentors?', 'text', 'connection', 6, true),
    ('typical-day', 'What was a typical day like for you when you were young?', 'text', 'connection', 7, true),
    ('pets-companions', 'Do you have any pets or companion animals in your story?', 'text', 'connection', 8, true)
ON CONFLICT (slug) DO UPDATE SET
    prompt = EXCLUDED.prompt,
    sort_index = EXCLUDED.sort_index,
    updated_at = now();

-- Gentle Deepening (sort_index 9-11)
INSERT INTO questions (slug, prompt, kind, category, sort_index, is_active)
VALUES
    ('smile-moment', 'What''s a moment from your life that makes you smile when you think of it?', 'text', 'deepening', 9, true),
    ('wisdom-lesson', 'What is one lesson or piece of wisdom you''d like your family to remember?', 'text', 'deepening', 10, true),
    ('overcoming-challenge', 'Can you share a story about a challenge you faced, and how you overcame it?', 'text', 'deepening', 11, true)
ON CONFLICT (slug) DO UPDATE SET
    prompt = EXCLUDED.prompt,
    sort_index = EXCLUDED.sort_index,
    updated_at = now();

-- Reflective/Identity Prompts (sort_index 12-14)
INSERT INTO questions (slug, prompt, kind, category, sort_index, is_active)
VALUES
    ('proudest-moment', 'What are you most proud of in your life?', 'text', 'reflective', 12, true),
    ('family-tradition', 'Is there a tradition or value from your family you hope will continue?', 'text', 'reflective', 13, true),
    ('message-to-youth', 'What message would you give to younger generations about living well?', 'text', 'reflective', 14, true)
ON CONFLICT (slug) DO UPDATE SET
    prompt = EXCLUDED.prompt,
    sort_index = EXCLUDED.sort_index,
    updated_at = now();

-- ============================================
-- VERIFICATION QUERIES (commented out)
-- ============================================

-- To verify the data was inserted correctly, run these queries:

-- SELECT * FROM narratives ORDER BY narrative_type, created_at;
-- SELECT * FROM system_prompts ORDER BY version DESC;
-- SELECT id, slug, prompt, category, sort_index FROM questions WHERE is_active = true ORDER BY sort_index;
