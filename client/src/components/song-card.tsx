import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Play, Heart, Star, MessageCircle, MoreHorizontal } from "lucide-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { formatDuration } from "@/lib/audio-utils";
import toast from "react-hot-toast";
import type { Song } from "@shared/schema";

interface SongCardProps {
  song: Song;
  onPlay: () => void;
  showArtist?: boolean;
  showAlbum?: boolean;
}

export default function SongCard({ song, onPlay, showArtist = true, showAlbum = true }: SongCardProps) {
  const [isHovered, setIsHovered] = useState(false);
  const queryClient = useQueryClient();

  const playMutation = useMutation({
    mutationFn: async () => {
      try {
        await apiRequest("POST", `/api/songs/${song.id}/play`);
      } catch (error) {
        // Ignore auth errors for now - still trigger onPlay callback
        console.log("Play tracking failed (auth required):", error);
      }
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
        {/* Horizontal Layout for Songs Page */}
        <div className="flex">
          {/* Album Art - Smaller for horizontal layout */}
          <div className="relative flex-shrink-0">
            <img 
              src={song.coverArt || 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?ixlib=rb-4.0.3&auto=format&fit=crop&w=120&h=120'} 
              alt={song.title}
              className="w-16 h-16 md:w-20 md:h-20 object-cover" 
            />
            <div className={`absolute inset-0 bg-black/40 transition-opacity flex items-center justify-center ${
              isHovered ? 'opacity-100' : 'opacity-0'
            }`}>
              <Button 
                onClick={(e) => {
                  e.stopPropagation();
                  handlePlay();
                }}
                size="sm"
                className="w-8 h-8 bg-primary rounded-full shadow-lg hover:scale-105 transition-transform"
                data-testid={`button-play-song-${song.id}`}
              >
                <Play className="w-3 h-3 text-primary-foreground ml-0.5" />
              </Button>
            </div>
          </div>

          {/* Song Details - Expanded horizontal layout */}
          <div className="flex-1 p-3 md:p-4 min-w-0">
            {/* Top Row: Title and Duration */}
            <div className="flex items-start justify-between mb-1">
              <h3 className="text-sm md:text-base font-semibold text-foreground font-sans line-clamp-1 flex-1 mr-2" data-testid={`text-song-title-${song.id}`}>
                {song.title}
              </h3>
              <div className="flex items-center gap-2 flex-shrink-0">
                {(song.playCount ?? 0) > 0 && (
                  <span className="bg-primary/10 text-primary px-2 py-0.5 rounded-full text-xs font-mono" data-testid={`text-play-count-${song.id}`}>
                    {song.playCount} plays
                  </span>
                )}
                <span className="bg-secondary text-secondary-foreground px-2 py-0.5 rounded text-xs font-mono" data-testid={`text-song-duration-${song.id}`}>
                  {formatDuration(song.duration)}
                </span>
              </div>
            </div>

            {/* Second Row: Artist and Album Info */}
            <div className="text-muted-foreground text-xs md:text-sm mb-2 font-serif">
              {showArtist && (
                <p className="line-clamp-1" data-testid={`text-song-artist-${song.id}`}>
                  Artist info would go here
                </p>
              )}
              {showAlbum && song.albumId && (
                <p className="line-clamp-1 text-xs opacity-75" data-testid={`text-song-album-${song.id}`}>
                  Album info would go here
                </p>
              )}
            </div>

            {/* Bottom Row: Action Buttons */}
            <div className="flex items-center justify-between">
              {/* Left side: Social actions */}
              <div className="flex items-center space-x-1">
                <Button 
                  variant="ghost"
                  size="sm"
                  className="text-muted-foreground hover:text-red-500 transition-colors p-1.5"
                  data-testid={`button-favorite-song-${song.id}`}
                >
                  <Heart className="w-3.5 h-3.5" />
                </Button>
                <Button 
                  variant="ghost"
                  size="sm"
                  className="text-muted-foreground hover:text-yellow-500 transition-colors p-1.5 hidden md:inline-flex"
                  data-testid={`button-rate-song-${song.id}`}
                >
                  <Star className="w-3.5 h-3.5" />
                </Button>
                <Button 
                  variant="ghost"
                  size="sm"
                  className="text-muted-foreground hover:text-blue-500 transition-colors p-1.5 hidden md:inline-flex"
                  data-testid={`button-comment-song-${song.id}`}
                >
                  <MessageCircle className="w-3.5 h-3.5" />
                </Button>
              </div>
              
              {/* Right side: Menu */}
              <Button 
                variant="ghost"
                size="sm"
                className="text-muted-foreground hover:text-foreground transition-colors p-1.5"
                data-testid={`button-menu-song-${song.id}`}
              >
                <MoreHorizontal className="w-3.5 h-3.5" />
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}