import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { CheckCircle2, XCircle, Download, Upload, Music } from "lucide-react";

interface ProgressUpdate {
  type: 'progress' | 'status' | 'error' | 'complete';
  message: string;
  progress?: number;
  stage?: string;
}

interface UploadProgressModalProps {
  isOpen: boolean;
  onClose: () => void;
  sessionId: string | null;
}

export default function UploadProgressModal({ 
  isOpen, 
  onClose, 
  sessionId 
}: UploadProgressModalProps) {
  const [progress, setProgress] = useState(0);
  const [status, setStatus] = useState("Connecting...");
  const [stage, setStage] = useState("connecting");
  const [isComplete, setIsComplete] = useState(false);
  const [isError, setIsError] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    if (!sessionId || !isOpen) return;

    const eventSource = new EventSource(`/api/upload-progress/${sessionId}`);

    eventSource.onmessage = (event) => {
      try {
        const data: ProgressUpdate = JSON.parse(event.data);
        
        setStatus(data.message);
        if (data.progress !== undefined) {
          setProgress(data.progress);
        }
        if (data.stage) {
          setStage(data.stage);
        }

        if (data.type === 'complete') {
          setIsComplete(true);
          setTimeout(() => {
            onClose();
            resetState();
          }, 2000);
        }

        if (data.type === 'error') {
          setIsError(true);
          setErrorMessage(data.message);
        }
      } catch (error) {
        console.error("Error parsing progress data:", error);
      }
    };

    eventSource.onerror = (error) => {
      console.error("EventSource error:", error);
      setIsError(true);
      setErrorMessage("Connection to progress stream lost");
      eventSource.close();
    };

    return () => {
      eventSource.close();
    };
  }, [sessionId, isOpen]);

  const resetState = () => {
    setProgress(0);
    setStatus("Connecting...");
    setStage("connecting");
    setIsComplete(false);
    setIsError(false);
    setErrorMessage("");
  };

  const cancelUpload = async () => {
    if (sessionId && !isComplete && !isError) {
      try {
        await fetch(`/api/upload-cancel/${sessionId}`, {
          method: 'POST',
          credentials: 'include',
        });
      } catch (error) {
        console.error('Failed to cancel upload:', error);
      }
    }
  };

  const getStageIcon = () => {
    if (isComplete) return <CheckCircle2 className="w-6 h-6 text-green-500" />;
    if (isError) return <XCircle className="w-6 h-6 text-destructive" />;
    
    switch (stage) {
      case 'analyzing':
      case 'starting':
        return <Upload className="w-6 h-6 text-primary animate-pulse" />;
      case 'downloading':
        return <Download className="w-6 h-6 text-primary animate-bounce" />;
      case 'processing':
      case 'metadata':
      case 'finalizing':
        return <Music className="w-6 h-6 text-primary animate-spin" />;
      default:
        return <Upload className="w-6 h-6 text-primary animate-pulse" />;
    }
  };

  const getProgressColor = () => {
    if (isComplete) return "bg-green-500";
    if (isError) return "bg-destructive";
    return "bg-primary";
  };

  return (
    <Dialog open={isOpen} onOpenChange={async (open) => {
      if (!open) {
        await cancelUpload();
        onClose();
        resetState();
      }
    }}>
      <DialogContent className="sm:max-w-md" data-testid="upload-progress-modal">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2 font-sans">
            {getStageIcon()}
            <span>
              {isComplete ? "Upload Complete!" : isError ? "Upload Failed" : "Uploading Track"}
            </span>
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          {/* Progress Bar */}
          <div className="space-y-2">
            <Progress 
              value={progress} 
              className="w-full" 
              data-testid="progress-bar"
            />
            <div className="flex justify-between text-sm text-muted-foreground font-mono">
              <span data-testid="progress-percentage">{Math.round(progress)}%</span>
              <span data-testid="progress-stage" className="capitalize">
                {stage.replace(/_/g, ' ')}
              </span>
            </div>
          </div>

          {/* Status Message */}
          <div 
            className={`p-3 rounded-lg text-sm font-serif ${
              isError 
                ? "bg-destructive/10 text-destructive border border-destructive/20" 
                : isComplete
                ? "bg-green-50 text-green-700 border border-green-200 dark:bg-green-900/20 dark:text-green-300 dark:border-green-800"
                : "bg-muted text-muted-foreground"
            }`}
            data-testid="status-message"
          >
            {status}
          </div>

          {/* Error Details */}
          {isError && errorMessage && (
            <div className="p-3 bg-destructive/5 border border-destructive/20 rounded-lg">
              <p className="text-sm text-destructive font-serif">{errorMessage}</p>
            </div>
          )}

          {/* Action Buttons */}
          {(isComplete || isError) && (
            <div className="flex justify-end space-x-2 pt-2">
              <Button 
                onClick={async () => {
                  await cancelUpload();
                  onClose();
                  resetState();
                }}
                variant={isError ? "destructive" : "default"}
                className="font-mono"
                data-testid="close-progress-button"
              >
                {isError ? "Close" : "Done"}
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}