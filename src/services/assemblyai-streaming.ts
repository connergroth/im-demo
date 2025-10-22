/**
 * AssemblyAI Streaming v3 Service
 *
 * Provides real-time streaming transcription with ~300ms latency.
 * This replaces the batch Whisper transcription for a much faster experience.
 * 
 * Uses the v3 streaming API endpoint: wss://streaming.assemblyai.com/v3/ws
 * 
 * Message format:
 * - Send: Base64 audio strings (50ms-1000ms chunks)
 * - Receive: JSON messages with "type" field (Begin, Turn, Termination, Error)
 */

export interface StreamingTranscriptResult {
  text: string;
  isFinal: boolean;
  confidence?: number;
}

export interface AssemblyAIStreamingConfig {
  apiKey: string;
  sampleRate?: number;
  encoding?: 'pcm_s16le' | 'pcm_mulaw';
  onTranscript?: (result: StreamingTranscriptResult) => void;
  onError?: (error: Error) => void;
  onClose?: () => void;
}

export class AssemblyAIStreaming {
  private ws: WebSocket | null = null;
  private config: AssemblyAIStreamingConfig;
  private sessionId: string | null = null;

  constructor(config: AssemblyAIStreamingConfig) {
    this.config = {
      sampleRate: 16000,
      encoding: 'pcm_s16le',
      ...config,
    };
  }

  /**
   * Connect to AssemblyAI WebSocket streaming endpoint
   */
  async connect(): Promise<void> {
    return new Promise(async (resolve, reject) => {
      try {
        // Debug: Log API key info (safely)
        const keyPreview = this.config.apiKey 
          ? `${this.config.apiKey.substring(0, 8)}...${this.config.apiKey.substring(this.config.apiKey.length - 4)}`
          : 'MISSING';
        console.log('[AssemblyAI] Connecting with API key:', keyPreview, `(length: ${this.config.apiKey?.length || 0})`);
        
        // AssemblyAI Streaming v3 API
        // Best practice: use a temporary token generated via backend to avoid exposing API key and to satisfy header auth
        const encoding = this.config.encoding || 'pcm_s16le';
        const apiBase = import.meta.env?.VITE_API_URL || '/api';

        let tempToken: string | null = null;
        try {
          const tokenResp = await fetch(`${apiBase}/assemblyai-token?expires_in_seconds=300`, {
            method: 'GET',
            headers: { 'Content-Type': 'application/json' },
          });
          if (tokenResp.ok) {
            const tokenData = await tokenResp.json();
            tempToken = tokenData.token;
            console.log('[AssemblyAI] Obtained temporary token');
          } else {
            const text = await tokenResp.text();
            console.warn('[AssemblyAI] Failed to obtain temporary token, falling back to direct key token param. Details:', text);
          }
        } catch (e) {
          console.warn('[AssemblyAI] Error fetching temporary token, falling back to direct key:', e);
        }

        const authToken = tempToken || this.config.apiKey;
        const wsUrl = `wss://streaming.assemblyai.com/v3/ws?sample_rate=${this.config.sampleRate}&encoding=${encoding}&token=${authToken}`;
        console.log('[AssemblyAI] Connecting to streaming.assemblyai.com v3...');
        console.log('[AssemblyAI] Parameters: sample_rate=' + this.config.sampleRate + ', encoding=' + encoding);

        this.ws = new WebSocket(wsUrl);
        
        // Store resolve/reject for use in message handler
        let connectionResolver: (() => void) | null = resolve;
        let connectionRejecter: ((error: Error) => void) | null = reject;

        this.ws.onopen = () => {
          console.log('[AssemblyAI] WebSocket connected successfully!');
          console.log('[AssemblyAI] Waiting for Begin message...');
          // Don't resolve immediately - wait for Begin message
          // Set a timeout in case Begin message never arrives
          setTimeout(() => {
            if (connectionRejecter) {
              console.error('[AssemblyAI] Timeout waiting for Begin message');
              connectionRejecter(new Error('Timeout waiting for session to begin'));
              connectionResolver = null;
              connectionRejecter = null;
            }
          }, 5000);
        };

        this.ws.onmessage = (event) => {
          const message = this.handleMessage(event.data);
          // Resolve promise when we receive Begin message
          if (message && message.type === 'Begin' && connectionResolver) {
            console.log('[AssemblyAI] Session ready!');
            connectionResolver();
            connectionResolver = null;
            connectionRejecter = null;
          }
        };

        this.ws.onerror = (error) => {
          console.error('[AssemblyAI] WebSocket error:', error);
          this.config.onError?.(new Error('WebSocket connection error'));
          if (connectionRejecter) {
            connectionRejecter(new Error('WebSocket connection error'));
            connectionResolver = null;
            connectionRejecter = null;
          }
        };

        this.ws.onclose = (event) => {
          console.log('[AssemblyAI] WebSocket closed');
          console.log('[AssemblyAI] Close code:', event.code, 'reason:', event.reason);
          if (event.code !== 1000) {
            console.error('[AssemblyAI] Abnormal closure - code:', event.code);
            if (connectionRejecter) {
              connectionRejecter(new Error(`WebSocket closed abnormally: ${event.code}`));
              connectionResolver = null;
              connectionRejecter = null;
            }
          }
          this.config.onClose?.();
        };
      } catch (error) {
        reject(error);
      }
    });
  }

