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
import ArtistLibrary from "@/components/artist-library";
import type { Track, LegacyTrack, ApiTrack, Artist } from "@shared/schema";
import { convertApiTrackToLegacy } from "@/lib/song-utils";

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

  // Use centralized conversion function
  const convertToLegacyTrack = (song: Track): LegacyTrack => 
    convertApiTrackToLegacy(song as ApiTrack, { 
      fallbackArtist: selectedArtist?.name 
    });


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
                  {selectedArtist.profilePic ? (
                    <img 
                      src={selectedArtist.profilePic} 
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
          ) : (
            <ArtistLibrary
              artists={filteredArtists}
              isLoading={isLoading}
              onViewArtist={handleArtistClick}
              searchQuery={searchQuery}
              onToggleFollow={handleHeartClick}
              isArtistFollowed={isArtistPreferred}
            />
          )}
        </div>
      </main>
    </div>
  );
}