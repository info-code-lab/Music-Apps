import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Play, Pause, Heart, Download, Check, X, WifiOff, HardDrive, MoreHorizontal, Plus, Share, Info, Album, Mic2, ListMusic } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Progress } from "@/components/ui/progress";
import { apiRequest, invalidateAllSongQueries } from "@/lib/queryClient";
import { formatDuration } from "@/lib/audio-utils";
import { useDownload } from "@/hooks/use-download";
import { useOffline } from "@/hooks/use-offline";
import { useAuth } from "@/hooks/use-auth";
import { PhoneLoginModal } from "@/components/PhoneLoginModal";
import { useMusicPlayer } from "@/hooks/use-music-player";
import toast from "react-hot-toast";
import type { LegacyTrack as Track } from "@shared/schema";

interface MusicCardProps {
  song: Track;
  onPlay: () => void;
}

const getCategoryColor = (category: string) => {
  const colors = {
    Jazz: "bg-accent text-accent-foreground",
    Electronic: "bg-chart-1 text-white",
    Classical: "bg-chart-4 text-white",
    Rock: "bg-chart-5 text-white",
    Folk: "bg-chart-3 text-secondary",
    "Hip-Hop": "bg-chart-2 text-white",
  };
  return colors[category as keyof typeof colors] || "bg-muted text-muted-foreground";
};

