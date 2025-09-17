import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Music, Users, Play, Heart } from "lucide-react";
import type { Artist } from "@shared/schema";

// Enhanced Artist type with additional details
type ArtistWithDetails = Artist & {
  trackCount?: number;
  followers?: number;
};

interface ArtistCardProps {
  artist: ArtistWithDetails;
  onViewArtist: (artist: ArtistWithDetails) => void;
  onUnfollow?: (artist: ArtistWithDetails) => void;
  showUnfollowButton?: boolean;
}

export default function ArtistCard({ artist, onViewArtist, onUnfollow, showUnfollowButton = false }: ArtistCardProps) {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <Card 
      className="overflow-hidden floating-card gentle-float group cursor-pointer"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={() => onViewArtist(artist)}
      data-testid={`card-artist-${artist.id}`}
    >
      <CardContent className="p-0">
        <div className="relative">
          <img 
            src={artist.profilePic || 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=300'} 
            alt={artist.name}
            className="w-full h-48 object-cover floating-image" 
          />
          <div className={`absolute inset-0 bg-black/20 transition-opacity flex items-center justify-center ${
            isHovered ? 'opacity-100' : 'opacity-0'
          }`}>
            <Button 
              onClick={(e) => {
                e.stopPropagation();
                onViewArtist(artist);
              }}
              className="w-12 h-12 bg-primary rounded-full shadow-lg hover:scale-105 transition-transform"
              data-testid={`button-view-artist-${artist.id}`}
            >
              <Play className="w-5 h-5 text-primary-foreground ml-0.5" />
            </Button>
          </div>
        </div>
        <div className="p-4 floating-content">
          <h3 className="text-lg font-semibold text-foreground mb-1 font-sans" data-testid={`text-artist-name-${artist.id}`}>
            {artist.name}
          </h3>
          {artist.bio && (
            <p className="text-muted-foreground text-sm mb-3 font-serif line-clamp-2" data-testid={`text-artist-bio-${artist.id}`}>
              {artist.bio}
            </p>
          )}
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4 text-xs text-muted-foreground">
              <div className="flex items-center space-x-1">
                <Music className="w-4 h-4" />
                <span>{(artist.trackCount ?? 0).toLocaleString()} tracks</span>
              </div>
              <div className="flex items-center space-x-1">
                <Users className="w-3 h-3" />
                <span data-testid={`text-followers-${artist.id}`}>{(artist.followers ?? 0).toLocaleString()}</span>
              </div>
            </div>
            {showUnfollowButton && onUnfollow ? (
              <Button 
                variant="ghost"
                size="sm"
                className="p-1 hover:text-red-500 transition-colors text-red-500"
                onClick={(e) => {
                  e.stopPropagation();
                  onUnfollow(artist);
                }}
                data-testid={`button-unfollow-artist-${artist.id}`}
              >
                <Heart className="w-4 h-4 fill-current" />
              </Button>
            ) : (
              <Button 
                variant="ghost"
                size="sm"
                className="text-muted-foreground hover:text-foreground transition-colors"
                data-testid={`button-follow-artist-${artist.id}`}
              >
                <Users className="w-4 h-4" />
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}