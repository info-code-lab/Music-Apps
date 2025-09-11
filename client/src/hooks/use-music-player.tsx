import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { LegacyTrack } from '@shared/schema';
import { apiRequest } from '@/lib/queryClient';

interface MusicPlayerContextType {
  currentSong: LegacyTrack | null;
  isPlaying: boolean;
  isShuffle: boolean;
  isRepeat: boolean;
  setCurrentSong: (song: LegacyTrack | null) => void;
  setIsPlaying: (playing: boolean) => void;
  setIsShuffle: (shuffle: boolean) => void;
  setIsRepeat: (repeat: boolean) => void;
  playTrack: (track: LegacyTrack, isUserInitiated?: boolean) => void;
  togglePlayPause: () => void;
  toggleShuffle: () => void;
  toggleRepeat: () => void;
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
  
  // Initialize shuffle and repeat from localStorage
  const [isShuffle, setIsShuffle] = useState(() => {
    try {
      const saved = localStorage.getItem('music_player_shuffle');
      return saved ? JSON.parse(saved) : false;
    } catch {
      return false;
    }
  });
  
  const [isRepeat, setIsRepeat] = useState(() => {
    try {
      const saved = localStorage.getItem('music_player_repeat');
      return saved ? JSON.parse(saved) : false;
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
    console.log("isPlaying state changed to:", isPlaying);
    localStorage.setItem('music_player_is_playing', isPlaying.toString());
  }, [isPlaying]);

  // Save shuffle and repeat settings to localStorage
  useEffect(() => {
    localStorage.setItem('music_player_shuffle', JSON.stringify(isShuffle));
    console.log("Shuffle mode:", isShuffle);
  }, [isShuffle]);

  useEffect(() => {
    localStorage.setItem('music_player_repeat', JSON.stringify(isRepeat));
    console.log("Repeat mode:", isRepeat);
  }, [isRepeat]);

  const playTrack = async (track: LegacyTrack, isUserInitiated = false) => {
    console.log("playTrack called with:", track.title, "userInitiated:", isUserInitiated);
    console.log("Setting currentSong to:", track);
    setCurrentSong(track);
    
    // Log listening history when a track starts playing
    try {
      await apiRequest("POST", `/api/songs/${track.id}/play`);
      console.log("Logged listening history for:", track.title);
    } catch (error) {
      console.log("Failed to log listening history (auth might be required):", error);
    }
    
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

  const toggleShuffle = () => {
    setIsShuffle(!isShuffle);
    console.log("Toggling shuffle to:", !isShuffle);
  };

  const toggleRepeat = () => {
    setIsRepeat(!isRepeat);
    console.log("Toggling repeat to:", !isRepeat);
  };

  return (
    <MusicPlayerContext.Provider
      value={{
        currentSong,
        isPlaying,
        isShuffle,
        isRepeat,
        setCurrentSong,
        setIsPlaying,
        setIsShuffle,
        setIsRepeat,
        playTrack,
        togglePlayPause,
        toggleShuffle,
        toggleRepeat,
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