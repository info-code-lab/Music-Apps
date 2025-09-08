import ffmpeg from "fluent-ffmpeg";
import fs from "fs/promises";
import path from "path";
import { createWriteStream, createReadStream } from "fs";
import { randomUUID } from "crypto";
import type { Song, StreamingSession } from "@shared/schema";

interface StreamingQuality {
  name: string;
  bitrate: string;
  resolution?: string;
  format: 'aac' | 'ogg' | 'flac';
}

const STREAMING_QUALITIES: StreamingQuality[] = [
  { name: 'aac_128', bitrate: '128k', format: 'aac' },
  { name: 'aac_320', bitrate: '320k', format: 'aac' },
  { name: 'ogg_vorbis', bitrate: '192k', format: 'ogg' },
  { name: 'flac', bitrate: '1411k', format: 'flac' }
];

export class StreamingService {
  private outputDir: string;
  private segmentDuration: number;

  constructor() {
    this.outputDir = path.join(process.cwd(), 'streaming');
    this.segmentDuration = 10; // 10 second segments
    this.ensureOutputDir();
  }

  private async ensureOutputDir() {
    try {
      await fs.mkdir(this.outputDir, { recursive: true });
      await fs.mkdir(path.join(this.outputDir, 'hls'), { recursive: true });
      await fs.mkdir(path.join(this.outputDir, 'dash'), { recursive: true });
    } catch (error) {
      console.error('Failed to create streaming directories:', error);
    }
  }

  // Convert audio file to multiple qualities and generate HLS/DASH manifests
  async processAudioForStreaming(song: Song): Promise<{
    hlsManifestUrl: string;
    dashManifestUrl: string;
    segmentUrls: string[];
  }> {
    const songId = song.id;
    const inputPath = song.filePath;
    
    if (!await this.fileExists(inputPath)) {
      throw new Error(`Input file not found: ${inputPath}`);
    }

    // Create output directories for this song
    const hlsDir = path.join(this.outputDir, 'hls', songId);
    const dashDir = path.join(this.outputDir, 'dash', songId);
    
    await fs.mkdir(hlsDir, { recursive: true });
    await fs.mkdir(dashDir, { recursive: true });

    // Process multiple qualities
    const qualityPromises = STREAMING_QUALITIES.map(quality => 
      this.generateQualityVariant(inputPath, hlsDir, quality)
    );

    await Promise.all(qualityPromises);

    // Generate master manifests
    const hlsManifestUrl = await this.generateHLSMasterManifest(songId, hlsDir);
    const dashManifestUrl = await this.generateDASHManifest(songId, dashDir);
    const segmentUrls = await this.getSegmentUrls(songId);

    return {
      hlsManifestUrl,
      dashManifestUrl,
      segmentUrls
    };
  }

  private async generateQualityVariant(
    inputPath: string, 
    outputDir: string, 
    quality: StreamingQuality
  ): Promise<void> {
    return new Promise((resolve, reject) => {
      const outputPath = path.join(outputDir, `${quality.name}.m3u8`);
      const segmentPath = path.join(outputDir, `${quality.name}_%03d.ts`);

      let ffmpegCommand = ffmpeg(inputPath)
        .audioCodec('aac')
        .audioBitrate(quality.bitrate)
        .audioChannels(2)
        .audioFrequency(44100)
        .format('hls')
        .addOption('-hls_time', this.segmentDuration.toString())
        .addOption('-hls_playlist_type', 'vod')
        .addOption('-hls_segment_filename', segmentPath)
        .output(outputPath);

      // Special handling for different formats
      if (quality.format === 'flac') {
        ffmpegCommand = ffmpegCommand
          .audioCodec('flac')
          .audioBitrate('1411k');
      } else if (quality.format === 'ogg') {
        ffmpegCommand = ffmpegCommand
          .audioCodec('libvorbis')
          .audioBitrate(quality.bitrate);
      }

      ffmpegCommand
        .on('start', (commandLine) => {
          console.log(`Processing ${quality.name}: ${commandLine}`);
        })
        .on('progress', (progress) => {
          console.log(`${quality.name} progress: ${progress.percent?.toFixed(2)}%`);
        })
        .on('end', () => {
          console.log(`${quality.name} processing completed`);
          resolve();
        })
        .on('error', (err) => {
          console.error(`${quality.name} processing failed:`, err);
          reject(err);
        })
        .run();
    });
  }

  private async generateHLSMasterManifest(songId: string, hlsDir: string): Promise<string> {
    const masterManifest = [
      '#EXTM3U',
      '#EXT-X-VERSION:3',
      ''
    ];

    // Add each quality variant to master manifest
    for (const quality of STREAMING_QUALITIES) {
      const bitrateNum = parseInt(quality.bitrate.replace('k', '')) * 1000;
      masterManifest.push(
        `#EXT-X-STREAM-INF:BANDWIDTH=${bitrateNum},CODECS="${this.getCodec(quality.format)}"`,
        `${quality.name}.m3u8`,
        ''
      );
    }

    const manifestPath = path.join(hlsDir, 'master.m3u8');
    await fs.writeFile(manifestPath, masterManifest.join('\n'));
    
    return `/api/streaming/hls/${songId}/master.m3u8`;
  }

