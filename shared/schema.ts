import { sql } from "drizzle-orm";
import { pgTable, text, varchar, integer, boolean, timestamp, date, decimal, pgEnum, json } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Enums
export const userRoleEnum = pgEnum('user_role', ['user', 'artist', 'admin']);
export const userStatusEnum = pgEnum('user_status', ['active', 'banned', 'pending']);
export const deviceTypeEnum = pgEnum('device_type', ['mobile', 'desktop', 'tablet', 'web', 'tv']);
export const subscriptionStatusEnum = pgEnum('subscription_status', ['active', 'expired', 'cancelled']);
export const paymentStatusEnum = pgEnum('payment_status', ['success', 'failed', 'pending']);
export const licenseTypeEnum = pgEnum('license_type', ['exclusive', 'non-exclusive', 'royalty-free']);
export const reportTargetEnum = pgEnum('report_target', ['song', 'comment', 'user']);
export const reportStatusEnum = pgEnum('report_status', ['pending', 'reviewed', 'action_taken']);

// Legacy tracks table for backward compatibility (keeping original structure)
export const tracks = pgTable("tracks", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  title: text("title").notNull(),
  artist: text("artist").notNull(),
  category: text("category").notNull(),
  duration: integer("duration").notNull(), // in seconds
  url: text("url").notNull(), // file path or external URL
  artwork: text("artwork"), // artwork URL or path
  isFavorite: boolean("is_favorite").default(false),
  uploadType: text("upload_type").notNull(), // 'file' or 'url'
  createdAt: timestamp("created_at").default(sql`CURRENT_TIMESTAMP`),
});

// ========================
// USERS & AUTHENTICATION  
// ========================

export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  username: varchar("username", { length: 50 }).notNull().unique(),
  email: varchar("email", { length: 100 }).notNull().unique(),
  password: varchar("password_hash", { length: 255 }).notNull(),
  role: userRoleEnum("role").default('user'),
  status: userStatusEnum("status").default('active'),
  profilePic: varchar("profile_pic", { length: 255 }).default('default.png'),
  bio: text("bio"),
  createdAt: timestamp("created_at").default(sql`CURRENT_TIMESTAMP`),
});

export const authTokens = pgTable("auth_tokens", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull(),
  accessToken: varchar("access_token", { length: 255 }).notNull().unique(),
  refreshToken: varchar("refresh_token", { length: 255 }).notNull().unique(),
  expiresAt: timestamp("expires_at").notNull(),
  device: varchar("device", { length: 100 }),
  ipAddress: varchar("ip_address", { length: 45 }),
  createdAt: timestamp("created_at").default(sql`CURRENT_TIMESTAMP`),
});

export const devices = pgTable("devices", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull(),
  deviceName: varchar("device_name", { length: 100 }),
  deviceType: deviceTypeEnum("device_type"),
  lastLogin: timestamp("last_login").default(sql`CURRENT_TIMESTAMP`),
});

// ========================
// MUSIC LIBRARY
// ========================

export const artists = pgTable("artists", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: varchar("name", { length: 150 }).notNull(),
  bio: text("bio"),
  profilePic: varchar("profile_pic", { length: 255 }),
  createdAt: timestamp("created_at").default(sql`CURRENT_TIMESTAMP`),
});

export const albums = pgTable("albums", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  title: varchar("title", { length: 150 }).notNull(),
  artistId: varchar("artist_id").notNull(),
  releaseDate: date("release_date"),
  coverArt: varchar("cover_art", { length: 255 }),
  createdAt: timestamp("created_at").default(sql`CURRENT_TIMESTAMP`),
});

export const genres = pgTable("genres", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: varchar("name", { length: 100 }).notNull().unique(),
  description: text("description"),
  icon: varchar("icon", { length: 50 }).default("Music"), // Lucide icon name
  color: varchar("color", { length: 7 }).default("#8B5CF6"), // Hex color code
  isActive: boolean("is_active").default(true),
  displayOrder: integer("display_order").default(0),
  createdAt: timestamp("created_at").default(sql`CURRENT_TIMESTAMP`),
  updatedAt: timestamp("updated_at").default(sql`CURRENT_TIMESTAMP`),
});

export const songs = pgTable("songs", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  title: varchar("title", { length: 150 }).notNull(),
  albumId: varchar("album_id"),
  genreId: varchar("genre_id"),
  duration: integer("duration").notNull(),
  filePath: varchar("file_path", { length: 255 }).notNull(),
  coverArt: varchar("cover_art", { length: 255 }),
  lyrics: text("lyrics"),
  releaseDate: date("release_date"),
  uploadedBy: varchar("uploaded_by"),
  playCount: integer("play_count").default(0),
  createdAt: timestamp("created_at").default(sql`CURRENT_TIMESTAMP`),
});

export const songArtists = pgTable("song_artists", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  songId: varchar("song_id").notNull(),
  artistId: varchar("artist_id").notNull(),
});

// ========================
// PLAYLISTS & FAVORITES
// ========================

export const playlists = pgTable("playlists", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull(),
  name: varchar("name", { length: 150 }).notNull(),
  description: text("description"),
  isPublic: boolean("is_public").default(true),
  createdAt: timestamp("created_at").default(sql`CURRENT_TIMESTAMP`),
});

export const playlistSongs = pgTable("playlist_songs", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  playlistId: varchar("playlist_id").notNull(),
  songId: varchar("song_id").notNull(),
  addedAt: timestamp("added_at").default(sql`CURRENT_TIMESTAMP`),
});

