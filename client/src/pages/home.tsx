import { useState } from "react";
import { useLocation } from "wouter";
import MobileHeader from "@/components/mobile-header";
import MobileDrawer from "@/components/mobile-drawer";
import MusicLibrary from "@/components/music-library";
import SearchResults from "@/components/search-results";
import { useMusicPlayer } from "@/hooks/use-music-player";
import { useQuery } from "@tanstack/react-query";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, Bell, User, ArrowLeft, Music } from "lucide-react";
import type { Track, LegacyTrack, Artist, Album, Genre } from "@shared/schema";

// Define unified search result type
interface SearchResult {
  songs: Track[];
  artists: Artist[];
  albums: Album[];
  genres: Genre[];
  total: number;
  query: string;
}

export default function Home() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All Categories");
  const [isMobileDrawerOpen, setIsMobileDrawerOpen] = useState(false);
  const [filterBy, setFilterBy] = useState<{type: 'none' | 'artist' | 'album' | 'genre', id?: string}>({type: 'none'});
  const { currentSong, playTrack } = useMusicPlayer();
  const [, setLocation] = useLocation();

  const { data: songs = [], isLoading } = useQuery<Track[]>({
    queryKey: ["/api/songs"],
  });

  const { data: filteredSongs = [] } = useQuery<Track[]>({
    queryKey: ["/api/songs/genre", selectedCategory],
    enabled: selectedCategory !== "All Categories" && !searchQuery && filterBy.type === 'none',
  });

  // Query for filtered songs by artist, album, or genre
  const { data: filteredByArtist = [] } = useQuery<Track[]>({
    queryKey: ["/api/songs/artist", filterBy.id],
    enabled: filterBy.type === 'artist' && !!filterBy.id,
  });

  const { data: filteredByAlbum = [] } = useQuery<Track[]>({
    queryKey: ["/api/songs/album", filterBy.id],
    enabled: filterBy.type === 'album' && !!filterBy.id,
  });

  const { data: filteredByGenre = [] } = useQuery<Track[]>({
    queryKey: ["/api/songs/genre", filterBy.id],
    enabled: filterBy.type === 'genre' && !!filterBy.id,
  });

  const { data: searchResults } = useQuery<SearchResult>({
    queryKey: [`/api/search?q=${encodeURIComponent(searchQuery)}`],
    enabled: !!searchQuery,
  });

  const displaySongs = searchQuery 
    ? (searchResults?.songs || []) 
    : filterBy.type === 'artist' 
      ? filteredByArtist
      : filterBy.type === 'album'
        ? filteredByAlbum 
        : filterBy.type === 'genre'
          ? filteredByGenre
          : selectedCategory === "All Categories" 
            ? songs 
            : filteredSongs;

  const handlePlaySong = (song: LegacyTrack) => {
    console.log("handlePlaySong called with song:", song);
    playTrack(song, true); // true = user initiated
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
    if (query === "") {
      setFilterBy({type: 'none'}); // Clear any filters when search is cleared
    }
  };

  const handleViewArtist = (artist: Artist) => {
    setSearchQuery(""); // Clear search
    setSelectedCategory("All Categories"); // Reset category
    setFilterBy({type: 'artist', id: artist.id});
  };

  const handleViewAlbum = (album: Album) => {
    setSearchQuery(""); // Clear search
    setSelectedCategory("All Categories"); // Reset category
    setFilterBy({type: 'album', id: album.id});
  };

  const handleCategorySelect = (categoryName: string) => {
    setSearchQuery(""); // Clear search
    setFilterBy({type: 'none'}); // Clear any other filters
    setSelectedCategory(categoryName);
  };

  const handleBackToHome = () => {
    setSelectedCategory("All Categories");
    setFilterBy({type: 'none'});
    setSearchQuery("");
  };

  const handleGenreSelect = (genre: Genre) => {
    setSearchQuery(""); // Clear search
    setSelectedCategory("All Categories"); // Reset category
    setFilterBy({type: 'genre', id: genre.id});
  };

  return (
    <div className="min-h-screen">
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
        onCategorySelect={handleCategorySelect}
        selectedCategory={selectedCategory}
      />

      <div className="lg:min-h-screen">
        <main className="overflow-auto custom-scrollbar">
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
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="w-8 h-8 rounded-full bg-primary hover:bg-primary/90 p-0" 
                  data-testid="button-profile"
                  onClick={() => setLocation('/profile')}
                >
                  <User className="w-4 h-4 text-primary-foreground" />
                </Button>
              </div>
            </div>
          </header>

          {searchQuery && searchResults ? (
            <SearchResults 
              searchResults={searchResults}
              onPlaySong={(song) => handlePlaySong(convertToLegacyTrack(song))}
              onViewArtist={handleViewArtist}
              onViewAlbum={handleViewAlbum}
              onCategorySelect={handleCategorySelect}
              onGenreSelect={handleGenreSelect}
            />
          ) : selectedCategory !== "All Categories" || filterBy.type !== 'none' ? (
            // Show category/filter view
            <section className="px-4 md:px-6 pb-6">
              <div className="mb-4 md:mb-6">
                <Button 
                  variant="ghost" 
                  onClick={handleBackToHome}
                  className="mb-4 p-2 hover:bg-accent"
                  data-testid="button-back-to-home"
                >
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back to Home
                </Button>
                <div className="flex items-center gap-4 mb-4">
                  <div className="w-20 h-20 rounded-lg bg-primary/10 flex items-center justify-center">
                    <Music className="w-10 h-10 text-primary" />
                  </div>
                  <div>
                    <h2 className="text-xl md:text-2xl font-bold text-foreground mb-1 font-sans">
                      {filterBy.type === 'artist' ? 'Artist Songs' :
                       filterBy.type === 'album' ? 'Album Songs' :
                       filterBy.type === 'genre' ? 'Genre Songs' :
                       selectedCategory}
                    </h2>
                    <p className="text-sm md:text-base text-muted-foreground font-serif">
                      {displaySongs.length} songs
                    </p>
                  </div>
                </div>
              </div>
              
              <MusicLibrary
                songs={displaySongs}
                isLoading={isLoading}
                selectedCategory="All Categories"
                onCategoryChange={() => {}}
                onPlaySong={(song) => handlePlaySong(convertToLegacyTrack(song))}
                searchQuery=""
              />
            </section>
          ) : (
            <MusicLibrary
              songs={displaySongs}
              isLoading={isLoading}
              selectedCategory={selectedCategory}
              onCategoryChange={handleCategorySelect}
              onPlaySong={(song) => handlePlaySong(convertToLegacyTrack(song))}
              searchQuery={searchQuery}
            />
          )}
        </main>
      </div>
    </div>
  );
}
