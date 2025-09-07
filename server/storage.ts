import { 
  users, tracks, artists, albums, songs, genres, playlists, playlistSongs, songArtists,
  favorites, follows, comments, ratings, listeningHistory, searchLogs, recommendations,
  type User, type InsertUser, type Track, type InsertTrack, type Artist, type InsertArtist,
  type Album, type InsertAlbum, type Song, type InsertSong, type Playlist, type InsertPlaylist,
  type Comment, type InsertComment, type Rating, type InsertRating
} from "@shared/schema";
import { db } from "./db";
import { eq, sql, ilike, or, desc, and, inArray } from "drizzle-orm";

export interface IStorage {
  // User operations
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: string, updates: Partial<User>): Promise<User | undefined>;
  
  // Legacy Track operations (backward compatibility)
  getAllTracks(): Promise<Track[]>;
  getTrack(id: string): Promise<Track | undefined>;
  createTrack(track: InsertTrack): Promise<Track>;
  updateTrack(id: string, updates: Partial<Track>): Promise<Track | undefined>;
  deleteTrack(id: string): Promise<boolean>;
  searchTracks(query: string): Promise<Track[]>;
  getTracksByCategory(category: string): Promise<Track[]>;
  toggleFavorite(id: string): Promise<Track | undefined>;

  // Artist operations
  getAllArtists(): Promise<Artist[]>;
  getArtist(id: string): Promise<Artist | undefined>;
  createArtist(artist: InsertArtist): Promise<Artist>;
  updateArtist(id: string, updates: Partial<Artist>): Promise<Artist | undefined>;
  deleteArtist(id: string): Promise<boolean>;
  searchArtists(query: string): Promise<Artist[]>;

  // Album operations
  getAllAlbums(): Promise<Album[]>;
  getAlbum(id: string): Promise<Album | undefined>;
  getAlbumsByArtist(artistId: string): Promise<Album[]>;
  createAlbum(album: InsertAlbum): Promise<Album>;
  updateAlbum(id: string, updates: Partial<Album>): Promise<Album | undefined>;
  deleteAlbum(id: string): Promise<boolean>;

  // Song operations
  getAllSongs(): Promise<Song[]>;
  getSong(id: string): Promise<Song | undefined>;
  getSongsByArtist(artistId: string): Promise<Song[]>;
  getSongsByAlbum(albumId: string): Promise<Song[]>;
  getSongsByGenre(genreId: string): Promise<Song[]>;
  createSong(song: InsertSong): Promise<Song>;
  updateSong(id: string, updates: Partial<Song>): Promise<Song | undefined>;
  deleteSong(id: string): Promise<boolean>;
  searchSongs(query: string): Promise<Song[]>;
  incrementPlayCount(songId: string): Promise<void>;

  // Genre operations
  getAllGenres(): Promise<{ id: string; name: string }[]>;
  getGenre(id: string): Promise<{ id: string; name: string } | undefined>;

  // Playlist operations
  getPlaylistsByUser(userId: string): Promise<Playlist[]>;
  getPublicPlaylists(): Promise<Playlist[]>;
  getPlaylist(id: string): Promise<Playlist | undefined>;
  createPlaylist(playlist: InsertPlaylist): Promise<Playlist>;
  updatePlaylist(id: string, updates: Partial<Playlist>): Promise<Playlist | undefined>;
  deletePlaylist(id: string): Promise<boolean>;
  addSongToPlaylist(playlistId: string, songId: string): Promise<void>;
  removeSongFromPlaylist(playlistId: string, songId: string): Promise<boolean>;
  getPlaylistSongs(playlistId: string): Promise<Song[]>;

  // Favorites operations
  getUserFavorites(userId: string): Promise<Song[]>;
  addToFavorites(userId: string, songId: string): Promise<void>;
  removeFromFavorites(userId: string, songId: string): Promise<boolean>;
  isFavorite(userId: string, songId: string): Promise<boolean>;

  // Social operations
  followUser(followerId: string, followingId: string): Promise<void>;
  unfollowUser(followerId: string, followingId: string): Promise<boolean>;
  getUserFollowers(userId: string): Promise<User[]>;
  getUserFollowing(userId: string): Promise<User[]>;
  isFollowing(followerId: string, followingId: string): Promise<boolean>;

  // Comments operations
  getSongComments(songId: string): Promise<Comment[]>;
  addComment(comment: InsertComment): Promise<Comment>;
  deleteComment(commentId: string): Promise<boolean>;

  // Ratings operations
  getSongRating(songId: string): Promise<{ average: number; count: number }>;
  rateSong(rating: InsertRating): Promise<Rating>;
  getUserRating(userId: string, songId: string): Promise<Rating | undefined>;

  // Analytics operations
  logListening(userId: string, songId: string, device?: string, ipAddress?: string): Promise<void>;
  getUserListeningHistory(userId: string, limit?: number): Promise<Song[]>;
  getPopularSongs(limit?: number): Promise<Song[]>;
  logSearch(userId: string, query: string): Promise<void>;
  getRecommendations(userId: string, limit?: number): Promise<Song[]>;
}