export const favorites = pgTable("favorites", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull(),
  songId: varchar("song_id").notNull(),
  createdAt: timestamp("created_at").default(sql`CURRENT_TIMESTAMP`),
});

// ========================
// SOCIAL FEATURES
// ========================

export const follows = pgTable("follows", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  followerId: varchar("follower_id").notNull(),
  followingId: varchar("following_id").notNull(),
  createdAt: timestamp("created_at").default(sql`CURRENT_TIMESTAMP`),
});

export const comments = pgTable("comments", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull(),
  songId: varchar("song_id").notNull(),
  comment: text("comment").notNull(),
  createdAt: timestamp("created_at").default(sql`CURRENT_TIMESTAMP`),
});

export const ratings = pgTable("ratings", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull(),
  songId: varchar("song_id").notNull(),
  rating: integer("rating").notNull(), // 1-5
  createdAt: timestamp("created_at").default(sql`CURRENT_TIMESTAMP`),
});

// ========================
// SUBSCRIPTIONS & PAYMENTS
// ========================

export const subscriptionPlans = pgTable("subscription_plans", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: varchar("name", { length: 100 }).notNull(),
  price: decimal("price", { precision: 10, scale: 2 }).notNull(),
  durationDays: integer("duration_days").notNull(),
  features: json("features"),
  createdAt: timestamp("created_at").default(sql`CURRENT_TIMESTAMP`),
});

export const userSubscriptions = pgTable("user_subscriptions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull(),
  planId: varchar("plan_id").notNull(),
  startDate: timestamp("start_date").notNull(),
  endDate: timestamp("end_date").notNull(),
  status: subscriptionStatusEnum("status").default('active'),
});

export const transactions = pgTable("transactions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull(),
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
  paymentMethod: varchar("payment_method", { length: 50 }),
  status: paymentStatusEnum("status").default('pending'),
  createdAt: timestamp("created_at").default(sql`CURRENT_TIMESTAMP`),
});

// ========================
// ANALYTICS & HISTORY
// ========================

export const listeningHistory = pgTable("listening_history", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull(),
  songId: varchar("song_id").notNull(),
  device: varchar("device", { length: 100 }),
  ipAddress: varchar("ip_address", { length: 45 }),
  playedAt: timestamp("played_at").default(sql`CURRENT_TIMESTAMP`),
});

export const searchLogs = pgTable("search_logs", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull(),
  query: varchar("query", { length: 255 }).notNull(),
  searchedAt: timestamp("searched_at").default(sql`CURRENT_TIMESTAMP`),
});

export const recommendations = pgTable("recommendations", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull(),
  songId: varchar("song_id").notNull(),
  score: decimal("score", { precision: 5, scale: 2 }).notNull(),
  createdAt: timestamp("created_at").default(sql`CURRENT_TIMESTAMP`),
});

// ========================
// SCHEMA DEFINITIONS
// ========================

// Legacy Track Schema (backward compatibility)
export const insertTrackSchema = createInsertSchema(tracks).omit({
  id: true,
});

// User Schemas
export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  email: true,
  password: true,
  role: true,
});

// Artist Schemas
export const insertArtistSchema = createInsertSchema(artists).omit({
  id: true,
  createdAt: true,
});

// Album Schemas  
export const insertAlbumSchema = createInsertSchema(albums).omit({
  id: true,
  createdAt: true,
});

// Genre Schemas
export const insertGenreSchema = createInsertSchema(genres).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

// Song Schemas
export const insertSongSchema = createInsertSchema(songs).omit({
  id: true,
  playCount: true,
  createdAt: true,
});

// Playlist Schemas
export const insertPlaylistSchema = createInsertSchema(playlists).omit({
  id: true,
  createdAt: true,
});

// Social Schemas
export const insertCommentSchema = createInsertSchema(comments).omit({
  id: true,
  createdAt: true,
});

export const insertRatingSchema = createInsertSchema(ratings).omit({
  id: true,
  createdAt: true,
});

// ========================
// TYPE EXPORTS
// ========================

export type InsertTrack = z.infer<typeof insertTrackSchema>;
export type Track = typeof tracks.$inferSelect;

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

export type InsertArtist = z.infer<typeof insertArtistSchema>;
export type Artist = typeof artists.$inferSelect;

export type InsertAlbum = z.infer<typeof insertAlbumSchema>;
export type Album = typeof albums.$inferSelect;

export type InsertGenre = z.infer<typeof insertGenreSchema>;
export type Genre = typeof genres.$inferSelect;

export type InsertSong = z.infer<typeof insertSongSchema>;
export type Song = typeof songs.$inferSelect;

export type InsertPlaylist = z.infer<typeof insertPlaylistSchema>;
export type Playlist = typeof playlists.$inferSelect;

export type InsertComment = z.infer<typeof insertCommentSchema>;
export type Comment = typeof comments.$inferSelect;

export type InsertRating = z.infer<typeof insertRatingSchema>;
export type Rating = typeof ratings.$inferSelect;

export type PlaylistSong = typeof playlistSongs.$inferSelect;
export type Favorite = typeof favorites.$inferSelect;
export type Follow = typeof follows.$inferSelect;
export type ListeningHistory = typeof listeningHistory.$inferSelect;
export type SearchLog = typeof searchLogs.$inferSelect;
export type Recommendation = typeof recommendations.$inferSelect;
