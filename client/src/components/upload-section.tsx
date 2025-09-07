import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Link2, Upload, CloudUpload } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
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
  
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const urlUploadMutation = useMutation({
    mutationFn: async (data: typeof urlData) => {
      const response = await apiRequest("POST", "/api/tracks/upload-url", data);
      return response.json();
    },
    onSuccess: (data) => {
      if (data.sessionId) {
        setCurrentSessionId(data.sessionId);
        setShowProgress(true);
      }
      setUrlData({ url: "", title: "", artist: "", category: "" });
      queryClient.invalidateQueries({ queryKey: ["/api/tracks"] });
    },
    onError: (error: Error) => {
      toast({
        title: "Upload Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const fileUploadMutation = useMutation({
    mutationFn: async (formData: FormData) => {
      const response = await fetch("/api/tracks/upload-file", {
        method: "POST",
        body: formData,
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Upload failed");
      }
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Track uploaded successfully!",
      });
      setFileData({ title: "", artist: "", category: "" });
      setSelectedFile(null);
      queryClient.invalidateQueries({ queryKey: ["/api/tracks"] });
    },
    onError: (error: Error) => {
      toast({
        title: "Upload Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const categories = ["Rock", "Jazz", "Electronic", "Classical", "Folk", "Hip-Hop"];

  const handleUrlSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!urlData.url || !urlData.title || !urlData.artist || !urlData.category) {
      toast({
        title: "Missing Information",
        description: "Please fill in all fields",
        variant: "destructive",
      });
      return;
    }
    urlUploadMutation.mutate(urlData);
  };

  const handleFileSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFile || !fileData.title || !fileData.artist || !fileData.category) {
      toast({
        title: "Missing Information",
        description: "Please select a file and fill in all fields",
        variant: "destructive",
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
        toast({
          title: "Invalid File Type",
          description: "Please select an MP3, WAV, or FLAC file",
          variant: "destructive",
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

  return (
    <section className="p-6">
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-foreground mb-2 font-sans">Upload Music</h2>
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
              placeholder="Enter music URL (SoundCloud, YouTube, etc.)"
              value={urlData.url}
              onChange={(e) => setUrlData({ ...urlData, url: e.target.value })}
              className="bg-input border-border font-serif"
              data-testid="input-url"
            />
            <Input
              type="text"
              placeholder="Track title"
              value={urlData.title}
              onChange={(e) => setUrlData({ ...urlData, title: e.target.value })}
              className="bg-input border-border font-serif"
              data-testid="input-url-title"
            />
            <Input
              type="text"
              placeholder="Artist name"
              value={urlData.artist}
              onChange={(e) => setUrlData({ ...urlData, artist: e.target.value })}
              className="bg-input border-border font-serif"
              data-testid="input-url-artist"
            />
            <Select value={urlData.category} onValueChange={(value) => setUrlData({ ...urlData, category: value })}>
              <SelectTrigger className="bg-input border-border" data-testid="select-url-category">
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
