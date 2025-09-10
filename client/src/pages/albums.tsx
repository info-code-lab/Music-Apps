import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import MobileHeader from "@/components/mobile-header";
import MobileDrawer from "@/components/mobile-drawer";
import AlbumLibrary from "@/components/album-library";
import MusicLibrary from "@/components/music-library";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, Bell, User, ArrowLeft } from "lucide-react";
import type { Album, Track, LegacyTrack } from "@shared/schema";
import { useMusicPlayer } from "@/hooks/use-music-player";

export default function Albums() {
  const [searchQuery, setSearchQuery] = useState("");
  const [isMobileDrawerOpen, setIsMobileDrawerOpen] = useState(false);
  const [selectedAlbum, setSelectedAlbum] = useState<Album | null>(null);
  const { currentSong, playTrack } = useMusicPlayer();

  const { data: albums = [], isLoading } = useQuery<Album[]>({
    queryKey: ["/api/albums"],
    enabled: !searchQuery,
  });

  const { data: searchResults = [] } = useQuery<Album[]>({
    queryKey: ["/api/albums/search", { q: searchQuery }],
    enabled: !!searchQuery,
  });

  // Query for album's songs when an album is selected
  const { data: albumSongs = [], isLoading: isLoadingSongs } = useQuery<Track[]>({
    queryKey: ["/api/songs/album", selectedAlbum?.id],
    enabled: !!selectedAlbum,
  });

  const displayAlbums = searchQuery ? searchResults : albums;

  const handleViewAlbum = (album: Album) => {
    setSelectedAlbum(album);
    setSearchQuery(""); // Clear search when viewing album
  };

  const handleBackToAlbums = () => {
    setSelectedAlbum(null);
  };

  const handlePlaySong = (song: LegacyTrack) => {
    playTrack(song);
  };

  // Convert Track to LegacyTrack format for compatibility
  const convertToLegacyTrack = (song: Track): LegacyTrack => ({
    id: song.id,
    title: song.title,
    artist: "Unknown Artist", // TODO: Get from artists table
    category: "Music", 
    duration: song.duration || 0,
    url: song.filePath ? encodeURI(song.filePath) : "",
    artwork: song.coverArt || selectedAlbum?.coverArt || null,
    isFavorite: false, 
    uploadType: "file",
    createdAt: song.createdAt || undefined,
  });

  return (
    <div className="min-h-screen">
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

      <main className="overflow-auto custom-scrollbar">
          {/* Desktop Header with Search */}
          <header className="sticky top-0 z-10 bg-background/95 backdrop-blur-sm border-b border-border p-6 hidden md:block">
            <div className="flex items-center justify-between">
              <div className="flex-1 max-w-md">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                  <Input
                    type="text"
                    placeholder="Search albums..."
                    className="pl-10 bg-input border-border font-serif"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    data-testid="input-search-albums"
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

          {/* Page Content */}
          <section className="px-4 md:px-6 pb-6">
            {selectedAlbum ? (
              // Show selected album's songs
              <>
                <div className="mb-4 md:mb-6">
                  <Button 
                    variant="ghost" 
                    onClick={handleBackToAlbums}
                    className="mb-4 p-2 hover:bg-accent"
                    data-testid="button-back-to-albums"
                  >
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Back to Albums
                  </Button>
                  <div className="flex items-center gap-4 mb-4">
                    <img 
                      src={selectedAlbum.coverArt || 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=300'} 
                      alt={selectedAlbum.title}
                      className="w-20 h-20 rounded-lg object-cover" 
                    />
                    <div>
                      <h2 className="text-xl md:text-2xl font-bold text-foreground mb-1 font-sans">
                        {selectedAlbum.title}
                      </h2>
                      <p className="text-sm md:text-base text-muted-foreground font-serif">
                        {albumSongs.length} songs
                      </p>
                    </div>
                  </div>
                </div>
                
                <MusicLibrary
                  songs={albumSongs}
                  isLoading={isLoadingSongs}
                  selectedCategory="All Categories"
                  onCategoryChange={() => {}}
                  onPlaySong={(song) => handlePlaySong(convertToLegacyTrack(song))}
                  searchQuery=""
                />
              </>
            ) : (
              // Show albums list
              <>
                <div className="mb-4 md:mb-6">
                  <h2 className="text-xl md:text-2xl font-bold text-foreground mb-1 md:mb-2 font-sans">
                    Albums
                  </h2>
                  <p className="text-sm md:text-base text-muted-foreground font-serif">
                    Explore music albums and collections
                  </p>
                </div>
                
                {/* Albums Library */}
                <AlbumLibrary
                  albums={displayAlbums}
                  isLoading={isLoading}
                  onViewAlbum={handleViewAlbum}
                  searchQuery={searchQuery}
                />
              </>
            )}
          </section>
      </main>
    </div>
  );
}