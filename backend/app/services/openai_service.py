"""
OpenAI API service for TTS, transcription, and AI analysis.
"""
from openai import OpenAI
from typing import Optional, Dict
import time
import hashlib
from pathlib import Path
from .tts_cache_service import TTSCacheService


class OpenAIService:
    """Service for handling OpenAI API operations"""

    def __init__(self, api_key: str, supabase_url: str = None, supabase_key: str = None, chat_model: str = "gpt-3.5-turbo"):
        """
        Initialize OpenAI service.

        Args:
            api_key (str): OpenAI API key
            supabase_url (str): Supabase project URL for caching
            supabase_key (str): Supabase service key for caching
            chat_model (str): Chat model to use for analysis
        """
        self.client = OpenAI(api_key=api_key)
        self.chat_model = chat_model
        self.tts_cache: Dict[str, str] = {}  # Legacy cache for backward compatibility
        
        # Initialize TTS cache service if Supabase credentials provided
        if supabase_url and supabase_key:
            self.tts_cache_service = TTSCacheService(supabase_url, supabase_key)
        else:
            self.tts_cache_service = None

    def text_to_speech(self, text: str, voice: str = "nova", output_dir: str = "/tmp", content_type: str = "narrative") -> Optional[str]:
        """
        Converts text to speech using OpenAI TTS with permanent caching.

        Args:
            text (str): Text to speak
            voice (str): Voice to use (alloy, echo, fable, onyx, nova, shimmer)
            output_dir (str): Directory to save audio file
            content_type (str): Type of content for caching (narrative, question, etc.)

        Returns:
            str: Path to the saved audio file or None if error
        """
        try:
            # Check permanent cache first
            if self.tts_cache_service:
                cached_path = self.tts_cache_service.get_cached_audio(text, voice)
                if cached_path:
                    print(f"Using permanently cached TTS for: {text[:50]}...")
                    return cached_path
            
            # Create cache key from text and voice
            cache_key = hashlib.md5(f"{text}_{voice}".encode()).hexdigest()
            
            # Check legacy cache
            if cache_key in self.tts_cache:
                cached_file = Path(self.tts_cache[cache_key])
                if cached_file.exists():
                    print(f"Using legacy cached TTS for: {text[:50]}...")
                    return str(cached_file)
                else:
                    # Remove stale cache entry
                    del self.tts_cache[cache_key]
            
            try:
                # Generate speech with streaming for faster response
                response = self.client.audio.speech.create(
                    model="tts-1-hd",  # Use HD model for better quality
                    voice=voice,
                    input=text,
                    response_format="mp3"  # Explicit format for consistency
                )

                # Save to file with cache-friendly name
                speech_file = Path(output_dir) / f"tts_cache_{cache_key}.mp3"

                with open(speech_file, 'wb') as f:
                    for chunk in response.iter_bytes():
                        f.write(chunk)

                # Cache the file path locally
                self.tts_cache[cache_key] = str(speech_file)
                
                # Cache permanently if service available
                if self.tts_cache_service:
                    self.tts_cache_service.cache_audio(text, voice, str(speech_file), content_type)
                
                print(f"Generated and cached TTS for: {text[:50]}...")

                return str(speech_file)
                
            except Exception as e:
                print(f"Error generating speech: {e}")
                return None

        except Exception as e:
            print(f"Error generating speech: {e}")
            return None

    def transcribe_audio(self, audio_path: str) -> Optional[str]:
        """
        Transcribes speech to text using OpenAI Whisper.

        Args:
            audio_path (str): Path to the audio file

        Returns:
            str: Transcribed text or None if error
        """
        try:
            with open(audio_path, "rb") as audio_file:
                transcript = self.client.audio.transcriptions.create(
                    model="whisper-1",
                    file=audio_file
                )
            return transcript.text

        except FileNotFoundError:
            print(f"Error: Audio file not found at {audio_path}")
            return None
        except Exception as e:
            print(f"Error transcribing audio: {e}")
            return None

    def analyze_response(self, question: str, transcript_text: str) -> Optional[str]:
        """
        Analyzes a transcribed answer for emotions, themes, and personal values.

        Args:
            question (str): The question that was asked
            transcript_text (str): The transcribed answer

        Returns:
            str: AI-generated summary or None if error
        """
        try:
            response = self.client.chat.completions.create(
                model=self.chat_model,
                messages=[
                    {
                        "role": "system",
                        "content": """You are a warm, empathetic conversational AI companion conducting a life review interview with an older adult. Your purpose is to guide them through structured life review sessions, capturing their stories to help their family and care team understand them better.

When responding to their answers:
1. Acknowledge their story with warmth and empathy
2. Reflect back the key emotions or themes you heard
3. Ask a natural follow-up question to go deeper (e.g., "That sounds meaningful — how did you feel in that moment?", "What made that so special for you?", "Who was with you during that time?")
4. Keep your response conversational, warm, and brief (2-3 sentences max)
5. Make them feel heard and valued

Your goal is to help them open up and share more details naturally."""
                    },
                    {
                        "role": "user",
                        "content": f"""I just asked: "{question}"

They answered: "{transcript_text}"

Respond warmly and naturally, acknowledging what they shared and asking a thoughtful follow-up question to help them elaborate."""
                    }
                ],
                temperature=0.8
            )
            summary = response.choices[0].message.content.strip()
            return summary

        except Exception as e:
            print(f"Error generating AI response: {e}")
            return None

    def analyze_followup_response(self, original_question: str, original_answer: str, followup_answer: str, voice: str = "nova") -> tuple[Optional[str], Optional[str]]:
        """
        Analyze a follow-up response with context from the original question and answer.
        
        Args:
            original_question (str): The original question that was asked
            original_answer (str): The original answer given
            followup_answer (str): The follow-up response
            voice (str): Voice to use for TTS
            
        Returns:
            tuple: (ai_response, tts_file_path) or (None, None) if error
        """
        try:
            response = self.client.chat.completions.create(
                model=self.chat_model,
                messages=[
                    {
                        "role": "system",
                        "content": """You are a warm, empathetic conversational AI companion conducting a life review interview with an older adult. Your purpose is to guide them through structured life review sessions, capturing their stories to help their family and care team understand them better.

When responding to follow-up answers:
1. Acknowledge the additional details they shared with warmth and empathy
2. Connect their follow-up response to their original answer to show you're listening
3. Reflect back the deeper insights or emotions you heard
4. Either ask another thoughtful follow-up question OR acknowledge that you have enough detail and suggest moving to the next question
5. Keep your response conversational, warm, and brief (2-3 sentences max)
6. Make them feel heard and valued

Your goal is to help them feel comfortable sharing more details while knowing when to move forward."""
                    },
                    {
                        "role": "user",
                        "content": f"""Original question: "{original_question}"

Their original answer: "{original_answer}"

They then provided this follow-up response: "{followup_answer}"

Respond warmly and naturally, acknowledging the additional details they shared and either asking another thoughtful follow-up question or suggesting we move to the next question."""
                    }
                ],
                temperature=0.8
            )
            ai_response = response.choices[0].message.content.strip()
            
            # Generate TTS for the response
            tts_path = self.text_to_speech(ai_response, voice)
            
            return ai_response, tts_path

        except Exception as e:
            print(f"Error generating follow-up analysis: {e}")
            return None, None

    def analyze_and_prepare_tts(self, question: str, transcript_text: str, voice: str = "nova") -> tuple[Optional[str], Optional[str]]:
        """
        Analyze response and prepare TTS in parallel for maximum speed.
        
        Args:
            question (str): The question that was asked
            transcript_text (str): The transcribed answer
            voice (str): Voice to use for TTS
            
        Returns:
            tuple: (ai_response, tts_file_path) or (None, None) if error
        """
        import asyncio
        import concurrent.futures
        
        def get_ai_response():
            return self.analyze_response(question, transcript_text)
        
        def get_tts_response(ai_text):
            if ai_text:
                return self.text_to_speech(ai_text, voice)
            return None
        
        try:
            # Start AI analysis
            with concurrent.futures.ThreadPoolExecutor() as executor:
                ai_future = executor.submit(get_ai_response)
                
                # Wait for AI response
                ai_response = ai_future.result(timeout=10)
                
                if ai_response:
                    # Start TTS generation immediately
                    tts_future = executor.submit(get_tts_response, ai_response)
                    tts_path = tts_future.result(timeout=15)
                    
                    return ai_response, tts_path
                else:
                    return None, None
                    
        except Exception as e:
            print(f"Error in parallel processing: {e}")
            return None, None

    def analyze_full_session(self, session_data: list) -> Optional[Dict]:
        """
        Analyze a complete life review session with all Q&A pairs.
        
        Args:
            session_data (list): List of dicts with 'question' and 'answer' keys
            
        Returns:
            Dict: Comprehensive analysis with themes, insights, personality traits, and metrics
        """
        try:
            # Build conversation history for context
            conversation_text = ""
            num_responses = len(session_data)
            
            for idx, qa in enumerate(session_data, 1):
                conversation_text += f"Q{idx}: {qa['question']}\n"
                conversation_text += f"A{idx}: {qa['answer']}\n\n"
            
            # Add context about session completeness
            session_context = f"(Session contains {num_responses} response{'s' if num_responses != 1 else ''})"
            
            response = self.client.chat.completions.create(
                model=self.chat_model,
                messages=[
                    {
                        "role": "system",
                        "content": """You are an expert clinical psychologist and life review therapist analyzing a life review session. Your role is to provide deep, accurate, and insightful analysis that helps family members and care teams understand this person better.

Note: This may be a partial session (not all questions answered). Work with whatever information is available and provide meaningful insights based on what they've shared so far. Avoid saying "not enough information" - instead, provide preliminary insights based on available data.

Analyze the conversation holistically and provide:

1. **Core Themes** (2-5 major themes): Identify the most significant patterns, values, and life themes that emerge from their responses. Be specific and meaningful. Even from limited responses, patterns emerge.

2. **Personality Insights**: Describe their personality, communication style, and how they relate to their experiences. What makes them unique? Look for clues in word choice, storytelling style, and emotional expression.

3. **Emotional Landscape**: What emotions are most present? How do they process feelings? What brings them joy or difficulty? Note their emotional tone and affect.

4. **Key Relationships**: Who are the important people in their life? How do they describe relationships? Look for mentions of family, friends, or significant others.

5. **Values & Beliefs**: What do they care about most deeply? What principles guide their life? Infer from their stories and priorities.

6. **Life Trajectory**: How do they view their life journey? What patterns emerge in how they tell their story? Consider their narrative arc and perspective.

7. **Strengths**: What personal strengths, resilience factors, and positive qualities shine through? Look for evidence of coping, growth, and positive adaptation.

8. **Care Recommendations**: Based on this analysis, what would help caregivers connect with and support this person better? Provide actionable, compassionate suggestions.

9. **Quantitative Metrics** (provide scores 0-100):
   - Emotional expressiveness: How openly they share feelings
   - Life satisfaction: Overall contentment with their life (infer from tone/content)
   - Social connectedness: Strength of relationships mentioned
   - Resilience: Ability to overcome challenges (look for evidence)
   - Optimism: Positive outlook (assess from language and framing)
   - Introspection: Self-awareness and reflection (depth of responses)

Be compassionate, accurate, and deeply insightful. Even with limited data, provide meaningful preliminary insights. This analysis will help their loved ones understand and support them better."""
                    },
                    {
                        "role": "user",
                        "content": f"""Please analyze this life review session {session_context}:

{conversation_text}

Provide a comprehensive analysis in JSON format with these exact keys:
{{
  "core_themes": ["theme1", "theme2", "theme3"],
  "personality_insights": "detailed paragraph",
  "emotional_landscape": "detailed paragraph",
  "key_relationships": "detailed paragraph",
  "values_and_beliefs": "detailed paragraph",
  "life_trajectory": "detailed paragraph",
  "strengths": "detailed paragraph",
  "care_recommendations": "detailed paragraph",
  "metrics": {{
    "emotional_expressiveness": 85,
    "life_satisfaction": 75,
    "social_connectedness": 90,
    "resilience": 80,
    "optimism": 70,
    "introspection": 95
  }}
}}"""
                    }
                ],
                temperature=0.7,
                response_format={"type": "json_object"}
            )
            
            import json
            analysis = json.loads(response.choices[0].message.content.strip())
            
            return analysis

        except Exception as e:
            print(f"Error generating session analysis: {e}")
            return None

    def pre_cache_narratives(self, narratives: list, voice: str = "nova", output_dir: str = "/tmp") -> Dict[str, bool]:
        """
        Pre-cache common narratives for faster loading using permanent storage.
        
        Args:
            narratives (list): List of narrative texts to cache
            voice (str): Voice to use for caching
            output_dir (str): Directory to save cached files
            
        Returns:
            Dict[str, bool]: Mapping of narrative to success status
        """
        results = {}
        
        print(f"[Pre-cache] Starting to check {len(narratives)} narratives...")
        
        for narrative in narratives:
            try:
                # Check if already cached first
                cache_key = hashlib.md5(f"{narrative}_{voice}".encode()).hexdigest()
                
                # Check local cache
                if cache_key in self.tts_cache:
                    cached_file = Path(self.tts_cache[cache_key])
                    if cached_file.exists():
                        results[narrative] = True
                        print(f"[Pre-cache] Already cached locally: {narrative[:50]}...")
                        continue
                
                # Check permanent cache if available
                if self.tts_cache_service:
                    cached_path = self.tts_cache_service.get_cached_audio(narrative, voice)
                    if cached_path:
                        results[narrative] = True
                        print(f"[Pre-cache] Already cached permanently: {narrative[:50]}...")
                        continue
                
                # Only generate if not cached
                print(f"[Pre-cache] Generating TTS for: {narrative[:50]}...")
                result = self.text_to_speech(narrative, voice, output_dir, content_type="narrative")
                results[narrative] = result is not None
                
                if result:
                    print(f"[Pre-cache] ✅ Successfully cached: {narrative[:50]}...")
                else:
                    print(f"[Pre-cache] ❌ Failed to cache: {narrative[:50]}...")
                    
            except Exception as e:
                print(f"[Pre-cache] ❌ Error caching narrative: {e}")
                results[narrative] = False
                    
        cached_count = sum(1 for success in results.values() if success)
        print(f"[Pre-cache] Complete: {cached_count}/{len(narratives)} narratives cached")
        return results
