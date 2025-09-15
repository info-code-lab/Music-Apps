import { sql } from "drizzle-orm";
import { pgTable, text, varchar, integer, boolean, timestamp, date, decimal, pgEnum, json, index, unique, foreignKey } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
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
export const contentStatusEnum = pgEnum('content_status', ['draft', 'pending_review', 'approved', 'rejected', 'dmca_flagged']);
export const rightsScopeEnum = pgEnum('rights_scope', ['worldwide', 'regional', 'country_specific']);
export const royaltyTypeEnum = pgEnum('royalty_type', ['mechanical', 'performance', 'synchronization', 'streaming']);
export const qualityEnum = pgEnum('quality', ['lossy_64', 'lossy_128', 'lossy_320', 'lossless_16_44', 'lossless_24_48', 'lossless_24_96', 'master_quality']);
export const streamingFormatEnum = pgEnum('streaming_format', ['aac_128', 'aac_320', 'ogg_vorbis', 'flac', 'mp3']);
export const streamingProtocolEnum = pgEnum('streaming_protocol', ['hls', 'dash', 'progressive']);
export const songMoodEnum = pgEnum('song_mood', ['happy', 'sad', 'energetic', 'chill', 'aggressive', 'romantic', 'melancholic', 'uplifting']);
export const streamingRegionEnum = pgEnum('streaming_region', ['north_america', 'europe', 'asia_pacific', 'latin_america', 'africa', 'middle_east']);

// Legacy tracks table removed - now using songs table with enterprise features

// ========================
// USERS & AUTHENTICATION  
// ========================

// Updated users table for phone authentication
export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  phoneNumber: varchar("phone_number", { length: 20 }).unique(),
  email: varchar("email", { length: 100 }).unique(),
  firstName: varchar("first_name", { length: 50 }),
  lastName: varchar("last_name", { length: 50 }),
  profileImageUrl: varchar("profile_image_url", { length: 255 }),
  username: varchar("username", { length: 50 }).unique(),
  passwordHash: varchar("password_hash", { length: 255 }), // For admin authentication  
  role: userRoleEnum("role").default('user'),
  status: userStatusEnum("status").default('active'),
  bio: text("bio"),
  // User preferences
  preferredLanguages: json("preferred_languages"), // Array of language codes
  favoriteGenres: json("favorite_genres"), // Array of genre IDs
  onboardingCompleted: boolean("onboarding_completed").default(false),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => ({
  // Ensure users have at least one valid credential set
  credentialCheck: sql`CONSTRAINT valid_credentials CHECK (
    (phone_number IS NOT NULL) OR 
    (username IS NOT NULL AND password_hash IS NOT NULL)
  )`
}));

// OTP verification table
export const otpVerification = pgTable("otp_verification", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  phoneNumber: varchar("phone_number", { length: 20 }).notNull(),
  otp: varchar("otp", { length: 6 }).notNull(),
  expiresAt: timestamp("expires_at").notNull(),
  verified: boolean("verified").default(false),
  createdAt: timestamp("created_at").defaultNow(),
});

