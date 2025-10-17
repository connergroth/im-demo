import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Mic, Volume2, Loader2, PlayCircle, StopCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import VoiceIndicator from "@/components/VoiceIndicator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface Response {
  question: string;
  answer: string;
  analysis: string;
}

const INITIAL_GREETING = "Hello! I'm so glad to spend time with you today. I'll ask you questions about your life and capture your stories so your family and care team can understand you better. Let's start with our first question.";

const DEMO_QUESTIONS = [
  "Tell me about a time you overcame a challenge.",
  "What was your proudest accomplishment at work or in life?",
  "What is your favorite childhood memory?",
  "Tell me about someone who had a big impact on your life.",
  "What brings you the most joy in life?",
];

const LifeReviewDemo = () => {
  const { toast } = useToast();
  const [apiKey, setApiKey] = useState(import.meta.env.VITE_OPENAI_API_KEY || "");
  const [isSetup, setIsSetup] = useState(!!import.meta.env.VITE_OPENAI_API_KEY);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [isRecording, setIsRecording] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [transcript, setTranscript] = useState("");
  const [aiAnalysis, setAiAnalysis] = useState("");
  const [responses, setResponses] = useState<Response[]>([]);
  const [selectedVoice, setSelectedVoice] = useState("nova");
  const [recordingDuration, setRecordingDuration] = useState(30);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const voices = ['alloy', 'echo', 'fable', 'onyx', 'nova', 'shimmer'];

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (audioRef.current) audioRef.current.pause();
    };
  }, []);

  const handleSetup = () => {
    if (!apiKey.trim()) {
      toast({
        title: "API Key Required",
        description: "Please enter your OpenAI API key",
        variant: "destructive",
      });
      return;
    }
    setIsSetup(true);
    toast({
      title: "Setup Complete",
      description: "Ready to start the life review interview!",
    });
  };

  const speakText = async (text: string) => {
    if (!apiKey) return;

    setIsSpeaking(true);
    try {
      const response = await fetch('https://api.openai.com/v1/audio/speech', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'tts-1',
          voice: selectedVoice,
          input: text,
        }),
      });

      if (!response.ok) throw new Error('TTS request failed');

      const audioBlob = await response.blob();
      const audioUrl = URL.createObjectURL(audioBlob);

      if (audioRef.current) {
        audioRef.current.pause();
      }

      audioRef.current = new Audio(audioUrl);
      audioRef.current.onended = () => {
        setIsSpeaking(false);
      };

      await audioRef.current.play();
    } catch (error) {
      console.error('Error with TTS:', error);
      toast({
        title: "Speech Error",
        description: "Failed to generate speech. Check your API key.",
        variant: "destructive",
      });
      setIsSpeaking(false);
    }
  };

  const startRecording = async () => {
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

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    }
  };

  const transcribeAudio = async () => {
    setIsProcessing(true);
    try {
      const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
      const formData = new FormData();
      formData.append('file', audioBlob, 'audio.webm');
      formData.append('model', 'whisper-1');

      const response = await fetch('https://api.openai.com/v1/audio/transcriptions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
        },
        body: formData,
      });

      if (!response.ok) throw new Error('Transcription failed');

      const data = await response.json();
      setTranscript(data.text);

      // Automatically generate AI analysis
      await generateAnalysis(data.text);

    } catch (error) {
      console.error('Error transcribing audio:', error);
      toast({
        title: "Transcription Error",
        description: "Failed to transcribe audio. Please try again.",
        variant: "destructive",
      });
      setIsProcessing(false);
    }
  };

  const generateAnalysis = async (transcriptText: string) => {
    try {
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'gpt-4o-mini',
          messages: [
            {
              role: 'system',
              content: `You are a warm, empathetic conversational AI companion conducting a life review interview with an older adult. Your purpose is to guide them through structured life review sessions, capturing their stories to help their family and care team understand them better.

When responding to their answers:
1. Acknowledge their story with warmth and empathy
2. Reflect back the key emotions or themes you heard
3. Ask a natural follow-up question to go deeper (e.g., "That sounds meaningful — how did you feel in that moment?", "What made that so special for you?", "Who was with you during that time?")
4. Keep your response conversational, warm, and brief (2-3 sentences max)
5. Make them feel heard and valued

Your goal is to help them open up and share more details naturally.`,
            },
            {
              role: 'user',
              content: `I just asked: "${DEMO_QUESTIONS[currentQuestionIndex]}"

They answered: "${transcriptText}"

Respond warmly and naturally, acknowledging what they shared and asking a thoughtful follow-up question to help them elaborate.`,
            },
          ],
          temperature: 0.8,
        }),
      });

      if (!response.ok) throw new Error('Analysis failed');

      const data = await response.json();
      const analysis = data.choices[0].message.content;
      setAiAnalysis(analysis);

      // Save response
      setResponses(prev => [...prev, {
        question: DEMO_QUESTIONS[currentQuestionIndex],
        answer: transcriptText,
        analysis: analysis,
      }]);

      // Speak the analysis
      await speakText(analysis);

    } catch (error) {
      console.error('Error generating analysis:', error);
      toast({
        title: "Analysis Error",
        description: "Failed to generate AI analysis. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleNextQuestion = () => {
    if (currentQuestionIndex < DEMO_QUESTIONS.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
      setTranscript("");
      setAiAnalysis("");
      setRecordingTime(0);

      // Speak the next question
      setTimeout(() => {
        speakText(DEMO_QUESTIONS[currentQuestionIndex + 1]);
      }, 500);
    } else {
      toast({
        title: "Interview Complete!",
        description: `You've answered all ${DEMO_QUESTIONS.length} questions.`,
      });
    }
  };

  const handleStartInterview = async () => {
    // First speak the greeting
    await speakText(INITIAL_GREETING);
    // Then speak the first question
    setTimeout(() => {
      speakText(DEMO_QUESTIONS[0]);
    }, 1000);
  };

  if (!isSetup) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-pink-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="text-2xl">Life Review AI Demo</CardTitle>
            <CardDescription>
              Enter your OpenAI API key to start the interactive life review interview
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="apiKey">OpenAI API Key</Label>
              <Input
                id="apiKey"
                type="password"
                placeholder="sk-..."
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="voice">Voice Selection</Label>
              <Select value={selectedVoice} onValueChange={setSelectedVoice}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {voices.map(voice => (
                    <SelectItem key={voice} value={voice}>
                      {voice.charAt(0).toUpperCase() + voice.slice(1)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="duration">Recording Duration (seconds)</Label>
              <Input
                id="duration"
                type="number"
                min="10"
                max="120"
                value={recordingDuration}
                onChange={(e) => setRecordingDuration(Number(e.target.value))}
              />
            </div>
            <Button onClick={handleSetup} className="w-full">
              Start Demo
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-pink-50 p-4">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <Card>
          <CardHeader>
            <CardTitle className="text-3xl">Life Review AI Interview</CardTitle>
            <CardDescription>
              Question {currentQuestionIndex + 1} of {DEMO_QUESTIONS.length}
            </CardDescription>
            <Progress value={((currentQuestionIndex + 1) / DEMO_QUESTIONS.length) * 100} className="mt-4" />
          </CardHeader>
        </Card>

        <div className="grid md:grid-cols-2 gap-6">
          {/* Left Column - Interview Controls */}
          <div className="space-y-6">
            {/* Current Question */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Volume2 className="h-5 w-5" />
                  Current Question
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-lg font-medium mb-4">
                  {DEMO_QUESTIONS[currentQuestionIndex]}
                </p>
                {currentQuestionIndex === 0 && !isSpeaking && !isRecording && !transcript && (
                  <Button onClick={handleStartInterview} className="w-full">
                    <PlayCircle className="mr-2 h-4 w-4" />
                    Start Interview
                  </Button>
                )}
                {(isSpeaking || isRecording || isProcessing) && (
                  <Button onClick={() => speakText(DEMO_QUESTIONS[currentQuestionIndex])} variant="outline" className="w-full">
                    <Volume2 className="mr-2 h-4 w-4" />
                    Replay Question
                  </Button>
                )}
              </CardContent>
            </Card>

            {/* Voice Indicator */}
            <VoiceIndicator
              isActive={isSpeaking || isRecording}
              isSpeaking={isSpeaking}
              isListening={isRecording}
            />

            {/* Recording Controls */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Mic className="h-5 w-5" />
                  Record Your Answer
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {isRecording && (
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Recording...</span>
                      <span>{recordingTime}s / {recordingDuration}s</span>
                    </div>
                    <Progress value={(recordingTime / recordingDuration) * 100} />
                  </div>
                )}

                {isProcessing && (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    <span className="ml-3">Processing your response...</span>
                  </div>
                )}

                {!isRecording && !isProcessing && !isSpeaking && (
                  <Button
                    onClick={startRecording}
                    className="w-full"
                    disabled={isSpeaking}
                  >
                    <Mic className="mr-2 h-4 w-4" />
                    Start Recording
                  </Button>
                )}

                {isRecording && (
                  <Button
                    onClick={stopRecording}
                    variant="destructive"
                    className="w-full"
                  >
                    <StopCircle className="mr-2 h-4 w-4" />
                    Stop Recording
                  </Button>
                )}
              </CardContent>
            </Card>

            {/* Navigation */}
            {transcript && aiAnalysis && !isProcessing && (
              <Button
                onClick={handleNextQuestion}
                className="w-full"
                disabled={currentQuestionIndex >= DEMO_QUESTIONS.length - 1}
              >
                Next Question
              </Button>
            )}
          </div>

          {/* Right Column - Results */}
          <div className="space-y-6">
            <Tabs defaultValue="current" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="current">Current Response</TabsTrigger>
                <TabsTrigger value="history">History ({responses.length})</TabsTrigger>
              </TabsList>

              <TabsContent value="current" className="space-y-4">
                {transcript && (
                  <Card>
                    <CardHeader>
                      <CardTitle>Your Answer</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <Textarea
                        value={transcript}
                        readOnly
                        className="min-h-[100px]"
                      />
                    </CardContent>
                  </Card>
                )}

                {aiAnalysis && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        AI Response
                        {isSpeaking && (
                          <span className="flex items-center text-sm font-normal text-muted-foreground">
                            <Volume2 className="h-4 w-4 mr-1 animate-pulse" />
                            Speaking...
                          </span>
                        )}
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="prose prose-sm max-w-none">
                        {aiAnalysis}
                      </div>
                    </CardContent>
                  </Card>
                )}

                {!transcript && !aiAnalysis && (
                  <Card>
                    <CardContent className="py-12 text-center text-muted-foreground">
                      Record your answer to see the transcription and AI analysis
                    </CardContent>
                  </Card>
                )}
              </TabsContent>

              <TabsContent value="history" className="space-y-4">
                {responses.length === 0 ? (
                  <Card>
                    <CardContent className="py-12 text-center text-muted-foreground">
                      No responses yet. Answer questions to build your history.
                    </CardContent>
                  </Card>
                ) : (
                  responses.map((response, idx) => (
                    <Card key={idx}>
                      <CardHeader>
                        <CardTitle className="text-base">Question {idx + 1}</CardTitle>
                        <CardDescription>{response.question}</CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        <div>
                          <p className="text-sm font-medium mb-1">Your Answer:</p>
                          <p className="text-sm text-muted-foreground">{response.answer}</p>
                        </div>
                        <div>
                          <p className="text-sm font-medium mb-1">AI Response:</p>
                          <p className="text-sm text-muted-foreground">{response.analysis}</p>
                        </div>
                      </CardContent>
                    </Card>
                  ))
                )}
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LifeReviewDemo;
