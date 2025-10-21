import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Mic, Volume2, Loader2, PlayCircle, StopCircle, Upload } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import VoiceIndicator from "@/components/VoiceIndicator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { apiClient } from "@/lib/api-client";

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
  const [questions, setQuestions] = useState<string[]>(DEMO_QUESTIONS);
  const [useCustomQuestions, setUseCustomQuestions] = useState(false);
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
  const [backendStatus, setBackendStatus] = useState<'checking' | 'online' | 'offline'>('checking');

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const voices = ['alloy', 'echo', 'fable', 'onyx', 'nova', 'shimmer'];

  // Check backend health on mount
  useEffect(() => {
    checkBackendHealth();
  }, []);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (audioRef.current) audioRef.current.pause();
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

  const handlePdfUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (file.type !== 'application/pdf') {
      toast({
        title: "Invalid File",
        description: "Please upload a PDF file.",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsProcessing(true);
      const result = await apiClient.extractQuestions(file);

      if (result.questions.length === 0) {
        toast({
          title: "No Questions Found",
          description: "Could not find any questions in the PDF.",
          variant: "destructive",
        });
        return;
      }

      setQuestions(result.questions);
      setUseCustomQuestions(true);
      setCurrentQuestionIndex(0);

      toast({
        title: "Questions Loaded",
        description: `Extracted ${result.count} questions from PDF.`,
      });
    } catch (error) {
      console.error('Error extracting questions:', error);
      toast({
        title: "Extraction Failed",
        description: error instanceof Error ? error.message : "Failed to extract questions from PDF.",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const speakText = async (text: string) => {
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
      const audioBlob = await apiClient.textToSpeech(text, selectedVoice as any);
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
        description: error instanceof Error ? error.message : "Failed to generate speech.",
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

  const generateAnalysis = async (transcriptText: string) => {
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
      const result = await apiClient.analyzeResponse(
        questions[currentQuestionIndex],
        transcriptText
      );

      setAiAnalysis(result.analysis);

      // Save response
      setResponses(prev => [...prev, {
        question: questions[currentQuestionIndex],
        answer: transcriptText,
        analysis: result.analysis,
      }]);

      // Speak the analysis
      await speakText(result.analysis);

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

      // Speak the next question
      setTimeout(() => {
        speakText(questions[currentQuestionIndex + 1]);
      }, 500);
    } else {
      toast({
        title: "Interview Complete!",
        description: `You've answered all ${questions.length} questions.`,
      });
    }
  };

  const handleStartInterview = async () => {
    // First speak the greeting
    await speakText(INITIAL_GREETING);
    // Then speak the first question
    setTimeout(() => {
      speakText(questions[0]);
    }, 1000);
  };

  const handleResetDemo = () => {
    setQuestions(DEMO_QUESTIONS);
    setUseCustomQuestions(false);
    setCurrentQuestionIndex(0);
    setTranscript("");
    setAiAnalysis("");
    setResponses([]);
    setRecordingTime(0);
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-6xl mx-auto p-6 space-y-6">
        {/* Header */}
        <Card className="shadow-[var(--shadow-soft)]">
          <CardHeader>
            <div className="flex justify-between items-start">
              <div>
                <CardTitle className="text-3xl font-serif text-foreground">Life Review AI Interview</CardTitle>
                <CardDescription className="text-muted-foreground">
                  Question {currentQuestionIndex + 1} of {questions.length}
                  {useCustomQuestions && " (Custom Questions)"}
                </CardDescription>
              </div>
              <div className="flex items-center gap-2">
                <div className={`px-3 py-1 rounded-full text-xs font-medium ${
                  backendStatus === 'online' ? 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300' :
                  backendStatus === 'offline' ? 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300' :
                  'bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300'
                }`}>
                  {backendStatus === 'online' ? '● Online' :
                   backendStatus === 'offline' ? '● Offline' :
                   '● Checking...'}
                </div>
                {backendStatus === 'offline' && (
                  <Button size="sm" variant="outline" onClick={checkBackendHealth}>
                    Retry
                  </Button>
                )}
              </div>
            </div>
            <Progress value={((currentQuestionIndex + 1) / questions.length) * 100} className="mt-4" />
          </CardHeader>
        </Card>

        <div className="grid md:grid-cols-2 gap-6">
          {/* Left Column - Interview Controls */}
          <div className="space-y-6">
            {/* PDF Upload */}
            {currentQuestionIndex === 0 && responses.length === 0 && (
              <Card className="shadow-[var(--shadow-soft)]">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-foreground">
                    <Upload className="h-5 w-5 text-primary" />
                    Upload Custom Questions (Optional)
                  </CardTitle>
                  <CardDescription className="text-muted-foreground">
                    Upload a PDF with your own questions, or use our demo questions
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Input
                    type="file"
                    accept=".pdf"
                    onChange={handlePdfUpload}
                    disabled={isProcessing}
                    className="border-border"
                  />
                  {useCustomQuestions && (
                    <Button onClick={handleResetDemo} variant="outline" className="w-full">
                      Use Demo Questions Instead
                    </Button>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Current Question */}
            <Card className="shadow-[var(--shadow-soft)]">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-foreground">
                  <Volume2 className="h-5 w-5 text-primary" />
                  Current Question
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-lg font-medium mb-4 text-foreground">
                  {questions[currentQuestionIndex]}
                </p>
                {currentQuestionIndex === 0 && !isSpeaking && !isRecording && !transcript && (
                  <Button
                    onClick={handleStartInterview}
                    className="w-full shadow-[var(--shadow-glow)] hover:shadow-[var(--shadow-soft)] transition-all duration-300"
                    disabled={backendStatus !== 'online'}
                  >
                    <PlayCircle className="mr-2 h-4 w-4" />
                    Start Interview
                  </Button>
                )}
                {(isSpeaking || isRecording || isProcessing) && (
                  <Button
                    onClick={() => speakText(questions[currentQuestionIndex])}
                    variant="outline"
                    className="w-full"
                    disabled={backendStatus !== 'online' || isSpeaking}
                  >
                    <Volume2 className="mr-2 h-4 w-4" />
                    Replay Question
                  </Button>
                )}
              </CardContent>
            </Card>

            {/* Voice Settings */}
            <Card className="shadow-[var(--shadow-soft)]">
              <CardHeader>
                <CardTitle className="text-foreground">Voice Settings</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="voice" className="text-foreground">Voice Selection</Label>
                  <Select value={selectedVoice} onValueChange={setSelectedVoice}>
                    <SelectTrigger className="border-border">
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
                  <Label htmlFor="duration" className="text-foreground">Recording Duration (seconds)</Label>
                  <Input
                    id="duration"
                    type="number"
                    min="10"
                    max="120"
                    value={recordingDuration}
                    onChange={(e) => setRecordingDuration(Number(e.target.value))}
                    className="border-border"
                  />
                </div>
              </CardContent>
            </Card>

            {/* Voice Indicator */}
            <VoiceIndicator
              isActive={isSpeaking || isRecording}
              isSpeaking={isSpeaking}
              isListening={isRecording}
            />

            {/* Recording Controls */}
            <Card className="shadow-[var(--shadow-soft)]">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-foreground">
                  <Mic className="h-5 w-5 text-primary" />
                  Record Your Answer
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {isRecording && (
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm text-foreground">
                      <span>Recording...</span>
                      <span>{recordingTime}s / {recordingDuration}s</span>
                    </div>
                    <Progress value={(recordingTime / recordingDuration) * 100} />
                  </div>
                )}

                {isProcessing && (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    <span className="ml-3 text-foreground">Processing your response...</span>
                  </div>
                )}

                {!isRecording && !isProcessing && !isSpeaking && (
                  <Button
                    onClick={startRecording}
                    className="w-full shadow-[var(--shadow-glow)] hover:shadow-[var(--shadow-soft)] transition-all duration-300"
                    disabled={isSpeaking || backendStatus !== 'online'}
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
                className="w-full shadow-[var(--shadow-glow)] hover:shadow-[var(--shadow-soft)] transition-all duration-300"
                disabled={currentQuestionIndex >= questions.length - 1}
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
                  <Card className="shadow-[var(--shadow-soft)]">
                    <CardHeader>
                      <CardTitle className="text-foreground">Your Answer</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <Textarea
                        value={transcript}
                        readOnly
                        className="min-h-[100px] border-border bg-background text-foreground"
                      />
                    </CardContent>
                  </Card>
                )}

                {aiAnalysis && (
                  <Card className="shadow-[var(--shadow-soft)]">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2 text-foreground">
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
                      <div className="prose prose-sm max-w-none text-foreground">
                        {aiAnalysis}
                      </div>
                    </CardContent>
                  </Card>
                )}

                {!transcript && !aiAnalysis && (
                  <Card className="shadow-[var(--shadow-soft)]">
                    <CardContent className="py-12 text-center text-muted-foreground">
                      Record your answer to see the transcription and AI analysis
                    </CardContent>
                  </Card>
                )}
              </TabsContent>

              <TabsContent value="history" className="space-y-4">
                {responses.length === 0 ? (
                  <Card className="shadow-[var(--shadow-soft)]">
                    <CardContent className="py-12 text-center text-muted-foreground">
                      No responses yet. Answer questions to build your history.
                    </CardContent>
                  </Card>
                ) : (
                  responses.map((response, idx) => (
                    <Card key={idx} className="shadow-[var(--shadow-soft)]">
                      <CardHeader>
                        <CardTitle className="text-base text-foreground">Question {idx + 1}</CardTitle>
                        <CardDescription className="text-muted-foreground">{response.question}</CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        <div>
                          <p className="text-sm font-medium mb-1 text-foreground">Your Answer:</p>
                          <p className="text-sm text-muted-foreground">{response.answer}</p>
                        </div>
                        <div>
                          <p className="text-sm font-medium mb-1 text-foreground">AI Response:</p>
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

