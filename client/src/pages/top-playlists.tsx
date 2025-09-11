import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useMusicPlayer } from "@/hooks/use-music-player";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ListMusic, Play, Heart } from "lucide-react";

interface Playlist {
  id: string;
  title: string;
  description?: string;
  coverArt?: string;
  isPublic: boolean;
  createdAt?: string;
}

export default function TopPlaylists() {
  const [searchQuery, setSearchQuery] = useState("");
  const { currentSong, playTrack } = useMusicPlayer();

  const { data: playlists = [], isLoading } = useQuery<Playlist[]>({
    queryKey: ["/api/playlists/public"],
  });

  const filteredPlaylists = searchQuery 
    ? playlists.filter(playlist => 
        playlist.title.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : playlists;

  const PlaylistCard = ({ playlist }: { playlist: Playlist }) => (
    <div className="bg-card rounded-lg border border-border overflow-hidden hover:shadow-lg transition-shadow">
      <div className="relative group">
        <div className="w-full h-32 md:h-48 bg-muted flex items-center justify-center overflow-hidden">
          {playlist.coverArt ? (
            <img 
              src={playlist.coverArt} 
              alt={playlist.title}
              className="w-full h-full object-cover"
            />
          ) : (
            <ListMusic className="w-8 h-8 md:w-12 md:h-12 text-muted-foreground" />
          )}
        </div>
        <Button
          size="sm"
          className="absolute bottom-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity bg-primary hover:bg-primary/90"
          data-testid={`button-play-playlist-${playlist.id}`}
        >
          <Play className="w-4 h-4" />
        </Button>
      </div>
      <div className="p-2 md:p-4">
        <h3 className="font-semibold text-foreground truncate text-sm md:text-base mb-1">
          {playlist.title}
        </h3>
        {playlist.description && (
          <p className="text-xs md:text-sm text-muted-foreground truncate mb-2">
            {playlist.description}
          </p>
        )}
        <div className="flex items-center justify-between">
          <span className="text-xs md:text-sm text-muted-foreground">
            Playlist
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
            <div className="w-12 h-12 rounded-full bg-gradient-to-r from-green-500 to-blue-500 flex items-center justify-center">
              <ListMusic className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-foreground font-sans">
                Top Playlists
              </h1>
              <p className="text-muted-foreground font-serif">
                Curated collections everyone loves
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
          ) : filteredPlaylists.length > 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 md:gap-6">
              {filteredPlaylists.map((playlist) => (
                <PlaylistCard key={playlist.id} playlist={playlist} />
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-16">
              <div className="w-24 h-24 rounded-full bg-muted flex items-center justify-center mb-4">
                <ListMusic className="w-12 h-12 text-muted-foreground" />
              </div>
              <h3 className="text-xl font-semibold text-foreground mb-2">
                No playlists available
              </h3>
              <p className="text-muted-foreground text-center max-w-md">
                Popular playlists will appear here when they're created and shared.
              </p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}