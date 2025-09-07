import UploadSection from "@/components/upload-section";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  CheckCircle,
  AlertCircle,
  Loader2,
  Clock,
  User,
  Upload as UploadIcon
} from "lucide-react";

export default function UploadManagement() {

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

      {/* Upload Section */}
      <UploadSection />

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