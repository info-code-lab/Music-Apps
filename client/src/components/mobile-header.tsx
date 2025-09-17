import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, Menu, Bell, User, X, ArrowLeft } from "lucide-react";
import { cn } from "@/lib/utils";
import { useLocation } from "wouter";

interface MobileHeaderProps {
  onSearch?: (query: string) => void;
  searchQuery?: string;
  onMenuToggle?: () => void;
  showSearch?: boolean;
}

export default function MobileHeader({ 
  onSearch, 
  searchQuery = "", 
  onMenuToggle,
  showSearch = true 
}: MobileHeaderProps) {
  const [isSearchExpanded, setIsSearchExpanded] = useState(false);
  const [localSearchQuery, setLocalSearchQuery] = useState(searchQuery);
  const [location, navigate] = useLocation();

  // Determine if we should show back button (not on home page)
  const shouldShowBackButton = location !== "/";

  // Handle back navigation
  const handleBackNavigation = () => {
    // Try to go back in browser history first
    if (window.history.length > 1) {
      window.history.back();
    } else {
      // Fallback to home page if no history
      navigate("/");
    }
  };

  // Get page title based on current location
  const getPageTitle = () => {
    switch (location) {
      case "/new-releases": return "New Releases";
      case "/top-charts": return "Top Charts";
      case "/top-playlists": return "Top Playlists";
      case "/top-artists": return "Top Artists";
      case "/songs": return "Songs";
      case "/artists": return "Artists";
      case "/albums": return "Albums";
      case "/playlists": return "Playlists";
      case "/favorites": return "Favorites";
      case "/my-library": return "My Library";
      case "/profile": return "Profile";
      case "/search": return "Search";
      case "/history": return "History";
      default: {
        // Handle dynamic routes like /playlist/[id]
        if (location.startsWith("/playlist/")) return "Playlist";
        return "Harmony";
      }
    }
  };

  const handleSearchToggle = () => {
    setIsSearchExpanded(!isSearchExpanded);
    if (isSearchExpanded && onSearch) {
      onSearch("");
      setLocalSearchQuery("");
    }
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setLocalSearchQuery(value);
    onSearch?.(value);
  };

  // Sync local state with external searchQuery prop
  useEffect(() => {
    setLocalSearchQuery(searchQuery);
  }, [searchQuery]);

  return (
    <header className="sticky top-0 z-50 bg-background border-b border-border lg:hidden">
      {shouldShowBackButton && !isSearchExpanded ? (
        // Simplified header for other pages (like the image)
        <div className="flex items-center px-4 py-4 bg-slate-800 dark:bg-slate-900">
          <Button 
            variant="ghost" 
            size="sm" 
            className="p-2 -ml-2 text-white hover:bg-slate-700" 
            onClick={handleBackNavigation}
            data-testid="button-back"
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div className="flex-1 text-center">
            <h1 className="text-lg font-semibold text-white">
              {getPageTitle()}
            </h1>
          </div>
          <div className="w-9"></div> {/* Spacer to center the title */}
        </div>
      ) : (
        <div className="flex items-center justify-between px-4 py-3">
          {!isSearchExpanded ? (
            <>
              <div className="flex items-center space-x-3">
                {onMenuToggle && (
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="p-2 -ml-2" 
                    onClick={onMenuToggle}
                    data-testid="button-menu"
                  >
                    <Menu className="w-5 h-5" />
                  </Button>
                )}
                <h1 className="text-lg font-bold text-foreground font-sans">
                  Harmony
                </h1>
              </div>
              
              <div className="flex items-center space-x-2">
                {showSearch && (
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="p-2" 
                    onClick={handleSearchToggle}
                    data-testid="button-search"
                  >
                    <Search className="w-5 h-5" />
                  </Button>
                )}
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="p-2" 
                  data-testid="button-mobile-notifications"
                >
                  <Bell className="w-5 h-5" />
                </Button>
              </div>
            </>
          ) : (
            <div className="flex items-center w-full space-x-3">
              <Button 
                variant="ghost" 
                size="sm" 
                className="p-2 -ml-2" 
                onClick={handleSearchToggle}
                data-testid="button-close-search"
              >
                <X className="w-5 h-5" />
              </Button>
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                <Input
                  type="text"
                  placeholder="Search songs, artists, albums..."
                  className="pl-10 bg-input border-border font-serif"
                  value={localSearchQuery}
                  onChange={handleSearchChange}
                  autoFocus
                  data-testid="input-mobile-search"
                />
              </div>
            </div>
          )}
        </div>
      )}
    </header>
  );
}