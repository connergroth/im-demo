/**
 * React Hook for AssemblyAI Streaming Transcription
 *
 * Usage:
 * ```tsx
 * const {
 *   transcript,
 *   interimTranscript,
 *   isConnected,
 *   startRecording,
 *   stopRecording,
 *   error
 * } = useAssemblyAIStreaming();
 * ```
 */

import { useState, useRef, useCallback, useEffect } from 'react';
import { AssemblyAIStreaming, type StreamingTranscriptResult } from '../services/assemblyai-streaming';

interface UseAssemblyAIStreamingOptions {
  apiKey?: string;
  autoConnect?: boolean;
  onFinalTranscript?: (text: string) => void;
}

interface UseAssemblyAIStreamingReturn {
  transcript: string; // Final transcript
  interimTranscript: string; // Partial/interim transcript
  isConnected: boolean;
  isRecording: boolean;
  error: Error | null;
  startRecording: () => Promise<void>;
  stopRecording: () => Promise<string>; // Returns final transcript
  connect: () => Promise<void>;
  disconnect: () => void;
}

export function useAssemblyAIStreaming(
  options: UseAssemblyAIStreamingOptions = {}
): UseAssemblyAIStreamingReturn {
  const [transcript, setTranscript] = useState<string>('');
  const [interimTranscript, setInterimTranscript] = useState<string>('');
  const [isConnected, setIsConnected] = useState<boolean>(false);
  const [isRecording, setIsRecording] = useState<boolean>(false);
  const [error, setError] = useState<Error | null>(null);

  const assemblyAIRef = useRef<AssemblyAIStreaming | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const processorRef = useRef<ScriptProcessorNode | null>(null);

  // Get API key from env or options
  const apiKey = options.apiKey || import.meta.env.VITE_ASSEMBLYAI_API_KEY;

  /**
   * Connect to AssemblyAI WebSocket
   */
  const connect = useCallback(async () => {
    // Debug: Log API key info
    const keyPreview = apiKey 
      ? `${apiKey.substring(0, 8)}...${apiKey.substring(apiKey.length - 4)}`
      : 'MISSING';
    console.log('[Hook] Using API key:', keyPreview, `(length: ${apiKey?.length || 0})`);
    console.log('[Hook] Raw env value:', import.meta.env.VITE_ASSEMBLYAI_API_KEY ? 'Present' : 'Missing');
    
    if (!apiKey) {
      const error = new Error('AssemblyAI API key not found. Set VITE_ASSEMBLYAI_API_KEY in .env.local');
      setError(error);
      throw error;
    }

    try {
      const streaming = new AssemblyAIStreaming({
        apiKey,
        sampleRate: 16000,
        onTranscript: (result: StreamingTranscriptResult) => {
          if (result.isFinal) {
            // Final transcript - append to main transcript
            setTranscript((prev) => {
              const newTranscript = prev ? `${prev} ${result.text}` : result.text;
              options.onFinalTranscript?.(newTranscript);
              return newTranscript;
            });
            setInterimTranscript(''); // Clear interim
          } else {
            // Interim transcript - show in progress
            setInterimTranscript(result.text);
          }
        },
        onError: (err: Error) => {
          console.error('[Hook] AssemblyAI error:', err);
          setError(err);
        },
        onClose: () => {
          setIsConnected(false);
        },
      });

      await streaming.connect();
      assemblyAIRef.current = streaming;
      setIsConnected(true);
      setError(null);
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to connect to AssemblyAI');
      setError(error);
      throw error;
    }
  }, [apiKey, options.onFinalTranscript]);

  /**
   * Disconnect from AssemblyAI WebSocket
   */
  const disconnect = useCallback(() => {
    if (assemblyAIRef.current) {
      assemblyAIRef.current.close();
      assemblyAIRef.current = null;
      setIsConnected(false);
    }
  }, []);

  /**
   * Start recording and streaming audio
   */
  const startRecording = useCallback(async () => {
    try {
      // Connect if not already connected
      if (!assemblyAIRef.current?.isConnected()) {
        await connect();
      }

      // Clear previous transcripts
      setTranscript('');
      setInterimTranscript('');
      setError(null);

      // Get microphone access
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          sampleRate: 16000,
        },
      });
      mediaStreamRef.current = stream;

      // Create AudioContext for processing
      const audioContext = new AudioContext({ sampleRate: 16000 });
      audioContextRef.current = audioContext;

      // Create audio source from stream
      const source = audioContext.createMediaStreamSource(stream);

      // Create script processor for raw audio data (smaller chunks for better streaming)
      const processor = audioContext.createScriptProcessor(1024, 1, 1);
      processorRef.current = processor;

      processor.onaudioprocess = (event) => {
        if (!assemblyAIRef.current?.isConnected()) {
          return;
        }

        // Get audio data from first channel
        const inputData = event.inputBuffer.getChannelData(0);

        // Convert Float32Array to Int16Array for AssemblyAI
        const int16Data = new Int16Array(inputData.length);
        for (let i = 0; i < inputData.length; i++) {
          const s = Math.max(-1, Math.min(1, inputData[i]));
          int16Data[i] = s < 0 ? s * 0x8000 : s * 0x7fff;
        }

        // Send to AssemblyAI
        assemblyAIRef.current.sendAudio(int16Data);
      };

      // Connect audio graph
      source.connect(processor);
      processor.connect(audioContext.destination);

      setIsRecording(true);
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to start recording');
      setError(error);
      throw error;
    }
  }, [connect]);

  /**
   * Stop recording and get final transcript
   */
  const stopRecording = useCallback(async (): Promise<string> => {
    setIsRecording(false);

    // Stop audio processing
    if (processorRef.current) {
      processorRef.current.disconnect();
      processorRef.current = null;
    }

    if (audioContextRef.current) {
      await audioContextRef.current.close();
      audioContextRef.current = null;
    }

    // Stop media stream
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach((track) => track.stop());
      mediaStreamRef.current = null;
    }

    // Signal end of stream to AssemblyAI
    if (assemblyAIRef.current?.isConnected()) {
      assemblyAIRef.current.endStream();
    }

    // Wait a bit for final transcripts to arrive
    await new Promise((resolve) => setTimeout(resolve, 500));

    return transcript;
  }, [transcript]);

  /**
   * Auto-connect if enabled
   */
  useEffect(() => {
    if (options.autoConnect && apiKey && !isConnected) {
      connect().catch(console.error);
    }

    // Cleanup only on unmount, not on every dependency change
    return () => {
      // Only disconnect if we're actually connected
      if (assemblyAIRef.current?.isConnected()) {
        disconnect();
      }
    };
  }, [options.autoConnect, apiKey]);

  return {
    transcript,
    interimTranscript,
    isConnected,
    isRecording,
    error,
    startRecording,
    stopRecording,
    connect,
    disconnect,
  };
}
