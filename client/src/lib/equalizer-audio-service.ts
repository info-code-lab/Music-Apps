import { offlineStorage } from './offline-storage';

interface AudioState {
  currentTime: number;
  duration: number;
  progress: number;
  isLoading: boolean;
  isPlayingOffline: boolean;
  volume: number;
  equalizerEnabled: boolean;
}

type AudioStateListener = (state: AudioState) => void;

interface EqualizerBand {
  frequency: number;
  gain: number;
  type: BiquadFilterType;
  Q?: number;
}

class EqualizerAudioService {
  private audio: HTMLAudioElement | null = null;
  private listeners: Set<AudioStateListener> = new Set();
  private onSongEndedCallback: (() => void) | null = null;
  private currentSrc: string = '';
  private currentTrackId: string = '';
  private blobUrl: string | null = null;
  private lastSaveTime: number = 0;
  private pendingPlay: boolean = false;
  
  // Web Audio API nodes
  private audioContext: AudioContext | null = null;
  private sourceNode: MediaElementAudioSourceNode | null = null;
  private gainNode: GainNode | null = null;
  private filters: BiquadFilterNode[] = [];
  private isAudioGraphConnected: boolean = false;
  
  private state: AudioState = {
    currentTime: 0,
    duration: 0,
    progress: 0,
    isLoading: true,
    isPlayingOffline: false,
    volume: 0.7,
    equalizerEnabled: false,
  };

  // Default equalizer bands
  private equalizerBands: EqualizerBand[] = [
    { frequency: 60, gain: 0, type: 'lowshelf' },
    { frequency: 170, gain: 0, type: 'peaking', Q: 1 },
    { frequency: 310, gain: 0, type: 'peaking', Q: 1 },
    { frequency: 600, gain: 0, type: 'peaking', Q: 1 },
    { frequency: 1000, gain: 0, type: 'peaking', Q: 1 },
    { frequency: 3000, gain: 0, type: 'peaking', Q: 1 },
    { frequency: 6000, gain: 0, type: 'peaking', Q: 1 },
    { frequency: 12000, gain: 0, type: 'peaking', Q: 1 },
    { frequency: 14000, gain: 0, type: 'peaking', Q: 1 },
    { frequency: 16000, gain: 0, type: 'highshelf' }
  ];

  constructor() {
    // Ensure singleton
    if ((globalThis as any).equalizerAudioService) {
      return (globalThis as any).equalizerAudioService;
    }
    (globalThis as any).equalizerAudioService = this;
    
    // Load saved settings from localStorage
    this.loadSettings();
  }

  private loadSettings() {
    try {
      const savedVolume = localStorage.getItem('audio_player_volume');
      if (savedVolume) {
        this.state.volume = Math.max(0, Math.min(1, parseFloat(savedVolume)));
      }

      const savedEQEnabled = localStorage.getItem('equalizer_enabled');
      if (savedEQEnabled) {
        this.state.equalizerEnabled = savedEQEnabled === 'true';
      }

      const savedEQSettings = localStorage.getItem('equalizer_settings');
      if (savedEQSettings) {
        const settings = JSON.parse(savedEQSettings);
        this.equalizerBands = settings;
      }
    } catch {
      // Use default settings
    }
  }

  private saveSettings() {
    try {
      localStorage.setItem('audio_player_volume', this.state.volume.toString());
      localStorage.setItem('equalizer_enabled', this.state.equalizerEnabled.toString());
      localStorage.setItem('equalizer_settings', JSON.stringify(this.equalizerBands));
    } catch {
      // Ignore localStorage errors
    }
  }

  subscribe(listener: AudioStateListener) {
    this.listeners.add(listener);
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
    this.saveSettings();
  }

  private async initializeWebAudio() {
    if (!this.audio) return;

    try {
      // Create AudioContext if it doesn't exist
      if (!this.audioContext) {
        this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      }

      // Resume context if suspended
      if (this.audioContext.state === 'suspended') {
        await this.audioContext.resume();
      }

      // Create source node if it doesn't exist
      if (!this.sourceNode) {
        this.sourceNode = this.audioContext.createMediaElementSource(this.audio);
      }

      // Create gain node
      if (!this.gainNode) {
        this.gainNode = this.audioContext.createGain();
        this.gainNode.gain.value = this.state.volume;
      }

      // Create equalizer filters
      if (this.filters.length === 0) {
        this.filters = this.equalizerBands.map(band => {
          const filter = this.audioContext!.createBiquadFilter();
          filter.type = band.type;
          filter.frequency.value = band.frequency;
          filter.gain.value = band.gain;
          if (band.Q) {
            filter.Q.value = band.Q;
          }
          return filter;
        });
      }

      // Connect audio graph
      this.connectAudioGraph();

    } catch (error) {
      console.error('Failed to initialize Web Audio API:', error);
    }
  }

  private connectAudioGraph() {
    if (!this.sourceNode || !this.gainNode || this.isAudioGraphConnected) return;

    try {
      let currentNode: AudioNode = this.sourceNode;

      if (this.state.equalizerEnabled && this.filters.length > 0) {
        // Connect through equalizer filters
        this.filters.forEach(filter => {
          currentNode.connect(filter);
          currentNode = filter;
        });
      }

      // Connect to gain node and destination
      currentNode.connect(this.gainNode);
      this.gainNode.connect(this.audioContext!.destination);
      
      this.isAudioGraphConnected = true;
    } catch (error) {
      console.error('Error connecting audio graph:', error);
    }
  }

