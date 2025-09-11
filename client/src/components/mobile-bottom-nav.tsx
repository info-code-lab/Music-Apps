import { Link, useLocation } from "wouter";
import { Home, Search, Heart, User, Library } from "lucide-react";
import { cn } from "@/lib/utils";

export default function MobileBottomNav() {
  const [location] = useLocation();

  const navItems = [
    { 
      label: "Home", 
      icon: Home, 
      href: "/", 
      active: location === "/" 
    },
    { 
      label: "Search", 
      icon: Search, 
      href: "/search", 
      active: location === "/search" 
    },
    { 
      label: "Library", 
      icon: Library, 
      href: "/my-library", 
      active: location.startsWith("/my-library") || location.startsWith("/songs") || location.startsWith("/albums") || location.startsWith("/artists") || location.startsWith("/playlists") || location.startsWith("/favorites") 
    },
    { 
      label: "Favorites", 
      icon: Heart, 
      href: "/favorites", 
      active: location === "/favorites" 
    },
    { 
      label: "Profile", 
      icon: User, 
      href: "/profile", 
      active: location === "/profile" 
    },
  ];

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-background border-t border-border lg:hidden z-40">
      <div className="flex items-center justify-around px-2 py-1 safe-area-pb">
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <Link key={item.href} href={item.href}>
              <button
                className={cn(
                  "flex flex-col items-center justify-center p-2 min-w-[4rem] transition-colors",
                  item.active 
                    ? "text-primary" 
                    : "text-muted-foreground hover:text-foreground"
                )}
                data-testid={`mobile-nav-${item.label.toLowerCase()}`}
              >
                <Icon 
                  className={cn(
                    "w-5 h-5 mb-1",
                    item.active && "fill-current"
                  )} 
                />
                <span className="text-[10px] font-medium leading-none">
                  {item.label}
                </span>
              </button>
            </Link>
          );
        })}
      </div>
    </div>
  );
}