import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Play, Heart } from "lucide-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { formatDuration } from "@/lib/audio-utils";
import toast from "react-hot-toast";
import type { Track } from "@shared/schema";

interface MusicCardProps {
  track: Track;
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

export default function MusicCard({ track, onPlay }: MusicCardProps) {
  const [isHovered, setIsHovered] = useState(false);
  const queryClient = useQueryClient();

  const favoriteMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("PATCH", `/api/tracks/${track.id}/favorite`);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/tracks"] });
      toast.success(
        track.isFavorite ? "Removed from favorites" : "Added to favorites",
        {
          icon: track.isFavorite ? '💔' : '❤️',
          duration: 3000,
        }
      );
    },
    onError: () => {
      toast.error("Failed to update favorite status", {
        icon: '❌',
        duration: 4000,
        style: {
          background: '#EF4444',
          color: '#fff',
        },
      });
    },
  });

  return (
    <div 
      className="bg-card rounded-lg border border-border overflow-hidden hover:shadow-lg transition-all duration-300 group cursor-pointer"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      data-testid={`card-track-${track.id}`}
    >
      <div className="relative">
        <img 
          src={track.artwork || 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=300'} 
          alt={track.title}
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
            data-testid={`button-play-${track.id}`}
          >
            <Play className="w-5 h-5 text-primary-foreground ml-0.5" />
          </Button>
        </div>
        <div className="absolute top-2 right-2 bg-secondary/80 text-secondary-foreground px-2 py-1 rounded text-xs font-mono">
          <span data-testid={`text-duration-${track.id}`}>{formatDuration(track.duration)}</span>
        </div>
      </div>
      <div className="p-4">
        <h3 className="text-lg font-semibold text-foreground mb-1 font-sans" data-testid={`text-title-${track.id}`}>
          {track.title}
        </h3>
        <p className="text-muted-foreground text-sm mb-2 font-serif" data-testid={`text-artist-${track.id}`}>
          {track.artist}
        </p>
        <div className="flex items-center justify-between">
          <span 
            className={`inline-block text-xs px-2 py-1 rounded-full font-mono ${getCategoryColor(track.category)}`}
            data-testid={`text-category-${track.id}`}
          >
            {track.category}
          </span>
          <Button 
            variant="ghost"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              favoriteMutation.mutate();
            }}
            disabled={favoriteMutation.isPending}
            className="text-muted-foreground hover:text-foreground transition-colors"
            data-testid={`button-favorite-${track.id}`}
          >
            <Heart className={`w-4 h-4 ${track.isFavorite ? 'fill-current text-destructive' : ''}`} />
          </Button>
        </div>
      </div>
    </div>
  );
}
