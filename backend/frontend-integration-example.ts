/**
 * Example: Frontend Integration with Life Review API
 *
 * This file shows how to integrate the backend API with your React frontend.
 * Copy this code to your React app and customize as needed.
 */

// ============================================================================
// API Configuration
// ============================================================================

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080/api';

// ============================================================================
// Type Definitions
// ============================================================================

interface ExtractQuestionsResponse {
  success: boolean;
  questions: string[];
  count: number;
}

interface TranscribeResponse {
  success: boolean;
  transcript: string;
}

interface AnalyzeResponse {
  success: boolean;
  analysis: string;
}

// ============================================================================
// API Service
// ============================================================================

export class LifeReviewAPI {
  /**
   * Extract questions from a PDF file
   */
  static async extractQuestions(pdfFile: File): Promise<ExtractQuestionsResponse> {
    const formData = new FormData();
    formData.append('pdf', pdfFile);

    const response = await fetch(`${API_BASE_URL}/extract-questions`, {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to extract questions');
    }

    return response.json();
  }

  /**
   * Convert text to speech
   */
  static async textToSpeech(
    text: string,
    voice: 'alloy' | 'echo' | 'fable' | 'onyx' | 'nova' | 'shimmer' = 'nova'
  ): Promise<Blob> {
    const response = await fetch(`${API_BASE_URL}/text-to-speech`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ text, voice }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to generate speech');
    }

    return response.blob();
  }

  /**
   * Transcribe audio to text
   */
  static async transcribeAudio(audioFile: File | Blob): Promise<TranscribeResponse> {
    const formData = new FormData();
    formData.append('audio', audioFile);

    const response = await fetch(`${API_BASE_URL}/transcribe`, {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to transcribe audio');
    }

    return response.json();
  }

  /**
   * Analyze a response for emotions, themes, and values
   */
  static async analyzeResponse(
    question: string,
    answer: string
  ): Promise<AnalyzeResponse> {
    const response = await fetch(`${API_BASE_URL}/analyze`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ question, answer }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to analyze response');
    }

    return response.json();
  }

  /**
   * Check if the API is healthy
   */
  static async healthCheck(): Promise<boolean> {
    try {
      const response = await fetch(`${API_BASE_URL}/health`);
      return response.ok;
    } catch {
      return false;
    }
  }
}

// ============================================================================
// React Hook Example
// ============================================================================

import { useState } from 'react';

export function useLifeReviewPipeline() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * Complete pipeline: Ask question, record answer, analyze
   */
  const processQuestion = async (
    question: string,
    audioBlob: Blob,
    voice: 'alloy' | 'echo' | 'fable' | 'onyx' | 'nova' | 'shimmer' = 'nova'
  ) => {
    setLoading(true);
    setError(null);

    try {
      // Step 1: Generate speech for the question
      const questionAudio = await LifeReviewAPI.textToSpeech(question, voice);
      const audioUrl = URL.createObjectURL(questionAudio);

      // Play the question
      const audio = new Audio(audioUrl);
      await audio.play();

      // Step 2: Transcribe the recorded answer
      const { transcript } = await LifeReviewAPI.transcribeAudio(audioBlob);

      // Step 3: Analyze the response
      const { analysis } = await LifeReviewAPI.analyzeResponse(question, transcript);

      setLoading(false);

      return {
        question,
        questionAudioUrl: audioUrl,
        transcript,
        analysis,
      };
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setError(errorMessage);
      setLoading(false);
      throw err;
    }
  };

  return {
    processQuestion,
    loading,
    error,
  };
}

// ============================================================================
// React Component Example
// ============================================================================

export function LifeReviewInterview() {
  const [questions, setQuestions] = useState<string[]>([]);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [responses, setResponses] = useState<any[]>([]);
  const { processQuestion, loading, error } = useLifeReviewPipeline();

  // Upload PDF and extract questions
  const handlePdfUpload = async (file: File) => {
    try {
      const result = await LifeReviewAPI.extractQuestions(file);
      setQuestions(result.questions);
    } catch (err) {
      console.error('Failed to extract questions:', err);
    }
  };

  // Process a single question
  const handleAnswerRecorded = async (audioBlob: Blob) => {
    const question = questions[currentQuestion];

    try {
      const result = await processQuestion(question, audioBlob, 'nova');
      setResponses([...responses, result]);
      setCurrentQuestion(currentQuestion + 1);
    } catch (err) {
      console.error('Failed to process question:', err);
    }
  };

  return (
    <div className="life-review-interview">
      {/* PDF Upload */}
      {questions.length === 0 && (
        <div>
          <h2>Upload Questions PDF</h2>
          <input
            type="file"
            accept=".pdf"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) handlePdfUpload(file);
            }}
          />
        </div>
      )}

      {/* Interview */}
      {questions.length > 0 && currentQuestion < questions.length && (
        <div>
          <h2>Question {currentQuestion + 1} of {questions.length}</h2>
          <p>{questions[currentQuestion]}</p>

          {/* Audio recorder component would go here */}
          {/* When recording is done, call handleAnswerRecorded(audioBlob) */}

          {loading && <p>Processing...</p>}
          {error && <p className="error">{error}</p>}
        </div>
      )}

      {/* Results */}
      {currentQuestion >= questions.length && responses.length > 0 && (
        <div>
          <h2>Interview Complete!</h2>
          {responses.map((response, idx) => (
            <div key={idx} className="response-card">
              <h3>Question {idx + 1}</h3>
              <p><strong>Q:</strong> {response.question}</p>
              <p><strong>Your Answer:</strong> {response.transcript}</p>
              <p><strong>Analysis:</strong> {response.analysis}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ============================================================================
// Environment Variables for Frontend
// ============================================================================

/*
Add to your .env file in the frontend:

# Local development
VITE_API_URL=http://localhost:8080/api

# Production (after deploying to Fly.io)
VITE_API_URL=https://your-app-name.fly.dev/api
*/
