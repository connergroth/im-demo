#!/usr/bin/env python3
"""
Seed Questions Script
Inserts all local questions from narratives.ts into Supabase questions table
"""

import os
import sys
from pathlib import Path

# Add the app directory to Python path
sys.path.append(str(Path(__file__).parent / "app"))

from supabase import create_client, Client
from app.config.narratives import QUESTION_SEQUENCE

def seed_questions():
    """Insert all local questions into Supabase"""
    
    # Get Supabase credentials from environment
    supabase_url = os.getenv('SUPABASE_URL')
    supabase_key = os.getenv('SUPABASE_SERVICE_KEY')
    
    if not supabase_url or not supabase_key:
        print("❌ Missing Supabase credentials")
        print("Please set SUPABASE_URL and SUPABASE_SERVICE_KEY environment variables")
        return False
    
    try:
        # Initialize Supabase client
        supabase: Client = create_client(supabase_url, supabase_key)
        print("✅ Connected to Supabase")
        
        # Prepare questions data
        questions_data = []
        for i, question in enumerate(QUESTION_SEQUENCE, 1):
            questions_data.append({
                'slug': question['id'],
                'prompt': question['prompt'],
                'kind': 'text',
                'category': question['category'],
                'sort_index': question['sortIndex'],
                'is_active': True
            })
        
        print(f"📝 Preparing to insert {len(questions_data)} questions...")
        
        # Insert questions (upsert to handle duplicates)
        result = supabase.table('questions').upsert(
            questions_data,
            on_conflict='slug'
        ).execute()
        
        if result.data:
            print(f"✅ Successfully inserted/updated {len(result.data)} questions")
            
            # Print the questions that were inserted
            print("\n📋 Questions inserted:")
            for i, question in enumerate(result.data, 1):
                print(f"  {i:2d}. {question['prompt']}")
            
            return True
        else:
            print("❌ No data returned from insert")
            return False
            
    except Exception as e:
        print(f"❌ Error inserting questions: {e}")
        return False

if __name__ == "__main__":
    print("🌱 Seeding Questions to Supabase...")
    print("=" * 50)
    
    success = seed_questions()
    
    print("=" * 50)
    if success:
        print("🎉 Questions seeding completed successfully!")
        print("\nYou can now use the dashboard with proper question linking.")
    else:
        print("💥 Questions seeding failed!")
        sys.exit(1)
