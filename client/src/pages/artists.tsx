import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import ArtistLibrary from "@/components/artist-library";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, ArrowLeft } from "lucide-react";
import { Link } from "wouter";
import type { Artist } from "@shared/schema";

export default function Artists() {
  const [searchQuery, setSearchQuery] = useState("");

  const { data: artists = [], isLoading } = useQuery<Artist[]>({
    queryKey: ["/api/artists"],
    enabled: !searchQuery,
  });

  const { data: searchResults = [] } = useQuery<Artist[]>({
    queryKey: ["/api/artists/search", { q: searchQuery }],
    enabled: !!searchQuery,
  });

  const displayArtists = searchQuery ? searchResults : artists;

  const handleViewArtist = (artist: Artist) => {
    // TODO: Navigate to artist detail page
    console.log("View artist:", artist);
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-10 bg-background/95 backdrop-blur-sm border-b border-border p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Link href="/">
              <Button variant="ghost" size="sm" data-testid="button-back">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Home
              </Button>
            </Link>
            <div>
              <h1 className="text-2xl font-bold text-foreground font-sans">Artists</h1>
              <p className="text-muted-foreground font-serif">Discover amazing music artists</p>
            </div>
          </div>
          <div className="flex-1 max-w-md ml-8">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
              <Input
                type="text"
                placeholder="Search artists..."
                className="pl-10 bg-input border-border font-serif"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                data-testid="input-search-artists"
              />
            </div>
          </div>
        </div>
      </header>

      {/* Artists Library */}
      <ArtistLibrary
        artists={displayArtists}
        isLoading={isLoading}
        onViewArtist={handleViewArtist}
        searchQuery={searchQuery}
      />
    </div>
  );
}