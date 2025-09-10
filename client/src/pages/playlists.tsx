import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
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
    <div className="min-h-screen">
      <main className="overflow-auto custom-scrollbar">
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
  );
}