// User preferred artists table
export const userPreferredArtists = pgTable("user_preferred_artists", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull(),
  artistId: varchar("artist_id").notNull(),
  addedAt: timestamp("added_at").defaultNow(),
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
  // Enterprise Music Metadata
  isrc: varchar("isrc", { length: 12 }).unique(), // International Standard Recording Code
  bpm: integer("bpm"), // Beats per minute
  musicalKey: varchar("musical_key", { length: 10 }), // e.g., "C major", "A# minor"
  timeSignature: varchar("time_signature", { length: 10 }).default('4/4'),
  mood: songMoodEnum("mood"),
  energy: decimal("energy", { precision: 3, scale: 2 }), // 0.00-10.00 energy level
  danceability: decimal("danceability", { precision: 3, scale: 2 }), // 0.00-10.00
  valence: decimal("valence", { precision: 3, scale: 2 }), // 0.00-10.00 (positivity)
  acousticness: decimal("acousticness", { precision: 3, scale: 2 }), // 0.00-10.00
  instrumentalness: decimal("instrumentalness", { precision: 3, scale: 2 }), // 0.00-10.00
  liveness: decimal("liveness", { precision: 3, scale: 2 }), // 0.00-10.00
  speechiness: decimal("speechiness", { precision: 3, scale: 2 }), // 0.00-10.00
  // Content Management
  contentStatus: contentStatusEnum("content_status").default('draft'),
  contentWarnings: json("content_warnings"), // Array of content warnings
  languages: json("languages"), // Array of languages in the song
  tags: json("tags"), // Array of descriptive tags
  // Technical Metadata
  fileSize: integer("file_size"), // in bytes
  bitrate: integer("bitrate"), // in kbps
  sampleRate: integer("sample_rate"), // in Hz
  audioFormat: varchar("audio_format", { length: 10 }), // mp3, flac, wav, etc.
  audioFingerprint: text("audio_fingerprint"), // For duplicate detection
  waveformData: text("waveform_data"), // JSON array of waveform points
  // Streaming Infrastructure
  streamingFormat: streamingFormatEnum("streaming_format").default('aac_128'),
  streamingProtocol: streamingProtocolEnum("streaming_protocol").default('hls'),
  hlsManifestUrl: varchar("hls_manifest_url", { length: 500 }), // HLS .m3u8 manifest URL
  dashManifestUrl: varchar("dash_manifest_url", { length: 500 }), // DASH .mpd manifest URL
  segmentUrls: json("segment_urls"), // Array of segment URLs for HLS/DASH
  streamingQuality: qualityEnum("streaming_quality").default('lossy_128'),
  // Performance Metrics
  skipRate: decimal("skip_rate", { precision: 5, scale: 4 }).default('0.0000'), // Skip percentage
  completionRate: decimal("completion_rate", { precision: 5, scale: 4 }).default('0.0000'),
  averageRating: decimal("average_rating", { precision: 3, scale: 2 }).default('0.00'),
  totalRatings: integer("total_ratings").default(0),
  // Licensing & Rights
  copyrightOwner: varchar("copyright_owner", { length: 200 }),
  publishingRights: varchar("publishing_rights", { length: 200 }),
  masterRights: varchar("master_rights", { length: 200 }),
  isExplicit: boolean("is_explicit").default(false),
  isInstrumental: boolean("is_instrumental").default(false),
  isRemix: boolean("is_remix").default(false),
  originalSongId: varchar("original_song_id"), // If this is a remix/cover
  createdAt: timestamp("created_at").default(sql`CURRENT_TIMESTAMP`),
  updatedAt: timestamp("updated_at").default(sql`CURRENT_TIMESTAMP`),
});

export const songArtists = pgTable("song_artists", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  songId: varchar("song_id").notNull(),
  artistId: varchar("artist_id").notNull(),
});

export const songGenres = pgTable("song_genres", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  songId: varchar("song_id").notNull(),
  genreId: varchar("genre_id").notNull(),
});

export const songAlbums = pgTable("song_albums", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  songId: varchar("song_id").notNull(),
  albumId: varchar("album_id").notNull(),
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

export const playlistLikes = pgTable("playlist_likes", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull(),
  playlistId: varchar("playlist_id").notNull(),
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
// ENTERPRISE FEATURES
// ========================

// Royalty Management
export const rightHolders = pgTable("right_holders", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: varchar("name", { length: 200 }).notNull(),
  type: varchar("type", { length: 50 }).notNull(), // artist, publisher, label, distributor
  contactEmail: varchar("contact_email", { length: 150 }),
  taxId: varchar("tax_id", { length: 50 }),
  paymentDetails: json("payment_details"),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").default(sql`CURRENT_TIMESTAMP`),
});

export const songRoyalties = pgTable("song_royalties", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  songId: varchar("song_id").notNull(),
  rightHolderId: varchar("right_holder_id").notNull(),
  royaltyType: royaltyTypeEnum("royalty_type").notNull(),
  percentage: decimal("percentage", { precision: 5, scale: 2 }).notNull(),
  rightsScope: rightsScopeEnum("rights_scope").default('worldwide'),
  territories: json("territories"), // Array of country codes if regional
  startDate: date("start_date").notNull(),
  endDate: date("end_date"),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").default(sql`CURRENT_TIMESTAMP`),
});

