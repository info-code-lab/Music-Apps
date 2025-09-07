import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Play, Heart, Star, MessageCircle, MoreHorizontal } from "lucide-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { formatDuration } from "@/lib/audio-utils";
import { useToast } from "@/hooks/use-toast";
import type { Song } from "@shared/schema";

interface SongCardProps {
  song: Song;
  onPlay: () => void;
  showArtist?: boolean;
  showAlbum?: boolean;
}

export default function SongCard({ song, onPlay, showArtist = true, showAlbum = true }: SongCardProps) {
  const [isHovered, setIsHovered] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const playMutation = useMutation({
    mutationFn: async () => {
      await apiRequest("POST", `/api/songs/${song.id}/play`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/songs"] });
      queryClient.invalidateQueries({ queryKey: ["/api/analytics/popular"] });
    },
  });

  const handlePlay = () => {
    onPlay();
    playMutation.mutate();
  };

  return (
    <Card 
      className="overflow-hidden hover:shadow-lg transition-all duration-300 group cursor-pointer"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      data-testid={`card-song-${song.id}`}
    >
      <CardContent className="p-0">
        <div className="relative">
          <img 
            src={song.coverArt || 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=300'} 
            alt={song.title}
            className="w-full h-48 object-cover" 
          />
          <div className={`absolute inset-0 bg-black/20 transition-opacity flex items-center justify-center ${
            isHovered ? 'opacity-100' : 'opacity-0'
          }`}>
            <Button 
              onClick={(e) => {
                e.stopPropagation();
                handlePlay();
              }}
              className="w-12 h-12 bg-primary rounded-full shadow-lg hover:scale-105 transition-transform"
              data-testid={`button-play-song-${song.id}`}
            >
              <Play className="w-5 h-5 text-primary-foreground ml-0.5" />
            </Button>
          </div>
          <div className="absolute top-2 right-2 bg-secondary/80 text-secondary-foreground px-2 py-1 rounded text-xs font-mono">
            <span data-testid={`text-song-duration-${song.id}`}>{formatDuration(song.duration)}</span>
          </div>
          {(song.playCount ?? 0) > 0 && (
            <div className="absolute top-2 left-2 bg-primary/80 text-primary-foreground px-2 py-1 rounded text-xs font-mono">
              <span data-testid={`text-play-count-${song.id}`}>{song.playCount ?? 0} plays</span>
            </div>
          )}
        </div>
        <div className="p-4">
          <h3 className="text-lg font-semibold text-foreground mb-1 font-sans" data-testid={`text-song-title-${song.id}`}>
            {song.title}
          </h3>
          <div className="text-muted-foreground text-sm space-y-1 mb-3 font-serif">
            {showArtist && (
              <p data-testid={`text-song-artist-${song.id}`}>Artist info would go here</p>
            )}
            {showAlbum && song.albumId && (
              <p data-testid={`text-song-album-${song.id}`}>Album info would go here</p>
            )}
          </div>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Button 
                variant="ghost"
                size="sm"
                className="text-muted-foreground hover:text-foreground transition-colors p-1"
                data-testid={`button-favorite-song-${song.id}`}
              >
                <Heart className="w-4 h-4" />
              </Button>
              <Button 
                variant="ghost"
                size="sm"
                className="text-muted-foreground hover:text-foreground transition-colors p-1"
                data-testid={`button-rate-song-${song.id}`}
              >
                <Star className="w-4 h-4" />
              </Button>
              <Button 
                variant="ghost"
                size="sm"
                className="text-muted-foreground hover:text-foreground transition-colors p-1"
                data-testid={`button-comment-song-${song.id}`}
              >
                <MessageCircle className="w-4 h-4" />
              </Button>
            </div>
            <Button 
              variant="ghost"
              size="sm"
              className="text-muted-foreground hover:text-foreground transition-colors p-1"
              data-testid={`button-menu-song-${song.id}`}
            >
              <MoreHorizontal className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}