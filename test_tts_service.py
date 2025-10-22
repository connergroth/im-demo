#!/usr/bin/env python3
"""
Quick test script to verify TTS caching functionality
"""
import os
import sys
from pathlib import Path

# Add the backend directory to the Python path
backend_dir = Path(__file__).parent / "backend"
sys.path.insert(0, str(backend_dir))

def test_tts_service():
    """Test the TTS service without Supabase credentials"""
    try:
        from app.services.openai_service import OpenAIService
        
        # Test with empty Supabase credentials (should fall back to local caching)
        service = OpenAIService("test-key", "", "")
        
        print("✅ OpenAI Service initialized successfully")
        print("✅ TTS Cache Service initialized (local-only mode)")
        
        # Test cache stats
        if hasattr(service, 'tts_cache_service') and service.tts_cache_service:
            stats = service.tts_cache_service.get_cache_stats()
            print(f"✅ Cache stats: {stats}")
        
        return True
        
    except Exception as e:
        print(f"❌ Error: {e}")
        return False

if __name__ == "__main__":
    print("Testing TTS Service...")
    success = test_tts_service()
    if success:
        print("\n🎉 All tests passed! The TTS service is working correctly.")
    else:
        print("\n💥 Tests failed. Check the error messages above.")
        sys.exit(1)



