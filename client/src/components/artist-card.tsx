import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Music, Users, Play, Heart } from "lucide-react";
import type { Artist } from "@shared/schema";

interface ArtistCardProps {
  artist: Artist;
  onViewArtist: (artist: Artist) => void;
  onUnfollow?: (artist: Artist) => void;
  showUnfollowButton?: boolean;
}

export default function ArtistCard({ artist, onViewArtist, onUnfollow, showUnfollowButton = false }: ArtistCardProps) {
  const [isHovered, setIsHovered] = useState(false);
  const [imageError, setImageError] = useState(false);

  const handleImageError = () => {
    setImageError(true);
  };

  return (
    <Card 
      className="group relative overflow-hidden rounded-xl border-0 bg-card shadow-sm hover:shadow-xl transition-all duration-300 cursor-pointer transform hover:-translate-y-1"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={() => onViewArtist(artist)}
      data-testid={`card-artist-${artist.id}`}
    >
      <CardContent className="p-0">
        {/* Image Section */}
        <div className="relative aspect-[4/3] overflow-hidden">
          {!imageError && artist.profilePic ? (
            <img 
              src={artist.profilePic} 
              alt={artist.name}
              className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105" 
              onError={handleImageError}
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-primary/20 via-primary/10 to-transparent flex items-center justify-center">
              <Music className="w-12 h-12 text-primary/40" />
            </div>
          )}
          
          {/* Overlay with Play Button */}
          <div className={`absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent transition-opacity duration-300 ${
            isHovered ? 'opacity-100' : 'opacity-0'
          }`}>
            <div className="absolute inset-0 flex items-center justify-center">
              <Button 
                onClick={(e) => {
                  e.stopPropagation();
                  onViewArtist(artist);
                }}
                className="w-14 h-14 bg-white/90 text-black rounded-full shadow-lg hover:bg-white hover:scale-110 transition-all duration-200"
                data-testid={`button-view-artist-${artist.id}`}
              >
                <Play className="w-6 h-6 ml-0.5" />
              </Button>
            </div>
          </div>

          {/* Heart/Follow Button */}
          <div className="absolute top-3 right-3">
            {showUnfollowButton && onUnfollow ? (
              <Button 
                variant="ghost"
                size="sm"
                className="w-8 h-8 bg-black/20 backdrop-blur-sm text-red-500 hover:bg-red-500 hover:text-white rounded-full transition-all duration-200"
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
                className="w-8 h-8 bg-black/20 backdrop-blur-sm text-white hover:bg-white/20 rounded-full transition-all duration-200"
                data-testid={`button-follow-artist-${artist.id}`}
              >
                <Heart className="w-4 h-4" />
              </Button>
            )}
          </div>
        </div>

        {/* Content Section */}
        <div className="p-4 space-y-2">
          <div className="space-y-1">
            <h3 className="text-lg font-bold text-foreground tracking-tight leading-tight flex items-center gap-2" data-testid={`text-artist-name-${artist.id}`}>
              {artist.name}
              {/* Optional verified badge - can be enabled if needed */}
              {/* <Verified className="w-4 h-4 text-blue-500 fill-current" /> */}
            </h3>
            {artist.bio && (
              <p className="text-muted-foreground text-sm leading-relaxed line-clamp-2 font-medium" data-testid={`text-artist-bio-${artist.id}`}>
                {artist.bio}
              </p>
            )}
          </div>
          
          <div className="flex items-center justify-between pt-2">
            <div className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
              <Music className="w-3.5 h-3.5" />
              <span>Artist</span>
            </div>
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <Users className="w-3.5 h-3.5" />
              <span className="font-medium">Follow</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}