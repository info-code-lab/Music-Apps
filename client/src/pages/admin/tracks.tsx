import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { 
  Music, 
  Search, 
  Plus, 
  Pencil, 
  Trash2, 
  Heart,
  Play,
  MoreHorizontal,
  Filter,
  Download,
  Eye,
  Upload,
  BarChart3
} from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import toast from "react-hot-toast";
import type { Track } from "@shared/schema";

export default function SongsManagement() {
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [selectedTracks, setSelectedTracks] = useState<string[]>([]);
  const [isDetailsDialogOpen, setIsDetailsDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [selectedTrack, setSelectedTrack] = useState<Track | null>(null);
  const [editFormData, setEditFormData] = useState({
    title: "",
    artist: "",
    category: ""
  });
  const queryClient = useQueryClient();

  const { data: tracks = [], isLoading } = useQuery<Track[]>({
    queryKey: ["/api/tracks"],
  });

  // Fetch categories from database
  const { data: genres = [] } = useQuery<{id: string; name: string}[]>({
    queryKey: ["/api/genres"],
    queryFn: async () => {
      const res = await apiRequest("GET", "/api/genres");
      return res.json();
    }
  });

  const deleteTrackMutation = useMutation({
    mutationFn: async (trackId: string) => {
      await apiRequest("DELETE", `/api/tracks/${trackId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/tracks"] });
      toast.success("Song deleted successfully");
    },
    onError: () => {
      toast.error("Failed to delete song");
    },
  });

  const toggleFavoriteMutation = useMutation({
    mutationFn: async (trackId: string) => {
      await apiRequest("PATCH", `/api/tracks/${trackId}/favorite`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/tracks"] });
      toast.success("Favorite status updated");
    },
    onError: () => {
      toast.error("Failed to update favorite status");
    },
  });

  const filteredTracks = tracks.filter(track => {
    const matchesSearch = track.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         track.artist.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = categoryFilter === "all" || track.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  // Create categories from database genres, adding "All Categories" at the beginning
  const categories = ["all", ...genres.map(genre => genre.name)];

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const updateTrackMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: any }) => {
      await apiRequest("PUT", `/api/tracks/${id}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/tracks"] });
      toast.success("Track updated successfully");
      setIsEditDialogOpen(false);
      setSelectedTrack(null);
    },
    onError: () => {
      toast.error("Failed to update track");
    },
  });

  const handleDeleteTrack = (trackId: string) => {
    if (confirm('Are you sure you want to delete this track?')) {
      deleteTrackMutation.mutate(trackId);
    }
  };

  const handleToggleFavorite = (trackId: string) => {
    toggleFavoriteMutation.mutate(trackId);
  };

  const handleViewDetails = (track: Track) => {
    setSelectedTrack(track);
    setIsDetailsDialogOpen(true);
  };

  const handleEditTrack = (track: Track) => {
    setSelectedTrack(track);
    setEditFormData({
      title: track.title,
      artist: track.artist,
      category: track.category
    });
    setIsEditDialogOpen(true);
  };

  const handleEditSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedTrack) {
      updateTrackMutation.mutate({ id: selectedTrack.id, data: editFormData });
    }
  };

  const handlePlayTrack = (track: Track) => {
    if (track.audioUrl) {
      const audio = new Audio(track.audioUrl);
      audio.play().catch(() => toast.error('Failed to play track'));
      toast.success(`Now playing: ${track.title}`);
    } else {
      toast.error('Audio file not available');
    }
  };

  const getUploadTypeColor = (uploadType: string) => {
    return uploadType === 'file' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/20' : 'bg-purple-100 text-purple-800 dark:bg-purple-900/20';
  };

  const stats = [
    { title: "Total Songs", value: tracks.length, icon: Music, color: "text-blue-600" },
    { title: "Favorites", value: tracks.filter(t => t.isFavorite).length, icon: Heart, color: "text-red-600" },
    { title: "Categories", value: genres.length, icon: Filter, color: "text-green-600" },
    { title: "Total Duration", value: `${Math.floor(tracks.reduce((acc, t) => acc + t.duration, 0) / 60)}m`, icon: Play, color: "text-purple-600" }
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Songs Management</h1>
          <p className="text-gray-600 dark:text-gray-400">Manage your music library and song content</p>
        </div>
        <div className="flex items-center gap-3">
          <Button className="bg-gradient-to-r from-slate-700 to-slate-800 hover:from-slate-800 hover:to-slate-900 text-white shadow-lg gap-2">
            <Download className="h-4 w-4" />
            Export
          </Button>
          <Dialog>
            <DialogTrigger asChild>
              <Button className="bg-gradient-to-r from-slate-700 to-slate-800 hover:from-slate-800 hover:to-slate-900 text-white shadow-lg gap-2">
                <Plus className="h-4 w-4" />
                Add Song
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add New Song</DialogTitle>
                <DialogDescription>Upload a new song to your music library</DialogDescription>
              </DialogHeader>
              <div className="p-4 text-center">
                <Upload className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-sm text-gray-500">Upload functionality will be implemented</p>
              </div>
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

      {/* Filters and Search */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Music className="h-5 w-5" />
            Song Library
          </CardTitle>
          <CardDescription>Browse and manage all songs in your music library</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search songs, artists..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
                data-testid="search-songs"
              />
            </div>
            <div className="flex gap-2">
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-md bg-white dark:bg-gray-800 text-sm"
                data-testid="filter-category"
              >
                {categories.map(category => (
                  <option key={category} value={category}>
                    {category === "all" ? "All Categories" : category}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Tracks Table */}
          <div className="border rounded-lg">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12"></TableHead>
                  <TableHead>Song</TableHead>
                  <TableHead>Artist</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Duration</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="w-12"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-8">
                      <div className="flex items-center justify-center gap-2">
                        <div className="animate-spin rounded-full h-4 w-4 border-2 border-purple-600 border-t-transparent"></div>
                        Loading tracks...
                      </div>
                    </TableCell>
                  </TableRow>
                ) : filteredTracks.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-8">
                      <div className="flex flex-col items-center gap-2">
                        <Music className="h-8 w-8 text-gray-400" />
                        <p className="text-gray-500">No tracks found</p>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredTracks.map((track) => (
                    <TableRow key={track.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                      <TableCell>
                        <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-blue-600 rounded-lg flex items-center justify-center">
                          <Music className="h-4 w-4 text-white" />
                        </div>
                      </TableCell>
                      <TableCell>
                        <div>
                          <p className="font-medium text-gray-900 dark:text-white">{track.title}</p>
                          <p className="text-sm text-gray-500 dark:text-gray-400">ID: {track.id.slice(0, 8)}...</p>
                        </div>
                      </TableCell>
                      <TableCell className="font-medium">{track.artist}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{track.category}</Badge>
                      </TableCell>
                      <TableCell className="font-mono">{formatDuration(track.duration)}</TableCell>
                      <TableCell>
                        <Badge className={getUploadTypeColor(track.uploadType)}>
                          {track.uploadType}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {track.isFavorite && (
                            <Heart className="h-4 w-4 text-red-500 fill-current" />
                          )}
                          <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200 dark:bg-green-900/20">
                            Active
                          </Badge>
                        </div>
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm" data-testid={`track-actions-${track.id}`}>
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuLabel>Actions</DropdownMenuLabel>
                            <DropdownMenuItem className="gap-2" onClick={() => handleViewDetails(track)}>
                              <Eye className="h-4 w-4" />
                              View Details
                            </DropdownMenuItem>
                            <DropdownMenuItem className="gap-2" onClick={() => handleEditTrack(track)}>
                              <Pencil className="h-4 w-4" />
                              Edit Track
                            </DropdownMenuItem>
                            <DropdownMenuItem className="gap-2" onClick={() => handlePlayTrack(track)}>
                              <Play className="h-4 w-4" />
                              Play Track
                            </DropdownMenuItem>
                            <DropdownMenuItem 
                              className="gap-2"
                              onClick={() => handleToggleFavorite(track.id)}
                            >
                              <Heart className="h-4 w-4" />
                              {track.isFavorite ? 'Remove Favorite' : 'Add Favorite'}
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem 
                              className="gap-2 text-red-600"
                              onClick={() => handleDeleteTrack(track.id)}
                              data-testid={`delete-track-${track.id}`}
                            >
                              <Trash2 className="h-4 w-4" />
                              Delete Track
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
          {filteredTracks.length > 0 && (
            <div className="flex items-center justify-between mt-4">
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Showing {filteredTracks.length} of {tracks.length} tracks
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

      {/* Track Details Dialog */}
      <Dialog open={isDetailsDialogOpen} onOpenChange={setIsDetailsDialogOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Track Details</DialogTitle>
            <DialogDescription>View detailed track information</DialogDescription>
          </DialogHeader>
          {selectedTrack && (
            <div className="space-y-6">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-blue-600 rounded-lg flex items-center justify-center">
                  <Music className="h-8 w-8 text-white" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-900 dark:text-white">{selectedTrack.title}</h3>
                  <p className="text-sm text-gray-500">by {selectedTrack.artist}</p>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-600 dark:text-gray-400">Category</label>
                  <p className="text-gray-900 dark:text-white">{selectedTrack.category}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600 dark:text-gray-400">Duration</label>
                  <p className="text-gray-900 dark:text-white">{formatDuration(selectedTrack.duration)}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600 dark:text-gray-400">Upload Type</label>
                  <p className="text-gray-900 dark:text-white">{selectedTrack.uploadType}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600 dark:text-gray-400">Favorite</label>
                  <p className="text-gray-900 dark:text-white">{selectedTrack.isFavorite ? 'Yes' : 'No'}</p>
                </div>
              </div>
              
              <div>
                <label className="text-sm font-medium text-gray-600 dark:text-gray-400">Track ID</label>
                <p className="text-sm text-gray-500 font-mono">{selectedTrack.id}</p>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Edit Track Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Track</DialogTitle>
            <DialogDescription>Update track information</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleEditSubmit} className="space-y-4">
            <div>
              <label className="text-sm font-medium">Track Title</label>
              <Input
                value={editFormData.title}
                onChange={(e) => setEditFormData({...editFormData, title: e.target.value})}
                placeholder="Enter track title"
                required
              />
            </div>
            <div>
              <label className="text-sm font-medium">Artist</label>
              <Input
                value={editFormData.artist}
                onChange={(e) => setEditFormData({...editFormData, artist: e.target.value})}
                placeholder="Enter artist name"
                required
              />
            </div>
            <div>
              <label className="text-sm font-medium">Category</label>
              <select
                value={editFormData.category}
                onChange={(e) => setEditFormData({...editFormData, category: e.target.value})}
                className="w-full px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-md bg-white dark:bg-gray-800"
                required
              >
                <option value="">Select category</option>
                {genres.map(genre => (
                  <option key={genre.name} value={genre.name}>{genre.name}</option>
                ))}
              </select>
            </div>
            <div className="flex gap-2 pt-4">
              <Button
                type="button"
                onClick={() => setIsEditDialogOpen(false)}
                className="flex-1 bg-gradient-to-r from-slate-700 to-slate-800 hover:from-slate-800 hover:to-slate-900 text-white shadow-lg"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={updateTrackMutation.isPending}
                className="flex-1 bg-gradient-to-r from-slate-700 to-slate-800 hover:from-slate-800 hover:to-slate-900 text-white shadow-lg"
              >
                {updateTrackMutation.isPending ? "Updating..." : "Update Track"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}