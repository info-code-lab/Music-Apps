import { useState, useRef, useEffect } from "react";
import { 
  Play, 
  Pause, 
  SkipBack, 
  SkipForward, 
  Heart,
  Volume2,
  ChevronUp,
  ChevronDown,
  Plus,
  Shuffle,
  Repeat,
  Wifi
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { useSharedAudioPlayer } from "@/hooks/use-shared-audio-player";
import { useMusicPlayer } from "@/hooks/use-music-player";
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
  const { isShuffle, isRepeat, toggleShuffle, toggleRepeat } = useMusicPlayer();
  const [volume, setVolume] = useState([70]);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [startY, setStartY] = useState(0);
  const [currentY, setCurrentY] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const playerRef = useRef<HTMLDivElement>(null);
  
  const {
    currentTime,
    duration,
    progress,
    isLoading,
    isPlayingOffline,
    seek,
    setVolumeLevel
  } = useSharedAudioPlayer(song.url, isPlaying, song.id);

  const handleVolumeChange = (newVolume: number[]) => {
    setVolume(newVolume);
    setVolumeLevel(newVolume[0] / 100);
  };

  const handleSeek = (newProgress: number[]) => {
    seek(newProgress[0] / 100);
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    setStartY(e.touches[0].clientY);
    setCurrentY(e.touches[0].clientY);
    setIsDragging(true);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging) return;
    setCurrentY(e.touches[0].clientY);
  };

  const handleTouchEnd = () => {
    if (!isDragging) return;
    
    const deltaY = currentY - startY;
    const threshold = 50; // Minimum swipe distance
    
    if (deltaY > threshold) {
      // Swiped down - collapse player
      setIsCollapsed(true);
    } else if (deltaY < -threshold) {
      // Swiped up - expand player
      setIsCollapsed(false);
    }
    
    setIsDragging(false);
    setStartY(0);
    setCurrentY(0);
  };

  const toggleCollapse = () => {
    setIsCollapsed(!isCollapsed);
  };

  return (
    <>
      {/* Collapsed Player Indicator */}
      {isCollapsed && (
        <div 
          className="fixed left-1/2 transform -translate-x-1/2 bg-primary text-primary-foreground px-4 py-2 rounded-t-lg shadow-lg cursor-pointer z-40"
          style={{ bottom: '3.9rem' }}
          onClick={toggleCollapse}
          data-testid="collapsed-player-indicator"
        >
          <div className="flex items-center space-x-2">
            <img 
              src={song.artwork || 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?ixlib=rb-4.0.3&auto=format&fit=crop&w=24&h=24'} 
              alt={song.title}
              className="w-6 h-6 rounded object-cover" 
            />
            <span className="text-xs font-medium truncate max-w-32">
              {song.title}
            </span>
            <ChevronUp className="w-4 h-4" />
          </div>
        </div>
      )}

      {/* Compact Bottom Bar */}
      <div 
        ref={playerRef}
        className={`fixed left-0 right-0 bg-card border-t border-border z-30 transition-transform duration-300 ease-out ${
          isCollapsed ? 'translate-y-full' : 'translate-y-0'
        }`}
        style={{ bottom: '3.9rem' }}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        {/* Collapse/Expand Handle */}
        <div className="flex justify-center py-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={toggleCollapse}
            className="p-1 h-6 w-8 text-muted-foreground hover:text-foreground"
            data-testid="button-toggle-player"
          >
            {isCollapsed ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </Button>
        </div>

        {/* Progress Bar with Time Display */}
        <div className="px-4 py-3">
          <div className="flex items-center space-x-3">
            <span className="text-xs text-muted-foreground font-mono min-w-[35px]" data-testid="text-current-time-mobile">
              {formatDuration(currentTime)}
            </span>
            <div className="flex-1 relative">
              <Slider
                value={[progress * 100]}
                onValueChange={handleSeek}
                max={100}
                step={0.1}
                className="cursor-pointer"
                data-testid="slider-progress-mobile"
              />
            </div>
            <span className="text-xs text-muted-foreground font-mono min-w-[35px]" data-testid="text-duration-mobile">
              {formatDuration(duration)}
            </span>
          </div>
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
              onClick={toggleShuffle}
              className={`transition-colors p-2 ${isShuffle ? 'text-primary' : 'text-muted-foreground hover:text-foreground'}`}
              data-testid="button-shuffle-mobile"
            >
              <Shuffle className="w-4 h-4" />
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
              onClick={toggleRepeat}
              className={`transition-colors p-2 ${isRepeat ? 'text-primary' : 'text-muted-foreground hover:text-foreground'}`}
              data-testid="button-repeat-mobile"
            >
              <Repeat className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>
    </>
  );
}