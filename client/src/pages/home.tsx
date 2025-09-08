import { useState } from "react";
import Sidebar from "@/components/sidebar";
import MobileHeader from "@/components/mobile-header";
import MobileBottomNav from "@/components/mobile-bottom-nav";
import MobileDrawer from "@/components/mobile-drawer";
import MusicLibrary from "@/components/music-library";
import { useMusicPlayer } from "@/hooks/use-music-player";
import { useQuery } from "@tanstack/react-query";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, Bell, User } from "lucide-react";
import type { Track, LegacyTrack } from "@shared/schema";

export default function Home() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All Categories");
  const [isMobileDrawerOpen, setIsMobileDrawerOpen] = useState(false);
  const { currentSong, playTrack } = useMusicPlayer();

  const { data: songs = [], isLoading } = useQuery<Track[]>({
    queryKey: ["/api/songs"],
    enabled: selectedCategory === "All Categories" && !searchQuery,
  });

  const { data: filteredSongs = [] } = useQuery<Track[]>({
    queryKey: ["/api/songs/genre", selectedCategory],
    enabled: selectedCategory !== "All Categories" && !searchQuery,
  });

  const { data: searchResults = [] } = useQuery<Track[]>({
    queryKey: ["/api/songs/search", { q: searchQuery }],
    enabled: !!searchQuery,
  });

  const displaySongs = searchQuery 
    ? searchResults 
    : selectedCategory === "All Categories" 
      ? songs 
      : filteredSongs;

  const handlePlaySong = (song: LegacyTrack) => {
    playTrack(song);
  };

  // Convert Track to LegacyTrack format for compatibility
  const convertToLegacyTrack = (song: Track): LegacyTrack => ({
    id: song.id,
    title: song.title,
    artist: "Unknown Artist", // TODO: Get from artists table
    category: "Music", // TODO: Get from categories table
    duration: song.duration || 0,
    url: song.filePath ? encodeURI(song.filePath) : "",
    artwork: song.coverArt || null,
    isFavorite: false, // TODO: Get from favorites table
    uploadType: "file",
    createdAt: song.createdAt || undefined,
  });

  // Convert songs to legacy format
  const displayLegacyTracks = displaySongs.map(convertToLegacyTrack);

  const handleSearch = (query: string) => {
    setSearchQuery(query);
  };

  return (
    <div className="min-h-screen flex flex-col">
      {/* Mobile Header */}
      <MobileHeader 
        onSearch={handleSearch}
        searchQuery={searchQuery}
        onMenuToggle={() => setIsMobileDrawerOpen(true)}
      />

      {/* Mobile Drawer */}
      <MobileDrawer 
        isOpen={isMobileDrawerOpen}
        onClose={() => setIsMobileDrawerOpen(false)}
        onCategorySelect={setSelectedCategory}
        selectedCategory={selectedCategory}
      />

      <div className="flex flex-1">
        {/* Desktop Sidebar */}
        <div className="hidden md:block">
          <Sidebar 
            onCategorySelect={setSelectedCategory}
            selectedCategory={selectedCategory}
            recentSongs={songs.slice(0, 2)}
          />
        </div>

        <main className={`flex-1 overflow-auto custom-scrollbar ${currentSong ? 'pb-32' : 'pb-20'} md:pb-32`}>
          {/* Desktop Header with Search */}
          <header className="sticky top-0 z-10 bg-background/95 backdrop-blur-sm border-b border-border p-6 hidden md:block">
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
            onPlaySong={(song) => handlePlaySong(convertToLegacyTrack(song))}
            searchQuery={searchQuery}
          />
        </main>
      </div>

      {/* Mobile Bottom Navigation */}
      <MobileBottomNav />

    </div>
  );
}
