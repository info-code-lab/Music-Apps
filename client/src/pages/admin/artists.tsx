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
  UserIcon, 
  Search, 
  Plus, 
  Pencil, 
  Trash2, 
  Music,
  Calendar,
  MapPin,
  MoreHorizontal,
  Users,
  Star,
  Eye,
  Download
} from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { apiRequest } from "@/lib/queryClient";
import toast from "react-hot-toast";

// Mock Artist type since we don't have it in shared schema yet
interface Artist {
  id: string;
  name: string;
  bio?: string;
  profilePic?: string;
  createdAt?: string;
  trackCount?: number;
  followers?: number;
}

const artistFormSchema = z.object({
  name: z.string().min(1, "Artist name is required"),
  bio: z.string().optional(),
  profilePic: z.string().url().optional().or(z.literal("")),
});

type ArtistFormData = z.infer<typeof artistFormSchema>;

export default function ArtistsManagement() {
  const [searchQuery, setSearchQuery] = useState("");
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const queryClient = useQueryClient();


  const { data: artists = [], isLoading } = useQuery<Artist[]>({
    queryKey: ["/api/artists"],
    queryFn: async () => {
      const res = await apiRequest("GET", "/api/artists");
      return res.json();
    }
  });

  const form = useForm<ArtistFormData>({
    resolver: zodResolver(artistFormSchema),
    defaultValues: {
      name: "",
      bio: "",
      profilePic: "",
    },
  });

  const createArtistMutation = useMutation({
    mutationFn: async (data: ArtistFormData) => {
      await apiRequest("POST", "/api/artists", data);
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
    artist.bio?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const onSubmit = (data: ArtistFormData) => {
    createArtistMutation.mutate(data);
  };

  const handleDeleteArtist = (artistId: string) => {
    deleteArtistMutation.mutate(artistId);
  };

  const stats = [
    { title: "Total Artists", value: artists.length, icon: UserIcon, color: "text-blue-600" },
    { title: "Total Tracks", value: artists.reduce((acc, a) => acc + (a.trackCount || 0), 0), icon: Music, color: "text-purple-600" },
    { title: "Total Followers", value: artists.reduce((acc, a) => acc + (a.followers || 0), 0).toLocaleString(), icon: Users, color: "text-green-600" },
    { title: "Top Artist", value: artists.sort((a, b) => (b.followers || 0) - (a.followers || 0))[0]?.name || "-", icon: Star, color: "text-yellow-600" }
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Artists Management</h1>
          <p className="text-gray-600 dark:text-gray-400">Manage artists and their profiles</p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" className="gap-2">
            <Download className="h-4 w-4" />
            Export
          </Button>
          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-gradient-to-r from-slate-700 to-slate-800 hover:from-slate-800 hover:to-slate-900 text-white shadow-lg gap-2">
                <Plus className="h-4 w-4" />
                Add Artist
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>Add New Artist</DialogTitle>
                <DialogDescription>Create a new artist profile</DialogDescription>
              </DialogHeader>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Artist Name</FormLabel>
                        <FormControl>
                          <Input placeholder="Enter artist name" {...field} data-testid="artist-name-input" />
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
                          <Textarea placeholder="Enter artist biography" {...field} data-testid="artist-bio-input" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="profilePic"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Profile Picture URL</FormLabel>
                        <FormControl>
                          <Input placeholder="https://example.com/image.jpg" {...field} data-testid="artist-image-input" />
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
                      disabled={createArtistMutation.isPending}
                      className="flex-1"
                      data-testid="create-artist-submit"
                    >
                      {createArtistMutation.isPending ? "Creating..." : "Create Artist"}
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

      {/* Artists Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <UserIcon className="h-5 w-5" />
            Artist Directory
          </CardTitle>
          <CardDescription>Browse and manage all artists on your platform</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search artists..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
                data-testid="search-artists"
              />
            </div>
          </div>

          <div className="border rounded-lg">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-16">Avatar</TableHead>
                  <TableHead>Artist</TableHead>
                  <TableHead>Biography</TableHead>
                  <TableHead>Tracks</TableHead>
                  <TableHead>Followers</TableHead>
                  <TableHead>Join Date</TableHead>
                  <TableHead className="w-12"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8">
                      <div className="flex items-center justify-center gap-2">
                        <div className="animate-spin rounded-full h-4 w-4 border-2 border-blue-600 border-t-transparent"></div>
                        Loading artists...
                      </div>
                    </TableCell>
                  </TableRow>
                ) : filteredArtists.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8">
                      <div className="flex flex-col items-center gap-2">
                        <UserIcon className="h-8 w-8 text-gray-400" />
                        <p className="text-gray-500">No artists found</p>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredArtists.map((artist) => (
                    <TableRow key={artist.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                      <TableCell>
                        <div className="w-12 h-12 rounded-full overflow-hidden bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                          {artist.profilePic ? (
                            <img
                              src={artist.profilePic}
                              alt={artist.name}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <UserIcon className="h-6 w-6 text-white" />
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div>
                          <p className="font-medium text-gray-900 dark:text-white">{artist.name}</p>
                          <p className="text-sm text-gray-500 dark:text-gray-400">ID: {artist.id}</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <p className="text-sm text-gray-600 dark:text-gray-400 max-w-xs truncate">
                          {artist.bio || "No biography available"}
                        </p>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Music className="h-4 w-4 text-purple-500" />
                          <span className="font-medium">{artist.trackCount || 0}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Users className="h-4 w-4 text-green-500" />
                          <span className="font-medium">{artist.followers?.toLocaleString() || 0}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Calendar className="h-4 w-4 text-gray-400" />
                          <span className="text-sm text-gray-600 dark:text-gray-400">
                            {artist.createdAt ? new Date(artist.createdAt).toLocaleDateString() : "Unknown"}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm" data-testid={`artist-actions-${artist.id}`}>
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuLabel>Actions</DropdownMenuLabel>
                            <DropdownMenuItem className="gap-2">
                              <Eye className="h-4 w-4" />
                              View Profile
                            </DropdownMenuItem>
                            <DropdownMenuItem className="gap-2">
                              <Pencil className="h-4 w-4" />
                              Edit Artist
                            </DropdownMenuItem>
                            <DropdownMenuItem className="gap-2">
                              <Music className="h-4 w-4" />
                              View Tracks
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem 
                              className="gap-2 text-red-600"
                              onClick={() => handleDeleteArtist(artist.id)}
                              data-testid={`delete-artist-${artist.id}`}
                            >
                              <Trash2 className="h-4 w-4" />
                              Delete Artist
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
          {filteredArtists.length > 0 && (
            <div className="flex items-center justify-between mt-4">
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Showing {filteredArtists.length} of {artists.length} artists
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