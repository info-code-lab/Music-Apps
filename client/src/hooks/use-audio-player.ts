import { useState, useEffect, useRef } from "react";
import { offlineStorage } from '@/lib/offline-storage';
import { useOffline } from './use-offline';

export function useAudioPlayer(src: string, isPlaying: boolean, trackId?: string) {
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [progress, setProgress] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isPlayingOffline, setIsPlayingOffline] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const blobUrlRef = useRef<string | null>(null);
  const { isOffline } = useOffline();

  useEffect(() => {
    let isMounted = true;
    
    const setupAudio = async () => {
      setIsLoading(true);
      
      // Reuse existing audio element or create new one
      let audio = audioRef.current;
      if (!audio) {
        audio = new Audio();
        audioRef.current = audio;
      } else {
        // Pause current playback before changing source
        audio.pause();
      }

      const handleLoadedMetadata = () => {
        if (isMounted) {
          setDuration(audio.duration);
          setIsLoading(false);
        }
      };

      const handleTimeUpdate = () => {
        if (isMounted) {
          setCurrentTime(audio.currentTime);
          setProgress(audio.duration ? audio.currentTime / audio.duration : 0);
        }
      };

      const handleCanPlay = () => {
        if (isMounted) {
          setIsLoading(false);
        }
      };

      const handleError = (event: Event) => {
        if (isMounted) {
          setIsLoading(false);
          console.error("Audio loading failed:", (event.target as HTMLAudioElement)?.error?.message || "Unknown audio error");
          
          // If online source fails and we have trackId, try offline version
          if (trackId && !isPlayingOffline) {
            tryOfflinePlayback();
          }
        }
      };

      const tryOfflinePlayback = async () => {
        if (!trackId) return;
        
        try {
          const offlineSong = await offlineStorage.getSong(trackId);
          if (offlineSong) {
            // Cleanup previous blob URL
            if (blobUrlRef.current) {
              offlineStorage.revokeBlobUrl(blobUrlRef.current);
            }
            
            // Create new blob URL
            const blobUrl = offlineStorage.createBlobUrl(offlineSong.audioBlob);
            blobUrlRef.current = blobUrl;
            
            audio.src = blobUrl;
            setIsPlayingOffline(true);
            audio.load();
            return;
          }
        } catch (error) {
          console.error("Failed to load offline version:", error);
        }
        
        // Fallback to online source
        audio.src = src;
        setIsPlayingOffline(false);
        audio.load();
      };

      // Remove existing listeners first
      audio.removeEventListener("loadedmetadata", handleLoadedMetadata);
      audio.removeEventListener("timeupdate", handleTimeUpdate);
      audio.removeEventListener("canplay", handleCanPlay);
      audio.removeEventListener("error", handleError);
      
      // Add event listeners
      audio.addEventListener("loadedmetadata", handleLoadedMetadata);
      audio.addEventListener("timeupdate", handleTimeUpdate);
      audio.addEventListener("canplay", handleCanPlay);
      audio.addEventListener("error", handleError);

      // Only proceed if we have a valid source
      if (!src || src.trim() === '') {
        console.warn("Empty audio source provided");
        setIsLoading(false);
        return;
      }

      // Determine which source to use
      if (isOffline && trackId) {
        // If offline, try to use offline version first
        await tryOfflinePlayback();
      } else if (trackId) {
        // If online, check if we have offline version and prefer it for better performance
        const offlineSong = await offlineStorage.getSong(trackId);
        if (offlineSong) {
          const blobUrl = offlineStorage.createBlobUrl(offlineSong.audioBlob);
          blobUrlRef.current = blobUrl;
          audio.src = blobUrl;
          setIsPlayingOffline(true);
        } else {
          audio.src = src;
          setIsPlayingOffline(false);
        }
        audio.load();
      } else {
        // No trackId, use online source
        audio.src = src;
        setIsPlayingOffline(false);
        audio.load();
      }
    };

    setupAudio();

    return () => {
      isMounted = false;
      const audio = audioRef.current;
      if (audio) {
        audio.removeEventListener("loadedmetadata", () => {});
        audio.removeEventListener("timeupdate", () => {});
        audio.removeEventListener("canplay", () => {});
        audio.removeEventListener("error", () => {});
        audio.pause();
        audio.src = "";
      }
      
      // Cleanup blob URL
      if (blobUrlRef.current) {
        offlineStorage.revokeBlobUrl(blobUrlRef.current);
        blobUrlRef.current = null;
      }
    };
  }, [src, trackId, isOffline]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio || isLoading) return;

    if (isPlaying) {
      // Wait a bit to ensure the audio is properly loaded before trying to play
      const playTimeout = setTimeout(() => {
        const playPromise = audio.play();
        if (playPromise !== undefined) {
          playPromise.catch((error) => {
            console.error("Audio playback failed:", error.message || error);
            // Don't try to play again immediately to avoid loops
          });
        }
      }, 100);

      return () => clearTimeout(playTimeout);
    } else {
      audio.pause();
    }
  }, [isPlaying, isLoading]);

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
    isPlayingOffline,
    seek,
    setVolumeLevel,
  };
}
