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
  Loader2
} from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { apiRequest } from "@/lib/queryClient";
import toast from "react-hot-toast";

const fileUploadSchema = z.object({
  title: z.string().min(1, "Title is required"),
  artist: z.string().min(1, "Artist is required"),
  category: z.enum(["Jazz", "Electronic", "Classical", "Rock", "Folk", "Hip-Hop"]),
  file: z.any().refine((file) => file instanceof File, "Please select a file"),
});

const urlUploadSchema = z.object({
  url: z.string().url("Please enter a valid URL"),
  category: z.enum(["Jazz", "Electronic", "Classical", "Rock", "Folk", "Hip-Hop"]),
});

type FileUploadData = z.infer<typeof fileUploadSchema>;
type UrlUploadData = z.infer<typeof urlUploadSchema>;

export default function UploadManagement() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadStatus, setUploadStatus] = useState<"idle" | "uploading" | "success" | "error">("idle");
  const queryClient = useQueryClient();

  const fileForm = useForm<FileUploadData>({
    resolver: zodResolver(fileUploadSchema),
    defaultValues: {
      title: "",
      artist: "",
      category: "Jazz",
    },
  });

  const urlForm = useForm<UrlUploadData>({
    resolver: zodResolver(urlUploadSchema),
    defaultValues: {
      url: "",
      category: "Jazz",
    },
  });

  const fileUploadMutation = useMutation({
    mutationFn: async (data: FileUploadData) => {
      const formData = new FormData();
      formData.append("title", data.title);
      formData.append("artist", data.artist);
      formData.append("category", data.category);
      formData.append("file", data.file);

      const response = await fetch("/api/tracks/upload", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        throw new Error("Upload failed");
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/tracks"] });
      toast.success("File uploaded successfully!");
      setUploadStatus("success");
      fileForm.reset();
      setSelectedFile(null);
      setUploadProgress(0);
    },
    onError: () => {
      toast.error("Failed to upload file");
      setUploadStatus("error");
      setUploadProgress(0);
    },
  });

  const urlUploadMutation = useMutation({
    mutationFn: async (data: UrlUploadData) => {
      const response = await apiRequest("POST", "/api/tracks/upload-url", data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/tracks"] });
      toast.success("URL uploaded successfully!");
      setUploadStatus("success");
      urlForm.reset();
    },
    onError: () => {
      toast.error("Failed to upload from URL");
      setUploadStatus("error");
    },
  });

  const handleFileUpload = (data: FileUploadData) => {
    setUploadStatus("uploading");
    setUploadProgress(0);
    
    // Simulate progress for now
    const interval = setInterval(() => {
      setUploadProgress(prev => {
        if (prev >= 95) {
          clearInterval(interval);
          return 95;
        }
        return prev + 10;
      });
    }, 200);

    fileUploadMutation.mutate(data);
  };

  const handleUrlUpload = (data: UrlUploadData) => {
    setUploadStatus("uploading");
    urlUploadMutation.mutate(data);
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      fileForm.setValue("file", file);
      
      // Auto-fill title from filename
      const filename = file.name.replace(/\.[^/.]+$/, "");
      if (!fileForm.getValues("title")) {
        fileForm.setValue("title", filename);
      }
    }
  };

  const categories = ["Jazz", "Electronic", "Classical", "Rock", "Folk", "Hip-Hop"];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Upload Content</h1>
        <p className="text-gray-600 dark:text-gray-400">Add new music tracks to your library</p>
      </div>

      {/* Upload Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <FileAudio className="h-8 w-8 text-blue-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">File Uploads</p>
                <p className="text-2xl font-bold">247</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <Link className="h-8 w-8 text-green-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">URL Uploads</p>
                <p className="text-2xl font-bold">156</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <UploadIcon className="h-8 w-8 text-purple-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">This Month</p>
                <p className="text-2xl font-bold">42</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Upload Interface */}
      <Card>
        <CardHeader>
          <CardTitle>Upload New Track</CardTitle>
          <CardDescription>Upload music files or add tracks from URLs</CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="file" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="file" data-testid="tab-file-upload">File Upload</TabsTrigger>
              <TabsTrigger value="url" data-testid="tab-url-upload">URL Upload</TabsTrigger>
            </TabsList>
            
            {/* File Upload Tab */}
            <TabsContent value="file" className="space-y-6">
              <Form {...fileForm}>
                <form onSubmit={fileForm.handleSubmit(handleFileUpload)} className="space-y-6">
                  {/* File Drop Zone */}
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
                    <input
                      type="file"
                      accept="audio/*"
                      onChange={handleFileSelect}
                      className="hidden"
                      id="file-upload"
                      data-testid="input-file-upload"
                    />
                    <label htmlFor="file-upload" className="cursor-pointer">
                      <div className="flex flex-col items-center">
                        <UploadIcon className="h-12 w-12 text-gray-400 mb-4" />
                        <p className="text-lg font-medium text-gray-900 dark:text-white">
                          {selectedFile ? selectedFile.name : "Choose audio file"}
                        </p>
                        <p className="text-sm text-gray-500">
                          MP3, WAV, FLAC up to 50MB
                        </p>
                        {selectedFile && (
                          <Badge variant="outline" className="mt-2">
                            {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                          </Badge>
                        )}
                      </div>
                    </label>
                  </div>

                  {/* Upload Progress */}
                  {uploadStatus === "uploading" && (
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">Uploading...</span>
                        <span className="text-sm text-gray-500">{uploadProgress}%</span>
                      </div>
                      <Progress value={uploadProgress} className="w-full" />
                    </div>
                  )}

                  {/* Upload Status */}
                  {uploadStatus === "success" && (
                    <div className="flex items-center space-x-2 text-green-600">
                      <CheckCircle className="h-5 w-5" />
                      <span>Upload completed successfully!</span>
                    </div>
                  )}

                  {uploadStatus === "error" && (
                    <div className="flex items-center space-x-2 text-red-600">
                      <AlertCircle className="h-5 w-5" />
                      <span>Upload failed. Please try again.</span>
                    </div>
                  )}

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={fileForm.control}
                      name="title"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Track Title</FormLabel>
                          <FormControl>
                            <Input placeholder="Enter track title" {...field} data-testid="input-file-title" />
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
                            <Input placeholder="Enter artist name" {...field} data-testid="input-file-artist" />
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
                          <select 
                            {...field}
                            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                            data-testid="select-file-category"
                          >
                            {categories.map((category) => (
                              <option key={category} value={category}>
                                {category}
                              </option>
                            ))}
                          </select>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <Button
                    type="submit"
                    disabled={!selectedFile || fileUploadMutation.isPending || uploadStatus === "uploading"}
                    className="w-full"
                    data-testid="button-upload-file"
                  >
                    {fileUploadMutation.isPending || uploadStatus === "uploading" ? (
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
            </TabsContent>

            {/* URL Upload Tab */}
            <TabsContent value="url" className="space-y-6">
              <Form {...urlForm}>
                <form onSubmit={urlForm.handleSubmit(handleUrlUpload)} className="space-y-6">
                  <FormField
                    control={urlForm.control}
                    name="url"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Music URL</FormLabel>
                        <FormControl>
                          <Input 
                            placeholder="https://www.youtube.com/watch?v=..." 
                            {...field} 
                            data-testid="input-url"
                          />
                        </FormControl>
                        <FormMessage />
                        <p className="text-sm text-gray-500">
                          Supported: YouTube, SoundCloud, and other audio platforms
                        </p>
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={urlForm.control}
                    name="category"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Category</FormLabel>
                        <FormControl>
                          <select 
                            {...field}
                            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                            data-testid="select-url-category"
                          >
                            {categories.map((category) => (
                              <option key={category} value={category}>
                                {category}
                              </option>
                            ))}
                          </select>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Upload Status for URL */}
                  {urlUploadMutation.isPending && (
                    <div className="flex items-center space-x-2 text-blue-600">
                      <Loader2 className="h-5 w-5 animate-spin" />
                      <span>Processing URL...</span>
                    </div>
                  )}

                  <Button
                    type="submit"
                    disabled={urlUploadMutation.isPending}
                    className="w-full"
                    data-testid="button-upload-url"
                  >
                    {urlUploadMutation.isPending ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Processing...
                      </>
                    ) : (
                      <>
                        <Link className="h-4 w-4 mr-2" />
                        Upload from URL
                      </>
                    )}
                  </Button>
                </form>
              </Form>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Upload Guidelines */}
      <Card>
        <CardHeader>
          <CardTitle>Upload Guidelines</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-medium text-gray-900 dark:text-white mb-2">File Requirements</h4>
              <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
                <li>• Supported formats: MP3, WAV, FLAC</li>
                <li>• Maximum file size: 50MB</li>
                <li>• Minimum quality: 128 kbps</li>
                <li>• Recommended: 320 kbps or higher</li>
              </ul>
            </div>
            <div>
              <h4 className="font-medium text-gray-900 dark:text-white mb-2">Content Policy</h4>
              <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
                <li>• Only upload content you own or have rights to</li>
                <li>• No copyrighted material without permission</li>
                <li>• Provide accurate metadata and categorization</li>
                <li>• Ensure audio quality meets platform standards</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}