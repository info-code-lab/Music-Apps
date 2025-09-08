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

  // Get all tracks for navigation - try both endpoints to ensure we have data
  const { data: tracks = [] } = useQuery<LegacyTrack[]>({
    queryKey: ['/api/tracks'],
  });
  
  const { data: songs = [] } = useQuery<any[]>({
    queryKey: ['/api/songs'],
  });

  if (!currentSong) return null;

  // Convert songs to legacy format if needed
  const convertedSongs = songs.map((song: any): LegacyTrack => ({
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

  // Use whichever dataset has the current song
  let activeTrackList = tracks;
  if (tracks.length === 0 || !tracks.find(t => t.id === currentSong.id)) {
    activeTrackList = convertedSongs;
  }

  console.log('Current song ID:', currentSong.id);
  console.log('Available tracks:', activeTrackList.length);
  console.log('Track IDs:', activeTrackList.map(t => t.id));

  const handleNext = () => {
    const currentIndex = activeTrackList.findIndex(t => t.id === currentSong.id);
    console.log('Current index:', currentIndex, 'Total tracks:', activeTrackList.length);
    
    if (currentIndex === -1) {
      console.log('Current song not found in track list');
      return;
    }
    
    const nextTrack = activeTrackList[currentIndex + 1];
    if (nextTrack) {
      console.log('Moving to next track:', nextTrack.title);
      setCurrentSong(nextTrack);
    } else {
      console.log('No next track available, stopping playback');
      setIsPlaying(false);
    }
  };

  const handlePrevious = () => {
    const currentIndex = activeTrackList.findIndex(t => t.id === currentSong.id);
    console.log('Current index:', currentIndex, 'Total tracks:', activeTrackList.length);
    
    if (currentIndex === -1) {
      console.log('Current song not found in track list');
      return;
    }
    
    const prevTrack = activeTrackList[currentIndex - 1];
    if (prevTrack) {
      console.log('Moving to previous track:', prevTrack.title);
      setCurrentSong(prevTrack);
    } else {
      console.log('No previous track available, stopping playback');
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