import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import MusicCard from "@/components/music-card";
import ArtistCard from "@/components/artist-card";  
import AlbumCard from "@/components/album-card";
import { Music, Users, Disc, Play, MoreHorizontal } from "lucide-react";
import type { SearchResult, Song, Artist, Album, LegacyTrack } from "@shared/schema";

interface SectionedSearchResultsProps {
  searchResults: SearchResult;
  searchQuery: string;
  onPlaySong: (song: LegacyTrack) => void;
  onViewArtist?: (artist: Artist) => void;
  onViewAlbum?: (album: Album) => void;
}

export default function SectionedSearchResults({ 
  searchResults, 
  searchQuery, 
  onPlaySong,
  onViewArtist,
  onViewAlbum
}: SectionedSearchResultsProps) {
  const { songs, artists, albums, total } = searchResults;
  const [showAllSongs, setShowAllSongs] = useState(false);
  const [showAllArtists, setShowAllArtists] = useState(false);
  const [showAllAlbums, setShowAllAlbums] = useState(false);

  // Convert Song to LegacyTrack format for MusicCard compatibility
  const convertToLegacyTrack = (song: Song): LegacyTrack => ({
    id: song.id,
    title: song.title,
    artist: (song as any).artist || "Unknown Artist", // Use artist from API response
    category: (song as any).category || "Music", // Use category from API response
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

  // Determine the top result (prioritize songs, then albums, then artists)
  const getTopResult = () => {
    if (songs.length > 0) {
      const topSong = songs[0];
      return {
        type: 'song' as const,
        item: topSong,
        title: topSong.title,
        subtitle: (topSong as any).artist || "Unknown Artist", // Use artist from API response
        artwork: topSong.coverArt
      };
    }
    if (albums.length > 0) {
      const topAlbum = albums[0];
      return {
        type: 'album' as const,
        item: topAlbum,
        title: topAlbum.title,
        subtitle: "Album",
        artwork: topAlbum.coverArt
      };
    }
    if (artists.length > 0) {
      const topArtist = artists[0];
      return {
        type: 'artist' as const,
        item: topArtist,
        title: topArtist.name,
        subtitle: "Artist",
        artwork: topArtist.profilePic
      };
    }
    return null;
  };

  const topResult = getTopResult();

  const handleTopResultPlay = () => {
    if (topResult?.type === 'song') {
      const legacyTrack = convertToLegacyTrack(topResult.item as Song);
      onPlaySong(legacyTrack);
    } else if (topResult?.type === 'album') {
      onViewAlbum?.(topResult.item as Album);
    } else if (topResult?.type === 'artist') {
      onViewArtist?.(topResult.item as Artist);
    }
  };

  const displayedSongs = showAllSongs ? songs : songs.slice(0, 4);
  const displayedArtists = showAllArtists ? artists : artists.slice(0, 4);
  const displayedAlbums = showAllAlbums ? albums : albums.slice(0, 4);

  return (
    <div className="space-y-8" data-testid="sectioned-search-results">
      {/* TOP RESULT */}
      {topResult && (
        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-foreground">TOP RESULT</h2>
          <Card 
            className="p-6 bg-gradient-to-br from-primary/10 to-purple-500/10 border border-primary/20 cursor-pointer hover:shadow-lg transition-all duration-300"
            onClick={handleTopResultPlay}
            data-testid="top-result-card"
          >
            <div className="flex items-center gap-4">
              <div className="relative flex-shrink-0">
                <img
                  src={topResult.artwork || 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=300'}
                  alt={topResult.title}
                  className="w-20 h-20 object-cover rounded-lg"
                />
                <div className="absolute inset-0 bg-black/20 flex items-center justify-center rounded-lg opacity-0 hover:opacity-100 transition-opacity">
                  <Button 
                    size="sm"
                    className="w-10 h-10 bg-primary rounded-full shadow-lg hover:scale-105 transition-transform"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleTopResultPlay();
                    }}
                  >
                    <Play className="w-4 h-4 text-primary-foreground ml-0.5" />
                  </Button>
                </div>
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-2xl font-bold text-foreground mb-1 truncate">
                  {topResult.title}
                </h3>
                <p className="text-muted-foreground text-sm">
                  {topResult.subtitle}
                </p>
                <Badge variant="secondary" className="mt-2 capitalize">
                  {topResult.type}
                </Badge>
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* ALBUMS */}
      {albums.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-foreground flex items-center gap-2">
              <Disc className="w-5 h-5" />
              ALBUMS
            </h2>
            {albums.length > 4 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowAllAlbums(!showAllAlbums)}
                className="text-muted-foreground hover:text-foreground"
                data-testid="button-view-all-albums"
              >
                {showAllAlbums ? 'Show Less' : 'View All'}
              </Button>
            )}
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {displayedAlbums.map((album) => (
              <AlbumCard
                key={album.id}
                album={album}
                onViewAlbum={() => onViewAlbum?.(album)}
              />
            ))}
          </div>
        </div>
      )}

      {/* SONGS */}
      {songs.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-foreground flex items-center gap-2">
              <Music className="w-5 h-5" />
              SONGS
            </h2>
            {songs.length > 4 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowAllSongs(!showAllSongs)}
                className="text-muted-foreground hover:text-foreground"
                data-testid="button-view-all-songs"
              >
                {showAllSongs ? 'Show Less' : 'View All'}
              </Button>
            )}
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {displayedSongs.map((song) => {
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

      {/* ARTISTS */}
      {artists.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-foreground flex items-center gap-2">
              <Users className="w-5 h-5" />
              ARTISTS
            </h2>
            {artists.length > 4 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowAllArtists(!showAllArtists)}
                className="text-muted-foreground hover:text-foreground"
                data-testid="button-view-all-artists"
              >
                {showAllArtists ? 'Show Less' : 'View All'}
              </Button>
            )}
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {displayedArtists.map((artist) => (
              <ArtistCard
                key={artist.id}
                artist={artist}
                onViewArtist={() => onViewArtist?.(artist)}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}