import { Link } from "wouter";
import { Home, Search, Music, Plus, Flame, Heart, Star, Guitar } from "lucide-react";
import type { Track } from "@shared/schema";

interface SidebarProps {
  onCategorySelect: (category: string) => void;
  selectedCategory: string;
  recentTracks: Track[];
}

export default function Sidebar({ onCategorySelect, selectedCategory, recentTracks }: SidebarProps) {
  const categories = [
    { name: "Rock", icon: Flame },
    { name: "Jazz", icon: Heart },
    { name: "Electronic", icon: Star },
    { name: "Classical", icon: Guitar },
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
          <Link href="/">
            <a className="flex items-center space-x-3 px-3 py-2 rounded-lg bg-accent text-accent-foreground" data-testid="link-home">
              <Home className="w-5 h-5" />
              <span className="font-mono font-medium">Home</span>
            </a>
          </Link>
          <button 
            className="w-full flex items-center space-x-3 px-3 py-2 rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
            data-testid="button-search"
          >
            <Search className="w-5 h-5" />
            <span className="font-mono font-medium">Search</span>
          </button>
          <button 
            className="w-full flex items-center space-x-3 px-3 py-2 rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
            onClick={() => onCategorySelect("All Categories")}
            data-testid="button-library"
          >
            <Music className="w-5 h-5" />
            <span className="font-mono font-medium">Library</span>
          </button>
          <button 
            className="w-full flex items-center space-x-3 px-3 py-2 rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
            data-testid="button-add-music"
          >
            <Plus className="w-5 h-5" />
            <span className="font-mono font-medium">Add Music</span>
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
            {recentTracks.map((track) => (
              <div 
                key={track.id}
                className="flex items-center space-x-3 px-3 py-2 rounded-lg hover:bg-muted transition-colors cursor-pointer"
                data-testid={`recent-track-${track.id}`}
              >
                <img 
                  src={track.artwork || 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?ixlib=rb-4.0.3&auto=format&fit=crop&w=40&h=40'} 
                  alt={track.title}
                  className="w-8 h-8 rounded object-cover" 
                />
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-foreground font-mono truncate">{track.title}</p>
                  <p className="text-xs text-muted-foreground font-serif truncate">{track.artist}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </nav>
    </aside>
  );
}
