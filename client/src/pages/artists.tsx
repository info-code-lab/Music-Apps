import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import ArtistLibrary from "@/components/artist-library";
import MusicLibrary from "@/components/music-library";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, Bell, User, ArrowLeft } from "lucide-react";
import type { Artist, Track, LegacyTrack } from "@shared/schema";
import { useMusicPlayer } from "@/hooks/use-music-player";

export default function Artists() {
  const [searchQuery, setSearchQuery] = useState("");
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
    <div className="min-h-screen">
      <main className="overflow-auto custom-scrollbar">
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
  );
}