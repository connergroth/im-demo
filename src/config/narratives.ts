/**
 * System Narratives Configuration
 *
 * Centralized location for all system prompts, voice narratives, and UI messages.
 * This approach keeps content in code for fast access while making it easy to update.
 */

export const NARRATIVES = {
  /**
   * Voice Intro Narrative
   * Played when user first starts a session
   */
  intro: `Welcome! You're about to begin a conversation that puts your memories and experiences at the heart of it all. Here's how it works: You'll see a button that says 'Start Recording.' When you're ready, press it—and speak your response out loud. There's no need to worry about saying the right thing. Share whatever comes to mind, big or small, at your own pace. You can say as much or as little as you'd like—this system is here to listen to what matters to you. Your story is yours to tell, and there's no wrong way to begin. Ready? Let's take the first step together.`,

  /**
   * Voice Closing Narrative
   * Played when user completes or ends their session
   */
  outro: `Thank you for sharing your stories and memories today. Every conversation is a step toward keeping your mind active, your heart connected, and your legacy alive. Remember, your experiences and wisdom matter—not just to family, but to the world. Whenever you wish to continue, reflect, or simply talk, this space is here for you. Until next time, take care of yourself and know that your story continues to inspire.`,

  /**
   * Help Message
   * Shown when user asks for help or guidance
   */
  help: `No problem! You can press 'Get Question' to hear a new question, or press 'Talk' when you're ready to share your answer. Take your time—there's no rush. If you'd like to skip a question, just press 'Get Question' again.`,

  /**
   * Error Message
   * Shown when something goes wrong
   */
  error: `I apologize, but something went wrong. Please try again, or press 'Get Question' for a new question. If the problem continues, please let us know so we can help.`,
} as const;

/**
 * Question sequence organized by category
 * Questions progress from easy/comfortable to deeper reflection
 */
export const QUESTION_SEQUENCE = [
  // Opening, Comfort Questions
  {
    id: 'name-preference',
    prompt: 'What name would you like to go by today?',
    category: 'opening',
    sortIndex: 1,
  },
  {
    id: 'current-feeling',
    prompt: 'How are you feeling right now?',
    category: 'opening',
    sortIndex: 2,
  },

  // Light Memory Activation
  {
    id: 'childhood-place',
    prompt: 'Can you tell me about where you grew up?',
    category: 'light_memory',
    sortIndex: 3,
  },
  {
    id: 'favorite-food',
    prompt: "What's one favorite food or dish from your childhood?",
    category: 'light_memory',
    sortIndex: 4,
  },
  {
    id: 'memorable-song',
    prompt: 'Do you have a song that always brings back memories?',
    category: 'light_memory',
    sortIndex: 5,
  },

  // Building Connection
  {
    id: 'important-people',
    prompt: 'Who has been important in your life—family, friends, mentors?',
    category: 'connection',
    sortIndex: 6,
  },
  {
    id: 'typical-day',
    prompt: 'What was a typical day like for you when you were young?',
    category: 'connection',
    sortIndex: 7,
  },
  {
    id: 'pets-companions',
    prompt: 'Do you have any pets or companion animals in your story?',
    category: 'connection',
    sortIndex: 8,
  },

  // Gentle Deepening
  {
    id: 'smile-moment',
    prompt: "What's a moment from your life that makes you smile when you think of it?",
    category: 'deepening',
    sortIndex: 9,
  },
  {
    id: 'wisdom-lesson',
    prompt: "What is one lesson or piece of wisdom you'd like your family to remember?",
    category: 'deepening',
    sortIndex: 10,
  },
  {
    id: 'overcoming-challenge',
    prompt: 'Can you share a story about a challenge you faced, and how you overcame it?',
    category: 'deepening',
    sortIndex: 11,
  },

  // Reflective/Identity Prompts
  {
    id: 'proudest-moment',
    prompt: 'What are you most proud of in your life?',
    category: 'reflective',
    sortIndex: 12,
  },
  {
    id: 'family-tradition',
    prompt: 'Is there a tradition or value from your family you hope will continue?',
    category: 'reflective',
    sortIndex: 13,
  },
  {
    id: 'message-to-youth',
    prompt: 'What message would you give to younger generations about living well?',
    category: 'reflective',
    sortIndex: 14,
  },
] as const;

/**
 * AI System Prompt
 * Used by the backend to guide the AI's conversational style
 */
export const SYSTEM_PROMPT = `You are a warm, empathetic conversational AI companion conducting a life review interview. Your role is to help individuals reflect on their life experiences, memories, and wisdom in a way that feels natural, respectful, and deeply personal.

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
- Use their name if they've shared it
- Avoid clinical or overly formal language
- Don't rush them or push for answers they're not ready to share
- Celebrate their willingness to share, especially on difficult topics
- If they seem stuck, offer encouragement or suggest they can skip the question
- Remember that silence and reflection are okay

Your ultimate goal is to help them feel heard, valued, and supported in exploring and preserving their life story.`;

/**
 * Helper function to get questions by category
 */
export function getQuestionsByCategory(category: string) {
  return QUESTION_SEQUENCE.filter(q => q.category === category);
}

/**
 * Helper function to get next question
 */
export function getNextQuestion(currentIndex: number) {
  return QUESTION_SEQUENCE[currentIndex + 1] || null;
}
