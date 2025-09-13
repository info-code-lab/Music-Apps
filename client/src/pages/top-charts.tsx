import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { useMusicPlayer } from "@/hooks/use-music-player";
import MusicCard from "@/components/music-card";
import { Skeleton } from "@/components/ui/skeleton";
import { TrendingUp } from "lucide-react";
import type { Song, LegacyTrack } from "@shared/schema";

export default function TopCharts() {
  const [searchQuery, setSearchQuery] = useState("");
  const { currentSong, playTrack } = useMusicPlayer();
  const { user } = useAuth();

  const { data: songs = [], isLoading } = useQuery<Song[]>({
    queryKey: ["/api/songs"],
  });

  // Fetch user's favorites to determine isFavorite status
  const { data: favorites = [] } = useQuery<{id: string}[]>({
    queryKey: ["/api/favorites"],
    enabled: !!user,
  });

  const favoriteIds = new Set(favorites.map(fav => fav.id));

  // For now, just show all songs as "top charts" (can be enhanced with play counts later)
  const topCharts = songs;

  // Convert Song to LegacyTrack format for MusicCard compatibility
  const convertToLegacyTrack = (song: Song): LegacyTrack => ({
    id: song.id,
    title: song.title,
    artist: "Unknown Artist", // TODO: Get from artists table
    category: "Music", // TODO: Get from genres table
    duration: song.duration,
    url: song.filePath ? encodeURI(song.filePath) : "",
    artwork: song.coverArt,
    isFavorite: favoriteIds.has(song.id),
    uploadType: "file",
    createdAt: song.createdAt || undefined,
  });

  const handlePlaySong = (track: LegacyTrack) => {
    playTrack(track);
  };

  const filteredSongs = searchQuery 
    ? topCharts.filter(song => 
        song.title.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : topCharts;

  const displayLegacyTracks = filteredSongs.map(convertToLegacyTrack);

  return (
    <div className="h-full">
      <main className="h-full">
        <div className="p-4 md:p-8">
          <div className="flex items-center space-x-3 mb-6">
            <div className="w-12 h-12 rounded-full bg-gradient-to-r from-orange-500 to-red-500 flex items-center justify-center">
              <TrendingUp className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-foreground font-sans">
                Top Charts
              </h1>
              <p className="text-muted-foreground font-serif">
                Most popular tracks right now
              </p>
            </div>
          </div>

          {isLoading ? (
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
          ) : displayLegacyTracks.length > 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 md:gap-6">
              {displayLegacyTracks.map((track) => (
                <MusicCard
                  key={track.id}
                  song={track}
                  onPlay={() => handlePlaySong(track)}
                />
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-16">
              <div className="w-24 h-24 rounded-full bg-muted flex items-center justify-center mb-4">
                <TrendingUp className="w-12 h-12 text-muted-foreground" />
              </div>
              <h3 className="text-xl font-semibold text-foreground mb-2">
                No charts available
              </h3>
              <p className="text-muted-foreground text-center max-w-md">
                Popular songs will appear here based on play counts and trends.
              </p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}