export class DatabaseStorage implements IStorage {
  // ========================
  // USER OPERATIONS
  // ========================
  
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user || undefined;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user || undefined;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(insertUser)
      .returning();
    return user;
  }

  async updateUser(id: string, updates: Partial<User>): Promise<User | undefined> {
    const [user] = await db
      .update(users)
      .set(updates)
      .where(eq(users.id, id))
      .returning();
    return user || undefined;
  }

  // ========================
  // LEGACY TRACK OPERATIONS (backward compatibility)
  // ========================
  
  async getAllTracks(): Promise<Track[]> {
    return await db.select().from(tracks);
  }

  async getTrack(id: string): Promise<Track | undefined> {
    const [track] = await db.select().from(tracks).where(eq(tracks.id, id));
    return track || undefined;
  }

  async createTrack(insertTrack: InsertTrack): Promise<Track> {
    const [track] = await db
      .insert(tracks)
      .values(insertTrack)
      .returning();
    return track;
  }

  async updateTrack(id: string, updates: Partial<Track>): Promise<Track | undefined> {
    const [track] = await db
      .update(tracks)
      .set(updates)
      .where(eq(tracks.id, id))
      .returning();
    return track || undefined;
  }

  async deleteTrack(id: string): Promise<boolean> {
    const result = await db
      .delete(tracks)
      .where(eq(tracks.id, id));
    return result.rowCount !== null && result.rowCount > 0;
  }

  async searchTracks(query: string): Promise<Track[]> {
    const searchTerm = `%${query.toLowerCase()}%`;
    return await db.select().from(tracks).where(
      or(
        ilike(tracks.title, searchTerm),
        ilike(tracks.artist, searchTerm),
        ilike(tracks.category, searchTerm)
      )
    );
  }

  async getTracksByCategory(category: string): Promise<Track[]> {
    if (category === "All Categories") {
      return this.getAllTracks();
    }
    return await db.select().from(tracks).where(ilike(tracks.category, category));
  }

  async toggleFavorite(id: string): Promise<Track | undefined> {
    const [track] = await db
      .update(tracks)
      .set({ isFavorite: sql`not ${tracks.isFavorite}` })
      .where(eq(tracks.id, id))
      .returning();
    return track || undefined;
  }

  // ========================
  // ARTIST OPERATIONS
  // ========================

  async getAllArtists(): Promise<Artist[]> {
    return await db.select().from(artists).orderBy(artists.name);
  }

  async getArtist(id: string): Promise<Artist | undefined> {
    const [artist] = await db.select().from(artists).where(eq(artists.id, id));
    return artist || undefined;
  }

  async createArtist(insertArtist: InsertArtist): Promise<Artist> {
    const [artist] = await db
      .insert(artists)
      .values(insertArtist)
      .returning();
    return artist;
  }

  async updateArtist(id: string, updates: Partial<Artist>): Promise<Artist | undefined> {
    const [artist] = await db
      .update(artists)
      .set(updates)
      .where(eq(artists.id, id))
      .returning();
    return artist || undefined;
  }

  async deleteArtist(id: string): Promise<boolean> {
    const result = await db
      .delete(artists)
      .where(eq(artists.id, id));
    return result.rowCount !== null && result.rowCount > 0;
  }

  async searchArtists(query: string): Promise<Artist[]> {
    const searchTerm = `%${query.toLowerCase()}%`;
    return await db.select().from(artists).where(
      ilike(artists.name, searchTerm)
    );
  }

  // ========================
  // ALBUM OPERATIONS
  // ========================

  async getAllAlbums(): Promise<Album[]> {
    return await db.select().from(albums).orderBy(desc(albums.createdAt));
  }

  async getAlbum(id: string): Promise<Album | undefined> {
    const [album] = await db.select().from(albums).where(eq(albums.id, id));
    return album || undefined;
  }

  async getAlbumsByArtist(artistId: string): Promise<Album[]> {
    return await db.select().from(albums).where(eq(albums.artistId, artistId));
  }

  async createAlbum(insertAlbum: InsertAlbum): Promise<Album> {
    const [album] = await db
      .insert(albums)
      .values(insertAlbum)
      .returning();
    return album;
  }

  async updateAlbum(id: string, updates: Partial<Album>): Promise<Album | undefined> {
    const [album] = await db
      .update(albums)
      .set(updates)
      .where(eq(albums.id, id))
      .returning();
    return album || undefined;
  }

  async deleteAlbum(id: string): Promise<boolean> {
    const result = await db
      .delete(albums)
      .where(eq(albums.id, id));
    return result.rowCount !== null && result.rowCount > 0;
  }

  // ========================
  // SONG OPERATIONS
  // ========================

  async getAllSongs(): Promise<Song[]> {
    return await db.select().from(songs).orderBy(desc(songs.createdAt));
  }

  async getSong(id: string): Promise<Song | undefined> {
    const [song] = await db.select().from(songs).where(eq(songs.id, id));
    return song || undefined;
  }

  async getSongsByArtist(artistId: string): Promise<Song[]> {
    // Get songs through song_artists relationship
    const result = await db
      .select({ song: songs })
      .from(songs)
      .innerJoin(songArtists, eq(songs.id, songArtists.songId))
      .where(eq(songArtists.artistId, artistId));
    return result.map(r => r.song);
  }

  async getSongsByAlbum(albumId: string): Promise<Song[]> {
    return await db.select().from(songs).where(eq(songs.albumId, albumId));
  }

  async getSongsByGenre(genreId: string): Promise<Song[]> {
    return await db.select().from(songs).where(eq(songs.genreId, genreId));
  }

  async createSong(insertSong: InsertSong): Promise<Song> {
    const [song] = await db
      .insert(songs)
      .values(insertSong)
      .returning();
    return song;
  }

  async updateSong(id: string, updates: Partial<Song>): Promise<Song | undefined> {
    const [song] = await db
      .update(songs)
      .set(updates)
      .where(eq(songs.id, id))
      .returning();
    return song || undefined;
  }

  async deleteSong(id: string): Promise<boolean> {
    const result = await db
      .delete(songs)
      .where(eq(songs.id, id));
    return result.rowCount !== null && result.rowCount > 0;
  }

  async searchSongs(query: string): Promise<Song[]> {
    const searchTerm = `%${query.toLowerCase()}%`;
    return await db.select().from(songs).where(
      or(
        ilike(songs.title, searchTerm),
        ilike(songs.lyrics, searchTerm)
      )
    );
  }

  async incrementPlayCount(songId: string): Promise<void> {
    await db
      .update(songs)
      .set({ playCount: sql`${songs.playCount} + 1` })
      .where(eq(songs.id, songId));
  }

  // ========================
  // GENRE OPERATIONS
  // ========================

  async getAllGenres(): Promise<{ id: string; name: string }[]> {
    return await db.select().from(genres).orderBy(genres.name);
  }

  async getGenre(id: string): Promise<{ id: string; name: string } | undefined> {
    const [genre] = await db.select().from(genres).where(eq(genres.id, id));
    return genre || undefined;
  }

  // ========================
  // PLAYLIST OPERATIONS
  // ========================

  async getPlaylistsByUser(userId: string): Promise<Playlist[]> {
    return await db.select().from(playlists).where(eq(playlists.userId, userId));
  }

  async getPublicPlaylists(): Promise<Playlist[]> {
    return await db.select().from(playlists).where(eq(playlists.isPublic, true));
  }

  async getPlaylist(id: string): Promise<Playlist | undefined> {
    const [playlist] = await db.select().from(playlists).where(eq(playlists.id, id));
    return playlist || undefined;
  }

  async createPlaylist(insertPlaylist: InsertPlaylist): Promise<Playlist> {
    const [playlist] = await db
      .insert(playlists)
      .values(insertPlaylist)
      .returning();
    return playlist;
  }

  async updatePlaylist(id: string, updates: Partial<Playlist>): Promise<Playlist | undefined> {
    const [playlist] = await db
      .update(playlists)
      .set(updates)
      .where(eq(playlists.id, id))
      .returning();
    return playlist || undefined;
  }

  async deletePlaylist(id: string): Promise<boolean> {
    const result = await db
      .delete(playlists)
      .where(eq(playlists.id, id));
    return result.rowCount !== null && result.rowCount > 0;
  }

  async addSongToPlaylist(playlistId: string, songId: string): Promise<void> {
    await db
      .insert(playlistSongs)
      .values({ playlistId, songId });
  }

  async removeSongFromPlaylist(playlistId: string, songId: string): Promise<boolean> {
    const result = await db
      .delete(playlistSongs)
      .where(and(
        eq(playlistSongs.playlistId, playlistId),
        eq(playlistSongs.songId, songId)
      ));
    return result.rowCount !== null && result.rowCount > 0;
  }

  async getPlaylistSongs(playlistId: string): Promise<Song[]> {
    const result = await db
      .select({ song: songs })
      .from(playlistSongs)
      .innerJoin(songs, eq(playlistSongs.songId, songs.id))
      .where(eq(playlistSongs.playlistId, playlistId))
      .orderBy(playlistSongs.addedAt);
    return result.map(r => r.song);
  }

  // ========================
  // FAVORITES OPERATIONS
  // ========================

  async getUserFavorites(userId: string): Promise<Song[]> {
    const result = await db
      .select({ song: songs })
      .from(favorites)
      .innerJoin(songs, eq(favorites.songId, songs.id))
      .where(eq(favorites.userId, userId))
      .orderBy(desc(favorites.createdAt));
    return result.map(r => r.song);
  }

  async addToFavorites(userId: string, songId: string): Promise<void> {
    await db
      .insert(favorites)
      .values({ userId, songId })
      .onConflictDoNothing();
  }

  async removeFromFavorites(userId: string, songId: string): Promise<boolean> {
    const result = await db
      .delete(favorites)
      .where(and(
        eq(favorites.userId, userId),
        eq(favorites.songId, songId)
      ));
    return result.rowCount !== null && result.rowCount > 0;
  }

  async isFavorite(userId: string, songId: string): Promise<boolean> {
    const [favorite] = await db
      .select()
      .from(favorites)
      .where(and(
        eq(favorites.userId, userId),
        eq(favorites.songId, songId)
      ))
      .limit(1);
    return !!favorite;
  }

  // ========================
  // SOCIAL OPERATIONS
  // ========================

  async followUser(followerId: string, followingId: string): Promise<void> {
    await db
      .insert(follows)
      .values({ followerId, followingId })
      .onConflictDoNothing();
  }

  async unfollowUser(followerId: string, followingId: string): Promise<boolean> {
    const result = await db
      .delete(follows)
      .where(and(
        eq(follows.followerId, followerId),
        eq(follows.followingId, followingId)
      ));
    return result.rowCount !== null && result.rowCount > 0;
  }

  async getUserFollowers(userId: string): Promise<User[]> {
    const result = await db
      .select({ user: users })
      .from(follows)
      .innerJoin(users, eq(follows.followerId, users.id))
      .where(eq(follows.followingId, userId));
    return result.map(r => r.user);
  }

  async getUserFollowing(userId: string): Promise<User[]> {
    const result = await db
      .select({ user: users })
      .from(follows)
      .innerJoin(users, eq(follows.followingId, users.id))
      .where(eq(follows.followerId, userId));
    return result.map(r => r.user);
  }

  async isFollowing(followerId: string, followingId: string): Promise<boolean> {
    const [follow] = await db
      .select()
      .from(follows)
      .where(and(
        eq(follows.followerId, followerId),
        eq(follows.followingId, followingId)
      ))
      .limit(1);
    return !!follow;
  }

  // ========================
  // COMMENTS OPERATIONS
  // ========================

  async getSongComments(songId: string): Promise<Comment[]> {
    return await db
      .select()
      .from(comments)
      .where(eq(comments.songId, songId))
      .orderBy(desc(comments.createdAt));
  }

  async addComment(insertComment: InsertComment): Promise<Comment> {
    const [comment] = await db
      .insert(comments)
      .values(insertComment)
      .returning();
    return comment;
  }

  async deleteComment(commentId: string): Promise<boolean> {
    const result = await db
      .delete(comments)
      .where(eq(comments.id, commentId));
    return result.rowCount !== null && result.rowCount > 0;
  }

  // ========================
  // RATINGS OPERATIONS
  // ========================

  async getSongRating(songId: string): Promise<{ average: number; count: number }> {
    const result = await db
      .select({
        average: sql<number>`COALESCE(AVG(${ratings.rating}), 0)`,
        count: sql<number>`COUNT(${ratings.rating})`
      })
      .from(ratings)
      .where(eq(ratings.songId, songId));
    
    return {
      average: Number(result[0]?.average || 0),
      count: Number(result[0]?.count || 0)
    };
  }

  async rateSong(insertRating: InsertRating): Promise<Rating> {
    const [rating] = await db
      .insert(ratings)
      .values(insertRating)
      .onConflictDoUpdate({
        target: [ratings.userId, ratings.songId],
        set: { rating: insertRating.rating }
      })
      .returning();
    return rating;
  }

  async getUserRating(userId: string, songId: string): Promise<Rating | undefined> {
    const [rating] = await db
      .select()
      .from(ratings)
      .where(and(
        eq(ratings.userId, userId),
        eq(ratings.songId, songId)
      ));
    return rating || undefined;
  }

  // ========================
  // ANALYTICS OPERATIONS
  // ========================

  async logListening(userId: string, songId: string, device?: string, ipAddress?: string): Promise<void> {
    await db
      .insert(listeningHistory)
      .values({ userId, songId, device, ipAddress });
    
    // Also increment song play count
    await this.incrementPlayCount(songId);
  }

  async getUserListeningHistory(userId: string, limit: number = 50): Promise<Song[]> {
    const result = await db
      .select({ song: songs })
      .from(listeningHistory)
      .innerJoin(songs, eq(listeningHistory.songId, songs.id))
      .where(eq(listeningHistory.userId, userId))
      .orderBy(desc(listeningHistory.playedAt))
      .limit(limit);
    return result.map(r => r.song);
  }

  async getPopularSongs(limit: number = 20): Promise<Song[]> {
    return await db
      .select()
      .from(songs)
      .orderBy(desc(songs.playCount))
      .limit(limit);
  }

  async logSearch(userId: string, query: string): Promise<void> {
    await db
      .insert(searchLogs)
      .values({ userId, query });
  }

  async getRecommendations(userId: string, limit: number = 10): Promise<Song[]> {
    // Simple recommendation: return popular songs that user hasn't favorited
    const userFavs = await db
      .select({ songId: favorites.songId })
      .from(favorites)
      .where(eq(favorites.userId, userId));
    
    const favoriteSongIds = userFavs.map(f => f.songId);
    
    const query = db
      .select()
      .from(songs)
      .orderBy(desc(songs.playCount))
      .limit(limit);

    if (favoriteSongIds.length > 0) {
      return await query.where(sql`${songs.id} NOT IN ${inArray(songs.id, favoriteSongIds)}`);
    }
    
    return await query;
  }
}

export const storage = new DatabaseStorage();
