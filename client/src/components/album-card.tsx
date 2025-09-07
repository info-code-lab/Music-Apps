import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Play, Calendar, Disc } from "lucide-react";
import { format } from "date-fns";
import type { Album } from "@shared/schema";

interface AlbumCardProps {
  album: Album;
  onViewAlbum: (album: Album) => void;
}

export default function AlbumCard({ album, onViewAlbum }: AlbumCardProps) {
  const [isHovered, setIsHovered] = useState(false);

  const formatReleaseDate = (date: string | null) => {
    if (!date) return "Unknown";
    try {
      return format(new Date(date), "MMM yyyy");
    } catch {
      return "Unknown";
    }
  };

  return (
    <Card 
      className="overflow-hidden hover:shadow-lg transition-all duration-300 group cursor-pointer"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={() => onViewAlbum(album)}
      data-testid={`card-album-${album.id}`}
    >
      <CardContent className="p-0">
        <div className="relative">
          <img 
            src={album.coverArt || 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=300'} 
            alt={album.title}
            className="w-full h-48 object-cover" 
          />
          <div className={`absolute inset-0 bg-black/20 transition-opacity flex items-center justify-center ${
            isHovered ? 'opacity-100' : 'opacity-0'
          }`}>
            <Button 
              onClick={(e) => {
                e.stopPropagation();
                onViewAlbum(album);
              }}
              className="w-12 h-12 bg-primary rounded-full shadow-lg hover:scale-105 transition-transform"
              data-testid={`button-view-album-${album.id}`}
            >
              <Play className="w-5 h-5 text-primary-foreground ml-0.5" />
            </Button>
          </div>
          <div className="absolute top-2 right-2 bg-secondary/80 text-secondary-foreground px-2 py-1 rounded text-xs font-mono">
            <span data-testid={`text-album-date-${album.id}`}>{formatReleaseDate(album.releaseDate)}</span>
          </div>
        </div>
        <div className="p-4">
          <h3 className="text-lg font-semibold text-foreground mb-1 font-sans" data-testid={`text-album-title-${album.id}`}>
            {album.title}
          </h3>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4 text-xs text-muted-foreground">
              <div className="flex items-center space-x-1">
                <Disc className="w-4 h-4" />
                <span>Album</span>
              </div>
              {album.releaseDate && (
                <div className="flex items-center space-x-1">
                  <Calendar className="w-4 h-4" />
                  <span>{formatReleaseDate(album.releaseDate)}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}