  private async generateDASHManifest(songId: string, dashDir: string): Promise<string> {
    // DASH manifest generation (simplified)
    const dashManifest = `<?xml version="1.0" encoding="UTF-8"?>
<MPD xmlns="urn:mpeg:dash:schema:mpd:2011" type="static" mediaPresentationDuration="PT0H0M0S">
  <Period>
    <AdaptationSet mimeType="audio/mp4" codecs="mp4a.40.2">
      ${STREAMING_QUALITIES.map(quality => `
      <Representation id="${quality.name}" bandwidth="${parseInt(quality.bitrate.replace('k', '')) * 1000}">
        <BaseURL>${quality.name}/</BaseURL>
        <SegmentTemplate media="segment_$Number$.m4s" initialization="init.mp4" startNumber="1"/>
      </Representation>`).join('')}
    </AdaptationSet>
  </Period>
</MPD>`;

    const manifestPath = path.join(dashDir, 'manifest.mpd');
    await fs.writeFile(manifestPath, dashManifest);
    
    return `/api/streaming/dash/${songId}/manifest.mpd`;
  }

  private async getSegmentUrls(songId: string): Promise<string[]> {
    const hlsDir = path.join(this.outputDir, 'hls', songId);
    const segmentUrls: string[] = [];

    try {
      const files = await fs.readdir(hlsDir);
      const segmentFiles = files.filter(file => file.endsWith('.ts'));
      
      for (const file of segmentFiles) {
        segmentUrls.push(`/api/streaming/hls/${songId}/${file}`);
      }
    } catch (error) {
      console.error('Failed to read segment files:', error);
    }

    return segmentUrls;
  }

  private getCodec(format: string): string {
    switch (format) {
      case 'aac': return 'mp4a.40.2';
      case 'ogg': return 'vorbis';
      case 'flac': return 'flac';
      default: return 'mp4a.40.2';
    }
  }

  private async fileExists(filePath: string): Promise<boolean> {
    try {
      await fs.access(filePath);
      return true;
    } catch {
      return false;
    }
  }

  // Serve streaming files
  async serveStreamingFile(songId: string, protocol: 'hls' | 'dash', filename: string): Promise<{
    stream: NodeJS.ReadableStream;
    contentType: string;
    contentLength?: number;
  }> {
    const filePath = path.join(this.outputDir, protocol, songId, filename);
    
    if (!await this.fileExists(filePath)) {
      throw new Error('Streaming file not found');
    }

    const stats = await fs.stat(filePath);
    const stream = createReadStream(filePath);
    
    const contentType = this.getContentType(filename);
    
    return {
      stream,
      contentType,
      contentLength: stats.size
    };
  }

  private getContentType(filename: string): string {
    const ext = path.extname(filename).toLowerCase();
    
    switch (ext) {
      case '.m3u8': return 'application/vnd.apple.mpegurl';
      case '.ts': return 'video/MP2T';
      case '.mpd': return 'application/dash+xml';
      case '.m4s': return 'video/mp4';
      case '.mp4': return 'video/mp4';
      default: return 'application/octet-stream';
    }
  }

  // Analytics and monitoring
  async trackStreamingSession(sessionData: {
    userId: string;
    songId: string;
    deviceId?: string;
    quality: string;
    bytesStreamed: number;
    secondsPlayed: number;
    bufferingEvents: number;
  }): Promise<void> {
    // This would integrate with your analytics storage
    console.log('Streaming session tracked:', sessionData);
  }

  // Adaptive bitrate logic
  getRecommendedQuality(bandwidth: number, deviceType: string): string {
    // Simple adaptive bitrate logic
    if (bandwidth < 128000) return 'aac_128';
    if (bandwidth < 320000) return 'aac_320';
    if (deviceType === 'mobile') return 'aac_320';
    return 'flac'; // High quality for desktop/wifi
  }

  // Cleanup old processed files
  async cleanupOldFiles(maxAgeHours: number = 24): Promise<void> {
    const maxAge = Date.now() - (maxAgeHours * 60 * 60 * 1000);
    
    try {
      const hlsDir = path.join(this.outputDir, 'hls');
      const dashDir = path.join(this.outputDir, 'dash');
      
      await this.cleanupDirectory(hlsDir, maxAge);
      await this.cleanupDirectory(dashDir, maxAge);
    } catch (error) {
      console.error('Cleanup failed:', error);
    }
  }

  private async cleanupDirectory(dirPath: string, maxAge: number): Promise<void> {
    try {
      const entries = await fs.readdir(dirPath, { withFileTypes: true });
      
      for (const entry of entries) {
        const fullPath = path.join(dirPath, entry.name);
        
        if (entry.isDirectory()) {
          await this.cleanupDirectory(fullPath, maxAge);
          
          // Remove empty directories
          const remaining = await fs.readdir(fullPath);
          if (remaining.length === 0) {
            await fs.rmdir(fullPath);
          }
        } else {
          const stats = await fs.stat(fullPath);
          if (stats.mtime.getTime() < maxAge) {
            await fs.unlink(fullPath);
          }
        }
      }
    } catch (error) {
      console.error(`Failed to cleanup directory ${dirPath}:`, error);
    }
  }
}

export const streamingService = new StreamingService();