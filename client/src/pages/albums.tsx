import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import Sidebar from "@/components/sidebar";
import MobileHeader from "@/components/mobile-header";
import MobileBottomNav from "@/components/mobile-bottom-nav";
import MobileDrawer from "@/components/mobile-drawer";
import AlbumLibrary from "@/components/album-library";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, Bell, User } from "lucide-react";
import type { Album } from "@shared/schema";

export default function Albums() {
  const [searchQuery, setSearchQuery] = useState("");
  const [isMobileDrawerOpen, setIsMobileDrawerOpen] = useState(false);

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
  };

  return (
    <div className="min-h-screen flex flex-col">
      {/* Mobile Header */}
      <MobileHeader 
        onSearch={setSearchQuery}
        searchQuery={searchQuery}
        onMenuToggle={() => setIsMobileDrawerOpen(true)}
      />

      {/* Mobile Drawer */}
      <MobileDrawer 
        isOpen={isMobileDrawerOpen}
        onClose={() => setIsMobileDrawerOpen(false)}
        onCategorySelect={() => {}}
        selectedCategory=""
      />

      <div className="flex flex-1">
        {/* Desktop Sidebar */}
        <div className="hidden md:block">
          <Sidebar 
            onCategorySelect={() => {}}
            selectedCategory=""
            recentSongs={[]}
          />
        </div>

        <main className="flex-1 overflow-auto pb-20 md:pb-32 custom-scrollbar">
          {/* Desktop Header with Search */}
          <header className="sticky top-0 z-10 bg-background/95 backdrop-blur-sm border-b border-border p-6 hidden md:block">
            <div className="flex items-center justify-between">
              <div className="flex-1 max-w-md">
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
              <div className="flex items-center space-x-4 ml-6">
                <Button variant="ghost" size="sm" className="p-2" data-testid="button-notifications">
                  <Bell className="w-4 h-4 text-muted-foreground" />
                </Button>
                <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center">
                  <User className="w-4 h-4 text-primary-foreground" />
                </div>
              </div>
            </div>
          </header>

          {/* Page Content */}
          <section className="px-4 md:px-6 pb-6">
            <div className="mb-4 md:mb-6">
              <h2 className="text-xl md:text-2xl font-bold text-foreground mb-1 md:mb-2 font-sans">
                Albums
              </h2>
              <p className="text-sm md:text-base text-muted-foreground font-serif">
                Explore music albums and collections
              </p>
            </div>
            
            {/* Albums Library */}
            <AlbumLibrary
              albums={displayAlbums}
              isLoading={isLoading}
              onViewAlbum={handleViewAlbum}
              searchQuery={searchQuery}
            />
          </section>
        </main>
      </div>

      {/* Mobile Bottom Navigation */}
      <MobileBottomNav />
    </div>
  );
}