  /**
   * Handle incoming messages from AssemblyAI
   */
  private handleMessage(data: string): any {
    try {
      const message = JSON.parse(data);
      
      // Debug: Log all incoming messages
      console.log('[AssemblyAI] Received message:', message);

      // v3 API message types (based on "type" field)
      // Session begins
      if (message.type === 'Begin') {
        this.sessionId = message.id;
        console.log('[AssemblyAI] Session started:', this.sessionId, 'expires at:', message.expires_at);
        return message;
      }

      // Turn event (contains transcript)
      if (message.type === 'Turn') {
        const isFinal = message.end_of_turn === true;
        this.config.onTranscript?.({
          text: message.transcript || '',
          isFinal: isFinal,
          confidence: message.confidence,
        });
        return;
      }

      // Termination event
      if (message.type === 'Termination') {
        console.log('[AssemblyAI] Session terminated, audio duration:', message.audio_duration_seconds);
        this.close();
        return;
      }

      // Error event
      if (message.type === 'Error') {
        console.error('[AssemblyAI] Error:', message.error || message.message);
        this.config.onError?.(new Error(message.error || message.message || 'Unknown error'));
        return;
      }

      // Legacy error format (for backwards compatibility)
      if (message.error) {
        console.error('[AssemblyAI] Error:', message.error);
        this.config.onError?.(new Error(message.error));
        return;
      }
    } catch (error) {
      console.error('[AssemblyAI] Failed to parse message:', error);
      this.config.onError?.(error as Error);
    }
  }

  /**
   * Send audio data to AssemblyAI for transcription
   * @param audioData - Raw PCM audio data (Int16Array or ArrayBuffer)
   */
  sendAudio(audioData: ArrayBuffer | Int16Array): void {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
      console.warn('[AssemblyAI] WebSocket not connected, cannot send audio');
      return;
    }

    try {
      // Normalize to Int16 PCM little-endian regardless of platform endianness
      let int16: Int16Array;
      if (audioData instanceof Int16Array) {
        int16 = audioData;
      } else {
        const float = new Float32Array(audioData);
        int16 = new Int16Array(float.length);
        for (let i = 0; i < float.length; i++) {
          const s = Math.max(-1, Math.min(1, float[i]));
          int16[i] = s < 0 ? s * 0x8000 : s * 0x7fff;
        }
      }

      // Write as LE bytes explicitly
      const byteBuffer = new ArrayBuffer(int16.length * 2);
      const view = new DataView(byteBuffer);
      for (let i = 0; i < int16.length; i++) {
        view.setInt16(i * 2, int16[i], true /* littleEndian */);
      }

      // v3 API: Send raw base64 string (not JSON-wrapped)
      const base64Audio = this.arrayBufferToBase64(byteBuffer);
      
      // Skip silent chunks to avoid server cancellation
      if (base64Audio.startsWith('AAAAAAAAAAAAAAAAAAAA')) {
        console.log('[AssemblyAI] Skipping silent chunk');
        return;
      }
      
      // Try sending raw binary data instead of base64
      console.log('[AssemblyAI] Sending binary audio chunk, length:', byteBuffer.byteLength);
      this.ws.send(byteBuffer);
    } catch (error) {
      console.error('[AssemblyAI] Failed to send audio:', error);
      this.config.onError?.(error as Error);
    }
  }

  /**
   * Send end of stream signal
   */
  endStream(): void {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
      return;
    }

    try {
      // v3 API: Send terminate message in new format
      const message = JSON.stringify({
        type: 'Terminate',
      });
      this.ws.send(message);
    } catch (error) {
      console.error('[AssemblyAI] Failed to end stream:', error);
    }
  }

  /**
   * Close the WebSocket connection
   */
  close(): void {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
    this.sessionId = null;
  }

  /**
   * Check if WebSocket is connected
   */
  isConnected(): boolean {
    return this.ws !== null && this.ws.readyState === WebSocket.OPEN;
  }

  /**
   * Convert ArrayBuffer to base64 string
   */
  private arrayBufferToBase64(buffer: ArrayBuffer): string {
    const bytes = new Uint8Array(buffer);
    let binary = '';
    for (let i = 0; i < bytes.byteLength; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary);
  }
}

/**
 * Helper function to convert WebM audio to PCM
 * This is needed because MediaRecorder produces WebM but AssemblyAI needs PCM
 */
export async function convertWebMToPCM(
  webmBlob: Blob
): Promise<Int16Array> {
  const audioContext = new AudioContext({ sampleRate: 16000 });
  const arrayBuffer = await webmBlob.arrayBuffer();
  const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);

  // Get PCM data from first channel
  const pcmData = audioBuffer.getChannelData(0);

  // Convert Float32Array (-1 to 1) to Int16Array (-32768 to 32767)
  const int16Data = new Int16Array(pcmData.length);
  for (let i = 0; i < pcmData.length; i++) {
    const s = Math.max(-1, Math.min(1, pcmData[i]));
    int16Data[i] = s < 0 ? s * 0x8000 : s * 0x7fff;
  }

  return int16Data;
}
