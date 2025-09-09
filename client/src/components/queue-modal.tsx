import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Play, X } from "lucide-react";
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

  // Get the remaining tracks after current song
  const currentIndex = tracks.findIndex(t => t.id === currentSong?.id);
  const nextTracks = currentIndex >= 0 ? tracks.slice(currentIndex + 1) : tracks;

  if (!isOpen) return null;

  return (
    <>
      {/* Overlay */}
      <div 
        className="fixed inset-0 bg-black/50 z-40"
        onClick={onClose}
      />
      
      {/* Bottom Popup */}
      <div className="fixed left-0 right-0 bottom-0 h-[70vh] bg-background border-t border-border rounded-t-xl z-50 flex flex-col animate-in slide-in-from-bottom duration-300">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-border">
          <h2 className="text-lg font-semibold">Queue</h2>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="h-8 w-8 p-0"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto">
          {/* Now Playing Section */}
          {currentSong && (
            <div className="p-4">
              <h3 className="text-sm font-medium text-muted-foreground mb-3">Now playing</h3>
              <div className="flex items-center space-x-3 p-3 rounded-lg bg-accent/30">
                <img
                  src={currentSong.artwork || 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?ixlib=rb-4.0.3&auto=format&fit=crop&w=48&h=48'}
                  alt={currentSong.title}
                  className="w-12 h-12 rounded-lg object-cover"
                />
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-primary truncate">
                    {currentSong.title}
                  </p>
                  <p className="text-xs text-muted-foreground truncate">
                    {currentSong.artist}
                  </p>
                </div>
                {isPlaying && (
                  <div className="flex items-center space-x-0.5 ml-2">
                    <div className="w-1 h-3 bg-primary rounded animate-pulse"></div>
                    <div className="w-1 h-2 bg-primary rounded animate-pulse" style={{ animationDelay: "0.2s" }}></div>
                    <div className="w-1 h-4 bg-primary rounded animate-pulse" style={{ animationDelay: "0.1s" }}></div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Next Tracks Section */}
          {nextTracks.length > 0 && (
            <div className="px-4 pb-4">
              <h3 className="text-sm font-medium text-muted-foreground mb-3">
                Next from: Your Library
              </h3>
              <div className="space-y-2">
                {nextTracks.map((track) => (
                  <div
                    key={track.id}
                    className="flex items-center space-x-3 p-2 rounded-lg hover:bg-accent/50 cursor-pointer transition-colors group"
                    onClick={() => handleTrackClick(track)}
                  >
                    <div className="relative">
                      <img
                        src={track.artwork || 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?ixlib=rb-4.0.3&auto=format&fit=crop&w=48&h=48'}
                        alt={track.title}
                        className="w-12 h-12 rounded-lg object-cover"
                      />
                      <div className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity">
                        <Play className="w-4 h-4 text-white" />
                      </div>
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium truncate">
                        {track.title}
                      </p>
                      <p className="text-xs text-muted-foreground truncate">
                        {track.artist}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {tracks.length === 0 && (
            <div className="flex-1 flex items-center justify-center p-8">
              <div className="text-center">
                <p className="text-sm font-medium text-muted-foreground mb-2">
                  No tracks in queue
                </p>
                <p className="text-xs text-muted-foreground">
                  Add some music to get started
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}