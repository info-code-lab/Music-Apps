import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Play, Pause, X } from "lucide-react";
import { formatDuration } from "@/lib/audio-utils";
import { useMusicPlayer } from "@/hooks/use-music-player";
import type { LegacyTrack as Track } from "@shared/schema";

interface QueueModalProps {
  isOpen: boolean;
  onClose: () => void;
  tracks: Track[];
  currentSong: Track | null;
  isPlaying: boolean;
}

export default function QueueModal({
  isOpen,
  onClose,
  tracks,
  currentSong,
  isPlaying,
}: QueueModalProps) {
  const { playTrack } = useMusicPlayer();

  const handleTrackClick = (track: Track) => {
    playTrack(track, true);
  };

  const formatDateAdded = (dateString: string) => {
    try {
      const date = new Date(dateString);
      const now = new Date();
      const diffTime = Math.abs(now.getTime() - date.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      
      if (diffDays === 1) return "Today";
      if (diffDays === 2) return "Yesterday";
      if (diffDays <= 7) return `${diffDays - 1} days ago`;
      if (diffDays <= 30) return `${Math.floor((diffDays - 1) / 7)} weeks ago`;
      
      return date.toLocaleDateString();
    } catch {
      return "Unknown";
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl h-[80vh] flex flex-col p-0">
        <DialogHeader className="flex flex-row items-center justify-between p-6 pb-4 border-b">
          <DialogTitle className="text-2xl font-bold">Your Library</DialogTitle>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="h-6 w-6 p-0"
          >
            <X className="h-4 w-4" />
          </Button>
        </DialogHeader>

        <div className="flex-1 overflow-hidden">
          <div className="px-6 py-2 text-sm text-muted-foreground">
            Browse and organize your music collection
          </div>

          {/* Header Row */}
          <div className="grid grid-cols-12 gap-4 px-6 py-2 text-sm font-medium text-muted-foreground border-b">
            <div className="col-span-1 text-center">#</div>
            <div className="col-span-5">Title</div>
            <div className="col-span-3">Album</div>
            <div className="col-span-2">Date added</div>
            <div className="col-span-1 text-center">⏰</div>
          </div>

          {/* Track List */}
          <div className="flex-1 overflow-y-auto">
            {tracks.map((track, index) => {
              const isCurrentTrack = currentSong?.id === track.id;
              return (
                <div
                  key={track.id}
                  className={`grid grid-cols-12 gap-4 px-6 py-3 hover:bg-accent/50 cursor-pointer transition-colors group ${
                    isCurrentTrack ? "bg-accent/30" : ""
                  }`}
                  onClick={() => handleTrackClick(track)}
                  data-testid={`queue-track-${index}`}
                >
                  {/* Track Number / Play Button */}
                  <div className="col-span-1 flex items-center justify-center text-sm text-muted-foreground">
                    <span className="group-hover:hidden">
                      {isCurrentTrack && isPlaying ? (
                        <div className="flex items-center space-x-0.5">
                          <div className="w-1 h-3 bg-primary rounded animate-pulse"></div>
                          <div className="w-1 h-2 bg-primary rounded animate-pulse" style={{ animationDelay: "0.2s" }}></div>
                          <div className="w-1 h-4 bg-primary rounded animate-pulse" style={{ animationDelay: "0.1s" }}></div>
                        </div>
                      ) : (
                        <span className={isCurrentTrack ? "text-primary font-semibold" : ""}>
                          {index + 1}
                        </span>
                      )}
                    </span>
                    <Play className="w-4 h-4 hidden group-hover:block text-foreground" />
                  </div>

                  {/* Title and Artist */}
                  <div className="col-span-5 min-w-0">
                    <div className="flex items-center space-x-3">
                      <img
                        src={track.artwork || 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?ixlib=rb-4.0.3&auto=format&fit=crop&w=48&h=48'}
                        alt={track.title}
                        className="w-10 h-10 rounded object-cover"
                      />
                      <div className="min-w-0 flex-1">
                        <p className={`text-sm font-medium truncate ${
                          isCurrentTrack ? "text-primary" : "text-foreground"
                        }`}>
                          {track.title}
                        </p>
                        <p className="text-xs text-muted-foreground truncate">
                          {track.artist}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Album */}
                  <div className="col-span-3 flex items-center">
                    <span className="text-sm text-muted-foreground truncate">
                      {track.title} {/* Using title as album for now */}
                    </span>
                  </div>

                  {/* Date Added */}
                  <div className="col-span-2 flex items-center">
                    <span className="text-sm text-muted-foreground">
                      {track.createdAt ? formatDateAdded(track.createdAt) : "Unknown"}
                    </span>
                  </div>

                  {/* Duration */}
                  <div className="col-span-1 flex items-center justify-center">
                    <span className="text-sm text-muted-foreground">
                      {formatDuration(track.duration)}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>

          {tracks.length === 0 && (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center">
                <p className="text-lg font-medium text-muted-foreground mb-2">
                  No tracks in your library
                </p>
                <p className="text-sm text-muted-foreground">
                  Add some music to get started
                </p>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}