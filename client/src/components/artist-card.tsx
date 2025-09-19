import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Heart } from "lucide-react";
import type { Artist } from "@shared/schema";

interface ArtistCardProps {
  artist: Artist;
  onToggleFollow: (artist: Artist) => void;
  isFollowing?: boolean;
}

export default function ArtistCard({ artist, onToggleFollow, isFollowing = false }: ArtistCardProps) {
  return (
    <Card 
      className="overflow-hidden"
      data-testid={`card-artist-${artist.id}`}
    >
      <CardContent className="p-0">
        <div className="relative">
          <img 
            src={artist.profilePic || 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=300'} 
            alt={artist.name}
            className="w-full h-48 object-cover" 
          />
          <Button 
            variant="ghost"
            size="sm"
            className={`absolute bottom-2 right-2 p-2 rounded-full bg-white/80 backdrop-blur-sm ${
              isFollowing 
                ? 'text-red-500 hover:text-red-600' 
                : 'text-gray-500 hover:text-red-500'
            }`}
            onClick={(e) => {
              e.stopPropagation();
              onToggleFollow(artist);
            }}
            data-testid={`button-toggle-follow-${artist.id}`}
          >
            <Heart className={`w-4 h-4 ${isFollowing ? 'fill-current' : ''}`} />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}