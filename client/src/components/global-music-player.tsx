import { useMusicPlayer } from '@/hooks/use-music-player';
import MusicPlayer from '@/components/music-player';
import MobileMusicPlayer from '@/components/mobile-music-player';
import { useQuery } from '@tanstack/react-query';
import { LegacyTrack } from '@shared/schema';
import { useEffect } from 'react';
import { audioService } from '@/lib/audio-service';

interface Song {
  id: string;
  title: string;
  artist: string;
  category: string;
  duration: number;
  artwork: string;
  audioUrl?: string;
  isFavorite?: boolean;
}

export default function GlobalMusicPlayer() {
  const { currentSong, isPlaying, setCurrentSong, setIsPlaying } = useMusicPlayer();

  // Get all songs for navigation - ALWAYS call hooks first
  const { data: songs = [] } = useQuery<any[]>({
    queryKey: ['/api/songs'],
  });

  // Convert songs to legacy format - ALWAYS do this before conditional return
  const activeTrackList = songs.map((song: any): LegacyTrack => ({
    id: song.id,
    title: song.title,
    artist: "Unknown Artist",
    category: "Music", 
    duration: song.duration || 0,
    url: song.filePath || "",
    artwork: song.coverArt || 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=300',
    isFavorite: false,
    uploadType: "file",
    createdAt: song.createdAt,
  }));

  const handleNext = async () => {
    if (!currentSong) return;
    
    const currentIndex = activeTrackList.findIndex(t => t.id === currentSong.id);
    if (currentIndex === -1) {
      return;
    }
    
    const nextTrack = activeTrackList[currentIndex + 1];
    if (nextTrack) {
      console.log("Switching to next track:", nextTrack.title);
      
      // First set the new song
      setCurrentSong(nextTrack);
      
      // Then update audio service with new URL and play
      try {
        const songUrl = nextTrack.url.startsWith('/uploads/') ? nextTrack.url : `/uploads/${nextTrack.url}`;
        console.log("Setting audio source for next track:", songUrl);
        await audioService.setSrc(songUrl, nextTrack.id);
        
        // Play the new track
        const playSuccess = await audioService.play();
        if (playSuccess) {
          console.log("Next track playback started successfully");
          setIsPlaying(true);
        } else {
          console.log("Next track playback failed, setting state to play anyway");
          setIsPlaying(true);
        }
      } catch (error) {
        console.error("Error switching to next track:", error);
        setIsPlaying(true); // Still set playing state so UI updates
      }
    } else {
      console.log("No next track available, stopping playback");
      setIsPlaying(false);
    }
  };

  const handlePrevious = () => {
    if (!currentSong) return;
    
    const currentIndex = activeTrackList.findIndex(t => t.id === currentSong.id);
    if (currentIndex === -1) {
      return;
    }
    
    const prevTrack = activeTrackList[currentIndex - 1];
    if (prevTrack) {
      setCurrentSong(prevTrack);
      setIsPlaying(true);
    } else {
      setIsPlaying(false);
    }
  };

  const handlePlayPause = () => {
    setIsPlaying(!isPlaying);
  };

  // Set up auto-advance when song ends
  useEffect(() => {
    const handleSongEnded = () => {
      console.log("Song ended, auto-advancing to next track");
      handleNext();
    };
    
    audioService.setOnSongEndedCallback(handleSongEnded);
    
    return () => {
      audioService.setOnSongEndedCallback(() => {});
    };
  }, [activeTrackList, currentSong]);

  // CONDITIONAL RETURN AFTER ALL HOOKS
  if (!currentSong) return null;

  return (
    <>
      {/* Desktop Music Player */}
      <div className="hidden md:block">
        <MusicPlayer
          song={currentSong}
          isPlaying={isPlaying}
          onPlayPause={handlePlayPause}
          onNext={handleNext}
          onPrevious={handlePrevious}
        />
      </div>

      {/* Mobile Music Player */}
      <div className="md:hidden">
        <MobileMusicPlayer
          song={currentSong}
          isPlaying={isPlaying}
          onPlayPause={handlePlayPause}
          onNext={handleNext}
          onPrevious={handlePrevious}
        />
      </div>
    </>
  );
}