#!/usr/bin/env python3
"""
Check Setup Script
Verifies environment configuration and database connectivity.
"""
import os
import sys
from pathlib import Path
from dotenv import load_dotenv

# Load environment
load_dotenv()

def check_env_vars():
    """Check required environment variables"""
    print("=" * 70)
    print("🔍 CHECKING ENVIRONMENT VARIABLES")
    print("=" * 70)
    print()
    
    required = {
        'OPENAI_API_KEY': 'OpenAI API key for TTS generation',
        'SUPABASE_URL': 'Supabase project URL for permanent storage',
        'SUPABASE_SERVICE_KEY': 'Supabase service key for database access'
    }
    
    optional = {
        'ASSEMBLYAI_API_KEY': 'AssemblyAI key for streaming transcription',
        'PORT': 'Backend server port (default: 5001)',
        'CHAT_MODEL': 'OpenAI chat model (default: gpt-4o-mini)'
    }
    
    all_good = True
    
    for key, description in required.items():
        value = os.getenv(key)
        if value:
            # Mask sensitive keys
            if 'KEY' in key or 'SECRET' in key:
                display = f"{value[:8]}...{value[-4:]}" if len(value) > 12 else "***"
            else:
                display = value
            print(f"✅ {key:25} = {display}")
            print(f"   {description}")
        else:
            print(f"❌ {key:25} = NOT SET")
            print(f"   {description}")
            all_good = False
        print()
    
    print("Optional variables:")
    print()
    for key, description in optional.items():
        value = os.getenv(key)
        if value:
            if 'KEY' in key:
                display = f"{value[:8]}...{value[-4:]}" if len(value) > 12 else "***"
            else:
                display = value
            print(f"✓  {key:25} = {display}")
        else:
            print(f"   {key:25} = (using default)")
        print(f"   {description}")
        print()
    
    return all_good

def check_supabase_connection():
    """Check Supabase connectivity and tables"""
    print("=" * 70)
    print("🔗 CHECKING SUPABASE CONNECTION")
    print("=" * 70)
    print()
    
    supabase_url = os.getenv('SUPABASE_URL')
    supabase_key = os.getenv('SUPABASE_SERVICE_KEY')
    
    if not supabase_url or not supabase_key:
        print("⚠️  Supabase credentials not configured")
        print("Cache will only work locally (not persistent)")
        print()
        return False
    
    try:
        from supabase import create_client
        
        print(f"Connecting to: {supabase_url}")
        client = create_client(supabase_url, supabase_key)
        print("✅ Connection successful")
        print()
        
        # Check tts_cache table
        print("Checking tts_cache table...")
        result = client.table('tts_cache').select('*', count='exact').limit(1).execute()
        print(f"✅ tts_cache table exists")
        print(f"   Entries: {result.count if hasattr(result, 'count') else 'unknown'}")
        print()
        
        # Check tts_cache_files table
        print("Checking tts_cache_files table...")
        result = client.table('tts_cache_files').select('*', count='exact').limit(1).execute()
        print(f"✅ tts_cache_files table exists")
        print(f"   Entries: {result.count if hasattr(result, 'count') else 'unknown'}")
        print()
        
        # Show sample entries if any
        result = client.table('tts_cache').select('content_type,voice,content_text,created_at').limit(5).execute()
        if result.data:
            print("📋 Sample cached entries:")
            for entry in result.data:
                preview = entry['content_text'][:50] + "..." if len(entry['content_text']) > 50 else entry['content_text']
                print(f"   - [{entry['content_type']:10}] {entry['voice']:6} | {preview}")
            print()
        else:
            print("ℹ️  No cached entries yet - tables are empty")
            print("   Run: python backend/seed_tts_cache.py")
            print()
        
        return True
        
    except ImportError:
        print("❌ supabase-py not installed")
        print("   Run: pip install supabase")
        print()
        return False
    except Exception as e:
        print(f"❌ Connection failed: {e}")
        print()
        return False

def check_openai_key():
    """Verify OpenAI API key"""
    print("=" * 70)
    print("🤖 CHECKING OPENAI API KEY")
    print("=" * 70)
    print()
    
    api_key = os.getenv('OPENAI_API_KEY')
    
    if not api_key:
        print("❌ OPENAI_API_KEY not set")
        print()
        return False
    
    if not api_key.startswith('sk-'):
        print("❌ Invalid API key format (should start with 'sk-')")
        print()
        return False
    
    try:
        from openai import OpenAI
        client = OpenAI(api_key=api_key)
        
        # Test with a minimal request
        print("Testing API key...")
        response = client.models.list()
        print("✅ API key is valid")
        print()
        return True
        
    except ImportError:
        print("❌ openai package not installed")
        print("   Run: pip install openai")
        print()
        return False
    except Exception as e:
        print(f"❌ API key test failed: {e}")
        print()
        return False

def main():
    print()
    print("╔" + "=" * 68 + "╗")
    print("║" + " " * 20 + "SETUP VERIFICATION SCRIPT" + " " * 23 + "║")
    print("╚" + "=" * 68 + "╝")
    print()
    
    # Check environment
    env_ok = check_env_vars()
    
    # Check OpenAI
    openai_ok = check_openai_key()
    
    # Check Supabase
    supabase_ok = check_supabase_connection()
    
    # Summary
    print("=" * 70)
    print("📊 SUMMARY")
    print("=" * 70)
    print()
    
    if env_ok and openai_ok and supabase_ok:
        print("✅ ALL CHECKS PASSED!")
        print()
        print("Next steps:")
        print("1. Seed the cache: python backend/seed_tts_cache.py")
        print("2. Start backend:   cd backend && ./run_dev.sh")
        print("3. Start frontend:  npm run dev")
        print()
    else:
        print("⚠️  SOME CHECKS FAILED")
        print()
        if not env_ok:
            print("❌ Environment variables missing")
            print("   → Create/edit backend/.env file")
            print()
        if not openai_ok:
            print("❌ OpenAI API key issue")
            print("   → Add valid OPENAI_API_KEY to backend/.env")
            print()
        if not supabase_ok:
            print("⚠️  Supabase not configured (optional)")
            print("   → Add SUPABASE_URL and SUPABASE_SERVICE_KEY for permanent cache")
            print()
    
    print("=" * 70)
    print()

if __name__ == '__main__':
    try:
        main()
    except KeyboardInterrupt:
        print("\n\n⚠️  Interrupted by user")
        sys.exit(1)
    except Exception as e:
        print(f"\n\n❌ Fatal error: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)




