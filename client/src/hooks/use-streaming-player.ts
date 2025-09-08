import { useState, useEffect, useRef, useCallback } from "react";
import Hls from "hls.js";

interface StreamingPlayerOptions {
  enableHLS: boolean;
  autoPlay: boolean;
  preferredQuality?: 'aac_128' | 'aac_320' | 'flac';
  adaptiveBitrate: boolean;
}

export function useStreamingPlayer(
  src: string, 
  isPlaying: boolean, 
  trackId?: string,
  options: StreamingPlayerOptions = {
    enableHLS: true,
    autoPlay: false,
    preferredQuality: 'aac_320',
    adaptiveBitrate: true
  }
) {
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [progress, setProgress] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [bufferProgress, setBufferProgress] = useState(0);
  const [playbackQuality, setPlaybackQuality] = useState<string>('aac_320');
  const [availableQualities, setAvailableQualities] = useState<string[]>([]);
  const [isLive, setIsLive] = useState(false);
  const [networkState, setNetworkState] = useState<'loading' | 'idle' | 'buffering'>('idle');
  
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const hlsRef = useRef<Hls | null>(null);
  const progressIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const eventHandlersRef = useRef<{
    handleLoadedMetadata: () => void;
    handleTimeUpdate: () => void;
    handleWaiting: () => void;
    handleCanPlay: () => void;
    handleProgress: () => void;
    handleError: () => void;
  } | null>(null);

  // Cleanup HLS instance
  const cleanupHls = useCallback(() => {
    if (hlsRef.current) {
      hlsRef.current.destroy();
      hlsRef.current = null;
    }
  }, []);

  // Check if source is HLS manifest
  const isHLSSource = useCallback((url: string) => {
    return url.includes('.m3u8') || url.includes('hls/');
  }, []);

  // Setup HLS streaming
  const setupHLS = useCallback((audio: HTMLAudioElement, source: string) => {
    if (!Hls.isSupported()) {
      console.warn('HLS not supported, falling back to native playback');
      return false;
    }

    cleanupHls();
    const hls = new Hls({
      enableWorker: true,
      lowLatencyMode: false,
      backBufferLength: 90,
      maxBufferLength: 30,
      maxMaxBufferLength: 600,
      startLevel: -1, // Auto-select initial quality
      capLevelToPlayerSize: true, // Limit quality based on player size
      manifestLoadingMaxRetry: 3,
      levelLoadingMaxRetry: 3,
      fragLoadingMaxRetry: 3,
    });

    hlsRef.current = hls;

    // HLS event handlers
    hls.on(Hls.Events.MANIFEST_PARSED, () => {
      const levels = hls.levels.map(level => `${level.bitrate / 1000}k`);
      setAvailableQualities(levels);
      setIsLoading(false);
    });

    hls.on(Hls.Events.LEVEL_SWITCHED, (event, data) => {
      const level = hls.levels[data.level];
      setPlaybackQuality(`${level.bitrate / 1000}k`);
    });

    hls.on(Hls.Events.FRAG_BUFFERED, () => {
      if (audio.buffered.length > 0) {
        const buffered = audio.buffered.end(audio.buffered.length - 1);
        setBufferProgress(audio.duration ? buffered / audio.duration : 0);
      }
    });

    hls.on(Hls.Events.ERROR, (event, data) => {
      console.error('HLS Error:', data);
      if (data.fatal) {
        switch (data.type) {
          case Hls.ErrorTypes.NETWORK_ERROR:
            hls.startLoad();
            break;
          case Hls.ErrorTypes.MEDIA_ERROR:
            hls.recoverMediaError();
            break;
          default:
            cleanupHls();
            break;
        }
      }
    });

    hls.loadSource(source);
    hls.attachMedia(audio);
    return true;
  }, [cleanupHls]);

  // Setup audio element with enhanced features
  useEffect(() => {
    let isMounted = true;
    
    const setupAudio = async () => {
      if (!src) return;
      
      setIsLoading(true);
      setNetworkState('loading');
      
      // Cleanup previous audio element completely
      if (audioRef.current) {
        const oldAudio = audioRef.current;
        
        // Stop playback and remove all event listeners
        oldAudio.pause();
        oldAudio.currentTime = 0;
        oldAudio.src = '';
        
        // Remove event listeners using stored references
        if (eventHandlersRef.current) {
          oldAudio.removeEventListener('loadedmetadata', eventHandlersRef.current.handleLoadedMetadata);
          oldAudio.removeEventListener('timeupdate', eventHandlersRef.current.handleTimeUpdate);
          oldAudio.removeEventListener('waiting', eventHandlersRef.current.handleWaiting);
          oldAudio.removeEventListener('canplay', eventHandlersRef.current.handleCanPlay);
          oldAudio.removeEventListener('progress', eventHandlersRef.current.handleProgress);
          oldAudio.removeEventListener('error', eventHandlersRef.current.handleError);
        }
        
        // Force garbage collection
        oldAudio.load();
        audioRef.current = null;
      }
      
      cleanupHls();

      // Create new audio element
      const audio = new Audio();
      audio.crossOrigin = 'anonymous';
      audio.preload = 'auto';
      
      // Enhanced audio quality settings
      try {
        audio.preservesPitch = false;
        (audio as any).mozPreservesPitch = false;
        (audio as any).webkitPreservesPitch = false;
        audio.defaultPlaybackRate = 1.0;
        audio.playbackRate = 1.0;
      } catch (e) {
        console.log("Advanced audio features not supported");
      }

      audioRef.current = audio;

      // Audio event handlers
      const handleLoadedMetadata = () => {
        if (isMounted) {
          setDuration(audio.duration);
          setIsLive(audio.duration === Infinity);
          setIsLoading(false);
          setNetworkState('idle');
        }
      };

      const handleTimeUpdate = () => {
        if (isMounted) {
          setCurrentTime(audio.currentTime);
          setProgress(audio.duration && audio.duration !== Infinity ? 
            audio.currentTime / audio.duration : 0);
        }
      };

      const handleWaiting = () => {
        setNetworkState('buffering');
      };

      const handleCanPlay = () => {
        setNetworkState('idle');
        setIsLoading(false);
      };

      const handleProgress = () => {
        if (audio.buffered.length > 0) {
          const buffered = audio.buffered.end(audio.buffered.length - 1);
          setBufferProgress(audio.duration ? buffered / audio.duration : 0);
        }
      };

      const handleError = () => {
        console.error('Audio playback error');
        setIsLoading(false);
        setNetworkState('idle');
      };

      // Store event handler references for proper cleanup
      eventHandlersRef.current = {
        handleLoadedMetadata,
        handleTimeUpdate,
        handleWaiting,
        handleCanPlay,
        handleProgress,
        handleError
      };

      // Attach event listeners
      audio.addEventListener('loadedmetadata', handleLoadedMetadata);
      audio.addEventListener('timeupdate', handleTimeUpdate);
      audio.addEventListener('waiting', handleWaiting);
      audio.addEventListener('canplay', handleCanPlay);
      audio.addEventListener('progress', handleProgress);
      audio.addEventListener('error', handleError);

      // Setup streaming based on source type
      if (options.enableHLS && isHLSSource(src)) {
        const hlsSetup = setupHLS(audio, src);
        if (!hlsSetup) {
          // Fallback to native HLS support or direct URL
          audio.src = src;
        }
      } else {
        // Direct audio file or progressive download
        audio.src = src;
        setAvailableQualities(['Original']);
        setPlaybackQuality('Original');
      }

      return () => {
        audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
        audio.removeEventListener('timeupdate', handleTimeUpdate);
        audio.removeEventListener('waiting', handleWaiting);
        audio.removeEventListener('canplay', handleCanPlay);
        audio.removeEventListener('progress', handleProgress);
        audio.removeEventListener('error', handleError);
      };
    };

    setupAudio();

    return () => {
      isMounted = false;
      const audio = audioRef.current;
      if (audio) {
        // Remove event listeners using stored references
        if (eventHandlersRef.current) {
          audio.removeEventListener('loadedmetadata', eventHandlersRef.current.handleLoadedMetadata);
          audio.removeEventListener('timeupdate', eventHandlersRef.current.handleTimeUpdate);
          audio.removeEventListener('waiting', eventHandlersRef.current.handleWaiting);
          audio.removeEventListener('canplay', eventHandlersRef.current.handleCanPlay);
          audio.removeEventListener('progress', eventHandlersRef.current.handleProgress);
          audio.removeEventListener('error', eventHandlersRef.current.handleError);
        }
        
        // Stop and cleanup audio
        audio.pause();
        audio.currentTime = 0;
        audio.src = '';
        audio.load(); // Force reset
      }
      
      cleanupHls();
      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current);
      }
      
      // Clear event handler references
      eventHandlersRef.current = null;
    };
  }, [src, options.enableHLS, isHLSSource, setupHLS, cleanupHls]);

  // Handle play/pause state changes
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    if (isPlaying) {
      const playPromise = audio.play();
      if (playPromise !== undefined) {
        playPromise.catch(error => {
          console.error('Playback failed:', error);
        });
      }
    } else {
      audio.pause();
    }
  }, [isPlaying]);

  // Player control functions
  const seek = useCallback((time: number) => {
    const audio = audioRef.current;
    if (audio && audio.duration) {
      audio.currentTime = time * audio.duration;
    }
  }, []);

  const setVolumeLevel = useCallback((volume: number) => {
    const audio = audioRef.current;
    if (audio) {
      audio.volume = Math.max(0, Math.min(1, volume));
    }
  }, []);

  const setQuality = useCallback((quality: string) => {
    const hls = hlsRef.current;
    if (hls && hls.levels.length > 0) {
      const levelIndex = hls.levels.findIndex(level => 
        `${level.bitrate / 1000}k` === quality
      );
      if (levelIndex !== -1) {
        hls.currentLevel = levelIndex;
      }
    }
  }, []);

  const getStreamingStats = useCallback(() => {
    const hls = hlsRef.current;
    const audio = audioRef.current;
    
    if (!hls || !audio) return null;

    return {
      level: hls.currentLevel,
      loadLevel: hls.loadLevel,
      nextLevel: hls.nextLevel,
      bandwidth: hls.bandwidthEstimate,
      bufferLength: audio.buffered.length > 0 ? 
        audio.buffered.end(audio.buffered.length - 1) - audio.currentTime : 0,
      droppedFrames: (hls as any).stats?.dropped || 0,
      totalBytesLoaded: (hls as any).stats?.total || 0,
    };
  }, []);

  return {
    // Playback state
    currentTime,
    duration,
    progress,
    isLoading,
    bufferProgress,
    isLive,
    networkState,
    
    // Quality management
    playbackQuality,
    availableQualities,
    setQuality,
    
    // Player controls
    seek,
    setVolumeLevel,
    
    // Advanced features
    getStreamingStats,
    
    // Refs for advanced usage
    audioRef,
    hlsRef,
  };
}