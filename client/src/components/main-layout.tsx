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
    <div className="min-h-screen bg-gray-50/50 dark:bg-gray-900/50">
      {/* Floating Sidebar - Only on desktop */}
      <div className="hidden lg:block">
        <FloatingSidebar />
      </div>

      {/* Floating Header - Only on desktop */}
      <div className="hidden lg:block">
        <FloatingHeader 
          onSearch={onSearch}
          searchQuery={searchQuery}
          showSearch={showSearch}
        />
      </div>

      {/* Main Content */}
      <div className="lg:ml-60">
        <main className={`min-h-screen ${currentSong ? 'pb-' : 'pb-'} md:pb- lg:pt-`}>
          <div className="lg:fixed lg:right-3 lg:top-16 lg:bottom-3 lg:left-64 lg:bg-white lg:dark:bg-gray-950 lg:rounded-2xl lg:shadow-xl lg:border lg:border-gray-200 lg:dark:border-gray-800 lg:overflow-hidden lg:flex lg:flex-col">
            <div className="lg:flex-1 lg:overflow-auto lg:p-4 p-3">
              {children}
            </div>
          </div>
        </main>
      </div>

      {/* Mobile Bottom Navigation */}
      <MobileBottomNav />
    </div>
  );
}