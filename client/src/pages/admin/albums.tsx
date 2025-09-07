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
  Disc, 
  Search, 
  Plus, 
  Pencil, 
  Trash2, 
  Music,
  Calendar,
  UserIcon
} from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { apiRequest } from "@/lib/queryClient";
import toast from "react-hot-toast";
import type { Album } from "@shared/schema";

const albumFormSchema = z.object({
  title: z.string().min(1, "Album title is required"),
  artistId: z.string().min(1, "Artist is required"),
  description: z.string().optional(),
  releaseDate: z.string().min(1, "Release date is required"),
  genre: z.string().min(1, "Genre is required"),
  coverArt: z.string().url().optional().or(z.literal("")),
});

type AlbumFormData = z.infer<typeof albumFormSchema>;

export default function AlbumsManagement() {
  const [searchQuery, setSearchQuery] = useState("");
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [editingAlbum, setEditingAlbum] = useState<Album | null>(null);
  const queryClient = useQueryClient();

  const form = useForm<AlbumFormData>({
    resolver: zodResolver(albumFormSchema),
    defaultValues: {
      title: "",
      artistId: "",
      description: "",
      releaseDate: "",
      genre: "",
      coverArt: "",
    },
  });

  const { data: albums = [], isLoading } = useQuery<Album[]>({
    queryKey: ["/api/albums"],
    queryFn: async () => {
      // Mock data for now since we need to implement albums endpoint
      return [
        {
          id: "1",
          title: "Midnight Echoes",
          artistId: "1",
          description: "A collection of ambient electronic tracks",
          releaseDate: new Date("2024-03-15"),
          genre: "Electronic",
          coverArt: "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=300",
          createdAt: new Date("2024-02-01"),
        },
        {
          id: "2",
          title: "Jazz Standards Vol. 1",
          artistId: "2", 
          description: "Classic jazz standards with a modern twist",
          releaseDate: new Date("2023-12-10"),
          genre: "Jazz",
          coverArt: "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=300",
          createdAt: new Date("2023-11-01"),
        }
      ] as Album[];
    }
  });

  const { data: artists = [] } = useQuery({
    queryKey: ["/api/artists"],
    queryFn: async () => {
      return [
        { id: "1", name: "Luna Collective" },
        { id: "2", name: "Jazz Quintet" },
      ];
    }
  });

  const { data: tracks = [] } = useQuery({
    queryKey: ["/api/tracks"],
  });

  const createAlbumMutation = useMutation({
    mutationFn: async (data: AlbumFormData) => {
      const response = await apiRequest("POST", "/api/albums", {
        ...data,
        releaseDate: new Date(data.releaseDate),
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/albums"] });
      toast.success("Album created successfully");
      setIsCreateDialogOpen(false);
      form.reset();
    },
    onError: () => {
      toast.error("Failed to create album");
    },
  });

  const updateAlbumMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: AlbumFormData }) => {
      const response = await apiRequest("PUT", `/api/albums/${id}`, {
        ...data,
        releaseDate: new Date(data.releaseDate),
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/albums"] });
      toast.success("Album updated successfully");
      setEditingAlbum(null);
      form.reset();
    },
    onError: () => {
      toast.error("Failed to update album");
    },
  });

  const deleteAlbumMutation = useMutation({
    mutationFn: async (albumId: string) => {
      await apiRequest("DELETE", `/api/albums/${albumId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/albums"] });
      toast.success("Album deleted successfully");
    },
    onError: () => {
      toast.error("Failed to delete album");
    },
  });

  const filteredAlbums = albums.filter(album =>
    album.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    album.genre.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (album.description && album.description.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const handleCreateAlbum = (data: AlbumFormData) => {
    createAlbumMutation.mutate(data);
  };

  const handleUpdateAlbum = (data: AlbumFormData) => {
    if (editingAlbum) {
      updateAlbumMutation.mutate({ id: editingAlbum.id, data });
    }
  };

  const handleDeleteAlbum = (albumId: string, albumTitle: string) => {
    if (window.confirm(`Are you sure you want to delete "${albumTitle}"?`)) {
      deleteAlbumMutation.mutate(albumId);
    }
  };

  const handleEditAlbum = (album: Album) => {
    setEditingAlbum(album);
    form.reset({
      title: album.title,
      artistId: album.artistId,
      description: album.description || "",
      releaseDate: album.releaseDate.toISOString().split('T')[0],
      genre: album.genre,
      coverArt: album.coverArt || "",
    });
  };

  const getArtistName = (artistId: string) => {
    const artist = artists.find((a: any) => a.id === artistId);
    return artist?.name || "Unknown Artist";
  };

  const getAlbumTrackCount = (albumId: string) => {
    return tracks.filter((track: any) => track.albumId === albumId).length;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <Disc className="h-12 w-12 text-gray-400 mx-auto mb-4 animate-pulse" />
          <p className="text-gray-500">Loading albums...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Albums Management</h1>
          <p className="text-gray-600 dark:text-gray-400">Manage albums in your music collection</p>
        </div>
        <Button 
          onClick={() => setIsCreateDialogOpen(true)}
          className="bg-purple-600 hover:bg-purple-700"
          data-testid="button-add-album"
        >
          <Plus className="h-4 w-4 mr-2" />
          Add Album
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <Disc className="h-8 w-8 text-purple-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Albums</p>
                <p className="text-2xl font-bold">{albums.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <Calendar className="h-8 w-8 text-blue-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">This Year</p>
                <p className="text-2xl font-bold">
                  {albums.filter(album => album.releaseDate.getFullYear() === new Date().getFullYear()).length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <UserIcon className="h-8 w-8 text-green-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Artists</p>
                <p className="text-2xl font-bold">
                  {new Set(albums.map(album => album.artistId)).size}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <Music className="h-8 w-8 text-orange-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Genres</p>
                <p className="text-2xl font-bold">
                  {new Set(albums.map(album => album.genre)).size}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search and Albums Table */}
      <Card>
        <CardHeader>
          <CardTitle>Album Collection</CardTitle>
          <CardDescription>Search and manage all albums in your library</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center space-x-2 mb-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search albums, genres, or descriptions..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
                data-testid="input-search-albums"
              />
            </div>
          </div>

          <div className="border rounded-lg">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Album</TableHead>
                  <TableHead>Artist</TableHead>
                  <TableHead>Genre</TableHead>
                  <TableHead>Release Date</TableHead>
                  <TableHead>Tracks</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredAlbums.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8">
                      <Disc className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-500">
                        {searchQuery ? "No albums found matching your search" : "No albums found"}
                      </p>
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredAlbums.map((album) => (
                    <TableRow key={album.id} data-testid={`album-row-${album.id}`}>
                      <TableCell>
                        <div className="flex items-center space-x-3">
                          <img 
                            src={album.coverArt || 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=100'} 
                            alt={album.title}
                            className="w-12 h-12 rounded object-cover"
                          />
                          <div>
                            <p className="font-medium">{album.title}</p>
                            {album.description && (
                              <p className="text-sm text-gray-500 truncate max-w-48">{album.description}</p>
                            )}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>{getArtistName(album.artistId)}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{album.genre}</Badge>
                      </TableCell>
                      <TableCell>{album.releaseDate.toLocaleDateString()}</TableCell>
                      <TableCell>{getAlbumTrackCount(album.id)}</TableCell>
                      <TableCell>{album.createdAt.toLocaleDateString()}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end space-x-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEditAlbum(album)}
                            data-testid={`button-edit-${album.id}`}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteAlbum(album.id, album.title)}
                            className="text-red-600 hover:text-red-700 hover:bg-red-50"
                            data-testid={`button-delete-${album.id}`}
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

      {/* Create/Edit Album Dialog */}
      <Dialog open={isCreateDialogOpen || !!editingAlbum} onOpenChange={(open) => {
        if (!open) {
          setIsCreateDialogOpen(false);
          setEditingAlbum(null);
          form.reset();
        }
      }}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>
              {editingAlbum ? "Edit Album" : "Add New Album"}
            </DialogTitle>
            <DialogDescription>
              {editingAlbum ? "Update album information" : "Create a new album entry"}
            </DialogDescription>
          </DialogHeader>
          
          <Form {...form}>
            <form 
              onSubmit={form.handleSubmit(editingAlbum ? handleUpdateAlbum : handleCreateAlbum)} 
              className="space-y-4"
            >
              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Album Title</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter album title" {...field} data-testid="input-album-title" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="artistId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Artist</FormLabel>
                    <FormControl>
                      <select 
                        {...field}
                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                        data-testid="select-album-artist"
                      >
                        <option value="">Select artist</option>
                        {artists.map((artist: any) => (
                          <option key={artist.id} value={artist.id}>
                            {artist.name}
                          </option>
                        ))}
                      </select>
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
                      <Input placeholder="e.g. Electronic, Jazz, Rock" {...field} data-testid="input-album-genre" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="releaseDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Release Date</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} data-testid="input-album-date" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="coverArt"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Cover Art URL</FormLabel>
                    <FormControl>
                      <Input placeholder="https://example.com/cover.jpg" {...field} data-testid="input-album-cover" />
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
                    <FormLabel>Description</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Album description..."
                        className="resize-none"
                        rows={3}
                        {...field}
                        data-testid="textarea-album-description"
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
                    setEditingAlbum(null);
                    form.reset();
                  }}
                  data-testid="button-cancel-album"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={createAlbumMutation.isPending || updateAlbumMutation.isPending}
                  data-testid="button-save-album"
                >
                  {(createAlbumMutation.isPending || updateAlbumMutation.isPending) && "Saving..."}
                  {!createAlbumMutation.isPending && !updateAlbumMutation.isPending && (
                    editingAlbum ? "Update Album" : "Create Album"
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