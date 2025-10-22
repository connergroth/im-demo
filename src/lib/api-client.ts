/**
 * API Client for Life Review Backend
 * Connects to the Flask API deployed on Fly.io
 */

const API_BASE_URL = import.meta.env.VITE_API_URL || 'https://life-review-api.fly.dev/api';

export interface ExtractQuestionsResponse {
  success: boolean;
  questions: string[];
  count: number;
}

export interface TranscribeResponse {
  success: boolean;
  transcript: string;
}

export interface AnalyzeResponse {
  success: boolean;
  analysis: string;
}

export interface AnalyzeAndTTSResponse {
  success: boolean;
  analysis: string;
  tts_path: string;
}

export interface ApiError {
  error: string;
  message?: string;
}

class LifeReviewAPIClient {
  private baseUrl: string;

  constructor(baseUrl: string = API_BASE_URL) {
    this.baseUrl = baseUrl;
  }

  /**
   * Check if the API is healthy
   */
  async healthCheck(): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/health`);
      return response.ok;
    } catch {
      return false;
    }
  }

  /**
   * Extract questions from a PDF file
   */
  async extractQuestions(pdfFile: File): Promise<ExtractQuestionsResponse> {
    const formData = new FormData();
    formData.append('pdf', pdfFile);

    const response = await fetch(`${this.baseUrl}/extract-questions`, {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      const error: ApiError = await response.json();
      throw new Error(error.error || 'Failed to extract questions');
    }

    return response.json();
  }

  /**
   * Convert text to speech using the backend with caching
   */
  async textToSpeech(
    text: string,
    voice: 'alloy' | 'echo' | 'fable' | 'onyx' | 'nova' | 'shimmer' = 'nova',
    contentType: 'narrative' | 'question' | 'greeting' | 'outro' = 'narrative'
  ): Promise<Blob> {
    const response = await fetch(`${this.baseUrl}/text-to-speech`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ text, voice, content_type: contentType }),
    });

    if (!response.ok) {
      const error: ApiError = await response.json();
      throw new Error(error.error || 'Failed to generate speech');
    }

    return response.blob();
  }

  /**
   * Transcribe audio to text using Whisper
   */
  async transcribeAudio(audioFile: File | Blob): Promise<TranscribeResponse> {
    const formData = new FormData();
    formData.append('audio', audioFile, 'recording.webm');

    const response = await fetch(`${this.baseUrl}/transcribe`, {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      const error: ApiError = await response.json();
      throw new Error(error.error || 'Failed to transcribe audio');
    }

    return response.json();
  }

  /**
   * Analyze a response for emotions, themes, and values
   */
  async analyzeResponse(
    question: string,
    answer: string
  ): Promise<AnalyzeResponse> {
    const response = await fetch(`${this.baseUrl}/analyze`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ question, answer }),
    });

    if (!response.ok) {
      const error: ApiError = await response.json();
      throw new Error(error.error || 'Failed to analyze response');
    }

    return response.json();
  }

  /**
   * Analyze response and generate TTS in parallel for maximum speed
   */
  async analyzeAndTTS(
    question: string,
    answer: string,
    voice: 'alloy' | 'echo' | 'fable' | 'onyx' | 'nova' | 'shimmer' = 'nova'
  ): Promise<AnalyzeAndTTSResponse> {
    const response = await fetch(`${this.baseUrl}/analyze-and-tts`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ question, answer, voice }),
    });

    if (!response.ok) {
      const error: ApiError = await response.json();
      throw new Error(error.error || 'Failed to analyze and generate TTS');
    }

    return response.json();
  }

  /**
   * Analyze a follow-up response with context from the original question and answer
   */
  async analyzeFollowup(
    originalQuestion: string,
    originalAnswer: string,
    followupAnswer: string,
    voice: 'alloy' | 'echo' | 'fable' | 'onyx' | 'nova' | 'shimmer' = 'nova'
  ): Promise<AnalyzeAndTTSResponse> {
    const response = await fetch(`${this.baseUrl}/analyze-followup`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ 
        original_question: originalQuestion, 
        original_answer: originalAnswer, 
        followup_answer: followupAnswer, 
        voice 
      }),
    });

    if (!response.ok) {
      const error: ApiError = await response.json();
      throw new Error(error.error || 'Failed to analyze follow-up response');
    }

    return response.json();
  }

  /**
   * Analyze a complete life review session
   */
  async analyzeSession(sessionData: Array<{question: string, answer: string}>): Promise<any> {
    const response = await fetch(`${this.baseUrl}/analyze-session`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ session_data: sessionData }),
    });

    if (!response.ok) {
      const error: ApiError = await response.json();
      throw new Error(error.error || 'Failed to analyze session');
    }

    return response.json();
  }

  /**
   * Pre-cache narratives for faster loading
   */
  async preCacheNarratives(voice: 'alloy' | 'echo' | 'fable' | 'onyx' | 'nova' | 'shimmer' = 'nova'): Promise<any> {
    const response = await fetch(`${this.baseUrl}/pre-cache-narratives`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ voice }),
    });

    if (!response.ok) {
      const error: ApiError = await response.json();
      throw new Error(error.error || 'Failed to pre-cache narratives');
    }

    return response.json();
  }

  /**
   * Get cache statistics
   */
  async getCacheStats(): Promise<any> {
    const response = await fetch(`${this.baseUrl}/cache-stats`);

    if (!response.ok) {
      const error: ApiError = await response.json();
      throw new Error(error.error || 'Failed to get cache stats');
    }

    return response.json();
  }
}

// Export singleton instance
export const apiClient = new LifeReviewAPIClient();

// Also export the class for testing/custom instances
export default LifeReviewAPIClient;
