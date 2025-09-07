import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import PlaylistLibrary from "@/components/playlist-library";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Search, ArrowLeft, Plus } from "lucide-react";
import { Link } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { insertPlaylistSchema } from "@shared/schema";
import { z } from "zod";
import type { Playlist } from "@shared/schema";

const createPlaylistSchema = insertPlaylistSchema.omit({ userId: true });
type CreatePlaylistForm = z.infer<typeof createPlaylistSchema>;

export default function Playlists() {
  const [searchQuery, setSearchQuery] = useState("");
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

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
      isPublic: true,
    },
  });

  const createPlaylistMutation = useMutation({
    mutationFn: async (data: CreatePlaylistForm) => {
      const response = await apiRequest("POST", "/api/playlists", data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/playlists"] });
      setShowCreateDialog(false);
      form.reset();
      toast({
        title: "Playlist created",
        description: "Your new playlist has been created successfully.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to create playlist",
        variant: "destructive",
      });
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
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-10 bg-background/95 backdrop-blur-sm border-b border-border p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Link href="/">
              <Button variant="ghost" size="sm" data-testid="button-back">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Home
              </Button>
            </Link>
            <div>
              <h1 className="text-2xl font-bold text-foreground font-sans">Playlists</h1>
              <p className="text-muted-foreground font-serif">Create and discover music playlists</p>
            </div>
          </div>
          <div className="flex items-center space-x-4">
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
                            <Input placeholder="My Awesome Playlist" {...field} data-testid="input-playlist-name" />
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
                              placeholder="Tell people about your playlist..."
                              className="min-h-[80px]"
                              {...field}
                              value={field.value || ""}
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
                        <FormItem className="flex items-center justify-between">
                          <div>
                            <FormLabel>Make playlist public</FormLabel>
                            <p className="text-sm text-muted-foreground">Allow others to discover and follow your playlist</p>
                          </div>
                          <FormControl>
                            <Switch
                              checked={field.value ?? true}
                              onCheckedChange={field.onChange}
                              data-testid="switch-playlist-public"
                            />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                    <div className="flex justify-end space-x-2">
                      <Button type="button" variant="outline" onClick={() => setShowCreateDialog(false)}>
                        Cancel
                      </Button>
                      <Button 
                        type="submit" 
                        disabled={createPlaylistMutation.isPending}
                        data-testid="button-submit-playlist"
                      >
                        {createPlaylistMutation.isPending ? "Creating..." : "Create Playlist"}
                      </Button>
                    </div>
                  </form>
                </Form>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </header>

      {/* Playlists Library */}
      <PlaylistLibrary
        playlists={displayPlaylists}
        isLoading={isLoading}
        onViewPlaylist={handleViewPlaylist}
        onCreatePlaylist={handleCreatePlaylist}
        searchQuery={searchQuery}
      />
    </div>
  );
}