export const royaltyPayments = pgTable("royalty_payments", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  rightHolderId: varchar("right_holder_id").notNull(),
  period: varchar("period", { length: 20 }).notNull(), // e.g., "2024-Q1"
  totalAmount: decimal("total_amount", { precision: 12, scale: 4 }).notNull(),
  currency: varchar("currency", { length: 3 }).default('USD'),
  paymentDate: date("payment_date"),
  status: paymentStatusEnum("status").default('pending'),
  paymentReference: varchar("payment_reference", { length: 100 }),
  details: json("details"), // Breakdown by song/territory/royalty type
  createdAt: timestamp("created_at").default(sql`CURRENT_TIMESTAMP`),
});

// Content Moderation & Rights Management
export const contentReports = pgTable("content_reports", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  songId: varchar("song_id").notNull(),
  reporterId: varchar("reporter_id"), // Can be null for system reports
  reportType: varchar("report_type", { length: 50 }).notNull(), // copyright, inappropriate, duplicate
  description: text("description").notNull(),
  evidence: json("evidence"), // URLs, timestamps, etc.
  status: reportStatusEnum("status").default('pending'),
  reviewerId: varchar("reviewer_id"),
  reviewNotes: text("review_notes"),
  actionTaken: varchar("action_taken", { length: 100 }),
  createdAt: timestamp("created_at").default(sql`CURRENT_TIMESTAMP`),
  reviewedAt: timestamp("reviewed_at"),
});

export const dmcaClaims = pgTable("dmca_claims", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  songId: varchar("song_id").notNull(),
  claimantName: varchar("claimant_name", { length: 200 }).notNull(),
  claimantEmail: varchar("claimant_email", { length: 150 }).notNull(),
  workDescription: text("work_description").notNull(),
  copyrightInfo: text("copyright_info").notNull(),
  swornStatement: boolean("sworn_statement").notNull(),
  status: varchar("status", { length: 50 }).default('submitted'),
  reviewNotes: text("review_notes"),
  responseRequired: boolean("response_required").default(true),
  submittedAt: timestamp("submitted_at").default(sql`CURRENT_TIMESTAMP`),
  reviewedAt: timestamp("reviewed_at"),
});

// Advanced Analytics & Business Intelligence
export const streamingAnalytics = pgTable("streaming_analytics", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  songId: varchar("song_id").notNull(),
  userId: varchar("user_id"),
  sessionId: varchar("session_id").notNull(),
  streamingRegion: streamingRegionEnum("streaming_region").notNull(),
  country: varchar("country", { length: 2 }).notNull(), // ISO country code
  device: deviceTypeEnum("device").notNull(),
  quality: qualityEnum("quality").notNull(),
  startTime: timestamp("start_time").notNull(),
  endTime: timestamp("end_time"),
  duration: integer("duration"), // How long they actually listened
  percentComplete: decimal("percent_complete", { precision: 5, scale: 2 }),
  skipPoint: integer("skip_point"), // Where they skipped (in seconds)
  volume: decimal("volume", { precision: 3, scale: 2 }), // 0.00-1.00
  isOffline: boolean("is_offline").default(false),
  networkType: varchar("network_type", { length: 20 }), // wifi, 4g, 5g, ethernet
  bufferingEvents: integer("buffering_events").default(0),
  errorEvents: integer("error_events").default(0),
  createdAt: timestamp("created_at").default(sql`CURRENT_TIMESTAMP`),
});

export const userBehaviorAnalytics = pgTable("user_behavior_analytics", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull(),
  sessionId: varchar("session_id").notNull(),
  activityType: varchar("activity_type", { length: 50 }).notNull(), // play, skip, like, share, search
  target: varchar("target", { length: 100 }), // song_id, playlist_id, artist_id, search_term
  context: json("context"), // Additional context data
  timestamp: timestamp("timestamp").default(sql`CURRENT_TIMESTAMP`),
});

export const revenueReports = pgTable("revenue_reports", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  songId: varchar("song_id").notNull(),
  period: varchar("period", { length: 20 }).notNull(), // e.g., "2024-03"
  streams: integer("streams").notNull(),
  revenue: decimal("revenue", { precision: 12, scale: 4 }).notNull(),
  royaltyPaid: decimal("royalty_paid", { precision: 12, scale: 4 }).notNull(),
  currency: varchar("currency", { length: 3 }).default('USD'),
  region: streamingRegionEnum("region"),
  createdAt: timestamp("created_at").default(sql`CURRENT_TIMESTAMP`),
});

