import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useMusicPlayer } from "@/hooks/use-music-player";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Users, Play, Heart } from "lucide-react";

interface Artist {
  id: string;
  name: string;
  bio?: string;
  profileImage?: string;
  isVerified?: boolean;
}

export default function TopArtists() {
  const [searchQuery, setSearchQuery] = useState("");
  const { currentSong, playTrack } = useMusicPlayer();

  const { data: artists = [], isLoading } = useQuery<Artist[]>({
    queryKey: ["/api/artists"],
  });

  const filteredArtists = searchQuery 
    ? artists.filter(artist => 
        artist.name.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : artists;

  const ArtistCard = ({ artist }: { artist: Artist }) => (
    <div className="bg-card rounded-lg border border-border overflow-hidden hover:shadow-lg transition-shadow">
      <div className="relative group">
        <div className="w-full h-32 md:h-48 bg-muted flex items-center justify-center overflow-hidden">
          {artist.profileImage ? (
            <img 
              src={artist.profileImage} 
              alt={artist.name}
              className="w-full h-full object-cover"
            />
          ) : (
            <Users className="w-8 h-8 md:w-12 md:h-12 text-muted-foreground" />
          )}
        </div>
        <Button
          size="sm"
          className="absolute bottom-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity bg-primary hover:bg-primary/90"
          data-testid={`button-play-artist-${artist.id}`}
        >
          <Play className="w-4 h-4" />
        </Button>
      </div>
      <div className="p-2 md:p-4">
        <h3 className="font-semibold text-foreground truncate text-sm md:text-base mb-1 flex items-center">
          {artist.name}
          {artist.isVerified && (
            <span className="ml-1 text-blue-500">✓</span>
          )}
        </h3>
        {artist.bio && (
          <p className="text-xs md:text-sm text-muted-foreground truncate mb-2">
            {artist.bio}
          </p>
        )}
        <div className="flex items-center justify-between">
          <span className="text-xs md:text-sm text-muted-foreground">
            Artist
          </span>
          <Button variant="ghost" size="sm" className="p-1 hover:text-red-500">
            <Heart className="w-3 h-3 md:w-4 md:h-4" />
          </Button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="h-full">
      <main className="h-full">
        <div className="p-4 md:p-8">
          <div className="flex items-center space-x-3 mb-6">
            <div className="w-12 h-12 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 flex items-center justify-center">
              <Users className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-foreground font-sans">
                Top Artists
              </h1>
              <p className="text-muted-foreground font-serif">
                Most popular artists you should know
              </p>
            </div>
          </div>

          {isLoading ? (
            <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 md:gap-6">
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="bg-card rounded-lg border border-border overflow-hidden">
                  <Skeleton className="w-full h-32 md:h-48" />
                  <div className="p-2 md:p-4 space-y-1 md:space-y-2">
                    <Skeleton className="h-4 md:h-6 w-3/4" />
                    <Skeleton className="h-3 md:h-4 w-1/2" />
                    <div className="flex items-center justify-between">
                      <Skeleton className="h-4 md:h-6 w-12 md:w-16" />
                      <Skeleton className="h-3 md:h-4 w-3 md:w-4" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : filteredArtists.length > 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 md:gap-6">
              {filteredArtists.map((artist) => (
                <ArtistCard key={artist.id} artist={artist} />
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-16">
              <div className="w-24 h-24 rounded-full bg-muted flex items-center justify-center mb-4">
                <Users className="w-12 h-12 text-muted-foreground" />
              </div>
              <h3 className="text-xl font-semibold text-foreground mb-2">
                No artists available
              </h3>
              <p className="text-muted-foreground text-center max-w-md">
                Popular artists will appear here when music is added to the library.
              </p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}