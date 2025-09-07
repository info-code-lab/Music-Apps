import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertTrackSchema, insertArtistSchema, insertAlbumSchema, insertSongSchema, insertPlaylistSchema, insertCommentSchema, insertRatingSchema } from "@shared/schema";
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
            duration: metadata.duration,
            filePath: `/uploads/${metadata.filename}`, // Updated field name for songs table
            coverArt: metadata.thumbnail ? `/uploads/${metadata.thumbnail}` : `https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=300`,
          };

          const validatedData = insertTrackSchema.parse(trackData);
          const track = await storage.createTrack(validatedData);
          
          console.log(`Successfully created track: ${track.title}`);
          
          progressEmitter.emitComplete(sessionId, `Successfully added "${track.title}"`);
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
        duration: estimatedDuration,
        filePath: `/uploads/${multerReq.file.filename}`, // Updated field name for songs table
        coverArt: `https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=300`,
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
      const songs = await storage.getAllSongs();
      res.json(songs);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch songs" });
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
      const song = await storage.updateSong(id, req.body);
      
      if (!song) {
        res.status(404).json({ message: "Song not found" });
        return;
      }
      
      res.json(song);
    } catch (error) {
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

  app.get("/api/songs/search", async (req, res) => {
    try {
      const { q } = req.query;
      if (!q || typeof q !== 'string') {
        res.status(400).json({ message: "Search query is required" });
        return;
      }
      const songs = await storage.searchSongs(q);
      res.json(songs);
    } catch (error) {
      res.status(500).json({ message: "Failed to search songs" });
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

  const httpServer = createServer(app);
  return httpServer;
}
