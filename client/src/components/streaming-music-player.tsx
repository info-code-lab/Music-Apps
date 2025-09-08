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
  Settings,
  Wifi,
  WifiOff,
  Loader2,
  BarChart3
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel
} from "@/components/ui/dropdown-menu";
import { useStreamingPlayer } from "@/hooks/use-streaming-player";
import { formatDuration } from "@/lib/audio-utils";
import type { Song } from "@shared/schema";

interface StreamingMusicPlayerProps {
  song: Song;
  isPlaying: boolean;
  onPlayPause: () => void;
  onNext: () => void;
  onPrevious: () => void;
  onQueueToggle?: () => void;
  className?: string;
}

export default function StreamingMusicPlayer({ 
  song, 
  isPlaying, 
  onPlayPause, 
  onNext, 
  onPrevious,
  onQueueToggle,
  className = ""
}: StreamingMusicPlayerProps) {
  const [isShuffle, setIsShuffle] = useState(false);
  const [isRepeat, setIsRepeat] = useState(false);
  const [volume, setVolume] = useState([70]);
  const [isMuted, setIsMuted] = useState(false);
  const [showStats, setShowStats] = useState(false);
  const [enableHLS, setEnableHLS] = useState(true);
  
  const {
    currentTime,
    duration,
    progress,
    isLoading,
    bufferProgress,
    isLive,
    networkState,
    playbackQuality,
    availableQualities,
    setQuality,
    seek,
    setVolumeLevel,
    getStreamingStats,
  } = useStreamingPlayer(
    song.hlsManifestUrl || song.filePath, 
    isPlaying, 
    song.id,
    {
      enableHLS,
      autoPlay: false,
      preferredQuality: 'aac_320',
      adaptiveBitrate: true
    }
  );

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

  const streamingStats = getStreamingStats();

  return (
    <div className={`fixed bottom-0 md:bottom-0 left-0 right-0 bg-card border-t border-border p-4 z-20 mb-16 md:mb-0 ${className}`}>
      <div className="max-w-full mx-auto">
        {/* Progress Bar with Buffer Indication */}
        <div className="w-full mb-4">
          <div className="relative">
            <Slider
              value={[progress * 100]}
              onValueChange={handleSeek}
              max={100}
              step={0.1}
              className="cursor-pointer"
              data-testid="slider-progress-streaming"
            />
            {/* Buffer Progress Indicator */}
            <div 
              className="absolute top-1/2 left-0 h-1 bg-muted-foreground/30 rounded -translate-y-1/2 pointer-events-none"
              style={{ width: `${bufferProgress * 100}%` }}
            />
          </div>
          <div className="flex justify-between text-xs text-muted-foreground mt-1">
            <span data-testid="text-current-time-streaming">
              {formatDuration(currentTime)}
            </span>
            <div className="flex items-center gap-2">
              {isLive && <Badge variant="destructive">LIVE</Badge>}
              {networkState === 'buffering' && (
                <div className="flex items-center gap-1">
                  <Loader2 className="h-3 w-3 animate-spin" />
                  <span>Buffering</span>
                </div>
              )}
              <Badge variant="outline">{playbackQuality}</Badge>
            </div>
            <span data-testid="text-duration-streaming">
              {isLive ? 'LIVE' : formatDuration(duration)}
            </span>
          </div>
        </div>

        <div className="flex items-center space-x-4">
          {/* Currently Playing Info */}
          <div className="flex items-center space-x-3 min-w-0 flex-1">
            <img 
              src={song.coverArt || 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?ixlib=rb-4.0.3&auto=format&fit=crop&w=60&h=60'} 
              alt={song.title}
              className="w-12 h-12 rounded object-cover" 
            />
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <p className="font-medium truncate" data-testid="text-song-title">
                  {song.title}
                </p>
                {song.hlsManifestUrl && <Wifi className="h-4 w-4 text-blue-500" />}
                {!song.hlsManifestUrl && <WifiOff className="h-4 w-4 text-muted-foreground" />}
              </div>
              <p className="text-sm text-muted-foreground truncate" data-testid="text-song-artist">
                Artist • {song.albumId || 'Single'}
              </p>
            </div>
          </div>

          {/* Player Controls */}
          <div className="flex items-center space-x-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsShuffle(!isShuffle)}
              className={isShuffle ? "text-blue-500" : ""}
              data-testid="button-shuffle"
            >
              <Shuffle className="h-4 w-4" />
            </Button>
            
            <Button
              variant="ghost"
              size="sm"
              onClick={onPrevious}
              data-testid="button-previous"
            >
              <SkipBack className="h-4 w-4" />
            </Button>
            
            <Button
              variant="ghost"
              size="lg"
              onClick={onPlayPause}
              disabled={isLoading}
              className="h-10 w-10"
              data-testid="button-play-pause-streaming"
            >
              {isLoading ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : isPlaying ? (
                <Pause className="h-5 w-5" />
              ) : (
                <Play className="h-5 w-5" />
              )}
            </Button>
            
            <Button
              variant="ghost"
              size="sm"
              onClick={onNext}
              data-testid="button-next"
            >
              <SkipForward className="h-4 w-4" />
            </Button>
            
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsRepeat(!isRepeat)}
              className={isRepeat ? "text-blue-500" : ""}
              data-testid="button-repeat"
            >
              <Repeat className="h-4 w-4" />
            </Button>
          </div>

          {/* Right Controls */}
          <div className="flex items-center space-x-2">
            <Button variant="ghost" size="sm" data-testid="button-favorite">
              <Heart className="h-4 w-4" />
            </Button>
            
            {onQueueToggle && (
              <Button variant="ghost" size="sm" onClick={onQueueToggle} data-testid="button-queue">
                <List className="h-4 w-4" />
              </Button>
            )}

            {/* Volume Control */}
            <div className="flex items-center space-x-2 w-24">
              <Button
                variant="ghost"
                size="sm"
                onClick={handleMuteToggle}
                data-testid="button-volume"
              >
                <Volume2 className="h-4 w-4" />
              </Button>
              <Slider
                value={volume}
                onValueChange={handleVolumeChange}
                max={100}
                step={1}
                className="w-16"
                data-testid="slider-volume-streaming"
              />
            </div>

            {/* Quality & Settings */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" data-testid="button-settings">
                  <Settings className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel>Audio Quality</DropdownMenuLabel>
                {availableQualities.map((quality) => (
                  <DropdownMenuItem
                    key={quality}
                    onClick={() => setQuality(quality)}
                    className={playbackQuality === quality ? "bg-accent" : ""}
                  >
                    {quality} {playbackQuality === quality && "✓"}
                  </DropdownMenuItem>
                ))}
                
                <DropdownMenuSeparator />
                <DropdownMenuLabel>Streaming Options</DropdownMenuLabel>
                <DropdownMenuItem onClick={() => setEnableHLS(!enableHLS)}>
                  HLS Streaming {enableHLS ? "✓" : ""}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setShowStats(!showStats)}>
                  Show Stats {showStats ? "✓" : ""}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            {showStats && streamingStats && (
              <Button variant="ghost" size="sm" data-testid="button-stats">
                <BarChart3 className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>

        {/* Streaming Stats Panel */}
        {showStats && streamingStats && (
          <div className="mt-4 p-3 bg-muted rounded-lg">
            <div className="grid grid-cols-3 gap-4 text-sm">
              <div>
                <span className="text-muted-foreground">Bandwidth:</span>
                <span className="ml-1 font-mono">
                  {Math.round(streamingStats.bandwidth / 1000)}kbps
                </span>
              </div>
              <div>
                <span className="text-muted-foreground">Buffer:</span>
                <span className="ml-1 font-mono">
                  {streamingStats.bufferLength.toFixed(1)}s
                </span>
              </div>
              <div>
                <span className="text-muted-foreground">Level:</span>
                <span className="ml-1 font-mono">
                  {streamingStats.level}/{streamingStats.loadLevel}
                </span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}