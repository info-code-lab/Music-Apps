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
      return saved === 'true';
    } catch {
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
    localStorage.setItem('music_player_is_playing', isPlaying.toString());
  }, [isPlaying]);

  const playTrack = (track: LegacyTrack) => {
    console.log("🎵 playTrack called with:", { id: track.id, title: track.title, url: track.url });
    setCurrentSong(track);
    setIsPlaying(true);
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