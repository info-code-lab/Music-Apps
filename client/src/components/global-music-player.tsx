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

  // Get all tracks for navigation
  const { data: tracks = [] } = useQuery<LegacyTrack[]>({
    queryKey: ['/api/tracks'],
  });

  if (!currentSong) return null;

  const handleNext = () => {
    const currentIndex = tracks.findIndex(t => t.id === currentSong.id);
    const nextTrack = tracks[currentIndex + 1];
    if (nextTrack) {
      setCurrentSong(nextTrack);
    } else {
      // If no next track, stop playing
      setIsPlaying(false);
    }
  };

  const handlePrevious = () => {
    const currentIndex = tracks.findIndex(t => t.id === currentSong.id);
    const prevTrack = tracks[currentIndex - 1];
    if (prevTrack) {
      setCurrentSong(prevTrack);
    } else {
      // If no previous track, stop playing
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