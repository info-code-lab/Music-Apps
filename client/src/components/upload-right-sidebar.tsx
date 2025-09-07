import { useQuery } from "@tanstack/react-query";
import { Clock, CheckCircle2, Loader2, FileAudio, Info } from "lucide-react";
import type { Track } from "@shared/schema";

export default function UploadRightSidebar() {
  const { data: recentTracks = [] } = useQuery<Track[]>({
    queryKey: ["/api/tracks"],
  });

  // Get the 3 most recent tracks (sorted by creation date if available)
  const recentUploads = recentTracks.slice(0, 3);

  const formatTimeAgo = (timestamp: string | Date) => {
    const now = new Date();
    const date = new Date(timestamp);
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 1) return "just now";
    if (diffInMinutes < 60) return `${diffInMinutes} minutes ago`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)} hours ago`;
    return `${Math.floor(diffInMinutes / 1440)} days ago`;
  };

  return (
    <aside className="w-80 p-6 space-y-6">
      {/* Recent Uploads */}
      <div className="bg-amber-50 dark:bg-amber-950/20 rounded-lg p-4 border border-amber-200 dark:border-amber-800">
        <div className="flex items-center gap-2 mb-3">
          <Clock className="w-4 h-4 text-amber-600" />
          <h3 className="font-semibold text-amber-900 dark:text-amber-100">Recent Uploads</h3>
        </div>
        <p className="text-sm text-amber-700 dark:text-amber-300 mb-4">Latest upload activity</p>
        
        <div className="space-y-3">
          {recentUploads.length > 0 ? (
            recentUploads.map((track, index) => (
              <div key={track.id} className="flex items-start gap-3">
                <div className="flex-shrink-0 mt-1">
                  <CheckCircle2 className="w-4 h-4 text-green-500" />
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="text-sm font-medium text-foreground truncate">
                    {track.title}
                  </h4>
                  <p className="text-xs text-muted-foreground">
                    by {track.artist}
                  </p>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-xs bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 px-2 py-0.5 rounded">
                      completed
                    </span>
                    <span className="text-xs text-muted-foreground">
                      2 minutes ago
                    </span>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-4">
              <FileAudio className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">No recent uploads</p>
            </div>
          )}
        </div>
      </div>

      {/* Upload Guidelines */}
      <div className="bg-blue-50 dark:bg-blue-950/20 rounded-lg p-4 border border-blue-200 dark:border-blue-800">
        <div className="flex items-center gap-2 mb-3">
          <Info className="w-4 h-4 text-blue-600" />
          <h3 className="font-semibold text-blue-900 dark:text-blue-100">Upload Guidelines</h3>
        </div>
        
        <div className="space-y-3">
          <div className="flex items-start gap-2">
            <CheckCircle2 className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
            <span className="text-sm text-foreground">Audio files up to 50MB</span>
          </div>
          
          <div className="flex items-start gap-2">
            <CheckCircle2 className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
            <span className="text-sm text-foreground">Supported formats: MP3, WAV, FLAC</span>
          </div>
          
          <div className="flex items-start gap-2">
            <CheckCircle2 className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
            <span className="text-sm text-foreground">High-quality artwork recommended</span>
          </div>
          
          <div className="flex items-start gap-2">
            <CheckCircle2 className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
            <span className="text-sm text-foreground">Complete metadata required</span>
          </div>
        </div>
      </div>
    </aside>
  );
}