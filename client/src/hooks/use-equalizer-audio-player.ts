import { useState, useEffect } from 'react';
import { equalizerAudioService } from '@/lib/equalizer-audio-service';

export function useEqualizerAudioPlayer(src: string, isPlaying: boolean, trackId?: string) {
  console.log("useEqualizerAudioPlayer hook called with - src:", src, "isPlaying:", isPlaying, "trackId:", trackId);
  const [state, setState] = useState(equalizerAudioService.getCurrentState());

  useEffect(() => {
    // Subscribe to audio service state changes
    const unsubscribe = equalizerAudioService.subscribe(setState);
    return unsubscribe;
  }, []);

  useEffect(() => {
    // Update audio source when src or trackId changes
    if (src) {
      console.log("Setting audio source:", src, "trackId:", trackId);
      equalizerAudioService.setSrc(src, trackId);
    }
  }, [src, trackId]);

  useEffect(() => {
    // Handle play/pause state changes
    console.log("useEqualizerAudioPlayer isPlaying effect triggered with:", isPlaying);
    if (isPlaying) {
      console.log("Calling equalizerAudioService.play()");
      equalizerAudioService.play();
    } else {
      console.log("Calling equalizerAudioService.pause()");
      equalizerAudioService.pause();
    }
  }, [isPlaying]);

  const seek = (percentage: number) => {
    equalizerAudioService.seek(percentage);
  };

  const setVolumeLevel = (volume: number) => {
    equalizerAudioService.setVolume(volume);
  };

  return {
    currentTime: state.currentTime,
    duration: state.duration,
    progress: state.progress,
    isLoading: state.isLoading,
    isPlayingOffline: state.isPlayingOffline,
    equalizerEnabled: state.equalizerEnabled,
    seek,
    setVolumeLevel,
  };
}