import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { 
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { 
  UserIcon, 
  Search, 
  Plus, 
  Pencil, 
  Trash2, 
  Music,
  Calendar,
  MapPin
} from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { apiRequest } from "@/lib/queryClient";
import toast from "react-hot-toast";
import type { Artist } from "@shared/schema";

const artistFormSchema = z.object({
  name: z.string().min(1, "Artist name is required"),
  bio: z.string().optional(),
  genre: z.string().min(1, "Genre is required"),
  country: z.string().optional(),
  profileImage: z.string().url().optional().or(z.literal("")),
});

type ArtistFormData = z.infer<typeof artistFormSchema>;

export default function ArtistsManagement() {
  const [searchQuery, setSearchQuery] = useState("");
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [editingArtist, setEditingArtist] = useState<Artist | null>(null);
  const queryClient = useQueryClient();

  const form = useForm<ArtistFormData>({
    resolver: zodResolver(artistFormSchema),
    defaultValues: {
      name: "",
      bio: "",
      genre: "",
      country: "",
      profileImage: "",
    },
  });

  const { data: artists = [], isLoading } = useQuery<Artist[]>({
    queryKey: ["/api/artists"],
    queryFn: async () => {
      // Mock data for now since we need to implement artists endpoint
      return [
        {
          id: "1",
          name: "Luna Collective",
          bio: "Electronic music duo known for ambient soundscapes",
          genre: "Electronic",
          country: "Sweden",
          profileImage: "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=300",
          createdAt: new Date("2024-01-15"),
          isVerified: true,
        },
        {
          id: "2", 
          name: "Jazz Quintet",
          bio: "Traditional jazz ensemble with modern influences",
          genre: "Jazz",
          country: "USA",
          profileImage: "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=300",
          createdAt: new Date("2023-11-20"),
          isVerified: false,
        }
      ] as Artist[];
    }
  });

  const { data: tracks = [] } = useQuery({
    queryKey: ["/api/tracks"],
  });

  const createArtistMutation = useMutation({
    mutationFn: async (data: ArtistFormData) => {
      const response = await apiRequest("POST", "/api/artists", data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/artists"] });
      toast.success("Artist created successfully");
      setIsCreateDialogOpen(false);
      form.reset();
    },
    onError: () => {
      toast.error("Failed to create artist");
    },
  });

  const updateArtistMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: ArtistFormData }) => {
      const response = await apiRequest("PUT", `/api/artists/${id}`, data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/artists"] });
      toast.success("Artist updated successfully");
      setEditingArtist(null);
      form.reset();
    },
    onError: () => {
      toast.error("Failed to update artist");
    },
  });

  const deleteArtistMutation = useMutation({
    mutationFn: async (artistId: string) => {
      await apiRequest("DELETE", `/api/artists/${artistId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/artists"] });
      toast.success("Artist deleted successfully");
    },
    onError: () => {
      toast.error("Failed to delete artist");
    },
  });

  const filteredArtists = artists.filter(artist =>
    artist.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    artist.genre.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (artist.country && artist.country.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const handleCreateArtist = (data: ArtistFormData) => {
    createArtistMutation.mutate(data);
  };

  const handleUpdateArtist = (data: ArtistFormData) => {
    if (editingArtist) {
      updateArtistMutation.mutate({ id: editingArtist.id, data });
    }
  };

  const handleDeleteArtist = (artistId: string, artistName: string) => {
    if (window.confirm(`Are you sure you want to delete "${artistName}"?`)) {
      deleteArtistMutation.mutate(artistId);
    }
  };

  const handleEditArtist = (artist: Artist) => {
    setEditingArtist(artist);
    form.reset({
      name: artist.name,
      bio: artist.bio || "",
      genre: artist.genre,
      country: artist.country || "",
      profileImage: artist.profileImage || "",
    });
  };

  const getArtistTrackCount = (artistName: string) => {
    return tracks.filter((track: any) => track.artist === artistName).length;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <UserIcon className="h-12 w-12 text-gray-400 mx-auto mb-4 animate-pulse" />
          <p className="text-gray-500">Loading artists...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Artists Management</h1>
          <p className="text-gray-600 dark:text-gray-400">Manage artists in your music platform</p>
        </div>
        <Button 
          onClick={() => setIsCreateDialogOpen(true)}
          className="bg-purple-600 hover:bg-purple-700"
          data-testid="button-add-artist"
        >
          <Plus className="h-4 w-4 mr-2" />
          Add Artist
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <UserIcon className="h-8 w-8 text-purple-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Artists</p>
                <p className="text-2xl font-bold">{artists.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <Music className="h-8 w-8 text-blue-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Verified Artists</p>
                <p className="text-2xl font-bold">
                  {artists.filter(artist => artist.isVerified).length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <MapPin className="h-8 w-8 text-green-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Countries</p>
                <p className="text-2xl font-bold">
                  {new Set(artists.map(artist => artist.country).filter(Boolean)).size}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <Calendar className="h-8 w-8 text-orange-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">This Month</p>
                <p className="text-2xl font-bold">3</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search and Artists Table */}
      <Card>
        <CardHeader>
          <CardTitle>Artist Directory</CardTitle>
          <CardDescription>Search and manage all artists on your platform</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center space-x-2 mb-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search artists, genres, or countries..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
                data-testid="input-search-artists"
              />
            </div>
          </div>

          <div className="border rounded-lg">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Artist</TableHead>
                  <TableHead>Genre</TableHead>
                  <TableHead>Country</TableHead>
                  <TableHead>Tracks</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Joined</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredArtists.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8">
                      <UserIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-500">
                        {searchQuery ? "No artists found matching your search" : "No artists found"}
                      </p>
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredArtists.map((artist) => (
                    <TableRow key={artist.id} data-testid={`artist-row-${artist.id}`}>
                      <TableCell>
                        <div className="flex items-center space-x-3">
                          <img 
                            src={artist.profileImage || 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=100'} 
                            alt={artist.name}
                            className="w-10 h-10 rounded-full object-cover"
                          />
                          <div>
                            <p className="font-medium">{artist.name}</p>
                            {artist.bio && (
                              <p className="text-sm text-gray-500 truncate max-w-48">{artist.bio}</p>
                            )}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{artist.genre}</Badge>
                      </TableCell>
                      <TableCell>{artist.country || "—"}</TableCell>
                      <TableCell>{getArtistTrackCount(artist.name)}</TableCell>
                      <TableCell>
                        <Badge variant={artist.isVerified ? "default" : "secondary"}>
                          {artist.isVerified ? "Verified" : "Unverified"}
                        </Badge>
                      </TableCell>
                      <TableCell>{artist.createdAt.toLocaleDateString()}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end space-x-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEditArtist(artist)}
                            data-testid={`button-edit-${artist.id}`}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteArtist(artist.id, artist.name)}
                            className="text-red-600 hover:text-red-700 hover:bg-red-50"
                            data-testid={`button-delete-${artist.id}`}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Create/Edit Artist Dialog */}
      <Dialog open={isCreateDialogOpen || !!editingArtist} onOpenChange={(open) => {
        if (!open) {
          setIsCreateDialogOpen(false);
          setEditingArtist(null);
          form.reset();
        }
      }}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>
              {editingArtist ? "Edit Artist" : "Add New Artist"}
            </DialogTitle>
            <DialogDescription>
              {editingArtist ? "Update artist information" : "Create a new artist profile"}
            </DialogDescription>
          </DialogHeader>
          
          <Form {...form}>
            <form 
              onSubmit={form.handleSubmit(editingArtist ? handleUpdateArtist : handleCreateArtist)} 
              className="space-y-4"
            >
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Artist Name</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter artist name" {...field} data-testid="input-artist-name" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="genre"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Genre</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g. Electronic, Jazz, Rock" {...field} data-testid="input-artist-genre" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="country"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Country</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g. Sweden, USA, UK" {...field} data-testid="input-artist-country" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="profileImage"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Profile Image URL</FormLabel>
                    <FormControl>
                      <Input placeholder="https://example.com/image.jpg" {...field} data-testid="input-artist-image" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="bio"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Biography</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Tell us about this artist..."
                        className="resize-none"
                        rows={3}
                        {...field}
                        data-testid="textarea-artist-bio"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <div className="flex justify-end space-x-2 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setIsCreateDialogOpen(false);
                    setEditingArtist(null);
                    form.reset();
                  }}
                  data-testid="button-cancel-artist"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={createArtistMutation.isPending || updateArtistMutation.isPending}
                  data-testid="button-save-artist"
                >
                  {(createArtistMutation.isPending || updateArtistMutation.isPending) && "Saving..."}
                  {!createArtistMutation.isPending && !updateArtistMutation.isPending && (
                    editingArtist ? "Update Artist" : "Create Artist"
                  )}
                </Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}