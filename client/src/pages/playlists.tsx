import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import PlaylistLibrary from "@/components/playlist-library";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Search, Plus, Bell, User, Heart, Music } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import toast from "react-hot-toast";
import { insertPlaylistSchema } from "@shared/schema";
import { z } from "zod";
import type { Playlist } from "@shared/schema";
import { useMusicPlayer } from "@/hooks/use-music-player";
import { useAuth } from "@/hooks/use-auth";
import { PhoneLoginModal } from "@/components/PhoneLoginModal";

const createPlaylistSchema = insertPlaylistSchema.omit({ userId: true });
type CreatePlaylistForm = z.infer<typeof createPlaylistSchema>;

export default function Playlists() {
  const [searchQuery, setSearchQuery] = useState("");
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [isMobileOrTablet, setIsMobileOrTablet] = useState(false);
  const queryClient = useQueryClient();
  const { currentSong } = useMusicPlayer();
  const { user } = useAuth();

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

  // Remove public playlists - only show user's own and liked playlists

  // Get user's own playlists
  const { data: myPlaylists = [], isLoading: isLoadingMy } = useQuery<Playlist[]>({
    queryKey: ["/api/playlists/user", user?.id],
    enabled: !!user?.id && !searchQuery,
  });

  // Get user's liked playlists
  const { data: likedPlaylists = [], isLoading: isLoadingLiked } = useQuery<Playlist[]>({
    queryKey: ["/api/playlists/liked"],
    enabled: !!user?.id && !searchQuery,
  });

  const isLoading = isLoadingMy || isLoadingLiked;

  const form = useForm<CreatePlaylistForm>({
    resolver: zodResolver(createPlaylistSchema),
    defaultValues: {
      name: "",
      description: "",
      isPublic: false,
    },
  });

  const createPlaylistMutation = useMutation({
    mutationFn: async (data: CreatePlaylistForm) => {
      const response = await apiRequest("/api/playlists", "POST", data);
      return response.json();
    },
    onSuccess: () => {
      // Invalidate playlist-related queries
      queryClient.invalidateQueries({ queryKey: ["/api/playlists/user", user?.id] });
      queryClient.invalidateQueries({ queryKey: ["/api/playlists/liked"] });
      setShowCreateDialog(false);
      form.reset();
      toast.success("Your new playlist has been created successfully.");
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : "Failed to create playlist");
    },
  });

  const handleCreatePlaylist = () => {
    setShowCreateDialog(true);
  };

  const handleViewPlaylist = (playlist: Playlist) => {
    // TODO: Navigate to playlist detail page
    console.log("View playlist:", playlist);
  };

  const onSubmit = (data: CreatePlaylistForm) => {
    createPlaylistMutation.mutate(data);
  };

  // Show not authorized message for non-authenticated users
  if (!user) {
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
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-green-500 flex items-center justify-center">
            <Music className="w-8 h-8 text-white" />
          </div>
          <h2 className="text-xl font-semibold text-foreground mb-2">Authentication Required</h2>
          <p className="text-muted-foreground mb-6">
            You need to be logged in to access your playlists.
          </p>
          <button
            onClick={() => setShowLoginModal(true)}
            className="bg-primary text-primary-foreground px-6 py-2 rounded-lg hover:bg-primary/90 transition-colors"
            data-testid="button-login-playlists"
          >
            Login to Continue
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
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
            {/* Header with + New button */}
            <div className="flex items-center justify-between mb-4 md:mb-6">
              <div>
                <h2 className="text-xl md:text-2xl font-bold text-foreground mb-1 md:mb-2 font-sans">
                  Playlists
                </h2>
                <p className="text-sm md:text-base text-muted-foreground font-serif">
                  Create and discover music playlists
                </p>
              </div>
              {user && (
                <div className="flex items-center gap-2">
                  <Button 
                    onClick={handleCreatePlaylist}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-full px-4 py-2 text-sm font-medium"
                    data-testid="button-create-playlist"
                  >
                    <Plus className="w-4 h-4 mr-1" />
                    + New
                  </Button>
                  <span className="text-muted-foreground text-sm">
                    {myPlaylists.length + likedPlaylists.length}
                  </span>
                </div>
              )}
            </div>
            
            {/* Playlist Tabs - Only show for authenticated users */}
            {user && (
              <Tabs defaultValue="my-playlists" className="w-full">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="my-playlists" data-testid="tab-my-playlists">
                    <User className="w-4 h-4 mr-2" />
                    My Playlists ({myPlaylists.length})
                  </TabsTrigger>
                  <TabsTrigger value="liked-playlists" data-testid="tab-liked-playlists">
                    <Heart className="w-4 h-4 mr-2" />
                    Liked ({likedPlaylists.length})
                  </TabsTrigger>
                </TabsList>
                
                <TabsContent value="my-playlists" className="mt-6">
                  <PlaylistLibrary
                    playlists={myPlaylists}
                    isLoading={isLoadingMy}
                    onViewPlaylist={handleViewPlaylist}
                    onCreatePlaylist={handleCreatePlaylist}
                    searchQuery={searchQuery}
                  />
                </TabsContent>
                
                <TabsContent value="liked-playlists" className="mt-6">
                  <PlaylistLibrary
                    playlists={likedPlaylists}
                    isLoading={isLoadingLiked}
                    onViewPlaylist={handleViewPlaylist}
                    onCreatePlaylist={handleCreatePlaylist}
                    searchQuery={searchQuery}
                  />
                </TabsContent>
                
              </Tabs>
            )}
          </section>
      </main>

      {/* Create Playlist Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-lg font-semibold">Create New Playlist</DialogTitle>
          </DialogHeader>
          
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Playlist Name</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="Enter playlist name"
                        {...field}
                        data-testid="input-playlist-name"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description (Optional)</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Describe your playlist"
                        rows={3}
                        value={field.value || ""}
                        onChange={field.onChange}
                        onBlur={field.onBlur}
                        name={field.name}
                        ref={field.ref}
                        data-testid="textarea-playlist-description"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="isPublic"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                    <div className="space-y-0.5">
                      <FormLabel className="text-base">
                        Make playlist public
                      </FormLabel>
                      <div className="text-sm text-muted-foreground">
                        Allow others to see and follow your playlist
                      </div>
                    </div>
                    <FormControl>
                      <Switch
                        checked={field.value || false}
                        onCheckedChange={field.onChange}
                        data-testid="switch-playlist-public"
                      />
                    </FormControl>
                  </FormItem>
                )}
              />

              <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowCreateDialog(false)}
                  data-testid="button-cancel-playlist"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={createPlaylistMutation.isPending}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white"
                  data-testid="button-save-playlist"
                >
                  {createPlaylistMutation.isPending ? "Creating..." : "Create Playlist"}
                </Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}