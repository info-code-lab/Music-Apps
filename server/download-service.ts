import axios from "axios";
import fs from "fs";
import path from "path";
import { promisify } from "util";
import { exec } from "child_process";
import ffmpeg from "fluent-ffmpeg";
import { randomUUID } from "crypto";
import { progressEmitter } from "./progress-emitter";

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

  private isStreamingPlatformUrl(url: string): boolean {
    const streamingDomains = [
      'youtube.com', 'youtu.be', 'music.youtube.com',
      'soundcloud.com', 'vimeo.com', 'dailymotion.com',
      'twitch.tv', 'facebook.com', 'instagram.com',
      'tiktok.com', 'twitter.com', 'x.com'
    ];
    
    try {
      const urlObj = new URL(url);
      return streamingDomains.some(domain => 
        urlObj.hostname.includes(domain) ||
        urlObj.hostname.endsWith(domain)
      );
    } catch {
      return false;
    }
  }

  private isSpotifyUrl(url: string): boolean {
    try {
      const urlObj = new URL(url);
      return urlObj.hostname.includes('spotify.com');
    } catch {
      return false;
    }
  }

  private async ensureUploadsDir() {
    try {
      await mkdir(this.uploadsDir, { recursive: true });
    } catch (error) {
      // Directory already exists or other error
    }
  }

  async downloadAndExtractMetadata(url: string, sessionId?: string): Promise<AudioMetadata> {
    try {
      console.log(`Processing URL: ${url}`);
      
      if (sessionId) {
        progressEmitter.emit(sessionId, {
          type: 'status',
          message: 'Analyzing URL...',
          progress: 10,
          stage: 'analyzing'
        });
      }
      
      // Check if it's Spotify (not supported)
      if (this.isSpotifyUrl(url)) {
        const error = 'Spotify URLs are not supported due to copyright restrictions. Please use YouTube, SoundCloud, or direct file URLs instead.';
        if (sessionId) progressEmitter.emitError(sessionId, error);
        throw new Error(error);
      }
      
      let localPath: string;
      let filename: string;
      
      if (this.isStreamingPlatformUrl(url)) {
        // Use yt-dlp for streaming platforms
        if (sessionId) {
          progressEmitter.emit(sessionId, {
            type: 'status',
            message: 'Downloading from streaming platform...',
            progress: 20,
            stage: 'downloading'
          });
        }
        const result = await this.downloadFromStreamingPlatform(url, sessionId);
        localPath = result.localPath;
        filename = result.filename;
      } else {
        // Direct download for regular file URLs
        if (sessionId) {
          progressEmitter.emit(sessionId, {
            type: 'status',
            message: 'Downloading file...',
            progress: 20,
            stage: 'downloading'
          });
        }
        const result = await this.downloadDirectFile(url, sessionId);
        localPath = result.localPath;
        filename = result.filename;
      }

      // Extract metadata
      if (sessionId) {
        progressEmitter.emit(sessionId, {
          type: 'status',
          message: 'Extracting metadata...',
          progress: 80,
          stage: 'metadata'
        });
      }
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

  private async downloadFromStreamingPlatform(url: string, sessionId?: string): Promise<{localPath: string, filename: string}> {
    const filename = `${randomUUID()}.%(ext)s`;
    const outputTemplate = path.join(this.uploadsDir, filename);
    
    // Clean URL (remove playlist parameters that might cause issues)
    const cleanUrl = url.split('&list=')[0].split('&start_radio=')[0];
    console.log(`Cleaned URL: ${cleanUrl}`);
    
    // Try multiple approaches to bypass YouTube restrictions
    const attempts = [
      // Attempt 1: Basic with cleaned URL
      `yt-dlp -x --audio-format mp3 --audio-quality 0 -f "bestaudio" --no-warnings --ignore-errors -o "${outputTemplate}" "${cleanUrl}"`,
      
      // Attempt 2: Android client with cleaned URL (most successful)
      `yt-dlp -x --audio-format mp3 --audio-quality 0 --extractor-args "youtube:player_client=android" --no-warnings --ignore-errors -o "${outputTemplate}" "${cleanUrl}"`,
      
      // Attempt 3: iOS client 
      `yt-dlp -x --audio-format mp3 --audio-quality 0 --extractor-args "youtube:player_client=ios" --no-warnings --ignore-errors -o "${outputTemplate}" "${cleanUrl}"`,
      
      // Attempt 4: TV client (often works when others fail)
      `yt-dlp -x --audio-format mp3 --audio-quality 0 --extractor-args "youtube:player_client=tv" --no-warnings --ignore-errors -o "${outputTemplate}" "${cleanUrl}"`,
      
      // Attempt 5: Media connect client
      `yt-dlp -x --audio-format mp3 --audio-quality 0 --extractor-args "youtube:player_client=mediaconnect" --no-warnings --ignore-errors -o "${outputTemplate}" "${cleanUrl}"`,
      
      // Attempt 6: Age-gate bypass with embedding 
      `yt-dlp -x --audio-format mp3 --audio-quality 0 --extractor-args "youtube:player_client=android" --age-limit 99 --no-warnings --ignore-errors -o "${outputTemplate}" "${cleanUrl}"`,
      
      // Attempt 7: Force generic extractor
      `yt-dlp -x --audio-format mp3 --audio-quality 0 --force-generic-extractor --no-warnings --ignore-errors -o "${outputTemplate}" "${cleanUrl}"`,
      
      // Attempt 8: Last resort with maximum bypasses
      `yt-dlp -x --audio-format mp3 --audio-quality 0 --extractor-args "youtube:player_client=android" --user-agent "Mozilla/5.0 (Linux; Android 11; SM-G973F) AppleWebKit/537.36" --add-header "Accept-Language:en-US,en;q=0.9" --sleep-interval 3 --max-sleep-interval 8 --no-warnings --ignore-errors -o "${outputTemplate}" "${cleanUrl}"`
    ];
    
    for (let i = 0; i < attempts.length; i++) {
      const command = attempts[i];
      console.log(`Attempt ${i + 1}: ${command}`);
      
      try {
        const result = await new Promise<{success: boolean, stdout?: string, stderr?: string}>((resolve) => {
          exec(command, { timeout: 120000 }, (error, stdout, stderr) => {
            if (error) {
              resolve({success: false, stderr});
            } else {
              resolve({success: true, stdout});
            }
          });
        });
        
        if (result.success) {
          console.log(`Success on attempt ${i + 1}`);
          console.log('yt-dlp output:', result.stdout);
          
          // Find the downloaded file
          const files = fs.readdirSync(this.uploadsDir);
          const downloadedFile = files.find(file => 
            file.startsWith(filename.replace('.%(ext)s', '')) && 
            file.endsWith('.mp3')
          );
          
          if (downloadedFile) {
            const localPath = path.join(this.uploadsDir, downloadedFile);
            console.log(`File downloaded to: ${localPath}`);
            return { localPath, filename: downloadedFile };
          }
        } else {
          console.log(`Attempt ${i + 1} failed:`, result.stderr);
        }
      } catch (attemptError) {
        console.log(`Attempt ${i + 1} error:`, attemptError);
      }
    }
    
    // All Node.js yt-dlp attempts failed, try Python as fallback
    console.log("All Node.js attempts failed, trying Python downloader...");
    try {
      return await this.downloadWithPython(url, sessionId);
    } catch (pythonError) {
      console.log("Python downloader also failed:", pythonError);
      throw new Error("YouTube is currently blocking downloads due to bot detection. Try again later or use a different video URL. Some videos may be restricted.");
    }
  }

  private async downloadWithPython(url: string, sessionId?: string): Promise<{localPath: string, filename: string}> {
    console.log("Trying Python downloader for:", url);
    
    if (sessionId) {
      progressEmitter.emit(sessionId, {
        type: 'status',
        message: 'Trying advanced Python downloader...',
        progress: 60,
        stage: 'downloading'
      });
    }

    return new Promise((resolve, reject) => {
      const pythonScript = path.join(__dirname, 'python_downloader.py');
      const command = `python3 "${pythonScript}" "${url}" "${this.uploadsDir}"`;
      
      console.log("Python command:", command);
      
      exec(command, { timeout: 180000 }, (error, stdout, stderr) => {
        if (error) {
          console.log("Python script error:", error);
          console.log("Python stderr:", stderr);
          reject(new Error(`Python downloader failed: ${error.message}`));
          return;
        }

        try {
          const result = JSON.parse(stdout);
          console.log("Python result:", result);
          
          if (result.success) {
            const localPath = path.join(this.uploadsDir, result.filename);
            console.log(`Python download successful: ${localPath}`);
            
            if (sessionId) {
              progressEmitter.emit(sessionId, {
                type: 'status',
                message: `Downloaded via ${result.strategy}`,
                progress: 70,
                stage: 'processing'
              });
            }
            
            resolve({ localPath, filename: result.filename });
          } else {
            reject(new Error(result.error || 'Python download failed'));
          }
        } catch (parseError) {
          console.log("Failed to parse Python output:", stdout);
          reject(new Error('Failed to parse Python downloader response'));
        }
      });
    });
  }

  private async downloadDirectFile(url: string, sessionId?: string): Promise<{localPath: string, filename: string}> {
    const response = await axios({
      method: 'GET',
      url: url,
      responseType: 'arraybuffer',
      timeout: 60000,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    });

    const fileExtension = this.getFileExtension(url, response.headers['content-type']);
    const filename = `${randomUUID()}${fileExtension}`;
    const localPath = path.join(this.uploadsDir, filename);

    await writeFile(localPath, Buffer.from(response.data));
    console.log(`Direct file saved to: ${localPath}`);
    
    if (sessionId) {
      progressEmitter.emit(sessionId, {
        type: 'status',
        message: 'File downloaded successfully',
        progress: 70,
        stage: 'processing'
      });
    }
    
    return { localPath, filename };
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