import { useState, useEffect, useRef } from "react";

export function useAudioPlayer(src: string, isPlaying: boolean) {
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [progress, setProgress] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    // Create audio element
    const audio = new Audio();
    audioRef.current = audio;

    const handleLoadedMetadata = () => {
      setDuration(audio.duration);
      setIsLoading(false);
    };

    const handleTimeUpdate = () => {
      setCurrentTime(audio.currentTime);
      setProgress(audio.duration ? audio.currentTime / audio.duration : 0);
    };

    const handleCanPlay = () => {
      setIsLoading(false);
    };

    const handleError = (event: Event) => {
      setIsLoading(false);
      console.error("Audio loading failed:", (event.target as HTMLAudioElement)?.error?.message || "Unknown audio error");
    };

    audio.addEventListener("loadedmetadata", handleLoadedMetadata);
    audio.addEventListener("timeupdate", handleTimeUpdate);
    audio.addEventListener("canplay", handleCanPlay);
    audio.addEventListener("error", handleError);

    // Set audio source
    audio.src = src;
    audio.load();

    return () => {
      audio.removeEventListener("loadedmetadata", handleLoadedMetadata);
      audio.removeEventListener("timeupdate", handleTimeUpdate);
      audio.removeEventListener("canplay", handleCanPlay);
      audio.removeEventListener("error", handleError);
      audio.pause();
      audio.src = "";
    };
  }, [src]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    if (isPlaying) {
      const playPromise = audio.play();
      if (playPromise !== undefined) {
        playPromise.catch((error) => {
          console.error("Audio playback failed:", error.message || error);
        });
      }
    } else {
      audio.pause();
    }
  }, [isPlaying]);

  const seek = (percentage: number) => {
    const audio = audioRef.current;
    if (!audio || !duration) return;

    const newTime = duration * percentage;
    audio.currentTime = newTime;
    setCurrentTime(newTime);
    setProgress(percentage);
  };

  const setVolumeLevel = (volume: number) => {
    const audio = audioRef.current;
    if (!audio) return;
    
    audio.volume = Math.max(0, Math.min(1, volume));
  };

  return {
    currentTime,
    duration,
    progress,
    isLoading,
    seek,
    setVolumeLevel,
  };
}
