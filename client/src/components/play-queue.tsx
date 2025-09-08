import { useState } from "react";
import {
  Play,
  Pause,
  MoreHorizontal,
  X,
  Shuffle,
  Repeat,
  Clock,
  Music,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { formatDuration } from "@/lib/audio-utils";
import type { Song, PlayQueue } from "@shared/schema";

interface PlayQueueProps {
  queue: (PlayQueue & { song: Song })[];
  currentTrackId?: string;
  isPlaying: boolean;
  isShuffled: boolean;
  repeatMode: 'none' | 'track' | 'queue';
  onTrackSelect: (trackId: string) => void;
  onTrackRemove: (queueId: string) => void;
  onQueueReorder: (startIndex: number, endIndex: number) => void;
  onShuffleToggle: () => void;
  onRepeatToggle: () => void;
  onClearQueue: () => void;
  className?: string;
}

export default function PlayQueue({
  queue,
  currentTrackId,
  isPlaying,
  isShuffled,
  repeatMode,
  onTrackSelect,
  onTrackRemove,
  onQueueReorder,
  onShuffleToggle,
  onRepeatToggle,
  onClearQueue,
  className = "",
}: PlayQueueProps) {
  const [showUpNext, setShowUpNext] = useState(true);

  const handleReorder = (fromIndex: number, toIndex: number) => {
    if (fromIndex !== toIndex) {
      onQueueReorder(fromIndex, toIndex);
    }
  };

  const totalDuration = queue.reduce((acc, item) => acc + (item.song.duration || 0), 0);
  const currentIndex = queue.findIndex(item => item.song.id === currentTrackId);
  const upNextQueue = currentIndex >= 0 ? queue.slice(currentIndex + 1) : queue;

  return (
    <div className={`bg-card border rounded-lg ${className}`}>
      {/* Queue Header */}
      <div className="p-4 border-b">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <Music className="h-5 w-5" />
            <div>
              <h3 className="font-semibold">Play Queue</h3>
              <p className="text-sm text-muted-foreground">
                {queue.length} tracks • {formatDuration(totalDuration)}
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={onShuffleToggle}
              className={isShuffled ? "text-blue-500" : ""}
              data-testid="button-queue-shuffle"
            >
              <Shuffle className="h-4 w-4" />
            </Button>
            
            <Button
              variant="ghost"
              size="sm"
              onClick={onRepeatToggle}
              className={repeatMode !== 'none' ? "text-blue-500" : ""}
              data-testid="button-queue-repeat"
            >
              <Repeat className="h-4 w-4" />
              {repeatMode === 'track' && <span className="ml-1 text-xs">1</span>}
            </Button>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" data-testid="button-queue-options">
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={onClearQueue}>
                  Clear Queue
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setShowUpNext(!showUpNext)}>
                  {showUpNext ? 'Hide' : 'Show'} Up Next
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {/* Queue Status */}
        <div className="flex items-center gap-2">
          {repeatMode === 'track' && (
            <Badge variant="secondary">Repeat Track</Badge>
          )}
          {repeatMode === 'queue' && (
            <Badge variant="secondary">Repeat Queue</Badge>
          )}
          {isShuffled && (
            <Badge variant="secondary">Shuffled</Badge>
          )}
        </div>
      </div>

      {/* Currently Playing */}
      {currentTrackId && (
        <div className="p-4 border-b bg-accent/50">
          <div className="flex items-center gap-2 mb-2">
            <div className="h-2 w-2 bg-green-500 rounded-full animate-pulse" />
            <span className="text-sm font-medium">Now Playing</span>
          </div>
          
          {queue
            .filter(item => item.song.id === currentTrackId)
            .map(item => (
              <div key={item.id} className="flex items-center gap-3">
                <div className="relative">
                  <img
                    src={item.song.coverArt || 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?ixlib=rb-4.0.3&auto=format&fit=crop&w=48&h=48'}
                    alt={item.song.title}
                    className="w-12 h-12 rounded object-cover"
                  />
                  <div className="absolute inset-0 bg-black/20 rounded flex items-center justify-center">
                    {isPlaying ? (
                      <Pause className="h-4 w-4 text-white" />
                    ) : (
                      <Play className="h-4 w-4 text-white" />
                    )}
                  </div>
                </div>
                
                <div className="flex-1 min-w-0">
                  <p className="font-medium truncate">{item.song.title}</p>
                  <p className="text-sm text-muted-foreground truncate">
                    Artist • {formatDuration(item.song.duration || 0)}
                  </p>
                </div>
              </div>
            ))}
        </div>
      )}

      {/* Up Next */}
      {showUpNext && upNextQueue.length > 0 && (
        <div className="p-4">
          <div className="flex items-center gap-2 mb-3">
            <Clock className="h-4 w-4" />
            <span className="text-sm font-medium">Up Next</span>
            <Badge variant="outline">{upNextQueue.length}</Badge>
          </div>

          <div className="space-y-2">
            {upNextQueue.map((item, index) => (
              <div
                key={item.id}
                className="flex items-center gap-3 p-2 rounded-lg hover:bg-accent/50 transition-colors group"
                data-testid={`queue-item-${item.song.id}`}
              >
                <div className="text-muted-foreground hover:text-foreground cursor-grab">
                  <MoreHorizontal className="h-4 w-4 rotate-90" />
                </div>

                          <button
                            onClick={() => onTrackSelect(item.song.id)}
                            className="flex items-center gap-3 flex-1 min-w-0 text-left"
                          >
                            <img
                              src={item.song.coverArt || 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?ixlib=rb-4.0.3&auto=format&fit=crop&w=40&h=40'}
                              alt={item.song.title}
                              className="w-10 h-10 rounded object-cover"
                            />
                            
                            <div className="flex-1 min-w-0">
                              <p className="font-medium truncate">{item.song.title}</p>
                              <p className="text-sm text-muted-foreground truncate">
                                Artist • {formatDuration(item.song.duration || 0)}
                              </p>
                            </div>
                          </button>

                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onTrackRemove(item.id)}
                  className="opacity-0 group-hover:opacity-100 transition-opacity"
                  data-testid={`button-remove-${item.song.id}`}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Empty State */}
      {queue.length === 0 && (
        <div className="p-8 text-center">
          <Music className="h-8 w-8 text-muted-foreground mx-auto mb-3" />
          <p className="text-muted-foreground">Your queue is empty</p>
          <p className="text-sm text-muted-foreground mt-1">
            Add some tracks to start playing
          </p>
        </div>
      )}
    </div>
  );
}