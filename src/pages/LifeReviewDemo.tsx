import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Mic, Volume2, Loader2, PlayCircle, StopCircle, Zap } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { apiClient } from "@/lib/api-client";
import { supabase } from "@/lib/supabase";
import { getOrCreateGuestId } from "@/lib/guestSession";
import { useAssemblyAIStreaming } from "@/hooks/useAssemblyAIStreaming";
import { NARRATIVES, QUESTION_SEQUENCE } from "@/config/narratives";

interface Response {
  question: string;
  answer: string;
  analysis: string;
  followUpQuestion?: string;
  followUpAnswer?: string;
  followUpAnalysis?: string;
}

const LifeReviewDemo = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [questions, setQuestions] = useState<string[]>([]);
  const [showVoiceSelection, setShowVoiceSelection] = useState(true);
  const [hasStarted, setHasStarted] = useState(false);
  const [onboardingComplete, setOnboardingComplete] = useState(false);
  const [showWelcomeUI, setShowWelcomeUI] = useState(false);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [isRecording, setIsRecording] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [transcript, setTranscript] = useState("");
  const [aiAnalysis, setAiAnalysis] = useState("");
  const [responses, setResponses] = useState<Response[]>([]);
  const [selectedVoice, setSelectedVoice] = useState<"male" | "female">("female");
  const recordingDuration = 180; // 3 minutes max (prevents accidental long sessions)
  const [backendStatus, setBackendStatus] = useState<'checking' | 'online' | 'offline'>('checking');
  const [useStreamingTranscription, setUseStreamingTranscription] = useState(true); // Default to streaming
  
  // Follow-up response state
  const [currentResponseIndex, setCurrentResponseIndex] = useState<number>(-1);
  const [showFollowUpOptions, setShowFollowUpOptions] = useState(false);
  const [followUpTranscript, setFollowUpTranscript] = useState("");
  const [followUpAnalysis, setFollowUpAnalysis] = useState("");

  // Supabase session tracking
  const [guestId, setGuestId] = useState<string>('');
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [questionIds, setQuestionIds] = useState<Record<string, string>>({}); // Map question text to ID
  const [userDisplayName, setUserDisplayName] = useState<string | null>(null); // Store user's chosen name

  // Legacy Whisper recording refs (fallback)
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // AssemblyAI Streaming (NEW DEFAULT)
  const assemblyAI = useAssemblyAIStreaming({
    autoConnect: false, // Connect on demand
    onFinalTranscript: (finalText) => {
      console.log('[Streaming] Final transcript:', finalText);
      if (showFollowUpOptions) {
        setFollowUpTranscript(finalText);
      } else {
        setTranscript(finalText);
      }
    },
  });

  // Debug AssemblyAI state
  useEffect(() => {
    console.log('[AssemblyAI Debug]', {
      isConnected: assemblyAI.isConnected,
      isRecording: assemblyAI.isRecording,
      transcript: assemblyAI.transcript,
      interimTranscript: assemblyAI.interimTranscript,
      error: assemblyAI.error,
      useStreamingTranscription,
      hasApiKey: !!import.meta.env.VITE_ASSEMBLYAI_API_KEY
    });
  }, [assemblyAI.isConnected, assemblyAI.isRecording, assemblyAI.transcript, assemblyAI.interimTranscript, assemblyAI.error, useStreamingTranscription]);

  // Debug voice selection state
  useEffect(() => {
    console.log('[Voice Debug]', {
      selectedVoice,
      showVoiceSelection,
      voiceMap: voiceMap[selectedVoice]
    });
  }, [selectedVoice, showVoiceSelection]);

  // Voice mapping: user-friendly labels to OpenAI voice IDs
  const voiceMap = {
    male: 'onyx',    // Deep, warm male voice
    female: 'nova',  // Warm, empathetic female voice
  };

  // Initialize guest session on mount
  useEffect(() => {
    const id = getOrCreateGuestId();
    setGuestId(id);
    createSupabaseSession(id);
    loadQuestionsFromSupabase();
  }, []);

  // Check backend health on mount
  useEffect(() => {
    checkBackendHealth();
  }, []);

  // Pre-cache narratives when backend is online AND voice is selected
  useEffect(() => {
    if (backendStatus === 'online' && selectedVoice && !showVoiceSelection) {
      // Add a small delay to prevent multiple rapid calls
      const timeoutId = setTimeout(() => {
        preCacheNarratives();
      }, 1000);
      
      return () => clearTimeout(timeoutId);
    }
  }, [backendStatus, selectedVoice, showVoiceSelection]);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (audioRef.current) audioRef.current.pause();
      assemblyAI.disconnect();
    };
  }, []);


  const checkBackendHealth = async () => {
    setBackendStatus('checking');
    try {
      const isHealthy = await apiClient.healthCheck();
      setBackendStatus(isHealthy ? 'online' : 'offline');
      if (!isHealthy) {
        toast({
          title: "Backend Offline",
          description: "Cannot connect to the backend API. Please check your connection.",
          variant: "destructive",
        });
      }
    } catch (error) {
      setBackendStatus('offline');
      toast({
        title: "Backend Error",
        description: "Failed to connect to backend. Using demo mode.",
        variant: "destructive",
      });
    }
  };

  // Pre-cache narratives for faster loading
  const preCacheNarratives = async () => {
    try {
      const openAIVoice = voiceMap[selectedVoice];
      console.log(`[Frontend] Pre-caching narratives for voice: ${openAIVoice} (selectedVoice: ${selectedVoice})`);
      
      const result = await apiClient.preCacheNarratives(openAIVoice as any);
      
      if (result.success) {
        console.log(`[Frontend] ✅ Pre-cached ${result.cached_count}/${result.total_count} narratives for ${openAIVoice}`);
      } else {
        console.warn('[Frontend] Pre-caching failed or already in progress');
      }
    } catch (error) {
      console.warn('[Frontend] Failed to pre-cache narratives:', error);
      // Don't show error toast as this is not critical
    }
  };

  // Create a Supabase session for this demo run
  const createSupabaseSession = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('sessions')
        .insert({
          user_id: userId,
          channel: 'voice',
          started_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (error) {
        console.error('Error creating session:', error);
        return;
      }

      setSessionId(data.id);
      console.log('Session created:', data.id);
    } catch (error) {
      console.error('Failed to create session:', error);
    }
  };

  // Load questions from Supabase to get their IDs
  const loadQuestionsFromSupabase = async () => {
    try {
      const { data, error } = await supabase
        .from('questions')
        .select('id, prompt')
        .eq('is_active', true)
        .order('sort_index', { ascending: true });

      if (error) {
        console.error('Error loading questions:', error);
        return;
      }

      if (data && data.length > 0) {
        // Create a map of question text to question ID
        const idMap: Record<string, string> = {};
        const questionTexts: string[] = [];
        
        data.forEach(q => {
          idMap[q.prompt] = q.id;
          questionTexts.push(q.prompt);
        });
        
        setQuestionIds(idMap);
        setQuestions(questionTexts);
        console.log('Loaded questions from Supabase:', data.length);
      } else {
        // Fallback to local questions if Supabase is empty
        console.warn('No questions found in Supabase, using local fallback');
        const localQuestions = QUESTION_SEQUENCE.map(q => q.prompt);
        setQuestions(localQuestions);
      }
    } catch (error) {
      console.error('Failed to load questions:', error);
      // Fallback to local questions if Supabase fails
      console.warn('Supabase failed, using local question fallback');
      const localQuestions = QUESTION_SEQUENCE.map(q => q.prompt);
      setQuestions(localQuestions);
    }
  };

  // Save user's display name to profile
  const saveDisplayNameToProfile = async (name: string) => {
    if (!guestId) {
      console.warn('No guest ID available for saving display name');
      return;
    }

    try {
      const { error } = await supabase
        .from('profiles')
        .upsert({
          user_id: guestId,
          display_name: name,
        });

      if (error) {
        console.error('Error saving display name:', error);
        return;
      }

      setUserDisplayName(name);
      console.log(`Saved display name: ${name} for user: ${guestId}`);
    } catch (error) {
      console.error('Failed to save display name:', error);
    }
  };

  // Save answer to Supabase
  const saveAnswerToSupabase = async (questionText: string, answerText: string) => {
    if (!sessionId || !guestId) {
      console.warn('No session or guest ID available');
      return;
    }

    // Get the question ID from our map, or create a generic one if not found
    const questionId = questionIds[questionText];

    if (!questionId) {
      console.warn('Question ID not found for:', questionText);
      // Skip saving if we don't have a valid question ID
      return;
    }

    try {
      // Save answer
      const { data: answerData, error: answerError } = await supabase
        .from('answers')
        .insert({
          session_id: sessionId,
          user_id: guestId,
          question_id: questionId,
          answer_text: answerText,
        })
        .select()
        .single();

      if (answerError) {
        console.error('Error saving answer:', answerError);
        return;
      }

      // Save transcript
      const { data: transcriptData, error: transcriptError } = await supabase
        .from('transcripts')
        .insert({
          session_id: sessionId,
          user_id: guestId,
          text: answerText,
          language: 'en',
        })
        .select()
        .single();

      if (transcriptError) {
        console.error('Error saving transcript:', transcriptError);
      }

      // Call NLP Edge Function to extract insights (async, non-blocking)
      if (answerData && transcriptData) {
        callNLPEdgeFunction(answerText, answerData.id, transcriptData.id);
      }

      console.log('Answer saved successfully');
    } catch (error) {
      console.error('Failed to save answer:', error);
    }
  };

  // Recompute user profile (async)
  const recomputeProfile = async () => {
    if (!guestId) return;

    try {
      const { data, error } = await supabase.rpc('recompute_profile', {
        target_user: guestId,
      });

      if (error) {
        // For MVP: Profile recomputation might fail if there are no weighted options
        // This is OK - the profile will be computed when the session ends via trigger
        console.warn('Profile recomputation skipped (will run on session end):', error.message);
        return;
      }

      console.log('Profile recomputed:', data);
    } catch (error) {
      console.error('Failed to recompute profile:', error);
    }
  };

  // Call NLP Edge Function to extract insights from text
  const callNLPEdgeFunction = async (text: string, answerId: string, transcriptId: string) => {
    if (!sessionId || !guestId) return;

    try {
      const { data, error } = await supabase.functions.invoke('nlp-extract', {
        body: {
          user_id: guestId,
          session_id: sessionId,
          source_type: 'answer',
          source_id: answerId,
          text: text,
        },
      });

      if (error) {
        console.error('NLP extraction error:', error);
        return;
      }

      console.log('NLP extraction completed:', data);
    } catch (error) {
      console.error('Failed to call NLP Edge Function:', error);
    }
  };

  // End session and navigate to dashboard
  const endSessionAndNavigate = async () => {
    if (!sessionId) return;

    try {
      const { error } = await supabase
        .from('sessions')
        .update({ ended_at: new Date().toISOString() })
        .eq('id', sessionId);

      if (error) {
        console.error('Error ending session:', error);
      }

      // Navigate to dashboard
      navigate('/dashboard');
    } catch (error) {
      console.error('Failed to end session:', error);
      // Navigate anyway
      navigate('/dashboard');
    }
  };


  const speakText = async (text: string, contentType: 'narrative' | 'question' | 'greeting' | 'outro' = 'narrative', voiceOverride?: 'male' | 'female') => {
    if (backendStatus !== 'online') {
      toast({
        title: "Backend Offline",
        description: "Cannot generate speech. Backend is not available.",
        variant: "destructive",
      });
      return;
    }

    setIsSpeaking(true);
    try {
      // Use provided voice or current selected voice
      const voiceToUse = voiceOverride || selectedVoice;
      const openAIVoice = voiceMap[voiceToUse];
      
      console.log(`Speaking: ${text.substring(0, 50)}... with voice: ${openAIVoice} (${voiceToUse})`);
      
      const audioBlob = await apiClient.textToSpeech(text, openAIVoice as any, contentType);
      const audioUrl = URL.createObjectURL(audioBlob);

      if (audioRef.current) {
        audioRef.current.pause();
      }

      audioRef.current = new Audio(audioUrl);
      
      // Wait for audio to finish playing
      await new Promise<void>((resolve, reject) => {
        if (!audioRef.current) {
          reject(new Error('Audio element not available'));
          return;
        }
        
        audioRef.current.onended = () => {
          URL.revokeObjectURL(audioUrl); // Clean up
          resolve();
        };
        
        audioRef.current.onerror = () => {
          URL.revokeObjectURL(audioUrl); // Clean up
          reject(new Error('Audio playback failed'));
        };
        
        audioRef.current.play().catch(reject);
      });
      
      setIsSpeaking(false);
    } catch (error) {
      console.error('Error with TTS:', error);
      toast({
        title: "Speech Error",
        description: error instanceof Error ? error.message : "Failed to generate speech.",
        variant: "destructive",
      });
      setIsSpeaking(false);
    }
  };

  // NEW: Streaming transcription (default)
  const startRecording = async () => {
    // Clear previous state
    if (showFollowUpOptions) {
      setFollowUpTranscript("");
      setFollowUpAnalysis("");
    } else {
      setTranscript("");
      setAiAnalysis("");
    }

    const hasAssemblyAIKey = !!import.meta.env.VITE_ASSEMBLYAI_API_KEY;
    console.log('[Recording] Check:', {
      useStreamingTranscription,
      hasAssemblyAIKey,
      keyValue: import.meta.env.VITE_ASSEMBLYAI_API_KEY ? 'Present' : 'Missing'
    });

    if (useStreamingTranscription && hasAssemblyAIKey) {
      // Use AssemblyAI streaming (real-time)
      try {
        console.log('[Recording] Starting AssemblyAI streaming...');
        setIsRecording(true);
        setRecordingTime(0);

        await assemblyAI.startRecording();

        toast({
          title: "🎙️ Recording Started",
          description: "Speak now - you'll see your words appear in real-time!",
        });

        // Start countdown timer
        timerRef.current = setInterval(() => {
          setRecordingTime(prev => {
            if (prev >= recordingDuration - 1) {
              stopRecording();
              return recordingDuration;
            }
            return prev + 1;
          });
        }, 1000);
      } catch (error) {
        console.error('Error starting streaming recording:', error);

        // Fallback to legacy Whisper if streaming fails
        toast({
          title: "Streaming Failed",
          description: "Falling back to standard transcription...",
          variant: "destructive",
        });
        setUseStreamingTranscription(false);
        await startRecordingLegacy();
      }
    } else {
      // Use legacy Whisper (batch mode)
      console.log('[Recording] Using legacy Whisper transcription (no AssemblyAI key or streaming disabled)');
      await startRecordingLegacy();
    }
  };

  const stopRecording = async () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }

    if (useStreamingTranscription && assemblyAI.isRecording) {
      // Stop AssemblyAI streaming
      setIsRecording(false);

      // Get the current transcript immediately (don't wait for stopRecording)
      const currentTranscript = showFollowUpOptions ? followUpTranscript : assemblyAI.transcript;

      // Stop the recording stream (this cleans up resources)
      assemblyAI.stopRecording();

      // Start AI analysis IMMEDIATELY with what we have
      // This provides instant feedback instead of waiting
      if (currentTranscript && currentTranscript.trim().length > 0) {
        console.log('[Stop Recording] Starting AI analysis immediately with:', currentTranscript);
        
        // Show immediate feedback
        toast({
          title: "🎤 Processing...",
          description: "Analyzing your response...",
        });
        
        // Start analysis in background (don't await to keep UI responsive)
        generateAnalysis(currentTranscript, showFollowUpOptions).catch(error => {
          console.error('Analysis failed:', error);
          toast({
            title: "Analysis Error",
            description: "Failed to analyze response. Please try again.",
            variant: "destructive",
          });
        });
      } else {
        console.warn('[Stop Recording] No transcript available yet');
        toast({
          title: "No speech detected",
          description: "Please try recording again and speak clearly.",
          variant: "destructive",
        });
      }
    } else if (mediaRecorderRef.current && isRecording) {
      // Stop legacy recorder
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  // Play TTS from file path (for parallel processing)
  const playTTSFromPath = async (ttsPath: string) => {
    try {
      // Fetch the audio file from the backend
      const response = await fetch(`http://localhost:5001${ttsPath}`);
      if (!response.ok) {
        throw new Error('Failed to fetch TTS audio');
      }
      
      const audioBlob = await response.blob();
      const audioUrl = URL.createObjectURL(audioBlob);

      if (audioRef.current) {
        audioRef.current.pause();
      }

      audioRef.current = new Audio(audioUrl);
      
      // Wait for audio to finish playing
      await new Promise<void>((resolve, reject) => {
        if (!audioRef.current) {
          reject(new Error('Audio element not available'));
          return;
        }
        
        audioRef.current.onended = () => {
          URL.revokeObjectURL(audioUrl); // Clean up
          resolve();
        };
        
        audioRef.current.onerror = () => {
          URL.revokeObjectURL(audioUrl); // Clean up
          reject(new Error('Audio playback failed'));
        };
        
        audioRef.current.play().catch(reject);
      });
      
    } catch (error) {
      console.error('Error playing TTS from path:', error);
      throw error;
    }
  };

  // LEGACY: Whisper batch transcription (fallback)
  const startRecordingLegacy = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream, { mimeType: 'audio/webm' });

      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        stream.getTracks().forEach(track => track.stop());
        await transcribeAudio();
      };

      mediaRecorderRef.current = mediaRecorder;
      mediaRecorder.start();
      setIsRecording(true);
      setRecordingTime(0);

      toast({
        title: "🎙️ Recording Started",
        description: "Speak now - transcript will appear when you stop.",
      });

      // Start countdown timer
      timerRef.current = setInterval(() => {
        setRecordingTime(prev => {
          if (prev >= recordingDuration - 1) {
            stopRecording();
            return recordingDuration;
          }
          return prev + 1;
        });
      }, 1000);

    } catch (error) {
      console.error('Error starting recording:', error);
      toast({
        title: "Recording Error",
        description: "Could not access microphone. Please check permissions.",
        variant: "destructive",
      });
    }
  };

  const transcribeAudio = async () => {
    if (backendStatus !== 'online') {
      toast({
        title: "Backend Offline",
        description: "Cannot transcribe audio. Backend is not available.",
        variant: "destructive",
      });
      return;
    }

    setIsProcessing(true);
    try {
      const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });

      const result = await apiClient.transcribeAudio(audioBlob);
      setTranscript(result.transcript);

      // Automatically generate AI analysis
      await generateAnalysis(result.transcript);

    } catch (error) {
      console.error('Error transcribing audio:', error);
      toast({
        title: "Transcription Error",
        description: error instanceof Error ? error.message : "Failed to transcribe audio.",
        variant: "destructive",
      });
      setIsProcessing(false);
    }
  };

  const generateAnalysis = async (transcriptText: string, isFollowUp: boolean = false) => {
    if (backendStatus !== 'online') {
      toast({
        title: "Backend Offline",
        description: "Cannot analyze response. Backend is not available.",
        variant: "destructive",
      });
      setIsProcessing(false);
      return;
    }

    try {
      let result;
      
      // Check if this is the first question (name question)
      const isNameQuestion = !isFollowUp && currentQuestionIndex === 0 && questions[currentQuestionIndex].includes('name');
      
      if (isFollowUp) {
        // Use follow-up analysis endpoint with context
        const currentResponse = responses[currentResponseIndex];
        result = await apiClient.analyzeFollowup(
          currentResponse.question,
          currentResponse.answer,
          transcriptText,
          voiceMap[selectedVoice] as any
        );
        setFollowUpAnalysis(result.analysis);
        
        // Update existing response with follow-up data
        setResponses(prev => prev.map((response, idx) => 
          idx === currentResponseIndex 
            ? {
                ...response,
                followUpAnswer: transcriptText,
                followUpAnalysis: result.analysis
              }
            : response
        ));
      } else {
        if (isNameQuestion) {
          // For the name question, save the name and provide a simple acknowledgment
          await saveDisplayNameToProfile(transcriptText.trim());
          
          // Create a simple acknowledgment response
          const acknowledgmentText = `Okay great, it's nice to meet you ${transcriptText.trim()}! I'm looking forward to our conversation.`;
          
          // Generate TTS for the acknowledgment
          const audioBlob = await apiClient.textToSpeech(acknowledgmentText, voiceMap[selectedVoice] as any, 'greeting');
          const audioUrl = URL.createObjectURL(audioBlob);

          setAiAnalysis(acknowledgmentText);
          
          // Create new response
          setResponses(prev => [...prev, {
            question: questions[currentQuestionIndex],
            answer: transcriptText,
            analysis: acknowledgmentText,
          }]);
          
          // Play the acknowledgment
          if (audioRef.current) {
            audioRef.current.pause();
          }

          audioRef.current = new Audio(audioUrl);
          
          // Wait for audio to finish playing
          await new Promise<void>((resolve, reject) => {
            if (!audioRef.current) {
              reject(new Error('Audio element not available'));
              return;
            }
            
            audioRef.current.onended = () => {
              URL.revokeObjectURL(audioUrl); // Clean up
              resolve();
            };
            
            audioRef.current.onerror = () => {
              URL.revokeObjectURL(audioUrl); // Clean up
              reject(new Error('Audio playback failed'));
            };
            
            audioRef.current.play().catch(reject);
          });
        } else {
          // Use regular analysis endpoint for other questions
          result = await apiClient.analyzeAndTTS(
            questions[currentQuestionIndex],
            transcriptText,
            voiceMap[selectedVoice] as any
          );
          setAiAnalysis(result.analysis);
          
          // Create new response
          setResponses(prev => [...prev, {
            question: questions[currentQuestionIndex],
            answer: transcriptText,
            analysis: result.analysis,
          }]);
          
          // Play the pre-generated TTS audio immediately
          if (result.tts_path) {
            await playTTSFromPath(result.tts_path);
          } else {
            // Fallback to regular TTS if parallel failed
            await speakText(result.analysis, 'narrative', selectedVoice);
          }
        }
      }

      // Save to Supabase (async, non-blocking) - skip for name question since we handle it separately
      if (!isNameQuestion) {
        saveAnswerToSupabase(
          questions[currentQuestionIndex],
          transcriptText
        );
      }

    } catch (error) {
      console.error('Error generating analysis:', error);
      toast({
        title: "Analysis Error",
        description: error instanceof Error ? error.message : "Failed to generate AI analysis.",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleNextQuestion = () => {
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
      setTranscript("");
      setAiAnalysis("");
      setRecordingTime(0);
      setShowFollowUpOptions(false);
      setCurrentResponseIndex(-1);
      setFollowUpTranscript("");
      setFollowUpAnalysis("");

      // Speak the next question
      setTimeout(() => {
        speakText(questions[currentQuestionIndex + 1], 'question', selectedVoice);
      }, 500);
    } else {
      // Interview complete - end session and go to dashboard
      toast({
        title: "Interview Complete!",
        description: `You've answered all ${questions.length} questions. Redirecting to your dashboard...`,
      });

      setTimeout(() => {
        endSessionAndNavigate();
      }, 2000);
    }
  };

  const handleRespondToFollowUp = () => {
    setShowFollowUpOptions(true);
    setCurrentResponseIndex(responses.length - 1);
    setFollowUpTranscript("");
    setFollowUpAnalysis("");
    setTranscript("");
    setAiAnalysis("");
    setRecordingTime(0);
    
    toast({
      title: "Follow-up Response",
      description: "You can now respond to the follow-up question or continue to the next question.",
    });
  };

  const handleContinueToNext = () => {
    setShowFollowUpOptions(false);
    setCurrentResponseIndex(-1);
    setFollowUpTranscript("");
    setFollowUpAnalysis("");
    handleNextQuestion();
  };

  const handleVoiceSelection = (voice: "male" | "female") => {
    console.log(`[Voice Selection] User clicked: ${voice}, current selectedVoice: ${selectedVoice}`);
    setSelectedVoice(voice);
    console.log(`[Voice Selection] Set selectedVoice to: ${voice}`);
    setShowVoiceSelection(false);
    
    // Pre-cache narratives for the selected voice immediately
    if (backendStatus === 'online') {
      setTimeout(() => {
        preCacheNarratives();
      }, 200);
    }
    
    // Start onboarding after voice selection - pass the voice directly
    setTimeout(() => {
      handleStartInterview(voice);
    }, 500);
  };

  const handleStartInterview = async (voice?: "male" | "female") => {
    const voiceToUse = voice || selectedVoice;
    setHasStarted(true);
    setShowWelcomeUI(true);

    // Play intro narrative - wait for completion
    await speakText(NARRATIVES.intro, 'narrative', voiceToUse);

    // Hide welcome UI and mark onboarding as complete
    setShowWelcomeUI(false);
    setOnboardingComplete(true);

    // Wait a moment, then speak the first question
    setTimeout(() => {
      speakText(questions[0], 'question', voiceToUse);
    }, 1500);
  };


  return (
    <div className="min-h-screen bg-background">
      {/* Voice Selection Screen */}
      {showVoiceSelection && (
        <div className="fixed inset-0 bg-background z-50 flex items-center justify-center">
          <div className="max-w-2xl mx-auto px-4 py-12">
            <Card className="border-border/50 shadow-2xl bg-gradient-to-br from-card to-card/50 backdrop-blur-sm">
              <CardHeader className="text-center pb-6">
                <CardTitle className="text-3xl font-semibold tracking-tight mb-2">
                  Choose Your AI Guide
                </CardTitle>
                <CardDescription className="text-base font-light">
                  Select the voice that will guide you through your life review journey
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6 pb-8">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Female Voice Option */}
                  <button
                    onClick={() => handleVoiceSelection("female")}
                    className={`group relative p-6 rounded-xl border-2 transition-all duration-300 hover:scale-105 hover:shadow-lg ${
                      selectedVoice === "female"
                        ? 'border-primary bg-primary/5'
                        : 'border-border/50 hover:border-primary/50'
                    }`}
                  >
                    <div className="space-y-3 text-center">
                      <div className="w-16 h-16 mx-auto rounded-full bg-gradient-to-br from-pink-200 via-pink-300 to-pink-400 flex items-center justify-center">
                        <Volume2 className="h-8 w-8 text-white" />
                      </div>
                      <h3 className="text-lg font-semibold">Nova</h3>
                      <p className="text-sm text-muted-foreground font-light">
                        Warm & Empathetic
                      </p>
                    </div>
                  </button>

                  {/* Male Voice Option */}
                  <button
                    onClick={() => handleVoiceSelection("male")}
                    className={`group relative p-6 rounded-xl border-2 transition-all duration-300 hover:scale-105 hover:shadow-lg ${
                      selectedVoice === "male"
                        ? 'border-primary bg-primary/5'
                        : 'border-border/50 hover:border-primary/50'
                    }`}
                  >
                    <div className="space-y-3 text-center">
                      <div className="w-16 h-16 mx-auto rounded-full bg-gradient-to-br from-blue-200 via-blue-300 to-blue-400 flex items-center justify-center">
                        <Volume2 className="h-8 w-8 text-white" />
                      </div>
                      <h3 className="text-lg font-semibold">Onyx</h3>
                      <p className="text-sm text-muted-foreground font-light">
                        Deep & Calm
                      </p>
                    </div>
                  </button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {/* Welcome UI - Inline with bubble indicator */}
      {showWelcomeUI && (
        <div className="fixed inset-0 bg-background z-50 flex items-center justify-center">
          <div className="max-w-3xl mx-auto px-4 text-center space-y-8 animate-fade-in">
            {/* Voice Bubble Indicator */}
            <div className="flex justify-center">
              <div className="relative">
                {/* Outer glow rings - animated when speaking */}
                <div className="absolute inset-0 rounded-full bg-pink-300/30 blur-2xl animate-ping-slow scale-150 opacity-100" style={{ width: '160px', height: '160px' }} />
                <div className="absolute inset-0 rounded-full bg-pink-200/40 blur-xl animate-ping-slower scale-125 opacity-100" style={{ width: '120px', height: '120px' }} />

                {/* Main orb */}
                <div className="relative rounded-full shadow-2xl bg-gradient-to-br from-pink-200 via-pink-300 to-pink-400 scale-110" style={{ width: '100px', height: '100px' }}>
                  <div className="absolute inset-2 rounded-full bg-gradient-to-br from-pink-100/60 to-transparent animate-pulse" />
                  <div className="absolute inset-0 rounded-full overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent animate-shimmer-fast" style={{ width: '200%' }} />
                  </div>
                </div>
              </div>
            </div>

            {/* Welcome Message */}
            <div className="space-y-4">
              <h2 className="text-3xl md:text-4xl font-semibold tracking-tight text-foreground">
                Welcome to Your Life Review
              </h2>
              <p className="text-lg text-foreground/70 font-light leading-relaxed max-w-xl mx-auto">
                Listen as I introduce how our conversation will work...
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Minimal Top Navigation */}
      {!showVoiceSelection && !showWelcomeUI && (
        <nav className="border-b border-border/50 bg-background/80 backdrop-blur-sm sticky top-0 z-40">
          <div className="container mx-auto px-4 py-4">
            <div className="flex items-center justify-between">
              <button
                onClick={() => navigate('/')}
                className="text-sm font-light tracking-[0.3em] text-foreground/60 hover:text-foreground transition-colors"
              >
                IM
              </button>
              <div className="flex items-center gap-4">
                <div className={`px-3 py-1 rounded-full text-xs font-light ${
                  backendStatus === 'online' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300' :
                  backendStatus === 'offline' ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300' :
                  'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300'
                }`}>
                  {backendStatus === 'online' ? '● Online' :
                   backendStatus === 'offline' ? '● Offline' :
                   '● Checking...'}
                </div>
                {backendStatus === 'offline' && (
                  <Button size="sm" variant="ghost" onClick={checkBackendHealth} className="text-sm font-light">
                    Retry
                  </Button>
                )}
              </div>
            </div>
          </div>
        </nav>
      )}

      {/* Main Interview Content - Only show after voice selection */}
      {!showVoiceSelection && (
        <>
      {/* Compact Header */}
      <div className="relative bg-gradient-to-b from-primary/5 to-background border-b border-border/30">
        <div className="container mx-auto px-4 py-6">
          <div className="max-w-4xl mx-auto text-center space-y-3 animate-fade-in">
            <div className="flex items-center justify-between">
              <div className="flex-1" />
              <div className="flex-1 text-center">
                <h1 className="text-2xl font-semibold tracking-tight text-foreground">
                  Life Review Session
                </h1>
              </div>
              <div className="flex-1 flex justify-end">
                <span className="text-xs font-light tracking-wide text-foreground/60 uppercase">
                  {currentQuestionIndex + 1} / {questions.length}
                </span>
              </div>
            </div>
            <div className="max-w-2xl mx-auto">
              <Progress
                value={((currentQuestionIndex + 1) / questions.length) * 100}
                className="h-1.5 bg-muted"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto space-y-8">
          {/* Voice Indicator & Question Display - Combined Section */}
          <div className="max-w-4xl mx-auto space-y-12">
            {/* Voice Indicator - Always visible, animates when active */}
            <div className="flex justify-center">
              <div className="relative py-4">
                {/* Main floating orb */}
                <div className="relative flex items-center justify-center">
                  {/* Outer glow rings - only animate when active */}
                  <div className={`absolute inset-0 rounded-full bg-pink-300/30 blur-2xl transition-all duration-700 ${
                    isSpeaking ? 'animate-ping-slow scale-150 opacity-100' :
                    isRecording ? 'animate-pulse scale-125 opacity-100' :
                    'scale-100 opacity-0'
                  }`} style={{ width: '160px', height: '160px' }} />

                  <div className={`absolute inset-0 rounded-full bg-pink-200/40 blur-xl transition-all duration-700 ${
                    isSpeaking ? 'animate-ping-slower scale-125 opacity-100' :
                    isRecording ? 'animate-pulse scale-110 opacity-100' :
                    'scale-100 opacity-0'
                  }`} style={{ width: '120px', height: '120px' }} />

                  {/* Main orb - always visible, changes size when active */}
                  <div className={`relative rounded-full shadow-lg transition-all duration-700 ${
                    isSpeaking || isRecording
                      ? 'bg-gradient-to-br from-pink-200 via-pink-300 to-pink-400 shadow-2xl'
                      : 'bg-gradient-to-br from-gray-200 via-gray-300 to-gray-400 shadow-md'
                  } ${
                    isSpeaking ? 'scale-110' : isRecording ? 'scale-105' : 'scale-100'
                  }`} style={{ width: '100px', height: '100px' }}>
                    {/* Inner glow - only visible when active */}
                    {(isSpeaking || isRecording) && (
                      <div className="absolute inset-2 rounded-full bg-gradient-to-br from-pink-100/60 to-transparent animate-pulse" />
                    )}

                    {/* Shimmer effect - only when active */}
                    {(isSpeaking || isRecording) && (
                      <div className="absolute inset-0 rounded-full overflow-hidden">
                        <div className={`absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent ${
                          isSpeaking ? 'animate-shimmer-fast' : 'animate-shimmer'
                        }`} style={{ width: '200%' }} />
                      </div>
                    )}

                    {/* Listening waves - only when recording */}
                    {isRecording && (
                      <>
                        <div className="absolute inset-0 rounded-full border-2 border-pink-400/40 animate-ping" style={{ animationDuration: '1.5s' }} />
                        <div className="absolute inset-0 rounded-full border-2 border-pink-300/30 animate-ping" style={{ animationDuration: '2s', animationDelay: '0.3s' }} />
                        <div className="absolute inset-0 rounded-full border-2 border-pink-200/20 animate-ping" style={{ animationDuration: '2.5s', animationDelay: '0.6s' }} />
                      </>
                    )}

                    {/* Icon or indicator inside orb when inactive */}
                    {!isSpeaking && !isRecording && (
                      <div className="absolute inset-0 flex items-center justify-center">
                        <Volume2 className="h-8 w-8 text-gray-600/60" />
                      </div>
                    )}
                  </div>
                </div>

                {/* Status text below orb */}
                <div className="absolute top-full mt-4 left-1/2 transform -translate-x-1/2 text-center pointer-events-none whitespace-nowrap">
                  <p className={`text-sm font-light tracking-wide transition-all duration-300 ${
                    isSpeaking || isRecording ? 'text-foreground/70 opacity-100' : 'text-foreground/40 opacity-70'
                  }`}>
                    {isSpeaking ? 'AI is speaking...' : isRecording ? 'Listening...' : 'Ready'}
                  </p>
                </div>
              </div>
            </div>

            {/* Current Question Card */}
            <div className="animate-fade-in" style={{ animationDelay: '100ms' }}>
              <Card className="border-border/50 shadow-sm bg-gradient-to-br from-card to-card/50 backdrop-blur-sm">
                <CardContent className="pt-8 pb-8 px-6 text-center space-y-6">
                  <div className="space-y-3">
                    <div className="inline-flex items-center gap-2 text-primary/70">
                      <Volume2 className="h-4 w-4" />
                    </div>
                    <p className="text-xl md:text-2xl font-light text-foreground leading-relaxed">
                      {questions[currentQuestionIndex]}
                    </p>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex flex-col gap-3 max-w-md mx-auto pt-2">
                    {!hasStarted && !isSpeaking && !isRecording && !transcript && (
                      <Button
                        onClick={() => handleStartInterview()}
                        size="lg"
                        className="w-full px-8 py-6 text-base rounded-full shadow-lg hover:shadow-xl transition-all duration-300 font-medium"
                        disabled={backendStatus !== 'online'}
                      >
                        <PlayCircle className="mr-2 h-5 w-5" />
                        Begin Your Story
                      </Button>
                    )}

                    {!isRecording && !isProcessing && !isSpeaking && transcript && aiAnalysis && !showFollowUpOptions && (
                      <div className="flex flex-col gap-2">
                        <Button
                          onClick={handleRespondToFollowUp}
                          size="lg"
                          className="w-full px-8 py-6 text-base rounded-full shadow-lg hover:shadow-xl transition-all duration-300 font-medium"
                        >
                          Respond to Follow-up
                        </Button>
                        <Button
                          onClick={handleNextQuestion}
                          size="lg"
                          variant="outline"
                          className="w-full px-8 py-6 text-base rounded-full shadow-lg hover:shadow-xl transition-all duration-300 font-medium"
                          disabled={currentQuestionIndex >= questions.length - 1}
                        >
                          Continue to Next Question
                        </Button>
                      </div>
                    )}

                    {showFollowUpOptions && !isRecording && !isProcessing && !isSpeaking && followUpTranscript && followUpAnalysis && (
                      <div className="flex flex-col gap-2">
                        <Button
                          onClick={handleContinueToNext}
                          size="lg"
                          className="w-full px-8 py-6 text-base rounded-full shadow-lg hover:shadow-xl transition-all duration-300 font-medium"
                        >
                          Continue to Next Question
                        </Button>
                      </div>
                    )}

                    {(isSpeaking || isRecording || isProcessing) && (
                      <Button
                        onClick={() => speakText(questions[currentQuestionIndex], 'question', selectedVoice)}
                        variant="ghost"
                        size="lg"
                        className="w-full font-light"
                        disabled={backendStatus !== 'online' || isSpeaking}
                      >
                        <Volume2 className="mr-2 h-4 w-4" />
                        Replay Question
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Recording Controls - Centered */}
          <div className="max-w-2xl mx-auto space-y-6 animate-fade-in" style={{ animationDelay: '200ms' }}>
            {/* Processing State */}
            {isProcessing && (
              <Card className="border-border/50 shadow-sm bg-card/50 backdrop-blur-sm">
                <CardContent className="py-12">
                  <div className="flex flex-col items-center justify-center space-y-4">
                    <Loader2 className="h-12 w-12 animate-spin text-primary" />
                    <p className="text-foreground font-light">Processing your response...</p>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Recording State */}
            {isRecording && (
              <Card className="border-primary/30 shadow-lg bg-gradient-to-br from-primary/5 to-card/50 backdrop-blur-sm animate-pulse-subtle">
                <CardContent className="py-10">
                  <div className="space-y-6">
                    <div className="flex items-center justify-center gap-3">
                      <div className="w-3 h-3 rounded-full bg-red-500 animate-pulse"></div>
                      <span className="text-lg font-light text-foreground">
                        Recording
                      </span>
                    </div>

                    {/* Real-time transcript display - PROMINENT */}
                    <div className="mt-4 p-6 rounded-lg bg-white dark:bg-gray-900 border-2 border-primary/30 min-h-[150px] max-h-[400px] overflow-y-auto shadow-lg">
                      <div className="space-y-3">
                        {/* Header */}
                        <div className="flex items-center justify-between pb-2 border-b border-primary/20">
                          <div className="flex items-center gap-2">
                            <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></div>
                            <span className="text-sm font-medium text-foreground">Live Transcript</span>
                          </div>
                        </div>

                        {/* Transcript content */}
                        <div className="text-base leading-relaxed">
                          {/* Final transcript (immutable) */}
                          {assemblyAI.transcript && !showFollowUpOptions && (
                            <p className="text-foreground font-normal">{assemblyAI.transcript}</p>
                          )}

                          {/* Follow-up transcript */}
                          {showFollowUpOptions && followUpTranscript && (
                            <p className="text-foreground font-normal">{followUpTranscript}</p>
                          )}

                          {/* Interim transcript (live updates) - more prominent */}
                          {assemblyAI.interimTranscript && !showFollowUpOptions && (
                            <p className="text-primary/80 font-normal italic">
                              {assemblyAI.interimTranscript}
                            </p>
                          )}

                          {/* Show placeholder if no transcript yet */}
                          {!assemblyAI.transcript && !assemblyAI.interimTranscript && !followUpTranscript && (
                            <p className="text-muted-foreground/50 italic text-center py-8">
                              Speak now...
                            </p>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <div className="flex justify-between text-sm text-foreground/60 font-light">
                        <span>{recordingTime}s</span>
                        <span>{recordingDuration}s</span>
                      </div>
                      <Progress value={(recordingTime / recordingDuration) * 100} className="h-2" />
                    </div>
                    <Button
                      onClick={stopRecording}
                      size="lg"
                      variant="outline"
                      className="w-full max-w-md mx-auto block rounded-full font-light flex items-center justify-center"
                    >
                      <StopCircle className="mr-2 h-5 w-5" />
                      Finish Recording
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Ready to Record - Only show after onboarding is complete */}
            {!isRecording && !isProcessing && !isSpeaking && !transcript && !followUpTranscript && onboardingComplete && (
              <Card className="border-border/50 shadow-sm bg-card/50 backdrop-blur-sm">
                <CardContent className="py-10">
                  <Button
                    onClick={startRecording}
                    size="lg"
                    className="w-full max-w-md mx-auto block px-10 py-7 text-lg rounded-full shadow-lg hover:shadow-xl transition-all duration-300 font-medium flex items-center justify-center"
                    disabled={isSpeaking || backendStatus !== 'online'}
                  >
                    <Mic className="mr-2 h-5 w-5" />
                    {showFollowUpOptions ? "Respond to Follow-up" : "Start Recording"}
                  </Button>
                </CardContent>
              </Card>
            )}

          </div>

          {/* Response Display - Show after answering */}
          {(transcript || aiAnalysis || followUpTranscript || followUpAnalysis) && (
            <div className="max-w-3xl mx-auto space-y-6 animate-fade-in" style={{ animationDelay: '300ms' }}>
              <Tabs defaultValue="current" className="w-full">
                <TabsList className="grid w-full grid-cols-2 bg-muted/50">
                  <TabsTrigger value="current" className="font-light">Your Response</TabsTrigger>
                  <TabsTrigger value="history" className="font-light">
                    History {responses.length > 0 && `(${responses.length})`}
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="current" className="space-y-6 mt-6">
                  {/* Main Response */}
                  {(transcript || followUpTranscript) && (
                    <Card className="border-border/50 shadow-sm bg-card/50 backdrop-blur-sm">
                      <CardHeader>
                        <CardTitle className="text-lg font-semibold text-foreground">
                          {showFollowUpOptions ? "Follow-up Response" : "What You Shared"}
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="text-foreground/80 font-light leading-relaxed">
                          {showFollowUpOptions ? followUpTranscript : transcript}
                        </p>
                      </CardContent>
                    </Card>
                  )}

                  {/* AI Analysis */}
                  {(aiAnalysis || followUpAnalysis) && (
                    <Card className="border-primary/20 shadow-sm bg-gradient-to-br from-primary/5 to-card/50 backdrop-blur-sm">
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-lg font-semibold text-foreground">
                          AI Reflection
                          {isSpeaking && (
                            <span className="flex items-center text-sm font-light text-muted-foreground">
                              <Volume2 className="h-4 w-4 mr-1 animate-pulse" />
                              Speaking...
                            </span>
                          )}
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="text-foreground/80 font-light leading-relaxed">
                          {showFollowUpOptions ? followUpAnalysis : aiAnalysis}
                        </p>
                      </CardContent>
                    </Card>
                  )}
                </TabsContent>

                <TabsContent value="history" className="space-y-4 mt-6">
                  {responses.length === 0 ? (
                    <Card className="border-border/50 shadow-sm bg-card/50 backdrop-blur-sm">
                      <CardContent className="py-16 text-center">
                        <p className="text-muted-foreground font-light">Your conversation history will appear here</p>
                      </CardContent>
                    </Card>
                  ) : (
                    <div className="space-y-4">
                      {responses.map((response, idx) => (
                        <Card key={idx} className="border-border/50 shadow-sm bg-card/50 backdrop-blur-sm">
                          <CardHeader>
                            <CardTitle className="text-base font-semibold text-foreground">
                              Question {idx + 1}
                            </CardTitle>
                            <CardDescription className="text-muted-foreground font-light italic">
                              "{response.question}"
                            </CardDescription>
                          </CardHeader>
                          <CardContent className="space-y-4">
                            <div>
                              <p className="text-xs font-medium mb-2 text-muted-foreground uppercase tracking-wide">
                                Your Answer
                              </p>
                              <p className="text-sm text-foreground/80 font-light leading-relaxed">
                                {response.answer}
                              </p>
                            </div>
                            <div className="pt-3 border-t border-border/50">
                              <p className="text-xs font-medium mb-2 text-muted-foreground uppercase tracking-wide">
                                AI Reflection
                              </p>
                              <p className="text-sm text-foreground/80 font-light leading-relaxed">
                                {response.analysis}
                              </p>
                            </div>
                            
                            {/* Follow-up Response */}
                            {response.followUpAnswer && response.followUpAnalysis && (
                              <div className="pt-3 border-t border-border/50 space-y-3">
                                <div>
                                  <p className="text-xs font-medium mb-2 text-muted-foreground uppercase tracking-wide">
                                    Follow-up Response
                                  </p>
                                  <p className="text-sm text-foreground/80 font-light leading-relaxed">
                                    {response.followUpAnswer}
                                  </p>
                                </div>
                                <div>
                                  <p className="text-xs font-medium mb-2 text-muted-foreground uppercase tracking-wide">
                                    Follow-up Reflection
                                  </p>
                                  <p className="text-sm text-foreground/80 font-light leading-relaxed">
                                    {response.followUpAnalysis}
                                  </p>
                                </div>
                              </div>
                            )}
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  )}
                </TabsContent>
              </Tabs>
            </div>
          )}
        </div>
      </div>
        </>
      )}
    </div>
  );
};

export default LifeReviewDemo;

