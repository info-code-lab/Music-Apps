import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useRoute, useLocation } from "wouter";
import { useMusicPlayer } from "@/hooks/use-music-player";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ArrowLeft, Play, Heart, Music, Clock, User, Globe, Lock } from "lucide-react";
import toast from "react-hot-toast";
import { convertToLegacyTrack } from "@/lib/song-utils";
import type { Playlist, Song } from "@shared/schema";

export default function PlaylistDetail() {
  const [, setLocation] = useLocation();
  const [match, params] = useRoute("/playlists/:id");
  const { playTrack, currentSong, isPlaying } = useMusicPlayer();
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const playlistId = params?.id;

  if (!match || !playlistId) {
    return <div>Playlist not found</div>;
  }

  const { data: playlist, isLoading: isLoadingPlaylist } = useQuery<Playlist>({
    queryKey: ["/api/playlists", playlistId],
  });

  const { data: playlistSongs = [], isLoading: isLoadingSongs } = useQuery<Song[]>({
    queryKey: ["/api/playlists", playlistId, "songs"],
    enabled: !!playlist,
  });

  // Get user's liked playlists to show like status
  const { data: likedPlaylists = [] } = useQuery<Playlist[]>({
    queryKey: ["/api/playlists/liked"],
    enabled: !!user,
  });

  const isLiked = likedPlaylists.some(p => p.id === playlistId);

  // Like/Unlike playlist mutation
  const likePlaylistMutation = useMutation({
    mutationFn: async ({ isLiked }: { isLiked: boolean }) => {
      if (isLiked) {
        const response = await fetch(`/api/playlists/${playlistId}/like`, {
          method: "DELETE",
          headers: {
            "Content-Type": "application/json",
          },
        });
        if (!response.ok) {
          throw new Error('Failed to unlike playlist');
        }
        return response;
      } else {
        const response = await fetch(`/api/playlists/${playlistId}/like`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
        });
        if (!response.ok) {
          throw new Error('Failed to like playlist');
        }
        return response;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/playlists/liked"] });
      toast.success(isLiked ? "Removed from liked playlists" : "Added to liked playlists");
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to update playlist");
    },
  });

  const handleLikePlaylist = async () => {
    if (!user) {
      toast.error("Please login to like playlists");
      return;
    }
    
    likePlaylistMutation.mutate({ isLiked });
  };

  const handlePlaySong = (song: Song) => {
    const legacyTrack = convertToLegacyTrack(song);
    playTrack(legacyTrack);
  };

  const handlePlayAll = () => {
    if (playlistSongs.length > 0) {
      const legacyTrack = convertToLegacyTrack(playlistSongs[0]);
      playTrack(legacyTrack);
    }
  };

  if (isLoadingPlaylist) {
    return (
      <div className="h-full">
        <div className="p-4 md:p-8">
          <Button 
            variant="ghost" 
            onClick={() => setLocation("/top-playlists")}
            className="mb-4"
            data-testid="button-back-to-playlists"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Top Playlists
          </Button>
          <div className="flex flex-col md:flex-row gap-6">
            <Skeleton className="w-full md:w-64 h-64 rounded-lg" />
            <div className="flex-1 space-y-4">
              <Skeleton className="h-8 w-64" />
              <Skeleton className="h-6 w-96" />
              <Skeleton className="h-12 w-40" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!playlist) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center">
          <Music className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
          <h2 className="text-2xl font-semibold mb-2">Playlist not found</h2>
          <p className="text-muted-foreground mb-4">This playlist may have been deleted or made private.</p>
          <Button onClick={() => setLocation("/top-playlists")} data-testid="button-back-to-playlists">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Top Playlists
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full">
      <div className="p-4 md:p-8">
        <Button 
          variant="ghost" 
          onClick={() => setLocation("/top-playlists")}
          className="mb-4"
          data-testid="button-back-to-playlists"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Top Playlists
        </Button>

        <div className="flex flex-col md:flex-row gap-6 mb-8">
          {/* Playlist Cover */}
          <div className="w-full md:w-64 h-64 bg-gradient-to-br from-primary/20 to-secondary/20 rounded-lg flex items-center justify-center">
            <Music className="w-24 h-24 text-muted-foreground" />
          </div>

          {/* Playlist Info */}
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              {playlist.isPublic ? (
                <Globe className="w-4 h-4 text-muted-foreground" />
              ) : (
                <Lock className="w-4 h-4 text-muted-foreground" />
              )}
              <span className="text-sm text-muted-foreground">
                {playlist.isPublic ? 'Public Playlist' : 'Private Playlist'}
              </span>
            </div>
            
            <h1 className="text-4xl font-bold text-foreground mb-4" data-testid="text-playlist-title">
              {playlist.name}
            </h1>
            
            {playlist.description && (
              <p className="text-muted-foreground mb-4" data-testid="text-playlist-description">
                {playlist.description}
              </p>
            )}

            <div className="flex items-center gap-2 mb-6 text-sm text-muted-foreground">
              <User className="w-4 h-4" />
              <span>Created by user</span>
              <span>•</span>
              <span data-testid="text-song-count">{playlistSongs.length} songs</span>
            </div>

            <div className="flex items-center gap-4">
              <Button 
                onClick={handlePlayAll}
                disabled={playlistSongs.length === 0}
                className="bg-primary text-primary-foreground hover:bg-primary/90"
                data-testid="button-play-all"
              >
                <Play className="w-4 h-4 mr-2" />
                Play All
              </Button>
              
              <Button 
                variant="outline" 
                onClick={handleLikePlaylist}
                disabled={likePlaylistMutation.isPending}
                className={isLiked ? "text-red-500 border-red-500 hover:bg-red-50" : ""}
                data-testid="button-like-playlist"
              >
                <Heart className={`w-4 h-4 mr-2 ${isLiked ? 'fill-current' : ''}`} />
                {isLiked ? 'Liked' : 'Like'}
              </Button>
            </div>
          </div>
        </div>

        {/* Songs List */}
        <div>
          <h2 className="text-2xl font-semibold mb-4">Songs</h2>
          
          {isLoadingSongs ? (
            <div className="space-y-2">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="flex items-center gap-4 p-4 rounded-lg">
                  <Skeleton className="w-12 h-12 rounded" />
                  <div className="flex-1">
                    <Skeleton className="h-5 w-48 mb-2" />
                    <Skeleton className="h-4 w-32" />
                  </div>
                  <Skeleton className="h-4 w-12" />
                </div>
              ))}
            </div>
          ) : playlistSongs.length > 0 ? (
            <ScrollArea className="h-[400px]">
              <div className="space-y-1">
                {playlistSongs.map((song, index) => (
                  <div 
                    key={song.id} 
                    className="flex items-center gap-4 p-4 rounded-lg hover:bg-muted/50 transition-colors group cursor-pointer"
                    onClick={() => handlePlaySong(song)}
                    data-testid={`row-song-${song.id}`}
                  >
                    <div className="w-8 text-center text-muted-foreground">
                      {currentSong?.id === song.id && isPlaying ? (
                        <div className="w-4 h-4 mx-auto">
                          <div className="w-1 h-4 bg-primary mx-auto animate-pulse"></div>
                        </div>
                      ) : (
                        <span className="group-hover:hidden">{index + 1}</span>
                      )}
                      <Play className="w-4 h-4 hidden group-hover:block mx-auto" />
                    </div>
                    
                    <div className="w-12 h-12 bg-gradient-to-br from-primary/20 to-secondary/20 rounded flex items-center justify-center">
                      <Music className="w-6 h-6 text-muted-foreground" />
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <h3 className="font-medium text-foreground truncate" data-testid={`text-song-title-${song.id}`}>
                        {song.title}
                      </h3>
                      <p className="text-sm text-muted-foreground truncate" data-testid={`text-song-artist-${song.id}`}>
                        Unknown Artist
                      </p>
                    </div>
                    
                    <div className="flex items-center gap-4 text-muted-foreground">
                      <Clock className="w-4 h-4" />
                      <span className="text-sm" data-testid={`text-song-duration-${song.id}`}>
                        {Math.floor((song.duration || 0) / 60)}:
                        {String(Math.floor((song.duration || 0) % 60)).padStart(2, '0')}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          ) : (
            <div className="text-center py-12">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-muted flex items-center justify-center">
                <Music className="w-8 h-8 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-semibold text-foreground mb-2">
                No songs in this playlist
              </h3>
              <p className="text-muted-foreground">
                This playlist is empty.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}