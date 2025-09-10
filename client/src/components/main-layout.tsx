import { ReactNode } from "react";
import FloatingSidebar from "./floating-sidebar";
import FloatingHeader from "./floating-header";
import MobileBottomNav from "./mobile-bottom-nav";
import { useMusicPlayer } from "@/hooks/use-music-player";

interface MainLayoutProps {
  children: ReactNode;
  onSearch?: (query: string) => void;
  searchQuery?: string;
  showSearch?: boolean;
}

export default function MainLayout({ 
  children, 
  onSearch, 
  searchQuery = "", 
  showSearch = true 
}: MainLayoutProps) {
  const { currentSong } = useMusicPlayer();

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900 p-4 lg:p-6">
      {/* Main Container - Full floating design */}
      <div className="max-w-[1400px] mx-auto bg-white dark:bg-gray-950 rounded-3xl shadow-2xl border border-gray-200/50 dark:border-gray-800/50 overflow-hidden min-h-[calc(100vh-2rem)] lg:min-h-[calc(100vh-3rem)] flex">
        
        {/* Floating Sidebar - Integrated */}
        <div className="hidden lg:block w-64 border-r border-gray-200/50 dark:border-gray-800/50">
          <div className="p-6">
            <FloatingSidebar />
          </div>
        </div>

        {/* Main Content Area */}
        <div className="flex-1 flex flex-col">
          {/* Floating Header - Integrated */}
          <div className="hidden lg:block border-b border-gray-200/50 dark:border-gray-800/50">
            <div className="p-4">
              <FloatingHeader 
                onSearch={onSearch}
                searchQuery={searchQuery}
                showSearch={showSearch}
              />
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-auto">
            <div className="p-4 lg:p-6">
              {children}
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Bottom Navigation */}
      <MobileBottomNav />
    </div>
  );
}