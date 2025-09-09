import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import Sidebar from "@/components/sidebar";
import MobileHeader from "@/components/mobile-header";
import MobileBottomNav from "@/components/mobile-bottom-nav";
import MobileDrawer from "@/components/mobile-drawer";
import ArtistLibrary from "@/components/artist-library";
import MusicLibrary from "@/components/music-library";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, Bell, User, ArrowLeft } from "lucide-react";
import type { Artist, Track, LegacyTrack } from "@shared/schema";
import { useMusicPlayer } from "@/hooks/use-music-player";

export default function Artists() {
  const [searchQuery, setSearchQuery] = useState("");
  const [isMobileDrawerOpen, setIsMobileDrawerOpen] = useState(false);
  const [selectedArtist, setSelectedArtist] = useState<Artist | null>(null);
  const { currentSong, playTrack } = useMusicPlayer();

  const { data: artists = [], isLoading } = useQuery<Artist[]>({
    queryKey: ["/api/artists"],
    enabled: !searchQuery,
  });

  const { data: searchResults = [] } = useQuery<Artist[]>({
    queryKey: ["/api/artists/search", { q: searchQuery }],
    enabled: !!searchQuery,
  });

  // Query for artist's songs when an artist is selected
  const { data: artistSongs = [], isLoading: isLoadingSongs } = useQuery<Track[]>({
    queryKey: ["/api/songs/artist", selectedArtist?.id],
    enabled: !!selectedArtist,
  });

  const displayArtists = searchQuery ? searchResults : artists;

  const handleViewArtist = (artist: Artist) => {
    setSelectedArtist(artist);
    setSearchQuery(""); // Clear search when viewing artist
  };

  const handleBackToArtists = () => {
    setSelectedArtist(null);
  };

  const handlePlaySong = (song: LegacyTrack) => {
    playTrack(song);
  };

  // Convert Track to LegacyTrack format for compatibility
  const convertToLegacyTrack = (song: Track): LegacyTrack => ({
    id: song.id,
    title: song.title,
    artist: selectedArtist?.name || "Unknown Artist",
    category: "Music", 
    duration: song.duration || 0,
    url: song.filePath ? encodeURI(song.filePath) : "",
    artwork: song.coverArt || null,
    isFavorite: false, 
    uploadType: "file",
    createdAt: song.createdAt || undefined,
  });

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
            recentSongs={[]}
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
                    placeholder="Search artists..."
                    className="pl-10 bg-input border-border font-serif"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    data-testid="input-search-artists"
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
            {selectedArtist ? (
              // Show selected artist's songs
              <>
                <div className="mb-4 md:mb-6">
                  <Button 
                    variant="ghost" 
                    onClick={handleBackToArtists}
                    className="mb-4 p-2 hover:bg-accent"
                    data-testid="button-back-to-artists"
                  >
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Back to Artists
                  </Button>
                  <div className="flex items-center gap-4 mb-4">
                    <img 
                      src={selectedArtist.profilePic || 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=300'} 
                      alt={selectedArtist.name}
                      className="w-20 h-20 rounded-full object-cover" 
                    />
                    <div>
                      <h2 className="text-xl md:text-2xl font-bold text-foreground mb-1 font-sans">
                        {selectedArtist.name}
                      </h2>
                      <p className="text-sm md:text-base text-muted-foreground font-serif">
                        {artistSongs.length} songs
                      </p>
                    </div>
                  </div>
                </div>
                
                <MusicLibrary
                  songs={artistSongs}
                  isLoading={isLoadingSongs}
                  selectedCategory="All Categories"
                  onCategoryChange={() => {}}
                  onPlaySong={(song) => handlePlaySong(convertToLegacyTrack(song))}
                  searchQuery=""
                />
              </>
            ) : (
              // Show artists list
              <>
                <div className="mb-4 md:mb-6">
                  <h2 className="text-xl md:text-2xl font-bold text-foreground mb-1 md:mb-2 font-sans">
                    Artists
                  </h2>
                  <p className="text-sm md:text-base text-muted-foreground font-serif">
                    Discover amazing music artists
                  </p>
                </div>
                
                {/* Artists Library */}
                <ArtistLibrary
                  artists={displayArtists}
                  isLoading={isLoading}
                  onViewArtist={handleViewArtist}
                  searchQuery={searchQuery}
                />
              </>
            )}
          </section>
        </main>
      </div>

      {/* Mobile Bottom Navigation */}
      <MobileBottomNav />
    </div>
  );
}