  private disconnectAudioGraph() {
    if (!this.isAudioGraphConnected) return;

    try {
      if (this.sourceNode) {
        this.sourceNode.disconnect();
      }
      
      this.filters.forEach(filter => {
        filter.disconnect();
      });
      
      if (this.gainNode) {
        this.gainNode.disconnect();
      }
      
      this.isAudioGraphConnected = false;
    } catch (error) {
      console.error('Error disconnecting audio graph:', error);
    }
  }

  async setSrc(src: string, trackId?: string) {
    if (this.currentSrc === src && this.currentTrackId === (trackId || '')) {
      return;
    }

    this.currentSrc = src;
    this.currentTrackId = trackId || '';
    this.pendingPlay = false;
    
    this.updateState({ isLoading: true });

    // Disconnect existing audio graph
    this.disconnectAudioGraph();

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
    this.audio.addEventListener('ended', this.handleEnded);

    // Set audio source
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
    
    // Initialize Web Audio API
    await this.initializeWebAudio();
    
    if (trackId) {
      this.restorePlaybackPosition(trackId);
    }
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
      
      if (this.currentTrackId && currentTime > 0) {
        this.savePlaybackPosition(currentTime);
      }
    }
  };

  private handleCanPlay = async () => {
    this.updateState({ isLoading: false });
    
    if (this.pendingPlay) {
      this.pendingPlay = false;
      try {
        await this.audio?.play();
      } catch (error) {
        console.error("Pending play failed:", error);
      }
    }
  };

  private handleError = async () => {
    this.updateState({ isLoading: false });
    console.error("Audio loading failed");
    
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

  private handleEnded = () => {
    if (this.onSongEndedCallback) {
      this.onSongEndedCallback();
    }
  };

  async play() {
    if (this.audio && !this.state.isLoading) {
      try {
        if (this.audio.readyState < 3) {
          this.pendingPlay = true;
          return false;
        }
        await this.audio.play();
        this.pendingPlay = false;
        return true;
      } catch (error) {
        const audioError = error as Error;
        if (audioError.name === 'NotAllowedError') {
          this.pendingPlay = true;
        }
        return false;
      }
    } else {
      if (this.state.isLoading) {
        this.pendingPlay = true;
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
      this.audio.volume = adjustedVolume;
    }
    
    if (this.gainNode) {
      this.gainNode.gain.value = adjustedVolume;
    }
  }

  // Equalizer methods
  setEqualizerEnabled(enabled: boolean) {
    this.updateState({ equalizerEnabled: enabled });
    
    // Reconnect audio graph with or without equalizer
    this.disconnectAudioGraph();
    this.connectAudioGraph();
  }

  setEqualizerBand(index: number, gain: number) {
    if (index >= 0 && index < this.equalizerBands.length) {
      this.equalizerBands[index].gain = gain;
      
      if (this.filters[index]) {
        this.filters[index].gain.value = gain;
      }
      
      this.saveSettings();
    }
  }

  setEqualizerPreset(gains: number[]) {
    gains.forEach((gain, index) => {
      if (index < this.equalizerBands.length) {
        this.equalizerBands[index].gain = gain;
        
        if (this.filters[index]) {
          this.filters[index].gain.value = gain;
        }
      }
    });
    
    this.saveSettings();
  }

  getEqualizerBands() {
    return [...this.equalizerBands];
  }

  getAudioElement() {
    return this.audio;
  }

  setOnSongEndedCallback(callback: () => void) {
    this.onSongEndedCallback = callback;
  }

  getCurrentState(): AudioState {
    return { ...this.state };
  }

  private savePlaybackPosition(currentTime: number) {
    if (!this.lastSaveTime || Date.now() - this.lastSaveTime > 2000) {
      try {
        const positionData = {
          trackId: this.currentTrackId,
          currentTime: currentTime,
          timestamp: Date.now()
        };
        localStorage.setItem('audio_player_position', JSON.stringify(positionData));
        this.lastSaveTime = Date.now();
      } catch {
        // Ignore localStorage errors
      }
    }
  }

  private restorePlaybackPosition(trackId: string) {
    try {
      const saved = localStorage.getItem('audio_player_position');
      if (saved) {
        const positionData = JSON.parse(saved);
        if (positionData.trackId === trackId && 
            positionData.currentTime > 0 &&
            (Date.now() - positionData.timestamp) < 7 * 24 * 60 * 60 * 1000) {
          
          const restorePosition = () => {
            if (this.audio && this.audio.duration > 0) {
              this.audio.currentTime = Math.min(positionData.currentTime, this.audio.duration - 5);
              this.audio.removeEventListener('loadedmetadata', restorePosition);
            }
          };
          
          if (this.audio) {
            if (this.audio.duration > 0) {
              restorePosition();
            } else {
              this.audio.addEventListener('loadedmetadata', restorePosition);
            }
          }
        }
      }
    } catch {
      // Ignore localStorage errors
    }
  }

  cleanup() {
    this.disconnectAudioGraph();
    
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

    if (this.audioContext && this.audioContext.state !== 'closed') {
      this.audioContext.close();
      this.audioContext = null;
    }
    
    this.sourceNode = null;
    this.gainNode = null;
    this.filters = [];
    
    this.listeners.clear();
  }
}

// Create singleton instance
export const equalizerAudioService = new EqualizerAudioService();