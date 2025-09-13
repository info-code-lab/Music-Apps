import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useMusicPlayer } from "@/hooks/use-music-player";
import MusicCard from "@/components/music-card";
import { Skeleton } from "@/components/ui/skeleton";
import { Heart, Music } from "lucide-react";
import type { Song, LegacyTrack } from "@shared/schema";

export default function Favorites() {
  const [searchQuery, setSearchQuery] = useState("");
  const { currentSong, playTrack } = useMusicPlayer();

  // Get user's actual favorites from API
  const { data: favoriteSongs = [], isLoading } = useQuery<Song[]>({
    queryKey: ["/api/favorites"],
  });

  // Convert Song to LegacyTrack format for MusicCard compatibility
  const convertToLegacyTrack = (song: Song): LegacyTrack => ({
    id: song.id,
    title: song.title,
    artist: "Unknown Artist", // TODO: Get from artists table
    category: "Music", // TODO: Get from genres table
    duration: song.duration,
    url: song.filePath ? encodeURI(song.filePath) : "",
    artwork: song.coverArt,
    isFavorite: true, // All songs on this page are favorites
    uploadType: "file",
    createdAt: song.createdAt || undefined,
  });

  const handlePlaySong = (track: LegacyTrack) => {
    playTrack(track);
  };

  const filteredSongs = searchQuery 
    ? favoriteSongs.filter(song => 
        song.title.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : favoriteSongs;

  const displayLegacyTracks = filteredSongs.map(convertToLegacyTrack);

  return (
    <div className="h-full">
      {/* Main Content */}
      <main className="h-full">
          <div className="p-4 md:p-8">
            <div className="flex items-center space-x-3 mb-6">
              <div className="w-12 h-12 rounded-full bg-red-500 flex items-center justify-center">
                <Heart className="w-6 h-6 text-white fill-current" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-foreground font-sans">
                  Favorites
                </h1>
                <p className="text-muted-foreground font-serif">
                  Your liked songs
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
                  <Heart className="w-12 h-12 text-muted-foreground" />
                </div>
                <h3 className="text-xl font-semibold text-foreground mb-2">
                  No favorites yet
                </h3>
                <p className="text-muted-foreground text-center max-w-md">
                  Songs you like will appear here. Start exploring and tap the heart icon on songs you love!
                </p>
              </div>
            )}
          </div>
      </main>
    </div>
  );
}