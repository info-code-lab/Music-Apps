import { Link, useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Home, Search, Music, Plus, Flame, Heart, Star, Guitar, Users, Disc, ListMusic, Music2, Headphones, Waves, Zap, Volume2, Coffee, Mic, Tags } from "lucide-react";
import type { Track } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";

interface SidebarProps {
  onCategorySelect: (category: string) => void;
  selectedCategory: string;
  recentSongs: Track[];
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

export default function Sidebar({ onCategorySelect, selectedCategory, recentSongs }: SidebarProps) {
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
    ...genres
      .filter((genre: Genre) => genre.isActive !== false)
      .sort((a: Genre, b: Genre) => (a.displayOrder || 0) - (b.displayOrder || 0))
      .map((genre: Genre) => ({
        name: genre.name,
        icon: iconMap[genre.icon || "Music"] || Music,
        color: genre.color || "#8B5CF6"
      }))
  ];

  return (
    <aside className="w-64 bg-card border-r border-border flex flex-col h-screen sticky top-0">
      {/* Logo and Brand */}
      <div className="p-6 border-b border-border">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-lg bg-primary flex items-center justify-center">
            <Music className="text-primary-foreground text-lg w-5 h-5" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-foreground font-sans">Harmony</h1>
            <p className="text-xs text-muted-foreground font-mono">Live Player</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-4 py-6 space-y-2 custom-scrollbar overflow-y-auto">
        <div className="space-y-1">
          <Link 
            href="/" 
            className={`flex items-center space-x-3 px-3 py-2 rounded-lg transition-colors ${
              location === "/" 
                ? "bg-accent text-accent-foreground" 
                : "text-muted-foreground hover:bg-muted hover:text-foreground"
            }`}
            data-testid="link-home"
          >
            <Home className="w-5 h-5" />
            <span className="font-mono font-medium">Home</span>
          </Link>
          <Link 
            href="/songs" 
            className={`flex items-center space-x-3 px-3 py-2 rounded-lg transition-colors ${
              location === "/songs" 
                ? "bg-accent text-accent-foreground" 
                : "text-muted-foreground hover:bg-muted hover:text-foreground"
            }`}
            data-testid="link-songs"
          >
            <Music2 className="w-5 h-5" />
            <span className="font-mono font-medium">Songs</span>
          </Link>
          <Link 
            href="/artists" 
            className={`flex items-center space-x-3 px-3 py-2 rounded-lg transition-colors ${
              location === "/artists" 
                ? "bg-accent text-accent-foreground" 
                : "text-muted-foreground hover:bg-muted hover:text-foreground"
            }`}
            data-testid="link-artists"
          >
            <Users className="w-5 h-5" />
            <span className="font-mono font-medium">Artists</span>
          </Link>
          <Link 
            href="/albums" 
            className={`flex items-center space-x-3 px-3 py-2 rounded-lg transition-colors ${
              location === "/albums" 
                ? "bg-accent text-accent-foreground" 
                : "text-muted-foreground hover:bg-muted hover:text-foreground"
            }`}
            data-testid="link-albums"
          >
            <Disc className="w-5 h-5" />
            <span className="font-mono font-medium">Albums</span>
          </Link>
          <Link 
            href="/playlists" 
            className={`flex items-center space-x-3 px-3 py-2 rounded-lg transition-colors ${
              location === "/playlists" 
                ? "bg-accent text-accent-foreground" 
                : "text-muted-foreground hover:bg-muted hover:text-foreground"
            }`}
            data-testid="link-playlists"
          >
            <ListMusic className="w-5 h-5" />
            <span className="font-mono font-medium">Playlists</span>
          </Link>
          <button 
            className="w-full flex items-center space-x-3 px-3 py-2 rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
            data-testid="button-search"
          >
            <Search className="w-5 h-5" />
            <span className="font-mono font-medium">Search</span>
          </button>
        </div>

        {/* Categories */}
        <div className="pt-6">
          <h3 className="px-3 mb-3 text-sm font-semibold text-muted-foreground font-mono uppercase tracking-wider">
            Categories
          </h3>
          <div className="space-y-1">
            {categories.map((category) => {
              const Icon = category.icon;
              return (
                <button
                  key={category.name}
                  onClick={() => onCategorySelect(category.name)}
                  className={`w-full flex items-center space-x-3 px-3 py-2 rounded-lg transition-colors ${
                    selectedCategory === category.name
                      ? "bg-accent text-accent-foreground"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground"
                  }`}
                  data-testid={`button-category-${category.name.toLowerCase()}`}
                >
                  <Icon className="w-5 h-5" />
                  <span className="font-mono">{category.name}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Recently Played */}
        <div className="pt-6">
          <h3 className="px-3 mb-3 text-sm font-semibold text-muted-foreground font-mono uppercase tracking-wider">
            Recent
          </h3>
          <div className="space-y-2">
            {recentSongs.map((song) => (
              <div 
                key={song.id}
                className="flex items-center space-x-3 px-3 py-2 rounded-lg hover:bg-muted transition-colors cursor-pointer"
                data-testid={`recent-song-${song.id}`}
              >
                <img 
                  src={song.coverArt || 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?ixlib=rb-4.0.3&auto=format&fit=crop&w=40&h=40'} 
                  alt={song.title}
                  className="w-8 h-8 rounded object-cover" 
                />
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-foreground font-mono truncate">{song.title}</p>
                  <p className="text-xs text-muted-foreground font-serif truncate">Unknown Artist</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </nav>
    </aside>
  );
}
