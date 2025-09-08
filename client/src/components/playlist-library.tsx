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
    );
  }

  return (
    <>
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
          <div className="mt-6">
            <Button 
              onClick={onCreatePlaylist}
              className="bg-primary text-primary-foreground hover:bg-primary/90"
              data-testid="button-create-first-playlist"
            >
              <Plus className="w-4 h-4 mr-2" />
              Create Your First Playlist
            </Button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 md:gap-6">
          {playlists.map((playlist) => (
            <PlaylistCard
              key={playlist.id}
              playlist={playlist}
              onViewPlaylist={() => onViewPlaylist(playlist)}
            />
          ))}
        </div>
      )}
    </>
  );
}