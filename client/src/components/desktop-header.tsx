import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, Bell, User } from "lucide-react";

interface DesktopHeaderProps {
  title?: string;
  showSearch?: boolean;
  searchQuery?: string;
  onSearch?: (query: string) => void;
  searchPlaceholder?: string;
}

export default function DesktopHeader({ 
  title, 
  showSearch = true, 
  searchQuery = "", 
  onSearch,
  searchPlaceholder = "Search songs, artists, or albums..."
}: DesktopHeaderProps) {
  const [, setLocation] = useLocation();

  return (
    <header className="sticky top-0 z-10 bg-background/95 backdrop-blur-sm border-b border-border p-6 hidden md:block">
      <div className="flex items-center justify-between">
        <div className="flex-1 max-w-md">
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
        <div className="flex items-center space-x-4 ml-6">
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