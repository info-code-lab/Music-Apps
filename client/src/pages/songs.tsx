import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useMusicPlayer } from "@/hooks/use-music-player";
import Sidebar from "@/components/sidebar";
import MobileHeader from "@/components/mobile-header";
import MobileBottomNav from "@/components/mobile-bottom-nav";
import MobileDrawer from "@/components/mobile-drawer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Grid3X3, List, Search, Bell, User } from "lucide-react";
import MusicCard from "@/components/music-card";
import { Skeleton } from "@/components/ui/skeleton";
import type { Song, LegacyTrack } from "@shared/schema";

export default function Songs() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedGenre, setSelectedGenre] = useState("All Genres");
  const [isMobileDrawerOpen, setIsMobileDrawerOpen] = useState(false);
  const { currentSong, playTrack } = useMusicPlayer();

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

  // Convert Song to LegacyTrack format for MusicCard compatibility
  const convertToLegacyTrack = (song: Song): LegacyTrack => ({
    id: song.id,
    title: song.title,
    artist: "Unknown Artist", // TODO: Get from artists table
    category: "Music", // TODO: Get from genres table
    duration: song.duration,
    url: song.filePath ? encodeURI(song.filePath) : "",
    artwork: song.coverArt,
    isFavorite: false, // TODO: Get from favorites table
    uploadType: "file",
    createdAt: song.createdAt || undefined,
  });

  const displayLegacyTracks = displaySongs.map(convertToLegacyTrack);

  const handlePlaySong = (track: LegacyTrack) => {
    playTrack(track);
  };

  const genreOptions = ["All Genres", ...genres.map(g => g.name)];

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col">
        <MobileHeader 
          onSearch={setSearchQuery}
          searchQuery={searchQuery}
          onMenuToggle={() => setIsMobileDrawerOpen(true)}
        />
        
        <div className="flex flex-1">
          <div className="hidden md:block">
            <Sidebar 
              onCategorySelect={() => {}}
              selectedCategory=""
              recentSongs={[]}
            />
          </div>
          
          <main className={`flex-1 overflow-auto custom-scrollbar ${currentSong ? 'pb-44' : 'pb-20'} md:pb-32`}>
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
        
        <MobileBottomNav />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      {/* Mobile Header */}
      <MobileHeader 
        onSearch={setSearchQuery}
        searchQuery={searchQuery}
        onMenuToggle={() => setIsMobileDrawerOpen(true)}
      />

      {/* Mobile Drawer */}
      <MobileDrawer 
        isOpen={isMobileDrawerOpen}
        onClose={() => setIsMobileDrawerOpen(false)}
        onCategorySelect={() => {}}
        selectedCategory=""
      />

      <div className="flex flex-1">
        {/* Desktop Sidebar */}
        <div className="hidden md:block">
          <Sidebar 
            onCategorySelect={() => {}}
            selectedCategory=""
            recentSongs={displaySongs.slice(0, 2)}
          />
        </div>

        <main className={`flex-1 overflow-auto custom-scrollbar ${currentSong ? 'pb-44' : 'pb-20'} md:pb-32`}>
          {/* Desktop Header with Search */}
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
                <Button variant="ghost" size="sm" className="p-2" data-testid="button-notifications">
                  <Bell className="w-4 h-4 text-muted-foreground" />
                </Button>
                <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center">
                  <User className="w-4 h-4 text-primary-foreground" />
                </div>
              </div>
            </div>
          </header>

          {/* Songs Library */}
          <section className="px-4 md:px-6 pb-6">
            <div className="mb-4 md:mb-6">
              <h2 className="text-xl md:text-2xl font-bold text-foreground mb-1 md:mb-2 font-sans">
                Songs
              </h2>
              <p className="text-sm md:text-base text-muted-foreground font-serif">
                {searchQuery 
                  ? `Found ${displayLegacyTracks.length} songs for "${searchQuery}"`
                  : "Discover and play your favorite songs"
                }
              </p>
            </div>
            
            {displayLegacyTracks.length === 0 ? (
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
                {displayLegacyTracks.map((track) => (
                  <MusicCard key={track.id} song={track} onPlay={() => handlePlaySong(track)} />
                ))}
              </div>
            )}
          </section>
        </main>
      </div>

      {/* Mobile Bottom Navigation */}
      <MobileBottomNav />
      
    </div>
  );
}