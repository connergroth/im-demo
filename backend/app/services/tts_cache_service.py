"""
TTS Cache Service for permanent storage of audio files
Handles both Supabase storage and local caching for optimal performance
"""
import hashlib
import base64
import os
from typing import Optional, Dict, List, Tuple
from pathlib import Path
from supabase import create_client, Client
import json


class TTSCacheService:
    """Service for managing TTS audio file caching"""
    
    def __init__(self, supabase_url: str, supabase_key: str, local_cache_dir: str = "/tmp/tts_cache"):
        """
        Initialize TTS cache service.
        
        Args:
            supabase_url (str): Supabase project URL
            supabase_key (str): Supabase service key
            local_cache_dir (str): Local directory for caching
        """
        self.local_cache_dir = Path(local_cache_dir)
        self.local_cache_dir.mkdir(parents=True, exist_ok=True)
        
        # Local cache for quick access
        self.local_cache: Dict[str, str] = {}
        
        # Initialize Supabase client if credentials provided
        if supabase_url and supabase_key:
            try:
                self.supabase: Client = create_client(supabase_url, supabase_key)
                self.supabase_enabled = True
            except Exception as e:
                print(f"Failed to initialize Supabase client: {e}")
                self.supabase = None
                self.supabase_enabled = False
        else:
            self.supabase = None
            self.supabase_enabled = False
    
    def _get_content_hash(self, text: str, voice: str) -> str:
        """Generate MD5 hash for content + voice combination"""
        return hashlib.md5(f"{text}_{voice}".encode()).hexdigest()
    
    def _get_local_cache_path(self, content_hash: str) -> Path:
        """Get local cache file path"""
        return self.local_cache_dir / f"{content_hash}.mp3"
    
    def get_cached_audio(self, text: str, voice: str) -> Optional[str]:
        """
        Get cached audio file path (local or Supabase).
        
        Args:
            text (str): Text content
            voice (str): Voice type
            
        Returns:
            str: Path to cached audio file or None if not found
        """
        content_hash = self._get_content_hash(text, voice)
        
        # Check local cache first
        if content_hash in self.local_cache:
            local_path = self.local_cache[content_hash]
            if Path(local_path).exists():
                return local_path
            else:
                # Remove stale local cache entry
                del self.local_cache[content_hash]
        
        # Check local file system
        local_path = self._get_local_cache_path(content_hash)
        if local_path.exists():
            self.local_cache[content_hash] = str(local_path)
            return str(local_path)
        
        # Check Supabase cache if enabled
        if self.supabase_enabled:
            try:
                result = self.supabase.table('tts_cache').select('*').eq('content_hash', content_hash).eq('is_active', True).execute()
                
                if result.data:
                    cache_entry = result.data[0]
                    # Download from Supabase and save locally
                    file_result = self.supabase.table('tts_cache_files').select('file_data').eq('cache_id', cache_entry['id']).execute()
                    
                    if file_result.data:
                        audio_data = file_result.data[0]['file_data']
                        
                        # Save to local cache
                        with open(local_path, 'wb') as f:
                            f.write(audio_data)
                        
                        self.local_cache[content_hash] = str(local_path)
                        return str(local_path)
                        
            except Exception as e:
                print(f"Error retrieving from Supabase cache: {e}")
        
        return None
    
    def cache_audio(self, text: str, voice: str, audio_file_path: str, content_type: str = 'narrative') -> bool:
        """
        Cache audio file both locally and in Supabase.
        
        Args:
            text (str): Text content
            voice (str): Voice type
            audio_file_path (str): Path to audio file
            content_type (str): Type of content (narrative, question, etc.)
            
        Returns:
            bool: Success status
        """
        try:
            content_hash = self._get_content_hash(text, voice)
            local_path = self._get_local_cache_path(content_hash)
            
            # Copy to local cache
            import shutil
            shutil.copy2(audio_file_path, local_path)
            self.local_cache[content_hash] = str(local_path)
            
            # Get file info
            file_size = local_path.stat().st_size
            
            # Read audio data
            with open(local_path, 'rb') as f:
                audio_data = f.read()
            
            # Store in Supabase if enabled
            if self.supabase_enabled:
                cache_entry = {
                    'content_hash': content_hash,
                    'content_text': text,
                    'voice': voice,
                    'audio_file_path': str(local_path),
                    'audio_file_size': file_size,
                    'content_type': content_type,
                    'is_active': True
                }
                
                # Insert cache entry
                cache_result = self.supabase.table('tts_cache').upsert(cache_entry, on_conflict='content_hash').execute()
                
                if cache_result.data:
                    cache_id = cache_result.data[0]['id']
                    
                    # Insert file data
                    file_entry = {
                        'cache_id': cache_id,
                        'file_data': audio_data,
                        'file_size': file_size
                    }
                    
                    self.supabase.table('tts_cache_files').upsert(file_entry, on_conflict='cache_id').execute()
                    
                    print(f"Cached audio for: {text[:50]}... (hash: {content_hash})")
                    return True
            else:
                print(f"Cached audio locally for: {text[:50]}... (hash: {content_hash})")
                return True
                
        except Exception as e:
            print(f"Error caching audio: {e}")
            
        return False
    
    def pre_cache_narratives(self, narratives: List[str], voice: str = "nova", content_type: str = "narrative") -> Dict[str, bool]:
        """
        Pre-cache a list of narratives.
        
        Args:
            narratives (List[str]): List of narrative texts
            voice (str): Voice to use
            content_type (str): Type of content
            
        Returns:
            Dict[str, bool]: Mapping of narrative to success status
        """
        results = {}
        
        for narrative in narratives:
            # Check if already cached
            cached_path = self.get_cached_audio(narrative, voice)
            if cached_path:
                results[narrative] = True
                print(f"Already cached: {narrative[:50]}...")
                continue
            
            # This would need to be called with actual TTS generation
            # For now, just mark as needing generation
            results[narrative] = False
            
        return results
    
    def get_cache_stats(self) -> Dict[str, int]:
        """Get cache statistics"""
        try:
            # Count Supabase entries if enabled
            supabase_count = 0
            if self.supabase_enabled:
                result = self.supabase.table('tts_cache').select('id', count='exact').eq('is_active', True).execute()
                supabase_count = result.count or 0
            
            # Count local files
            local_count = len(list(self.local_cache_dir.glob("*.mp3")))
            
            return {
                'supabase_entries': supabase_count,
                'local_files': local_count,
                'memory_cache': len(self.local_cache),
                'supabase_enabled': self.supabase_enabled
            }
        except Exception as e:
            print(f"Error getting cache stats: {e}")
            return {
                'supabase_entries': 0, 
                'local_files': len(list(self.local_cache_dir.glob("*.mp3"))), 
                'memory_cache': len(self.local_cache),
                'supabase_enabled': False
            }
    
    def clear_local_cache(self) -> bool:
        """Clear local cache files"""
        try:
            import shutil
            shutil.rmtree(self.local_cache_dir)
            self.local_cache_dir.mkdir(parents=True, exist_ok=True)
            self.local_cache.clear()
            return True
        except Exception as e:
            print(f"Error clearing local cache: {e}")
            return False
