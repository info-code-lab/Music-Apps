export function formatDuration(seconds: number): string {
  if (!seconds || isNaN(seconds)) return "0:00";
  
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = Math.floor(seconds % 60);
  
  return `${minutes}:${remainingSeconds.toString().padStart(2, "0")}`;
}

export function parseAudioMetadata(file: File): Promise<{
  duration: number;
  title?: string;
  artist?: string;
}> {
  return new Promise((resolve, reject) => {
    const audio = new Audio();
    const url = URL.createObjectURL(file);
    
    audio.addEventListener("loadedmetadata", () => {
      URL.revokeObjectURL(url);
      resolve({
        duration: audio.duration,
        title: file.name.replace(/\.[^/.]+$/, ""), // Remove file extension
      });
    });
    
    audio.addEventListener("error", () => {
      URL.revokeObjectURL(url);
      reject(new Error("Failed to load audio metadata"));
    });
    
    audio.src = url;
  });
}

export function validateAudioFile(file: File): boolean {
  const allowedTypes = ["audio/mpeg", "audio/wav", "audio/flac"];
  const maxSize = 50 * 1024 * 1024; // 50MB
  
  return allowedTypes.includes(file.type) && file.size <= maxSize;
}