// Content Delivery & Performance
export const cdnEndpoints = pgTable("cdn_endpoints", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  region: streamingRegionEnum("region").notNull(),
  endpoint: varchar("endpoint", { length: 255 }).notNull(),
  isActive: boolean("is_active").default(true),
  priority: integer("priority").default(0),
  maxBandwidth: integer("max_bandwidth"), // in Mbps
  createdAt: timestamp("created_at").default(sql`CURRENT_TIMESTAMP`),
});

export const songFiles = pgTable("song_files", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  songId: varchar("song_id").notNull(),
  quality: qualityEnum("quality").notNull(),
  filePath: varchar("file_path", { length: 500 }).notNull(),
  cdnUrl: varchar("cdn_url", { length: 500 }),
  fileSize: integer("file_size").notNull(),
  duration: integer("duration").notNull(),
  bitrate: integer("bitrate").notNull(),
  sampleRate: integer("sample_rate").notNull(),
  audioFormat: varchar("audio_format", { length: 10 }).notNull(),
  isProcessed: boolean("is_processed").default(false),
  processingStatus: varchar("processing_status", { length: 50 }).default('pending'),
  createdAt: timestamp("created_at").default(sql`CURRENT_TIMESTAMP`),
});

export const cacheMetrics = pgTable("cache_metrics", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  songId: varchar("song_id").notNull(),
  region: streamingRegionEnum("region").notNull(),
  cacheHitRate: decimal("cache_hit_rate", { precision: 5, scale: 4 }).notNull(),
  avgResponseTime: integer("avg_response_time").notNull(), // in milliseconds
  totalRequests: integer("total_requests").notNull(),
  date: date("date").notNull(),
  createdAt: timestamp("created_at").default(sql`CURRENT_TIMESTAMP`),
});

// Advanced User Management
export const userSubscriptionHistory = pgTable("user_subscription_history", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull(),
  subscriptionId: varchar("subscription_id").notNull(),
  action: varchar("action", { length: 50 }).notNull(), // upgrade, downgrade, cancel, renew
  fromPlan: varchar("from_plan", { length: 100 }),
  toPlan: varchar("to_plan", { length: 100 }),
  reason: varchar("reason", { length: 200 }),
  effectiveDate: timestamp("effective_date").notNull(),
  createdAt: timestamp("created_at").default(sql`CURRENT_TIMESTAMP`),
});

export const userEngagementMetrics = pgTable("user_engagement_metrics", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull(),
  date: date("date").notNull(),
  totalListeningTime: integer("total_listening_time"), // in seconds
  songsPlayed: integer("songs_played"),
  skipsCount: integer("skips_count"),
  likesCount: integer("likes_count"),
  searchesCount: integer("searches_count"),
  playlistsCreated: integer("playlists_created"),
  socialInteractions: integer("social_interactions"),
  averageSessionDuration: integer("average_session_duration"),
  peakListeningHour: integer("peak_listening_hour"), // 0-23
  topGenre: varchar("top_genre", { length: 100 }),
  churnRisk: decimal("churn_risk", { precision: 5, scale: 4 }), // 0.0000-1.0000
  createdAt: timestamp("created_at").default(sql`CURRENT_TIMESTAMP`),
});

// A/B Testing & Feature Flags
export const featureFlags = pgTable("feature_flags", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: varchar("name", { length: 100 }).notNull().unique(),
  description: text("description"),
  isEnabled: boolean("is_enabled").default(false),
  targetPercentage: decimal("target_percentage", { precision: 5, scale: 2 }).default('0.00'),
  conditions: json("conditions"), // User segments, regions, etc.
  createdBy: varchar("created_by").notNull(),
  createdAt: timestamp("created_at").default(sql`CURRENT_TIMESTAMP`),
  updatedAt: timestamp("updated_at").default(sql`CURRENT_TIMESTAMP`),
});

