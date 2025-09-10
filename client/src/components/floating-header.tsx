import { useState } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Bell, Mail, Settings, User, LogOut } from "lucide-react";
import EnhancedSearch from "@/components/enhanced-search";

interface FloatingHeaderProps {
  onSearch?: (query: string) => void;
  searchQuery?: string;
  showSearch?: boolean;
}

export default function FloatingHeader({ 
  onSearch, 
  searchQuery = "", 
  showSearch = true 
}: FloatingHeaderProps) {
  const [, setLocation] = useLocation();
  
  // Mock user data - TODO: Get from actual user context/API
  const user = {
    name: "Tokok Michael",
    email: "tmichael00@gmail.com",
    avatar: null,
  };

  const handleSearchChange = (query: string) => {
    onSearch?.(query);
  };

  return (
    <div className="fixed top-3 left-3 right-3 z-40 lg:left-60 hidden lg:block">
      <div className="bg-white/95 dark:bg-gray-950/95 backdrop-blur-md rounded-2xl shadow-xl border border-gray-200/50 dark:border-gray-800/50 px-6 py-4">
        <div className="flex items-center justify-between gap-6">
          {/* Enhanced Search Section */}
          <div className="flex-1">
            {showSearch && (
              <EnhancedSearch
                onSearch={handleSearchChange}
                searchQuery={searchQuery}
                className="max-w-2xl"
              />
            )}
          </div>

          {/* Right Section - Notifications and User */}
          <div className="flex items-center space-x-3">
            {/* Mail/Messages */}
            <Button 
              variant="ghost" 
              size="sm" 
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg"
              data-testid="button-messages"
            >
              <Mail className="w-5 h-5 text-gray-600 dark:text-gray-400" />
            </Button>

            {/* Notifications */}
            <Button 
              variant="ghost" 
              size="sm" 
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg"
              data-testid="button-notifications"
            >
              <Bell className="w-5 h-5 text-gray-600 dark:text-gray-400" />
            </Button>

            {/* User Profile Dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <div className="flex items-center space-x-3 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg p-2 transition-colors">
                  <Avatar className="w-8 h-8">
                    <AvatarImage src={user.avatar || undefined} alt={user.name} />
                    <AvatarFallback className="bg-gradient-to-br from-purple-500 to-pink-500 text-white text-sm font-medium">
                      {user.name.split(' ').map(n => n[0]).join('')}
                    </AvatarFallback>
                  </Avatar>
                  <div className="hidden md:block text-left">
                    <div className="text-sm font-medium text-gray-900 dark:text-white">
                      {user.name}
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">
                      {user.email}
                    </div>
                  </div>
                </div>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuItem onClick={() => setLocation('/profile')}>
                  <User className="w-4 h-4 mr-2" />
                  Profile
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setLocation('/settings')}>
                  <Settings className="w-4 h-4 mr-2" />
                  Settings
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <LogOut className="w-4 h-4 mr-2" />
                  Sign out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>
    </div>
  );
}