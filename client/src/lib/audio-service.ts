import { offlineStorage } from './offline-storage';

interface AudioState {
  currentTime: number;
  duration: number;
  progress: number;
  isLoading: boolean;
  isPlayingOffline: boolean;
  volume: number;
}

type AudioStateListener = (state: AudioState) => void;

class AudioService {
  private audio: HTMLAudioElement | null = null;
  private listeners: Set<AudioStateListener> = new Set();
  private currentSrc: string = '';
  private currentTrackId: string = '';
  private blobUrl: string | null = null;
  
  private state: AudioState = {
    currentTime: 0,
    duration: 0,
    progress: 0,
    isLoading: true,
    isPlayingOffline: false,
    volume: 0.7,
  };

  constructor() {
    // Ensure singleton
    if ((globalThis as any).audioService) {
      return (globalThis as any).audioService;
    }
    (globalThis as any).audioService = this;
  }

  subscribe(listener: AudioStateListener) {
    this.listeners.add(listener);
    // Immediately send current state to new listener
    listener(this.state);
    
    return () => {
      this.listeners.delete(listener);
    };
  }

  private notifyListeners() {
    this.listeners.forEach(listener => listener(this.state));
  }

  private updateState(updates: Partial<AudioState>) {
    this.state = { ...this.state, ...updates };
    this.notifyListeners();
  }

  async setSrc(src: string, trackId?: string) {
    if (this.currentSrc === src && this.currentTrackId === (trackId || '')) {
      return; // No change needed
    }

    this.currentSrc = src;
    this.currentTrackId = trackId || '';
    
    this.updateState({ isLoading: true });

    // Cleanup previous audio
    if (this.audio) {
      this.audio.pause();
      this.audio.currentTime = 0;
      this.audio.removeEventListener('loadedmetadata', this.handleLoadedMetadata);
      this.audio.removeEventListener('timeupdate', this.handleTimeUpdate);
      this.audio.removeEventListener('canplay', this.handleCanPlay);
      this.audio.removeEventListener('error', this.handleError);
      this.audio.src = '';
      this.audio.load();
    }

    // Cleanup previous blob URL
    if (this.blobUrl) {
      offlineStorage.revokeBlobUrl(this.blobUrl);
      this.blobUrl = null;
    }

    // Create new audio element
    this.audio = new Audio();
    this.audio.preload = 'auto';
    this.audio.crossOrigin = 'anonymous';
    this.audio.volume = this.state.volume;

    // Add event listeners
    this.audio.addEventListener('loadedmetadata', this.handleLoadedMetadata);
    this.audio.addEventListener('timeupdate', this.handleTimeUpdate);
    this.audio.addEventListener('canplay', this.handleCanPlay);
    this.audio.addEventListener('error', this.handleError);

    // Try to load offline version first if available
    if (trackId) {
      try {
        const offlineSong = await offlineStorage.getSong(trackId);
        if (offlineSong) {
          this.blobUrl = offlineStorage.createBlobUrl(offlineSong.audioBlob);
          this.audio.src = this.blobUrl;
          this.updateState({ isPlayingOffline: true });
        } else {
          this.audio.src = src;
          this.updateState({ isPlayingOffline: false });
        }
      } catch (error) {
        this.audio.src = src;
        this.updateState({ isPlayingOffline: false });
      }
    } else {
      this.audio.src = src;
      this.updateState({ isPlayingOffline: false });
    }

    this.audio.load();
    console.log("Audio service setting source:", this.audio.src);
  }

  private handleLoadedMetadata = () => {
    if (this.audio) {
      this.updateState({
        duration: this.audio.duration,
        isLoading: false,
      });
    }
  };

  private handleTimeUpdate = () => {
    if (this.audio) {
      const currentTime = this.audio.currentTime;
      const progress = this.audio.duration ? currentTime / this.audio.duration : 0;
      this.updateState({ currentTime, progress });
    }
  };

  private handleCanPlay = () => {
    this.updateState({ isLoading: false });
  };

  private handleError = async () => {
    this.updateState({ isLoading: false });
    console.error("Audio loading failed");
    
    // Try offline version if online failed
    if (this.currentTrackId && !this.state.isPlayingOffline) {
      try {
        const offlineSong = await offlineStorage.getSong(this.currentTrackId);
        if (offlineSong && this.audio) {
          this.blobUrl = offlineStorage.createBlobUrl(offlineSong.audioBlob);
          this.audio.src = this.blobUrl;
          this.updateState({ isPlayingOffline: true });
          this.audio.load();
        }
      } catch (error) {
        console.error("Failed to load offline version:", error);
      }
    }
  };

  async play() {
    if (this.audio && !this.state.isLoading) {
      try {
        await this.audio.play();
        return true;
      } catch (error) {
        console.error("Audio playback failed:", error);
        return false;
      }
    }
    return false;
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
      this.updateState({ currentTime: newTime, progress: percentage });
    }
  }

  setVolume(volume: number) {
    const adjustedVolume = Math.max(0, Math.min(1, volume));
    this.updateState({ volume: adjustedVolume });
    
    if (this.audio) {
      // Apply logarithmic volume curve for better perceived audio quality
      this.audio.volume = adjustedVolume * adjustedVolume;
    }
  }

  getCurrentState(): AudioState {
    return { ...this.state };
  }

  cleanup() {
    if (this.audio) {
      this.audio.pause();
      this.audio.src = '';
      this.audio.load();
      this.audio = null;
    }
    
    if (this.blobUrl) {
      offlineStorage.revokeBlobUrl(this.blobUrl);
      this.blobUrl = null;
    }
    
    this.listeners.clear();
  }
}

// Create singleton instance
export const audioService = new AudioService();