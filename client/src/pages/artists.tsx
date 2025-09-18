import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import ArtistLibrary from "@/components/artist-library";
import MusicLibrary from "@/components/music-library";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Search, Bell, User, ArrowLeft, Play, Heart, MoreHorizontal, CheckCircle, Clock } from "lucide-react";
import type { Artist, Track, LegacyTrack, ApiTrack } from "@shared/schema";
import { convertApiTrackToLegacy } from "@/lib/song-utils";
import { useMusicPlayer } from "@/hooks/use-music-player";
import { useAuth } from "@/hooks/use-auth";
import { PhoneLoginModal } from "@/components/PhoneLoginModal";
import PageBack from "@/components/page-back";
import { apiRequest } from "@/lib/queryClient";
import toast from "react-hot-toast";

export default function Artists() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedArtist, setSelectedArtist] = useState<Artist | null>(null);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [isMobileOrTablet, setIsMobileOrTablet] = useState(false);
  const [activeTab, setActiveTab] = useState<'overview' | 'songs' | 'albums'>('songs');
  const [isFollowing, setIsFollowing] = useState(false);
  const { currentSong, playTrack, isPlaying, togglePlayPause } = useMusicPlayer();
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // Detect mobile/tablet screen size
  useEffect(() => {
    const checkScreenSize = () => {
      setIsMobileOrTablet(window.innerWidth < 1024); // lg breakpoint
    };
    
    checkScreenSize();
    window.addEventListener('resize', checkScreenSize);
    
    return () => window.removeEventListener('resize', checkScreenSize);
  }, []);

  // Don't automatically show login modal - let user choose to login

  // Fetch user's preferred/followed artists only
  const { data: artists = [], isLoading } = useQuery<Artist[]>({
    queryKey: ["/api/user/preferred-artists"],
    enabled: !!user,
  });

  // Mutation to remove artist from preferences
  const removePreferredArtistMutation = useMutation({
    mutationFn: async (artistId: string) => {
      await apiRequest(`/api/user/preferred-artists/${artistId}`, "DELETE");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/user/preferred-artists"] });
      toast.success("Artist unfollowed successfully");
    },
    onError: () => {
      toast.error("Failed to unfollow artist");
    },
  });

  // For search, filter the preferred artists locally
  const searchResults = searchQuery 
    ? artists.filter(artist => 
        artist.name.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : [];

  // Query for artist's songs when an artist is selected
  const { data: artistSongs = [], isLoading: isLoadingSongs } = useQuery<Track[]>({
    queryKey: ["/api/songs/artist", selectedArtist?.id],
    enabled: !!selectedArtist,
  });

  const displayArtists = searchQuery ? searchResults : artists;

  const handleViewArtist = (artist: Artist) => {
    setSelectedArtist(artist);
    setSearchQuery(""); // Clear search when viewing artist
  };

  const handleBackToArtists = () => {
    setSelectedArtist(null);
  };

  // Handle unfollowing an artist
  const handleUnfollowArtist = (artist: Artist) => {
    removePreferredArtistMutation.mutate(artist.id);
  };

  const handlePlaySong = (song: LegacyTrack) => {
    playTrack(song);
  };

  // Use centralized conversion function
  const convertToLegacyTrack = (song: Track): LegacyTrack => 
    convertApiTrackToLegacy(song as ApiTrack, { 
      fallbackArtist: selectedArtist?.name 
    });

  // Show not authorized message for mobile/tablet users who are not authenticated
  if (!user && isMobileOrTablet) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6">
        <PhoneLoginModal
          isOpen={showLoginModal}
          onOpenChange={setShowLoginModal}
          onSuccess={() => {
            setShowLoginModal(false);
          }}
        />
        <div className="text-center max-w-md">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-blue-500 flex items-center justify-center">
            <User className="w-8 h-8 text-white" />
          </div>
          <h2 className="text-xl font-semibold text-foreground mb-2">Authentication Required</h2>
          <p className="text-muted-foreground mb-6">
            You need to be logged in to explore artists and their music.
          </p>
          <button
            onClick={() => setShowLoginModal(true)}
            className="bg-primary text-primary-foreground px-6 py-2 rounded-lg hover:bg-primary/90 transition-colors"
            data-testid="button-login-artists"
          >
            Login to Continue
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <PageBack title="Following" />
      {/* Login Modal for Manual Trigger */}
      <PhoneLoginModal
        isOpen={showLoginModal}
        onOpenChange={setShowLoginModal}
        onSuccess={() => {
          setShowLoginModal(false);
        }}
      />
      <main className="overflow-auto custom-scrollbar">
          {/* Page Content */}
          <section className="px-4 md:px-6 pb-6">
            {selectedArtist ? (
              // Show selected artist's profile page
              <>
                <div className="mb-4">
                  <Button 
                    variant="ghost" 
                    onClick={handleBackToArtists}
                    className="mb-6 p-2 hover:bg-accent"
                    data-testid="button-back-to-artists"
                  >
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Back to Following
                  </Button>
                  
                  {/* Artist Hero Section */}
                  <div className="flex items-center gap-8 mb-8">
                    <div className="w-48 h-48 rounded-full overflow-hidden shadow-2xl">
                      <img 
                        src={selectedArtist.profilePic || 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=400'} 
                        alt={selectedArtist.name}
                        className="w-full h-full object-cover" 
                      />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h1 className="text-5xl font-bold text-foreground font-sans">
                          {selectedArtist.name}
                        </h1>
                        <CheckCircle className="w-6 h-6 text-blue-500" />
                      </div>
                      <p className="text-muted-foreground text-lg mb-6">
                        Artist • {Math.floor(Math.random() * 10000000).toLocaleString()} Listeners
                      </p>
                      <div className="flex items-center gap-4">
                        <Button 
                          size="lg" 
                          className="bg-green-500 hover:bg-green-600 text-white rounded-full px-8 py-3"
                          onClick={() => {
                            if (artistSongs.length > 0) {
                              handlePlaySong(convertToLegacyTrack(artistSongs[0]));
                            }
                          }}
                          data-testid="button-play-artist"
                        >
                          <Play className="w-5 h-5 mr-2 fill-current" />
                          Play
                        </Button>
                        <Button 
                          variant="outline" 
                          size="lg" 
                          className="rounded-full border-2"
                          onClick={() => setIsFollowing(!isFollowing)}
                          data-testid="button-follow-artist"
                        >
                          <Heart className={`w-5 h-5 ${isFollowing ? 'fill-current text-red-500' : ''}`} />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="lg" 
                          className="rounded-full"
                          data-testid="button-artist-menu"
                        >
                          <MoreHorizontal className="w-5 h-5" />
                        </Button>
                      </div>
                    </div>
                  </div>

                  {/* Tabs Navigation */}
                  <div className="border-b border-border mb-6">
                    <div className="flex space-x-8">
                      {[
                        { id: 'overview', label: 'Overview' },
                        { id: 'songs', label: 'Songs' },
                        { id: 'albums', label: 'Albums' }
                      ].map((tab) => (
                        <button
                          key={tab.id}
                          onClick={() => setActiveTab(tab.id as any)}
                          className={`pb-4 px-1 font-medium transition-colors relative ${
                            activeTab === tab.id
                              ? 'text-foreground'
                              : 'text-muted-foreground hover:text-foreground'
                          }`}
                          data-testid={`tab-${tab.id}`}
                        >
                          {tab.label}
                          {activeTab === tab.id && (
                            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-foreground" />
                          )}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Tab Content */}
                  {activeTab === 'songs' && (
                    <div>
                      {/* Popular Section Header */}
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="text-xl font-semibold">Popular</h3>
                      </div>
                      
                      {/* Songs List */}
                      <div className="space-y-2">
                        {artistSongs.slice(0, 5).map((song, index) => {
                          const isCurrentlyPlaying = currentSong?.id === song.id && isPlaying;
                          return (
                            <div 
                              key={song.id} 
                              className="flex items-center gap-4 p-2 rounded-lg hover:bg-accent/30 group transition-colors"
                            >
                              {/* Track Number / Play Button */}
                              <div className="w-8 text-center">
                                <span className="group-hover:hidden text-muted-foreground text-sm font-medium">
                                  {index + 1}
                                </span>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="hidden group-hover:inline-flex w-8 h-8 p-0 hover:bg-transparent"
                                  onClick={() => isCurrentlyPlaying ? togglePlayPause() : handlePlaySong(convertToLegacyTrack(song))}
                                >
                                  {isCurrentlyPlaying ? 
                                    <Clock className="w-4 h-4" /> : 
                                    <Play className="w-4 h-4 fill-current" />
                                  }
                                </Button>
                              </div>

                              {/* Album Art & Song Info */}
                              <div className="flex items-center gap-3 flex-1 min-w-0">
                                <div className="w-12 h-12 rounded overflow-hidden bg-muted flex-shrink-0">
                                  {song.coverArt ? (
                                    <img 
                                      src={song.coverArt} 
                                      alt={song.title}
                                      className="w-full h-full object-cover"
                                    />
                                  ) : (
                                    <div className="w-full h-full bg-gradient-to-br from-slate-600 to-slate-800 flex items-center justify-center">
                                      <div className="w-6 h-6 bg-white/20 rounded-full"></div>
                                    </div>
                                  )}
                                </div>
                                <div className="min-w-0 flex-1">
                                  <h4 className="font-semibold text-foreground truncate">
                                    {song.title}
                                  </h4>
                                  <p className="text-sm text-muted-foreground truncate">
                                    {(song as any).artist || selectedArtist.name}
                                  </p>
                                </div>
                              </div>

                              {/* Album Name */}
                              <div className="hidden md:block text-sm text-muted-foreground min-w-0 flex-1">
                                <span className="truncate">
                                  {(song as any).category || 'Unknown Album'}
                                </span>
                              </div>

                              {/* Actions */}
                              <div className="flex items-center gap-2">
                                <Button 
                                  variant="ghost" 
                                  size="sm" 
                                  className="opacity-0 group-hover:opacity-100 transition-opacity w-8 h-8 p-0"
                                >
                                  <Heart className="w-4 h-4" />
                                </Button>
                                <span className="text-sm text-muted-foreground min-w-[40px] text-right">
                                  {Math.floor(song.duration / 60)}:{(song.duration % 60).toString().padStart(2, '0')}
                                </span>
                                <Button 
                                  variant="ghost" 
                                  size="sm" 
                                  className="opacity-0 group-hover:opacity-100 transition-opacity w-8 h-8 p-0"
                                >
                                  <MoreHorizontal className="w-4 h-4" />
                                </Button>
                              </div>
                            </div>
                          );
                        })}
                      </div>

                      {/* Show More Button */}
                      {artistSongs.length > 5 && (
                        <Button 
                          variant="ghost" 
                          className="mt-4 text-muted-foreground hover:text-foreground"
                        >
                          Show all {artistSongs.length} songs
                        </Button>
                      )}
                    </div>
                  )}

                  {activeTab === 'overview' && (
                    <div className="space-y-8">
                      <div>
                        <h3 className="text-xl font-semibold mb-4">About {selectedArtist.name}</h3>
                        <p className="text-muted-foreground leading-relaxed">
                          {selectedArtist.bio || `${selectedArtist.name} is a talented artist with a unique sound and style.`}
                        </p>
                      </div>
                      
                      <div>
                        <h3 className="text-xl font-semibold mb-4">Popular Songs</h3>
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                          {artistSongs.slice(0, 5).map((song) => (
                            <div key={song.id} className="group cursor-pointer" onClick={() => handlePlaySong(convertToLegacyTrack(song))}>
                              <div className="aspect-square rounded-lg overflow-hidden bg-muted mb-2 relative">
                                {song.coverArt ? (
                                  <img src={song.coverArt} alt={song.title} className="w-full h-full object-cover" />
                                ) : (
                                  <div className="w-full h-full bg-gradient-to-br from-slate-600 to-slate-800"></div>
                                )}
                                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                  <Play className="w-8 h-8 text-white fill-current" />
                                </div>
                              </div>
                              <h4 className="font-medium text-sm truncate">{song.title}</h4>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}

                  {activeTab === 'albums' && (
                    <div>
                      <h3 className="text-xl font-semibold mb-4">Albums</h3>
                      <p className="text-muted-foreground">No albums available yet.</p>
                    </div>
                  )}
                </div>
              </>
            ) : (
              // Show artists list
              <>
                <div className="mb-4 md:mb-6">
                  <h2 className="text-xl md:text-2xl font-bold text-foreground mb-1 md:mb-2 font-sans">
                    Following
                  </h2>
                  <p className="text-sm md:text-base text-muted-foreground font-serif">
                    Artists you're following
                  </p>
                </div>
                
                {/* Artists Library */}
                <ArtistLibrary
                  artists={displayArtists}
                  isLoading={isLoading}
                  onViewArtist={handleViewArtist}
                  searchQuery={searchQuery}
                  isFollowingPage={true}
                  onUnfollow={handleUnfollowArtist}
                />
              </>
            )}
          </section>
      </main>
    </div>
  );
}