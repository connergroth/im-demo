import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Mic, Volume2, PhoneOff, CheckCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/lib/supabase";
import { getOrCreateGuestId } from "@/lib/guestSession";
import { useElevenLabsConversation } from "@/hooks/useElevenLabsConversation";
import { NARRATIVES, QUESTION_SEQUENCE, ELEVENLABS_AGENT_CONFIG } from "@/config/narratives";
import { AnimatedSpeaker } from "@/components/AnimatedSpeaker";

interface Response {
  question: string;
  answer: string;
  analysis: string;
}

const LifeReviewDemo = () => {
  const { toast } = useToast();
  const navigate = useNavigate();

  // UI State
  const [showVoiceSelection, setShowVoiceSelection] = useState(true);
  const [selectedVoice, setSelectedVoice] = useState<"male" | "female">("female");

  // Supabase session tracking
  const [guestId, setGuestId] = useState<string>('');
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [questionIds, setQuestionIds] = useState<Record<string, string>>({});
  const [userDisplayName, setUserDisplayName] = useState<string | null>(null);
  const [responses, setResponses] = useState<Response[]>([]);
  // Delay for showing "Ready" message to avoid flicker during AI pauses
  const [readyHintVisible, setReadyHintVisible] = useState<boolean>(false);
  const readyTimerRef = useRef<number | null>(null);

  // Get ElevenLabs agent ID from environment
  const agentId = import.meta.env.VITE_ELEVENLABS_AGENT_ID;

  // Note: Voice is now configured in the ElevenLabs agent settings
  // Voice selection UI is kept for future use, but doesn't affect the agent voice

  // Handle response saved callback
  const handleResponseSaved = async (data: { question: string; answer: string; analysis: string }) => {
    console.log('[LifeReview] Response saved:', data);

    // Extract user name from first question if this is the name question
    if (data.question.includes('name would you like to go by')) {
      setUserDisplayName(data.answer);
    }

    // Add to local state
    setResponses(prev => [...prev, data]);

    // Save to Supabase
    await saveAnswerToSupabase(data.question, data.answer, data.analysis);
  };

  // Handle question change callback
  const handleQuestionChange = (questionIndex: number) => {
    console.log('[LifeReview] Question changed to index:', questionIndex);

    // Check if we've completed all questions
    if (questionIndex >= QUESTION_SEQUENCE.length) {
      console.log('[LifeReview] All questions completed!');
      toast({
        title: "Interview Complete",
        description: "Thank you for sharing your story. Redirecting to your dashboard...",
      });

      // End the session after a delay
      setTimeout(() => {
        endSessionAndNavigate();
      }, 3000);
    }
  };

  // Handle errors
  const handleError = (error: Error) => {
    console.error('[LifeReview] Error:', error);
    const message = error.message || '';
    if (message.toLowerCase().includes('session limit')) {
      toast({
        title: "ElevenLabs session limit reached",
        description: "Your daily session cap was hit (resets ~5am). Please end other active sessions or try again after reset.",
        variant: "destructive",
      });
    } else {
      toast({
        title: "Connection Error",
        description: message || "Something went wrong. Please try again.",
        variant: "destructive",
      });
    }
  };

  // Initialize ElevenLabs conversation
  const conversation = useElevenLabsConversation({
    agentId: agentId || '',
    userId: guestId,
    onResponseSaved: handleResponseSaved,
    onQuestionChange: handleQuestionChange,
    onError: handleError,
  });

  // Manage delayed "Ready for your response" hint
  useEffect(() => {
    const isIdle = conversation.status === 'connected' && !conversation.isSpeaking && !conversation.isUserSpeaking;
    if (isIdle) {
      if (readyTimerRef.current) {
        clearTimeout(readyTimerRef.current);
      }
      readyTimerRef.current = window.setTimeout(() => {
        setReadyHintVisible(true);
      }, 1500); // 1.5s delay before showing ready hint
    } else {
      if (readyTimerRef.current) {
        clearTimeout(readyTimerRef.current);
        readyTimerRef.current = null;
      }
      if (readyHintVisible) setReadyHintVisible(false);
    }

    return () => {
      if (readyTimerRef.current) {
        clearTimeout(readyTimerRef.current);
        readyTimerRef.current = null;
      }
    };
  }, [conversation.status, conversation.isSpeaking, conversation.isUserSpeaking]);

  // Initialize guest session on mount
  useEffect(() => {
    const id = getOrCreateGuestId();
    setGuestId(id);
    createSupabaseSession(id);
    loadQuestionsFromSupabase();
  }, []);

  // Create a Supabase session
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

  // Load questions from Supabase
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

      // Create a map of question text to ID
      const questionMap: Record<string, string> = {};
      data?.forEach(q => {
        questionMap[q.prompt] = q.id;
      });

      setQuestionIds(questionMap);
      console.log('Loaded questions from Supabase:', questionMap);
    } catch (error) {
      console.error('Failed to load questions:', error);
    }
  };

  // Save answer to Supabase
  const saveAnswerToSupabase = async (question: string, answer: string, analysis: string) => {
    if (!sessionId) {
      console.warn('No session ID available for saving answer');
      return;
    }

    try {
      // Get question ID from our map, or find it in database
      let questionId = questionIds[question];

      if (!questionId) {
        // Try to find the question in the database
        const { data: questionData, error: questionError } = await supabase
          .from('questions')
          .select('id')
          .eq('prompt', question)
          .eq('is_active', true)
          .single();

        if (questionError || !questionData) {
          console.error('Could not find question in database:', question);
          return;
        }

        questionId = questionData.id;
        setQuestionIds(prev => ({ ...prev, [question]: questionId }));
      }

      // Save the answer
      const { error: answerError } = await supabase
        .from('answers')
        .insert({
          session_id: sessionId,
          question_id: questionId,
          answer_text: answer,
        });

      if (answerError) {
        console.error('Error saving answer:', answerError);
        return;
      }

      // Save the transcript
      const { error: transcriptError } = await supabase
        .from('transcripts')
        .insert({
          session_id: sessionId,
          text: answer,
          language: 'en',
        });

      if (transcriptError) {
        console.error('Error saving transcript:', transcriptError);
      }

      // Trigger NLP extraction (async - don't wait for it)
      callNLPEdgeFunction(sessionId, answer, analysis);

      console.log('✅ Saved answer to Supabase');
    } catch (error) {
      console.error('Failed to save answer to Supabase:', error);
    }
  };

  // Call NLP edge function for extraction
  const callNLPEdgeFunction = async (sessionId: string, transcript: string, analysis: string) => {
    try {
      const { data, error } = await supabase.functions.invoke('extract-nlp-data', {
        body: {
          session_id: sessionId,
          transcript: transcript,
          analysis: analysis,
        },
      });

      if (error) {
        console.error('NLP extraction error:', error);
        return;
      }

      console.log('✅ NLP extraction triggered:', data);
    } catch (error) {
      console.error('Failed to call NLP edge function:', error);
    }
  };

  // End session and navigate to dashboard
  const endSessionAndNavigate = async () => {
    if (!sessionId) {
      navigate('/dashboard');
      return;
    }

    try {
      // End the conversation
      await conversation.endConversation();

      // Update session end time
      const { error } = await supabase
        .from('sessions')
        .update({ ended_at: new Date().toISOString() })
        .eq('id', sessionId);

      if (error) {
        console.error('Error ending session:', error);
      }

      // Recompute profile based on all session data
      await recomputeProfile();

      console.log('✅ Session ended, navigating to dashboard');
      navigate('/dashboard');
    } catch (error) {
      console.error('Failed to end session:', error);
      navigate('/dashboard');
    }
  };

  // Recompute user profile
  const recomputeProfile = async () => {
    if (!guestId) return;

    try {
      const { data, error } = await supabase.functions.invoke('recompute-profile', {
        body: { user_id: guestId },
      });

      if (error) {
        console.error('Profile recomputation error:', error);
        return;
      }

      console.log('✅ Profile recomputed:', data);
    } catch (error) {
      console.error('Failed to recompute profile:', error);
    }
  };

  // Start conversation handler
  const handleStartConversation = async () => {
    if (!agentId) {
      toast({
        title: "Configuration Error",
        description: "ElevenLabs agent ID is not configured. Please set VITE_ELEVENLABS_AGENT_ID in your environment variables.",
        variant: "destructive",
      });
      return;
    }

    // Prevent starting if already active
    if (conversation.status === 'connecting' || conversation.status === 'connected') {
      return;
    }

    // Request microphone permissions
    try {
      await navigator.mediaDevices.getUserMedia({ audio: true });
    } catch (error) {
      toast({
        title: "Microphone Access Required",
        description: "Please allow microphone access to start the conversation.",
        variant: "destructive",
      });
      return;
    }

    // Start the conversation
    await conversation.startConversation();
  };

  // Keep latest endConversation in a ref
  const endConversationRef = useRef(conversation.endConversation);
  useEffect(() => {
    endConversationRef.current = conversation.endConversation;
  }, [conversation.endConversation]);

  // Clean up: ensure session ends on unmount and page unload to avoid leaked sessions
  useEffect(() => {
    const handleBeforeUnload = () => {
      try {
        void endConversationRef.current?.();
      } catch {}
    };

    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      try {
        void endConversationRef.current?.();
      } catch {}
    };
  }, []);

  // Voice selection handler
  const handleVoiceSelected = (voice: "male" | "female") => {
    setSelectedVoice(voice);
    setShowVoiceSelection(false);
  };

  // Calculate progress percentage
  const progressPercentage = (conversation.currentQuestionIndex / QUESTION_SEQUENCE.length) * 100;

  // Render voice selection screen
  if (showVoiceSelection) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-pink-50 flex items-center justify-center p-4">
        <Card className="max-w-2xl w-full shadow-2xl">
          <CardHeader className="text-center space-y-4">
            <CardTitle className="text-3xl font-bold bg-gradient-to-r from-indigo-600 to-pink-600 bg-clip-text text-transparent">
              Choose Your Companion Voice
            </CardTitle>
            <CardDescription className="text-lg">
              Select the voice that feels most comfortable for your conversation
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Female Voice Option */}
              <Card
                className="cursor-pointer transition-all hover:shadow-xl hover:scale-105 border-2 hover:border-pink-400"
                onClick={() => handleVoiceSelected("female")}
              >
                <CardContent className="p-6 text-center space-y-4">
                  <div className="w-20 h-20 mx-auto bg-gradient-to-br from-pink-100 to-pink-200 rounded-full flex items-center justify-center">
                    <Volume2 className="w-10 h-10 text-pink-600" />
                  </div>
                  <h3 className="text-xl font-semibold text-gray-800">Rachel</h3>
                  <p className="text-sm text-gray-600">Warm, empathetic female voice</p>
                  <Button className="w-full bg-gradient-to-r from-pink-500 to-pink-600 hover:from-pink-600 hover:to-pink-700">
                    Select Rachel
                  </Button>
                </CardContent>
              </Card>

              {/* Male Voice Option */}
              <Card
                className="cursor-pointer transition-all hover:shadow-xl hover:scale-105 border-2 hover:border-indigo-400"
                onClick={() => handleVoiceSelected("male")}
              >
                <CardContent className="p-6 text-center space-y-4">
                  <div className="w-20 h-20 mx-auto bg-gradient-to-br from-indigo-100 to-indigo-200 rounded-full flex items-center justify-center">
                    <Volume2 className="w-10 h-10 text-indigo-600" />
                  </div>
                  <h3 className="text-xl font-semibold text-gray-800">Adam</h3>
                  <p className="text-sm text-gray-600">Deep, calm male voice</p>
                  <Button className="w-full bg-gradient-to-r from-indigo-500 to-indigo-600 hover:from-indigo-600 hover:to-indigo-700">
                    Select Adam
                  </Button>
                </CardContent>
              </Card>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Render main conversation interface
  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-pink-50 p-4">
      <div className="max-w-4xl mx-auto space-y-6 py-8">
        {/* Header */}
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="text-2xl font-bold bg-gradient-to-r from-indigo-600 to-pink-600 bg-clip-text text-transparent">
              Life Review Interview
            </CardTitle>
            <CardDescription>
              Question {conversation.currentQuestionIndex + 1} of {QUESTION_SEQUENCE.length}
            </CardDescription>
            <Progress value={progressPercentage} className="mt-4" />
          </CardHeader>
        </Card>

        {/* Mellow Animated Speaker UI */}
        <div className="flex justify-center py-6">
          <AnimatedSpeaker
            isListening={conversation.isUserSpeaking}
            isSpeaking={conversation.isSpeaking}
          />
        </div>

        {/* Status Card */}
        <Card className="shadow-lg">
          <CardContent className="pt-6 space-y-4">
            {/* Current Question */}
            <div className="text-center">
              <p className="text-sm text-gray-500 mb-2">Current Question:</p>
              <p className="text-lg font-medium text-gray-800">
                {conversation.currentQuestion || QUESTION_SEQUENCE[0].prompt}
              </p>
            </div>

            {/* Status Messages */}
            <div className="text-center space-y-2">
              {conversation.status === 'disconnected' && (
                <p className="text-gray-600">Press the button below to start your conversation</p>
              )}
              {conversation.status === 'connecting' && (
                <p className="text-indigo-600 animate-pulse">Connecting to your AI companion...</p>
              )}
              {conversation.status === 'connected' && conversation.isSpeaking && (
                <p className="text-pink-600">AI is speaking...</p>
              )}
              {conversation.status === 'connected' && conversation.isUserSpeaking && (
                <p className="text-indigo-600">Listening to you...</p>
              )}
              {conversation.status === 'connected' && !conversation.isSpeaking && !conversation.isUserSpeaking && readyHintVisible && (
                <p className="text-green-600">Ready for your response</p>
              )}
            </div>

            {/* Action Buttons */}
            <div className="flex justify-center gap-4 pt-4">
              {conversation.status === 'disconnected' ? (
                <Button
                  size="lg"
                  className="bg-gradient-to-r from-indigo-500 to-pink-500 hover:from-indigo-600 hover:to-pink-600 px-8"
                  onClick={handleStartConversation}
                >
                  <Mic className="mr-2 h-5 w-5" />
                  Start Conversation
                </Button>
              ) : (
                <Button
                  size="lg"
                  variant="destructive"
                  className="px-8"
                  onClick={endSessionAndNavigate}
                >
                  <PhoneOff className="mr-2 h-5 w-5" />
                  End Conversation
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Progress Summary */}
        {responses.length > 0 && (
          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-green-600" />
                Completed Responses
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {responses.map((response, index) => (
                  <div key={index} className="flex items-start gap-2 text-sm">
                    <CheckCircle className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="font-medium text-gray-700">{response.question}</p>
                      <p className="text-gray-500 line-clamp-1">{response.answer}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Error Display */}
        {conversation.error && (
          <Card className="shadow-lg border-red-300">
            <CardContent className="pt-6">
              <p className="text-red-600 text-center">{conversation.error.message}</p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default LifeReviewDemo;
