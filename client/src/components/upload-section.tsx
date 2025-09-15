import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Link2, Upload, CloudUpload, Shield, Lock, FileAudio } from "lucide-react";
import toast from "react-hot-toast";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useAuth } from "@/hooks/use-auth";
import UploadProgressModal from "@/components/upload-progress-modal";

export default function UploadSection() {
  const [urlData, setUrlData] = useState({
    url: "",
    title: "",
    artist: "",
    category: ""
  });
  
  const [fileData, setFileData] = useState({
    title: "",
    artist: "",
    category: ""
  });
  
  const [dragOver, setDragOver] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [showProgress, setShowProgress] = useState(false);
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  
  const queryClient = useQueryClient();
  const { isAdmin } = useAuth();

  const urlUploadMutation = useMutation({
    mutationFn: async (data: { url: string; title?: string; artist?: string; category?: string }) => {
      const response = await apiRequest("/api/songs/upload-url", "POST", data);
      return response.json();
    },
    onSuccess: (data) => {
      if (data.sessionId) {
        setCurrentSessionId(data.sessionId);
        setShowProgress(true);
      }
      setUrlData({ url: "", title: "", artist: "", category: "" });
      // Invalidate all song-related caches to show updates immediately
      queryClient.invalidateQueries({ queryKey: ["/api/songs"] });
      queryClient.invalidateQueries({ predicate: (query) => 
        query.queryKey[0] === "/api/songs/genre" || 
        query.queryKey[0] === "/api/songs/search"
      });
    },
    onError: () => {
      toast.error("URL upload failed");
    },
  });

  const fileUploadMutation = useMutation({
    mutationFn: async (formData: FormData) => {
      const response = await fetch("/api/songs/upload-file", {
        method: "POST",
        body: formData,
        credentials: 'include', // Use database session
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Upload failed");
      }
      return response.json();
    },
    onSuccess: () => {
      toast.success('Song uploaded successfully!');
      setFileData({ title: "", artist: "", category: "" });
      setSelectedFile(null);
      // Invalidate all song-related caches to show updates immediately
      queryClient.invalidateQueries({ queryKey: ["/api/songs"] });
      queryClient.invalidateQueries({ predicate: (query) => 
        query.queryKey[0] === "/api/songs/genre" || 
        query.queryKey[0] === "/api/songs/search"
      });
    },
    onError: () => {
      toast.error("File upload failed");
    },
  });

  const categories = ["Rock", "Jazz", "Electronic", "Classical", "Folk", "Hip-Hop"];

  const handleUrlSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!urlData.url) {
      toast.error('Please enter a music URL');
      return;
    }
    // Only send the URL - backend will auto-extract metadata
    urlUploadMutation.mutate({ url: urlData.url });
  };

  const handleFileSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFile || !fileData.title || !fileData.artist || !fileData.category) {
      toast.error('Please select a file and fill in all fields');
      return;
    }

    const formData = new FormData();
    formData.append("audio", selectedFile);
    formData.append("title", fileData.title);
    formData.append("artist", fileData.artist);
    formData.append("category", fileData.category);

    fileUploadMutation.mutate(formData);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      const file = files[0];
      const allowedTypes = ['audio/mpeg', 'audio/wav', 'audio/flac'];
      if (allowedTypes.includes(file.type)) {
        setSelectedFile(file);
      } else {
        toast.error('Please select an MP3, WAV, or FLAC file');
      }
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      setSelectedFile(files[0]);
    }
  };

  // Admin-only upload interface
  if (!isAdmin) {
    return null; // Hide upload section for non-admin users
  }

  return (
    <section className="max-w-2xl mx-auto p-6 bg-card rounded-lg border border-border">
      {/* Header */}
      <div className="mb-6 text-center">
        <div className="flex items-center justify-center gap-2 mb-2">
          <Upload className="w-6 h-6 text-amber-600" />
          <h2 className="text-xl font-semibold text-foreground">Upload Content</h2>
        </div>
        <p className="text-muted-foreground text-sm">Add new tracks to your music library</p>
      </div>

      <Tabs defaultValue="url" className="w-full">
        <TabsList className="grid w-full grid-cols-2 mb-6">
          <TabsTrigger value="url" className="flex items-center gap-2">
            <Link2 className="w-4 h-4" />
            URL Import
          </TabsTrigger>
          <TabsTrigger value="file" className="flex items-center gap-2">
            <Upload className="w-4 h-4" />
            File Upload
          </TabsTrigger>
        </TabsList>

        {/* File Upload Tab */}
        <TabsContent value="file" className="space-y-4">
          <form onSubmit={handleFileSubmit} className="space-y-4">
            {/* Drop Zone */}
            <div
              className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-all ${
                dragOver ? "border-primary bg-primary/5" : "border-muted-foreground/25"
              } ${selectedFile ? "bg-green-50 dark:bg-green-950/20 border-green-300 dark:border-green-700" : ""}`}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={() => document.getElementById('file-input')?.click()}
              data-testid="drop-zone"
            >
              <FileAudio className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-foreground font-medium mb-2">
                {selectedFile ? selectedFile.name : "Drop your audio file here"}
              </p>
              <p className="text-sm text-muted-foreground mb-4">
                Supports MP3, WAV, FLAC (Max 50MB)
              </p>
              <Button
                type="button"
                className="bg-gradient-to-r from-slate-700 to-slate-800 hover:from-slate-800 hover:to-slate-900 text-white shadow-lg"
                onClick={() => document.getElementById('file-input')?.click()}
              >
                Choose File
              </Button>
              <input
                id="file-input"
                type="file"
                accept=".mp3,.wav,.flac"
                onChange={handleFileSelect}
                className="hidden"
                data-testid="input-file"
              />
            </div>

            {/* Form Fields */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">Song Title</label>
                <Input
                  type="text"
                  placeholder="Enter song title"
                  value={fileData.title}
                  onChange={(e) => setFileData({ ...fileData, title: e.target.value })}
                  className="bg-background border-input"
                  data-testid="input-file-title"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">Artist</label>
                <Input
                  type="text"
                  placeholder="Enter artist name"
                  value={fileData.artist}
                  onChange={(e) => setFileData({ ...fileData, artist: e.target.value })}
                  className="bg-background border-input"
                  data-testid="input-file-artist"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-2">Category</label>
              <Select value={fileData.category} onValueChange={(value) => setFileData({ ...fileData, category: value })}>
                <SelectTrigger className="bg-background border-input" data-testid="select-file-category">
                  <SelectValue placeholder="Select a category" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((category) => (
                    <SelectItem key={category} value={category}>
                      {category}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <Button 
              type="submit"
              disabled={fileUploadMutation.isPending || !selectedFile}
              className="w-full bg-gradient-to-r from-slate-700 to-slate-800 hover:from-slate-800 hover:to-slate-900 text-white shadow-lg py-3 font-medium"
              data-testid="button-upload-file"
            >
              <Upload className="w-4 h-4 mr-2" />
              {fileUploadMutation.isPending ? "Uploading..." : "Upload Song"}
            </Button>
          </form>
        </TabsContent>

        {/* URL Import Tab */}
        <TabsContent value="url" className="space-y-4">
          <form onSubmit={handleUrlSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">Music URL</label>
              <Input
                type="url"
                placeholder="Enter music URL (YouTube, SoundCloud, etc.)"
                value={urlData.url}
                onChange={(e) => setUrlData({ ...urlData, url: e.target.value })}
                className="bg-background border-input"
                data-testid="input-url"
              />
            </div>
            
            <div className="p-3 bg-muted/50 rounded-lg border border-muted">
              <p className="text-sm text-muted-foreground text-center">
                🎵 Song details will be automatically extracted from the URL
              </p>
            </div>
            
            <Button 
              type="submit"
              disabled={urlUploadMutation.isPending || !urlData.url}
              className="w-full bg-gradient-to-r from-slate-700 to-slate-800 hover:from-slate-800 hover:to-slate-900 text-white shadow-lg py-3 font-medium"
              data-testid="button-upload-url"
            >
              <CloudUpload className="w-4 h-4 mr-2" />
              {urlUploadMutation.isPending ? "Uploading..." : "Upload Track"}
            </Button>
          </form>
        </TabsContent>
      </Tabs>

      {/* Progress Modal */}
      <UploadProgressModal
        isOpen={showProgress}
        onClose={() => {
          setShowProgress(false);
          // Keep session ID to continue tracking in background
          // Only clear it when upload actually completes/fails
        }}
        onComplete={() => {
          // Clear session when upload actually completes or fails
          setCurrentSessionId(null);
          // Invalidate upload stats to refresh processing count
          queryClient.invalidateQueries({ queryKey: ["/api/upload-stats"] });
        }}
        sessionId={currentSessionId}
      />

      {/* Background Processing Indicator */}
      {currentSessionId && !showProgress && (
        <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-lg">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-blue-500 rounded-full animate-pulse"></div>
              <span className="text-sm text-blue-700 dark:text-blue-300">
                Upload processing in background...
              </span>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowProgress(true)}
              className="text-blue-700 dark:text-blue-300 border-blue-300 dark:border-blue-700"
              data-testid="button-show-progress"
            >
              View Progress
            </Button>
          </div>
        </div>
      )}
    </section>
  );
}
