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
   * Convert text to speech using the backend
   */
  async textToSpeech(
    text: string,
    voice: 'alloy' | 'echo' | 'fable' | 'onyx' | 'nova' | 'shimmer' = 'nova'
  ): Promise<Blob> {
    const response = await fetch(`${this.baseUrl}/text-to-speech`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ text, voice }),
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
}

// Export singleton instance
export const apiClient = new LifeReviewAPIClient();

// Also export the class for testing/custom instances
export default LifeReviewAPIClient;
