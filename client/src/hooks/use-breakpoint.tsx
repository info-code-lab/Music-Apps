import { useState, useEffect } from 'react';

type Breakpoint = 'mobile' | 'tablet' | 'desktop';

export function useBreakpoint(): Breakpoint {
  const [breakpoint, setBreakpoint] = useState<Breakpoint>('desktop');

  useEffect(() => {
    const updateBreakpoint = () => {
      if (window.innerWidth < 768) {
        setBreakpoint('mobile');
      } else if (window.innerWidth < 1024) {
        setBreakpoint('tablet');
      } else {
        setBreakpoint('desktop');
      }
    };

    // Set initial breakpoint
    updateBreakpoint();

    // Create media query listeners
    const mobileQuery = window.matchMedia('(max-width: 767px)');
    const tabletQuery = window.matchMedia('(min-width: 768px) and (max-width: 1023px)');
    const desktopQuery = window.matchMedia('(min-width: 1024px)');

    const handleMobileChange = (e: MediaQueryListEvent) => {
      if (e.matches) setBreakpoint('mobile');
    };

    const handleTabletChange = (e: MediaQueryListEvent) => {
      if (e.matches) setBreakpoint('tablet');
    };

    const handleDesktopChange = (e: MediaQueryListEvent) => {
      if (e.matches) setBreakpoint('desktop');
    };

    // Add listeners
    mobileQuery.addEventListener('change', handleMobileChange);
    tabletQuery.addEventListener('change', handleTabletChange);
    desktopQuery.addEventListener('change', handleDesktopChange);

    // Cleanup
    return () => {
      mobileQuery.removeEventListener('change', handleMobileChange);
      tabletQuery.removeEventListener('change', handleTabletChange);
      desktopQuery.removeEventListener('change', handleDesktopChange);
    };
  }, []);

  return breakpoint;
}