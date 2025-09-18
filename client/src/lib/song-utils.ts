import type { Song, LegacyTrack, ApiTrack } from "@shared/schema";

/**
 * Convert an ApiTrack (Track with artist/category) to LegacyTrack format for the music player
 */
export function convertApiTrackToLegacy(apiTrack: ApiTrack, options: { 
  isFavorite?: boolean; 
  fallbackArtist?: string; 
  artwork?: string | null; 
} = {}): LegacyTrack {
  return {
    id: apiTrack.id,
    title: apiTrack.title,
    artist: apiTrack.artist || options.fallbackArtist || "Unknown Artist",
    category: apiTrack.category || "Music",
    duration: apiTrack.duration || 0,
    url: apiTrack.filePath ? encodeURI(apiTrack.filePath) : "",
    artwork: options.artwork || apiTrack.coverArt || null,
    isFavorite: options.isFavorite || false,
    uploadType: "file",
    createdAt: apiTrack.createdAt || undefined,
  };
}

/**
 * Convert a Song from the database to LegacyTrack format for the music player
 * @deprecated Use convertApiTrackToLegacy when API returns Track with artist/category
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
    url: song.filePath ? encodeURI(song.filePath) : "",
    artwork: options?.artwork || song.coverArt,
    isFavorite: false, // TODO: Get from favorites table
    uploadType: "file",
    createdAt: song.createdAt || undefined,
  };
}