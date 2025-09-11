import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertTrackSchema, insertArtistSchema, insertAlbumSchema, insertSongSchema, insertPlaylistSchema, insertCommentSchema, insertRatingSchema, insertGenreSchema } from "@shared/schema";
import { db } from "./db";
import { songs, albums, artists, users, genres } from "@shared/schema";
import { sql, desc } from "drizzle-orm";
import { downloadService } from "./download-service";
import { progressEmitter } from "./progress-emitter";
import { setupPhoneAuth, authenticateToken } from "./phoneAuth";
import { requireAdmin, type AuthRequest } from "./auth";
import { streamingService } from "./streaming-service";
import { searchService } from "./search-service";
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
  // Setup phone authentication routes
  setupPhoneAuth(app);

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
  // Legacy tracks endpoint removed - use /api/songs instead

  // Legacy tracks by category endpoint removed

  // Legacy tracks search endpoint removed

  // Upload song via URL (Admin only)  
  app.post("/api/songs/upload-url", authenticateToken, requireAdmin, async (req: AuthRequest, res) => {
    const sessionId = randomUUID();
    
    try {
      const { url, title, artist, category } = req.body;
      
      if (!url) {
        res.status(400).json({ message: "URL is required" });
        return;
      }

      
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
            message: 'Creating song record...',
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

          const songData = {
            title: title || metadata.title || "Unknown Title",
            duration: metadata.duration,
            filePath: `/uploads/${metadata.filename}`, // Updated field name for songs table
            coverArt: metadata.thumbnail ? `/uploads/${metadata.thumbnail}` : `https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=300`,
          };

          const validatedData = insertSongSchema.parse(songData);
          const song = await storage.createSong(validatedData);
          
          
          progressEmitter.emitComplete(sessionId, `Successfully added "${song.title}"`);
        } catch (error) {
          console.error("URL upload error:", error);
          const errorMessage = error instanceof Error ? error.message : "Failed to upload song via URL";
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

  // Upload song via file (Admin only)
  app.post("/api/songs/upload-file", authenticateToken, requireAdmin, upload.single('audio'), async (req: AuthRequest, res) => {
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

      const songData = {
        title,
        duration: estimatedDuration,
        filePath: `/uploads/${multerReq.file.filename}`, // Updated field name for songs table
        coverArt: `https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=300`,
      };

      const validatedData = insertSongSchema.parse(songData);
      const song = await storage.createSong(validatedData);
      
      res.status(201).json(song);
    } catch (error) {
      if (error instanceof Error) {
        res.status(400).json({ message: error.message });
      } else {
        res.status(500).json({ message: "Failed to upload song file" });
      }
    }
  });

  // Toggle favorite
  app.patch("/api/songs/:id/favorite", async (req, res) => {
    try {
      const { id } = req.params;
      const song = await storage.toggleFavorite(id);
      
      if (!song) {
        res.status(404).json({ message: "Song not found" });
        return;
      }
      
      res.json(song);
    } catch (error) {
      res.status(500).json({ message: "Failed to toggle favorite" });
    }
  });

  // Delete song (Admin only)
  app.delete("/api/songs/:id", authenticateToken, requireAdmin, async (req: AuthRequest, res) => {
    try {
      const { id } = req.params;
      const deleted = await storage.deleteSong(id);
      
      if (!deleted) {
        res.status(404).json({ message: "Song not found" });
        return;
      }
      
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: "Failed to delete song" });
    }
  });

  // ========================
  // ARTIST ROUTES
  // ========================

  app.get("/api/artists", async (req, res) => {
    try {
      const artists = await storage.getAllArtists();
      res.json(artists);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch artists" });
    }
  });

  app.get("/api/artists/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const artist = await storage.getArtist(id);
      
      if (!artist) {
        res.status(404).json({ message: "Artist not found" });
        return;
      }
      
      res.json(artist);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch artist" });
    }
  });

  app.post("/api/artists", authenticateToken, requireAdmin, async (req: AuthRequest, res) => {
    try {
      const validatedData = insertArtistSchema.parse(req.body);
      const artist = await storage.createArtist(validatedData);
      res.status(201).json(artist);
    } catch (error) {
      if (error instanceof Error) {
        res.status(400).json({ message: error.message });
      } else {
        res.status(500).json({ message: "Failed to create artist" });
      }
    }
  });

  app.put("/api/artists/:id", authenticateToken, requireAdmin, async (req: AuthRequest, res) => {
    try {
      const { id } = req.params;
      const artist = await storage.updateArtist(id, req.body);
      
      if (!artist) {
        res.status(404).json({ message: "Artist not found" });
        return;
      }
      
      res.json(artist);
    } catch (error) {
      res.status(500).json({ message: "Failed to update artist" });
    }
  });

  app.delete("/api/artists/:id", authenticateToken, requireAdmin, async (req: AuthRequest, res) => {
    try {
      const { id } = req.params;
      const deleted = await storage.deleteArtist(id);
      
      if (!deleted) {
        res.status(404).json({ message: "Artist not found" });
        return;
      }
      
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: "Failed to delete artist" });
    }
  });

  app.get("/api/artists/search", async (req, res) => {
    try {
      const { q } = req.query;
      if (!q || typeof q !== 'string') {
        res.status(400).json({ message: "Search query is required" });
        return;
      }
      const artists = await storage.searchArtists(q);
      res.json(artists);
    } catch (error) {
      res.status(500).json({ message: "Failed to search artists" });
    }
  });

  // ========================
  // ALBUM ROUTES
  // ========================

  app.get("/api/albums", async (req, res) => {
    try {
      const albums = await storage.getAllAlbums();
      res.json(albums);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch albums" });
    }
  });

  app.get("/api/albums/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const album = await storage.getAlbum(id);
      
      if (!album) {
        res.status(404).json({ message: "Album not found" });
        return;
      }
      
      res.json(album);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch album" });
    }
  });

  app.get("/api/albums/artist/:artistId", async (req, res) => {
    try {
      const { artistId } = req.params;
      const albums = await storage.getAlbumsByArtist(artistId);
      res.json(albums);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch albums by artist" });
    }
  });

  app.post("/api/albums", authenticateToken, requireAdmin, async (req: AuthRequest, res) => {
    try {
      const validatedData = insertAlbumSchema.parse(req.body);
      const album = await storage.createAlbum(validatedData);
      res.status(201).json(album);
    } catch (error) {
      if (error instanceof Error) {
        res.status(400).json({ message: error.message });
      } else {
        res.status(500).json({ message: "Failed to create album" });
      }
    }
  });

  app.put("/api/albums/:id", authenticateToken, requireAdmin, async (req: AuthRequest, res) => {
    try {
      const { id } = req.params;
      const album = await storage.updateAlbum(id, req.body);
      
      if (!album) {
        res.status(404).json({ message: "Album not found" });
        return;
      }
      
      res.json(album);
    } catch (error) {
      res.status(500).json({ message: "Failed to update album" });
    }
  });

  app.delete("/api/albums/:id", authenticateToken, requireAdmin, async (req: AuthRequest, res) => {
    try {
      const { id } = req.params;
      const deleted = await storage.deleteAlbum(id);
      
      if (!deleted) {
        res.status(404).json({ message: "Album not found" });
        return;
      }
      
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: "Failed to delete album" });
    }
  });

  // ========================
  // SONG ROUTES
  // ========================

  app.get("/api/songs", async (req, res) => {
    try {
      const tracks = await storage.getAllTracks();
      res.json(tracks);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch songs" });
    }
  });

  // Enhanced endpoints for admin dashboard
  app.get("/api/admin/songs", authenticateToken, requireAdmin, async (req: AuthRequest, res) => {
    try {
      const songs = await storage.getAllSongsWithDetails();
      res.json(songs);
    } catch (error) {
      console.error("Admin songs error:", error);
      res.status(500).json({ message: "Failed to fetch songs with details" });
    }
  });

  app.get("/api/admin/albums", authenticateToken, requireAdmin, async (req: AuthRequest, res) => {
    try {
      const albums = await storage.getAllAlbumsWithDetails();
      res.json(albums);
    } catch (error) {
      console.error("Admin albums error:", error);
      res.status(500).json({ message: "Failed to fetch albums with details" });
    }
  });

  app.get("/api/admin/artists", authenticateToken, requireAdmin, async (req: AuthRequest, res) => {
    try {
      const artists = await storage.getAllArtistsWithDetails();
      res.json(artists);
    } catch (error) {
      console.error("Admin artists error:", error);
      res.status(500).json({ message: "Failed to fetch artists with details" });
    }
  });

  app.get("/api/songs/search", async (req, res) => {
    try {
      const { q } = req.query;
      if (!q || typeof q !== 'string') {
        res.status(400).json({ message: "Search query is required" });
        return;
      }
      const songs = await storage.searchTracks(q);
      res.json(songs);
    } catch (error) {
      res.status(500).json({ message: "Failed to search songs" });
    }
  });

  app.get("/api/songs/suggestions", async (req, res) => {
    try {
      const { q } = req.query;
      if (!q || typeof q !== 'string') {
        res.status(400).json({ message: "Search query is required" });
        return;
      }
      const suggestions = await storage.getSongSuggestions(q);
      res.json(suggestions);
    } catch (error) {
      res.status(500).json({ message: "Failed to get suggestions" });
    }
  });

  app.get("/api/songs/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const song = await storage.getSong(id);
      
      if (!song) {
        res.status(404).json({ message: "Song not found" });
        return;
      }
      
      res.json(song);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch song" });
    }
  });

  app.get("/api/songs/artist/:artistId", async (req, res) => {
    try {
      const { artistId } = req.params;
      const songs = await storage.getSongsByArtist(artistId);
      res.json(songs);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch songs by artist" });
    }
  });

  app.get("/api/songs/album/:albumId", async (req, res) => {
    try {
      const { albumId } = req.params;
      const songs = await storage.getSongsByAlbum(albumId);
      res.json(songs);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch songs by album" });
    }
  });

  app.get("/api/songs/genre/:genreId", async (req, res) => {
    try {
      const { genreId } = req.params;
      const songs = await storage.getSongsByGenre(genreId);
      res.json(songs);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch songs by genre" });
    }
  });

  app.post("/api/songs", authenticateToken, requireAdmin, async (req: AuthRequest, res) => {
    try {
      const validatedData = insertSongSchema.parse(req.body);
      const song = await storage.createSong(validatedData);
      res.status(201).json(song);
    } catch (error) {
      if (error instanceof Error) {
        res.status(400).json({ message: error.message });
      } else {
        res.status(500).json({ message: "Failed to create song" });
      }
    }
  });

  app.put("/api/songs/:id", authenticateToken, requireAdmin, async (req: AuthRequest, res) => {
    try {
      const { id } = req.params;
      const { artistIds, genreIds, albumIds, ...songData } = req.body;
      
      console.log('Updating song with data:', songData);
      console.log('artistIds:', artistIds, 'genreIds:', genreIds, 'albumIds:', albumIds);
      
      // Update the song data (remove old genreId and albumId from songData)
      const { genreId, albumId, ...cleanSongData } = songData;
      const song = await storage.updateSong(id, cleanSongData);
      
      if (!song) {
        res.status(404).json({ message: "Song not found" });
        return;
      }
      
      // Update relationship tables
      if (artistIds && Array.isArray(artistIds)) {
        console.log('Updating song-artist relationships for song', id, 'with artists:', artistIds);
        await storage.updateSongArtists(id, artistIds);
      }
      
      if (genreIds && Array.isArray(genreIds)) {
        console.log('Updating song-genre relationships for song', id, 'with genres:', genreIds);
        await storage.updateSongGenres(id, genreIds);
      }
      
      if (albumIds && Array.isArray(albumIds)) {
        console.log('Updating song-album relationships for song', id, 'with albums:', albumIds);
        await storage.updateSongAlbums(id, albumIds);
      }
      
      res.json(song);
    } catch (error) {
      console.error("Failed to update song:", error);
      res.status(500).json({ message: "Failed to update song" });
    }
  });

  app.delete("/api/songs/:id", authenticateToken, requireAdmin, async (req: AuthRequest, res) => {
    try {
      const { id } = req.params;
      const deleted = await storage.deleteSong(id);
      
      if (!deleted) {
        res.status(404).json({ message: "Song not found" });
        return;
      }
      
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: "Failed to delete song" });
    }
  });

  app.post("/api/songs/:id/play", authenticateToken, async (req: AuthRequest, res) => {
    try {
      const { id } = req.params;
      const userId = req.user!.id;
      
      // Log listening history and increment play count
      await storage.logListening(userId, id);
      
      res.status(200).json({ message: "Play logged successfully" });
    } catch (error) {
      res.status(500).json({ message: "Failed to log play" });
    }
  });

  // ========================
  // GENRE ROUTES
  // ========================

  app.get("/api/genres", async (req, res) => {
    try {
      const genres = await storage.getAllGenres();
      res.json(genres);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch genres" });
    }
  });

  // ========================
  // UNIFIED SEARCH ROUTES
  // ========================

  app.get("/api/search", async (req, res) => {
    try {
      const { q, limit = "50", offset = "0" } = req.query;
      
      if (!q || typeof q !== 'string') {
        res.status(400).json({ message: "Search query is required" });
        return;
      }

      const searchLimit = parseInt(limit as string) || 50;
      const searchOffset = parseInt(offset as string) || 0;
      
      const results = await searchService.search(q, {}, searchLimit, searchOffset);
      res.json(results);
    } catch (error) {
      console.error("Search error:", error);
      res.status(500).json({ message: "Search failed" });
    }
  });

  // ========================
  // PLAYLIST ROUTES
  // ========================

  app.get("/api/playlists/user/:userId", async (req, res) => {
    try {
      const { userId } = req.params;
      const playlists = await storage.getPlaylistsByUser(userId);
      res.json(playlists);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch user playlists" });
    }
  });

  app.get("/api/playlists/public", async (req, res) => {
    try {
      const playlists = await storage.getPublicPlaylists();
      res.json(playlists);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch public playlists" });
    }
  });

  app.get("/api/playlists/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const playlist = await storage.getPlaylist(id);
      
      if (!playlist) {
        res.status(404).json({ message: "Playlist not found" });
        return;
      }
      
      res.json(playlist);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch playlist" });
    }
  });

  app.get("/api/playlists/:id/songs", async (req, res) => {
    try {
      const { id } = req.params;
      const songs = await storage.getPlaylistSongs(id);
      res.json(songs);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch playlist songs" });
    }
  });

  app.post("/api/playlists", authenticateToken, async (req: AuthRequest, res) => {
    try {
      const playlistData = { ...req.body, userId: req.user!.id };
      const validatedData = insertPlaylistSchema.parse(playlistData);
      const playlist = await storage.createPlaylist(validatedData);
      res.status(201).json(playlist);
    } catch (error) {
      if (error instanceof Error) {
        res.status(400).json({ message: error.message });
      } else {
        res.status(500).json({ message: "Failed to create playlist" });
      }
    }
  });

  app.put("/api/playlists/:id", authenticateToken, async (req: AuthRequest, res) => {
    try {
      const { id } = req.params;
      const playlist = await storage.updatePlaylist(id, req.body);
      
      if (!playlist) {
        res.status(404).json({ message: "Playlist not found" });
        return;
      }
      
      res.json(playlist);
    } catch (error) {
      res.status(500).json({ message: "Failed to update playlist" });
    }
  });

  app.delete("/api/playlists/:id", authenticateToken, async (req: AuthRequest, res) => {
    try {
      const { id } = req.params;
      const deleted = await storage.deletePlaylist(id);
      
      if (!deleted) {
        res.status(404).json({ message: "Playlist not found" });
        return;
      }
      
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: "Failed to delete playlist" });
    }
  });

  app.post("/api/playlists/:id/songs", authenticateToken, async (req: AuthRequest, res) => {
    try {
      const { id } = req.params;
      const { songId } = req.body;
      
      if (!songId) {
        res.status(400).json({ message: "Song ID is required" });
        return;
      }
      
      await storage.addSongToPlaylist(id, songId);
      res.status(201).json({ message: "Song added to playlist" });
    } catch (error) {
      res.status(500).json({ message: "Failed to add song to playlist" });
    }
  });

  app.delete("/api/playlists/:id/songs/:songId", authenticateToken, async (req: AuthRequest, res) => {
    try {
      const { id, songId } = req.params;
      const removed = await storage.removeSongFromPlaylist(id, songId);
      
      if (!removed) {
        res.status(404).json({ message: "Song not found in playlist" });
        return;
      }
      
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: "Failed to remove song from playlist" });
    }
  });

  // ========================
  // FAVORITES ROUTES
  // ========================

  app.get("/api/favorites/:userId", async (req, res) => {
    try {
      const { userId } = req.params;
      const favorites = await storage.getUserFavorites(userId);
      res.json(favorites);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch favorites" });
    }
  });

  app.post("/api/favorites", authenticateToken, async (req: AuthRequest, res) => {
    try {
      const { songId } = req.body;
      const userId = req.user!.id;
      
      if (!songId) {
        res.status(400).json({ message: "Song ID is required" });
        return;
      }
      
      await storage.addToFavorites(userId, songId);
      res.status(201).json({ message: "Song added to favorites" });
    } catch (error) {
      res.status(500).json({ message: "Failed to add to favorites" });
    }
  });

  app.delete("/api/favorites/:songId", authenticateToken, async (req: AuthRequest, res) => {
    try {
      const { songId } = req.params;
      const userId = req.user!.id;
      const removed = await storage.removeFromFavorites(userId, songId);
      
      if (!removed) {
        res.status(404).json({ message: "Song not found in favorites" });
        return;
      }
      
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: "Failed to remove from favorites" });
    }
  });

  app.get("/api/favorites/:userId/:songId", async (req, res) => {
    try {
      const { userId, songId } = req.params;
      const isFavorite = await storage.isFavorite(userId, songId);
      res.json({ isFavorite });
    } catch (error) {
      res.status(500).json({ message: "Failed to check favorite status" });
    }
  });

  // ========================
  // SOCIAL ROUTES
  // ========================

  app.post("/api/follow", authenticateToken, async (req: AuthRequest, res) => {
    try {
      const { followingId } = req.body;
      const followerId = req.user!.id;
      
      if (!followingId) {
        res.status(400).json({ message: "Following user ID is required" });
        return;
      }
      
      await storage.followUser(followerId, followingId);
      res.status(201).json({ message: "User followed successfully" });
    } catch (error) {
      res.status(500).json({ message: "Failed to follow user" });
    }
  });

  app.delete("/api/follow/:followingId", authenticateToken, async (req: AuthRequest, res) => {
    try {
      const { followingId } = req.params;
      const followerId = req.user!.id;
      const unfollowed = await storage.unfollowUser(followerId, followingId);
      
      if (!unfollowed) {
        res.status(404).json({ message: "Follow relationship not found" });
        return;
      }
      
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: "Failed to unfollow user" });
    }
  });

  app.get("/api/users/:userId/followers", async (req, res) => {
    try {
      const { userId } = req.params;
      const followers = await storage.getUserFollowers(userId);
      res.json(followers);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch followers" });
    }
  });

  app.get("/api/users/:userId/following", async (req, res) => {
    try {
      const { userId } = req.params;
      const following = await storage.getUserFollowing(userId);
      res.json(following);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch following" });
    }
  });

  // ========================
  // COMMENTS & RATINGS ROUTES
  // ========================

  app.get("/api/songs/:songId/comments", async (req, res) => {
    try {
      const { songId } = req.params;
      const comments = await storage.getSongComments(songId);
      res.json(comments);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch comments" });
    }
  });

  app.post("/api/comments", authenticateToken, async (req: AuthRequest, res) => {
    try {
      const commentData = { ...req.body, userId: req.user!.id };
      const validatedData = insertCommentSchema.parse(commentData);
      const comment = await storage.addComment(validatedData);
      res.status(201).json(comment);
    } catch (error) {
      if (error instanceof Error) {
        res.status(400).json({ message: error.message });
      } else {
        res.status(500).json({ message: "Failed to add comment" });
      }
    }
  });

  app.delete("/api/comments/:id", authenticateToken, async (req: AuthRequest, res) => {
    try {
      const { id } = req.params;
      const deleted = await storage.deleteComment(id);
      
      if (!deleted) {
        res.status(404).json({ message: "Comment not found" });
        return;
      }
      
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: "Failed to delete comment" });
    }
  });

  app.get("/api/songs/:songId/rating", async (req, res) => {
    try {
      const { songId } = req.params;
      const rating = await storage.getSongRating(songId);
      res.json(rating);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch song rating" });
    }
  });

  app.post("/api/ratings", authenticateToken, async (req: AuthRequest, res) => {
    try {
      const ratingData = { ...req.body, userId: req.user!.id };
      const validatedData = insertRatingSchema.parse(ratingData);
      const rating = await storage.rateSong(validatedData);
      res.status(201).json(rating);
    } catch (error) {
      if (error instanceof Error) {
        res.status(400).json({ message: error.message });
      } else {
        res.status(500).json({ message: "Failed to add rating" });
      }
    }
  });

  // ========================
  // ANALYTICS ROUTES
  // ========================

  app.get("/api/analytics/history/:userId", authenticateToken, async (req: AuthRequest, res) => {
    try {
      const { userId } = req.params;
      const limit = parseInt(req.query.limit as string) || 50;
      const history = await storage.getUserListeningHistory(userId, limit);
      res.json(history);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch listening history" });
    }
  });

  app.get("/api/history", authenticateToken, async (req: AuthRequest, res) => {
    try {
      const userId = req.user!.id;
      const limit = parseInt(req.query.limit as string) || 50;
      const history = await storage.getUserListeningHistory(userId, limit);
      res.json(history);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch listening history" });
    }
  });

  app.get("/api/analytics/popular", async (req, res) => {
    try {
      const limit = parseInt(req.query.limit as string) || 20;
      const popular = await storage.getPopularSongs(limit);
      res.json(popular);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch popular songs" });
    }
  });

  app.get("/api/recommendations/:userId", async (req, res) => {
    try {
      const { userId } = req.params;
      const limit = parseInt(req.query.limit as string) || 10;
      const recommendations = await storage.getRecommendations(userId, limit);
      res.json(recommendations);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch recommendations" });
    }
  });

  app.post("/api/analytics/search", authenticateToken, async (req: AuthRequest, res) => {
    try {
      const { query } = req.body;
      const userId = req.user!.id;
      
      if (!query) {
        res.status(400).json({ message: "Search query is required" });
        return;
      }
      
      await storage.logSearch(userId, query);
      res.status(201).json({ message: "Search logged successfully" });
    } catch (error) {
      res.status(500).json({ message: "Failed to log search" });
    }
  });

  // ========================
  // GENRE/CATEGORY MANAGEMENT ROUTES
  // ========================

  // Get all genres
  app.get("/api/genres", async (req, res) => {
    try {
      const genres = await storage.getAllGenres();
      res.json(genres);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch genres" });
    }
  });

  // Get genre by ID
  app.get("/api/genres/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const genre = await storage.getGenre(id);
      if (!genre) {
        return res.status(404).json({ message: "Genre not found" });
      }
      res.json(genre);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch genre" });
    }
  });

  // Create new genre (Admin only)
  app.post("/api/genres", authenticateToken, requireAdmin, async (req: AuthRequest, res) => {
    try {
      console.log("Received genre creation request:", req.body);
      const genreData = insertGenreSchema.parse(req.body);
      console.log("Parsed genre data:", genreData);
      const newGenre = await storage.createGenre(genreData);
      console.log("Created genre:", newGenre);
      res.status(201).json(newGenre);
    } catch (error) {
      console.error("Genre creation error:", error);
      if (error instanceof Error && error.message.includes('validation')) {
        return res.status(400).json({ message: "Invalid genre data", error: error.message });
      }
      res.status(500).json({ message: "Failed to create genre", error: error instanceof Error ? error.message : "Unknown error" });
    }
  });

  // Update genre (Admin only)
  app.put("/api/genres/:id", authenticateToken, requireAdmin, async (req: AuthRequest, res) => {
    try {
      const { id } = req.params;
      const genreData = insertGenreSchema.parse(req.body);
      const updatedGenre = await storage.updateGenre(id, genreData);
      if (!updatedGenre) {
        return res.status(404).json({ message: "Genre not found" });
      }
      res.json(updatedGenre);
    } catch (error) {
      if (error instanceof Error && error.message.includes('validation')) {
        return res.status(400).json({ message: "Invalid genre data" });
      }
      res.status(500).json({ message: "Failed to update genre" });
    }
  });

  // Delete genre (Admin only)
  app.delete("/api/genres/:id", authenticateToken, requireAdmin, async (req: AuthRequest, res) => {
    try {
      const { id } = req.params;
      const deleted = await storage.deleteGenre(id);
      if (!deleted) {
        return res.status(404).json({ message: "Genre not found" });
      }
      res.json({ message: "Genre deleted successfully" });
    } catch (error) {
      res.status(500).json({ message: "Failed to delete genre" });
    }
  });

  // ========================
  // DASHBOARD STATS ROUTES
  // ========================

  // Get dashboard statistics
  app.get("/api/dashboard/stats", authenticateToken, requireAdmin, async (req: AuthRequest, res) => {
    try {
      // Get counts from database
      const [tracksCount] = await db.select({ count: sql<number>`count(*)` }).from(songs);
      const [albumsCount] = await db.select({ count: sql<number>`count(*)` }).from(albums);
      const [artistsCount] = await db.select({ count: sql<number>`count(*)` }).from(artists);
      const [usersCount] = await db.select({ count: sql<number>`count(*)` }).from(users);
      const [genresCount] = await db.select({ count: sql<number>`count(*)` }).from(genres);
      
      // Get total play count
      const [totalPlays] = await db.select({ 
        total: sql<number>`COALESCE(sum(${songs.playCount}), 0)` 
      }).from(songs);

      const stats = {
        totalTracks: tracksCount.count || 0,
        totalAlbums: albumsCount.count || 0,
        totalArtists: artistsCount.count || 0,
        totalUsers: usersCount.count || 0,
        totalGenres: genresCount.count || 0,
        totalPlays: totalPlays.total || 0
      };

      res.json(stats);
    } catch (error) {
      console.error("Dashboard stats error:", error);
      res.status(500).json({ message: "Failed to fetch dashboard statistics" });
    }
  });

  // Get recent activities
  app.get("/api/dashboard/recent-activity", authenticateToken, requireAdmin, async (req: AuthRequest, res) => {
    try {
      // Get recent songs
      const recentSongs = await db
        .select({
          id: songs.id,
          title: songs.title,
          createdAt: songs.createdAt,
          uploadedBy: songs.uploadedBy
        })
        .from(songs)
        .orderBy(desc(songs.createdAt))
        .limit(5);

      // Get recent users
      const recentUsers = await db
        .select({
          id: users.id,
          username: users.username,
          createdAt: users.createdAt
        })
        .from(users)
        .orderBy(desc(users.createdAt))
        .limit(3);

      const activities = [
        ...recentSongs.map((song: any) => ({
          id: song.id,
          action: "New track uploaded",
          item: song.title,
          user: song.uploadedBy || "Unknown",
          time: song.createdAt,
          type: "upload",
          status: "success"
        })),
        ...recentUsers.map((user: any) => ({
          id: user.id,
          action: "New user registered",
          item: user.username,
          user: user.username,
          time: user.createdAt,
          type: "registration",
          status: "success"
        }))
      ].sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime()).slice(0, 8);

      res.json(activities);
    } catch (error) {
      console.error("Recent activity error:", error);
      res.status(500).json({ message: "Failed to fetch recent activity" });
    }
  });

  // ================================
  // STREAMING API ENDPOINTS
  // ================================

  // Process song for streaming (Admin/Artist only)
  app.post("/api/streaming/process/:songId", authenticateToken, requireAdmin, async (req, res) => {
    try {
      const { songId } = req.params;
      
      // Get song from database
      const song = await storage.getSong(songId);
      if (!song) {
        return res.status(404).json({ error: "Song not found" });
      }

      // Process for streaming
      const streamingData = await streamingService.processAudioForStreaming(song);
      
      // Update song with streaming URLs
      await storage.updateSong(songId, {
        hlsManifestUrl: streamingData.hlsManifestUrl,
        dashManifestUrl: streamingData.dashManifestUrl,
        segmentUrls: JSON.stringify(streamingData.segmentUrls)
      });

      res.json({
        message: "Song processed for streaming",
        ...streamingData
      });
    } catch (error) {
      console.error("Streaming processing error:", error);
      res.status(500).json({ error: "Failed to process song for streaming" });
    }
  });

  // Serve HLS manifest and segments
  app.get("/api/streaming/hls/:songId/:filename", async (req, res) => {
    try {
      const { songId, filename } = req.params;
      
      const fileData = await streamingService.serveStreamingFile(songId, 'hls', filename);
      
      res.setHeader('Content-Type', fileData.contentType);
      res.setHeader('Cache-Control', 'public, max-age=3600');
      res.setHeader('Access-Control-Allow-Origin', '*');
      
      if (fileData.contentLength) {
        res.setHeader('Content-Length', fileData.contentLength);
      }
      
      fileData.stream.pipe(res);
    } catch (error) {
      console.error("HLS streaming error:", error);
      res.status(404).json({ error: "Streaming file not found" });
    }
  });

  // Serve DASH manifest and segments
  app.get("/api/streaming/dash/:songId/:filename", async (req, res) => {
    try {
      const { songId, filename } = req.params;
      
      const fileData = await streamingService.serveStreamingFile(songId, 'dash', filename);
      
      res.setHeader('Content-Type', fileData.contentType);
      res.setHeader('Cache-Control', 'public, max-age=3600');
      res.setHeader('Access-Control-Allow-Origin', '*');
      
      if (fileData.contentLength) {
        res.setHeader('Content-Length', fileData.contentLength);
      }
      
      fileData.stream.pipe(res);
    } catch (error) {
      console.error("DASH streaming error:", error);
      res.status(404).json({ error: "Streaming file not found" });
    }
  });

  // Get recommended streaming quality
  app.get("/api/streaming/quality/:songId", authenticateToken, async (req, res) => {
    try {
      const { bandwidth, deviceType } = req.query;
      const bandwidthNum = bandwidth ? parseInt(bandwidth as string) : 320000;
      const device = (deviceType as string) || 'desktop';
      
      const recommendedQuality = streamingService.getRecommendedQuality(bandwidthNum, device);
      
      res.json({
        recommendedQuality,
        availableQualities: ['aac_128', 'aac_320', 'ogg_vorbis', 'flac']
      });
    } catch (error) {
      res.status(500).json({ error: "Failed to get quality recommendation" });
    }
  });

  // Track streaming analytics
  app.post("/api/streaming/analytics", authenticateToken, async (req: AuthRequest, res) => {
    try {
      const sessionData = {
        userId: req.user?.id || '',
        ...req.body
      };
      
      await streamingService.trackStreamingSession(sessionData);
      
      res.json({ message: "Analytics tracked" });
    } catch (error) {
      res.status(500).json({ error: "Failed to track analytics" });
    }
  });

  // Streaming cleanup (Admin only)
  app.post("/api/streaming/cleanup", authenticateToken, requireAdmin, async (req, res) => {
    try {
      const { maxAgeHours = 24 } = req.body;
      await streamingService.cleanupOldFiles(maxAgeHours);
      
      res.json({ message: "Cleanup completed" });
    } catch (error) {
      res.status(500).json({ error: "Cleanup failed" });
    }
  });

  // ================================
  // SEARCH & RECOMMENDATIONS API
  // ================================

  // Advanced search with filters
  app.get("/api/search", async (req, res) => {
    try {
      const { q: query, genre, artist, album, limit = "50", offset = "0" } = req.query;
      
      if (!query || typeof query !== 'string') {
        return res.status(400).json({ error: "Search query is required" });
      }

      const filters = {
        genre: genre as string,
        artist: artist as string,
        album: album as string
      };

      const results = await searchService.search(
        query, 
        filters, 
        parseInt(limit as string), 
        parseInt(offset as string)
      );

      res.json(results);
    } catch (error) {
      console.error("Search error:", error);
      res.status(500).json({ error: "Search failed" });
    }
  });

  // Get music recommendations
  app.get("/api/recommendations", authenticateToken, async (req: AuthRequest, res) => {
    try {
      const { baseSongId, algorithm = "hybrid", limit = "10" } = req.query;
      const userId = req.user?.id;

      if (!userId) {
        return res.status(401).json({ error: "Authentication required" });
      }

      const recommendations = await searchService.getRecommendations({
        userId,
        baseSongId: baseSongId as string,
        algorithm: algorithm as 'collaborative' | 'content_based' | 'hybrid',
        limit: parseInt(limit as string),
        diversityBoost: 0.3
      });

      res.json(recommendations);
    } catch (error) {
      console.error("Recommendations error:", error);
      res.status(500).json({ error: "Failed to get recommendations" });
    }
  });

  // Get search analytics (Admin only)
  app.get("/api/search/analytics", authenticateToken, requireAdmin, async (req, res) => {
    try {
      const analytics = searchService.getSearchAnalytics();
      res.json(analytics);
    } catch (error) {
      res.status(500).json({ error: "Failed to get search analytics" });
    }
  });

  // Get trending songs
  app.get("/api/trending", async (req, res) => {
    try {
      const { limit = "20" } = req.query;
      
      // For now, return most played songs from recent period
      const allSongs = await storage.getAllSongs();
      const trending = allSongs
        .sort((a, b) => (b.playCount || 0) - (a.playCount || 0))
        .slice(0, parseInt(limit as string));

      res.json(trending);
    } catch (error) {
      res.status(500).json({ error: "Failed to get trending songs" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
