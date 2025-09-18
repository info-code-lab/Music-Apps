import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Play, Heart, Star, MessageCircle, MoreHorizontal, Plus, Share, Info, Album, Mic2, ListMusic } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { formatDuration } from "@/lib/audio-utils";
import { useMusicPlayer } from "@/hooks/use-music-player";
import { useAuth } from "@/hooks/use-auth";
import { PhoneLoginModal } from "@/components/PhoneLoginModal";
import toast from "react-hot-toast";
import type { Song, LegacyTrack } from "@shared/schema";

interface SongCardProps {
  song: Song;
  onPlay: () => void;
  showArtist?: boolean;
  showAlbum?: boolean;
}

export default function SongCard({ song, onPlay, showArtist = true, showAlbum = true }: SongCardProps) {
  const [isHovered, setIsHovered] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const { playTrack } = useMusicPlayer();

  const playMutation = useMutation({
    mutationFn: async () => {
      try {
        await apiRequest(`/api/songs/${song.id}/play`, "POST");
      } catch (error) {
        // Ignore auth errors for now - still trigger onPlay callback
        console.log("Play tracking failed (auth required):", error);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/songs"] });
      queryClient.invalidateQueries({ queryKey: ["/api/analytics/popular"] });
    },
  });

  const handlePlay = () => {
    onPlay();
    playMutation.mutate();
  };

  const handlePlayNow = () => {
    // Convert Song to LegacyTrack format for playTrack
    const legacyTrack = {
      id: song.id,
      title: song.title,
      artist: "Unknown Artist", // TODO: Get from artists table
      category: "Music",
      duration: song.duration,
      url: song.filePath ? encodeURI(song.filePath) : "",
      artwork: song.coverArt,
      isFavorite: false, // TODO: Get from favorites table
      uploadType: "file" as const,
      createdAt: song.createdAt || undefined,
    };
    playTrack(legacyTrack, true);
    onPlay();
    playMutation.mutate();
  };

  const handleAddToQueue = () => {
    // TODO: Implement queue functionality
    toast.success("Added to queue");
  };

  const handleAddToPlaylist = () => {
    if (!user) {
      setShowLoginModal(true);
      return;
    }
    // TODO: Implement add to playlist functionality
    toast.success("Add to playlist functionality coming soon");
  };

  const handleShare = async () => {
    const shareData = {
      title: song.title,
      text: `Check out "${song.title}"`,
      url: window.location.href
    };

    if (navigator.share) {
      try {
        await navigator.share(shareData);
        toast.success("Shared successfully");
      } catch (error) {
        // User cancelled sharing or error occurred
        copyToClipboard();
      }
    } else {
      copyToClipboard();
    }
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(`${song.title} - ${window.location.href}`)
      .then(() => toast.success("Link copied to clipboard"))
      .catch(() => toast.error("Failed to copy link"));
  };

  const handleSongDetails = () => {
    toast.success("Song details feature coming soon");
  };

  const handleMoreFromAlbum = () => {
    toast.success("More from album feature coming soon");
  };

  const handleMoreFromArtist = () => {
    toast.success("More from artist feature coming soon");
  };

  const [optimisticIsFavorite, setOptimisticIsFavorite] = useState(false);
  
  const favoriteMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest(`/api/songs/${song.id}/favorite`, "PATCH");
      return response.json();
    },
    onMutate: () => {
      // Optimistically update the UI immediately
      setOptimisticIsFavorite(prev => !prev);
    },
    onSuccess: () => {
      // Invalidate relevant queries
      queryClient.invalidateQueries({ queryKey: ["/api/songs"] });
      queryClient.invalidateQueries({ queryKey: ["/api/favorites"] });
      toast.success("Favorite updated");
    },
    onError: () => {
      // Revert optimistic update on error
      setOptimisticIsFavorite(prev => !prev);
      toast.error("Couldn't update favorites");
    },
  });

  const handleFavorite = () => {
    if (!user) {
      setShowLoginModal(true);
      return;
    }
    favoriteMutation.mutate();
  };
  
  const handleLoginSuccess = () => {
    setShowLoginModal(false);
    // After successful login, automatically perform the favorite action
    favoriteMutation.mutate();
  };

  return (
    <Card 
      className="overflow-hidden hover:shadow-lg transition-all duration-300 group cursor-pointer"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      data-testid={`card-song-${song.id}`}
    >
      <CardContent className="p-0">
        {/* Horizontal Layout for Songs Page */}
        <div className="flex">
          {/* Album Art - Smaller for horizontal layout */}
          <div className="relative flex-shrink-0">
            <img 
              src={song.coverArt || 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?ixlib=rb-4.0.3&auto=format&fit=crop&w=120&h=120'} 
              alt={song.title}
              className="w-16 h-16 md:w-20 md:h-20 object-cover" 
            />
            <div className={`absolute inset-0 bg-black/40 transition-opacity flex items-center justify-center ${
              isHovered ? 'opacity-100' : 'opacity-0'
            }`}>
              <Button 
                onClick={(e) => {
                  e.stopPropagation();
                  handlePlayNow();
                }}
                size="sm"
                className="w-8 h-8 bg-primary rounded-full shadow-lg hover:scale-105 transition-transform"
                data-testid={`button-play-song-${song.id}`}
              >
                <Play className="w-3 h-3 text-primary-foreground ml-0.5" />
              </Button>
            </div>
          </div>

          {/* Song Details - Expanded horizontal layout */}
          <div className="flex-1 p-3 md:p-4 min-w-0">
            {/* Top Row: Title and Duration */}
            <div className="flex items-start justify-between mb-1">
              <h3 className="text-sm md:text-base font-semibold text-foreground font-sans line-clamp-1 flex-1 mr-2" data-testid={`text-song-title-${song.id}`}>
                {song.title}
              </h3>
              <div className="flex items-center gap-2 flex-shrink-0">
                {(song.playCount ?? 0) > 0 && (
                  <span className="bg-primary/10 text-primary px-2 py-0.5 rounded-full text-xs font-mono" data-testid={`text-play-count-${song.id}`}>
                    {song.playCount} plays
                  </span>
                )}
                <span className="bg-secondary text-secondary-foreground px-2 py-0.5 rounded text-xs font-mono" data-testid={`text-song-duration-${song.id}`}>
                  {formatDuration(song.duration)}
                </span>
              </div>
            </div>

            {/* Second Row: Artist and Album Info */}
            <div className="text-muted-foreground text-xs md:text-sm mb-2 font-serif">
              {showArtist && (
                <p className="line-clamp-1" data-testid={`text-song-artist-${song.id}`}>
                  Artist info would go here
                </p>
              )}
              {showAlbum && song.albumId && (
                <p className="line-clamp-1 text-xs opacity-75" data-testid={`text-song-album-${song.id}`}>
                  Album info would go here
                </p>
              )}
            </div>

            {/* Bottom Row: Action Buttons */}
            <div className="flex items-center justify-between">
              {/* Left side: Social actions */}
              <div className="flex items-center space-x-1">
                <Button 
                  variant="ghost"
                  size="sm"
                  onClick={handleFavorite}
                  disabled={favoriteMutation.isPending}
                  className="text-muted-foreground hover:text-red-500 transition-colors p-1.5"
                  data-testid={`button-favorite-song-${song.id}`}
                >
                  <Heart className={`w-3.5 h-3.5 ${optimisticIsFavorite ? 'fill-current text-red-500' : ''}`} />
                </Button>
                <Button 
                  variant="ghost"
                  size="sm"
                  className="text-muted-foreground hover:text-yellow-500 transition-colors p-1.5 hidden md:inline-flex"
                  data-testid={`button-rate-song-${song.id}`}
                >
                  <Star className="w-3.5 h-3.5" />
                </Button>
                <Button 
                  variant="ghost"
                  size="sm"
                  className="text-muted-foreground hover:text-blue-500 transition-colors p-1.5 hidden md:inline-flex"
                  data-testid={`button-comment-song-${song.id}`}
                >
                  <MessageCircle className="w-3.5 h-3.5" />
                </Button>
              </div>
              
              {/* Right side: Menu */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button 
                    variant="ghost"
                    size="sm"
                    className="text-muted-foreground hover:text-foreground transition-colors p-1.5"
                    onClick={(e) => e.stopPropagation()}
                    data-testid={`button-menu-song-${song.id}`}
                  >
                    <MoreHorizontal className="w-3.5 h-3.5" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuItem onClick={handleFavorite} data-testid={`menu-save-library-song-${song.id}`}>
                    <Heart className={`w-4 h-4 mr-2 ${optimisticIsFavorite ? 'fill-current text-red-500' : ''}`} />
                    {optimisticIsFavorite ? 'Remove from Library' : 'Save to Library'}
                  </DropdownMenuItem>
                  
                  <DropdownMenuItem onClick={handlePlayNow} data-testid={`menu-play-now-song-${song.id}`}>
                    <Play className="w-4 h-4 mr-2" />
                    Play Song Now
                  </DropdownMenuItem>
                  
                  <DropdownMenuItem onClick={handleAddToQueue} data-testid={`menu-add-queue-song-${song.id}`}>
                    <ListMusic className="w-4 h-4 mr-2" />
                    Add to Queue
                  </DropdownMenuItem>
                  
                  <DropdownMenuItem onClick={handleAddToPlaylist} data-testid={`menu-add-playlist-song-${song.id}`}>
                    <Plus className="w-4 h-4 mr-2" />
                    Add to Playlist
                  </DropdownMenuItem>
                  
                  <DropdownMenuSeparator />
                  
                  <DropdownMenuItem onClick={handleShare} data-testid={`menu-share-song-${song.id}`}>
                    <Share className="w-4 h-4 mr-2" />
                    Share
                  </DropdownMenuItem>
                  
                  <DropdownMenuItem onClick={handleSongDetails} data-testid={`menu-details-song-${song.id}`}>
                    <Info className="w-4 h-4 mr-2" />
                    Song Details & Lyrics
                  </DropdownMenuItem>
                  
                  <DropdownMenuSeparator />
                  
                  <DropdownMenuItem onClick={handleMoreFromAlbum} data-testid={`menu-more-album-song-${song.id}`}>
                    <Album className="w-4 h-4 mr-2" />
                    More from Album
                  </DropdownMenuItem>
                  
                  <DropdownMenuItem onClick={handleMoreFromArtist} data-testid={`menu-more-artist-song-${song.id}`}>
                    <Mic2 className="w-4 h-4 mr-2" />
                    More from Artist
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </div>
      </CardContent>
      
      {/* Login Modal */}
      <PhoneLoginModal 
        isOpen={showLoginModal}
        onOpenChange={setShowLoginModal}
        onSuccess={handleLoginSuccess}
      />
    </Card>
  );
}