import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useMusicPlayer } from "@/hooks/use-music-player";
import MusicCard from "@/components/music-card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  Search as SearchIcon, 
  TrendingUp, 
  Music, 
  Users, 
  Disc, 
  Clock,
  X
} from "lucide-react";
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

export default function Search() {
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState<'all' | 'songs' | 'artists' | 'albums'>('all');
  const { currentSong, playTrack } = useMusicPlayer();

  const { data: searchResults, isLoading } = useQuery<SearchResult>({
    queryKey: [`/api/search?q=${encodeURIComponent(searchQuery)}`],
    enabled: !!searchQuery && searchQuery.length > 2,
  });

  // Mock trending searches - TODO: Get from API
  const trendingSearches = [
    "Jazz music",
    "Classical piano",
    "Electronic beats",
    "Rock classics",
    "Hip-hop",
    "Folk acoustic"
  ];

  // Convert Track to LegacyTrack format for MusicCard compatibility
  const convertToLegacyTrack = (song: Track): LegacyTrack => ({
    id: song.id,
    title: song.title,
    artist: "Unknown Artist", // TODO: Get from artists table
    category: "Music", // TODO: Get from genres table
    duration: song.duration || 0,
    url: song.filePath ? encodeURI(song.filePath) : "",
    artwork: song.coverArt || null,
    isFavorite: false, // TODO: Get from favorites table
    uploadType: "file",
    createdAt: song.createdAt || undefined,
  });

  const handlePlaySong = (track: LegacyTrack) => {
    playTrack(track);
  };

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    setActiveTab('all');
  };

  const clearSearch = () => {
    setSearchQuery("");
  };

  const tabs = [
    { id: 'all', label: 'All', count: searchResults?.total || 0 },
    { id: 'songs', label: 'Songs', count: searchResults?.songs?.length || 0 },
    { id: 'artists', label: 'Artists', count: searchResults?.artists?.length || 0 },
    { id: 'albums', label: 'Albums', count: searchResults?.albums?.length || 0 },
  ];

  return (
    <div className="min-h-screen">
      {/* Main Content */}
      <main className="bg-background">
          <div className="p-4 md:p-8">
            {/* Desktop Search Bar */}
            <div className="hidden md:block mb-8">
              <div className="max-w-2xl mx-auto relative">
                <SearchIcon className="absolute left-4 top-1/2 transform -translate-y-1/2 text-muted-foreground w-5 h-5" />
                <Input
                  type="text"
                  placeholder="Search for songs, artists, albums..."
                  className="pl-12 pr-12 py-6 text-lg"
                  value={searchQuery}
                  onChange={(e) => handleSearch(e.target.value)}
                  data-testid="input-desktop-search"
                />
                {searchQuery && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="absolute right-2 top-1/2 transform -translate-y-1/2"
                    onClick={clearSearch}
                  >
                    <X className="w-4 h-4" />
                  </Button>
                )}
              </div>
            </div>

            {!searchQuery ? (
              /* Default State - No Search */
              <div className="max-w-4xl mx-auto">
                <div className="text-center mb-8">
                  <div className="w-24 h-24 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                    <SearchIcon className="w-12 h-12 text-primary" />
                  </div>
                  <h1 className="text-3xl font-bold text-foreground mb-2 font-sans">
                    Search Music
                  </h1>
                  <p className="text-muted-foreground font-serif">
                    Find your favorite songs, artists, and albums
                  </p>
                </div>

                {/* Trending Searches */}
                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center space-x-2 mb-4">
                      <TrendingUp className="w-5 h-5 text-primary" />
                      <h2 className="text-xl font-semibold text-foreground">
                        Trending Searches
                      </h2>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                      {trendingSearches.map((term) => (
                        <Button
                          key={term}
                          variant="outline"
                          className="justify-start"
                          onClick={() => handleSearch(term)}
                        >
                          <SearchIcon className="w-4 h-4 mr-2" />
                          {term}
                        </Button>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>
            ) : (
              /* Search Results */
              <div>
                {/* Search Header */}
                <div className="mb-6">
                  <h1 className="text-2xl font-bold text-foreground mb-2 font-sans">
                    Search Results
                  </h1>
                  <p className="text-muted-foreground font-serif">
                    {isLoading 
                      ? "Searching..." 
                      : `Found ${searchResults?.total || 0} results for "${searchQuery}"`
                    }
                  </p>
                </div>

                {/* Search Tabs */}
                <div className="flex space-x-1 mb-6 border-b border-border">
                  {tabs.map((tab) => (
                    <button
                      key={tab.id}
                      className={`px-4 py-2 font-medium text-sm rounded-t-lg transition-colors ${
                        activeTab === tab.id
                          ? "text-primary border-b-2 border-primary bg-primary/5"
                          : "text-muted-foreground hover:text-foreground"
                      }`}
                      onClick={() => setActiveTab(tab.id as any)}
                    >
                      {tab.label} {tab.count > 0 && `(${tab.count})`}
                    </button>
                  ))}
                </div>

                {/* Search Results Content */}
                {isLoading ? (
                  <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 md:gap-6">
                    {Array.from({ length: 8 }).map((_, i) => (
                      <div key={i} className="bg-card rounded-lg border border-border overflow-hidden">
                        <Skeleton className="w-full h-32 md:h-48" />
                        <div className="p-2 md:p-4 space-y-1 md:space-y-2">
                          <Skeleton className="h-4 md:h-6 w-3/4" />
                          <Skeleton className="h-3 md:h-4 w-1/2" />
                        </div>
                      </div>
                    ))}
                  </div>
                ) : searchResults && searchResults.total > 0 ? (
                  <div>
                    {/* Songs Results */}
                    {(activeTab === 'all' || activeTab === 'songs') && searchResults.songs?.length > 0 && (
                      <div className="mb-8">
                        {activeTab === 'all' && (
                          <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center">
                            <Music className="w-5 h-5 mr-2" />
                            Songs
                          </h3>
                        )}
                        <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 md:gap-6">
                          {searchResults.songs.map((song) => {
                            const track = convertToLegacyTrack(song);
                            return (
                              <MusicCard
                                key={track.id}
                                song={track}
                                onPlay={() => handlePlaySong(track)}
                              />
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {/* Artists Results */}
                    {(activeTab === 'all' || activeTab === 'artists') && searchResults.artists?.length > 0 && (
                      <div className="mb-8">
                        {activeTab === 'all' && (
                          <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center">
                            <Users className="w-5 h-5 mr-2" />
                            Artists
                          </h3>
                        )}
                        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                          {searchResults.artists.map((artist) => (
                            <Card key={artist.id} className="text-center p-4 hover:shadow-lg transition-shadow cursor-pointer">
                              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-primary to-purple-600 mx-auto mb-3 flex items-center justify-center">
                                <Users className="w-8 h-8 text-white" />
                              </div>
                              <h4 className="font-medium text-foreground truncate">
                                {artist.name}
                              </h4>
                              <p className="text-sm text-muted-foreground">
                                Artist
                              </p>
                            </Card>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Albums Results */}
                    {(activeTab === 'all' || activeTab === 'albums') && searchResults.albums?.length > 0 && (
                      <div className="mb-8">
                        {activeTab === 'all' && (
                          <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center">
                            <Disc className="w-5 h-5 mr-2" />
                            Albums
                          </h3>
                        )}
                        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                          {searchResults.albums.map((album) => (
                            <Card key={album.id} className="text-center p-4 hover:shadow-lg transition-shadow cursor-pointer">
                              <div className="w-16 h-16 rounded-lg bg-gradient-to-br from-orange-500 to-red-600 mx-auto mb-3 flex items-center justify-center">
                                <Disc className="w-8 h-8 text-white" />
                              </div>
                              <h4 className="font-medium text-foreground truncate">
                                {album.title}
                              </h4>
                              <p className="text-sm text-muted-foreground">
                                Album
                              </p>
                            </Card>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  /* No Results */
                  <div className="flex flex-col items-center justify-center py-16">
                    <div className="w-24 h-24 rounded-full bg-muted flex items-center justify-center mb-4">
                      <SearchIcon className="w-12 h-12 text-muted-foreground" />
                    </div>
                    <h3 className="text-xl font-semibold text-foreground mb-2">
                      No results found
                    </h3>
                    <p className="text-muted-foreground text-center max-w-md">
                      Try searching with different keywords or check your spelling.
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>
      </main>
    </div>
  );
}