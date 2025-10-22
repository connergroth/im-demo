#!/usr/bin/env python3
"""
Simple Questions Seeder
Inserts local questions into Supabase questions table
"""

import os
import sys
from supabase import create_client, Client

# Local questions from the frontend config
QUESTION_SEQUENCE = [
    {
        'id': 'name-preference',
        'prompt': 'What name would you like to go by today?',
        'category': 'opening',
        'sortIndex': 1,
    },
    {
        'id': 'current-feeling',
        'prompt': 'How are you feeling right now?',
        'category': 'opening',
        'sortIndex': 2,
    },
    {
        'id': 'childhood-place',
        'prompt': 'Can you tell me about where you grew up?',
        'category': 'light_memory',
        'sortIndex': 3,
    },
    {
        'id': 'favorite-food',
        'prompt': "What's one favorite food or dish from your childhood?",
        'category': 'light_memory',
        'sortIndex': 4,
    },
    {
        'id': 'memorable-song',
        'prompt': 'Do you have a song that always brings back memories?',
        'category': 'light_memory',
        'sortIndex': 5,
    },
    {
        'id': 'important-people',
        'prompt': 'Who has been important in your life—family, friends, mentors?',
        'category': 'connection',
        'sortIndex': 6,
    },
    {
        'id': 'typical-day',
        'prompt': 'What was a typical day like for you when you were young?',
        'category': 'connection',
        'sortIndex': 7,
    },
    {
        'id': 'pets-companions',
        'prompt': 'Do you have any pets or companion animals in your story?',
        'category': 'connection',
        'sortIndex': 8,
    },
    {
        'id': 'smile-moment',
        'prompt': "What's a moment from your life that makes you smile when you think of it?",
        'category': 'deepening',
        'sortIndex': 9,
    },
    {
        'id': 'wisdom-lesson',
        'prompt': "What is one lesson or piece of wisdom you'd like your family to remember?",
        'category': 'deepening',
        'sortIndex': 10,
    },
    {
        'id': 'overcoming-challenge',
        'prompt': 'Can you share a story about a challenge you faced, and how you overcame it?',
        'category': 'deepening',
        'sortIndex': 11,
    },
    {
        'id': 'proudest-moment',
        'prompt': 'What are you most proud of in your life?',
        'category': 'reflective',
        'sortIndex': 12,
    },
    {
        'id': 'family-tradition',
        'prompt': 'Is there a tradition or value from your family you hope will continue?',
        'category': 'reflective',
        'sortIndex': 13,
    },
    {
        'id': 'message-to-youth',
        'prompt': 'What message would you give to younger generations about living well?',
        'category': 'reflective',
        'sortIndex': 14,
    },
]

def seed_questions():
    """Insert all local questions into Supabase"""
    
    # Get Supabase credentials from environment
    supabase_url = os.getenv('SUPABASE_URL')
    supabase_key = os.getenv('SUPABASE_SERVICE_KEY')
    
    if not supabase_url or not supabase_key:
        print("❌ Missing Supabase credentials")
        print("Please set SUPABASE_URL and SUPABASE_SERVICE_KEY environment variables")
        print("\nExample:")
        print("export SUPABASE_URL='https://your-project.supabase.co'")
        print("export SUPABASE_SERVICE_KEY='your-service-key'")
        return False
    
    try:
        # Initialize Supabase client
        supabase: Client = create_client(supabase_url, supabase_key)
        print("✅ Connected to Supabase")
        
        # Prepare questions data
        questions_data = []
        for question in QUESTION_SEQUENCE:
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
        print("The dashboard will show AI-generated analysis instead of static metrics.")
    else:
        print("💥 Questions seeding failed!")
        sys.exit(1)
