import { useMusicPlayer } from '@/hooks/use-music-player';
import MusicPlayer from '@/components/music-player';
import MobileMusicPlayer from '@/components/mobile-music-player';
import { useQuery } from '@tanstack/react-query';
import { LegacyTrack } from '@shared/schema';

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
    artwork: song.coverArt,
    isFavorite: false,
    uploadType: "file",
    createdAt: song.createdAt,
  }));

  // CONDITIONAL RETURN AFTER ALL HOOKS
  if (!currentSong) return null;


  const handleNext = () => {
    const currentIndex = activeTrackList.findIndex(t => t.id === currentSong.id);
    if (currentIndex === -1) {
      return;
    }
    
    const nextTrack = activeTrackList[currentIndex + 1];
    if (nextTrack) {
      setCurrentSong(nextTrack);
      setIsPlaying(true);
    } else {
      setIsPlaying(false);
    }
  };

  const handlePrevious = () => {
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