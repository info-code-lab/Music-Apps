import { useState } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Music, 
  Users, 
  Disc, 
  UserIcon, 
  BarChart3, 
  Upload,
  Settings,
  LogOut,
  Menu,
  X,
  Home,
  Tags
} from "lucide-react";
import toast from "react-hot-toast";

interface AdminLayoutProps {
  children: React.ReactNode;
}

const navigation = [
  { name: 'Dashboard', href: '/admin', icon: BarChart3 },
  { name: 'Songs', href: '/admin/tracks', icon: Music },
  { name: 'Artists', href: '/admin/artists', icon: UserIcon },
  { name: 'Albums', href: '/admin/albums', icon: Disc },
  { name: 'Categories', href: '/admin/categories', icon: Tags },
  { name: 'Users', href: '/admin/users', icon: Users },
  { name: 'Upload', href: '/admin/upload', icon: Upload },
  { name: 'Settings', href: '/admin/settings', icon: Settings },
];

export default function AdminLayout({ children }: AdminLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [location, setLocation] = useLocation();
  const { user, logoutMutation } = useAuth();

  // Redirect if not admin
  if (!user || user.role !== 'admin') {
    setLocation("/admin/login");
    return null;
  }

  const handleLogout = async () => {
    await logoutMutation.mutateAsync();
    setLocation("/");
  };

  const isCurrentPath = (path: string) => {
    if (path === '/admin' && location === '/admin') return true;
    if (path !== '/admin' && location.startsWith(path)) return true;
    return false;
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex">
      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        >
          <div className="fixed inset-0 bg-gray-600 bg-opacity-75" />
        </div>
      )}

      {/* Sidebar */}
      <div className={`fixed inset-y-0 left-0 z-50 w-64 bg-white dark:bg-gray-800 shadow-lg transform transition-transform duration-300 ease-in-out lg:translate-x-0 lg:sticky lg:top-0 lg:h-screen lg:flex lg:flex-col ${
        sidebarOpen ? 'translate-x-0' : '-translate-x-full'
      }`}>
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="flex items-center justify-between h-16 px-4 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center gap-2">
              <div className="p-2 bg-purple-600 rounded-lg">
                <Music className="h-6 w-6 text-white" />
              </div>
              <h1 className="text-lg font-bold text-gray-900 dark:text-white">Admin Panel</h1>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSidebarOpen(false)}
              className="lg:hidden"
              data-testid="button-close-sidebar"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>

          {/* User info moved to header */}

          {/* Navigation */}
          <nav className="flex-1 px-4 py-4 space-y-1">
            {navigation.map((item) => {
              const Icon = item.icon;
              const current = isCurrentPath(item.href);
              
              return (
                <button
                  key={item.name}
                  onClick={() => {
                    setLocation(item.href);
                    setSidebarOpen(false);
                  }}
                  className={`w-full flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                    current
                      ? 'bg-purple-100 text-purple-600 dark:bg-purple-900 dark:text-purple-300'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100 dark:text-gray-400 dark:hover:text-white dark:hover:bg-gray-700'
                  }`}
                  data-testid={`nav-${item.name.toLowerCase()}`}
                >
                  <Icon className="h-5 w-5" />
                  {item.name}
                </button>
              );
            })}
          </nav>

          {/* Footer */}
          <div className="p-4 border-t border-gray-200 dark:border-gray-700 space-y-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setLocation("/")}
              className="w-full justify-start"
              data-testid="button-view-site"
            >
              <Home className="h-4 w-4 mr-2" />
              View Site
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleLogout}
              disabled={logoutMutation.isPending}
              className="w-full justify-start text-red-600 border-red-200 hover:bg-red-50 hover:text-red-700"
              data-testid="button-logout"
            >
              <LogOut className="h-4 w-4 mr-2" />
              {logoutMutation.isPending ? "Logging out..." : "Logout"}
            </Button>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 flex flex-col lg:pl-0">
        {/* Top bar */}
        <div className="sticky top-0 z-40 bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between h-16 px-4">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSidebarOpen(true)}
                className="lg:hidden"
                data-testid="button-open-sidebar"
              >
                <Menu className="h-5 w-5" />
              </Button>
              
              {/* User profile in header */}
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
                  <UserIcon className="h-4 w-4 text-purple-600" />
                </div>
                <div className="hidden sm:block">
                  <p className="text-sm font-medium text-gray-900 dark:text-white">{user.username}</p>
                  <Badge variant="outline" className="text-xs text-purple-600 border-purple-600">
                    Admin
                  </Badge>
                </div>
              </div>
            </div>
            
            <div className="flex items-center gap-4">
              <span className="text-sm text-gray-500 dark:text-gray-400">
                Last updated: {new Date().toLocaleDateString()}
              </span>
            </div>
          </div>
        </div>

        {/* Page content */}
        <main className="flex-1 p-6 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
}