export const abTests = pgTable("ab_tests", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: varchar("name", { length: 100 }).notNull(),
  description: text("description"),
  variants: json("variants").notNull(), // Array of test variants
  trafficAllocation: json("traffic_allocation").notNull(), // Percentage per variant
  isActive: boolean("is_active").default(false),
  startDate: timestamp("start_date"),
  endDate: timestamp("end_date"),
  createdBy: varchar("created_by").notNull(),
  createdAt: timestamp("created_at").default(sql`CURRENT_TIMESTAMP`),
});

export const userTestAssignments = pgTable("user_test_assignments", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull(),
  testId: varchar("test_id").notNull(),
  variant: varchar("variant", { length: 50 }).notNull(),
  assignedAt: timestamp("assigned_at").default(sql`CURRENT_TIMESTAMP`),
});

// ========================
// SCHEMA DEFINITIONS
// ========================

// Legacy Track Schema (backward compatibility) - Now using songs table
export const insertTrackSchema = createInsertSchema(songs).pick({
  title: true,
  duration: true,
  filePath: true,
  coverArt: true,
  uploadedBy: true,
  albumId: true,
  genreId: true,
});

// Map legacy track fields to song fields for compatibility
export const insertTrackToSongSchema = insertTrackSchema.transform((data) => ({
  title: data.title,
  duration: data.duration,
  filePath: data.filePath,
  coverArt: data.coverArt,
  uploadedBy: data.uploadedBy,
  albumId: data.albumId,
  genreId: data.genreId,
  // Set defaults for required enterprise fields
  contentStatus: 'approved' as const,
  isExplicit: false,
  isInstrumental: false,
  isRemix: false,
}));

// User Schemas for phone authentication
// Separate schemas for different authentication methods
export const insertPhoneUserSchema = createInsertSchema(users).pick({
  phoneNumber: true, // Required for phone users
  email: true,
  firstName: true,
  lastName: true,
  profileImageUrl: true,
  bio: true,
  preferredLanguages: true,
  favoriteGenres: true,
  onboardingCompleted: true,
}).required({ phoneNumber: true });

export const insertAdminUserSchema = createInsertSchema(users).pick({
  username: true, // Required for admin users
  passwordHash: true, // Required for admin users
  email: true,
  firstName: true,
  lastName: true,
  profileImageUrl: true,
  role: true,
  bio: true,
}).required({ username: true, passwordHash: true });

// Legacy schema - kept for backward compatibility
export const insertUserSchema = createInsertSchema(users).pick({
  phoneNumber: true,
  email: true,
  firstName: true,
  lastName: true,
  profileImageUrl: true,
  username: true,
  role: true,
  bio: true,
  preferredLanguages: true,
  favoriteGenres: true,
  onboardingCompleted: true,
});

// OTP Schemas
export const insertOtpSchema = createInsertSchema(otpVerification).omit({
  id: true,
  verified: true,
  createdAt: true,
});

