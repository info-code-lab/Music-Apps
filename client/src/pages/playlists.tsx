import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import PlaylistLibrary from "@/components/playlist-library";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Search, Plus, Bell, User, Heart } from "lucide-react";
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

const createPlaylistSchema = insertPlaylistSchema.omit({ userId: true });
type CreatePlaylistForm = z.infer<typeof createPlaylistSchema>;

export default function Playlists() {
  const [searchQuery, setSearchQuery] = useState("");
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const queryClient = useQueryClient();
  const { currentSong } = useMusicPlayer();
  const { user } = useAuth();

  // Get public playlists (for non-authenticated users only)
  const { data: publicPlaylists = [], isLoading: isLoadingPublic } = useQuery<Playlist[]>({
    queryKey: ["/api/playlists/public"],
    enabled: !searchQuery && !user,
  });

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

  const isLoading = (user ? (isLoadingMy || isLoadingLiked) : isLoadingPublic);

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
      // Invalidate all playlist-related queries
      queryClient.invalidateQueries({ queryKey: ["/api/playlists/public"] });
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

  return (
    <div className="min-h-screen">
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
                  {user ? (myPlaylists.length + likedPlaylists.length) : publicPlaylists.length}
                </span>
              </div>
            </div>
            
            {/* Playlist Tabs */}
            {user ? (
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
            ) : (
              <PlaylistLibrary
                playlists={publicPlaylists}
                isLoading={isLoadingPublic}
                onViewPlaylist={handleViewPlaylist}
                onCreatePlaylist={handleCreatePlaylist}
                searchQuery={searchQuery}
              />
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