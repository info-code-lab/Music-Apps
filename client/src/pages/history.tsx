import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Play, Clock, MoreHorizontal, Trash2 } from "lucide-react";
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
  const { playTrack } = useMusicPlayer();

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

  const HistoryItem = ({ entry }: { entry: HistoryEntry }) => {
    // Add safety check for entry.song
    if (!entry.song) {
      return null; // Skip rendering if song data is missing
    }

    return (
      <div className="flex items-center space-x-4 p-4 hover:bg-accent/50 rounded-lg transition-colors group">
        {/* Album Art */}
        <div className="relative flex-shrink-0">
          <div className="w-12 h-12 bg-muted rounded-lg overflow-hidden">
            {entry.song?.coverArt ? (
              <img 
                src={entry.song.coverArt} 
                alt={entry.song.title || 'Song'}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full bg-muted flex items-center justify-center">
                <Clock className="w-6 h-6 text-muted-foreground" />
              </div>
            )}
          </div>
          <Button
            size="sm"
            variant="secondary"
            className="absolute inset-0 opacity-0 group-hover:opacity-100 bg-black/50 hover:bg-black/60 transition-opacity"
            onClick={() => handlePlaySong(entry.song)}
            data-testid={`button-play-history-${entry.id}`}
          >
            <Play className="w-4 h-4" />
          </Button>
        </div>

        {/* Song Info */}
        <div className="flex-1 min-w-0">
          <h3 className="font-medium text-foreground truncate">{entry.song?.title || 'Unknown Song'}</h3>
          <p className="text-sm text-muted-foreground truncate">
            Unknown Artist
            {entry.song?.duration && (
              <>
                <span className="mx-1">•</span>
                {formatDuration(entry.song.duration)}
              </>
            )}
          </p>
        </div>

        {/* Play Time */}
        <div className="text-sm text-muted-foreground text-right">
          <p className="whitespace-nowrap">
            {entry.playedAt ? formatDistanceToNow(new Date(entry.playedAt), { addSuffix: true }) : 'Unknown time'}
          </p>
          {entry.device && (
            <p className="text-xs text-muted-foreground/70 capitalize">
              {entry.device}
            </p>
          )}
        </div>

        {/* Actions */}
        <Button variant="ghost" size="sm" className="opacity-0 group-hover:opacity-100 transition-opacity">
          <MoreHorizontal className="w-4 h-4" />
        </Button>
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
            <div className="space-y-4">
              {Array.from({ length: 10 }).map((_, i) => (
                <div key={i} className="flex items-center space-x-4 p-4">
                  <div className="w-12 h-12 bg-muted rounded-lg animate-pulse" />
                  <div className="flex-1 space-y-2">
                    <div className="h-4 bg-muted rounded w-1/3 animate-pulse" />
                    <div className="h-3 bg-muted rounded w-1/4 animate-pulse" />
                  </div>
                  <div className="h-3 bg-muted rounded w-16 animate-pulse" />
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
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-2xl md:text-3xl font-bold text-foreground font-sans">
              Listening History
            </h1>
            <Button 
              variant="ghost" 
              className="text-muted-foreground hover:text-foreground"
              data-testid="button-clear-history"
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Clear History
            </Button>
          </div>

          {/* Stats */}
          <div className="flex items-center space-x-6 mb-8 text-sm text-muted-foreground">
            <span>{history.length} songs played</span>
            {history.length > 0 && history[0]?.playedAt && (
              <>
                <span>•</span>
                <span>
                  Last played {formatDistanceToNow(new Date(history[0].playedAt), { addSuffix: true })}
                </span>
              </>
            )}
          </div>

          {/* History List */}
          <div className="space-y-1">
            {history.length === 0 ? (
              <div className="text-center py-12">
                <Clock className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium text-foreground mb-2">No listening history yet</h3>
                <p className="text-muted-foreground mb-6">
                  Start playing some music to see your listening history here!
                </p>
                <Button 
                  onClick={() => window.history.back()}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white"
                >
                  Explore Music
                </Button>
              </div>
            ) : (
              history.map((entry) => (
                <HistoryItem key={`${entry.songId}-${entry.playedAt}`} entry={entry} />
              ))
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