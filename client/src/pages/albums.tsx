import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import AlbumLibrary from "@/components/album-library";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, ArrowLeft } from "lucide-react";
import { Link } from "wouter";
import type { Album } from "@shared/schema";

export default function Albums() {
  const [searchQuery, setSearchQuery] = useState("");

  const { data: albums = [], isLoading } = useQuery<Album[]>({
    queryKey: ["/api/albums"],
    enabled: !searchQuery,
  });

  const { data: searchResults = [] } = useQuery<Album[]>({
    queryKey: ["/api/albums/search", { q: searchQuery }],
    enabled: !!searchQuery,
  });

  const displayAlbums = searchQuery ? searchResults : albums;

  const handleViewAlbum = (album: Album) => {
    // TODO: Navigate to album detail page
    console.log("View album:", album);
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
              <h1 className="text-2xl font-bold text-foreground font-sans">Albums</h1>
              <p className="text-muted-foreground font-serif">Explore music albums and collections</p>
            </div>
          </div>
          <div className="flex-1 max-w-md ml-8">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
              <Input
                type="text"
                placeholder="Search albums..."
                className="pl-10 bg-input border-border font-serif"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                data-testid="input-search-albums"
              />
            </div>
          </div>
        </div>
      </header>

      {/* Albums Library */}
      <AlbumLibrary
        albums={displayAlbums}
        isLoading={isLoading}
        onViewAlbum={handleViewAlbum}
        searchQuery={searchQuery}
      />
    </div>
  );
}