import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Play, Music, Lock, Globe, MoreHorizontal } from "lucide-react";
import type { Playlist } from "@shared/schema";

interface PlaylistCardProps {
  playlist: Playlist;
  onViewPlaylist: (playlist: Playlist) => void;
  songCount?: number;
}

export default function PlaylistCard({ playlist, onViewPlaylist, songCount = 0 }: PlaylistCardProps) {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <Card 
      className="overflow-hidden hover:shadow-lg transition-all duration-300 group cursor-pointer"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={() => onViewPlaylist(playlist)}
      data-testid={`card-playlist-${playlist.id}`}
    >
      <CardContent className="p-0">
        <div className="relative">
          <div className="w-full h-48 bg-gradient-to-br from-primary/20 to-secondary/20 flex items-center justify-center">
            <Music className="w-16 h-16 text-muted-foreground" />
          </div>
          <div className={`absolute inset-0 bg-black/20 transition-opacity flex items-center justify-center ${
            isHovered ? 'opacity-100' : 'opacity-0'
          }`}>
            <Button 
              onClick={(e) => {
                e.stopPropagation();
                onViewPlaylist(playlist);
              }}
              className="w-12 h-12 bg-primary rounded-full shadow-lg hover:scale-105 transition-transform"
              data-testid={`button-view-playlist-${playlist.id}`}
            >
              <Play className="w-5 h-5 text-primary-foreground ml-0.5" />
            </Button>
          </div>
          <div className="absolute top-2 right-2 bg-secondary/80 text-secondary-foreground px-2 py-1 rounded text-xs font-mono flex items-center space-x-1">
            {playlist.isPublic ? (
              <Globe className="w-3 h-3" />
            ) : (
              <Lock className="w-3 h-3" />
            )}
            <span>{playlist.isPublic ? 'Public' : 'Private'}</span>
          </div>
          <div className="absolute top-2 left-2 bg-primary/80 text-primary-foreground px-2 py-1 rounded text-xs font-mono">
            <span data-testid={`text-song-count-${playlist.id}`}>{songCount} songs</span>
          </div>
        </div>
        <div className="p-4">
          <h3 className="text-lg font-semibold text-foreground mb-1 font-sans" data-testid={`text-playlist-name-${playlist.id}`}>
            {playlist.name}
          </h3>
          {playlist.description && (
            <p className="text-muted-foreground text-sm mb-3 font-serif line-clamp-2" data-testid={`text-playlist-description-${playlist.id}`}>
              {playlist.description}
            </p>
          )}
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4 text-xs text-muted-foreground">
              <div className="flex items-center space-x-1">
                <Music className="w-4 h-4" />
                <span>Playlist</span>
              </div>
              <span data-testid={`text-playlist-count-${playlist.id}`}>{songCount} tracks</span>
            </div>
            <Button 
              variant="ghost"
              size="sm"
              className="text-muted-foreground hover:text-foreground transition-colors"
              data-testid={`button-menu-playlist-${playlist.id}`}
            >
              <MoreHorizontal className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}