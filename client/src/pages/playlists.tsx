import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import Sidebar from "@/components/sidebar";
import MobileHeader from "@/components/mobile-header";
import MobileBottomNav from "@/components/mobile-bottom-nav";
import MobileDrawer from "@/components/mobile-drawer";
import PlaylistLibrary from "@/components/playlist-library";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Search, Plus, Bell, User } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import toast from "react-hot-toast";
import { insertPlaylistSchema } from "@shared/schema";
import { z } from "zod";
import type { Playlist } from "@shared/schema";
import { useMusicPlayer } from "@/hooks/use-music-player";

const createPlaylistSchema = insertPlaylistSchema.omit({ userId: true });
type CreatePlaylistForm = z.infer<typeof createPlaylistSchema>;

export default function Playlists() {
  const [searchQuery, setSearchQuery] = useState("");
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [isMobileDrawerOpen, setIsMobileDrawerOpen] = useState(false);
  const queryClient = useQueryClient();
  const { currentSong } = useMusicPlayer();

  const { data: playlists = [], isLoading } = useQuery<Playlist[]>({
    queryKey: ["/api/playlists/public"],
    enabled: !searchQuery,
  });

  // TODO: Add search for playlists
  const displayPlaylists = playlists;

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
      const response = await apiRequest("POST", "/api/playlists", data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/playlists/public"] });
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
    <div className="min-h-screen flex flex-col">
      {/* Mobile Header */}
      <MobileHeader 
        onSearch={setSearchQuery}
        searchQuery={searchQuery}
        onMenuToggle={() => setIsMobileDrawerOpen(true)}
      />

      {/* Mobile Drawer */}
      <MobileDrawer 
        isOpen={isMobileDrawerOpen}
        onClose={() => setIsMobileDrawerOpen(false)}
        onCategorySelect={() => {}}
        selectedCategory=""
      />

      <div className="flex flex-1">
        {/* Desktop Sidebar */}
        <div className="hidden md:block">
          <Sidebar 
            onCategorySelect={() => {}}
            selectedCategory=""
            recentSongs={[]}
          />
        </div>

        <main className={`flex-1 overflow-auto custom-scrollbar ${currentSong ? 'pb-44' : 'pb-20'} md:pb-32`}>
          {/* Desktop Header with Search */}
          <header className="sticky top-0 z-10 bg-background/95 backdrop-blur-sm border-b border-border p-6 hidden md:block">
            <div className="flex items-center justify-between">
              <div className="flex-1 max-w-md">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                  <Input
                    type="text"
                    placeholder="Search playlists..."
                    className="pl-10 bg-input border-border font-serif"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    data-testid="input-search-playlists"
                  />
                </div>
              </div>
              <div className="flex items-center space-x-4 ml-6">
                <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
                  <DialogTrigger asChild>
                    <Button 
                      className="bg-primary text-primary-foreground hover:bg-primary/90"
                      data-testid="button-create-playlist-header"
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Create Playlist
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Create New Playlist</DialogTitle>
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
                                  {...field} 
                                  placeholder="My Awesome Playlist"
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
                                  {...field} 
                                  placeholder="Tell us about your playlist..."
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
                            <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                              <div className="space-y-0.5">
                                <FormLabel>Public Playlist</FormLabel>
                                <div className="text-sm text-muted-foreground">
                                  Allow others to discover and follow your playlist
                                </div>
                              </div>
                              <FormControl>
                                <Switch
                                  checked={field.value}
                                  onCheckedChange={field.onChange}
                                  data-testid="switch-playlist-public"
                                />
                              </FormControl>
                            </FormItem>
                          )}
                        />
                        <div className="flex justify-end space-x-2">
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
                            data-testid="button-create-playlist-submit"
                          >
                            {createPlaylistMutation.isPending ? "Creating..." : "Create Playlist"}
                          </Button>
                        </div>
                      </form>
                    </Form>
                  </DialogContent>
                </Dialog>
                <Button variant="ghost" size="sm" className="p-2" data-testid="button-notifications">
                  <Bell className="w-4 h-4 text-muted-foreground" />
                </Button>
                <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center">
                  <User className="w-4 h-4 text-primary-foreground" />
                </div>
              </div>
            </div>
          </header>

          {/* Page Content */}
          <section className="px-4 md:px-6 pb-6">
            <div className="mb-4 md:mb-6">
              <h2 className="text-xl md:text-2xl font-bold text-foreground mb-1 md:mb-2 font-sans">
                Playlists
              </h2>
              <p className="text-sm md:text-base text-muted-foreground font-serif">
                Create and discover music playlists
              </p>
            </div>
            
            {/* Playlists Library */}
            <PlaylistLibrary
              playlists={displayPlaylists}
              isLoading={isLoading}
              onViewPlaylist={handleViewPlaylist}
              onCreatePlaylist={handleCreatePlaylist}
              searchQuery={searchQuery}
            />
          </section>
        </main>
      </div>

      {/* Mobile Bottom Navigation */}
      <MobileBottomNav />
    </div>
  );
}