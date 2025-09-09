import { Play, Clock, Heart, MoreHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useMusicPlayer } from "@/hooks/use-music-player";
import type { LegacyTrack } from "@shared/schema";

interface SongsListViewProps {
  tracks: LegacyTrack[];
  onPlay: (track: LegacyTrack) => void;
}

export default function SongsListView({ tracks, onPlay }: SongsListViewProps) {
  const { currentSong, isPlaying } = useMusicPlayer();

  const formatDuration = (duration: number) => {
    const minutes = Math.floor(duration / 60);
    const seconds = duration % 60;
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const formatDateAdded = () => {
    return "6 days ago"; // Placeholder as per the design
  };

  return (
    <div className="bg-card rounded-lg border border-border overflow-hidden">
      {/* Header */}
      <div className="grid grid-cols-[auto_1fr_1fr_1fr_auto] gap-4 px-4 py-3 border-b border-border text-sm font-medium text-muted-foreground">
        <div className="w-8">#</div>
        <div>Title</div>
        <div>Album</div>
        <div>Date added</div>
        <div className="w-8">
          <Clock className="w-4 h-4" />
        </div>
      </div>

      {/* Track List */}
      <div className="divide-y divide-border">
        {tracks.map((track, index) => {
          const isCurrentTrack = currentSong?.id === track.id;
          
          return (
            <div
              key={track.id}
              className={`grid grid-cols-[auto_1fr_1fr_1fr_auto] gap-4 px-4 py-3 hover:bg-muted/50 transition-colors group ${
                isCurrentTrack ? 'bg-muted/30' : ''
              }`}
              data-testid={`track-row-${track.id}`}
            >
              {/* Track Number / Play Button */}
              <div className="w-8 flex items-center justify-center">
                <div className="relative">
                  <span className={`text-sm ${isCurrentTrack ? 'text-primary' : 'text-muted-foreground'} group-hover:hidden`}>
                    {index + 1}
                  </span>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="hidden group-hover:flex absolute -left-2 -top-2 w-8 h-8 p-0"
                    onClick={() => onPlay(track)}
                    data-testid={`button-play-${track.id}`}
                  >
                    <Play className="w-4 h-4" fill="currentColor" />
                  </Button>
                </div>
              </div>

              {/* Title & Artist */}
              <div className="flex items-center gap-3 min-w-0">
                {track.artwork ? (
                  <img 
                    src={track.artwork} 
                    alt={`${track.title} artwork`}
                    className="w-10 h-10 rounded object-cover flex-shrink-0"
                  />
                ) : (
                  <div className="w-10 h-10 rounded bg-muted flex items-center justify-center flex-shrink-0">
                    <Play className="w-4 h-4 text-muted-foreground" />
                  </div>
                )}
                <div className="min-w-0 flex-1">
                  <div className={`font-medium truncate ${isCurrentTrack ? 'text-primary' : 'text-foreground'}`}>
                    {track.title}
                  </div>
                  <div className="text-sm text-muted-foreground truncate">
                    {track.artist}
                  </div>
                </div>
              </div>

              {/* Album */}
              <div className="flex items-center text-sm text-muted-foreground truncate">
                {track.title} {/* Using title as album placeholder for now */}
              </div>

              {/* Date Added */}
              <div className="flex items-center text-sm text-muted-foreground">
                {formatDateAdded()}
              </div>

              {/* Duration & Actions */}
              <div className="flex items-center justify-end gap-2">
                {track.isFavorite && (
                  <Heart className="w-4 h-4 text-primary fill-current" />
                )}
                <span className="text-sm text-muted-foreground min-w-[40px] text-right">
                  {formatDuration(track.duration)}
                </span>
                <Button
                  variant="ghost"
                  size="sm"
                  className="w-8 h-8 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                  data-testid={`button-more-${track.id}`}
                >
                  <MoreHorizontal className="w-4 h-4" />
                </Button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}