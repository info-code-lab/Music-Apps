import { useState } from "react";
import { Link, useLocation } from "wouter";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";
import { PhoneLoginModal } from "@/components/PhoneLoginModal";
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
  Library,
  Sparkles,
  TrendingUp,
  Clock
} from "lucide-react";

const menuItems = [
  {
    name: "Home",
    href: "/",
    icon: Home,
    section: "menu"
  },
  {
    name: "New Releases",
    href: "/new-releases",
    icon: Sparkles,
    section: "discover"
  },
  {
    name: "Top Charts",
    href: "/top-charts",
    icon: TrendingUp,
    section: "discover"
  },
  {
    name: "Top Playlists",
    href: "/top-playlists",
    icon: ListMusic,
    section: "discover"
  },
  {
    name: "Top Artists",
    href: "/top-artists",
    icon: Users,
    section: "discover"
  }
];

const libraryItems = [
  {
    name: "History",
    href: "/history",
    icon: Clock,
    section: "library"
  },
  {
    name: "Favorites",
    href: "/favorites",
    icon: Heart,
    section: "library"
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

const generalItems = [
  {
    name: "Profile",
    href: "/profile",
    icon: User,
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
  const { user } = useAuth();
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);

  const isActive = (href: string) => {
    // Exact match for home page to prevent it from matching all routes
    if (href === "/") return location === "/";
    
    // For all other routes, use exact match to prevent conflicts
    return location === href;
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

    </div>
  );
}