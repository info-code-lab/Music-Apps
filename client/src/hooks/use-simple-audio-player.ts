
import { useState, useEffect, useCallback, useRef } from 'react';
import { simpleAudioService } from '@/lib/simple-audio-service';
import toast from 'react-hot-toast';

export interface SimpleAudioPlayerState {
  isPlaying: boolean;
  isPaused: boolean;
  isLoading: boolean;
  currentTime: number;
  duration: number;
  volume: number;
  error: string | null;
  requiresUserInteraction: boolean;
}

export interface SimpleAudioPlayerControls {
  play: (src: string) => Promise<void>;
  pause: () => void;
  stop: () => void;
  seek: (time: number) => void;
  setVolume: (volume: number) => void;
  toggle: (src?: string) => Promise<void>;
}

export function useSimpleAudioPlayer(): [SimpleAudioPlayerState, SimpleAudioPlayerControls] {
  const [state, setState] = useState<SimpleAudioPlayerState>({
    isPlaying: false,
    isPaused: true,
    isLoading: false,
    currentTime: 0,
    duration: 0,
    volume: 1,
    error: null,
    requiresUserInteraction: false,
  });

  const currentSrcRef = useRef<string | null>(null);
  const timeUpdateIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const updateTimeAndDuration = useCallback(() => {
    setState(prev => ({
      ...prev,
      currentTime: simpleAudioService.getCurrentTime(),
      duration: simpleAudioService.getDuration(),
    }));
  }, []);

  const startTimeTracking = useCallback(() => {
    if (timeUpdateIntervalRef.current) {
      clearInterval(timeUpdateIntervalRef.current);
    }
    timeUpdateIntervalRef.current = setInterval(updateTimeAndDuration, 100);
  }, [updateTimeAndDuration]);

  const stopTimeTracking = useCallback(() => {
    if (timeUpdateIntervalRef.current) {
      clearInterval(timeUpdateIntervalRef.current);
      timeUpdateIntervalRef.current = null;
    }
  }, []);

  const play = useCallback(async (src: string) => {
    try {
      setState(prev => ({ 
        ...prev, 
        isLoading: true, 
        error: null,
        requiresUserInteraction: false 
      }));

      await simpleAudioService.play(src);
      currentSrcRef.current = src;

      setState(prev => ({
        ...prev,
        isPlaying: true,
        isPaused: false,
        isLoading: false,
        error: null,
      }));

      startTimeTracking();
      updateTimeAndDuration();
    } catch (error) {
      console.error('Play failed:', error);
      
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      
      if (errorMessage.includes('user interaction')) {
        setState(prev => ({
          ...prev,
          isLoading: false,
          error: 'Click anywhere to enable audio playback',
          requiresUserInteraction: true,
        }));
        toast.error('Click anywhere to enable audio playback');
      } else if (errorMessage.includes('loading failed')) {
        setState(prev => ({
          ...prev,
          isLoading: false,
          error: 'Failed to load audio file',
        }));
        toast.error('Failed to load audio file');
      } else {
        setState(prev => ({
          ...prev,
          isLoading: false,
          error: errorMessage,
        }));
        toast.error('Playback failed');
      }
    }
  }, [startTimeTracking, updateTimeAndDuration]);

  const pause = useCallback(() => {
    simpleAudioService.pause();
    setState(prev => ({
      ...prev,
      isPlaying: false,
      isPaused: true,
    }));
    stopTimeTracking();
  }, [stopTimeTracking]);

  const stop = useCallback(() => {
    simpleAudioService.stop();
    setState(prev => ({
      ...prev,
      isPlaying: false,
      isPaused: true,
      currentTime: 0,
    }));
    stopTimeTracking();
    currentSrcRef.current = null;
  }, [stopTimeTracking]);

  const seek = useCallback((time: number) => {
    simpleAudioService.setCurrentTime(time);
    updateTimeAndDuration();
  }, [updateTimeAndDuration]);

  const setVolume = useCallback((volume: number) => {
    simpleAudioService.setVolume(volume);
    setState(prev => ({ ...prev, volume }));
  }, []);

  const toggle = useCallback(async (src?: string) => {
    if (state.isPlaying) {
      pause();
    } else if (src) {
      await play(src);
    } else if (currentSrcRef.current) {
      await play(currentSrcRef.current);
    }
  }, [state.isPlaying, play, pause]);

  // Set up event listeners
  useEffect(() => {
    const audio = simpleAudioService.getAudioElement();
    if (!audio) return;

    const handleEnded = () => {
      setState(prev => ({
        ...prev,
        isPlaying: false,
        isPaused: true,
        currentTime: 0,
      }));
      stopTimeTracking();
    };

    const handleLoadedMetadata = () => {
      updateTimeAndDuration();
    };

    const handleError = (event: Event) => {
      const audioElement = event.target as HTMLAudioElement;
      const error = audioElement.error;
      
      let errorMessage = 'Audio playback error';
      if (error) {
        switch (error.code) {
          case error.MEDIA_ERR_ABORTED:
            errorMessage = 'Audio playback was aborted';
            break;
          case error.MEDIA_ERR_NETWORK:
            errorMessage = 'Network error occurred';
            break;
          case error.MEDIA_ERR_DECODE:
            errorMessage = 'Audio file is corrupted or unsupported';
            break;
          case error.MEDIA_ERR_SRC_NOT_SUPPORTED:
            errorMessage = 'Audio format not supported';
            break;
        }
      }

      setState(prev => ({
        ...prev,
        isLoading: false,
        isPlaying: false,
        error: errorMessage,
      }));
      stopTimeTracking();
    };

    audio.addEventListener('ended', handleEnded);
    audio.addEventListener('loadedmetadata', handleLoadedMetadata);
    audio.addEventListener('error', handleError);

    return () => {
      audio.removeEventListener('ended', handleEnded);
      audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
      audio.removeEventListener('error', handleError);
    };
  }, [stopTimeTracking, updateTimeAndDuration]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopTimeTracking();
      simpleAudioService.cleanup();
    };
  }, [stopTimeTracking]);

  return [state, { play, pause, stop, seek, setVolume, toggle }];
}
