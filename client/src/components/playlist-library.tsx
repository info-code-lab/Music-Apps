import { Button } from "@/components/ui/button";
import { Grid3X3, List, Plus } from "lucide-react";
import PlaylistCard from "@/components/playlist-card";
import { Skeleton } from "@/components/ui/skeleton";
import type { Playlist } from "@shared/schema";

interface PlaylistLibraryProps {
  playlists: Playlist[];
  isLoading: boolean;
  onViewPlaylist: (playlist: Playlist) => void;
  onCreatePlaylist: () => void;
  searchQuery: string;
}

export default function PlaylistLibrary({ 
  playlists, 
  isLoading, 
  onViewPlaylist,
  onCreatePlaylist,
  searchQuery 
}: PlaylistLibraryProps) {

  if (isLoading) {
    return (
      <section className="px-6 pb-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold text-foreground mb-2 font-sans">Playlists</h2>
            <p className="text-muted-foreground font-serif">Loading playlists...</p>
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
            {searchQuery ? `Playlist Search Results for "${searchQuery}"` : "Playlists"}
          </h2>
          <p className="text-muted-foreground font-serif">
            {searchQuery 
              ? `Found ${playlists.length} playlists`
              : "Create and manage your music playlists"
            }
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Button 
            onClick={onCreatePlaylist}
            className="bg-primary text-primary-foreground hover:bg-primary/90"
            data-testid="button-create-playlist"
          >
            <Plus className="w-4 h-4 mr-2" />
            Create Playlist
          </Button>
          <Button variant="secondary" size="sm" data-testid="button-grid-view">
            <Grid3X3 className="w-4 h-4" />
          </Button>
          <Button variant="ghost" size="sm" data-testid="button-list-view">
            <List className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {playlists.length === 0 ? (
        <div className="text-center py-12">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-muted flex items-center justify-center">
            <Grid3X3 className="w-8 h-8 text-muted-foreground" />
          </div>
          <h3 className="text-lg font-semibold text-foreground mb-2 font-sans">
            {searchQuery ? "No playlists found" : "No playlists yet"}
          </h3>
          <p className="text-muted-foreground font-serif">
            {searchQuery 
              ? "Try adjusting your search query"
              : "Create your first playlist to get started"
            }
          </p>
          {!searchQuery && (
            <Button 
              onClick={onCreatePlaylist}
              className="mt-4 bg-primary text-primary-foreground hover:bg-primary/90"
              data-testid="button-create-first-playlist"
            >
              <Plus className="w-4 h-4 mr-2" />
              Create Your First Playlist
            </Button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {playlists.map((playlist) => (
            <PlaylistCard 
              key={playlist.id} 
              playlist={playlist} 
              onViewPlaylist={onViewPlaylist}
              songCount={Math.floor(Math.random() * 20) + 1} // TODO: Get actual song count
            />
          ))}
        </div>
      )}
    </section>
  );
}