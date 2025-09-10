import { Music, Users, Disc, Tag } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import MusicCard from "@/components/music-card";
import ArtistCard from "@/components/artist-card";
import AlbumCard from "@/components/album-card";
import type { SearchResult, Song, Artist, Album, Genre, LegacyTrack } from "@shared/schema";

interface UnifiedSearchResultsProps {
  searchResults: SearchResult;
  searchQuery: string;
  onPlaySong: (song: LegacyTrack) => void;
  onViewArtist?: (artist: Artist) => void;
  onViewAlbum?: (album: Album) => void;
  onGenreSelect?: (genre: Genre) => void;
}

export default function UnifiedSearchResults({ 
  searchResults, 
  searchQuery, 
  onPlaySong,
  onViewArtist,
  onViewAlbum,
  onGenreSelect
}: UnifiedSearchResultsProps) {
  const { songs, artists, albums, genres, total } = searchResults;

  // Convert Song to LegacyTrack format for MusicCard compatibility
  const convertToLegacyTrack = (song: Song): LegacyTrack => ({
    id: song.id,
    title: song.title,
    artist: "Unknown Artist", // TODO: Get from artists table
    category: "Music", // TODO: Get from genres table
    duration: song.duration || 0,
    url: song.filePath ? encodeURI(song.filePath) : "",
    artwork: song.coverArt || null,
    isFavorite: false, // TODO: Get from favorites table
    uploadType: "file",
    createdAt: song.createdAt || undefined,
  });

  if (total === 0) {
    return (
      <div className="text-center py-12" data-testid="no-search-results">
        <Music className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
        <h3 className="text-xl font-semibold text-foreground mb-2">No results found</h3>
        <p className="text-muted-foreground">
          Try searching for different keywords or check your spelling
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-8" data-testid="unified-search-results">
      {/* Search Summary */}
      <div className="border-b border-border pb-4">
        <h2 className="text-xl font-bold text-foreground mb-2">
          Search Results for "{searchQuery}"
        </h2>
        <p className="text-muted-foreground">
          Found {total} results: {songs.length} songs, {artists.length} artists, {albums.length} albums, {genres.length} categories
        </p>
      </div>

      {/* Genres */}
      {genres.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <Tag className="w-5 h-5 text-muted-foreground" />
            <h3 className="text-lg font-semibold text-foreground">Categories</h3>
            <Badge variant="secondary">{genres.length}</Badge>
          </div>
          <div className="flex flex-wrap gap-2">
            {genres.map((genre: Genre) => (
              <Badge 
                key={genre.id}
                variant="outline" 
                className="cursor-pointer hover:bg-accent hover:text-accent-foreground transition-colors"
                style={{ 
                  borderColor: genre.color || undefined, 
                  color: genre.color || undefined 
                }}
                onClick={() => onGenreSelect?.(genre)}
                data-testid={`badge-genre-${genre.id}`}
              >
                {genre.name}
              </Badge>
            ))}
          </div>
        </div>
      )}

      {/* Songs */}
      {songs.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <Music className="w-5 h-5 text-muted-foreground" />
            <h3 className="text-lg font-semibold text-foreground">Songs</h3>
            <Badge variant="secondary">{songs.length}</Badge>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 md:gap-6">
            {songs.map((song: Song) => {
              const legacySong = convertToLegacyTrack(song);
              return (
                <MusicCard 
                  key={song.id} 
                  song={legacySong} 
                  onPlay={() => onPlaySong(legacySong)}
                />
              );
            })}
          </div>
        </div>
      )}

      {/* Artists */}
      {artists.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <Users className="w-5 h-5 text-muted-foreground" />
            <h3 className="text-lg font-semibold text-foreground">Artists</h3>
            <Badge variant="secondary">{artists.length}</Badge>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 md:gap-6">
            {artists.map((artist: Artist) => (
              <ArtistCard
                key={artist.id}
                artist={artist}
                onViewArtist={() => onViewArtist?.(artist)}
              />
            ))}
          </div>
        </div>
      )}

      {/* Albums */}
      {albums.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <Disc className="w-5 h-5 text-muted-foreground" />
            <h3 className="text-lg font-semibold text-foreground">Albums</h3>
            <Badge variant="secondary">{albums.length}</Badge>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 md:gap-6">
            {albums.map((album: Album) => (
              <AlbumCard
                key={album.id}
                album={album}
                onViewAlbum={() => onViewAlbum?.(album)}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}