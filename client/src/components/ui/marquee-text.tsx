import { useEffect, useRef, useState } from "react";
import Marquee from "react-fast-marquee";

interface MarqueeTextProps {
  text: string;
  className?: string;
  speed?: number;
  threshold?: number;
  children?: React.ReactNode;
}

export default function MarqueeText({ 
  text, 
  className = "", 
  speed = 50, 
  threshold = 120,
  children 
}: MarqueeTextProps) {
  const textRef = useRef<HTMLSpanElement>(null);
  const [shouldMarquee, setShouldMarquee] = useState(false);

  useEffect(() => {
    if (textRef.current) {
      const textWidth = textRef.current.scrollWidth;
      const containerWidth = textRef.current.parentElement?.clientWidth || 0;
      
      // Use threshold for mobile responsiveness - smaller text needs marquee sooner
      setShouldMarquee(textWidth > Math.min(containerWidth, threshold));
    }
  }, [text, threshold]);

  if (shouldMarquee) {
    return (
      <div className={className}>
        <Marquee 
          speed={speed}
          pauseOnHover
          gradient
          gradientWidth={20}
          gradientColor="transparent"
        >
          {text}&nbsp;&nbsp;&nbsp;&nbsp;
        </Marquee>
      </div>
    );
  }

  return (
    <span ref={textRef} className={className}>
      {children || text}
    </span>
  );
}