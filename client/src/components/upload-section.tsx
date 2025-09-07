import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Link2, Upload, CloudUpload, Shield, Lock } from "lucide-react";
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
      const uploadPromise = async () => {
        const response = await apiRequest("POST", "/api/tracks/upload-url", data);
        return response.json();
      };

      return toast.promise(
        uploadPromise(),
        {
          loading: 'Processing URL...',
          success: 'Upload started successfully!',
          error: (error) => error?.message || 'Failed to start upload',
        },
        {
          success: {
            duration: 2000,
            icon: '🚀',
          },
          error: {
            duration: 4000,
            icon: '❌',
          },
        }
      );
    },
    onSuccess: (data) => {
      if (data.sessionId) {
        setCurrentSessionId(data.sessionId);
        setShowProgress(true);
      }
      setUrlData({ url: "", title: "", artist: "", category: "" });
      queryClient.invalidateQueries({ queryKey: ["/api/tracks"] });
    },
    onError: () => {
      // Error handling is done by the promise toast
    },
  });

  const fileUploadMutation = useMutation({
    mutationFn: async (formData: FormData) => {
      const token = localStorage.getItem('auth_token');
      const headers: Record<string, string> = {};
      
      if (token) {
        headers["Authorization"] = `Bearer ${token}`;
      }

      const response = await fetch("/api/tracks/upload-file", {
        method: "POST",
        headers,
        body: formData,
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Upload failed");
      }
      return response.json();
    },
    onSuccess: (data) => {
      toast.success(`Track "${data.title}" uploaded successfully!`, {
        icon: '🎵',
        duration: 3000,
      });
      setFileData({ title: "", artist: "", category: "" });
      setSelectedFile(null);
      queryClient.invalidateQueries({ queryKey: ["/api/tracks"] });
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Upload failed', {
        icon: '❌',
        duration: 4000,
      });
    },
  });

  const categories = ["Rock", "Jazz", "Electronic", "Classical", "Folk", "Hip-Hop"];

  const handleUrlSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!urlData.url) {
      toast.error('Please enter a music URL', {
        icon: '⚠️',
        duration: 3000,
      });
      return;
    }
    // Only send the URL - backend will auto-extract metadata
    urlUploadMutation.mutate({ url: urlData.url });
  };

  const handleFileSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFile || !fileData.title || !fileData.artist || !fileData.category) {
      toast.error('Please select a file and fill in all fields', {
        icon: '📝',
        duration: 3000,
      });
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
        toast.error('Please select an MP3, WAV, or FLAC file', {
          icon: '🚫',
          duration: 4000,
        });
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
    return (
      <section className="p-6">
        <div className="bg-muted/30 rounded-lg p-8 border border-border text-center">
          <Lock className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-foreground mb-2 font-sans">Admin Access Required</h3>
          <p className="text-muted-foreground font-serif mb-4">
            Only administrators can upload music tracks to the platform.
          </p>
          <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
            <Shield className="w-4 h-4" />
            <span>Contact your administrator for upload access</span>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="p-6">
      <div className="mb-8">
        <div className="flex items-center gap-2 mb-2">
          <h2 className="text-2xl font-bold text-foreground font-sans">Upload Music</h2>
          <Shield className="w-5 h-5 text-green-600" />
        </div>
        <p className="text-muted-foreground font-serif">Add new tracks to your library via URL or direct upload</p>
      </div>

      <div className="grid md:grid-cols-2 gap-6 mb-8">
        {/* URL Upload */}
        <div className="bg-card rounded-lg p-6 border border-border">
          <div className="flex items-center space-x-3 mb-4">
            <Link2 className="text-accent text-xl w-6 h-6" />
            <h3 className="text-lg font-semibold font-sans">Upload via URL</h3>
          </div>
          <form onSubmit={handleUrlSubmit} className="space-y-4">
            <Input
              type="url"
              placeholder="Enter music URL (YouTube, SoundCloud, etc.)"
              value={urlData.url}
              onChange={(e) => setUrlData({ ...urlData, url: e.target.value })}
              className="bg-input border-border font-serif"
              data-testid="input-url"
            />
            <div className="p-3 bg-muted/50 rounded-lg border border-muted">
              <p className="text-sm text-muted-foreground font-serif text-center">
                🎵 Song details will be automatically extracted from the URL
              </p>
            </div>
            <Button 
              type="submit"
              disabled={urlUploadMutation.isPending}
              className="w-full bg-primary text-primary-foreground py-3 font-mono font-medium hover:opacity-90 transition-opacity"
              data-testid="button-upload-url"
            >
              <CloudUpload className="w-4 h-4 mr-2" />
              {urlUploadMutation.isPending ? "Uploading..." : "Upload from URL"}
            </Button>
          </form>
        </div>

        {/* File Upload */}
        <div className="bg-card rounded-lg p-6 border border-border">
          <div className="flex items-center space-x-3 mb-4">
            <Upload className="text-accent text-xl w-6 h-6" />
            <h3 className="text-lg font-semibold font-sans">Direct Upload</h3>
          </div>
          <form onSubmit={handleFileSubmit} className="space-y-4">
            <div
              className={`upload-zone border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-all ${
                dragOver ? "drag-over border-primary bg-primary/10" : "border-border"
              }`}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={() => document.getElementById('file-input')?.click()}
              data-testid="drop-zone"
            >
              <CloudUpload className="w-12 h-12 text-muted-foreground mb-4 mx-auto" />
              <p className="text-foreground font-mono font-medium mb-2">
                {selectedFile ? selectedFile.name : "Drop files here or click to browse"}
              </p>
              <p className="text-sm text-muted-foreground font-serif">
                Support for MP3, WAV, FLAC files up to 50MB
              </p>
              <input
                id="file-input"
                type="file"
                accept=".mp3,.wav,.flac"
                onChange={handleFileSelect}
                className="hidden"
                data-testid="input-file"
              />
            </div>
            
            <Input
              type="text"
              placeholder="Track title"
              value={fileData.title}
              onChange={(e) => setFileData({ ...fileData, title: e.target.value })}
              className="bg-input border-border font-serif"
              data-testid="input-file-title"
            />
            <Input
              type="text"
              placeholder="Artist name"
              value={fileData.artist}
              onChange={(e) => setFileData({ ...fileData, artist: e.target.value })}
              className="bg-input border-border font-serif"
              data-testid="input-file-artist"
            />
            <Select value={fileData.category} onValueChange={(value) => setFileData({ ...fileData, category: value })}>
              <SelectTrigger className="bg-input border-border" data-testid="select-file-category">
                <SelectValue placeholder="Select category" />
              </SelectTrigger>
              <SelectContent>
                {categories.map((category) => (
                  <SelectItem key={category} value={category}>
                    {category}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            
            <Button 
              type="submit"
              disabled={fileUploadMutation.isPending}
              className="w-full bg-primary text-primary-foreground py-3 font-mono font-medium hover:opacity-90 transition-opacity"
              data-testid="button-upload-file"
            >
              <Upload className="w-4 h-4 mr-2" />
              {fileUploadMutation.isPending ? "Uploading..." : "Upload File"}
            </Button>
          </form>
        </div>
      </div>

      {/* Progress Modal */}
      <UploadProgressModal
        isOpen={showProgress}
        onClose={() => {
          setShowProgress(false);
          setCurrentSessionId(null);
        }}
        sessionId={currentSessionId}
      />
    </section>
  );
}
