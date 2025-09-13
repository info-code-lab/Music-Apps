import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Play, Pause, Clock, MoreHorizontal, Trash2, Heart } from "lucide-react";
import { useMusicPlayer } from "@/hooks/use-music-player";
import { formatDuration } from "@/lib/audio-utils";
import { formatDistanceToNow } from "date-fns";
import type { Song } from "@shared/schema";

interface HistoryEntry {
  id: string;
  userId: string;
  songId: string;
  device?: string;
  ipAddress?: string;
  playedAt: string;
  song: Song;
}

interface LegacyTrack {
  id: string;
  title: string;
  artist: string;
  category: string;
  duration: number;
  url: string;
  artwork?: string;
  isFavorite: boolean;
  uploadType: string;
  createdAt?: Date;
}

export default function History() {
  const { playTrack, currentSong, isPlaying, togglePlayPause } = useMusicPlayer();

  // Fetch listening history
  const { data: history = [], isLoading, error } = useQuery<HistoryEntry[]>({
    queryKey: ["/api/history"]
  });

  const convertToLegacyTrack = (song: Song): LegacyTrack => ({
    id: song.id,
    title: song.title,
    artist: "Unknown Artist", // Will be enhanced later with actual artist data
    category: "Music",
    duration: song.duration,
    url: song.filePath ? encodeURI(song.filePath) : "",
    artwork: song.coverArt || undefined,
    isFavorite: false,
    uploadType: "file",
    createdAt: song.createdAt || undefined,
  });

  const handlePlaySong = (song: Song) => {
    const track = convertToLegacyTrack(song);
    playTrack(track, true);
  };

  // Music Visualizer Component
  const MusicVisualizer = ({ isCurrentlyPlaying }: { isCurrentlyPlaying: boolean }) => {
    return (
      <div className="flex items-center space-x-0.5 h-4">
        {[...Array(4)].map((_, i) => (
          <div
            key={i}
            className={`w-0.5 bg-emerald-500 rounded-full transition-all duration-200 ${
              isCurrentlyPlaying 
                ? 'animate-pulse h-3 opacity-100' 
                : 'h-1 opacity-60'
            }`}
            style={{
              animationDelay: isCurrentlyPlaying ? `${i * 150}ms` : '0ms',
              animationDuration: isCurrentlyPlaying ? '600ms' : '0ms'
            }}
          />
        ))}
      </div>
    );
  };

  const HistoryItem = ({ entry, index }: { entry: HistoryEntry; index: number }) => {
    // Add safety check for entry.song
    if (!entry.song) {
      return null; // Skip rendering if song data is missing
    }

    // Check if this song is currently playing
    const isCurrentlyPlaying = currentSong?.id === entry.song.id && isPlaying;

    return (
      <div className="flex items-center py-2 px-4 hover:bg-accent/30 group transition-colors">
        {/* Number or Music Visualizer */}
        <div className="w-8 text-center text-sm text-muted-foreground font-medium flex items-center justify-center">
          {isCurrentlyPlaying ? (
            <MusicVisualizer isCurrentlyPlaying={true} />
          ) : (
            <span>{index + 1}</span>
          )}
        </div>

        {/* Cover Art with Play Button */}
        <div className="relative ml-4 mr-4 flex-shrink-0">
          <div className="w-10 h-10 rounded overflow-hidden bg-muted">
            {entry.song?.coverArt ? (
              <img 
                src={entry.song.coverArt} 
                alt={entry.song.title || 'Song'}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-slate-600 to-slate-800 flex items-center justify-center">
                <div className="w-6 h-6 bg-white/20 rounded-full flex items-center justify-center">
                  <div className="w-2 h-2 bg-white rounded-full"></div>
                </div>
              </div>
            )}
            
            {/* Music Visualizer GIF Overlay when playing */}
            {isCurrentlyPlaying && (
              <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                <img 
                  src={musicVisualizerGif}
                  alt="Music playing"
                  className="w-6 h-6 object-contain"
                />
              </div>
            )}
          </div>
          
          {/* Play/Pause Button */}
          <Button
            size="sm"
            variant="ghost"
            className="absolute inset-0 w-10 h-10 rounded bg-black/50 hover:bg-black/60 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
            onClick={() => isCurrentlyPlaying ? togglePlayPause() : handlePlaySong(entry.song)}
            data-testid={`button-play-history-${entry.id}`}
          >
            {isCurrentlyPlaying ? (
              <Pause className="w-3 h-3 fill-current text-white" />
            ) : (
              <Play className="w-3 h-3 fill-current text-white" />
            )}
          </Button>
        </div>

        {/* Song Info */}
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-foreground truncate text-base">
            {entry.song?.title || 'Unknown Song'}
          </h3>
          <p className="text-sm text-muted-foreground truncate">
            Unknown Artist
          </p>
        </div>

        {/* Category */}
        <div className="hidden md:block text-sm text-muted-foreground mr-8">
          Music
        </div>

        {/* Actions */}
        <div className="flex items-center space-x-2">
          <Button variant="ghost" size="sm" className="opacity-0 group-hover:opacity-100 transition-opacity w-8 h-8 p-0">
            <Heart className="w-4 h-4" />
          </Button>
          <Button variant="ghost" size="sm" className="opacity-0 group-hover:opacity-100 transition-opacity w-8 h-8 p-0">
            <MoreHorizontal className="w-4 h-4" />
          </Button>
        </div>

        {/* Duration */}
        <div className="text-sm text-muted-foreground w-12 text-right ml-4">
          {entry.song?.duration ? formatDuration(entry.song.duration) : '--'}
        </div>
      </div>
    );
  };

  if (isLoading) {
    return (
      <div className="h-full">
        <main className="h-full">
          <div className="p-4 md:p-6">
            <div className="flex items-center justify-between mb-6">
              <h1 className="text-2xl md:text-3xl font-bold text-foreground font-sans">
                Listening History
              </h1>
            </div>
            
            {/* Loading skeleton */}
            <div className="bg-card rounded-lg border">
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="flex items-center py-2 px-4">
                  <div className="w-8 h-4 bg-muted rounded animate-pulse mr-4" />
                  <div className="w-10 h-10 bg-muted rounded-full animate-pulse mr-4" />
                  <div className="flex-1 space-y-2">
                    <div className="h-4 bg-muted rounded w-2/3 animate-pulse" />
                    <div className="h-3 bg-muted rounded w-1/3 animate-pulse" />
                  </div>
                  <div className="hidden md:block w-16 h-3 bg-muted rounded animate-pulse mr-8" />
                  <div className="w-8 h-8 bg-muted rounded animate-pulse mr-2" />
                  <div className="w-8 h-8 bg-muted rounded animate-pulse mr-4" />
                  <div className="w-12 h-3 bg-muted rounded animate-pulse" />
                </div>
              ))}
            </div>
          </div>
        </main>
      </div>
    );
  }

  if (error) {
    return (
      <div className="h-full">
        <main className="h-full">
          <div className="p-4 md:p-6">
            <div className="flex items-center justify-between mb-6">
              <h1 className="text-2xl md:text-3xl font-bold text-foreground font-sans">
                Listening History
              </h1>
            </div>
            
            <div className="text-center py-12">
              <Clock className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium text-foreground mb-2">
                {error.message === "Authentication required" ? "Please log in to view your history" : "Unable to load history"}
              </h3>
              <p className="text-muted-foreground mb-6">
                {error.message === "Authentication required" 
                  ? "You need to be logged in to see your listening history." 
                  : "Something went wrong while loading your listening history. Please try again."}
              </p>
              <Button 
                onClick={() => window.location.reload()}
                className="bg-emerald-600 hover:bg-emerald-700 text-white"
              >
                {error.message === "Authentication required" ? "Go to Login" : "Try Again"}
              </Button>
            </div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="h-full">
      <main className="h-full">
        <div className="p-4 md:p-6">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-2xl font-bold text-foreground mb-2">
              Recently Played
            </h1>
            <div className="h-0.5 w-24 bg-foreground"></div>
          </div>

          {/* History List */}
          <div>
            {history.length === 0 ? (
              <div className="text-center py-16">
                <Clock className="w-16 h-16 text-muted-foreground mx-auto mb-6" />
                <h3 className="text-xl font-medium text-foreground mb-3">No listening history yet</h3>
                <p className="text-muted-foreground mb-8 max-w-md mx-auto">
                  Start playing some music to see your recently played songs here!
                </p>
                <Button 
                  onClick={() => window.history.back()}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-3"
                >
                  Explore Music
                </Button>
              </div>
            ) : (
              <div className="bg-card rounded-lg border">
                {history.map((entry, index) => (
                  <HistoryItem key={`${entry.songId}-${entry.playedAt}`} entry={entry} index={index} />
                ))}
              </div>
            )}
          </div>

          {/* Load More - for future enhancement */}
          {history.length > 0 && history.length >= 50 && (
            <div className="text-center py-6">
              <Button variant="outline" data-testid="button-load-more">
                Load More History
              </Button>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}