import { useMusicPlayer } from '@/hooks/use-music-player';
import { useQuery } from '@tanstack/react-query';
import { LegacyTrack } from '@shared/schema';
import AudioPlayer, { RHAP_UI } from 'react-h5-audio-player';
import 'react-h5-audio-player/lib/styles.css';
import { Heart } from 'lucide-react';

export default function GlobalMusicPlayer() {
  const { currentSong, setCurrentSong, setIsPlaying } = useMusicPlayer();

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
    }
  };

  const handlePrevious = () => {
    const currentIndex = tracks.findIndex(t => t.id === currentSong.id);
    const prevTrack = tracks[currentIndex - 1];
    if (prevTrack) {
      setCurrentSong(prevTrack);
    }
  };

  const handlePlay = () => {
    setIsPlaying(true);
  };

  const handlePause = () => {
    setIsPlaying(false);
  };

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-card border-t border-border z-50 mb-16 md:mb-0">
      <div className="flex items-center px-4 py-2 space-x-4">
        {/* Song Info */}
        <div className="flex items-center space-x-3 min-w-0 flex-shrink-0">
          <img 
            src={currentSong.artwork || 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?ixlib=rb-4.0.3&auto=format&fit=crop&w=60&h=60'} 
            alt={currentSong.title}
            className="w-12 h-12 rounded object-cover" 
          />
          <div className="min-w-0">
            <p className="text-sm font-semibold text-foreground truncate">
              {currentSong.title}
            </p>
            <p className="text-xs text-muted-foreground truncate">
              {currentSong.artist}
            </p>
          </div>
        </div>

        {/* Audio Player */}
        <div className="flex-1 min-w-0">
          <AudioPlayer
            src={currentSong.url}
            onPlay={handlePlay}
            onPause={handlePause}
            onClickNext={handleNext}
            onClickPrevious={handlePrevious}
            showSkipControls={true}
            showJumpControls={false}
            showFilledVolume={false}
            customAdditionalControls={[]}
            customVolumeControls={[]}
            layout="horizontal-reverse"
            customProgressBarSection={[
              RHAP_UI.CURRENT_TIME,
              RHAP_UI.PROGRESS_BAR,
              RHAP_UI.DURATION,
            ]}
            customControlsSection={[
              RHAP_UI.ADDITIONAL_CONTROLS,
              RHAP_UI.MAIN_CONTROLS,
              RHAP_UI.VOLUME_CONTROLS,
            ]}
            className="rhap_container-custom"
            style={{
              backgroundColor: 'transparent',
              boxShadow: 'none',
            }}
          />
        </div>

        {/* Favorite Button */}
        <div className="flex-shrink-0">
          <button className="text-muted-foreground hover:text-foreground transition-colors p-2">
            <Heart className={`w-4 h-4 ${currentSong.isFavorite ? 'fill-current text-red-500' : ''}`} />
          </button>
        </div>
      </div>

      {/* Custom styles for the audio player */}
      <style>{`
        .rhap_container-custom {
          background-color: transparent !important;
          box-shadow: none !important;
          padding: 0 !important;
        }
        .rhap_main-controls-button {
          color: hsl(var(--foreground)) !important;
        }
        .rhap_progress-filled {
          background-color: hsl(var(--primary)) !important;
        }
        .rhap_progress-indicator {
          background-color: hsl(var(--primary)) !important;
          border: 2px solid hsl(var(--primary)) !important;
        }
        .rhap_progress-container {
          margin: 0 8px !important;
        }
        .rhap_time {
          color: hsl(var(--muted-foreground)) !important;
          font-size: 0.75rem !important;
        }
        .rhap_volume-button {
          color: hsl(var(--foreground)) !important;
        }
        .rhap_volume-bar-area {
          background-color: hsl(var(--muted)) !important;
        }
        .rhap_volume-indicator {
          background-color: hsl(var(--primary)) !important;
        }
      `}</style>
    </div>
  );
}