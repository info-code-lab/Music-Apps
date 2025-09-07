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
  url: z.string().url("Must be a valid URL"),
  title: z.string().min(1, "Title is required"),
  artist: z.string().min(1, "Artist is required"),
  category: z.string().min(1, "Category is required"),
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

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Upload Section */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <UploadIcon className="h-5 w-5" />
                Upload Content
              </CardTitle>
              <CardDescription>Add new tracks to your music library</CardDescription>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="file" className="w-full">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="file" className="gap-2">
                    <File className="h-4 w-4" />
                    File Upload
                  </TabsTrigger>
                  <TabsTrigger value="url" className="gap-2">
                    <Globe className="h-4 w-4" />
                    URL Import
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="file" className="space-y-4">
                  <Form {...fileForm}>
                    <form onSubmit={fileForm.handleSubmit(onFileUpload)} className="space-y-4">
                      <div 
                        className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
                          dragActive 
                            ? 'border-blue-400 bg-blue-50 dark:bg-blue-900/20' 
                            : 'border-gray-300 dark:border-gray-600'
                        }`}
                        onDragEnter={handleDrag}
                        onDragLeave={handleDrag}
                        onDragOver={handleDrag}
                        onDrop={handleDrop}
                      >
                        <FileAudio className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                        <p className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                          Drop your audio file here
                        </p>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                          Supports MP3, WAV, FLAC (Max 50MB)
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
                          <Button type="button" variant="outline" asChild>
                            <span>Choose File</span>
                          </Button>
                        </label>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <FormField
                          control={fileForm.control}
                          name="title"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Track Title</FormLabel>
                              <FormControl>
                                <Input placeholder="Enter track title" {...field} data-testid="file-title-input" />
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
                              <FormLabel>Artist</FormLabel>
                              <FormControl>
                                <Input placeholder="Enter artist name" {...field} data-testid="file-artist-input" />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>

                      <FormField
                        control={fileForm.control}
                        name="category"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Category</FormLabel>
                            <FormControl>
                              <select {...field} className="w-full px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-md bg-white dark:bg-gray-800" data-testid="file-category-select">
                                <option value="">Select a category</option>
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
                        className="w-full"
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
                            Upload Track
                          </>
                        )}
                      </Button>
                    </form>
                  </Form>
                </TabsContent>

                <TabsContent value="url" className="space-y-4">
                  <Form {...urlForm}>
                    <form onSubmit={urlForm.handleSubmit(onUrlUpload)} className="space-y-4">
                      <FormField
                        control={urlForm.control}
                        name="url"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Music URL</FormLabel>
                            <FormControl>
                              <Input placeholder="https://example.com/track.mp3" {...field} data-testid="url-input" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <FormField
                          control={urlForm.control}
                          name="title"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Track Title</FormLabel>
                              <FormControl>
                                <Input placeholder="Enter track title" {...field} data-testid="url-title-input" />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={urlForm.control}
                          name="artist"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Artist</FormLabel>
                              <FormControl>
                                <Input placeholder="Enter artist name" {...field} data-testid="url-artist-input" />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>

                      <FormField
                        control={urlForm.control}
                        name="category"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Category</FormLabel>
                            <FormControl>
                              <select {...field} className="w-full px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-md bg-white dark:bg-gray-800" data-testid="url-category-select">
                                <option value="">Select a category</option>
                                {categories.map(cat => (
                                  <option key={cat} value={cat}>{cat}</option>
                                ))}
                              </select>
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

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
                        className="w-full"
                        data-testid="upload-url-submit"
                      >
                        {urlUploadMutation.isPending || isUrlUploading ? (
                          <>
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            {isUrlUploading ? 'Processing...' : 'Adding...'}
                          </>
                        ) : (
                          <>
                            <Link className="h-4 w-4 mr-2" />
                            Add from URL
                          </>
                        )}
                      </Button>
                    </form>
                  </Form>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </div>

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