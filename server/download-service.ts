import axios from "axios";
import fs from "fs";
import path from "path";
import { promisify } from "util";
import { exec, spawn } from "child_process";
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
  thumbnail?: string;
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
      return urlObj.hostname.includes('spotify.com') || url.includes('spotify:');
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
      
      if (sessionId) {
        progressEmitter.emit(sessionId, {
          type: 'status',
          message: 'Analyzing URL...',
          progress: 10,
          stage: 'analyzing'
        });
      }
      
      let localPath: string;
      let filename: string;
      
      // Handle Spotify URLs with spotDL
      if (this.isSpotifyUrl(url)) {
        if (sessionId) {
          progressEmitter.emit(sessionId, {
            type: 'status',
            message: 'Processing Spotify URL...',
            progress: 15,
            stage: 'analyzing'
          });
        }
        const result = await this.downloadFromSpotify(url, sessionId);
        localPath = result.localPath;
        filename = result.filename;
        
        // Use spotDL metadata
        if (result.metadata) {
          if (sessionId) {
            progressEmitter.emit(sessionId, {
              type: 'status',
              message: 'Using Spotify metadata...',
              progress: 80,
              stage: 'metadata'
            });
          }
          
          return {
            ...result.metadata,
            filename,
            localPath,
            thumbnail: result.thumbnail
          };
        }
      }
      
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
        
        // Use yt-dlp metadata if available (more accurate for YouTube videos)
        if (result.metadata) {
          if (sessionId) {
            progressEmitter.emit(sessionId, {
              type: 'status',
              message: 'Using extracted video metadata...',
              progress: 80,
              stage: 'metadata'
            });
          }
          
          const ytMetadata = result.metadata;
          // Use original metadata as-is without parsing
          const title = ytMetadata.title || 'Unknown';
          const artist = ytMetadata.uploader || ytMetadata.channel || 'Unknown Artist';
          
          const metadata = {
            duration: Math.round(ytMetadata.duration || 0),
            title,
            artist,
            album: undefined
          };
          
          return {
            ...metadata,
            filename,
            localPath,
            thumbnail: result.thumbnail
          };
        }
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

      // Extract metadata (fallback method)
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

  private async downloadFromStreamingPlatform(url: string, sessionId?: string): Promise<{localPath: string, filename: string, metadata?: any, thumbnail?: string}> {
    const filename = `${randomUUID()}.%(ext)s`;
    const outputTemplate = path.join(this.uploadsDir, filename);
    
    // Clean URL (remove playlist parameters that might cause issues)
    const cleanUrl = url.split('&list=')[0].split('&start_radio=')[0];
    
    // Try multiple approaches to bypass YouTube restrictions
    const attempts = [
      // Attempt 1: Basic with cleaned URL and metadata extraction
      `yt-dlp -x --audio-format mp3 --audio-quality 0 -f "bestaudio" --print-json --no-warnings --ignore-errors -o "${outputTemplate}" "${cleanUrl}"`,
      
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
      
      // Update progress for each attempt
      if (sessionId) {
        progressEmitter.emit(sessionId, {
          type: 'status',
          message: `Trying download method ${i + 1}/${attempts.length}...`,
          progress: 25 + (i * 5), // Progress from 25% to 65%
          stage: 'downloading'
        });
      }
      
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
          
          // Try to extract metadata from yt-dlp JSON output
          let extractedMetadata = null;
          if (result.stdout && i === 0) { // Only attempt 1 has --print-json
            try {
              // yt-dlp prints JSON first, then regular output
              const lines = result.stdout.split('\n');
              const jsonLine = lines.find(line => line.trim().startsWith('{'));
              if (jsonLine) {
                extractedMetadata = JSON.parse(jsonLine.trim());
              }
            } catch (e) {
              // Failed to parse yt-dlp JSON output
            }
          }
          
          // Find the downloaded file
          const files = fs.readdirSync(this.uploadsDir);
          const downloadedFile = files.find(file => 
            file.startsWith(filename.replace('.%(ext)s', '')) && 
            file.endsWith('.mp3')
          );
          
          if (downloadedFile) {
            const localPath = path.join(this.uploadsDir, downloadedFile);
            
            // Show download completion
            if (sessionId) {
              progressEmitter.emit(sessionId, {
                type: 'status',
                message: 'Download completed, processing...',
                progress: 70,
                stage: 'processing'
              });
            }
            
            // Download thumbnail separately using yt-dlp
            let thumbnailFilename = undefined;
            if (extractedMetadata) {
              try {
                thumbnailFilename = await this.downloadThumbnailWithYtDlp(cleanUrl, filename.replace('.%(ext)s', ''));
              } catch (thumbError) {
                // Thumbnail download failed
              }
            }
            
            return { localPath, filename: downloadedFile, metadata: extractedMetadata, thumbnail: thumbnailFilename };
          }
        }
      } catch (attemptError) {
        // Attempt failed, continue to next strategy
      }
    }
    
    // All Node.js yt-dlp attempts failed, try Python as fallback
    try {
      return await this.downloadWithPython(url, sessionId);
    } catch (pythonError) {
      throw new Error("YouTube is currently blocking downloads due to bot detection. Try again later or use a different video URL. Some videos may be restricted.");
    }
  }

  private async downloadWithPython(url: string, sessionId?: string): Promise<{localPath: string, filename: string, metadata?: any, thumbnail?: string}> {
    
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
      const child = spawn('python3', [pythonScript, url, this.uploadsDir]);
      
      let stdout = '';
      let stderr = '';
      
      child.stdout.on('data', (data: Buffer) => {
        const output = data.toString();
        stdout += output;
        
        // Parse progress updates
        const lines = output.split('\n');
        for (const line of lines) {
          if (line.startsWith('PROGRESS:')) {
            const progressMatch = line.match(/PROGRESS:(\d+(?:\.\d+)?)/);
            if (progressMatch && sessionId) {
              // Map Python progress (0-100%) to download stage (60-90%)
              const pythonProgress = parseFloat(progressMatch[1]);
              const progress = Math.min(90, 60 + (pythonProgress * 0.3));
              progressEmitter.emit(sessionId, {
                type: 'status',
                message: 'Downloading...',
                progress: Math.round(progress),
                stage: 'downloading'
              });
            }
          } else if (line.includes('Downloading thumbnail')) {
            if (sessionId) {
              progressEmitter.emit(sessionId, {
                type: 'status',
                message: 'Downloading thumbnail...',
                progress: 85,
                stage: 'processing'
              });
            }
          }
        }
      });
      
      child.stderr.on('data', (data: Buffer) => {
        stderr += data.toString();
      });
      
      child.on('close', (code: number) => {
        if (code !== 0) {
          reject(new Error(`Python downloader failed with exit code ${code}`));
          return;
        }

        try {
          // Extract the last JSON line from stdout (the final result)
          const lines = stdout.trim().split('\n');
          const jsonLine = lines.find(line => {
            try {
              JSON.parse(line);
              return true;
            } catch {
              return false;
            }
          });
          
          if (!jsonLine) {
            reject(new Error('No valid JSON result from Python downloader'));
            return;
          }
          
          const result = JSON.parse(jsonLine);
          
          if (result.success) {
            const localPath = path.join(this.uploadsDir, result.filename);
            
            if (sessionId) {
              progressEmitter.emit(sessionId, {
                type: 'status',
                message: `Downloaded via ${result.strategy}`,
                progress: 95,
                stage: 'processing'
              });
            }
            
            resolve({ 
              localPath, 
              filename: result.filename,
              thumbnail: result.thumbnail,
              metadata: {
                title: result.title,
                uploader: result.artist,
                duration: result.duration
              }
            });
          } else {
            reject(new Error(result.error || 'Python download failed'));
          }
        } catch (parseError) {
          reject(new Error('Failed to parse Python downloader response'));
        }
      });
      
      // Add timeout
      setTimeout(() => {
        child.kill();
        reject(new Error('Python downloader timeout'));
      }, 180000);
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

  private async downloadThumbnailWithYtDlp(url: string, fileId: string): Promise<string | undefined> {
    return new Promise((resolve) => {
      const thumbnailPath = path.join(this.uploadsDir, `${fileId}_thumbnail.%(ext)s`);
      const command = `yt-dlp --write-thumbnail --skip-download --convert-thumbnails jpg -o "${thumbnailPath}" "${url}"`;
      
      
      exec(command, { timeout: 30000 }, (error, stdout, stderr) => {
        if (error) {
          resolve(undefined);
          return;
        }
        
        try {
          // Find the downloaded thumbnail file
          const files = fs.readdirSync(this.uploadsDir);
          const thumbnailFile = files.find(file => 
            file.startsWith(`${fileId}_thumbnail`) && 
            (file.endsWith('.jpg') || file.endsWith('.jpeg') || file.endsWith('.png') || file.endsWith('.webp'))
          );
          
          if (thumbnailFile) {
            resolve(thumbnailFile);
          } else {
            resolve(undefined);
          }
        } catch (readError) {
          resolve(undefined);
        }
      });
    });
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

  private async downloadFromSpotify(url: string, sessionId?: string): Promise<{localPath: string, filename: string, metadata?: any, thumbnail?: string}> {
    
    if (sessionId) {
      progressEmitter.emit(sessionId, {
        type: 'status',
        message: 'Finding song on YouTube via spotDL...',
        progress: 30,
        stage: 'downloading'
      });
    }

    return new Promise((resolve, reject) => {
      const fileId = randomUUID();
      // Let spotDL use its default naming, we'll find the file afterwards
      const outputDir = this.uploadsDir;
      
      
      // Record files before download to identify new ones
      const filesBefore = new Set(fs.readdirSync(this.uploadsDir));
      
      const child = spawn('python3', ['-m', 'spotdl', url, '--output', outputDir, '--format', 'mp3', '--bitrate', '320k', '--print-errors', '--overwrite', 'force']);
      
      let stdout = '';
      let stderr = '';
      
      let youtubeUrl: string | undefined;
      
      child.stdout.on('data', (data: Buffer) => {
        const output = data.toString();
        stdout += output;
        
        // Extract YouTube URL from spotDL output for thumbnail download
        const urlMatch = output.match(/https:\/\/(?:music\.)?youtube\.com\/watch\?v=[A-Za-z0-9_-]+/);
        if (urlMatch) {
          youtubeUrl = urlMatch[0];
        }
        
        // Parse progress updates from spotDL output
        if (output.includes('Downloaded') && sessionId) {
          progressEmitter.emit(sessionId, {
            type: 'status',
            message: 'Downloaded from YouTube',
            progress: 70,
            stage: 'processing'
          });
        } else if (output.includes('Searching') && sessionId) {
          progressEmitter.emit(sessionId, {
            type: 'status',
            message: 'Searching for song on YouTube...',
            progress: 40,
            stage: 'downloading'
          });
        } else if (output.includes('Found') && sessionId) {
          progressEmitter.emit(sessionId, {
            type: 'status',
            message: 'Found matching song, downloading...',
            progress: 50,
            stage: 'downloading'
          });
        }
      });
      
      child.stderr.on('data', (data: Buffer) => {
        const output = data.toString();
        stderr += output;
      });
      
      child.on('close', (code: number) => {
        
        if (code !== 0) {
          reject(new Error(`spotDL failed with exit code ${code}: ${stderr}`));
          return;
        }

        try {
          // Find the newly downloaded file by comparing before/after
          const filesAfter = fs.readdirSync(this.uploadsDir);
          const newFiles = filesAfter.filter(file => !filesBefore.has(file));
          
          // Look for new audio files
          const newAudioFiles = newFiles.filter(file => 
            file.endsWith('.mp3') || file.endsWith('.m4a') || file.endsWith('.flac')
          );
          
          if (newAudioFiles.length === 0) {
            // Fallback: find most recently modified audio file
            const allAudioFiles = filesAfter.filter(file => 
              file.endsWith('.mp3') || file.endsWith('.m4a') || file.endsWith('.flac')
            );
            
            if (allAudioFiles.length === 0) {
              reject(new Error('No audio file found after spotDL download'));
              return;
            }
            
            // Get the most recently modified audio file
            let mostRecentFile = allAudioFiles[0];
            let mostRecentTime = 0;
            
            for (const file of allAudioFiles) {
              const filePath = path.join(this.uploadsDir, file);
              const stats = fs.statSync(filePath);
              if (stats.mtimeMs > mostRecentTime) {
                mostRecentTime = stats.mtimeMs;
                mostRecentFile = file;
              }
            }
            
            newAudioFiles.push(mostRecentFile);
          }
          
          const downloadedFile = newAudioFiles[0];
          
          const localPath = path.join(this.uploadsDir, downloadedFile);
          
          // Download thumbnail from YouTube if we found the URL (async operation)
          const downloadThumbnail = async (): Promise<string | undefined> => {
            if (!youtubeUrl) return undefined;
            
            if (sessionId) {
              progressEmitter.emit(sessionId, {
                type: 'status',
                message: 'Downloading thumbnail...',
                progress: 75,
                stage: 'processing'
              });
            }
            
            try {
              const thumb = await this.downloadThumbnailWithYtDlp(youtubeUrl, fileId);
              return thumb;
            } catch (thumbError) {
              return undefined;
            }
          };
          
          // Try to extract metadata and download thumbnail
          Promise.all([
            this.extractMetadata(localPath),
            downloadThumbnail()
          ])
            .then(([metadata, thumbnailFilename]) => {
              if (sessionId) {
                progressEmitter.emit(sessionId, {
                  type: 'status',
                  message: 'Processing metadata...',
                  progress: 85,
                  stage: 'metadata'
                });
              }
              
              resolve({ 
                localPath, 
                filename: downloadedFile,
                thumbnail: thumbnailFilename,
                metadata: {
                  title: metadata.title,
                  artist: metadata.artist,
                  album: metadata.album,
                  duration: metadata.duration
                }
              });
            })
            .catch(async (error) => {
              // Still try to get thumbnail even if metadata fails
              let thumbnailFilename: string | undefined;
              try {
                thumbnailFilename = await downloadThumbnail();
              } catch {
                thumbnailFilename = undefined;
              }
              
              // Fallback with basic info
              resolve({ 
                localPath, 
                filename: downloadedFile,
                thumbnail: thumbnailFilename,
                metadata: {
                  title: downloadedFile.replace(/\.[^/.]+$/, ''), // Remove extension
                  artist: 'Unknown Artist',
                  duration: 0
                }
              });
            });
        } catch (error) {
          reject(new Error('Failed to process spotDL download'));
        }
      });
      
      // Add timeout
      setTimeout(() => {
        child.kill();
        reject(new Error('spotDL download timeout'));
      }, 180000); // 3 minutes timeout
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