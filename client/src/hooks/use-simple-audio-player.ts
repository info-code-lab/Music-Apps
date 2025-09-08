import { useState, useEffect } from 'react';
import { simpleAudioService } from '@/lib/simple-audio-service';

export function useSimpleAudioPlayer(src: string | null, trackId?: string, isPlaying: boolean = false) {
  const [audioState, setAudioState] = useState(() => (simpleAudioService as any).state);

  useEffect(() => {
    const unsubscribe = simpleAudioService.subscribe(setAudioState);
    return unsubscribe;
  }, []);

  useEffect(() => {
    if (src) {
      simpleAudioService.setSrc(src, trackId);
    }
  }, [src, trackId]);

  useEffect(() => {
    if (isPlaying) {
      simpleAudioService.play();
    } else {
      simpleAudioService.pause();
    }
  }, [isPlaying]);

  const seek = (percentage: number) => {
    simpleAudioService.seek(percentage);
  };

  const setVolume = (volume: number) => {
    simpleAudioService.setVolume(volume);
  };

  return {
    ...audioState,
    seek,
    setVolume,
  };
}