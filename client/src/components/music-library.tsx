import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Grid3X3, List } from "lucide-react";
import MusicCard from "@/components/music-card";
import { Skeleton } from "@/components/ui/skeleton";
import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useAuth } from "@/hooks/use-auth";
import type { Track, LegacyTrack } from "@shared/schema";

interface MusicLibraryProps {
  songs: Track[];
  isLoading: boolean;
  selectedCategory: string;
  onCategoryChange: (category: string) => void;
  onPlaySong: (song: Track) => void;
  searchQuery: string;
}

export default function MusicLibrary({ 
  songs, 
  isLoading, 
  selectedCategory, 
  onCategoryChange, 
  onPlaySong,
  searchQuery 
}: MusicLibraryProps) {
  const { user } = useAuth();

  // Fetch categories from database
  const { data: genres = [] } = useQuery<{id: string; name: string}[]>({
    queryKey: ["/api/genres"],
    queryFn: async () => {
      const res = await apiRequest("/api/genres", "GET");
      return res.json();
    }
  });

  // Fetch user's favorites to determine isFavorite status
  const { data: favorites = [] } = useQuery<{id: string}[]>({
    queryKey: ["/api/favorites"],
    enabled: !!user,
  });

  const favoriteIds = new Set(favorites.map(fav => fav.id));

  // Create categories from database genres, adding "All Categories" at the beginning
  const categories = ["All Categories", ...genres.map(genre => genre.name)];

  if (isLoading) {
    return (
      <section className="px-6 pb-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <p className="text-muted-foreground font-serif">Loading songs...</p>
          </div>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 md:gap-6">
          {Array.from({ length: 8 }).map((_, i) => (
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
    );
  }

  return (
    <section className="px-4 md:px-6 pb-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-4 md:mb-6">
        <div className="mb-4 md:mb-0">
          {searchQuery && (
            <>
              <h2 className="text-xl md:text-2xl font-bold text-foreground mb-1 md:mb-2 font-sans">
                Search Results
              </h2>
              <p className="text-sm md:text-base text-muted-foreground font-serif">
                Found {songs.length} songs for "{searchQuery}"
              </p>
            </>
          )}
        </div>
        <div className="flex items-center justify-between md:justify-end md:space-x-2">
          {/* Mobile: Only show category select */}
          <div className="md:hidden flex-1">
            <Select value={selectedCategory} onValueChange={onCategoryChange}>
              <SelectTrigger className="w-full bg-input border-border font-mono text-sm" data-testid="select-category-mobile">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {categories.map((category) => (
                  <SelectItem key={category} value={category}>
                    {category}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          {/* Desktop: Show all controls */}
          <div className="hidden md:flex items-center space-x-2">
            <Select value={selectedCategory} onValueChange={onCategoryChange}>
              <SelectTrigger className="w-[180px] bg-input border-border font-mono text-sm" data-testid="select-category">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {categories.map((category) => (
                  <SelectItem key={category} value={category}>
                    {category}
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
          </div>
        </div>
      </div>

      {songs.length === 0 ? (
        <div className="text-center py-12">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-muted flex items-center justify-center">
            <Grid3X3 className="w-8 h-8 text-muted-foreground" />
          </div>
          <h3 className="text-lg font-semibold text-foreground mb-2 font-sans">
            {searchQuery ? "No songs found" : "No songs yet"}
          </h3>
          <p className="text-muted-foreground font-serif">
            {searchQuery 
              ? "Try adjusting your search query or browse by category"
              : "Upload some music to get started"
            }
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 md:gap-6">
          {songs.map((song) => (
            <MusicCard 
              key={song.id} 
              song={song} 
              onPlay={() => onPlaySong(song)}
            />
          ))}
        </div>
      )}
    </section>
  );
}
