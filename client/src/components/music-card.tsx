import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Play, Heart, Download, Check, X, Wifi, WifiOff } from "lucide-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Progress } from "@/components/ui/progress";
import { apiRequest } from "@/lib/queryClient";
import { formatDuration } from "@/lib/audio-utils";
import { useDownload } from "@/hooks/use-download";
import { useOffline } from "@/hooks/use-offline";
import toast from "react-hot-toast";
import type { LegacyTrack as Track } from "@shared/schema";

interface MusicCardProps {
  song: Track;
  onPlay: () => void;
}

const getCategoryColor = (category: string) => {
  const colors = {
    Jazz: "bg-accent text-accent-foreground",
    Electronic: "bg-chart-1 text-white",
    Classical: "bg-chart-4 text-white",
    Rock: "bg-chart-5 text-white",
    Folk: "bg-chart-3 text-secondary",
    "Hip-Hop": "bg-chart-2 text-white",
  };
  return colors[category as keyof typeof colors] || "bg-muted text-muted-foreground";
};

export default function MusicCard({ song, onPlay }: MusicCardProps) {
  const [isHovered, setIsHovered] = useState(false);
  const queryClient = useQueryClient();
  const { downloadSong, deleteSong, isDownloaded, isDownloading } = useDownload();
  const { isOffline } = useOffline();

  const favoriteMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("PATCH", `/api/tracks/${song.id}/favorite`);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/tracks"] });
      toast.success(
        song.isFavorite ? "Removed from favorites" : "Added to favorites"
      );
    },
    onError: () => {
      toast.error("Couldn't update favorites");
    },
  });

  return (
    <div 
      className="bg-card rounded-lg border border-border overflow-hidden hover:shadow-lg transition-all duration-300 group cursor-pointer"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      data-testid={`card-song-${song.id}`}
    >
      <div className="relative">
        <img 
          src={song.artwork || 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=300'} 
          alt={song.title}
          className="w-full h-48 object-cover" 
        />
        <div className={`absolute inset-0 bg-black/20 transition-opacity flex items-center justify-center ${
          isHovered ? 'opacity-100' : 'opacity-0'
        }`}>
          <Button 
            onClick={(e) => {
              e.stopPropagation();
              onPlay();
            }}
            className="w-12 h-12 bg-primary rounded-full shadow-lg hover:scale-105 transition-transform"
            data-testid={`button-play-${song.id}`}
          >
            <Play className="w-5 h-5 text-primary-foreground ml-0.5" />
          </Button>
        </div>
        <div className="absolute top-2 right-2 flex items-center gap-2">
          {/* Offline Status Indicator */}
          {isDownloaded(song.id) && (
            <div className="bg-green-600/90 text-white px-2 py-1 rounded-full text-xs flex items-center gap-1 font-mono">
              <WifiOff className="w-3 h-3" />
              Offline
            </div>
          )}
          {/* Duration */}
          <div className="bg-secondary/80 text-secondary-foreground px-2 py-1 rounded text-xs font-mono">
            <span data-testid={`text-duration-${song.id}`}>{formatDuration(song.duration)}</span>
          </div>
        </div>
      </div>
      <div className="p-4">
        <h3 className="text-lg font-semibold text-foreground mb-1 font-sans" data-testid={`text-title-${song.id}`}>
          {song.title}
        </h3>
        <p className="text-muted-foreground text-sm mb-2 font-serif" data-testid={`text-artist-${song.id}`}>
          {song.artist}
        </p>
        <div className="flex items-center justify-between">
          <span 
            className={`inline-block text-xs px-2 py-1 rounded-full font-mono ${getCategoryColor(song.category)}`}
            data-testid={`text-category-${song.id}`}
          >
            {song.category}
          </span>
          <div className="flex items-center gap-1">
            {/* Download Button */}
            {isDownloading(song.id) ? (
              <Button 
                variant="ghost"
                size="sm"
                disabled
                className="text-blue-600 hover:text-blue-700 transition-colors"
                data-testid={`button-downloading-${song.id}`}
              >
                <Download className="w-4 h-4 animate-pulse" />
              </Button>
            ) : isDownloaded(song.id) ? (
              <Button 
                variant="ghost"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  deleteSong(song.id);
                }}
                className="text-green-600 hover:text-red-600 transition-colors"
                title="Remove offline version"
                data-testid={`button-delete-offline-${song.id}`}
              >
                <Check className="w-4 h-4" />
              </Button>
            ) : (
              <Button 
                variant="ghost"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  downloadSong(song);
                }}
                className="text-muted-foreground hover:text-blue-600 transition-colors"
                title="Download for offline playback"
                data-testid={`button-download-${song.id}`}
              >
                <Download className="w-4 h-4" />
              </Button>
            )}
            
            {/* Favorite Button */}
            <Button 
              variant="ghost"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                favoriteMutation.mutate();
              }}
              disabled={favoriteMutation.isPending}
              className="text-muted-foreground hover:text-foreground transition-colors"
              data-testid={`button-favorite-${song.id}`}
            >
              <Heart className={`w-4 h-4 ${song.isFavorite ? 'fill-current text-destructive' : ''}`} />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
