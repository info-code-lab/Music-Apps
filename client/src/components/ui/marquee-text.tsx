import { useEffect, useRef, useState } from "react";
import Marquee from "react-fast-marquee";

interface MarqueeTextProps {
  text: string;
  className?: string;
  speed?: number;
  maxWidth?: number;
  children?: React.ReactNode;
}

export default function MarqueeText({ 
  text, 
  className = "", 
  speed = 50, 
  maxWidth = 150, // Default max width for mobile/small containers
  children 
}: MarqueeTextProps) {
  const [shouldMarquee, setShouldMarquee] = useState(false);

  useEffect(() => {
    // Simple check based on text length and mobile/desktop detection
    const isMobile = window.innerWidth < 768;
    const threshold = isMobile ? 12 : 20; // Characters threshold
    
    // Enable marquee for longer text or when maxWidth is small
    setShouldMarquee(text.length > threshold || maxWidth < 200);
  }, [text, maxWidth]);

  if (shouldMarquee) {
    return (
      <Marquee 
        className={className}
        speed={speed}
        pauseOnHover
        gradient
        gradientWidth={10}
        gradientColor="rgba(255,255,255,0)"
      >
        {text}&nbsp;&nbsp;&nbsp;&nbsp;
      </Marquee>
    );
  }

  return (
    <span className={`truncate ${className}`}>{children || text}</span>
  );
}