import { useState } from "react";
import { useLocation } from "wouter";
import MusicLibrary from "@/components/music-library";
import UnifiedSearchResults from "@/components/unified-search-results";
import SectionedSearchResults from "@/components/sectioned-search-results";
import { useMusicPlayer } from "@/hooks/use-music-player";
import { useQuery } from "@tanstack/react-query";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, Bell, User, ArrowLeft, Music } from "lucide-react";
import type { Track, LegacyTrack, Artist, Album, Genre, SearchResult } from "@shared/schema";

interface HomeProps {
  searchQuery?: string;
  onSearch?: (query: string) => void;
  searchResults?: SearchResult;
}

export default function Home({ searchQuery: externalSearchQuery = "", onSearch, searchResults: externalSearchResults }: HomeProps) {
  const [internalSearchQuery, setInternalSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All Categories");
  const [filterBy, setFilterBy] = useState<{type: 'none' | 'artist' | 'album' | 'genre', id?: string}>({type: 'none'});
  const { currentSong, playTrack } = useMusicPlayer();
  const [, setLocation] = useLocation();

  // Use external search if provided, otherwise use internal
  const searchQuery = externalSearchQuery || internalSearchQuery;
  const setQuery = onSearch ?? setInternalSearchQuery;
  const handleSearch = (q: string) => { 
    setQuery(q); 
    if (!q) setFilterBy({ type: 'none' }); 
  };

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

  // Use search results from props (comes from useSearch hook in App.tsx)
  const searchResults = externalSearchResults;

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


  const handleViewArtist = (artist: Artist) => {
    handleSearch(""); // Clear search
    setSelectedCategory("All Categories"); // Reset category
    setFilterBy({type: 'artist', id: artist.id});
  };

  const handleViewAlbum = (album: Album) => {
    handleSearch(""); // Clear search
    setSelectedCategory("All Categories"); // Reset category
    setFilterBy({type: 'album', id: album.id});
  };

  const handleCategorySelect = (categoryName: string) => {
    handleSearch(""); // Clear search
    setFilterBy({type: 'none'}); // Clear any other filters
    setSelectedCategory(categoryName);
  };

  const handleBackToHome = () => {
    setSelectedCategory("All Categories");
    setFilterBy({type: 'none'});
    handleSearch("");
  };

  const handleGenreSelect = (genre: Genre) => {
    handleSearch(""); // Clear search
    setSelectedCategory("All Categories"); // Reset category
    setFilterBy({type: 'genre', id: genre.id});
  };

  return (
    <div className="min-h-screen">
      <div className="lg:min-h-screen">
        <main className="overflow-auto custom-scrollbar">
          {searchQuery && searchResults ? (
            <div className="px-4 md:px-6 pb-6">
              {/* Desktop: Sectioned Search Results */}
              <div className="hidden md:block">
                <SectionedSearchResults 
                  searchResults={searchResults}
                  searchQuery={searchQuery}
                  onPlaySong={(song: LegacyTrack) => handlePlaySong(song)}
                  onViewArtist={handleViewArtist}
                  onViewAlbum={handleViewAlbum}
                />
              </div>
              
              {/* Mobile: Unified Search Results */}
              <div className="block md:hidden">
                <UnifiedSearchResults 
                  searchResults={searchResults}
                  searchQuery={searchQuery}
                  onPlaySong={(song: LegacyTrack) => handlePlaySong(song)}
                  onViewArtist={handleViewArtist}
                  onViewAlbum={handleViewAlbum}
                  onGenreSelect={handleGenreSelect}
                />
              </div>
            </div>
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
