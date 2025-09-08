import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Grid3X3, List, Search, ArrowLeft } from "lucide-react";
import { Link } from "wouter";
import SongCard from "@/components/song-card";
import { Skeleton } from "@/components/ui/skeleton";
import type { Song } from "@shared/schema";

export default function Songs() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedGenre, setSelectedGenre] = useState("All Genres");

  const { data: songs = [], isLoading } = useQuery<Song[]>({
    queryKey: ["/api/songs"],
    enabled: selectedGenre === "All Genres" && !searchQuery,
  });

  const { data: searchResults = [] } = useQuery<Song[]>({
    queryKey: ["/api/songs/search", { q: searchQuery }],
    enabled: !!searchQuery,
  });

  const { data: genres = [] } = useQuery<{ id: string; name: string }[]>({
    queryKey: ["/api/genres"],
  });

  const displaySongs = searchQuery ? searchResults : songs;

  const handlePlaySong = (song: Song) => {
    // TODO: Integrate with music player
  };

  const genreOptions = ["All Genres", ...genres.map(g => g.name)];

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <header className="sticky top-0 z-10 bg-background/95 backdrop-blur-sm border-b border-border p-6">
          <div className="flex items-center space-x-4">
            <Link href="/">
              <Button variant="ghost" size="sm">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Home
              </Button>
            </Link>
            <div>
              <h1 className="text-2xl font-bold text-foreground font-sans">Songs</h1>
              <p className="text-muted-foreground font-serif">Loading songs...</p>
            </div>
          </div>
        </header>
        <section className="px-6 pb-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mt-6">
            {Array.from({ length: 12 }).map((_, i) => (
              <div key={i} className="bg-card rounded-lg border border-border overflow-hidden">
                <Skeleton className="w-full h-48" />
                <div className="p-4 space-y-2">
                  <Skeleton className="h-6 w-3/4" />
                  <Skeleton className="h-4 w-1/2" />
                  <div className="flex items-center justify-between">
                    <Skeleton className="h-6 w-16" />
                    <Skeleton className="h-4 w-4" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-10 bg-background/95 backdrop-blur-sm border-b border-border p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Link href="/">
              <Button variant="ghost" size="sm" data-testid="button-back">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Home
              </Button>
            </Link>
            <div>
              <h1 className="text-2xl font-bold text-foreground font-sans">Songs</h1>
              <p className="text-muted-foreground font-serif">
                {searchQuery 
                  ? `Found ${displaySongs.length} songs for "${searchQuery}"`
                  : "Discover and play your favorite songs"
                }
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-4">
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
            <Select value={selectedGenre} onValueChange={setSelectedGenre}>
              <SelectTrigger className="w-[180px] bg-input border-border font-mono text-sm" data-testid="select-genre">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {genreOptions.map((genre) => (
                  <SelectItem key={genre} value={genre}>
                    {genre}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button variant="secondary" size="sm" data-testid="button-grid-view">
              <Grid3X3 className="w-4 h-4" />
            </Button>
            <Button variant="ghost" size="sm" data-testid="button-list-view">
              <List className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </header>

      {/* Songs Grid */}
      <section className="px-6 pb-6">
        {displaySongs.length === 0 ? (
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
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mt-6">
            {displaySongs.map((song) => (
              <SongCard 
                key={song.id} 
                song={song} 
                onPlay={() => handlePlaySong(song)}
              />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}