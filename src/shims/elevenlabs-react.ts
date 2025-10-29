import { useMemo, useRef, useState, useEffect, useCallback } from "react";

// Minimal shim for @elevenlabs/react to allow builds where the real package
// is unavailable. This does NOT provide real voice; it only mirrors the API
// surface our app uses so the UI can render.

type ConversationStatus = 'disconnected' | 'connecting' | 'connected';

interface StartSessionParams {
  agentId: string;
  userId?: string;
  connectionType?: 'webrtc' | 'rtp';
}

interface UseConversationOptions {
  clientTools?: Record<string, unknown>;
}

export function useConversation(_opts: UseConversationOptions = {}) {
  const [status, setStatus] = useState<ConversationStatus>('disconnected');
  const [isSpeaking, setIsSpeaking] = useState<boolean>(false);

  // Fake toggling speech briefly after connect to keep UI responsive
  const speakTimerRef = useRef<number | null>(null);

  useEffect(() => {
    return () => {
      if (speakTimerRef.current) {
        clearTimeout(speakTimerRef.current);
        speakTimerRef.current = null;
      }
    };
  }, []);

  const startSession = useCallback(async (_params: StartSessionParams) => {
    setStatus('connecting');
    await new Promise((r) => setTimeout(r, 300));
    setStatus('connected');
    // Simulate brief speaking pulse
    setIsSpeaking(true);
    speakTimerRef.current = window.setTimeout(() => setIsSpeaking(false), 800);
  }, []);

  const endSession = useCallback(async () => {
    setIsSpeaking(false);
    setStatus('disconnected');
  }, []);

  return useMemo(() => ({
    status,
    isSpeaking,
    startSession,
    endSession,
  }), [status, isSpeaking, startSession, endSession]);
}


