import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Grid3X3, List } from "lucide-react";
import MusicCard from "@/components/music-card";
import { Skeleton } from "@/components/ui/skeleton";
import type { Track } from "@shared/schema";

interface MusicLibraryProps {
  tracks: Track[];
  isLoading: boolean;
  selectedCategory: string;
  onCategoryChange: (category: string) => void;
  onPlayTrack: (track: Track) => void;
  searchQuery: string;
}

export default function MusicLibrary({ 
  tracks, 
  isLoading, 
  selectedCategory, 
  onCategoryChange, 
  onPlayTrack,
  searchQuery 
}: MusicLibraryProps) {
  const categories = ["All Categories", "Rock", "Jazz", "Electronic", "Classical", "Folk", "Hip-Hop"];

  if (isLoading) {
    return (
      <section className="px-6 pb-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold text-foreground mb-2 font-sans">Your Library</h2>
            <p className="text-muted-foreground font-serif">Loading your music collection...</p>
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="bg-card rounded-lg border border-border overflow-hidden">
              <Skeleton className="w-full h-48" />
              <div className="p-4 space-y-2">
                <Skeleton className="h-6 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
                <div className="flex items-center justify-between">
                  <Skeleton className="h-6 w-16" />
                  <Skeleton className="h-4 w-4" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>
    );
  }

  return (
    <section className="px-6 pb-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-foreground mb-2 font-sans">
            {searchQuery ? `Search Results for "${searchQuery}"` : "Your Library"}
          </h2>
          <p className="text-muted-foreground font-serif">
            {searchQuery 
              ? `Found ${tracks.length} tracks`
              : "Browse and organize your music collection"
            }
          </p>
        </div>
        <div className="flex items-center space-x-2">
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

      {tracks.length === 0 ? (
        <div className="text-center py-12">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-muted flex items-center justify-center">
            <Grid3X3 className="w-8 h-8 text-muted-foreground" />
          </div>
          <h3 className="text-lg font-semibold text-foreground mb-2 font-sans">
            {searchQuery ? "No tracks found" : "No tracks yet"}
          </h3>
          <p className="text-muted-foreground font-serif">
            {searchQuery 
              ? "Try adjusting your search query or browse by category"
              : "Upload some music to get started"
            }
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {tracks.map((track) => (
            <MusicCard 
              key={track.id} 
              track={track} 
              onPlay={() => onPlayTrack(track)}
            />
          ))}
        </div>
      )}
    </section>
  );
}
