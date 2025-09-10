import { useState } from "react";
import { useLocation } from "wouter";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, Bell, User } from "lucide-react";

interface DesktopHeaderProps {
  onSearch?: (query: string) => void;
  searchQuery?: string;
  placeholder?: string;
}

export default function DesktopHeader({ 
  onSearch, 
  searchQuery = "", 
  placeholder = "Search songs, artists, or albums..." 
}: DesktopHeaderProps) {
  const [, setLocation] = useLocation();

  return (
    <header className="sticky top-0 z-10 bg-background/95 backdrop-blur-sm border-b border-border p-6 hidden md:block">
      <div className="flex items-center justify-between">
        <div className="flex-1 max-w-md">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
            <Input
              type="text"
              placeholder={placeholder}
              className="pl-10 bg-input border-border font-serif"
              value={searchQuery}
              onChange={(e) => onSearch?.(e.target.value)}
              data-testid="input-search"
            />
          </div>
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