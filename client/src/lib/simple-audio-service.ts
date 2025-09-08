
class SimpleAudioService {
  private audio: HTMLAudioElement | null = null;
  private currentSrc: string | null = null;
  private hasUserInteracted = false;

  constructor() {
    // Listen for user interactions to enable audio playback
    this.setupUserInteractionListener();
  }

  private setupUserInteractionListener() {
    const handleUserInteraction = () => {
      this.hasUserInteracted = true;
      // Remove listeners after first interaction
      document.removeEventListener('click', handleUserInteraction);
      document.removeEventListener('keydown', handleUserInteraction);
      document.removeEventListener('touchstart', handleUserInteraction);
    };

    document.addEventListener('click', handleUserInteraction);
    document.addEventListener('keydown', handleUserInteraction);
    document.addEventListener('touchstart', handleUserInteraction);
  }

  async play(src: string): Promise<void> {
    try {
      // Check if user has interacted with the document
      if (!this.hasUserInteracted) {
        throw new Error('Audio playback requires user interaction first');
      }

      // If it's the same source and audio exists, just resume
      if (this.audio && this.currentSrc === src) {
        await this.audio.play();
        return;
      }

      // Clean up previous audio
      this.cleanup();

      // Create new audio element
      this.audio = new Audio();
      this.currentSrc = src;

      // Set up audio properties
      this.audio.preload = 'metadata';
      this.audio.crossOrigin = 'anonymous';

      // Wait for audio to be ready
      await new Promise<void>((resolve, reject) => {
        if (!this.audio) {
          reject(new Error('Audio element not initialized'));
          return;
        }

        const handleCanPlay = () => {
          this.audio?.removeEventListener('canplay', handleCanPlay);
          this.audio?.removeEventListener('error', handleError);
          resolve();
        };

        const handleError = (error: Event) => {
          this.audio?.removeEventListener('canplay', handleCanPlay);
          this.audio?.removeEventListener('error', handleError);
          reject(new Error(`Audio loading failed: ${(error.target as HTMLAudioElement)?.error?.message || 'Unknown error'}`));
        };

        this.audio.addEventListener('canplay', handleCanPlay);
        this.audio.addEventListener('error', handleError);
        this.audio.src = src;
        this.audio.load();
      });

      // Play the audio
      await this.audio.play();
    } catch (error) {
      console.error('Audio play failed:', error);
      throw error;
    }
  }

  pause(): void {
    if (this.audio) {
      this.audio.pause();
    }
  }

  stop(): void {
    if (this.audio) {
      this.audio.pause();
      this.audio.currentTime = 0;
    }
  }

  setVolume(volume: number): void {
    if (this.audio) {
      this.audio.volume = Math.max(0, Math.min(1, volume));
    }
  }

  getCurrentTime(): number {
    return this.audio?.currentTime || 0;
  }

  getDuration(): number {
    return this.audio?.duration || 0;
  }

  setCurrentTime(time: number): void {
    if (this.audio) {
      this.audio.currentTime = time;
    }
  }

  isPlaying(): boolean {
    return this.audio ? !this.audio.paused : false;
  }

  isPaused(): boolean {
    return this.audio ? this.audio.paused : true;
  }

  isEnded(): boolean {
    return this.audio ? this.audio.ended : false;
  }

  addEventListener(event: string, listener: EventListener): void {
    if (this.audio) {
      this.audio.addEventListener(event, listener);
    }
  }

  removeEventListener(event: string, listener: EventListener): void {
    if (this.audio) {
      this.audio.removeEventListener(event, listener);
    }
  }

  cleanup(): void {
    if (this.audio) {
      this.audio.pause();
      this.audio.currentTime = 0;
      this.audio.src = '';
      this.audio.load();
      this.audio = null;
    }
    this.currentSrc = null;
  }

  getAudioElement(): HTMLAudioElement | null {
    return this.audio;
  }
}

export const simpleAudioService = new SimpleAudioService();
