/**
 * ElevenLabs Conversational AI Hook
 *
 * Wraps the @elevenlabs/react useConversation hook with custom logic
 * for managing life review interview sessions.
 */

import { useConversation } from '@elevenlabs/react';
import { useState, useCallback, useEffect, useRef } from 'react';
import { QUESTION_SEQUENCE } from '@/config/narratives';

export interface ConversationConfig {
  agentId: string;
  onResponseSaved?: (data: { question: string; answer: string; analysis: string }) => void;
  onQuestionChange?: (questionIndex: number) => void;
  onError?: (error: Error) => void;
  userId?: string;
}

export interface UseElevenLabsConversationReturn {
  // Conversation state
  status: 'disconnected' | 'connecting' | 'connected';
  isSpeaking: boolean;
  isUserSpeaking: boolean;
  currentTranscript: string;

  // Conversation control
  startConversation: () => Promise<void>;
  endConversation: () => Promise<void>;

  // Question management
  currentQuestionIndex: number;
  currentQuestion: string;
  moveToNextQuestion: () => void;

  // Error handling
  error: Error | null;
}

export function useElevenLabsConversation(
  config: ConversationConfig
): UseElevenLabsConversationReturn {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [currentTranscript, setCurrentTranscript] = useState('');
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isUserSpeaking, setIsUserSpeaking] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const currentQuestion = QUESTION_SEQUENCE[currentQuestionIndex]?.prompt || '';

  // Keep a ref of the latest index to avoid stale closures inside SDK-registered tools
  const currentQuestionIndexRef = useRef(currentQuestionIndex);
  useEffect(() => {
    currentQuestionIndexRef.current = currentQuestionIndex;
  }, [currentQuestionIndex]);

  // Handler for saving user responses
  const handleSaveResponse = useCallback(async (params: {
    question: string;
    answer: string;
    analysis: string;
  }) => {
    try {
      console.log('[ElevenLabs] Saving response:', params);

      if (config.onResponseSaved) {
        config.onResponseSaved(params);
      }

      return { success: true, message: 'Response saved successfully' };
    } catch (err) {
      console.error('[ElevenLabs] Error saving response:', err);
      const error = err instanceof Error ? err : new Error('Failed to save response');
      setError(error);
      if (config.onError) {
        config.onError(error);
      }
      return { success: false, message: error.message };
    }
  }, [config]);

  // Handler for moving to next question
  const handleMoveToNextQuestion = useCallback(() => {
    console.log('[ElevenLabs] Moving to next question');

    const nextIndex = currentQuestionIndexRef.current + 1;

    if (nextIndex < QUESTION_SEQUENCE.length) {
      setCurrentQuestionIndex(nextIndex);

      if (config.onQuestionChange) {
        config.onQuestionChange(nextIndex);
      }

      return {
        success: true,
        nextQuestion: QUESTION_SEQUENCE[nextIndex].prompt,
        questionIndex: nextIndex
      };
    }

    return {
      success: false,
      message: 'No more questions available',
      isComplete: true
    };
  }, [config]);

  // Get current question context
  const handleGetCurrentQuestion = useCallback(() => {
    return {
      question: currentQuestion,
      questionIndex: currentQuestionIndex,
      totalQuestions: QUESTION_SEQUENCE.length,
      category: QUESTION_SEQUENCE[currentQuestionIndex]?.category
    };
  }, [currentQuestion, currentQuestionIndex]);

  // Initialize ElevenLabs conversation with client tools
  const conversation = useConversation({
    clientTools: {
      // Tool for agent to save user responses
      saveUserResponse: handleSaveResponse,

      // Tool for agent to move to next question
      moveToNextQuestion: handleMoveToNextQuestion,

      // Tool for agent to get current question context
      getCurrentQuestion: handleGetCurrentQuestion,
    },
    // Note: Voice must be configured in the ElevenLabs agent settings
    // Voice overrides are not supported via the API
  });

  // Monitor conversation events
  useEffect(() => {
    if (!conversation) return;

    // Update speaking states based on conversation status
    // Note: The actual event listeners depend on the ElevenLabs SDK API
    // This is a placeholder structure - adjust based on actual SDK events

    console.log('[ElevenLabs] Conversation status:', conversation.status);

    setIsSpeaking(conversation.isSpeaking || false);

  }, [conversation.status, conversation.isSpeaking]);

  // Start conversation
  const startConversation = useCallback(async () => {
    try {
      console.log('[ElevenLabs] Starting conversation with agent:', config.agentId);

      // Prevent double-starts if already connecting/connected
      if (conversation.status === 'connecting' || conversation.status === 'connected') {
        console.log('[ElevenLabs] Conversation already active, skipping start');
        return;
      }

      await conversation.startSession({
        agentId: config.agentId,
        userId: config.userId,
        connectionType: 'webrtc', // WebRTC provides better real-time performance
      });

      console.log('[ElevenLabs] Conversation started successfully');
    } catch (err) {
      console.error('[ElevenLabs] Error starting conversation:', err);
      const error = err instanceof Error ? err : new Error('Failed to start conversation');
      setError(error);
      if (config.onError) {
        config.onError(error);
      }
    }
  }, [conversation, config]);

  // End conversation
  const endConversation = useCallback(async () => {
    try {
      console.log('[ElevenLabs] Ending conversation');

      await conversation.endSession();

      console.log('[ElevenLabs] Conversation ended successfully');
    } catch (err) {
      console.error('[ElevenLabs] Error ending conversation:', err);
      const error = err instanceof Error ? err : new Error('Failed to end conversation');
      setError(error);
      if (config.onError) {
        config.onError(error);
      }
    }
  }, [conversation, config]);

  // Manual question navigation
  const moveToNextQuestion = useCallback(() => {
    handleMoveToNextQuestion();
  }, [handleMoveToNextQuestion]);

  return {
    status: conversation.status || 'disconnected',
    isSpeaking,
    isUserSpeaking,
    currentTranscript,
    startConversation,
    endConversation,
    currentQuestionIndex,
    currentQuestion,
    moveToNextQuestion,
    error,
  };
}
