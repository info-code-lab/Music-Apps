import type { Song, LegacyTrack } from "@shared/schema";

/**
 * Convert a Song from the database to LegacyTrack format for the music player
 */
export function convertToLegacyTrack(song: Song, options?: { 
  artist?: string; 
  artwork?: string | null; 
}): LegacyTrack {
  return {
    id: song.id,
    title: song.title,
    artist: options?.artist || "Unknown Artist", // TODO: Get from artists table
    category: "Music", // TODO: Get from genres table
    duration: song.duration,
    url: song.filePath || "",
    artwork: options?.artwork || song.coverArt,
    isFavorite: false, // TODO: Get from favorites table
    uploadType: "file",
    createdAt: song.createdAt || undefined,
  };
}