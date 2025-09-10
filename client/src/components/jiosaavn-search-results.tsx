import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Music, Users, Disc, Mic } from "lucide-react";
import MusicCard from "@/components/music-card";
import ArtistCard from "@/components/artist-card";  
import AlbumCard from "@/components/album-card";
import type { Song, Artist, Album, Genre, LegacyTrack, SearchResult } from "@shared/schema";

interface JioSaavnSearchResultsProps {
  searchResults: SearchResult;
  searchQuery: string;
  onPlaySong: (song: LegacyTrack) => void;
  onViewArtist?: (artist: Artist) => void;
  onViewAlbum?: (album: Album) => void;
  onGenreSelect?: (genre: Genre) => void;
  onViewAll?: (section: string) => void;
}

export default function JioSaavnSearchResults({ 
  searchResults, 
  searchQuery, 
  onPlaySong,
  onViewArtist,
  onViewAlbum,
  onGenreSelect,
  onViewAll
}: JioSaavnSearchResultsProps) {
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
          Try searching for different keywords for "{searchQuery}"
        </p>
      </div>
    );
  }

  const topResult = songs[0] ? {
    type: 'song' as const,
    data: songs[0]
  } : artists[0] ? {
    type: 'artist' as const,
    data: artists[0]
  } : albums[0] ? {
    type: 'album' as const,
    data: albums[0]
  } : { type: null, data: null };

  return (
    <div className="space-y-8 p-6" data-testid="jiosaavn-search-results">
      <div className="flex items-center gap-2 mb-6">
        <h2 className="text-2xl font-bold text-foreground">
          Search results for "{searchQuery}"
        </h2>
        <Button 
          variant="ghost" 
          size="sm" 
          className="text-sm text-muted-foreground hover:text-foreground"
          onClick={() => onViewAll?.('clear')}
          data-testid="button-clear-search"
        >
          Clear
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* TOP RESULT */}
        {topResult.data && (
          <div className="lg:col-span-1">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-foreground uppercase text-gray-500 text-sm">
                TOP RESULT
              </h3>
            </div>
            <Card className="p-6 bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-900 border-0 hover:shadow-lg transition-shadow">
              <CardContent className="p-0">
                {topResult.type === 'song' && (
                  <div className="flex items-center gap-4">
                    <div className="w-16 h-16 bg-gray-200 dark:bg-gray-700 rounded-lg flex items-center justify-center">
                      <Music className="w-8 h-8 text-muted-foreground" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-semibold text-foreground truncate text-lg">
                        {(topResult.data as Song).title}
                      </h4>
                      <p className="text-muted-foreground text-sm">Song</p>
                    </div>
                  </div>
                )}
                {topResult.type === 'artist' && topResult.data && (
                  <div className="flex items-center gap-4">
                    <div className="w-16 h-16 bg-gray-200 dark:bg-gray-700 rounded-full flex items-center justify-center">
                      <Users className="w-8 h-8 text-muted-foreground" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-semibold text-foreground truncate text-lg">
                        {(topResult.data as Artist).name}
                      </h4>
                      <p className="text-muted-foreground text-sm">Artist</p>
                    </div>
                  </div>
                )}
                {topResult.type === 'album' && topResult.data && (
                  <div className="flex items-center gap-4">
                    <div className="w-16 h-16 bg-gray-200 dark:bg-gray-700 rounded-lg flex items-center justify-center">
                      <Disc className="w-8 h-8 text-muted-foreground" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-semibold text-foreground truncate text-lg">
                        {(topResult.data as Album).title}
                      </h4>
                      <p className="text-muted-foreground text-sm">Album</p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}

        {/* RIGHT SIDE SECTIONS */}
        <div className={`${topResult.data ? 'lg:col-span-2' : 'lg:col-span-3'} space-y-6`}>
          {/* ALBUMS */}
          {albums.length > 0 && (
            <div>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-foreground uppercase text-gray-500 text-sm">
                  ALBUMS
                </h3>
                {albums.length > 3 && (
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="text-sm text-muted-foreground hover:text-foreground"
                    onClick={() => onViewAll?.('albums')}
                    data-testid="button-view-all-albums"
                  >
                    View All
                  </Button>
                )}
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {albums.slice(0, 3).map((album) => (
                  <div key={album.id} className="bg-white dark:bg-gray-800 rounded-lg p-4 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 bg-gray-200 dark:bg-gray-600 rounded-lg flex items-center justify-center">
                        <Disc className="w-6 h-6 text-muted-foreground" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-medium text-foreground truncate">
                          {album.title}
                        </h4>
                        <p className="text-sm text-muted-foreground">
                          Album • Various Artists
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* SONGS */}
          {songs.length > 0 && (
            <div>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-foreground uppercase text-gray-500 text-sm">
                  SONGS
                </h3>
                {songs.length > 4 && (
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="text-sm text-muted-foreground hover:text-foreground"
                    onClick={() => onViewAll?.('songs')}
                    data-testid="button-view-all-songs"
                  >
                    View All
                  </Button>
                )}
              </div>
              <div className="space-y-2">
                {songs.slice(0, 4).map((song, index) => {
                  const legacySong = convertToLegacyTrack(song);
                  return (
                    <div 
                      key={song.id} 
                      className="flex items-center gap-3 p-3 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-lg transition-colors cursor-pointer group"
                      onClick={() => onPlaySong(legacySong)}
                      data-testid={`song-item-${song.id}`}
                    >
                      <div className="w-12 h-12 bg-gray-200 dark:bg-gray-600 rounded-lg flex items-center justify-center">
                        <Music className="w-6 h-6 text-muted-foreground" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-medium text-foreground truncate group-hover:text-primary transition-colors">
                          {song.title}
                        </h4>
                        <p className="text-sm text-muted-foreground">
                          Unknown Artist • {song.duration ? Math.floor(song.duration / 60) : 0}:{((song.duration || 0) % 60).toString().padStart(2, '0')}
                        </p>
                      </div>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="opacity-0 group-hover:opacity-100 transition-opacity"
                        data-testid={`button-play-${song.id}`}
                      >
                        ▶
                      </Button>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* ARTISTS */}
          {artists.length > 0 && (
            <div>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-foreground uppercase text-gray-500 text-sm">
                  ARTISTS
                </h3>
                {artists.length > 3 && (
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="text-sm text-muted-foreground hover:text-foreground"
                    onClick={() => onViewAll?.('artists')}
                    data-testid="button-view-all-artists"
                  >
                    View All
                  </Button>
                )}
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {artists.slice(0, 3).map((artist) => (
                  <div 
                    key={artist.id} 
                    className="bg-white dark:bg-gray-800 rounded-lg p-4 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors cursor-pointer"
                    onClick={() => onViewArtist?.(artist)}
                    data-testid={`artist-item-${artist.id}`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 bg-gray-200 dark:bg-gray-600 rounded-full flex items-center justify-center">
                        <Users className="w-6 h-6 text-muted-foreground" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-medium text-foreground truncate">
                          {artist.name}
                        </h4>
                        <p className="text-sm text-muted-foreground">
                          Artist
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* PODCASTS (Categories/Genres) */}
          {genres.length > 0 && (
            <div>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-foreground uppercase text-gray-500 text-sm">
                  PODCASTS
                </h3>
                {genres.length > 3 && (
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="text-sm text-muted-foreground hover:text-foreground"
                    onClick={() => onViewAll?.('podcasts')}
                    data-testid="button-view-all-podcasts"
                  >
                    View All
                  </Button>
                )}
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {genres.slice(0, 3).map((genre) => (
                  <div 
                    key={genre.id} 
                    className="bg-white dark:bg-gray-800 rounded-lg p-4 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors cursor-pointer"
                    onClick={() => onGenreSelect?.(genre)}
                    data-testid={`genre-item-${genre.id}`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 bg-gray-200 dark:bg-gray-600 rounded-lg flex items-center justify-center">
                        <Mic className="w-6 h-6 text-muted-foreground" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-medium text-foreground truncate">
                          {genre.name}
                        </h4>
                        <p className="text-sm text-muted-foreground">
                          Podcast • Season 1
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}