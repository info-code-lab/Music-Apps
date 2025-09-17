import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useMusicPlayer } from "@/hooks/use-music-player";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Users, Play, Heart, ArrowLeft } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import toast from "react-hot-toast";
import { PhoneLoginModal } from "@/components/PhoneLoginModal";
import MusicLibrary from "@/components/music-library";
import type { Track, LegacyTrack } from "@shared/schema";

interface Artist {
  id: string;
  name: string;
  bio?: string;
  profileImage?: string;
  isVerified?: boolean;
}

export default function TopArtists() {
  const [searchQuery, setSearchQuery] = useState("");
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [selectedArtist, setSelectedArtist] = useState<Artist | null>(null);
  const { currentSong, playTrack } = useMusicPlayer();
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: artists = [], isLoading } = useQuery<Artist[]>({
    queryKey: ["/api/artists"],
  });

  // Fetch user's preferred artists (only if authenticated)
  const { data: preferredArtists = [] } = useQuery<Artist[]>({
    queryKey: ["/api/user/preferred-artists"],
    enabled: !!user,
  });

  // Query for artist's songs when an artist is selected
  const { data: artistSongs = [], isLoading: isLoadingSongs } = useQuery<Track[]>({
    queryKey: ["/api/songs/artist", selectedArtist?.id],
    enabled: !!selectedArtist,
  });

  // Mutation to add artist to preferences
  const addPreferredArtistMutation = useMutation({
    mutationFn: async (artistId: string) => {
      await apiRequest("/api/user/preferred-artists", "POST", { artistId });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/user/preferred-artists"] });
      toast.success("Artist added to favorites");
    },
    onError: () => {
      toast.error("Failed to add artist to favorites");
    },
  });

  // Mutation to remove artist from preferences
  const removePreferredArtistMutation = useMutation({
    mutationFn: async (artistId: string) => {
      await apiRequest(`/api/user/preferred-artists/${artistId}`, "DELETE");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/user/preferred-artists"] });
      toast.success("Artist removed from favorites");
    },
    onError: () => {
      toast.error("Failed to remove artist from favorites");
    },
  });

  const filteredArtists = searchQuery 
    ? artists.filter(artist => 
        artist.name.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : artists;

  // Check if artist is in user's preferred list
  const isArtistPreferred = (artistId: string) => {
    return preferredArtists.some(preferred => preferred.id === artistId);
  };

  // Handle artist card click to view songs  
  const handleArtistClick = (artist: Artist) => {
    setSelectedArtist(artist);
  };
  
  const handleBackToArtists = () => {
    setSelectedArtist(null);
  };

  // Handle heart button click
  const handleHeartClick = (artist: Artist) => {
    if (!user) {
      setShowLoginModal(true);
      return;
    }

    const isPreferred = isArtistPreferred(artist.id);
    if (isPreferred) {
      removePreferredArtistMutation.mutate(artist.id);
    } else {
      addPreferredArtistMutation.mutate(artist.id);
    }
  };

  // Handle playing a song
  const handlePlaySong = (song: LegacyTrack) => {
    playTrack(song);
  };

  // Convert Track to LegacyTrack format for compatibility
  const convertToLegacyTrack = (song: Track): LegacyTrack => ({
    id: song.id,
    title: song.title,
    artist: selectedArtist?.name || "Unknown Artist",
    category: "Music", 
    duration: song.duration || 0,
    url: song.filePath ? encodeURI(song.filePath) : "",
    artwork: song.coverArt || null,
    isFavorite: false, 
    uploadType: "file",
    createdAt: song.createdAt || undefined,
  });

  const ArtistCard = ({ artist }: { artist: Artist }) => {
    return (
      <div 
        className="bg-card rounded-lg border border-border overflow-hidden hover:shadow-lg transition-shadow cursor-pointer"
        onClick={() => handleArtistClick(artist)}
        data-testid={`card-artist-${artist.id}`}
      >
      <div className="relative group">
        <div className="w-full h-32 md:h-48 bg-muted flex items-center justify-center overflow-hidden">
          {artist.profileImage ? (
            <img 
              src={artist.profileImage} 
              alt={artist.name}
              className="w-full h-full object-cover"
            />
          ) : (
            <Users className="w-8 h-8 md:w-12 md:h-12 text-muted-foreground" />
          )}
        </div>
        <Button
          size="sm"
          className="absolute bottom-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity bg-primary hover:bg-primary/90"
          onClick={(e) => {
            e.stopPropagation();
            handleArtistClick(artist);
          }}
          data-testid={`button-play-artist-${artist.id}`}
        >
          <Play className="w-4 h-4" />
        </Button>
      </div>
      <div className="p-2 md:p-4">
        <h3 className="font-semibold text-foreground truncate text-sm md:text-base mb-1 flex items-center">
          {artist.name}
          {artist.isVerified && (
            <span className="ml-1 text-blue-500">✓</span>
          )}
        </h3>
        {artist.bio && (
          <p className="text-xs md:text-sm text-muted-foreground truncate mb-2">
            {artist.bio}
          </p>
        )}
        <div className="flex items-center justify-between">
          <span className="text-xs md:text-sm text-muted-foreground">
            Artist
          </span>
          <Button 
            variant="ghost" 
            size="sm" 
            className={`p-1 hover:text-red-500 transition-colors ${
              user && isArtistPreferred(artist.id) ? 'text-red-500' : 'text-muted-foreground'
            }`}
            onClick={(e) => {
              e.stopPropagation();
              handleHeartClick(artist);
            }}
            disabled={addPreferredArtistMutation.isPending || removePreferredArtistMutation.isPending}
            data-testid={`button-heart-artist-${artist.id}`}
          >
            <Heart className={`w-3 h-3 md:w-4 md:h-4 ${
              user && isArtistPreferred(artist.id) ? 'fill-current' : ''
            }`} />
          </Button>
        </div>
      </div>
      </div>
    );
  };

  return (
    <div className="h-full">
      {/* Login Modal */}
      <PhoneLoginModal
        isOpen={showLoginModal}
        onOpenChange={setShowLoginModal}
        onSuccess={() => {
          setShowLoginModal(false);
          toast.success("Welcome! You can now favorite artists.");
        }}
      />
      <main className="h-full">
        <div className="p-4 md:p-8">
          <div className="flex items-center space-x-3 mb-6">
            <div className="w-12 h-12 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 flex items-center justify-center">
              <Users className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-foreground font-sans">
                Top Artists
              </h1>
              <p className="text-muted-foreground font-serif">
                Most popular artists you should know
              </p>
            </div>
          </div>

          {selectedArtist ? (
            // Show selected artist's songs
            <>
              <div className="mb-4 md:mb-6">
                <Button 
                  variant="ghost" 
                  onClick={handleBackToArtists}
                  className="mb-4 p-2 hover:bg-accent"
                  data-testid="button-back-to-top-artists"
                >
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back to Top Artists
                </Button>
                <div className="flex items-center gap-4 mb-4">
                  {selectedArtist.profileImage ? (
                    <img 
                      src={selectedArtist.profileImage} 
                      alt={selectedArtist.name}
                      className="w-20 h-20 rounded-full object-cover" 
                    />
                  ) : (
                    <div className="w-20 h-20 rounded-full bg-muted flex items-center justify-center">
                      <Users className="w-8 h-8 text-muted-foreground" />
                    </div>
                  )}
                  <div>
                    <h2 className="text-xl md:text-2xl font-bold text-foreground mb-1 font-sans flex items-center">
                      {selectedArtist.name}
                      {selectedArtist.isVerified && (
                        <span className="ml-2 text-blue-500">✓</span>
                      )}
                    </h2>
                    <p className="text-sm md:text-base text-muted-foreground font-serif">
                      {artistSongs.length} songs
                    </p>
                  </div>
                </div>
              </div>
              
              <MusicLibrary
                songs={artistSongs}
                isLoading={isLoadingSongs}
                selectedCategory="All Categories"
                onCategoryChange={() => {}}
                onPlaySong={(song) => handlePlaySong(convertToLegacyTrack(song))}
                searchQuery=""
              />
            </>
          ) : isLoading ? (
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
          ) : filteredArtists.length > 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 md:gap-6">
              {filteredArtists.map((artist) => (
                <ArtistCard key={artist.id} artist={artist} />
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-16">
              <div className="w-24 h-24 rounded-full bg-muted flex items-center justify-center mb-4">
                <Users className="w-12 h-12 text-muted-foreground" />
              </div>
              <h3 className="text-xl font-semibold text-foreground mb-2">
                No artists available
              </h3>
              <p className="text-muted-foreground text-center max-w-md">
                Popular artists will appear here when music is added to the library.
              </p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}