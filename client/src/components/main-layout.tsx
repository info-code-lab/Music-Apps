import { ReactNode } from "react";
import FloatingSidebar from "./floating-sidebar";
import FloatingHeader from "./floating-header";
import MobileHeader from "./mobile-header";
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
  showSearch = true,
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

      {/* Mobile Header - Only on mobile/tablet (below lg) */}
      

      {/* Main Content */}
      <div className="lg:ml-60">
        <main
          className={`min-h-screen ${currentSong ? "pb-20" : "pb-4"} md:pb-6 lg:pt-12`}
        >
          <div
            className="lg:fixed lg:right-4 lg:bottom-4 lg:left-60 
            bg-white dark:bg-gray-950 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-800 
            lg:overflow-hidden 
                       lg:flex lg:flex-col"
            style={{ top: "6rem" }} // 26 * 0.25rem = 104px
          >
            <div className="lg:flex-1 lg:overflow-auto ">
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
