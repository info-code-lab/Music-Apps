import { useState } from "react";
import Sidebar from "@/components/sidebar";
import MusicPlayer from "@/components/music-player";
import MusicLibrary from "@/components/music-library";
import { useQuery } from "@tanstack/react-query";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, Bell, User } from "lucide-react";
import type { Track } from "@shared/schema";

export default function Home() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All Categories");
  const [currentSong, setCurrentSong] = useState<Track | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);

  const { data: songs = [], isLoading } = useQuery<Track[]>({
    queryKey: ["/api/tracks"],
    enabled: selectedCategory === "All Categories" && !searchQuery,
  });

  const { data: filteredSongs = [] } = useQuery<Track[]>({
    queryKey: ["/api/tracks/category", selectedCategory],
    enabled: selectedCategory !== "All Categories" && !searchQuery,
  });

  const { data: searchResults = [] } = useQuery<Track[]>({
    queryKey: ["/api/tracks/search", { q: searchQuery }],
    enabled: !!searchQuery,
  });

  const displaySongs = searchQuery 
    ? searchResults 
    : selectedCategory === "All Categories" 
      ? songs 
      : filteredSongs;

  const handlePlaySong = (song: Track) => {
    setCurrentSong(song);
    setIsPlaying(true);
  };

  const handleSearch = (query: string) => {
    setSearchQuery(query);
  };

  return (
    <div className="min-h-screen flex flex-col">
      <div className="flex flex-1">
        <Sidebar 
          onCategorySelect={setSelectedCategory}
          selectedCategory={selectedCategory}
          recentSongs={songs.slice(0, 2)}
        />

        <main className="flex-1 overflow-auto pb-32 custom-scrollbar">
          {/* Header with Search */}
          <header className="sticky top-0 z-10 bg-background/95 backdrop-blur-sm border-b border-border p-6">
            <div className="flex items-center justify-between">
              <div className="flex-1 max-w-md">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                  <Input
                    type="text"
                    placeholder="Search songs, artists, or albums..."
                    className="pl-10 bg-input border-border font-serif"
                    value={searchQuery}
                    onChange={(e) => handleSearch(e.target.value)}
                    data-testid="input-search"
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

          <MusicLibrary
            songs={displaySongs}
            isLoading={isLoading}
            selectedCategory={selectedCategory}
            onCategoryChange={setSelectedCategory}
            onPlaySong={handlePlaySong}
            searchQuery={searchQuery}
          />
        </main>
      </div>

      {currentSong && (
        <MusicPlayer
          song={currentSong}
          isPlaying={isPlaying}
          onPlayPause={() => setIsPlaying(!isPlaying)}
          onNext={() => {
            const currentIndex = displaySongs.findIndex(t => t.id === currentSong.id);
            const nextSong = displaySongs[currentIndex + 1];
            if (nextSong) {
              setCurrentSong(nextSong);
            }
          }}
          onPrevious={() => {
            const currentIndex = displaySongs.findIndex(t => t.id === currentSong.id);
            const prevSong = displaySongs[currentIndex - 1];
            if (prevSong) {
              setCurrentSong(prevSong);
            }
          }}
        />
      )}
    </div>
  );
}
