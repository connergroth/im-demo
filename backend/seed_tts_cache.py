#!/usr/bin/env python3
"""
Seed TTS Cache Script
Generates and caches all static content (intro, outro, questions) for both voices.
Run this once to populate the permanent cache.
"""
import os
import sys
from pathlib import Path

# Add parent directory to path so we can import app modules
sys.path.insert(0, str(Path(__file__).parent))

from app.services.openai_service import OpenAIService
from app.config.narratives import INTRO_NARRATIVE, OUTRO_NARRATIVE, QUESTION_SEQUENCE
from dotenv import load_dotenv

def seed_cache():
    """Pre-generate and cache all static TTS content"""
    
    # Load environment variables
    load_dotenv()
    
    # Get credentials
    openai_key = os.getenv('OPENAI_API_KEY')
    supabase_url = os.getenv('SUPABASE_URL')
    supabase_key = os.getenv('SUPABASE_SERVICE_KEY')
    chat_model = os.getenv('CHAT_MODEL', 'gpt-4o-mini')
    
    if not openai_key or not openai_key.startswith('sk-'):
        print("❌ Error: OPENAI_API_KEY not found in .env file")
        print("Please add your OpenAI API key to backend/.env")
        return
    
    if not supabase_url or not supabase_key:
        print("⚠️  Warning: Supabase credentials not found")
        print("Cache will only be stored locally (lost on restart)")
        print("Add SUPABASE_URL and SUPABASE_SERVICE_KEY to backend/.env for permanent storage")
        print()
    
    print("=" * 70)
    print("🎙️  TTS CACHE SEEDING SCRIPT")
    print("=" * 70)
    print()
    
    # Initialize service
    print("Initializing OpenAI service...")
    openai_service = OpenAIService(
        api_key=openai_key,
        supabase_url=supabase_url,
        supabase_key=supabase_key,
        chat_model=chat_model
    )
    print("✅ Service initialized")
    print()
    
    # Prepare content to cache
    voices = ['nova', 'onyx']  # Both voices
    
    static_content = [
        ('narrative', INTRO_NARRATIVE),
        ('narrative', OUTRO_NARRATIVE),
    ]
    
    # Add all questions
    for q in QUESTION_SEQUENCE:
        static_content.append(('question', q['prompt']))
    
    print(f"📋 Content to cache: {len(static_content)} items × {len(voices)} voices")
    print(f"   - 2 narratives (intro + outro)")
    print(f"   - {len(QUESTION_SEQUENCE)} questions")
    print()
    
    total_items = len(static_content) * len(voices)
    cached = 0
    generated = 0
    errors = 0
    
    print("🚀 Starting cache generation...")
    print("=" * 70)
    print()
    
    for voice in voices:
        print(f"📢 Processing voice: {voice.upper()}")
        print("-" * 70)
        
        for content_type, text in static_content:
            preview = text[:60] + "..." if len(text) > 60 else text
            
            try:
                # Check if already cached
                if openai_service.tts_cache_service:
                    cached_path = openai_service.tts_cache_service.get_cached_audio(text, voice)
                    if cached_path:
                        print(f"   ✓ [{content_type:10}] Already cached: {preview}")
                        cached += 1
                        continue
                
                # Generate and cache
                print(f"   ⏳ [{content_type:10}] Generating: {preview}")
                audio_path = openai_service.text_to_speech(text, voice, content_type=content_type)
                
                if audio_path:
                    print(f"   ✅ [{content_type:10}] Generated: {preview}")
                    generated += 1
                else:
                    print(f"   ❌ [{content_type:10}] Failed: {preview}")
                    errors += 1
                    
            except Exception as e:
                print(f"   ❌ [{content_type:10}] Error: {preview}")
                print(f"      {str(e)}")
                errors += 1
        
        print()
    
    print("=" * 70)
    print("📊 CACHE SEEDING SUMMARY")
    print("=" * 70)
    print(f"Total items:      {total_items}")
    print(f"Already cached:   {cached}")
    print(f"Newly generated:  {generated}")
    print(f"Errors:           {errors}")
    print()
    
    if errors == 0:
        print("✅ SUCCESS! All static content is now cached.")
        print()
        print("Next steps:")
        print("1. Start the backend: cd backend && ./run_dev.sh")
        print("2. Start the frontend: npm run dev")
        print("3. All audio will now load instantly!")
    else:
        print("⚠️  Some errors occurred. Check the output above.")
        print("Common issues:")
        print("- Invalid OPENAI_API_KEY")
        print("- Network connectivity")
        print("- Supabase credentials")
    
    print()
    print("=" * 70)
    
    # Show cache stats
    if openai_service.tts_cache_service:
        print()
        print("💾 CACHE STATISTICS")
        print("=" * 70)
        stats = openai_service.tts_cache_service.get_cache_stats()
        print(f"Supabase entries:  {stats['supabase_entries']}")
        print(f"Local files:       {stats['local_files']}")
        print(f"Memory cache:      {stats['memory_cache']}")
        print(f"Supabase enabled:  {stats['supabase_enabled']}")
        print()

if __name__ == '__main__':
    try:
        seed_cache()
    except KeyboardInterrupt:
        print("\n\n⚠️  Interrupted by user")
        sys.exit(1)
    except Exception as e:
        print(f"\n\n❌ Fatal error: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)




