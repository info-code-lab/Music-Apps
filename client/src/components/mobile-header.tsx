import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, Menu, Bell, User, X } from "lucide-react";
import { cn } from "@/lib/utils";

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

  const handleSearchToggle = () => {
    setIsSearchExpanded(!isSearchExpanded);
    if (isSearchExpanded && onSearch) {
      onSearch("");
    }
  };

  return (
    <header className="sticky top-0 z-30 bg-background border-b border-border md:hidden">
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
                data-testid="button-notifications"
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
                value={searchQuery}
                onChange={(e) => onSearch?.(e.target.value)}
                autoFocus
                data-testid="input-mobile-search"
              />
            </div>
          </div>
        )}
      </div>
    </header>
  );
}