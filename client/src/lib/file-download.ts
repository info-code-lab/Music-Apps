import type { LegacyTrack as Track } from '@shared/schema';

export interface DownloadProgress {
  loaded: number;
  total: number;
  percentage: number;
}

export class FileDownloader {
  /**
   * Downloads a music file to the user's device storage
   */
  static async downloadToDevice(
    track: Track,
    onProgress?: (progress: DownloadProgress) => void
  ): Promise<void> {
    if (!track.url) {
      throw new Error('No audio URL available');
    }

    try {
      // Fetch the audio file with progress tracking
      const response = await fetch(track.url);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const contentLength = response.headers.get('content-length');
      const total = contentLength ? parseInt(contentLength, 10) : 0;
      let loaded = 0;

      const reader = response.body?.getReader();
      if (!reader) {
        throw new Error('No response body');
      }

      const chunks: Uint8Array[] = [];

      // Read the stream with progress updates
      while (true) {
        const { done, value } = await reader.read();
        
        if (done) break;

        chunks.push(value);
        loaded += value.length;

        // Report progress
        if (onProgress && total > 0) {
          onProgress({
            loaded,
            total,
            percentage: (loaded / total) * 100
          });
        }
      }

      // Create blob from chunks
      const audioBlob = new Blob(chunks, { type: 'audio/mpeg' });

      // Generate filename
      const filename = this.generateFilename(track);

      // Trigger download
      this.triggerDownload(audioBlob, filename);

    } catch (error) {
      throw new Error(`Download failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Generate a clean filename for the download
   */
  private static generateFilename(track: Track): string {
    const cleanTitle = track.title.replace(/[^a-zA-Z0-9\s-]/g, '').trim();
    const cleanArtist = track.artist.replace(/[^a-zA-Z0-9\s-]/g, '').trim();
    
    return `${cleanArtist} - ${cleanTitle}.mp3`;
  }

  /**
   * Trigger browser download
   */
  private static triggerDownload(blob: Blob, filename: string): void {
    const url = URL.createObjectURL(blob);
    
    // Create temporary download link
    const downloadLink = document.createElement('a');
    downloadLink.href = url;
    downloadLink.download = filename;
    downloadLink.style.display = 'none';
    
    // Add to DOM and trigger click
    document.body.appendChild(downloadLink);
    downloadLink.click();
    
    // Cleanup
    document.body.removeChild(downloadLink);
    URL.revokeObjectURL(url);
  }

  /**
   * Check if downloads are supported in current browser
   */
  static isSupported(): boolean {
    return typeof document !== 'undefined' && 
           'createElement' in document && 
           'download' in document.createElement('a');
  }
}