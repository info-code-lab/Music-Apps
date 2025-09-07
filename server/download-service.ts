import axios from "axios";
import fs from "fs";
import path from "path";
import { promisify } from "util";
import ffmpeg from "fluent-ffmpeg";
import { randomUUID } from "crypto";

const writeFile = promisify(fs.writeFile);
const mkdir = promisify(fs.mkdir);

export interface AudioMetadata {
  duration: number;
  title?: string;
  artist?: string;
  album?: string;
  filename: string;
  localPath: string;
}

export class DownloadService {
  private uploadsDir = "uploads";

  constructor() {
    this.ensureUploadsDir();
  }

  private async ensureUploadsDir() {
    try {
      await mkdir(this.uploadsDir, { recursive: true });
    } catch (error) {
      // Directory already exists or other error
    }
  }

  async downloadAndExtractMetadata(url: string): Promise<AudioMetadata> {
    try {
      console.log(`Downloading audio from URL: ${url}`);
      
      // Download the file
      const response = await axios({
        method: 'GET',
        url: url,
        responseType: 'arraybuffer',
        timeout: 60000, // 1 minute timeout
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        }
      });

      // Generate unique filename
      const fileExtension = this.getFileExtension(url, response.headers['content-type']);
      const filename = `${randomUUID()}${fileExtension}`;
      const localPath = path.join(this.uploadsDir, filename);

      // Save file to disk
      await writeFile(localPath, Buffer.from(response.data));
      console.log(`File saved to: ${localPath}`);

      // Extract metadata
      const metadata = await this.extractMetadata(localPath);
      
      return {
        ...metadata,
        filename,
        localPath
      };
    } catch (error) {
      console.error("Download error:", error);
      throw new Error(`Failed to download audio: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private getFileExtension(url: string, contentType?: string): string {
    // Try to get extension from URL
    const urlExtension = path.extname(new URL(url).pathname);
    if (urlExtension && ['.mp3', '.wav', '.flac', '.m4a', '.ogg'].includes(urlExtension.toLowerCase())) {
      return urlExtension;
    }

    // Fallback to content type
    if (contentType) {
      const typeMap: Record<string, string> = {
        'audio/mpeg': '.mp3',
        'audio/mp3': '.mp3',
        'audio/wav': '.wav',
        'audio/wave': '.wav',
        'audio/flac': '.flac',
        'audio/x-flac': '.flac',
        'audio/mp4': '.m4a',
        'audio/x-m4a': '.m4a',
        'audio/ogg': '.ogg'
      };
      return typeMap[contentType.toLowerCase()] || '.mp3';
    }

    return '.mp3'; // Default fallback
  }

  private extractMetadata(filePath: string): Promise<{
    duration: number;
    title?: string;
    artist?: string;
    album?: string;
  }> {
    return new Promise((resolve, reject) => {
      ffmpeg.ffprobe(filePath, (err, metadata) => {
        if (err) {
          console.error("FFprobe error:", err);
          reject(new Error(`Failed to extract metadata: ${err.message}`));
          return;
        }

        try {
          const duration = metadata.format.duration || 0;
          const tags = metadata.format.tags || {};

          // Extract common tag variations
          const title = tags.title || tags.Title || tags.TITLE || 
                       path.basename(filePath, path.extname(filePath));
          const artist = tags.artist || tags.Artist || tags.ARTIST || 
                        tags.album_artist || tags['album-artist'] || 'Unknown Artist';
          const album = tags.album || tags.Album || tags.ALBUM;

          resolve({
            duration: Math.round(duration),
            title: title as string,
            artist: artist as string,
            album: album as string
          });
        } catch (parseError) {
          console.error("Metadata parsing error:", parseError);
          reject(new Error("Failed to parse audio metadata"));
        }
      });
    });
  }

  async cleanup(filePath: string): Promise<void> {
    try {
      if (fs.existsSync(filePath)) {
        await promisify(fs.unlink)(filePath);
        console.log(`Cleaned up file: ${filePath}`);
      }
    } catch (error) {
      console.error(`Failed to cleanup file ${filePath}:`, error);
    }
  }
}

export const downloadService = new DownloadService();