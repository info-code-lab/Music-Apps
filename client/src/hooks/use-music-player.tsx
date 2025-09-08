import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { LegacyTrack } from '@shared/schema';

interface MusicPlayerContextType {
  currentSong: LegacyTrack | null;
  isPlaying: boolean;
  setCurrentSong: (song: LegacyTrack | null) => void;
  setIsPlaying: (playing: boolean) => void;
  playTrack: (track: LegacyTrack) => void;
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
      const saved = localStorage.getItem('music_player_is_playing');
      const initialValue = saved === 'true';
      console.log("Initial isPlaying state:", initialValue);
      return initialValue;
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

  const playTrack = (track: LegacyTrack) => {
    console.log("playTrack called with:", track.title);
    console.log("Setting currentSong to:", track);
    console.log("Setting isPlaying to true");
    setCurrentSong(track);
    setIsPlaying(true);
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