import { ReactNode } from "react";
import FloatingSidebar from "./floating-sidebar";
import MobileBottomNav from "./mobile-bottom-nav";
import { useMusicPlayer } from "@/hooks/use-music-player";

interface MainLayoutProps {
  children: ReactNode;
}

export default function MainLayout({ children }: MainLayoutProps) {
  const { currentSong } = useMusicPlayer();

  return (
    <div className="min-h-screen bg-gray-50/50 dark:bg-gray-900/50">
      {/* Floating Sidebar - Only on desktop */}
      <div className="hidden lg:block">
        <FloatingSidebar />
      </div>

      {/* Main Content */}
      <div className="lg:ml-72">
        <main className={`min-h-screen ${currentSong ? 'pb-44' : 'pb-20'} md:pb-32`}>
          {children}
        </main>
      </div>

      {/* Mobile Bottom Navigation */}
      <MobileBottomNav />
    </div>
  );
}