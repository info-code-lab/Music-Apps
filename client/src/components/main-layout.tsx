import { ReactNode, useState } from "react";
import FloatingSidebar from "./floating-sidebar";
import FloatingHeader from "./floating-header";
import MobileHeader from "./mobile-header";
import MobileBottomNav from "./mobile-bottom-nav";
import MobileDrawer from "./mobile-drawer";
import { useMusicPlayer } from "@/hooks/use-music-player";
import { useLocation } from "wouter";

interface MainLayoutProps {
  children: ReactNode;
  onSearch?: (query: string) => void;
  searchQuery?: string;
  showSearch?: boolean;
  onCategorySelect?: (category: string) => void;
  selectedCategory?: string;
}

export default function MainLayout({
  children,
  onSearch,
  searchQuery = "",
  showSearch = true,
  onCategorySelect,
  selectedCategory = "All Categories",
}: MainLayoutProps) {
  const { currentSong } = useMusicPlayer();
  const [isMobileDrawerOpen, setIsMobileDrawerOpen] = useState(false);
  const [location] = useLocation();
  
  // Only show mobile header on home page
  const isHomePage = location === "/";

  return (
    <div className="min-h-screen bg-background">
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

      {/* Mobile Header - Only on home page and mobile/tablet (below lg) */}
      {isHomePage && (
        <MobileHeader
          onSearch={onSearch}
          searchQuery={searchQuery}
          showSearch={showSearch}
          onMenuToggle={() => setIsMobileDrawerOpen(true)}
        />
      )}

      {/* Mobile Drawer - Only on mobile/tablet (below lg) */}
      <MobileDrawer 
        isOpen={isMobileDrawerOpen}
        onClose={() => setIsMobileDrawerOpen(false)}
        onCategorySelect={onCategorySelect || (() => {})}
        selectedCategory={selectedCategory}
      />

      {/* Main Content */}
      <div className="lg:ml-60">
        <main
          className={`min-h-screen ${currentSong ? "pb-20 md:pb-32 lg:pb-6 lg:pt-12" : "pb-4 md:pb-16 lg:pb-4 lg:pt-12"}`}
        >
          <div
            className="lg:fixed lg:right-4 lg:bottom-4 lg:left-60 
            bg-background dark:bg-background rounded-2xl shadow-xl border border-border 
            lg:overflow-hidden 
                       lg:flex lg:flex-col"
            style={{ top: "6rem" }} // 26 * 0.25rem = 104px
          >
            <div className="lg:flex-1 lg:overflow-y-auto custom-scrollbar">
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
