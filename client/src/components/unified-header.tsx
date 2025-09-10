import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, Bell, User, Music } from "lucide-react";

interface UnifiedHeaderProps {
  title?: string;
  showSearch?: boolean;
  searchQuery?: string;
  onSearch?: (query: string) => void;
  searchPlaceholder?: string;
}

export default function UnifiedHeader({ 
  title, 
  showSearch = true, 
  searchQuery = "", 
  onSearch,
  searchPlaceholder = "Search songs, artists, or albums..."
}: UnifiedHeaderProps) {
  const [, setLocation] = useLocation();

  return (
    <header className="sticky top-0 z-30 bg-background border-b border-border">
      <div className="flex items-center justify-between px-6 py-3">
        {/* Logo and Brand */}
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-lg bg-primary flex items-center justify-center">
            <Music className="text-primary-foreground text-lg w-5 h-5" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-foreground font-sans">Harmony</h1>
            <p className="text-xs text-muted-foreground font-mono">Live Player</p>
          </div>
        </div>

        {/* Search or Title */}
        <div className="flex-1 max-w-md mx-6">
          {showSearch ? (
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
              <Input
                type="text"
                placeholder={searchPlaceholder}
                className="pl-10 bg-input border-border font-serif"
                value={searchQuery}
                onChange={(e) => onSearch?.(e.target.value)}
                data-testid="input-search"
              />
            </div>
          ) : title ? (
            <div className="relative">
              <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4">
                <User className="w-4 h-4" />
              </div>
              <div className="pl-10 py-2 text-foreground font-serif">
                {title}
              </div>
            </div>
          ) : null}
        </div>

        {/* Right side actions */}
        <div className="flex items-center space-x-4">
          <Button variant="ghost" size="sm" className="p-2" data-testid="button-notifications">
            <Bell className="w-4 h-4 text-muted-foreground" />
          </Button>
          <Button 
            variant="ghost" 
            size="sm" 
            className="w-8 h-8 rounded-full bg-primary hover:bg-primary/90 p-0" 
            data-testid="button-profile"
            onClick={() => setLocation('/profile')}
          >
            <User className="w-4 h-4 text-primary-foreground" />
          </Button>
        </div>
      </div>
    </header>
  );
}