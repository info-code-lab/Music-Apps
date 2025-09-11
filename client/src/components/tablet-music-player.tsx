import { useState, useRef, useEffect } from "react";
import { 
  Play, 
  Pause, 
  SkipBack, 
  SkipForward, 
  Shuffle, 
  Repeat, 
  Heart,
  Volume2,
  Expand,
  Wifi
} from "lucide-react";
import Marquee from "react-fast-marquee";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { useSharedAudioPlayer } from "@/hooks/use-shared-audio-player";
import { useMusicPlayer } from "@/hooks/use-music-player";
import { formatDuration } from "@/lib/audio-utils";
import type { LegacyTrack as Track } from "@shared/schema";

interface TabletMusicPlayerProps {
  song: Track;
  isPlaying: boolean;
  onPlayPause: () => void;
  onNext: () => void;
  onPrevious: () => void;
}

interface SongTitleMarqueeProps {
  title: string;
  testId: string;
}

function SongTitleMarquee({ title, testId }: SongTitleMarqueeProps) {
  const [shouldMarquee, setShouldMarquee] = useState(false);
  const textRef = useRef<HTMLParagraphElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const checkOverflow = () => {
      if (textRef.current && containerRef.current) {
        const textWidth = textRef.current.scrollWidth;
        const containerWidth = containerRef.current.clientWidth;
        setShouldMarquee(textWidth > containerWidth);
      }
    };

    checkOverflow();
    window.addEventListener('resize', checkOverflow);
    return () => window.removeEventListener('resize', checkOverflow);
  }, [title]);

  return (
    <div ref={containerRef} className="flex-1 min-w-0" data-testid={testId}>
      {shouldMarquee ? (
        <Marquee
          speed={30}
          gradient={false}
          pauseOnHover={true}
          play={true}
        >
          <p className="text-sm font-semibold text-foreground font-sans pr-4">
            {title}
          </p>
        </Marquee>
      ) : (
        <p 
          ref={textRef}
          className="text-sm font-semibold text-foreground font-sans truncate"
        >
          {title}
        </p>
      )}
    </div>
  );
}

export default function TabletMusicPlayer({ 
  song, 
  isPlaying, 
  onPlayPause, 
  onNext, 
  onPrevious 
}: TabletMusicPlayerProps) {
  const { isShuffle, isRepeat, toggleShuffle, toggleRepeat } = useMusicPlayer();
  const [volume, setVolume] = useState([70]);
  const [isMuted, setIsMuted] = useState(false);
  
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
    <div className="fixed bottom-16 lg:bottom-0 left-0 right-0 bg-card border-t border-border p-3 z-20 ">
      <div className="max-w-full mx-auto">
        {/* Progress Bar - Full width at top for better visibility */}
        <div className="mb-3">
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

        {/* Main player layout - simplified for tablet */}
        <div className="flex items-center space-x-3">
          {/* Currently Playing Info - Compact */}
          <div className="flex items-center space-x-3 min-w-0 flex-1">
            <img 
              src={song.artwork || 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?ixlib=rb-4.0.3&auto=format&fit=crop&w=60&h=60'} 
              alt={song.title}
              className="w-10 h-10 rounded object-cover" 
            />
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <SongTitleMarquee title={song.title} testId="text-current-title" />
                {isPlayingOffline && (
                  <div className="bg-green-600 text-white px-1 py-0.5 rounded text-xs flex items-center gap-1">
                    <Wifi className="w-2.5 h-2.5" />
                  </div>
                )}
              </div>
              <p className="text-xs text-muted-foreground font-serif truncate" data-testid="text-current-artist">
                {song.artist}
              </p>
            </div>
          </div>

          {/* Core Player Controls - Compact spacing */}
          <div className="flex items-center space-x-2">
            <Button 
              variant="ghost" 
              size="sm"
              onClick={toggleShuffle}
              className={`transition-colors p-1.5 ${isShuffle ? 'text-primary' : 'text-muted-foreground hover:text-foreground'}`}
              data-testid="button-shuffle"
            >
              <Shuffle className="w-4 h-4" />
            </Button>
            <Button 
              variant="ghost" 
              size="sm"
              onClick={onPrevious}
              className="text-muted-foreground hover:text-foreground transition-colors p-1.5"
              data-testid="button-previous"
            >
              <SkipBack className="w-4 h-4" />
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
              className="text-muted-foreground hover:text-foreground transition-colors p-1.5"
              data-testid="button-next"
            >
              <SkipForward className="w-4 h-4" />
            </Button>
            <Button 
              variant="ghost" 
              size="sm"
              onClick={toggleRepeat}
              className={`transition-colors p-1.5 ${isRepeat ? 'text-primary' : 'text-muted-foreground hover:text-foreground'}`}
              data-testid="button-repeat"
            >
              <Repeat className="w-4 h-4" />
            </Button>
          </div>

          {/* Right Actions - Simplified */}
          <div className="flex items-center space-x-2">
            <Button 
              variant="ghost" 
              size="sm" 
              className="text-muted-foreground hover:text-foreground transition-colors p-1.5"
              data-testid="button-favorite-current"
            >
              <Heart className={`w-4 h-4 ${song.isFavorite ? 'fill-current text-destructive' : ''}`} />
            </Button>
            <Button 
              variant="ghost" 
              size="sm"
              onClick={handleMuteToggle}
              className="text-muted-foreground hover:text-foreground transition-colors p-1.5"
              data-testid="button-volume"
            >
              <Volume2 className="w-4 h-4" />
            </Button>
            {/* Compact volume slider */}
            <div className="w-12">
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
              className="text-muted-foreground hover:text-foreground transition-colors p-1.5"
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