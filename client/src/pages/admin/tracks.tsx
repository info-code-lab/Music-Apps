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
  Music, 
  Search, 
  Plus, 
  Pencil, 
  Trash2, 
  Heart,
  Play,
  MoreHorizontal
} from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { formatDuration } from "@/lib/audio-utils";
import toast from "react-hot-toast";
import type { Track } from "@shared/schema";

export default function TracksManagement() {
  const [searchQuery, setSearchQuery] = useState("");
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const queryClient = useQueryClient();

  const { data: tracks = [], isLoading } = useQuery<Track[]>({
    queryKey: ["/api/tracks"],
  });

  const deleteTrackMutation = useMutation({
    mutationFn: async (trackId: string) => {
      await apiRequest("DELETE", `/api/tracks/${trackId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/tracks"] });
      toast.success("Track deleted successfully");
    },
    onError: () => {
      toast.error("Failed to delete track");
    },
  });

  const toggleFavoriteMutation = useMutation({
    mutationFn: async (trackId: string) => {
      const response = await apiRequest("PATCH", `/api/tracks/${trackId}/favorite`);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/tracks"] });
      toast.success("Favorite status updated");
    },
    onError: () => {
      toast.error("Failed to update favorite");
    },
  });

  const filteredTracks = tracks.filter(track =>
    track.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    track.artist.toLowerCase().includes(searchQuery.toLowerCase()) ||
    track.category.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleDeleteTrack = (trackId: string, trackTitle: string) => {
    if (window.confirm(`Are you sure you want to delete "${trackTitle}"?`)) {
      deleteTrackMutation.mutate(trackId);
    }
  };

  const getCategoryColor = (category: string) => {
    const colors = {
      Jazz: "bg-blue-100 text-blue-800",
      Electronic: "bg-purple-100 text-purple-800",
      Classical: "bg-green-100 text-green-800",
      Rock: "bg-red-100 text-red-800",
      Folk: "bg-yellow-100 text-yellow-800",
      "Hip-Hop": "bg-orange-100 text-orange-800",
    };
    return colors[category as keyof typeof colors] || "bg-gray-100 text-gray-800";
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <Music className="h-12 w-12 text-gray-400 mx-auto mb-4 animate-pulse" />
          <p className="text-gray-500">Loading tracks...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Tracks Management</h1>
          <p className="text-gray-600 dark:text-gray-400">Manage your music library</p>
        </div>
        <Button 
          onClick={() => setIsCreateDialogOpen(true)}
          className="bg-purple-600 hover:bg-purple-700"
          data-testid="button-add-track"
        >
          <Plus className="h-4 w-4 mr-2" />
          Add Track
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <Music className="h-8 w-8 text-purple-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Tracks</p>
                <p className="text-2xl font-bold">{tracks.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <Heart className="h-8 w-8 text-red-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Favorites</p>
                <p className="text-2xl font-bold">
                  {tracks.filter(track => track.isFavorite).length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <Play className="h-8 w-8 text-blue-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Categories</p>
                <p className="text-2xl font-bold">
                  {new Set(tracks.map(track => track.category)).size}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <MoreHorizontal className="h-8 w-8 text-green-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Duration</p>
                <p className="text-2xl font-bold">
                  {Math.floor(tracks.reduce((total, track) => total + track.duration, 0) / 60)}m
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search and Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Track Library</CardTitle>
          <CardDescription>Search and manage all tracks in your library</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center space-x-2 mb-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search tracks, artists, or categories..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
                data-testid="input-search-tracks"
              />
            </div>
          </div>

          {/* Tracks Table */}
          <div className="border rounded-lg">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Track</TableHead>
                  <TableHead>Artist</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Duration</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Favorite</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredTracks.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8">
                      <Music className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-500">
                        {searchQuery ? "No tracks found matching your search" : "No tracks found"}
                      </p>
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredTracks.map((track) => (
                    <TableRow key={track.id} data-testid={`track-row-${track.id}`}>
                      <TableCell>
                        <div className="flex items-center space-x-3">
                          <img 
                            src={track.artwork || 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?ixlib=rb-4.0.3&auto=format&fit=crop&w=100&h=100'} 
                            alt={track.title}
                            className="w-10 h-10 rounded object-cover"
                          />
                          <div>
                            <p className="font-medium">{track.title}</p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>{track.artist}</TableCell>
                      <TableCell>
                        <Badge className={getCategoryColor(track.category)}>
                          {track.category}
                        </Badge>
                      </TableCell>
                      <TableCell>{formatDuration(track.duration)}</TableCell>
                      <TableCell>
                        <Badge variant="outline">
                          {track.uploadType}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => toggleFavoriteMutation.mutate(track.id)}
                          data-testid={`button-favorite-${track.id}`}
                        >
                          <Heart 
                            className={`h-4 w-4 ${
                              track.isFavorite 
                                ? 'fill-red-500 text-red-500' 
                                : 'text-gray-400'
                            }`} 
                          />
                        </Button>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end space-x-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            data-testid={`button-edit-${track.id}`}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteTrack(track.id, track.title)}
                            className="text-red-600 hover:text-red-700 hover:bg-red-50"
                            data-testid={`button-delete-${track.id}`}
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
    </div>
  );
}