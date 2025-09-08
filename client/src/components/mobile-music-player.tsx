import { useState } from "react";
import { 
  Play, 
  Pause, 
  SkipBack, 
  SkipForward, 
  Heart,
  Volume2,
  ChevronUp,
  MoreHorizontal,
  Wifi
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { useAudioPlayer } from "@/hooks/use-audio-player";
import { formatDuration } from "@/lib/audio-utils";
import type { LegacyTrack as Track } from "@shared/schema";

interface MobileMusicPlayerProps {
  song: Track;
  isPlaying: boolean;
  onPlayPause: () => void;
  onNext: () => void;
  onPrevious: () => void;
  onExpand?: () => void;
}

export default function MobileMusicPlayer({ 
  song, 
  isPlaying, 
  onPlayPause, 
  onNext, 
  onPrevious,
  onExpand
}: MobileMusicPlayerProps) {
  const [volume, setVolume] = useState([70]);
  const [showControls, setShowControls] = useState(false);
  
  const {
    currentTime,
    duration,
    progress,
    isLoading,
    isPlayingOffline,
    seek,
    setVolumeLevel
  } = useAudioPlayer(song.url, isPlaying, song.id);

  const handleVolumeChange = (newVolume: number[]) => {
    setVolume(newVolume);
    setVolumeLevel(newVolume[0] / 100);
  };

  const handleSeek = (newProgress: number[]) => {
    seek(newProgress[0] / 100);
  };

  return (
    <>
      {/* Compact Bottom Bar */}
      <div className="fixed bottom-16 left-0 right-0 bg-card border-t border-border z-30">
        {/* Progress Bar (always visible at top) */}
        <div className="px-4 pt-1 pb-0">
          <Slider
            value={[progress * 100]}
            onValueChange={handleSeek}
            max={100}
            step={0.1}
            className="cursor-pointer h-1"
            data-testid="slider-progress-mobile"
          />
        </div>

        {/* Main Player Bar */}
        <div className="flex items-center justify-between px-4 py-3">
          {/* Song Info */}
          <div 
            className="flex items-center space-x-3 flex-1 min-w-0 cursor-pointer"
            onClick={onExpand}
            data-testid="button-expand-player"
          >
            <img 
              src={song.artwork || 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?ixlib=rb-4.0.3&auto=format&fit=crop&w=48&h=48'} 
              alt={song.title}
              className="w-12 h-12 rounded-lg object-cover shadow-md" 
            />
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <p className="text-sm font-semibold text-foreground truncate" data-testid="text-current-title-mobile">
                  {song.title}
                </p>
                {isPlayingOffline && (
                  <div className="bg-green-600 text-white px-1.5 py-0.5 rounded-full text-xs flex items-center gap-1">
                    <Wifi className="w-2.5 h-2.5" />
                  </div>
                )}
              </div>
              <p className="text-xs text-muted-foreground truncate" data-testid="text-current-artist-mobile">
                {song.artist}
              </p>
            </div>
          </div>

          {/* Quick Controls */}
          <div className="flex items-center space-x-1">
            <Button 
              variant="ghost" 
              size="sm"
              className="text-muted-foreground hover:text-foreground transition-colors p-2"
              data-testid="button-favorite-mobile"
            >
              <Heart className={`w-5 h-5 ${song.isFavorite ? 'fill-current text-red-500' : ''}`} />
            </Button>
            
            <Button 
              variant="ghost" 
              size="sm"
              onClick={onPrevious}
              className="text-muted-foreground hover:text-foreground transition-colors p-2"
              data-testid="button-previous-mobile"
            >
              <SkipBack className="w-5 h-5" />
            </Button>
            
            <Button 
              size="sm"
              onClick={onPlayPause}
              disabled={isLoading}
              className="w-10 h-10 bg-primary text-primary-foreground rounded-full hover:opacity-90 transition-opacity shadow-lg"
              data-testid="button-play-pause-mobile"
            >
              {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5 ml-0.5" />}
            </Button>
            
            <Button 
              variant="ghost" 
              size="sm"
              onClick={onNext}
              className="text-muted-foreground hover:text-foreground transition-colors p-2"
              data-testid="button-next-mobile"
            >
              <SkipForward className="w-5 h-5" />
            </Button>
            
            <Button 
              variant="ghost" 
              size="sm"
              onClick={() => setShowControls(!showControls)}
              className="text-muted-foreground hover:text-foreground transition-colors p-2"
              data-testid="button-more-mobile"
            >
              <MoreHorizontal className="w-5 h-5" />
            </Button>
          </div>
        </div>

        {/* Extended Controls (collapsible) */}
        {showControls && (
          <div className="px-4 pb-3 border-t border-border/30">
            <div className="flex items-center justify-between pt-3">
              {/* Time Display */}
              <div className="flex items-center space-x-2">
                <span className="text-xs text-muted-foreground font-mono" data-testid="text-current-time-mobile">
                  {formatDuration(currentTime)}
                </span>
                <span className="text-xs text-muted-foreground">/</span>
                <span className="text-xs text-muted-foreground font-mono" data-testid="text-duration-mobile">
                  {formatDuration(duration)}
                </span>
              </div>

              {/* Volume Control */}
              <div className="flex items-center space-x-3">
                <Volume2 className="w-4 h-4 text-muted-foreground" />
                <div className="w-20">
                  <Slider
                    value={volume}
                    onValueChange={handleVolumeChange}
                    max={100}
                    step={1}
                    className="cursor-pointer"
                    data-testid="slider-volume-mobile"
                  />
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
}