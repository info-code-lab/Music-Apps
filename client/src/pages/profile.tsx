import { useState } from "react";
import { useLocation } from "wouter";
import Sidebar from "@/components/sidebar";
import MobileHeader from "@/components/mobile-header";
import MobileBottomNav from "@/components/mobile-bottom-nav";
import MobileDrawer from "@/components/mobile-drawer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { 
  User, 
  Settings, 
  Music, 
  Heart, 
  Clock, 
  Users, 
  Download,
  Volume2,
  Palette,
  Bell,
  Shield,
  HelpCircle,
  LogOut,
  Search
} from "lucide-react";

export default function Profile() {
  const [isMobileDrawerOpen, setIsMobileDrawerOpen] = useState(false);
  const [, setLocation] = useLocation();

  // Mock user data - TODO: Get from actual user context/API
  const user = {
    name: "Music Lover",
    username: "@musiclover",
    email: "user@example.com",
    avatar: null,
    joinDate: "March 2024",
    plan: "Free",
  };

  const stats = [
    { label: "Songs Played", value: "1,234", icon: Music },
    { label: "Favorites", value: "89", icon: Heart },
    { label: "Listening Time", value: "45h", icon: Clock },
    { label: "Following", value: "12", icon: Users },
  ];

  const settingsItems = [
    { label: "Audio Quality", icon: Volume2, description: "Adjust playback settings" },
    { label: "Downloads", icon: Download, description: "Manage offline content" },
    { label: "Appearance", icon: Palette, description: "Customize your interface" },
    { label: "Notifications", icon: Bell, description: "Control alerts and updates" },
    { label: "Privacy & Security", icon: Shield, description: "Manage your data and security" },
    { label: "Help & Support", icon: HelpCircle, description: "Get help and contact support" },
  ];

  return (
    <div className="min-h-screen flex flex-col">
      <MobileHeader 
        onMenuToggle={() => setIsMobileDrawerOpen(true)}
        showSearch={false}
      />

      <MobileDrawer 
        isOpen={isMobileDrawerOpen}
        onClose={() => setIsMobileDrawerOpen(false)}
        onCategorySelect={() => {}}
        selectedCategory=""
      />

      <div className="flex flex-1">
        {/* Desktop Sidebar */}
        <div className="hidden md:block">
          <Sidebar 
            onCategorySelect={() => {}}
            selectedCategory=""
            recentSongs={[]}
          />
        </div>

        {/* Main Content */}
        <main className="flex-1 bg-background">
          {/* Desktop Header with Search */}
          <header className="sticky top-0 z-10 bg-background/95 backdrop-blur-sm border-b border-border p-6 hidden md:block">
            <div className="flex items-center justify-between">
              <div className="flex-1 max-w-md">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                  <Input
                    type="text"
                    placeholder="Search songs, artists, or albums..."
                    className="pl-10 bg-input border-border font-serif"
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
          
          <div className="p-4 md:p-8 max-w-4xl mx-auto pb-44 md:pb-8">
            {/* Profile Header */}
            <div className="flex flex-col md:flex-row items-start md:items-center space-y-4 md:space-y-0 md:space-x-6 mb-8">
              <Avatar className="w-24 h-24 md:w-32 md:h-32">
                <AvatarImage src={user.avatar || undefined} alt={user.name} />
                <AvatarFallback className="text-2xl md:text-3xl font-bold">
                  {user.name.split(' ').map(n => n[0]).join('')}
                </AvatarFallback>
              </Avatar>
              
              <div className="flex-1">
                <div className="flex flex-col md:flex-row md:items-center md:space-x-4 mb-2">
                  <h1 className="text-3xl font-bold text-foreground font-sans">
                    {user.name}
                  </h1>
                  <Badge variant="secondary" className="w-fit">
                    {user.plan} Plan
                  </Badge>
                </div>
                <p className="text-muted-foreground mb-2 font-mono">
                  {user.username}
                </p>
                <p className="text-sm text-muted-foreground mb-4">
                  Member since {user.joinDate}
                </p>
                <Button className="w-full md:w-auto">
                  <Settings className="w-4 h-4 mr-2" />
                  Edit Profile
                </Button>
              </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
              {stats.map((stat) => {
                const Icon = stat.icon;
                return (
                  <Card key={stat.label}>
                    <CardContent className="p-4 text-center">
                      <Icon className="w-6 h-6 mx-auto mb-2 text-primary" />
                      <div className="text-2xl font-bold text-foreground">
                        {stat.value}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {stat.label}
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>

            {/* Settings */}
            <Card className="mb-8">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Settings className="w-5 h-5" />
                  <span>Settings</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {settingsItems.map((item) => {
                  const Icon = item.icon;
                  return (
                    <div
                      key={item.label}
                      className="flex items-center justify-between p-3 rounded-lg hover:bg-muted transition-colors cursor-pointer"
                    >
                      <div className="flex items-center space-x-3">
                        <Icon className="w-5 h-5 text-muted-foreground" />
                        <div>
                          <div className="font-medium text-foreground">
                            {item.label}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            {item.description}
                          </div>
                        </div>
                      </div>
                      <div className="text-muted-foreground">›</div>
                    </div>
                  );
                })}
              </CardContent>
            </Card>

            {/* Account Actions */}
            <Card>
              <CardHeader>
                <CardTitle>Account</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <Button variant="outline" className="w-full justify-start">
                  <User className="w-4 h-4 mr-2" />
                  Account Settings
                </Button>
                <Button variant="outline" className="w-full justify-start text-destructive hover:text-destructive">
                  <LogOut className="w-4 h-4 mr-2" />
                  Sign Out
                </Button>
              </CardContent>
            </Card>
          </div>
        </main>
      </div>

      {/* Mobile Bottom Navigation */}
      <MobileBottomNav />
    </div>
  );
}