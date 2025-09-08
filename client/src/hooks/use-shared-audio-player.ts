import { useState, useEffect } from 'react';
import { audioService } from '@/lib/audio-service';

export function useSharedAudioPlayer(src: string, isPlaying: boolean, trackId?: string) {
  const [state, setState] = useState(audioService.getCurrentState());

  useEffect(() => {
    // Subscribe to audio service state changes
    const unsubscribe = audioService.subscribe(setState);
    return unsubscribe;
  }, []);

  useEffect(() => {
    // Update audio source when src or trackId changes
    if (src) {
      audioService.setSrc(src, trackId);
    }
  }, [src, trackId]);

  useEffect(() => {
    // Handle play/pause state changes
    if (isPlaying) {
      audioService.play();
    } else {
      audioService.pause();
    }
  }, [isPlaying]);

  const seek = (percentage: number) => {
    audioService.seek(percentage);
  };

  const setVolumeLevel = (volume: number) => {
    audioService.setVolume(volume);
  };

  return {
    currentTime: state.currentTime,
    duration: state.duration,
    progress: state.progress,
    isLoading: state.isLoading,
    isPlayingOffline: state.isPlayingOffline,
    seek,
    setVolumeLevel,
  };
}