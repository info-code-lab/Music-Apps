import { useState } from "react";
import { Link, useLocation } from "wouter";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  Home, 
  Music2, 
  Users, 
  Disc, 
  ListMusic, 
  Heart, 
  Search, 
  User,
  Settings, 
  HelpCircle, 
  LogOut,
  Download,
  Music,
  Library
} from "lucide-react";

const menuItems = [
  {
    name: "Home",
    href: "/",
    icon: Home,
    section: "menu"
  },
  {
    name: "Search",
    href: "/search",
    icon: Search,
    section: "menu"
  },
  {
    name: "Songs",
    href: "/songs",
    icon: Music2,
    section: "menu"
  },
  {
    name: "Artists",
    href: "/artists",
    icon: Users,
    section: "menu"
  },
  {
    name: "Albums",
    href: "/albums",
    icon: Disc,
    section: "menu"
  },
  {
    name: "Playlists",
    href: "/playlists",
    icon: ListMusic,
    section: "menu"
  }
];

const libraryItems = [
  {
    name: "My Library",
    href: "/my-library",
    icon: Library,
    section: "library"
  },
  {
    name: "Favorites",
    href: "/favorites",
    icon: Heart,
    section: "library"
  }
];

const generalItems = [
  {
    name: "Profile",
    href: "/profile",
    icon: User,
    section: "general"
  },
  {
    name: "Settings",
    href: "/settings",
    icon: Settings,
    section: "general"
  },
  {
    name: "Help", 
    href: "/help",
    icon: HelpCircle,
    section: "general"
  },
  {
    name: "Logout",
    href: "/logout",
    icon: LogOut,
    section: "general"
  }
];

export default function FloatingSidebar() {
  const [location] = useLocation();

  const isActive = (href: string) => {
    if (href === "/admin" && location === "/admin") return true;
    if (href !== "/admin" && location.startsWith(href)) return true;
    return false;
  };

  return (
    <div className="fixed left-3 top-3 bottom-3 w-56 bg-white dark:bg-gray-950 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-800 z-50 flex flex-col overflow-hidden">
      {/* Header with Logo */}
      <div className="p-6 border-b border-gray-100 dark:border-gray-800">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-purple-600 rounded-lg flex items-center justify-center">
            <Music className="w-5 h-5 text-white" />
          </div>
          <span className="font-semibold text-gray-900 dark:text-white text-lg">
            Harmony
          </span>
        </div>
      </div>

      {/* Navigation */}
      <div className="flex-1 p-4 space-y-6">
        {/* Menu Section */}
        <div>
          <h3 className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3 px-2">
            MENU
          </h3>
          <nav className="space-y-1">
            {menuItems.map((item) => {
              const Icon = item.icon;
              const active = isActive(item.href);
              
              return (
                <Link key={item.name} href={item.href}>
                  <div
                    className={cn(
                      "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 cursor-pointer group",
                      active
                        ? "bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900"
                        : "text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-gray-100"
                    )}
                    data-testid={`sidebar-${item.name.toLowerCase()}`}
                  >
                    <Icon className="w-5 h-5 flex-shrink-0" />
                    <span className="flex-1">{item.name}</span>
                  </div>
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Library Section */}
        <div>
          <h3 className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3 px-2">
            LIBRARY
          </h3>
          <nav className="space-y-1">
            {libraryItems.map((item) => {
              const Icon = item.icon;
              const active = isActive(item.href);
              
              return (
                <Link key={item.name} href={item.href}>
                  <div
                    className={cn(
                      "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 cursor-pointer",
                      active
                        ? "bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900"
                        : "text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-gray-100"
                    )}
                    data-testid={`sidebar-${item.name.toLowerCase().replace(/\s+/g, '-')}`}
                  >
                    <Icon className="w-5 h-5 flex-shrink-0" />
                    <span>{item.name}</span>
                  </div>
                </Link>
              );
            })}
          </nav>
        </div>

        {/* General Section */}
        <div>
          <h3 className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3 px-2">
            GENERAL
          </h3>
          <nav className="space-y-1">
            {generalItems.map((item) => {
              const Icon = item.icon;
              const active = isActive(item.href);
              
              return (
                <Link key={item.name} href={item.href}>
                  <div
                    className={cn(
                      "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 cursor-pointer",
                      active
                        ? "bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900"
                        : "text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-gray-100"
                    )}
                    data-testid={`sidebar-${item.name.toLowerCase()}`}
                  >
                    <Icon className="w-5 h-5 flex-shrink-0" />
                    <span>{item.name}</span>
                  </div>
                </Link>
              );
            })}
          </nav>
        </div>
      </div>

      {/* Music Player Promotion Card */}
      <div className="p-4">
        <div className="bg-purple-600 dark:bg-purple-700 rounded-xl p-4 text-white">
          <div className="flex items-start gap-3 mb-3">
            <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center flex-shrink-0">
              <Music className="w-5 h-5" />
            </div>
            <div className="flex-1">
              <h4 className="font-medium text-sm mb-1">Discover new</h4>
              <h4 className="font-medium text-sm">Music</h4>
              <p className="text-xs text-purple-100 mt-1">
                Explore our music library
              </p>
            </div>
          </div>
          <Button 
            size="sm" 
            className="w-full bg-white/20 hover:bg-white/30 text-white border-0"
            data-testid="button-explore-music"
            onClick={() => window.location.href = '/search'}
          >
            <Search className="w-4 h-4 mr-2" />
            Explore
          </Button>
        </div>
      </div>
    </div>
  );
}