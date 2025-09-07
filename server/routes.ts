import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertTrackSchema } from "@shared/schema";
import { downloadService } from "./download-service";
import { progressEmitter } from "./progress-emitter";
import { login, register, getCurrentUser, authenticateToken, requireAdmin, type AuthRequest } from "./auth";
import multer from "multer";
import path from "path";
import { randomUUID } from "crypto";

// Configure multer for file uploads
const upload = multer({
  dest: 'uploads/',
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB limit
  },
  fileFilter: (req: Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
    const allowedTypes = ['.mp3', '.wav', '.flac'];
    const ext = path.extname(file.originalname).toLowerCase();
    if (allowedTypes.includes(ext)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only MP3, WAV, and FLAC files are allowed.'));
    }
  }
});

export async function registerRoutes(app: Express): Promise<Server> {
  // Authentication routes
  app.post("/api/auth/login", login);
  app.post("/api/auth/register", register);
  app.get("/api/auth/me", authenticateToken, getCurrentUser);

  // SSE endpoint for progress updates
  app.get("/api/upload-progress/:sessionId", (req, res) => {
    const { sessionId } = req.params;
    
    res.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'Cache-Control'
    });
    
    // Add connection to progress emitter
    progressEmitter.addConnection(sessionId, res);
    
    // Handle client disconnect
    req.on('close', () => {
      progressEmitter.removeConnection(sessionId);
    });
  });
  // Get all tracks
  app.get("/api/tracks", async (req, res) => {
    try {
      const tracks = await storage.getAllTracks();
      res.json(tracks);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch tracks" });
    }
  });

  // Get tracks by category
  app.get("/api/tracks/category/:category", async (req, res) => {
    try {
      const { category } = req.params;
      const tracks = await storage.getTracksByCategory(category);
      res.json(tracks);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch tracks by category" });
    }
  });

  // Search tracks
  app.get("/api/tracks/search", async (req, res) => {
    try {
      const { q } = req.query;
      if (!q || typeof q !== 'string') {
        res.status(400).json({ message: "Search query is required" });
        return;
      }
      const tracks = await storage.searchTracks(q);
      res.json(tracks);
    } catch (error) {
      res.status(500).json({ message: "Failed to search tracks" });
    }
  });

  // Upload track via URL (Admin only)
  app.post("/api/tracks/upload-url", authenticateToken, requireAdmin, async (req: AuthRequest, res) => {
    const sessionId = randomUUID();
    
    try {
      const { url, title, artist, category } = req.body;
      
      if (!url) {
        res.status(400).json({ message: "URL is required" });
        return;
      }

      console.log(`Starting URL upload for: ${url}`);
      
      // Return session ID immediately for progress tracking
      res.status(200).json({ sessionId, message: "Upload started" });
      
      // Process upload asynchronously
      setImmediate(async () => {
        try {
          progressEmitter.emit(sessionId, {
            type: 'status',
            message: 'Starting upload...',
            progress: 5,
            stage: 'starting'
          });
          
          // Download file and extract metadata
          const metadata = await downloadService.downloadAndExtractMetadata(url, sessionId);
          
          progressEmitter.emit(sessionId, {
            type: 'status',
            message: 'Creating track record...',
            progress: 90,
            stage: 'finalizing'
          });
          
          // Smart category detection based on title and artist
          const detectCategory = (title: string, artist: string): string => {
            const text = `${title} ${artist}`.toLowerCase();
            
            if (text.includes('rock') || text.includes('metal') || text.includes('punk')) return 'Rock';
            if (text.includes('jazz') || text.includes('blues') || text.includes('swing')) return 'Jazz';
            if (text.includes('classical') || text.includes('orchestra') || text.includes('symphony')) return 'Classical';
            if (text.includes('folk') || text.includes('acoustic') || text.includes('country')) return 'Folk';
            if (text.includes('rap') || text.includes('hip hop') || text.includes('hip-hop')) return 'Hip-Hop';
            
            // Default to Electronic for modern/unknown genres
            return 'Electronic';
          };

          const trackData = {
            title: title || metadata.title || "Unknown Title",
            artist: artist || metadata.artist || "Unknown Artist", 
            category: category || detectCategory(metadata.title || "", metadata.artist || ""),
            duration: metadata.duration,
            url: `/uploads/${metadata.filename}`, // Use local file path
            artwork: metadata.thumbnail ? `/uploads/${metadata.thumbnail}` : `https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=300`,
            isFavorite: false,
            uploadType: "url" as const
          };

          const validatedData = insertTrackSchema.parse(trackData);
          const track = await storage.createTrack(validatedData);
          
          console.log(`Successfully created track: ${track.title} by ${track.artist}`);
          
          progressEmitter.emitComplete(sessionId, `Successfully added "${track.title}" by ${track.artist}`);
        } catch (error) {
          console.error("URL upload error:", error);
          const errorMessage = error instanceof Error ? error.message : "Failed to upload track via URL";
          progressEmitter.emitError(sessionId, errorMessage);
        }
      });
    } catch (error) {
      console.error("URL upload setup error:", error);
      const errorMessage = error instanceof Error ? error.message : "Failed to start upload";
      progressEmitter.emitError(sessionId, errorMessage);
      res.status(500).json({ message: errorMessage });
    }
  });

  // Upload track via file (Admin only)
  app.post("/api/tracks/upload-file", authenticateToken, requireAdmin, upload.single('audio'), async (req: AuthRequest, res) => {
    try {
      const multerReq = req as Request & { file?: Express.Multer.File };
      if (!multerReq.file) {
        res.status(400).json({ message: "Audio file is required" });
        return;
      }

      const { title, artist, category } = req.body;
      
      if (!title || !artist || !category) {
        res.status(400).json({ message: "Title, artist, and category are required" });
        return;
      }

      // Estimate duration (would normally extract from actual audio file)
      const estimatedDuration = Math.floor(Math.random() * 300) + 120; // 2-7 minutes

      const trackData = {
        title,
        artist,
        category,
        duration: estimatedDuration,
        url: `/uploads/${multerReq.file.filename}`,
        fileName: multerReq.file.filename,
        artwork: `https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=300`,
        isFavorite: false,
        uploadType: "file" as const
      };

      const validatedData = insertTrackSchema.parse(trackData);
      const track = await storage.createTrack(validatedData);
      
      res.status(201).json(track);
    } catch (error) {
      if (error instanceof Error) {
        res.status(400).json({ message: error.message });
      } else {
        res.status(500).json({ message: "Failed to upload track file" });
      }
    }
  });

  // Toggle favorite
  app.patch("/api/tracks/:id/favorite", async (req, res) => {
    try {
      const { id } = req.params;
      const track = await storage.toggleFavorite(id);
      
      if (!track) {
        res.status(404).json({ message: "Track not found" });
        return;
      }
      
      res.json(track);
    } catch (error) {
      res.status(500).json({ message: "Failed to toggle favorite" });
    }
  });

  // Delete track (Admin only)
  app.delete("/api/tracks/:id", authenticateToken, requireAdmin, async (req: AuthRequest, res) => {
    try {
      const { id } = req.params;
      const deleted = await storage.deleteTrack(id);
      
      if (!deleted) {
        res.status(404).json({ message: "Track not found" });
        return;
      }
      
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: "Failed to delete track" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
