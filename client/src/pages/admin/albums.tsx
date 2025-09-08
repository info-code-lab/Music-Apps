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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { 
  Disc, 
  Search, 
  Plus, 
  Pencil, 
  Trash2, 
  Music,
  Calendar,
  MoreHorizontal,
  Eye,
  Play,
  Download,
  Users,
  Clock
} from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { apiRequest } from "@/lib/queryClient";
import toast from "react-hot-toast";

// Mock Album interface
interface Album {
  id: string;
  title: string;
  artistId: string;
  artistName?: string;
  releaseDate?: string;
  coverArt?: string;
  createdAt?: string;
  trackCount?: number;
  duration?: number;
}

const albumFormSchema = z.object({
  title: z.string().min(1, "Album title is required"),
  artistId: z.string().min(1, "Artist is required"),
  releaseDate: z.string().optional(),
  coverArt: z.string().url().optional().or(z.literal("")),
});

type AlbumFormData = z.infer<typeof albumFormSchema>;

export default function AlbumsManagement() {
  const [searchQuery, setSearchQuery] = useState("");
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const queryClient = useQueryClient();

  const { data: albums = [], isLoading } = useQuery<Album[]>({
    queryKey: ["/api/albums"],
    queryFn: async () => {
      const res = await apiRequest("GET", "/api/albums");
      return res.json();
    }
  });

  const { data: artists = [] } = useQuery<{id: string; name: string}[]>({
    queryKey: ["/api/artists"],
    queryFn: async () => {
      const res = await apiRequest("GET", "/api/artists");
      return res.json();
    }
  });

  const form = useForm<AlbumFormData>({
    resolver: zodResolver(albumFormSchema),
    defaultValues: {
      title: "",
      artistId: "",
      releaseDate: "",
      coverArt: "",
    },
  });

  const createAlbumMutation = useMutation({
    mutationFn: async (data: AlbumFormData) => {
      await apiRequest("POST", "/api/albums", data);
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
    album.artistName?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const onSubmit = (data: AlbumFormData) => {
    createAlbumMutation.mutate(data);
  };

  const handleDeleteAlbum = (albumId: string) => {
    deleteAlbumMutation.mutate(albumId);
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const hrs = Math.floor(mins / 60);
    const remainingMins = mins % 60;
    return hrs > 0 ? `${hrs}h ${remainingMins}m` : `${mins}m`;
  };

  const stats = [
    { title: "Total Albums", value: albums.length, icon: Disc, color: "text-purple-600" },
    { title: "Total Songs", value: albums.reduce((acc, a) => acc + (a.trackCount || 0), 0), icon: Music, color: "text-blue-600" },
    { title: "Total Duration", value: formatDuration(albums.reduce((acc, a) => acc + (a.duration || 0), 0)), icon: Clock, color: "text-green-600" },
    { title: "Latest Release", value: albums.sort((a, b) => new Date(b.releaseDate || '').getTime() - new Date(a.releaseDate || '').getTime())[0]?.title || "-", icon: Calendar, color: "text-orange-600" }
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Albums Management</h1>
          <p className="text-gray-600 dark:text-gray-400">Manage music albums and collections</p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" className="gap-2">
            <Download className="h-4 w-4" />
            Export
          </Button>
          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-700 hover:to-indigo-800 shadow-lg gap-2">
                <Plus className="h-4 w-4" />
                Add Album
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>Add New Album</DialogTitle>
                <DialogDescription>Create a new album collection</DialogDescription>
              </DialogHeader>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                  <FormField
                    control={form.control}
                    name="title"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Album Title</FormLabel>
                        <FormControl>
                          <Input placeholder="Enter album title" {...field} data-testid="album-title-input" />
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
                          <select {...field} className="w-full px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-md bg-white dark:bg-gray-800" data-testid="album-artist-select">
                            <option value="">Select an artist</option>
                            {artists.map((artist) => (
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
                    name="releaseDate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Release Date</FormLabel>
                        <FormControl>
                          <Input type="date" {...field} data-testid="album-date-input" />
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
                          <Input placeholder="https://example.com/cover.jpg" {...field} data-testid="album-cover-input" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <div className="flex gap-2 pt-4">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setIsCreateDialogOpen(false)}
                      className="flex-1"
                    >
                      Cancel
                    </Button>
                    <Button
                      type="submit"
                      disabled={createAlbumMutation.isPending}
                      className="flex-1"
                      data-testid="create-album-submit"
                    >
                      {createAlbumMutation.isPending ? "Creating..." : "Create Album"}
                    </Button>
                  </div>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <Card key={stat.title}>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400">{stat.title}</p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">{stat.value}</p>
                  </div>
                  <Icon className={`h-8 w-8 ${stat.color}`} />
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Albums Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Disc className="h-5 w-5" />
            Album Collection
          </CardTitle>
          <CardDescription>Browse and manage all albums on your platform</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search albums, artists..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
                data-testid="search-albums"
              />
            </div>
          </div>

          <div className="border rounded-lg">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-16">Cover</TableHead>
                  <TableHead>Album</TableHead>
                  <TableHead>Artist</TableHead>
                  <TableHead>Songs</TableHead>
                  <TableHead>Duration</TableHead>
                  <TableHead>Release Date</TableHead>
                  <TableHead className="w-12"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8">
                      <div className="flex items-center justify-center gap-2">
                        <div className="animate-spin rounded-full h-4 w-4 border-2 border-purple-600 border-t-transparent"></div>
                        Loading albums...
                      </div>
                    </TableCell>
                  </TableRow>
                ) : filteredAlbums.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8">
                      <div className="flex flex-col items-center gap-2">
                        <Disc className="h-8 w-8 text-gray-400" />
                        <p className="text-gray-500">No albums found</p>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredAlbums.map((album) => (
                    <TableRow key={album.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                      <TableCell>
                        <div className="w-12 h-12 rounded-lg overflow-hidden bg-gradient-to-br from-purple-500 to-pink-600 flex items-center justify-center">
                          {album.coverArt ? (
                            <img
                              src={album.coverArt}
                              alt={album.title}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <Disc className="h-6 w-6 text-white" />
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div>
                          <p className="font-medium text-gray-900 dark:text-white">{album.title}</p>
                          <p className="text-sm text-gray-500 dark:text-gray-400">ID: {album.id}</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Users className="h-4 w-4 text-blue-500" />
                          <span className="font-medium">{album.artistName}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Music className="h-4 w-4 text-purple-500" />
                          <span className="font-medium">{album.trackCount || 0}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Clock className="h-4 w-4 text-green-500" />
                          <span className="font-medium">{formatDuration(album.duration || 0)}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Calendar className="h-4 w-4 text-gray-400" />
                          <span className="text-sm text-gray-600 dark:text-gray-400">
                            {album.releaseDate ? new Date(album.releaseDate).toLocaleDateString() : "Unknown"}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm" data-testid={`album-actions-${album.id}`}>
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuLabel>Actions</DropdownMenuLabel>
                            <DropdownMenuItem className="gap-2">
                              <Eye className="h-4 w-4" />
                              View Album
                            </DropdownMenuItem>
                            <DropdownMenuItem className="gap-2">
                              <Pencil className="h-4 w-4" />
                              Edit Album
                            </DropdownMenuItem>
                            <DropdownMenuItem className="gap-2">
                              <Music className="h-4 w-4" />
                              View Songs
                            </DropdownMenuItem>
                            <DropdownMenuItem className="gap-2">
                              <Play className="h-4 w-4" />
                              Play Album
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem 
                              className="gap-2 text-red-600"
                              onClick={() => handleDeleteAlbum(album.id)}
                              data-testid={`delete-album-${album.id}`}
                            >
                              <Trash2 className="h-4 w-4" />
                              Delete Album
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          {/* Pagination Info */}
          {filteredAlbums.length > 0 && (
            <div className="flex items-center justify-between mt-4">
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Showing {filteredAlbums.length} of {albums.length} albums
              </p>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" disabled>
                  Previous
                </Button>
                <Button variant="outline" size="sm" disabled>
                  Next
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}