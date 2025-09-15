import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import AlbumLibrary from "@/components/album-library";
import MusicLibrary from "@/components/music-library";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, Bell, User, ArrowLeft } from "lucide-react";
import type { Album, Track, LegacyTrack } from "@shared/schema";
import { useMusicPlayer } from "@/hooks/use-music-player";
import { useAuth } from "@/hooks/use-auth";
import { PhoneLoginModal } from "@/components/PhoneLoginModal";

export default function Albums() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedAlbum, setSelectedAlbum] = useState<Album | null>(null);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [isMobileOrTablet, setIsMobileOrTablet] = useState(false);
  const { currentSong, playTrack } = useMusicPlayer();
  const { user } = useAuth();

  // Detect mobile/tablet screen size
  useEffect(() => {
    const checkScreenSize = () => {
      setIsMobileOrTablet(window.innerWidth < 1024); // lg breakpoint
    };
    
    checkScreenSize();
    window.addEventListener('resize', checkScreenSize);
    
    return () => window.removeEventListener('resize', checkScreenSize);
  }, []);

  // Show login modal for non-authenticated users on mobile/tablet
  useEffect(() => {
    if (!user && isMobileOrTablet) {
      setShowLoginModal(true);
    }
  }, [user, isMobileOrTablet]);

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
      {/* Login Modal for Mobile/Tablet */}
      <PhoneLoginModal
        isOpen={showLoginModal}
        onOpenChange={setShowLoginModal}
        onSuccess={() => {
          setShowLoginModal(false);
        }}
      />
      <main className="overflow-auto custom-scrollbar">
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