// Auth Token Schemas
export const insertAuthTokenSchema = createInsertSchema(authTokens).omit({
  id: true,
  createdAt: true,
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

export const insertPlaylistLikeSchema = createInsertSchema(playlistLikes).omit({
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
export type Track = typeof songs.$inferSelect; // Now using songs table

// Legacy track type for backward compatibility
export type LegacyTrack = {
  id: string;
  title: string;
  artist: string;
  category: string;
  duration: number;
  url: string;
  artwork?: string | null;
  isFavorite?: boolean;
  uploadType: string;
  createdAt?: Date;
};

// Search interfaces for unified search functionality
export interface SearchFilters {
  genre?: string;
  artist?: string;
  album?: string;
  duration?: { min?: number; max?: number };
  year?: { min?: number; max?: number };
  quality?: string[];
  mood?: string[];
  bpm?: { min?: number; max?: number };
}

export interface SearchResult {
  songs: Song[];
  artists: Artist[];
  albums: Album[];
  genres: Genre[];
  playlists: Playlist[];
  total: number;
  query: string;
  filters: SearchFilters;
  suggestions: string[];
}

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
export type UserPreferredArtist = typeof userPreferredArtists.$inferSelect;
export type OtpVerification = typeof otpVerification.$inferSelect;
export type InsertOtp = typeof otpVerification.$inferInsert;
export type AuthToken = typeof authTokens.$inferSelect;
export type InsertAuthToken = typeof authTokens.$inferInsert;

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

// ========================
// STREAMING & QUEUE MANAGEMENT
// ========================

export const playQueues = pgTable("play_queues", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull(),
  songId: varchar("song_id").notNull(),
  position: integer("position").notNull(),
  isShuffled: boolean("is_shuffled").default(false),
  repeatMode: varchar("repeat_mode", { length: 20 }).default('none'), // none, track, queue
  createdAt: timestamp("created_at").default(sql`CURRENT_TIMESTAMP`),
});

export const streamingSessions = pgTable("streaming_sessions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull(),
  songId: varchar("song_id").notNull(),
  deviceId: varchar("device_id"),
  streamingFormat: streamingFormatEnum("streaming_format"),
  qualityRequested: qualityEnum("quality_requested"),
  qualityDelivered: qualityEnum("quality_delivered"),
  bytesStreamed: integer("bytes_streamed").default(0),
  secondsPlayed: integer("seconds_played").default(0),
  bufferingEvents: integer("buffering_events").default(0),
  skipReason: varchar("skip_reason", { length: 50 }), // user_skip, network_error, etc.
  sessionStarted: timestamp("session_started").default(sql`CURRENT_TIMESTAMP`),
  sessionEnded: timestamp("session_ended"),
});

export const recommendationCache = pgTable("recommendation_cache", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull(),
  baseSongId: varchar("base_song_id").notNull(),
  recommendedSongIds: json("recommended_song_ids"), // Array of song IDs
  algorithmUsed: varchar("algorithm_used", { length: 50 }), // collaborative, content_based, hybrid
  confidenceScore: decimal("confidence_score", { precision: 3, scale: 2 }),
  expiresAt: timestamp("expires_at").notNull(),
  createdAt: timestamp("created_at").default(sql`CURRENT_TIMESTAMP`),
});

// Streaming Types
export const insertPlayQueueSchema = createInsertSchema(playQueues);
export const insertStreamingSessionSchema = createInsertSchema(streamingSessions);
export const insertRecommendationCacheSchema = createInsertSchema(recommendationCache);

export type InsertPlayQueue = z.infer<typeof insertPlayQueueSchema>;
export type PlayQueue = typeof playQueues.$inferSelect;

export type InsertStreamingSession = z.infer<typeof insertStreamingSessionSchema>;
export type StreamingSession = typeof streamingSessions.$inferSelect;

export type InsertRecommendationCache = z.infer<typeof insertRecommendationCacheSchema>;
export type RecommendationCache = typeof recommendationCache.$inferSelect;

// ========================
// RELATIONSHIPS & CONSTRAINTS
// ========================

// Users Relations
export const usersRelations = relations(users, ({ many }) => ({
  subscriptions: many(userSubscriptions),
  favorites: many(favorites),
  playlists: many(playlists),
  comments: many(comments),
  ratings: many(ratings),
  follows: many(follows, { relationName: "userFollows" }),
  followers: many(follows, { relationName: "userFollowers" }),
  listeningHistory: many(listeningHistory),
  searchLogs: many(searchLogs),
  devices: many(devices),
  authTokens: many(authTokens),
  engagementMetrics: many(userEngagementMetrics),
  testAssignments: many(userTestAssignments),
  streamingAnalytics: many(streamingAnalytics),
  behaviorAnalytics: many(userBehaviorAnalytics),
}));

// Artists Relations
export const artistsRelations = relations(artists, ({ many }) => ({
  albums: many(albums),
  songArtists: many(songArtists),
}));

// Albums Relations
export const albumsRelations = relations(albums, ({ one, many }) => ({
  artist: one(artists, {
    fields: [albums.artistId],
    references: [artists.id],
  }),
  songs: many(songs),
}));

// Songs Relations
export const songsRelations = relations(songs, ({ one, many }) => ({
  album: one(albums, {
    fields: [songs.albumId],
    references: [albums.id],
  }),
  genre: one(genres, {
    fields: [songs.genreId],
    references: [genres.id],
  }),
  uploader: one(users, {
    fields: [songs.uploadedBy],
    references: [users.id],
  }),
  originalSong: one(songs, {
    fields: [songs.originalSongId],
    references: [songs.id],
  }),
  songArtists: many(songArtists),
  playlistSongs: many(playlistSongs),
  favorites: many(favorites),
  comments: many(comments),
  ratings: many(ratings),
  listeningHistory: many(listeningHistory),
  recommendations: many(recommendations),
  royalties: many(songRoyalties),
  contentReports: many(contentReports),
  dmcaClaims: many(dmcaClaims),
  streamingAnalytics: many(streamingAnalytics),
  revenueReports: many(revenueReports),
  songFiles: many(songFiles),
  cacheMetrics: many(cacheMetrics),
}));

// Genres Relations
export const genresRelations = relations(genres, ({ many }) => ({
  songs: many(songs),
}));

// Song Artists Relations
export const songArtistsRelations = relations(songArtists, ({ one }) => ({
  song: one(songs, {
    fields: [songArtists.songId],
    references: [songs.id],
  }),
  artist: one(artists, {
    fields: [songArtists.artistId],
    references: [artists.id],
  }),
}));

// Playlists Relations
export const playlistsRelations = relations(playlists, ({ one, many }) => ({
  user: one(users, {
    fields: [playlists.userId],
    references: [users.id],
  }),
  playlistSongs: many(playlistSongs),
}));

// Playlist Songs Relations
export const playlistSongsRelations = relations(playlistSongs, ({ one }) => ({
  playlist: one(playlists, {
    fields: [playlistSongs.playlistId],
    references: [playlists.id],
  }),
  song: one(songs, {
    fields: [playlistSongs.songId],
    references: [songs.id],
  }),
}));

// Favorites Relations
export const favoritesRelations = relations(favorites, ({ one }) => ({
  user: one(users, {
    fields: [favorites.userId],
    references: [users.id],
  }),
  song: one(songs, {
    fields: [favorites.songId],
    references: [songs.id],
  }),
}));

// Playlist Likes Relations
export const playlistLikesRelations = relations(playlistLikes, ({ one }) => ({
  user: one(users, {
    fields: [playlistLikes.userId],
    references: [users.id],
  }),
  playlist: one(playlists, {
    fields: [playlistLikes.playlistId],
    references: [playlists.id],
  }),
}));

// Comments Relations
export const commentsRelations = relations(comments, ({ one }) => ({
  user: one(users, {
    fields: [comments.userId],
    references: [users.id],
  }),
  song: one(songs, {
    fields: [comments.songId],
    references: [songs.id],
  }),
}));

// Ratings Relations
export const ratingsRelations = relations(ratings, ({ one }) => ({
  user: one(users, {
    fields: [ratings.userId],
    references: [users.id],
  }),
  song: one(songs, {
    fields: [ratings.songId],
    references: [songs.id],
  }),
}));

// Right Holders Relations
export const rightHoldersRelations = relations(rightHolders, ({ many }) => ({
  royalties: many(songRoyalties),
  royaltyPayments: many(royaltyPayments),
}));

// Song Royalties Relations
export const songRoyaltiesRelations = relations(songRoyalties, ({ one }) => ({
  song: one(songs, {
    fields: [songRoyalties.songId],
    references: [songs.id],
  }),
  rightHolder: one(rightHolders, {
    fields: [songRoyalties.rightHolderId],
    references: [rightHolders.id],
  }),
}));

// Royalty Payments Relations
export const royaltyPaymentsRelations = relations(royaltyPayments, ({ one }) => ({
  rightHolder: one(rightHolders, {
    fields: [royaltyPayments.rightHolderId],
    references: [rightHolders.id],
  }),
}));

// Streaming Analytics Relations
export const streamingAnalyticsRelations = relations(streamingAnalytics, ({ one }) => ({
  song: one(songs, {
    fields: [streamingAnalytics.songId],
    references: [songs.id],
  }),
  user: one(users, {
    fields: [streamingAnalytics.userId],
    references: [users.id],
  }),
}));

// Song Files Relations
export const songFilesRelations = relations(songFiles, ({ one }) => ({
  song: one(songs, {
    fields: [songFiles.songId],
    references: [songs.id],
  }),
}));
