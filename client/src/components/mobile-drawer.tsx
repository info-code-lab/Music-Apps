import { Link, useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { 
  Home, 
  Music, 
  Users, 
  Disc, 
  ListMusic, 
  Heart, 
  Settings,
  X,
  Flame,
  Star,
  Guitar,
  Coffee,
  Mic,
  Headphones,
  Waves,
  Volume2,
  Zap,
  Tags
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { apiRequest } from "@/lib/queryClient";
import { cn } from "@/lib/utils";

interface MobileDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onCategorySelect: (category: string) => void;
  selectedCategory: string;
}

interface Genre {
  id: string;
  name: string;
  description?: string;
  icon?: string;
  color?: string;
  isActive?: boolean;
  displayOrder?: number;
}

// Icon mapping for genre icons
const iconMap: { [key: string]: any } = {
  Music, Flame, Heart, Star, Guitar, Coffee, Mic, Headphones, 
  Waves, Volume2, Zap, Tags, Users, Disc, ListMusic
};

export default function MobileDrawer({ 
  isOpen, 
  onClose, 
  onCategorySelect, 
  selectedCategory 
}: MobileDrawerProps) {
  const [location] = useLocation();
  
  // Fetch genres from API
  const { data: genres = [], isLoading } = useQuery({
    queryKey: ['/api/genres'],
    queryFn: async () => {
      const res = await apiRequest("GET", "/api/genres");
      return res.json();
    }
  });

  // Create categories from genres, adding "All Categories" at the beginning
  const categories = [
    { name: "All Categories", icon: Music, color: "#8B5CF6" },
    ...genres.map((genre: Genre) => ({
      name: genre.name,
      icon: iconMap[genre.icon || "Music"] || Music,
      color: genre.color || "#8B5CF6"
    }))
  ];

  const mainNavItems = [
    { name: "Home", icon: Home, href: "/" },
    { name: "Songs", icon: Music, href: "/songs" },
    { name: "Artists", icon: Users, href: "/artists" },
    { name: "Albums", icon: Disc, href: "/albums" },
    { name: "Playlists", icon: ListMusic, href: "/playlists" },
    { name: "Favorites", icon: Heart, href: "/favorites" },
  ];

  const handleCategoryClick = (categoryName: string) => {
    onCategorySelect(categoryName);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/50 z-40 lg:hidden"
        onClick={onClose}
      />
      
      {/* Drawer */}
      <div className="fixed inset-y-0 left-0 w-80 max-w-[85vw] bg-background border-r border-border z-50 lg:hidden transform transition-transform duration-300 ease-in-out">
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-border">
            <h2 className="text-lg font-bold text-foreground font-sans">
              Menu
            </h2>
            <Button 
              variant="ghost" 
              size="sm" 
              className="p-2" 
              onClick={onClose}
              data-testid="button-close-drawer"
            >
              <X className="w-5 h-5" />
            </Button>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto custom-scrollbar">
            {/* Main Navigation */}
            <div className="p-4 space-y-2">
              {mainNavItems.map((item) => {
                const Icon = item.icon;
                const isActive = item.href === "/" ? location === "/" : location.startsWith(item.href);
                
                return (
                  <Link key={item.href} href={item.href}>
                    <button
                      className={cn(
                        "w-full flex items-center space-x-3 p-3 rounded-lg transition-colors text-left",
                        isActive 
                          ? "bg-accent text-accent-foreground" 
                          : "hover:bg-accent text-muted-foreground hover:text-foreground"
                      )}
                      onClick={onClose}
                      data-testid={`drawer-nav-${item.name.toLowerCase()}`}
                    >
                      <Icon className={cn("w-5 h-5", isActive ? "text-accent-foreground" : "text-muted-foreground")} />
                      <span className="font-medium">{item.name}</span>
                    </button>
                  </Link>
                );
              })}
            </div>

            {/* Categories */}
            <div className="p-4 border-t border-border">
              <h3 className="text-sm font-semibold text-muted-foreground mb-3 uppercase tracking-wider">
                Browse by Genre
              </h3>
              <div className="space-y-1">
                {categories.map((category) => {
                  const Icon = category.icon;
                  const isSelected = selectedCategory === category.name;
                  
                  return (
                    <button
                      key={category.name}
                      className={cn(
                        "w-full flex items-center space-x-3 p-3 rounded-lg transition-colors text-left",
                        isSelected 
                          ? "bg-primary/10 text-primary border border-primary/20" 
                          : "hover:bg-accent text-muted-foreground hover:text-foreground"
                      )}
                      onClick={() => handleCategoryClick(category.name)}
                      data-testid={`drawer-category-${category.name.toLowerCase().replace(/\s+/g, '-')}`}
                    >
                      <Icon 
                        className="w-4 h-4" 
                        style={{ color: isSelected ? category.color : undefined }}
                      />
                      <span className="font-medium text-sm">{category.name}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

        </div>
      </div>
    </>
  );
}