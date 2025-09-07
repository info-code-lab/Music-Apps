import { Button } from "@/components/ui/button";
import { Grid3X3, List } from "lucide-react";
import AlbumCard from "@/components/album-card";
import { Skeleton } from "@/components/ui/skeleton";
import type { Album } from "@shared/schema";

interface AlbumLibraryProps {
  albums: Album[];
  isLoading: boolean;
  onViewAlbum: (album: Album) => void;
  searchQuery: string;
}

export default function AlbumLibrary({ 
  albums, 
  isLoading, 
  onViewAlbum,
  searchQuery 
}: AlbumLibraryProps) {

  if (isLoading) {
    return (
      <section className="px-6 pb-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold text-foreground mb-2 font-sans">Albums</h2>
            <p className="text-muted-foreground font-serif">Loading albums...</p>
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
            {searchQuery ? `Album Search Results for "${searchQuery}"` : "Albums"}
          </h2>
          <p className="text-muted-foreground font-serif">
            {searchQuery 
              ? `Found ${albums.length} albums`
              : "Explore music albums and collections"
            }
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Button variant="secondary" size="sm" data-testid="button-grid-view">
            <Grid3X3 className="w-4 h-4" />
          </Button>
          <Button variant="ghost" size="sm" data-testid="button-list-view">
            <List className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {albums.length === 0 ? (
        <div className="text-center py-12">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-muted flex items-center justify-center">
            <Grid3X3 className="w-8 h-8 text-muted-foreground" />
          </div>
          <h3 className="text-lg font-semibold text-foreground mb-2 font-sans">
            {searchQuery ? "No albums found" : "No albums yet"}
          </h3>
          <p className="text-muted-foreground font-serif">
            {searchQuery 
              ? "Try adjusting your search query"
              : "Albums will appear here as music is organized"
            }
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {albums.map((album) => (
            <AlbumCard 
              key={album.id} 
              album={album} 
              onViewAlbum={onViewAlbum}
            />
          ))}
        </div>
      )}
    </section>
  );
}