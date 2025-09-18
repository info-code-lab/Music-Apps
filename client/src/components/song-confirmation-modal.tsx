import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
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
import { Badge } from "@/components/ui/badge";
import { Music, Check, ChevronDown, X } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import toast from "react-hot-toast";

interface ExtractedMetadata {
  title: string;
  artist: string;
  album?: string;
  duration: number;
  filename: string;
  localPath: string;
  thumbnail?: string;
}

interface SongConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  metadata: ExtractedMetadata | null;
  sessionId: string | null;
}

export default function SongConfirmationModal({ 
  isOpen, 
  onClose, 
  onConfirm,
  metadata,
  sessionId 
}: SongConfirmationModalProps) {
  const [formData, setFormData] = useState({
    title: "",
    artists: [] as string[],
    albumName: "",
    categories: [] as string[],
    playlists: [] as string[],
    isExplicit: false,
  });

  const [isArtistPopoverOpen, setIsArtistPopoverOpen] = useState(false);
  const [artistSearchTerm, setArtistSearchTerm] = useState("");
  const [newArtistName, setNewArtistName] = useState("");
  const [isCategoryPopoverOpen, setIsCategoryPopoverOpen] = useState(false);
  const [categorySearchTerm, setCategorySearchTerm] = useState("");
  const [isPlaylistPopoverOpen, setIsPlaylistPopoverOpen] = useState(false);
  const [playlistSearchTerm, setPlaylistSearchTerm] = useState("");

  const queryClient = useQueryClient();

  // Fetch available options
  const { data: allArtists = [] } = useQuery<{id: string; name: string}[]>({
    queryKey: ["/api/artists"],
    enabled: isOpen,
  });

  const { data: genres = [] } = useQuery<{id: string; name: string}[]>({
    queryKey: ["/api/genres"],
    enabled: isOpen,
  });

  const { data: playlists = [] } = useQuery<{id: string; name: string; userId: string}[]>({
    queryKey: ["/api/playlists"],
    enabled: isOpen,
  });

  // Initialize form data when metadata is received
  useEffect(() => {
    if (metadata && isOpen) {
      // Parse artist from metadata - could be multiple artists separated by commas
      const artistsFromMetadata = metadata.artist ? metadata.artist.split(/,|&|\s+feat\.?\s+|\s+ft\.?\s+/i).map(a => a.trim()).filter(Boolean) : [];
      
      setFormData({
        title: metadata.title || "",
        artists: artistsFromMetadata.length > 0 ? artistsFromMetadata : ["Unknown Artist"],
        albumName: metadata.album || "",
        categories: [], // Start empty, let user select
        playlists: [], // Start empty, let user select
        isExplicit: false,
      });
    }
  }, [metadata, isOpen]);

  const confirmSongMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await apiRequest("/api/songs/confirm", "POST", data);
      return response.json();
    },
    onSuccess: () => {
      toast.success("Song added successfully!");
      queryClient.invalidateQueries({ queryKey: ["/api/songs"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/songs"] });
      onConfirm();
      onClose();
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to add song");
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!metadata || !sessionId) {
      toast.error("Missing metadata or session");
      return;
    }

    if (!formData.title.trim()) {
      toast.error("Song title is required");
      return;
    }

    if (formData.artists.length === 0) {
      toast.error("At least one artist is required");
      return;
    }

    if (formData.categories.length === 0) {
      toast.error("At least one category is required");
      return;
    }

    // Convert names to IDs
    const artistIds = formData.artists
      .map(artistName => {
        const artist = allArtists.find(a => a.name === artistName);
        return artist?.id;
      })
      .filter(Boolean);

    const genreIds = formData.categories
      .map(categoryName => {
        const genre = genres.find(g => g.name === categoryName);
        return genre?.id;
      })
      .filter(Boolean);

    const playlistIds = formData.playlists
      .map(playlistName => {
        const playlist = playlists.find(p => p.name === playlistName);
        return playlist?.id;
      })
      .filter(Boolean);

    const confirmData = {
      sessionId,
      metadata: {
        ...metadata,
        title: formData.title,
        artist: formData.artists.join(", "),
        album: formData.albumName || undefined,
      },
      artistIds,
      genreIds,
      playlistIds,
      isExplicit: formData.isExplicit,
    };

    confirmSongMutation.mutate(confirmData);
  };

  const handleArtistToggle = (artistName: string) => {
    setFormData(prev => ({
      ...prev,
      artists: prev.artists.includes(artistName)
        ? prev.artists.filter(a => a !== artistName)
        : [...prev.artists, artistName]
    }));
  };

  const handleAddNewArtist = () => {
    if (newArtistName.trim() && !formData.artists.includes(newArtistName.trim())) {
      setFormData(prev => ({
        ...prev,
        artists: [...prev.artists, newArtistName.trim()]
      }));
      setNewArtistName("");
      setArtistSearchTerm("");
    }
  };

  const handleArtistSearchKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && newArtistName.trim()) {
      e.preventDefault();
      handleAddNewArtist();
    }
  };

  const handleCategoryToggle = (categoryName: string) => {
    setFormData(prev => ({
      ...prev,
      categories: prev.categories.includes(categoryName)
        ? prev.categories.filter(c => c !== categoryName)
        : [...prev.categories, categoryName]
    }));
  };

  const handlePlaylistToggle = (playlistName: string) => {
    setFormData(prev => ({
      ...prev,
      playlists: prev.playlists.includes(playlistName)
        ? prev.playlists.filter(p => p !== playlistName)
        : [...prev.playlists, playlistName]
    }));
  };

  const removeArtist = (artistName: string) => {
    setFormData(prev => ({
      ...prev,
      artists: prev.artists.filter(a => a !== artistName)
    }));
  };

  const removeCategory = (categoryName: string) => {
    setFormData(prev => ({
      ...prev,
      categories: prev.categories.filter(c => c !== categoryName)
    }));
  };

  const removePlaylist = (playlistName: string) => {
    setFormData(prev => ({
      ...prev,
      playlists: prev.playlists.filter(p => p !== playlistName)
    }));
  };

  const filteredArtists = allArtists.filter(artist => 
    artist.name.toLowerCase().includes(artistSearchTerm.toLowerCase())
  );

  const filteredCategories = genres.filter(genre => 
    genre.name.toLowerCase().includes(categorySearchTerm.toLowerCase())
  );

  const filteredPlaylists = playlists.filter(playlist => 
    playlist.name.toLowerCase().includes(playlistSearchTerm.toLowerCase())
  );

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (!metadata) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto" data-testid="song-confirmation-modal">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Music className="h-5 w-5 text-purple-600" />
            Confirm Song Details
          </DialogTitle>
          <DialogDescription>
            Please review and edit the song information before adding it to your library.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Info */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="title">Song Title *</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                className="bg-background"
                data-testid="input-title"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="album">Album Name</Label>
              <Input
                id="album"
                value={formData.albumName}
                onChange={(e) => setFormData(prev => ({ ...prev, albumName: e.target.value }))}
                className="bg-background"
                placeholder="Optional"
                data-testid="input-album"
              />
            </div>
          </div>

          {/* Duration Display */}
          <div className="p-3 bg-muted/50 rounded-lg">
            <p className="text-sm text-muted-foreground">
              Duration: <span className="font-medium">{formatDuration(metadata.duration)}</span>
            </p>
          </div>

          {/* Artists Selection */}
          <div className="space-y-2">
            <Label>Artists *</Label>
            <Popover open={isArtistPopoverOpen} onOpenChange={setIsArtistPopoverOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className="w-full justify-between bg-background"
                  data-testid="button-select-artists"
                >
                  <span className="truncate">
                    {formData.artists.length > 0 ? `${formData.artists.length} artist(s) selected` : "Select artists"}
                  </span>
                  <ChevronDown className="h-4 w-4" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-full p-0" align="start">
                <Command>
                  <CommandInput 
                    placeholder="Search or type new artist name..." 
                    value={artistSearchTerm}
                    onValueChange={(value) => {
                      setArtistSearchTerm(value);
                      setNewArtistName(value);
                    }}
                    onKeyDown={handleArtistSearchKeyDown}
                  />
                  <CommandList>
                    {newArtistName.trim() && !filteredArtists.some(a => a.name.toLowerCase() === newArtistName.toLowerCase()) && (
                      <CommandEmpty>
                        <Button
                          type="button"
                          variant="ghost"
                          className="w-full justify-start text-left font-normal"
                          onClick={handleAddNewArtist}
                        >
                          Add "{newArtistName}" as new artist
                        </Button>
                      </CommandEmpty>
                    )}
                    <CommandGroup>
                      {filteredArtists.map((artist) => (
                        <CommandItem
                          key={artist.id}
                          onSelect={() => handleArtistToggle(artist.name)}
                          className="flex items-center gap-2"
                        >
                          <Checkbox 
                            checked={formData.artists.includes(artist.name)}
                            onCheckedChange={() => handleArtistToggle(artist.name)}
                          />
                          {artist.name}
                          {formData.artists.includes(artist.name) && <Check className="h-4 w-4 ml-auto" />}
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>
            
            {formData.artists.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-2">
                {formData.artists.map((artist) => (
                  <Badge key={artist} variant="outline" className="flex items-center gap-1">
                    {artist}
                    <X 
                      className="h-3 w-3 cursor-pointer hover:text-destructive" 
                      onClick={() => removeArtist(artist)}
                    />
                  </Badge>
                ))}
              </div>
            )}
          </div>

          {/* Categories Selection */}
          <div className="space-y-2">
            <Label>Categories *</Label>
            <Popover open={isCategoryPopoverOpen} onOpenChange={setIsCategoryPopoverOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className="w-full justify-between bg-background"
                  data-testid="button-select-categories"
                >
                  <span className="truncate">
                    {formData.categories.length > 0 ? `${formData.categories.length} category(s) selected` : "Select categories"}
                  </span>
                  <ChevronDown className="h-4 w-4" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-full p-0" align="start">
                <Command>
                  <CommandInput 
                    placeholder="Search categories..." 
                    value={categorySearchTerm}
                    onValueChange={setCategorySearchTerm}
                  />
                  <CommandList>
                    <CommandEmpty>No categories found.</CommandEmpty>
                    <CommandGroup>
                      {filteredCategories.map((category) => (
                        <CommandItem
                          key={category.id}
                          onSelect={() => handleCategoryToggle(category.name)}
                          className="flex items-center gap-2"
                        >
                          <Checkbox 
                            checked={formData.categories.includes(category.name)}
                            onCheckedChange={() => handleCategoryToggle(category.name)}
                          />
                          {category.name}
                          {formData.categories.includes(category.name) && <Check className="h-4 w-4 ml-auto" />}
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>
            
            {formData.categories.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-2">
                {formData.categories.map((category) => (
                  <Badge key={category} variant="outline" className="flex items-center gap-1">
                    {category}
                    <X 
                      className="h-3 w-3 cursor-pointer hover:text-destructive" 
                      onClick={() => removeCategory(category)}
                    />
                  </Badge>
                ))}
              </div>
            )}
          </div>

          {/* Playlists Selection */}
          <div className="space-y-2">
            <Label>Add to Playlists</Label>
            <Popover open={isPlaylistPopoverOpen} onOpenChange={setIsPlaylistPopoverOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className="w-full justify-between bg-background"
                  data-testid="button-select-playlists"
                >
                  <span className="truncate">
                    {formData.playlists.length > 0 ? `${formData.playlists.length} playlist(s) selected` : "Select playlists (optional)"}
                  </span>
                  <ChevronDown className="h-4 w-4" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-full p-0" align="start">
                <Command>
                  <CommandInput 
                    placeholder="Search playlists..." 
                    value={playlistSearchTerm}
                    onValueChange={setPlaylistSearchTerm}
                  />
                  <CommandList>
                    <CommandEmpty>No playlists found.</CommandEmpty>
                    <CommandGroup>
                      {filteredPlaylists.map((playlist) => (
                        <CommandItem
                          key={playlist.id}
                          onSelect={() => handlePlaylistToggle(playlist.name)}
                          className="flex items-center gap-2"
                        >
                          <Checkbox 
                            checked={formData.playlists.includes(playlist.name)}
                            onCheckedChange={() => handlePlaylistToggle(playlist.name)}
                          />
                          {playlist.name}
                          {formData.playlists.includes(playlist.name) && <Check className="h-4 w-4 ml-auto" />}
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>
            
            {formData.playlists.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-2">
                {formData.playlists.map((playlist) => (
                  <Badge key={playlist} variant="outline" className="flex items-center gap-1">
                    {playlist}
                    <X 
                      className="h-3 w-3 cursor-pointer hover:text-destructive" 
                      onClick={() => removePlaylist(playlist)}
                    />
                  </Badge>
                ))}
              </div>
            )}
          </div>

          {/* Explicit Content */}
          <div className="flex items-center space-x-2">
            <Checkbox 
              id="explicit"
              checked={formData.isExplicit}
              onCheckedChange={(checked) => setFormData(prev => ({ ...prev, isExplicit: !!checked }))}
              data-testid="checkbox-explicit"
            />
            <Label htmlFor="explicit" className="text-sm font-normal">
              This song contains explicit content
            </Label>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 pt-4">
            <Button 
              type="button" 
              variant="outline" 
              onClick={onClose} 
              className="flex-1"
              data-testid="button-cancel"
            >
              Cancel
            </Button>
            <Button 
              type="submit" 
              disabled={confirmSongMutation.isPending}
              className="flex-1 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
              data-testid="button-confirm"
            >
              {confirmSongMutation.isPending ? "Adding..." : "Add Song"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}