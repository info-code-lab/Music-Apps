interface SimpleAudioState {
  currentTime: number;
  duration: number;
  progress: number;
  isLoading: boolean;
  volume: number;
}

type SimpleAudioStateListener = (state: SimpleAudioState) => void;

class SimpleAudioService {
  private audio: HTMLAudioElement | null = null;
  private listeners: Set<SimpleAudioStateListener> = new Set();
  private currentSrc: string = '';
  private currentTrackId: string = '';
  
  private state: SimpleAudioState = {
    currentTime: 0,
    duration: 0,
    progress: 0,
    isLoading: false,
    volume: 0.7,
  };

  constructor() {
    // Ensure singleton
    if ((globalThis as any).simpleAudioService) {
      return (globalThis as any).simpleAudioService;
    }
    (globalThis as any).simpleAudioService = this;
    
    // Load saved volume
    try {
      const savedVolume = localStorage.getItem('audio_player_volume');
      if (savedVolume) {
        this.state.volume = Math.max(0, Math.min(1, parseFloat(savedVolume)));
      }
    } catch {
      // Use default volume
    }
  }

  subscribe(listener: SimpleAudioStateListener) {
    this.listeners.add(listener);
    listener(this.state);
    return () => this.listeners.delete(listener);
  }

  private notifyListeners() {
    this.listeners.forEach(listener => listener(this.state));
  }

  private updateState(updates: Partial<SimpleAudioState>) {
    this.state = { ...this.state, ...updates };
    this.notifyListeners();
  }

  async setSrc(src: string, trackId?: string) {
    // If same source, don't recreate
    if (this.currentSrc === src && this.currentTrackId === (trackId || '')) {
      return;
    }

    this.currentSrc = src;
    this.currentTrackId = trackId || '';
    
    // Clean up old audio
    if (this.audio) {
      this.audio.pause();
      this.audio.src = '';
      this.audio.load();
    }

    // Create new audio element
    this.audio = new Audio();
    this.audio.src = src;
    this.audio.volume = this.state.volume;
    this.audio.preload = 'auto';
    
    // Set up basic event listeners
    this.audio.addEventListener('loadedmetadata', () => {
      if (this.audio) {
        this.updateState({
          duration: this.audio.duration,
          isLoading: false,
        });
      }
    });

    this.audio.addEventListener('timeupdate', () => {
      if (this.audio) {
        const currentTime = this.audio.currentTime;
        const progress = this.audio.duration ? currentTime / this.audio.duration : 0;
        this.updateState({ currentTime, progress });
        
        // Save position
        if (this.currentTrackId && currentTime > 0) {
          this.savePosition(currentTime);
        }
      }
    });

    this.audio.addEventListener('canplay', () => {
      this.updateState({ isLoading: false });
    });

    this.audio.addEventListener('error', () => {
      this.updateState({ isLoading: false });
      console.error("Audio loading failed");
    });

    // Start loading
    this.updateState({ isLoading: true });
    this.audio.load();
    
    // Restore position if available
    if (trackId) {
      this.restorePosition(trackId);
    }
  }

  async play() {
    if (!this.audio) {
      console.error("No audio element");
      return false;
    }

    try {
      await this.audio.play();
      return true;
    } catch (error) {
      console.error("Play failed:", error);
      return false;
    }
  }

  pause() {
    if (this.audio) {
      this.audio.pause();
    }
  }

  seek(percentage: number) {
    if (this.audio && this.state.duration) {
      const newTime = this.state.duration * percentage;
      this.audio.currentTime = newTime;
    }
  }

  setVolume(volume: number) {
    this.state.volume = Math.max(0, Math.min(1, volume));
    if (this.audio) {
      this.audio.volume = this.state.volume;
    }
    localStorage.setItem('audio_player_volume', this.state.volume.toString());
    this.notifyListeners();
  }

  private savePosition(time: number) {
    try {
      if (this.currentTrackId && time > 5) { // Only save if played for more than 5 seconds
        localStorage.setItem(`track_position_${this.currentTrackId}`, time.toString());
      }
    } catch {
      // Ignore storage errors
    }
  }

  private restorePosition(trackId: string) {
    try {
      const savedPosition = localStorage.getItem(`track_position_${trackId}`);
      if (savedPosition && this.audio) {
        const position = parseFloat(savedPosition);
        if (position > 0) {
          // Wait a bit for metadata to load before seeking
          setTimeout(() => {
            if (this.audio && this.audio.duration) {
              this.audio.currentTime = Math.min(position, this.audio.duration - 5);
            }
          }, 100);
        }
      }
    } catch {
      // Ignore restore errors
    }
  }
}

export const simpleAudioService = new SimpleAudioService();