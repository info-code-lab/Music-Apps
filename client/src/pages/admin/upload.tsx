import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { 
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { 
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { 
  Upload as UploadIcon, 
  Music, 
  Link, 
  FileAudio,
  CheckCircle,
  AlertCircle,
  Loader2,
  File,
  Globe,
  Clock,
  User,
  Tag
} from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { apiRequest } from "@/lib/queryClient";
import toast from "react-hot-toast";

const fileUploadSchema = z.object({
  title: z.string().min(1, "Title is required"),
  artist: z.string().min(1, "Artist is required"),
  category: z.string().min(1, "Category is required"),
  file: z.any(),
});

const urlUploadSchema = z.object({
  title: z.string().min(1, "Title is required"),
  artist: z.string().min(1, "Artist is required"),
  category: z.string().min(1, "Category is required"),
  url: z.string().url("Must be a valid URL"),
});

type FileUploadData = z.infer<typeof fileUploadSchema>;
type UrlUploadData = z.infer<typeof urlUploadSchema>;

export default function UploadManagement() {
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [urlProgress, setUrlProgress] = useState(0);
  const [isUrlUploading, setIsUrlUploading] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const queryClient = useQueryClient();

  const fileForm = useForm<FileUploadData>({
    resolver: zodResolver(fileUploadSchema),
    defaultValues: {
      title: "",
      artist: "",
      category: "",
    },
  });

  const urlForm = useForm<UrlUploadData>({
    resolver: zodResolver(urlUploadSchema),
    defaultValues: {
      title: "",
      artist: "",
      category: "",
      url: "",
    },
  });

  const fileUploadMutation = useMutation({
    mutationFn: async (data: FileUploadData) => {
      setIsUploading(true);
      setUploadProgress(0);
      
      // Simulate upload progress
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return prev;
          }
          return prev + 10;
        });
      }, 200);

      try {
        const formData = new FormData();
        formData.append("title", data.title);
        formData.append("artist", data.artist);
        formData.append("category", data.category);
        if (data.file) {
          formData.append("audio", data.file[0]);
        }

        await apiRequest("POST", "/api/tracks/upload-file", formData);
        setUploadProgress(100);
        clearInterval(progressInterval);
      } catch (error) {
        clearInterval(progressInterval);
        throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/tracks"] });
      toast.success("Track uploaded successfully");
      fileForm.reset();
      setIsUploading(false);
      setUploadProgress(0);
    },
    onError: () => {
      toast.error("Failed to upload track");
      setIsUploading(false);
      setUploadProgress(0);
    },
  });

  const urlUploadMutation = useMutation({
    mutationFn: async (data: UrlUploadData) => {
      setIsUrlUploading(true);
      setUrlProgress(0);
      
      try {
        const response = await apiRequest("POST", "/api/tracks/upload-url", data) as unknown as { sessionId: string; message: string };
        const { sessionId } = response;
        
        // Set up progress tracking
        if (sessionId) {
          return new Promise((resolve, reject) => {
            const eventSource = new EventSource(`/api/upload-progress/${sessionId}`);
            
            eventSource.onmessage = (event) => {
              const data = JSON.parse(event.data);
              
              if (data.type === 'status') {
                setUrlProgress(data.progress || 0);
              } else if (data.type === 'complete') {
                eventSource.close();
                setUrlProgress(100);
                resolve(data);
              } else if (data.type === 'error') {
                eventSource.close();
                reject(new Error(data.message));
              }
            };
            
            eventSource.onerror = () => {
              eventSource.close();
              reject(new Error('Upload failed'));
            };
          });
        }
        
        return response;
      } catch (error) {
        throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/tracks"] });
      toast.success("Track added from URL successfully");
      urlForm.reset();
      setIsUrlUploading(false);
      setUrlProgress(0);
    },
    onError: () => {
      toast.error("Failed to add track from URL");
      setIsUrlUploading(false);
      setUrlProgress(0);
    },
  });

  // Drag and drop handlers
  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    const files = e.dataTransfer.files;
    if (files && files[0]) {
      const file = files[0];
      const allowedTypes = ['audio/mp3', 'audio/wav', 'audio/flac', 'audio/mpeg'];
      if (allowedTypes.includes(file.type) || file.name.match(/\.(mp3|wav|flac)$/i)) {
        fileForm.setValue('file', files);
      } else {
        toast.error('Invalid file type. Please select MP3, WAV, or FLAC files.');
      }
    }
  };

  const onFileUpload = (data: FileUploadData) => {
    fileUploadMutation.mutate(data);
  };

  const onUrlUpload = (data: UrlUploadData) => {
    urlUploadMutation.mutate(data);
  };

  const categories = ["Jazz", "Electronic", "Classical", "Rock", "Folk", "Hip-Hop"];

  const recentUploads = [
    { title: "Sunset Dreams", artist: "Luna Collective", status: "completed", time: "2 minutes ago" },
    { title: "Jazz Improvisation", artist: "Jazz Masters", status: "processing", time: "5 minutes ago" },
    { title: "Electronic Pulse", artist: "Digital Waves", status: "completed", time: "10 minutes ago" },
  ];

  const uploadStats = [
    { title: "Today's Uploads", value: "12", icon: UploadIcon, color: "text-blue-600" },
    { title: "Processing", value: "3", icon: Loader2, color: "text-yellow-600" },
    { title: "Completed", value: "156", icon: CheckCircle, color: "text-green-600" },
    { title: "Failed", value: "2", icon: AlertCircle, color: "text-red-600" }
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Upload Management</h1>
          <p className="text-gray-600 dark:text-gray-400">Upload and manage music content</p>
        </div>
        <div className="flex items-center gap-3">
          <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200 dark:bg-green-900/20">
            <CheckCircle className="h-3 w-3 mr-1" />
            System Online
          </Badge>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {uploadStats.map((stat) => {
          const Icon = stat.icon;
          return (
            <Card key={stat.title}>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400">{stat.title}</p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">{stat.value}</p>
                  </div>
                  <Icon className={`h-8 w-8 ${stat.color} ${stat.title === "Processing" ? "animate-spin" : ""}`} />
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Upload Music Section */}
      <Card>
        <CardHeader className="pb-4">
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 rounded-full bg-blue-100 dark:bg-blue-900/20 flex items-center justify-center">
              <Music className="h-4 w-4 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <CardTitle className="text-lg">Upload Music</CardTitle>
              <CardDescription className="text-sm">Add new tracks to your library via URL or direct upload</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Upload via URL */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                <Globe className="h-4 w-4" />
                Upload via URL
              </div>
              
              <Form {...urlForm}>
                <form onSubmit={urlForm.handleSubmit(onUrlUpload)} className="space-y-4">
                  <FormField
                    control={urlForm.control}
                    name="url"
                    render={({ field }) => (
                      <FormItem>
                        <FormControl>
                          <Input 
                            placeholder="Enter music URL (YouTube, SoundCloud, etc.)" 
                            className="bg-gray-50 dark:bg-gray-900 border-gray-200 dark:border-gray-700"
                            {...field} 
                            data-testid="url-input" 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <div className="flex items-center gap-2 text-xs text-blue-600 dark:text-blue-400">
                    <Music className="h-3 w-3" />
                    <span>Song details will be automatically extracted from the URL</span>
                  </div>

                  {isUrlUploading && (
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span>Processing URL...</span>
                        <span>{urlProgress}%</span>
                      </div>
                      <Progress value={urlProgress} className="h-2" />
                    </div>
                  )}

                  <Button
                    type="submit"
                    disabled={urlUploadMutation.isPending || isUrlUploading}
                    className="w-full bg-orange-500 hover:bg-orange-600 text-white"
                    data-testid="upload-url-submit"
                  >
                    {urlUploadMutation.isPending || isUrlUploading ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        {isUrlUploading ? 'Processing...' : 'Adding...'}
                      </>
                    ) : (
                      <>
                        <UploadIcon className="h-4 w-4 mr-2" />
                        Upload from URL
                      </>
                    )}
                  </Button>
                </form>
              </Form>
            </div>

            {/* Direct Upload */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                <File className="h-4 w-4" />
                Direct Upload
              </div>
              
              <Form {...fileForm}>
                <form onSubmit={fileForm.handleSubmit(onFileUpload)} className="space-y-4">
                  <div 
                    className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
                      dragActive 
                        ? 'border-orange-400 bg-orange-50 dark:bg-orange-900/20' 
                        : 'border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-900'
                    }`}
                    onDragEnter={handleDrag}
                    onDragLeave={handleDrag}
                    onDragOver={handleDrag}
                    onDrop={handleDrop}
                  >
                    <div className="h-12 w-12 mx-auto mb-3 text-gray-400">
                      <svg viewBox="0 0 24 24" fill="currentColor" className="w-full h-full">
                        <path d="M14,2H6A2,2 0 0,0 4,4V20A2,2 0 0,0 6,22H18A2,2 0 0,0 20,20V8L14,2M18,20H6V4H13V9H18V20Z" />
                      </svg>
                    </div>
                    
                    <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Drop files here or click to browse
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mb-4">
                      Support for MP3, WAV, FLAC files up to 50MB
                    </p>
                    
                    <FormField
                      control={fileForm.control}
                      name="file"
                      render={({ field }) => (
                        <FormItem>
                          <FormControl>
                            <Input
                              type="file"
                              accept=".mp3,.wav,.flac"
                              onChange={(e) => field.onChange(e.target.files)}
                              className="hidden"
                              id="file-upload"
                              data-testid="file-upload-input"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <label htmlFor="file-upload">
                      <Button type="button" variant="outline" className="border-gray-300 text-gray-700 hover:bg-gray-100" asChild>
                        <span>Choose File</span>
                      </Button>
                    </label>
                  </div>

                  <FormField
                    control={fileForm.control}
                    name="title"
                    render={({ field }) => (
                      <FormItem>
                        <FormControl>
                          <Input 
                            placeholder="Track title" 
                            className="bg-gray-50 dark:bg-gray-900 border-gray-200 dark:border-gray-700"
                            {...field} 
                            data-testid="file-title-input" 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={fileForm.control}
                    name="artist"
                    render={({ field }) => (
                      <FormItem>
                        <FormControl>
                          <Input 
                            placeholder="Artist name" 
                            className="bg-gray-50 dark:bg-gray-900 border-gray-200 dark:border-gray-700"
                            {...field} 
                            data-testid="file-artist-input" 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={fileForm.control}
                    name="category"
                    render={({ field }) => (
                      <FormItem>
                        <FormControl>
                          <select 
                            {...field} 
                            className="w-full px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-md bg-gray-50 dark:bg-gray-900 text-gray-700 dark:text-gray-300" 
                            data-testid="file-category-select"
                          >
                            <option value="">Select category</option>
                            {categories.map(cat => (
                              <option key={cat} value={cat}>{cat}</option>
                            ))}
                          </select>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {isUploading && (
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span>Uploading...</span>
                        <span>{uploadProgress}%</span>
                      </div>
                      <Progress value={uploadProgress} className="h-2" />
                    </div>
                  )}

                  <Button
                    type="submit"
                    disabled={fileUploadMutation.isPending || isUploading}
                    className="w-full bg-orange-500 hover:bg-orange-600 text-white"
                    data-testid="upload-file-submit"
                  >
                    {isUploading ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Uploading...
                      </>
                    ) : (
                      <>
                        <UploadIcon className="h-4 w-4 mr-2" />
                        Upload File
                      </>
                    )}
                  </Button>
                </form>
              </Form>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Recent Uploads */}
        <div>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5" />
                Recent Uploads
              </CardTitle>
              <CardDescription>Latest upload activity</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {recentUploads.map((upload, index) => (
                <div key={index} className="flex items-start gap-3 p-3 rounded-lg bg-gray-50 dark:bg-gray-800/50">
                  <div className="flex-shrink-0">
                    {upload.status === "completed" ? (
                      <CheckCircle className="h-5 w-5 text-green-500" />
                    ) : (
                      <Loader2 className="h-5 w-5 text-yellow-500 animate-spin" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                      {upload.title}
                    </p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      by {upload.artist}
                    </p>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge 
                        variant={upload.status === "completed" ? "outline" : "secondary"}
                        className={upload.status === "completed" ? "bg-green-50 text-green-700 border-green-200 dark:bg-green-900/20" : ""}
                      >
                        {upload.status}
                      </Badge>
                      <span className="text-xs text-gray-500">{upload.time}</span>
                    </div>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Upload Guidelines */}
          <Card className="mt-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertCircle className="h-5 w-5" />
                Upload Guidelines
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="flex items-start gap-2">
                <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                <span>Audio files up to 50MB</span>
              </div>
              <div className="flex items-start gap-2">
                <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                <span>Supported formats: MP3, WAV, FLAC</span>
              </div>
              <div className="flex items-start gap-2">
                <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                <span>High-quality artwork recommended</span>
              </div>
              <div className="flex items-start gap-2">
                <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                <span>Complete metadata required</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}