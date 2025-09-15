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
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Checkbox } from "@/components/ui/checkbox";
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
  BarChart3,
  ChevronDown,
  Check,
  X
} from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import toast from "react-hot-toast";
import type { LegacyTrack } from "@shared/schema";

// Define the admin track type that includes extra fields from getAllSongsWithDetails
type AdminTrack = {
  id: string;
  title: string;
  artist: string;
  artistNames?: string[]; // Array of artist names for multi-select
  category: string;
  categoryNames?: string[]; // Array of category names for multi-select
  albumTitle?: string;
  albumNames?: string[]; // Array of album names for multi-select
  albumIds?: string[]; // Array of album IDs for multi-select
  duration: number;
  albumId: string | null;
  releaseDate: string | null;
  isExplicit: boolean;
  lyrics: string | null;
  genreName: string | null;
  isFavorite?: boolean;
  audioUrl?: string;
  uploadType?: string;
};

export default function SongsManagement() {
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [selectedTracks, setSelectedTracks] = useState<string[]>([]);
  const [isDetailsDialogOpen, setIsDetailsDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [selectedTrack, setSelectedTrack] = useState<AdminTrack | null>(null);
  const [editFormData, setEditFormData] = useState({
    title: "",
    artists: [] as string[],
    categories: [] as string[],
    duration: 0,
    albums: [] as string[],
    releaseDate: "",
    isExplicit: false,
    lyrics: ""
  });
  const [isArtistPopoverOpen, setIsArtistPopoverOpen] = useState(false);
  const [artistSearchTerm, setArtistSearchTerm] = useState("");
  const [isCategoryPopoverOpen, setIsCategoryPopoverOpen] = useState(false);
  const [categorySearchTerm, setCategorySearchTerm] = useState("");
  const [isAlbumPopoverOpen, setIsAlbumPopoverOpen] = useState(false);
  const [albumSearchTerm, setAlbumSearchTerm] = useState("");
  const queryClient = useQueryClient();

  const { data: tracks = [], isLoading } = useQuery<AdminTrack[]>({
    queryKey: ["/api/admin/songs"],
  });

  // Fetch categories from database
  const { data: genres = [] } = useQuery<{id: string; name: string}[]>({
    queryKey: ["/api/genres"],
  });

  // Fetch albums for dropdown
  const { data: albums = [] } = useQuery<{id: string; title: string}[]>({
    queryKey: ["/api/albums"],
  });

  // Fetch artists for multi-select dropdown
  const { data: allArtists = [] } = useQuery<{id: string; name: string}[]>({
    queryKey: ["/api/artists"],
  });

  const deleteTrackMutation = useMutation({
    mutationFn: async (trackId: string) => {
      await apiRequest(`/api/songs/${trackId}`, "DELETE");
    },
    onSuccess: () => {
      // Invalidate all song-related caches to show updates immediately
      queryClient.invalidateQueries({ queryKey: ["/api/songs"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/songs"] });
      queryClient.invalidateQueries({ predicate: (query) => 
        query.queryKey[0] === "/api/songs/genre" || 
        query.queryKey[0] === "/api/songs/search"
      });
      toast.success("Song deleted successfully");
    },
    onError: () => {
      toast.error("Failed to delete song");
    },
  });

  const toggleFavoriteMutation = useMutation({
    mutationFn: async (trackId: string) => {
      await apiRequest(`/api/songs/${trackId}/favorite`, "PATCH");
    },
    onSuccess: () => {
      // Invalidate all song-related caches to show updates immediately
      queryClient.invalidateQueries({ queryKey: ["/api/songs"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/songs"] });
      queryClient.invalidateQueries({ predicate: (query) => 
        query.queryKey[0] === "/api/songs/genre" || 
        query.queryKey[0] === "/api/songs/search"
      });
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
      await apiRequest(`/api/songs/${id}`, "PUT", data);
    },
    onSuccess: (data) => {
      console.log('Update successful:', data);
      // Invalidate all song-related caches to show updates immediately
      queryClient.invalidateQueries({ queryKey: ["/api/songs"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/songs"] });
      queryClient.invalidateQueries({ predicate: (query) => 
        query.queryKey[0] === "/api/songs/genre" || 
        query.queryKey[0] === "/api/songs/search"
      });
      toast.success("Track updated successfully");
      setIsEditDialogOpen(false);
      setSelectedTrack(null);
      // Reset form state
      setEditFormData({
        title: "",
        artists: [],
        categories: [],
        duration: 0,
        albums: [],
        releaseDate: "",
        isExplicit: false,
        lyrics: ""
      });
    },
    onError: (error) => {
      console.error('Update failed:', error);
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

  const handleViewDetails = (track: AdminTrack) => {
    setSelectedTrack(track);
    setIsDetailsDialogOpen(true);
  };

  const handleEditTrack = (track: AdminTrack) => {
    setSelectedTrack(track);
    
    // Use arrays from backend if available, otherwise fall back to parsing strings
    const artistsArray = track.artistNames && track.artistNames.length > 0 
      ? track.artistNames 
      : (track.artist && track.artist !== 'Unknown Artist' ? track.artist.split(', ') : []);
    
    const categoriesArray = track.categoryNames && track.categoryNames.length > 0
      ? track.categoryNames
      : (track.category && track.category !== 'Music' ? track.category.split(', ') : []);
    
    const albumsArray = track.albumIds && track.albumIds.length > 0
      ? track.albumIds
      : (track.albumId ? [track.albumId] : []);
    
    console.log('Editing track:', track);
    console.log('Backend data:');
    console.log('- artistNames:', track.artistNames);
    console.log('- categoryNames:', track.categoryNames);
    console.log('- albumIds:', track.albumIds);
    console.log('Setting form data with:');
    console.log('- artists:', artistsArray);
    console.log('- categories:', categoriesArray);
    console.log('- albums:', albumsArray);
    
    setEditFormData({
      title: track.title,
      artists: artistsArray,
      categories: categoriesArray,
      duration: track.duration || 0,
      albums: albumsArray,
      releaseDate: track.releaseDate || "",
      isExplicit: track.isExplicit || false,
      lyrics: track.lyrics || ""
    });
    setIsEditDialogOpen(true);
  };

  const handleEditSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedTrack) {
      // Convert category names to genre IDs
      const genreIds = editFormData.categories
        .map(categoryName => {
          const genre = genres.find(g => g.name === categoryName);
          return genre?.id;
        })
        .filter(Boolean); // Remove any undefined values
      
      // Use the selected album IDs directly
      const albumIds = editFormData.albums.filter(Boolean);
      
      // Convert artist names to artist IDs
      const artistIds = editFormData.artists
        .map(artistName => {
          const artist = allArtists.find(a => a.name === artistName);
          return artist?.id;
        })
        .filter(Boolean); // Remove any undefined values
      
      // Prepare data in the format expected by the API
      const formDataForAPI = {
        title: editFormData.title,
        duration: editFormData.duration,
        releaseDate: editFormData.releaseDate || null,
        isExplicit: editFormData.isExplicit,
        lyrics: editFormData.lyrics || null,
        artistIds: artistIds,
        genreIds: genreIds,
        albumIds: albumIds
      };
      
      // Remove any undefined fields
      Object.keys(formDataForAPI).forEach(key => {
        if (formDataForAPI[key as keyof typeof formDataForAPI] === undefined) {
          delete formDataForAPI[key as keyof typeof formDataForAPI];
        }
      });
      
      console.log('Submitting update with data:', formDataForAPI);
      console.log('Categories selected:', editFormData.categories, '-> genreIds:', genreIds);
      console.log('Albums selected:', editFormData.albums, '-> albumIds:', albumIds);
      console.log('Artists selected:', editFormData.artists, '-> artistIds:', artistIds);
      updateTrackMutation.mutate({ id: selectedTrack.id, data: formDataForAPI });
    }
  };

  const handleArtistToggle = (artistName: string) => {
    setEditFormData(prev => ({
      ...prev,
      artists: prev.artists.includes(artistName)
        ? prev.artists.filter(a => a !== artistName)
        : [...prev.artists, artistName]
    }));
  };

  const handleSelectAllArtists = () => {
    const allArtistNames = filteredArtists.map(artist => artist.name);
    const allSelected = allArtistNames.every(name => editFormData.artists.includes(name));
    
    if (allSelected) {
      setEditFormData(prev => ({
        ...prev,
        artists: prev.artists.filter(a => !allArtistNames.includes(a))
      }));
    } else {
      setEditFormData(prev => ({
        ...prev,
        artists: Array.from(new Set([...prev.artists, ...allArtistNames]))
      }));
    }
  };

  const removeArtist = (artistName: string) => {
    setEditFormData(prev => ({
      ...prev,
      artists: prev.artists.filter(a => a !== artistName)
    }));
  };

  const handleCategoryToggle = (categoryName: string) => {
    setEditFormData(prev => ({
      ...prev,
      categories: prev.categories.includes(categoryName)
        ? prev.categories.filter(c => c !== categoryName)
        : [...prev.categories, categoryName]
    }));
  };

  const handleSelectAllCategories = () => {
    const allCategoryNames = filteredCategories.map(category => category.name);
    const allSelected = allCategoryNames.every(name => editFormData.categories.includes(name));
    
    if (allSelected) {
      setEditFormData(prev => ({
        ...prev,
        categories: prev.categories.filter(c => !allCategoryNames.includes(c))
      }));
    } else {
      setEditFormData(prev => ({
        ...prev,
        categories: Array.from(new Set([...prev.categories, ...allCategoryNames]))
      }));
    }
  };

  const removeCategory = (categoryName: string) => {
    setEditFormData(prev => ({
      ...prev,
      categories: prev.categories.filter(c => c !== categoryName)
    }));
  };

  const handleAlbumToggle = (albumId: string) => {
    setEditFormData(prev => ({
      ...prev,
      albums: prev.albums.includes(albumId)
        ? prev.albums.filter(a => a !== albumId)
        : [...prev.albums, albumId]
    }));
  };

  const handleSelectAllAlbums = () => {
    const allAlbumIds = filteredAlbums.map(album => album.id);
    const allSelected = allAlbumIds.every(id => editFormData.albums.includes(id));
    
    if (allSelected) {
      setEditFormData(prev => ({
        ...prev,
        albums: prev.albums.filter(a => !allAlbumIds.includes(a))
      }));
    } else {
      setEditFormData(prev => ({
        ...prev,
        albums: Array.from(new Set([...prev.albums, ...allAlbumIds]))
      }));
    }
  };

  const removeAlbum = (albumId: string) => {
    setEditFormData(prev => ({
      ...prev,
      albums: prev.albums.filter(a => a !== albumId)
    }));
  };

  const filteredArtists = allArtists.filter(artist => 
    artist.name.toLowerCase().includes(artistSearchTerm.toLowerCase())
  );

  const filteredCategories = genres.filter(genre => 
    genre.name.toLowerCase().includes(categorySearchTerm.toLowerCase())
  );

  const filteredAlbums = albums.filter(album => 
    album.title.toLowerCase().includes(albumSearchTerm.toLowerCase())
  );

  const handlePlayTrack = (track: AdminTrack) => {
    const audioUrl = track.audioUrl || `/api/songs/${track.id}/stream`;
    if (audioUrl) {
      const audio = new Audio(audioUrl);
      audio.play().catch(() => toast.error('Failed to play track'));
      toast.success(`Now playing: ${track.title}`);
    } else {
      toast.error('Audio file not available');
    }
  };

  const getUploadTypeColor = (uploadType?: string) => {
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
                        <Badge className={getUploadTypeColor(track.uploadType || 'file')}>
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
        <DialogContent className="sm:max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Track</DialogTitle>
            <DialogDescription>Update track information</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleEditSubmit} className="space-y-4 max-h-[70vh] overflow-y-auto">
            <div>
              <label className="text-sm font-medium">Track Title</label>
              <Input
                value={editFormData.title}
                onChange={(e) => setEditFormData({...editFormData, title: e.target.value})}
                placeholder="Enter track title"
                required
                data-testid="input-track-title"
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block">Artists</label>
              <Popover open={isArtistPopoverOpen} onOpenChange={setIsArtistPopoverOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={isArtistPopoverOpen}
                    className="w-full justify-between h-auto min-h-[40px] p-2"
                    data-testid="button-select-artists"
                  >
                    <div className="flex flex-wrap gap-1 flex-1">
                      {editFormData.artists.length === 0 ? (
                        <span className="text-muted-foreground">Select artists...</span>
                      ) : (
                        editFormData.artists.map((artist) => (
                          <div
                            key={artist}
                            className="flex items-center gap-1 bg-muted px-2 py-1 rounded text-sm"
                          >
                            {artist}
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                removeArtist(artist);
                              }}
                              className="hover:bg-muted-foreground/20 rounded p-0.5"
                            >
                              <X className="h-3 w-3" />
                            </button>
                          </div>
                        ))
                      )}
                    </div>
                    <ChevronDown className="h-4 w-4 shrink-0 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-full p-0" align="start">
                  <Command>
                    <CommandInput
                      placeholder="Search artists..."
                      value={artistSearchTerm}
                      onValueChange={setArtistSearchTerm}
                      data-testid="input-search-artists"
                    />
                    <CommandEmpty>No artists found.</CommandEmpty>
                    <CommandList className="max-h-[200px]">
                      <CommandGroup>
                        <CommandItem
                          onSelect={handleSelectAllArtists}
                          className="font-medium"
                          data-testid="option-select-all-artists"
                        >
                          <div className="flex items-center space-x-2 w-full">
                            <Checkbox
                              checked={filteredArtists.length > 0 && filteredArtists.every(artist => editFormData.artists.includes(artist.name))}
                              className="data-[state=checked]:bg-primary data-[state=checked]:text-primary-foreground"
                            />
                            <span>Select All ({filteredArtists.length} artists)</span>
                          </div>
                        </CommandItem>
                        {filteredArtists.map((artist) => (
                          <CommandItem
                            key={artist.id}
                            onSelect={() => handleArtistToggle(artist.name)}
                            data-testid={`option-artist-${artist.name}`}
                          >
                            <div className="flex items-center space-x-2 w-full">
                              <Checkbox
                                checked={editFormData.artists.includes(artist.name)}
                                className="data-[state=checked]:bg-primary data-[state=checked]:text-primary-foreground"
                              />
                              <span>{artist.name}</span>
                            </div>
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block">Categories</label>
              <Popover open={isCategoryPopoverOpen} onOpenChange={setIsCategoryPopoverOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={isCategoryPopoverOpen}
                    className="w-full justify-between h-auto min-h-[40px] p-2"
                    data-testid="button-select-categories"
                  >
                    <div className="flex flex-wrap gap-1 flex-1">
                      {editFormData.categories.length === 0 ? (
                        <span className="text-muted-foreground">Select categories...</span>
                      ) : (
                        editFormData.categories.map((category) => (
                          <div
                            key={category}
                            className="flex items-center gap-1 bg-muted px-2 py-1 rounded text-sm"
                          >
                            {category}
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                removeCategory(category);
                              }}
                              className="hover:bg-muted-foreground/20 rounded p-0.5"
                            >
                              <X className="h-3 w-3" />
                            </button>
                          </div>
                        ))
                      )}
                    </div>
                    <ChevronDown className="h-4 w-4 shrink-0 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-full p-0" align="start">
                  <Command>
                    <CommandInput
                      placeholder="Search categories..."
                      value={categorySearchTerm}
                      onValueChange={setCategorySearchTerm}
                      data-testid="input-search-categories"
                    />
                    <CommandEmpty>No categories found.</CommandEmpty>
                    <CommandList className="max-h-[200px]">
                      <CommandGroup>
                        <CommandItem
                          onSelect={handleSelectAllCategories}
                          className="font-medium"
                          data-testid="option-select-all-categories"
                        >
                          <div className="flex items-center space-x-2 w-full">
                            <Checkbox
                              checked={filteredCategories.length > 0 && filteredCategories.every(category => editFormData.categories.includes(category.name))}
                              className="data-[state=checked]:bg-primary data-[state=checked]:text-primary-foreground"
                            />
                            <span>Select All ({filteredCategories.length} categories)</span>
                          </div>
                        </CommandItem>
                        {filteredCategories.map((category) => (
                          <CommandItem
                            key={category.id}
                            onSelect={() => handleCategoryToggle(category.name)}
                            data-testid={`option-category-${category.name}`}
                          >
                            <div className="flex items-center space-x-2 w-full">
                              <Checkbox
                                checked={editFormData.categories.includes(category.name)}
                                className="data-[state=checked]:bg-primary data-[state=checked]:text-primary-foreground"
                              />
                              <span>{category.name}</span>
                            </div>
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
            </div>
            <div>
              <label className="text-sm font-medium">Duration (seconds)</label>
              <Input
                type="number"
                value={editFormData.duration}
                onChange={(e) => setEditFormData({...editFormData, duration: parseInt(e.target.value) || 0})}
                placeholder="Duration in seconds"
                min="0"
                data-testid="input-duration"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium mb-2 block">Albums</label>
                <Popover open={isAlbumPopoverOpen} onOpenChange={setIsAlbumPopoverOpen}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      role="combobox"
                      aria-expanded={isAlbumPopoverOpen}
                      className="w-full justify-between h-auto min-h-[40px] p-2"
                      data-testid="button-select-albums"
                    >
                      <div className="flex flex-wrap gap-1 flex-1">
                        {editFormData.albums.length === 0 ? (
                          <span className="text-muted-foreground">Select albums...</span>
                        ) : (
                          editFormData.albums.map((albumId) => {
                            const album = albums.find(a => a.id === albumId);
                            return (
                              <div
                                key={albumId}
                                className="flex items-center gap-1 bg-muted px-2 py-1 rounded text-sm"
                              >
                                {album?.title || albumId}
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    removeAlbum(albumId);
                                  }}
                                  className="hover:bg-muted-foreground/20 rounded p-0.5"
                                >
                                  <X className="h-3 w-3" />
                                </button>
                              </div>
                            );
                          })
                        )}
                      </div>
                      <ChevronDown className="h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-full p-0" align="start">
                    <Command>
                      <CommandInput
                        placeholder="Search albums..."
                        value={albumSearchTerm}
                        onValueChange={setAlbumSearchTerm}
                        data-testid="input-search-albums"
                      />
                      <CommandEmpty>No albums found.</CommandEmpty>
                      <CommandList className="max-h-[200px]">
                        <CommandGroup>
                          <CommandItem
                            onSelect={handleSelectAllAlbums}
                            className="font-medium"
                            data-testid="option-select-all-albums"
                          >
                            <div className="flex items-center space-x-2 w-full">
                              <Checkbox
                                checked={filteredAlbums.length > 0 && filteredAlbums.every(album => editFormData.albums.includes(album.id))}
                                className="data-[state=checked]:bg-primary data-[state=checked]:text-primary-foreground"
                              />
                              <span>Select All ({filteredAlbums.length} albums)</span>
                            </div>
                          </CommandItem>
                          {filteredAlbums.map((album) => (
                            <CommandItem
                              key={album.id}
                              onSelect={() => handleAlbumToggle(album.id)}
                              data-testid={`option-album-${album.title}`}
                            >
                              <div className="flex items-center space-x-2 w-full">
                                <Checkbox
                                  checked={editFormData.albums.includes(album.id)}
                                  className="data-[state=checked]:bg-primary data-[state=checked]:text-primary-foreground"
                                />
                                <span>{album.title}</span>
                              </div>
                            </CommandItem>
                          ))}
                        </CommandGroup>
                      </CommandList>
                    </Command>
                  </PopoverContent>
                </Popover>
              </div>
              <div>
                <label className="text-sm font-medium">Release Date</label>
                <Input
                  type="date"
                  value={editFormData.releaseDate}
                  onChange={(e) => setEditFormData({...editFormData, releaseDate: e.target.value})}
                  data-testid="input-release-date"
                />
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="explicit-checkbox"
                checked={editFormData.isExplicit}
                onChange={(e) => setEditFormData({...editFormData, isExplicit: e.target.checked})}
                className="rounded border-gray-300 dark:border-gray-700"
                data-testid="checkbox-explicit"
              />
              <label htmlFor="explicit-checkbox" className="text-sm font-medium">
                Explicit Content
              </label>
            </div>
            <div>
              <label className="text-sm font-medium">Lyrics (Optional)</label>
              <textarea
                value={editFormData.lyrics}
                onChange={(e) => setEditFormData({...editFormData, lyrics: e.target.value})}
                placeholder="Enter song lyrics..."
                className="w-full px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-md bg-white dark:bg-gray-800 min-h-[100px] resize-vertical"
                data-testid="textarea-lyrics"
              />
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