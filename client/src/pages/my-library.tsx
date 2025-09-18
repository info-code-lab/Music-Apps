import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { 
  Heart, 
  Album, 
  Mic, 
  ListMusic, 
  Shuffle, 
  ChevronRight, 
  Settings,
  MoreHorizontal,
  Play
} from "lucide-react";
import { useMusicPlayer } from "@/hooks/use-music-player";
import type { Song, LegacyTrack } from "@shared/schema";

export default function MyLibrary() {
  const [, setLocation] = useLocation();
  const { currentSong, playTrack } = useMusicPlayer();

  // Get data for counts
  const { data: songs = [] } = useQuery<Song[]>({
    queryKey: ["/api/songs"],
  });

  const { data: artists = [] } = useQuery<{ id: string; name: string }[]>({
    queryKey: ["/api/artists"],
  });

  const { data: albums = [] } = useQuery<{ id: string; title: string }[]>({
    queryKey: ["/api/albums"],
  });

  const { data: favorites = [] } = useQuery<Song[]>({
    queryKey: ["/api/favorites"],
  });

  // Use actual data instead of mock data
  const likedSongsCount = favorites.length;
  const artistsCount = artists.length;
  const albumsCount = albums.length;
  const playlistsCount = 0;

  // Get recent songs for history (last 2 songs)
  const recentSongs = songs.slice(0, 2);

  const convertToLegacyTrack = (song: Song): LegacyTrack => ({
    id: song.id,
    title: song.title,
    artist: (song as any).artist || "Unknown Artist",
    category: (song as any).category || "Music",
    duration: song.duration,
    url: song.filePath ? encodeURI(song.filePath) : "",
    artwork: song.coverArt,
    isFavorite: false,
    uploadType: "file",
    createdAt: song.createdAt || undefined,
  });

  const handlePlaySong = (song: Song) => {
    const track = convertToLegacyTrack(song);
    playTrack(track);
  };

  const handleShuffleAll = () => {
    if (songs.length > 0) {
      const randomIndex = Math.floor(Math.random() * songs.length);
      handlePlaySong(songs[randomIndex]);
    }
  };

  const LibraryItem = ({ 
    icon: Icon, 
    title, 
    count, 
    onClick, 
    actionButton 
  }: {
    icon: any;
    title: string;
    count?: number;
    onClick?: () => void;
    actionButton?: React.ReactNode;
  }) => (
    <div 
      className="flex items-center justify-between p-4 hover:bg-accent/50 transition-colors cursor-pointer"
      onClick={onClick}
      data-testid={`library-item-${title.toLowerCase().replace(/\s+/g, '-')}`}
    >
      <div className="flex items-center space-x-4">
        <Icon className="w-6 h-6 text-muted-foreground" />
        <span className="font-medium text-foreground">{title}</span>
      </div>
      <div className="flex items-center space-x-2">
        {actionButton}
        {count !== undefined && (
          <span className="text-muted-foreground text-sm">{count}</span>
        )}
        <ChevronRight className="w-4 h-4 text-muted-foreground" />
      </div>
    </div>
  );

  const HistoryItem = ({ song }: { song: Song }) => (
    <div className="flex items-center space-x-3 p-2 hover:bg-accent/50 rounded-lg transition-colors">
      <div className="relative group">
        <div className="w-12 h-12 bg-muted rounded-lg flex items-center justify-center overflow-hidden">
          {song.coverArt ? (
            <img 
              src={song.coverArt} 
              alt={song.title}
              className="w-full h-full object-cover"
            />
          ) : (
            <Heart className="w-6 h-6 text-muted-foreground" />
          )}
        </div>
        <Button
          size="sm"
          variant="secondary"
          className="absolute inset-0 opacity-0 group-hover:opacity-100 bg-black/50 hover:bg-black/60 transition-opacity"
          onClick={() => handlePlaySong(song)}
          data-testid={`button-play-history-${song.id}`}
        >
          <Play className="w-4 h-4" />
        </Button>
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-medium text-foreground truncate">{song.title}</p>
        <p className="text-sm text-muted-foreground truncate">
          Unknown Artist • 3 Songs • 9 Hours Ago
        </p>
      </div>
      <Button variant="ghost" size="sm" className="p-1">
        <MoreHorizontal className="w-4 h-4" />
      </Button>
    </div>
  );

  return (
    <div className="h-full">
      <main className="h-full">
        <div className="p-4 md:p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-2xl md:text-3xl font-bold text-foreground font-sans">
              My Library
            </h1>
            <Button variant="ghost" size="sm" className="p-2" data-testid="button-library-settings">
              <Settings className="w-5 h-5" />
            </Button>
          </div>

          {/* Library Sections */}
          <div className="space-y-0 mb-6">
            <LibraryItem
              icon={Heart}
              title="Liked Songs"
              count={likedSongsCount}
              onClick={() => setLocation("/favorites")}
            />
            <LibraryItem
              icon={Album}
              title="Albums"
              count={albumsCount}
              onClick={() => setLocation("/albums")}
            />
            <LibraryItem
              icon={Mic}
              title="Artists"
              count={artistsCount}
              onClick={() => setLocation("/artists")}
            />
            <LibraryItem
              icon={ListMusic}
              title="Playlists"
              count={playlistsCount}
              onClick={() => setLocation("/playlists")}
              actionButton={
                <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs px-3 py-1">
                  + New
                </Button>
              }
            />
          </div>

          {/* Shuffle All Button */}
          <div className="flex justify-center mb-8">
            <Button
              onClick={handleShuffleAll}
              className="bg-emerald-600 hover:bg-emerald-700 text-white px-8 py-3 rounded-full font-medium"
              data-testid="button-shuffle-all"
            >
              <Shuffle className="w-5 h-5 mr-2" />
              Shuffle All
            </Button>
          </div>

          {/* History Section */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-foreground">History</h2>
              <Button variant="ghost" className="text-emerald-600 hover:text-emerald-700" data-testid="button-clear-history">
                Clear
              </Button>
            </div>

            <div className="space-y-2">
              {recentSongs.map((song) => (
                <HistoryItem key={song.id} song={song} />
              ))}
            </div>

            {recentSongs.length > 0 && (
              <Button
                variant="ghost"
                className="w-full justify-between text-foreground hover:bg-accent/50"
                data-testid="button-more-history"
              >
                <span>More History</span>
                <ChevronRight className="w-4 h-4" />
              </Button>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}