export default function MusicCard({ song, onPlay }: MusicCardProps) {
  const [isHovered, setIsHovered] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false);
  // Optimistic favorite state for instant UI updates
  const [optimisticIsFavorite, setOptimisticIsFavorite] = useState(song.isFavorite);
  
  // Sync optimistic state when song data changes
  useEffect(() => {
    setOptimisticIsFavorite(song.isFavorite);
  }, [song.id, song.isFavorite]);
  
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const { playTrack, currentSong, isPlaying, togglePlayPause } = useMusicPlayer();
  const { 
    downloadSong, 
    deleteSong, 
    isDownloaded, 
    isDownloading,
    downloadToDevice,
    isDownloadingToDevice,
    getFileDownloadProgress,
    isFileDownloadSupported
  } = useDownload();
  const { isOffline } = useOffline();

  const favoriteMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest(`/api/songs/${song.id}/favorite`, "PATCH");
      return response.json();
    },
    onMutate: () => {
      // Optimistically update the UI immediately with functional update
      setOptimisticIsFavorite(prev => !prev);
    },
    onSuccess: () => {
      // Use centralized function to invalidate all song-related queries
      invalidateAllSongQueries();
      // Show specific message based on the new favorite state
      toast.success(optimisticIsFavorite ? "Favorite added" : "Favorite removed");
    },
    onError: () => {
      // Revert optimistic update on error with functional update
      setOptimisticIsFavorite(prev => !prev);
      toast.error("Couldn't update favorites");
    },
  });

  const handleFavoriteClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    
    // Check if user is authenticated
    if (!user) {
      setShowLoginModal(true);
      return;
    }
    
    // User is authenticated, proceed with favorite action
    favoriteMutation.mutate();
  };

  const handleLoginSuccess = () => {
    setShowLoginModal(false);
    // After successful login, automatically perform the favorite action
    favoriteMutation.mutate();
  };

  const isCurrentSong = currentSong?.id === song.id;
  const isCurrentlyPlaying = isCurrentSong && isPlaying;

  const handlePlayNow = () => {
    if (isCurrentSong && isPlaying) {
      // If this song is currently playing, pause it
      togglePlayPause();
    } else {
      // If this song is not playing, play it
      playTrack(song, true);
      onPlay();
    }
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
      text: `Check out "${song.title}" by ${song.artist}`,
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
    navigator.clipboard.writeText(`${song.title} by ${song.artist} - ${window.location.href}`)
      .then(() => toast.success("Link copied to clipboard"))
      .catch(() => toast.error("Failed to copy link"));
  };

  const handleSongDetails = () => {
    toast.success("Song details feature coming soon");
  };

  const handleMoreFromAlbum = () => {
    // TODO: Navigate to album page or show album songs
    toast.success("More from album feature coming soon");
  };

  const handleMoreFromArtist = () => {
    // TODO: Navigate to artist page or show artist songs
    toast.success("More from artist feature coming soon");
  };

  return (
    <div 
      className="bg-card rounded-lg border border-border overflow-hidden floating-card gentle-float group cursor-pointer"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={(e) => {
        // Prevent any action when clicking the card - only buttons should trigger actions
        // This removes music playback from card clicks as requested
      }}
      data-testid={`card-song-${song.id}`}
    >
      <div className="relative">
        <img 
          src={song.artwork || 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=300'} 
          alt={song.title}
          className="w-full h-32 md:h-48 object-cover floating-image" 
        />
        <div className={`absolute inset-0 bg-black/20 transition-opacity flex items-center justify-center ${
          isHovered ? 'opacity-100' : 'opacity-0'
        } z-10`}>
          <Button 
            onClick={(e) => {
              e.stopPropagation();
              handlePlayNow();
            }}
            className="w-10 h-10 md:w-12 md:h-12 bg-primary rounded-full shadow-lg hover:scale-105 transition-transform"
            data-testid={`button-play-${song.id}`}
          >
            {isCurrentlyPlaying ? (
              <Pause className="w-4 h-4 md:w-5 md:h-5 text-primary-foreground" />
            ) : (
              <Play className="w-4 h-4 md:w-5 md:h-5 text-primary-foreground ml-0.5" />
            )}
          </Button>
        </div>
        <div className="absolute top-2 right-2 flex items-center gap-2">
          {/* Offline Status Indicator */}
          {isDownloaded(song.id) && (
            <div className="bg-green-600/90 text-white px-2 py-1 rounded-full text-xs flex items-center gap-1 font-mono">
              <WifiOff className="w-3 h-3" />
              Offline
            </div>
          )}
          {/* Duration */}
          <div className="bg-secondary/80 text-secondary-foreground px-2 py-1 rounded text-xs font-mono">
            <span data-testid={`text-duration-${song.id}`}>{formatDuration(song.duration)}</span>
          </div>
        </div>
      </div>
      <div className="p-2 md:p-4 floating-content">
        <h3 className="text-sm md:text-lg font-semibold text-foreground mb-1 font-sans line-clamp-1" data-testid={`text-title-${song.id}`}>
          {song.title}
        </h3>
        <p className="text-muted-foreground text-xs md:text-sm mb-2 font-serif line-clamp-1" data-testid={`text-artist-${song.id}`}>
          {song.artist}
        </p>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1">
            {/* Mobile: Show all buttons like desktop */}
            <div className="md:hidden flex items-center gap-1">
              {/* File Download Button (to device) */}
              {isFileDownloadSupported && (
                isDownloadingToDevice(song.id) ? (
                  <Button 
                    variant="ghost"
                    size="sm"
                    disabled
                    className="text-purple-600 hover:text-purple-700 transition-colors p-1"
                    title={`Downloading to device: ${Math.round(getFileDownloadProgress(song.id))}%`}
                    data-testid={`button-downloading-file-mobile-${song.id}`}
                  >
                    <HardDrive className="w-3 h-3 animate-pulse" />
                  </Button>
                ) : (
                  <Button 
                    variant="ghost"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      downloadToDevice(song);
                    }}
                    className="text-muted-foreground hover:text-purple-600 transition-colors p-1"
                    title="Download MP3 to your device"
                    data-testid={`button-download-file-mobile-${song.id}`}
                  >
                    <HardDrive className="w-3 h-3" />
                  </Button>
                )
              )}
              
              {/* Offline Storage Download Button */}
              {isDownloading(song.id) ? (
                <Button 
                  variant="ghost"
                  size="sm"
                  disabled
                  className="text-blue-600 hover:text-blue-700 transition-colors p-1"
                  data-testid={`button-downloading-mobile-${song.id}`}
                >
                  <Download className="w-3 h-3 animate-pulse" />
                </Button>
              ) : isDownloaded(song.id) ? (
                <Button 
                  variant="ghost"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    deleteSong(song.id);
                  }}
                  className="text-green-600 hover:text-red-600 transition-colors p-1"
                  title="Remove offline version"
                  data-testid={`button-delete-offline-mobile-${song.id}`}
                >
                  <Check className="w-3 h-3" />
                </Button>
              ) : (
                <Button 
                  variant="ghost"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    downloadSong(song);
                  }}
                  className="text-muted-foreground hover:text-blue-600 transition-colors p-1"
                  title="Download for offline playback"
                  data-testid={`button-download-mobile-${song.id}`}
                >
                  <Download className="w-3 h-3" />
                </Button>
              )}
              
              {/* Favorite Button */}
              <Button 
                variant="ghost"
                size="sm"
                onClick={handleFavoriteClick}
                disabled={favoriteMutation.isPending}
                className="text-muted-foreground hover:text-foreground hover:bg-accent hover:rounded-full transition-colors p-1"
                data-testid={`button-favorite-mobile-${song.id}`}
              >
                <Heart className={`w-3 h-3 ${optimisticIsFavorite ? 'fill-current text-red-500' : ''}`} />
              </Button>
            </div>
            
            {/* Desktop: Show all buttons */}
            <div className="hidden md:flex items-center gap-1">
              {/* File Download Button (to device) */}
              {isFileDownloadSupported && (
                isDownloadingToDevice(song.id) ? (
                  <Button 
                    variant="ghost"
                    size="sm"
                    disabled
                    className="text-purple-600 hover:text-purple-700 transition-colors"
                    title={`Downloading to device: ${Math.round(getFileDownloadProgress(song.id))}%`}
                    data-testid={`button-downloading-file-${song.id}`}
                  >
                    <HardDrive className="w-4 h-4 animate-pulse" />
                  </Button>
                ) : (
                  <Button 
                    variant="ghost"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      downloadToDevice(song);
                    }}
                    className="text-muted-foreground hover:text-purple-600 transition-colors"
                    title="Download MP3 to your device"
                    data-testid={`button-download-file-${song.id}`}
                  >
                    <HardDrive className="w-4 h-4" />
                  </Button>
                )
              )}
              
              {/* Offline Storage Download Button */}
              {isDownloading(song.id) ? (
                <Button 
                  variant="ghost"
                  size="sm"
                  disabled
                  className="text-blue-600 hover:text-blue-700 transition-colors"
                  data-testid={`button-downloading-${song.id}`}
                >
                  <Download className="w-4 h-4 animate-pulse" />
                </Button>
              ) : isDownloaded(song.id) ? (
                <Button 
                  variant="ghost"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    deleteSong(song.id);
                  }}
                  className="text-green-600 hover:text-red-600 transition-colors"
                  title="Remove offline version"
                  data-testid={`button-delete-offline-${song.id}`}
                >
                  <Check className="w-4 h-4" />
                </Button>
              ) : (
                <Button 
                  variant="ghost"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    downloadSong(song);
                  }}
                  className="text-muted-foreground hover:text-blue-600 transition-colors"
                  title="Download for offline playback"
                  data-testid={`button-download-${song.id}`}
                >
                  <Download className="w-4 h-4" />
                </Button>
              )}
              
              {/* Favorite Button */}
              <Button 
                variant="ghost"
                size="sm"
                onClick={handleFavoriteClick}
                disabled={favoriteMutation.isPending}
                className="text-muted-foreground hover:text-foreground hover:bg-accent hover:rounded-full transition-colors"
                data-testid={`button-favorite-${song.id}`}
              >
                <Heart className={`w-4 h-4 ${optimisticIsFavorite ? 'fill-current text-red-500' : ''}`} />
              </Button>
            </div>
          </div>
          
          {/* 3-dot menu button */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button 
                variant="ghost"
                size="sm"
                className="text-muted-foreground hover:text-foreground transition-colors"
                onClick={(e) => e.stopPropagation()}
                data-testid={`button-menu-${song.id}`}
              >
                <MoreHorizontal className="w-4 h-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuItem onClick={handleFavoriteClick} data-testid={`menu-save-library-${song.id}`}>
                <Heart className={`w-4 h-4 mr-2 ${optimisticIsFavorite ? 'fill-current text-red-500' : ''}`} />
                {optimisticIsFavorite ? 'Remove from Library' : 'Save to Library'}
              </DropdownMenuItem>
              
              <DropdownMenuItem onClick={handlePlayNow} data-testid={`menu-play-now-${song.id}`}>
                <Play className="w-4 h-4 mr-2" />
                Play Song Now
              </DropdownMenuItem>
              
              <DropdownMenuItem onClick={handleAddToQueue} data-testid={`menu-add-queue-${song.id}`}>
                <ListMusic className="w-4 h-4 mr-2" />
                Add to Queue
              </DropdownMenuItem>
              
              <DropdownMenuItem onClick={handleAddToPlaylist} data-testid={`menu-add-playlist-${song.id}`}>
                <Plus className="w-4 h-4 mr-2" />
                Add to Playlist
              </DropdownMenuItem>
              
              <DropdownMenuSeparator />
              
              <DropdownMenuItem onClick={handleShare} data-testid={`menu-share-${song.id}`}>
                <Share className="w-4 h-4 mr-2" />
                Share
              </DropdownMenuItem>
              
              <DropdownMenuItem onClick={handleSongDetails} data-testid={`menu-details-${song.id}`}>
                <Info className="w-4 h-4 mr-2" />
                Song Details & Lyrics
              </DropdownMenuItem>
              
              <DropdownMenuSeparator />
              
              <DropdownMenuItem onClick={handleMoreFromAlbum} data-testid={`menu-more-album-${song.id}`}>
                <Album className="w-4 h-4 mr-2" />
                More from Album
              </DropdownMenuItem>
              
              <DropdownMenuItem onClick={handleMoreFromArtist} data-testid={`menu-more-artist-${song.id}`}>
                <Mic2 className="w-4 h-4 mr-2" />
                More from {song.artist}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Login Modal */}
      <PhoneLoginModal 
        isOpen={showLoginModal}
        onOpenChange={setShowLoginModal}
        onSuccess={handleLoginSuccess}
      />
    </div>
  );
}
