import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Music, Heart } from "lucide-react";
import type { Artist } from "@shared/schema";

interface ArtistCardProps {
  artist: Artist;
  onViewArtist: (artist: Artist) => void;
  onToggleFollow?: (artist: Artist) => void;
  isFollowed?: boolean;
}

export default function ArtistCard({ artist, onViewArtist, onToggleFollow, isFollowed = false }: ArtistCardProps) {
  return (
    <Card 
      className="overflow-hidden cursor-pointer"
      onClick={() => onViewArtist(artist)}
      data-testid={`card-artist-${artist.id}`}
    >
      <CardContent className="p-0">
        <div>
          <img 
            src={artist.profilePic || 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=300'} 
            alt={artist.name}
            className="w-full h-48 object-cover" 
          />
        </div>
        <div className="p-4">
          <h3 className="text-lg font-semibold text-foreground mb-1 font-sans" data-testid={`text-artist-name-${artist.id}`}>
            {artist.name}
          </h3>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-1 text-xs text-muted-foreground">
              <Music className="w-4 h-4" />
              <span>Artist</span>
            </div>
            <Button 
              variant="ghost"
              size="sm"
              className={isFollowed ? "p-1 text-red-500" : "text-muted-foreground"}
              onClick={(e) => {
                e.stopPropagation();
                if (onToggleFollow) {
                  onToggleFollow(artist);
                }
              }}
              data-testid={`button-${isFollowed ? 'unfollow' : 'follow'}-artist-${artist.id}`}
            >
              <Heart className={`w-4 h-4 ${isFollowed ? 'fill-current' : ''}`} />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}