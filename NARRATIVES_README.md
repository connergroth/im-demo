# System Narratives & Question Configuration

## Overview

This document explains how system prompts, voice narratives, and questions are managed in the Life Review application.

## Why Config Files Instead of Database?

After evaluating both approaches, we chose to keep narratives and prompts in **configuration files** rather than the database for these reasons:

### Advantages of Config Files:
- **Faster Performance**: No database queries needed for every request
- **Simpler for MVP**: Easier to update and deploy
- **Version Control**: Changes tracked in Git with full history
- **Type Safety**: TypeScript provides compile-time checking
- **Easier Testing**: No need to mock database queries
- **No Migration Overhead**: Update and redeploy immediately

### When to Move to Database:
Consider moving to database storage when:
- Non-technical team members need to edit content regularly
- You need A/B testing of different prompts
- You want to personalize prompts per user segment
- You need runtime configuration without redeployment
- You're tracking which prompt version was used for analytics

## File Structure

```
/src/config/narratives.ts          # Frontend configuration (TypeScript)
/backend/app/config/narratives.py  # Backend configuration (Python)
```

Both files maintain the same content to ensure consistency across frontend and backend.

## Configuration Contents

### 1. Voice Narratives

```typescript
NARRATIVES = {
  intro: "...",    // 30-second welcome message
  outro: "...",    // 30-second closing message
  greeting: "...", // Initial greeting
  help: "...",     // Help instructions
  error: "..."     // Error message
}
```

### 2. Question Sequence

14 questions organized by category:
- **Opening** (2 questions): Name, current feeling
- **Light Memory** (3 questions): Childhood place, food, song
- **Connection** (3 questions): Important people, typical day, pets
- **Deepening** (3 questions): Smile moment, wisdom, challenges
- **Reflective** (3 questions): Pride, traditions, advice to youth

### 3. AI System Prompt

The core prompt that guides the AI's conversational style:
- Warm and empathetic tone
- Natural follow-up questions
- Respects user's pace and comfort
- 2-4 sentence responses

## How to Update Content

### Update a Narrative or Question:

1. **Edit the config file**:
   ```typescript
   // src/config/narratives.ts
   export const NARRATIVES = {
     intro: "Your new intro text here...",
     // ...
   }
   ```

2. **Update both files** (keep them in sync):
   - `/src/config/narratives.ts` (TypeScript)
   - `/backend/app/config/narratives.py` (Python)

3. **Test locally**:
   ```bash
   npm run dev  # Test frontend
   # Test backend in another terminal
   ```

4. **Commit and deploy**:
   ```bash
   git add src/config/narratives.ts backend/app/config/narratives.py
   git commit -m "Update intro narrative"
   git push
   ```

### Update the AI System Prompt:

1. Edit `SYSTEM_PROMPT` in both config files
2. Test with the AI to ensure behavior is as expected
3. Commit and deploy

## Using in Code

### Frontend (TypeScript)

```typescript
import { NARRATIVES, QUESTION_SEQUENCE, SYSTEM_PROMPT } from '@/config/narratives';

// Show intro
console.log(NARRATIVES.intro);

// Get first question
const firstQuestion = QUESTION_SEQUENCE[0];

// Get questions by category
import { getQuestionsByCategory } from '@/config/narratives';
const openingQuestions = getQuestionsByCategory('opening');
```

### Backend (Python)

```python
from app.config.narratives import (
    SYSTEM_PROMPT,
    INTRO_NARRATIVE,
    QUESTION_SEQUENCE,
    get_questions_by_category
)

# Use in OpenAI API call
messages = [
    {"role": "system", "content": SYSTEM_PROMPT},
    # ...
]

# Get questions by category
opening_questions = get_questions_by_category('opening')
```

## Migration Notes

### Database Migration Files (Optional)

If you later decide to move to database storage, SQL migration files are available:
- `/supabase/migrations/001_add_narratives_and_system_prompts.sql`
- `/supabase/migrations/002_populate_narratives_and_questions.sql`

These create:
- `system_prompts` table
- `narratives` table
- Proper indexes and RLS policies

To apply migrations:
```bash
# If using Supabase CLI
supabase db push

# Or manually run the SQL files in Supabase dashboard
```

### Hybrid Approach

You could also use a hybrid approach:
- Keep prompts in config files (rarely change)
- Store questions in database (user-editable via admin UI)
- Cache database questions in memory with TTL

## Best Practices

1. **Keep Files in Sync**: Always update both TypeScript and Python configs together
2. **Test Before Deploy**: Always test narrative changes locally first
3. **Keep It Natural**: Voice narratives should sound conversational, not robotic
4. **Version History**: Use Git commit messages to document why prompts changed
5. **User Testing**: Test new questions with real users before deploying

## Question Design Guidelines

When adding new questions:
- Start with easier, safer topics
- Progress to deeper reflection gradually
- Use open-ended phrasing
- Avoid yes/no questions
- Keep questions accessible (clear, simple language)
- Test with target demographic

## Future Enhancements

Potential improvements:
- Admin UI to edit questions (with preview)
- A/B testing framework for prompts
- Personalized question sequencing based on user responses
- Multi-language support
- Question branching/conditional logic

## Support

For questions or issues with narratives:
1. Check this README
2. Review Git history for recent changes
3. Test locally before deploying
4. Create an issue in the repository
