import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertTrackSchema } from "@shared/schema";
import multer from "multer";
import path from "path";

// Configure multer for file uploads
const upload = multer({
  dest: 'uploads/',
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB limit
  },
  fileFilter: (req, file, cb) => {
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

  // Upload track via URL
  app.post("/api/tracks/upload-url", async (req, res) => {
    try {
      const { url, title, artist, category } = req.body;
      
      if (!url || !title || !artist || !category) {
        res.status(400).json({ message: "URL, title, artist, and category are required" });
        return;
      }

      // Estimate duration (would normally extract from actual audio file)
      const estimatedDuration = Math.floor(Math.random() * 300) + 120; // 2-7 minutes

      const trackData = {
        title,
        artist,
        category,
        duration: estimatedDuration,
        url,
        artwork: `https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=300`,
        isFavorite: false,
        uploadType: "url" as const
      };

      const validatedData = insertTrackSchema.parse(trackData);
      const track = await storage.createTrack(validatedData);
      
      res.status(201).json(track);
    } catch (error) {
      if (error instanceof Error) {
        res.status(400).json({ message: error.message });
      } else {
        res.status(500).json({ message: "Failed to upload track via URL" });
      }
    }
  });

  // Upload track via file
  app.post("/api/tracks/upload-file", upload.single('audio'), async (req, res) => {
    try {
      if (!req.file) {
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
        url: `/uploads/${req.file.filename}`,
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

  // Delete track
  app.delete("/api/tracks/:id", async (req, res) => {
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
