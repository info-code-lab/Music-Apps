import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { LegacyTrack } from '@shared/schema';

interface MusicPlayerContextType {
  currentSong: LegacyTrack | null;
  isPlaying: boolean;
  setCurrentSong: (song: LegacyTrack | null) => void;
  setIsPlaying: (playing: boolean) => void;
  playTrack: (track: LegacyTrack, isUserInitiated?: boolean) => void;
  togglePlayPause: () => void;
}

const MusicPlayerContext = createContext<MusicPlayerContextType | undefined>(undefined);

export function MusicPlayerProvider({ children }: { children: ReactNode }) {
  // Initialize state from localStorage
  const [currentSong, setCurrentSong] = useState<LegacyTrack | null>(() => {
    try {
      const saved = localStorage.getItem('music_player_current_song');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });
  
  const [isPlaying, setIsPlaying] = useState(() => {
    try {
      // On page refresh, always start with paused state to avoid autoplay issues
      // The UI will show the restore button so user can resume playback
      console.log("Initial isPlaying state: false (avoiding autoplay on refresh)");
      return false;
    } catch {
      console.log("Initial isPlaying state: false (fallback)");
      return false;
    }
  });

  // Save to localStorage whenever state changes
  useEffect(() => {
    if (currentSong) {
      localStorage.setItem('music_player_current_song', JSON.stringify(currentSong));
    } else {
      localStorage.removeItem('music_player_current_song');
    }
  }, [currentSong]);

  useEffect(() => {
    console.log("isPlaying state changed to:", isPlaying);
    localStorage.setItem('music_player_is_playing', isPlaying.toString());
  }, [isPlaying]);

  const playTrack = async (track: LegacyTrack, isUserInitiated = false) => {
    console.log("playTrack called with:", track.title, "userInitiated:", isUserInitiated);
    console.log("Setting currentSong to:", track);
    setCurrentSong(track);
    
    if (isUserInitiated) {
      // For user-initiated playback, immediately try to play to satisfy browser autoplay policy
      console.log("User initiated - attempting immediate playback");
      const { audioService } = await import('@/lib/audio-service');
      const songUrl = track.url.startsWith('/uploads/') ? track.url : `/uploads/${track.url}`;
      await audioService.setSrc(songUrl, track.id);
      const playSuccess = await audioService.play();
      if (playSuccess) {
        console.log("Immediate playback successful");
        setIsPlaying(true);
      } else {
        console.log("Immediate playback failed, will try again through state update");
        setIsPlaying(true);
      }
    } else {
      console.log("Setting isPlaying to true");
      setIsPlaying(true);
    }
    console.log("playTrack completed - state should be updated");
  };

  const togglePlayPause = () => {
    setIsPlaying(!isPlaying);
  };

  return (
    <MusicPlayerContext.Provider
      value={{
        currentSong,
        isPlaying,
        setCurrentSong,
        setIsPlaying,
        playTrack,
        togglePlayPause,
      }}
    >
      {children}
    </MusicPlayerContext.Provider>
  );
}

export function useMusicPlayer() {
  const context = useContext(MusicPlayerContext);
  if (context === undefined) {
    throw new Error('useMusicPlayer must be used within a MusicPlayerProvider');
  }
  return context;
}