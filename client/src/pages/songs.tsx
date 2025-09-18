import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useMusicPlayer } from "@/hooks/use-music-player";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Grid3X3, List, Search, Bell, User } from "lucide-react";
import MusicCard from "@/components/music-card";
import { Skeleton } from "@/components/ui/skeleton";
import type { LegacyTrack } from "@shared/schema";

export default function Songs() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedGenre, setSelectedGenre] = useState("All Genres");
  const { currentSong, playTrack } = useMusicPlayer();

  const { data: songs = [], isLoading } = useQuery<LegacyTrack[]>({
    queryKey: ["/api/songs"],
    enabled: selectedGenre === "All Genres" && !searchQuery,
  });

  const { data: searchResults = [] } = useQuery<LegacyTrack[]>({
    queryKey: ["/api/songs/search", { q: searchQuery }],
    enabled: !!searchQuery,
  });

  const { data: genres = [] } = useQuery<{ id: string; name: string }[]>({
    queryKey: ["/api/genres"],
  });

  const displayTracks = searchQuery ? searchResults : songs;

  const handlePlaySong = (track: LegacyTrack) => {
    playTrack(track);
  };

  const genreOptions = ["All Genres", ...genres.map(g => g.name)];

  if (isLoading) {
    return (
      <div className="h-full">
        <main className="h-full">
            <header className="sticky top-0 z-10 bg-background/95 backdrop-blur-sm border-b border-border p-6 hidden md:block">
              <div className="flex items-center justify-between">
                <div className="flex-1 max-w-md">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                    <Input
                      type="text"
                      placeholder="Search songs..."
                      className="pl-10 bg-input border-border font-serif"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      data-testid="input-search-songs"
                    />
                  </div>
                </div>
                <div className="flex items-center space-x-4 ml-6">
                  <Button variant="ghost" size="sm" className="p-2" data-testid="button-notifications">
                    <Bell className="w-4 h-4 text-muted-foreground" />
                  </Button>
                  <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center">
                    <User className="w-4 h-4 text-primary-foreground" />
                  </div>
                </div>
              </div>
            </header>
            
            <section className="px-4 md:px-6 pb-6">
              <div className="mb-4 md:mb-6">
                <h2 className="text-xl md:text-2xl font-bold text-foreground mb-1 md:mb-2 font-sans">
                  Songs
                </h2>
                <p className="text-sm md:text-base text-muted-foreground font-serif">
                  Loading songs...
                </p>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 md:gap-6">
                {Array.from({ length: 12 }).map((_, i) => (
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
            </section>
        </main>
      </div>
    );
  }

  return (
    <div className="h-full">
      <main className="h-full">
          {/* Songs Library */}
          <section className="px-4 md:px-6 pb-6">
            <div className="mb-4 md:mb-6">
              <h2 className="text-xl md:text-2xl font-bold text-foreground mb-1 md:mb-2 font-sans">
                Songs
              </h2>
              <p className="text-sm md:text-base text-muted-foreground font-serif">
                {searchQuery 
                  ? `Found ${displayTracks.length} songs for "${searchQuery}"`
                  : "Discover and play your favorite songs"
                }
              </p>
            </div>
            
            {displayTracks.length === 0 ? (
              <div className="text-center py-12">
                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-muted flex items-center justify-center">
                  <Grid3X3 className="w-8 h-8 text-muted-foreground" />
                </div>
                <h3 className="text-lg font-semibold text-foreground mb-2 font-sans">
                  {searchQuery ? "No songs found" : "No songs yet"}
                </h3>
                <p className="text-muted-foreground font-serif">
                  {searchQuery 
                    ? "Try adjusting your search query or browse by genre"
                    : "Songs will appear here as music is uploaded"
                  }
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 md:gap-6">
                {displayTracks.map((track) => (
                  <MusicCard key={track.id} song={track} onPlay={() => handlePlaySong(track)} />
                ))}
              </div>
            )}
          </section>
      </main>
    </div>
  );
}