import React, { createContext, useContext, useState, ReactNode } from 'react';
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
  const [currentSong, setCurrentSong] = useState<LegacyTrack | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);

  const playTrack = (track: LegacyTrack) => {
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