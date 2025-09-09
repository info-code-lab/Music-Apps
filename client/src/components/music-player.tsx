import { useState, useRef, useEffect } from "react";
import { 
  Play, 
  Pause, 
  SkipBack, 
  SkipForward, 
  Shuffle, 
  Repeat, 
  Heart,
  List,
  Volume2,
  Expand,
  Wifi
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { useSharedAudioPlayer } from "@/hooks/use-shared-audio-player";
import { useMusicPlayer } from "@/hooks/use-music-player";
import { formatDuration, decodeHtmlEntities } from "@/lib/audio-utils";
import type { LegacyTrack as Track } from "@shared/schema";

interface MusicPlayerProps {
  song: Track;
  isPlaying: boolean;
  onPlayPause: () => void;
  onNext: () => void;
  onPrevious: () => void;
}

export default function MusicPlayer({ 
  song, 
  isPlaying, 
  onPlayPause, 
  onNext, 
  onPrevious 
}: MusicPlayerProps) {
  const { isShuffle, isRepeat, toggleShuffle, toggleRepeat } = useMusicPlayer();
  const [volume, setVolume] = useState([70]);
  const [isMuted, setIsMuted] = useState(false);
  
  console.log("MusicPlayer component - isPlaying prop:", isPlaying, "song.url:", song.url);
  
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
    setIsMuted(newVolume[0] === 0);
  };

  const handleMuteToggle = () => {
    if (isMuted) {
      setVolume([70]);
      setVolumeLevel(0.7);
      setIsMuted(false);
    } else {
      setVolume([0]);
      setVolumeLevel(0);
      setIsMuted(true);
    }
  };

  const handleSeek = (newProgress: number[]) => {
    seek(newProgress[0] / 100);
  };

  return (
    <div className="fixed bottom-0 md:bottom-0 left-0 right-0 bg-card border-t border-border p-4 z-20 mb-16 md:mb-0">
      <div className="max-w-full mx-auto">
        <div className="flex items-center space-x-4">
          {/* Currently Playing Info */}
          <div className="flex items-center space-x-3 min-w-0 flex-1">
            <img 
              src={song.artwork || 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?ixlib=rb-4.0.3&auto=format&fit=crop&w=60&h=60'} 
              alt={song.title}
              className="w-12 h-12 rounded object-cover" 
            />
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <p className="text-sm font-semibold text-foreground font-sans truncate" data-testid="text-current-title">
                  {decodeHtmlEntities(song.title)}
                </p>
                {isPlayingOffline && (
                  <div className="bg-green-600 text-white px-1.5 py-0.5 rounded text-xs flex items-center gap-1">
                    <Wifi className="w-3 h-3" />
                    Offline
                  </div>
                )}
              </div>
              <p className="text-xs text-muted-foreground font-serif truncate" data-testid="text-current-artist">
                {song.artist}
              </p>
            </div>
            <Button 
              variant="ghost" 
              size="sm" 
              className="text-muted-foreground hover:text-foreground transition-colors"
              data-testid="button-favorite-current"
            >
              <Heart className={`w-4 h-4 ${song.isFavorite ? 'fill-current text-destructive' : ''}`} />
            </Button>
          </div>

          {/* Player Controls */}
          <div className="flex flex-col items-center flex-1 max-w-lg">
            <div className="flex items-center space-x-4 mb-2 player-controls">
              <Button 
                variant="ghost" 
                size="sm"
                onClick={toggleShuffle}
                className={`transition-colors ${isShuffle ? 'text-primary' : 'text-muted-foreground hover:text-foreground'}`}
                data-testid="button-shuffle"
              >
                <Shuffle className="w-4 h-4" />
              </Button>
              <Button 
                variant="ghost" 
                size="sm"
                onClick={onPrevious}
                className="text-muted-foreground hover:text-foreground transition-colors"
                data-testid="button-previous"
              >
                <SkipBack className="w-5 h-5" />
              </Button>
              <Button 
                size="sm"
                onClick={onPlayPause}
                disabled={isLoading}
                className="w-8 h-8 bg-primary text-primary-foreground rounded-full hover:opacity-90 transition-opacity"
                data-testid="button-play-pause"
              >
                {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 ml-0.5" />}
              </Button>
              <Button 
                variant="ghost" 
                size="sm"
                onClick={onNext}
                className="text-muted-foreground hover:text-foreground transition-colors"
                data-testid="button-next"
              >
                <SkipForward className="w-5 h-5" />
              </Button>
              <Button 
                variant="ghost" 
                size="sm"
                onClick={toggleRepeat}
                className={`transition-colors ${isRepeat ? 'text-primary' : 'text-muted-foreground hover:text-foreground'}`}
                data-testid="button-repeat"
              >
                <Repeat className="w-4 h-4" />
              </Button>
            </div>

            {/* Progress Bar */}
            <div className="flex items-center space-x-2 w-full">
              <span className="text-xs text-muted-foreground font-mono min-w-[35px]" data-testid="text-current-time">
                {formatDuration(currentTime)}
              </span>
              <div className="flex-1">
                <Slider
                  value={[progress * 100]}
                  onValueChange={handleSeek}
                  max={100}
                  step={0.1}
                  className="cursor-pointer"
                  data-testid="slider-progress"
                />
              </div>
              <span className="text-xs text-muted-foreground font-mono min-w-[35px]" data-testid="text-duration">
                {formatDuration(duration)}
              </span>
            </div>
          </div>

          {/* Volume and Actions */}
          <div className="flex items-center space-x-3 min-w-0 flex-1 justify-end">
            {/* Audio Waveform Visualization */}
            <div className="hidden sm:flex items-center space-x-1">
              {[1, 2, 3, 4, 5].map((i) => (
                <div 
                  key={i}
                  className={`w-1 bg-primary rounded-full waveform-bar ${isPlaying ? 'animate-waveform' : 'h-1'}`}
                  style={{ animationDelay: `${i * 0.1}s` }}
                />
              ))}
            </div>

            <Button 
              variant="ghost" 
              size="sm"
              className="text-muted-foreground hover:text-foreground transition-colors"
              data-testid="button-queue"
            >
              <List className="w-4 h-4" />
            </Button>
            <Button 
              variant="ghost" 
              size="sm"
              onClick={handleMuteToggle}
              className="text-muted-foreground hover:text-foreground transition-colors"
              data-testid="button-volume"
            >
              <Volume2 className="w-4 h-4" />
            </Button>
            <div className="w-20 hidden sm:block">
              <Slider
                value={volume}
                onValueChange={handleVolumeChange}
                max={100}
                step={1}
                className="cursor-pointer"
                data-testid="slider-volume"
              />
            </div>
            <Button 
              variant="ghost" 
              size="sm"
              className="text-muted-foreground hover:text-foreground transition-colors"
              data-testid="button-expand"
            >
              <Expand className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
