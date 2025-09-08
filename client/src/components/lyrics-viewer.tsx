import { useState, useEffect, useRef } from "react";
import { 
  Scroll, 
  Type, 
  Eye, 
  EyeOff, 
  Settings, 
  Download,
  Share2,
  Volume2,
  VolumeX,
  Maximize2,
  Minimize2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Slider } from "@/components/ui/slider";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel
} from "@/components/ui/dropdown-menu";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { Song } from "@shared/schema";

interface LyricsLine {
  timestamp: number; // in seconds
  text: string;
  translation?: string;
}

interface LyricsViewerProps {
  song: Song;
  currentTime: number;
  isPlaying: boolean;
  onSeek?: (time: number) => void;
  className?: string;
}

export default function LyricsViewer({ 
  song, 
  currentTime, 
  isPlaying,
  onSeek,
  className = ""
}: LyricsViewerProps) {
  const [lyricsLines, setLyricsLines] = useState<LyricsLine[]>([]);
  const [currentLineIndex, setCurrentLineIndex] = useState(-1);
  const [fontSize, setFontSize] = useState([16]);
  const [showTranslation, setShowTranslation] = useState(false);
  const [autoScroll, setAutoScroll] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [fontFamily, setFontFamily] = useState('inter');
  const [theme, setTheme] = useState('dark');
  
  const lyricsRef = useRef<HTMLDivElement>(null);
  const activeLineRef = useRef<HTMLDivElement>(null);

  // Parse lyrics from song data
  useEffect(() => {
    if (song.lyrics) {
      try {
        // Try to parse timestamped lyrics (LRC format)
        const lines = parseLRCLyrics(song.lyrics);
        setLyricsLines(lines);
      } catch {
        // Fallback to plain text lyrics
        const lines = song.lyrics.split('\n').map((text, index) => ({
          timestamp: index * 4, // Assume 4 seconds per line
          text: text.trim()
        }));
        setLyricsLines(lines);
      }
    }
  }, [song.lyrics]);

  // Update current line based on playback time
  useEffect(() => {
    if (lyricsLines.length === 0) return;

    const lineIndex = lyricsLines.findIndex((line, index) => {
      const nextLine = lyricsLines[index + 1];
      return currentTime >= line.timestamp && 
             (!nextLine || currentTime < nextLine.timestamp);
    });

    setCurrentLineIndex(lineIndex);
  }, [currentTime, lyricsLines]);

  // Auto-scroll to current line
  useEffect(() => {
    if (autoScroll && activeLineRef.current && currentLineIndex >= 0) {
      activeLineRef.current.scrollIntoView({
        behavior: 'smooth',
        block: 'center'
      });
    }
  }, [currentLineIndex, autoScroll]);

  const parseLRCLyrics = (lyricsText: string): LyricsLine[] => {
    const lines: LyricsLine[] = [];
    const lrcLines = lyricsText.split('\n');
    
    for (const line of lrcLines) {
      const match = line.match(/\[(\d{2}):(\d{2})\.(\d{2})\](.*)/);
      if (match) {
        const [, minutes, seconds, centiseconds, text] = match;
        const timestamp = parseInt(minutes) * 60 + 
                         parseInt(seconds) + 
                         parseInt(centiseconds) / 100;
        
        lines.push({
          timestamp,
          text: text.trim()
        });
      }
    }
    
    return lines.sort((a, b) => a.timestamp - b.timestamp);
  };

  const handleLineClick = (timestamp: number) => {
    if (onSeek) {
      onSeek(timestamp);
    }
  };

  const downloadLyrics = () => {
    const lyricsText = lyricsLines.map(line => line.text).join('\n');
    const blob = new Blob([lyricsText], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = `${song.title}-lyrics.txt`;
    a.click();
    
    URL.revokeObjectURL(url);
  };

  const shareLyrics = async () => {
    const lyricsText = lyricsLines.map(line => line.text).join('\n');
    
    if (navigator.share) {
      try {
        await navigator.share({
          title: `${song.title} - Lyrics`,
          text: lyricsText
        });
      } catch (err) {
        console.log('Share cancelled');
      }
    } else {
      // Fallback: copy to clipboard
      await navigator.clipboard.writeText(lyricsText);
      // Show toast notification here
    }
  };

  const fontFamilies = [
    { value: 'inter', label: 'Inter' },
    { value: 'serif', label: 'Serif' },
    { value: 'mono', label: 'Monospace' },
    { value: 'cursive', label: 'Cursive' }
  ];

  const themes = [
    { value: 'dark', label: 'Dark' },
    { value: 'light', label: 'Light' },
    { value: 'gradient', label: 'Gradient' },
    { value: 'minimal', label: 'Minimal' }
  ];

  if (!song.lyrics) {
    return (
      <Card className={className}>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <Scroll className="h-12 w-12 text-muted-foreground mb-4" />
          <p className="text-muted-foreground text-center">
            No lyrics available for this track
          </p>
          <p className="text-sm text-muted-foreground mt-2">
            Lyrics will appear here when available
          </p>
        </CardContent>
      </Card>
    );
  }

  const containerClass = isFullscreen ? 
    "fixed inset-0 z-50 bg-background" : 
    `${className}`;

  const lyricsThemeClass = {
    dark: "bg-background text-foreground",
    light: "bg-white text-black",
    gradient: "bg-gradient-to-b from-purple-900 to-blue-900 text-white",
    minimal: "bg-gray-50 text-gray-900"
  }[theme];

  return (
    <Card className={containerClass}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
        <div className="flex items-center gap-3">
          <Scroll className="h-5 w-5" />
          <div>
            <CardTitle className="text-lg">{song.title}</CardTitle>
            <p className="text-sm text-muted-foreground">Lyrics</p>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          {/* Font Size Control */}
          <div className="flex items-center gap-2 min-w-[100px]">
            <Type className="h-4 w-4" />
            <Slider
              value={fontSize}
              onValueChange={setFontSize}
              min={12}
              max={24}
              step={1}
              className="w-16"
              data-testid="slider-font-size"
            />
          </div>

          {/* Auto-scroll Toggle */}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setAutoScroll(!autoScroll)}
            className={autoScroll ? "text-blue-500" : ""}
            data-testid="button-auto-scroll"
          >
            <Eye className="h-4 w-4" />
          </Button>

          {/* Translation Toggle */}
          {lyricsLines.some(line => line.translation) && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowTranslation(!showTranslation)}
              className={showTranslation ? "text-blue-500" : ""}
              data-testid="button-translation"
            >
              <Type className="h-4 w-4" />
            </Button>
          )}

          {/* Settings Menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" data-testid="button-lyrics-settings">
                <Settings className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuLabel>Appearance</DropdownMenuLabel>
              
              {fontFamilies.map((font) => (
                <DropdownMenuItem
                  key={font.value}
                  onClick={() => setFontFamily(font.value)}
                  className={fontFamily === font.value ? "bg-accent" : ""}
                >
                  {font.label} {fontFamily === font.value && "✓"}
                </DropdownMenuItem>
              ))}
              
              <DropdownMenuSeparator />
              <DropdownMenuLabel>Theme</DropdownMenuLabel>
              
              {themes.map((themeOption) => (
                <DropdownMenuItem
                  key={themeOption.value}
                  onClick={() => setTheme(themeOption.value)}
                  className={theme === themeOption.value ? "bg-accent" : ""}
                >
                  {themeOption.label} {theme === themeOption.value && "✓"}
                </DropdownMenuItem>
              ))}
              
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={downloadLyrics}>
                <Download className="h-4 w-4 mr-2" />
                Download
              </DropdownMenuItem>
              <DropdownMenuItem onClick={shareLyrics}>
                <Share2 className="h-4 w-4 mr-2" />
                Share
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Fullscreen Toggle */}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsFullscreen(!isFullscreen)}
            data-testid="button-fullscreen"
          >
            {isFullscreen ? (
              <Minimize2 className="h-4 w-4" />
            ) : (
              <Maximize2 className="h-4 w-4" />
            )}
          </Button>
        </div>
      </CardHeader>

      <CardContent className={`${lyricsThemeClass} transition-colors duration-300`}>
        <div 
          ref={lyricsRef}
          className="space-y-3 max-h-96 overflow-y-auto scrollbar-thin scrollbar-thumb-muted"
          style={{ fontFamily: fontFamily === 'inter' ? 'inherit' : fontFamily }}
        >
          {lyricsLines.map((line, index) => (
            <div
              key={index}
              ref={index === currentLineIndex ? activeLineRef : null}
              className={`cursor-pointer transition-all duration-300 p-2 rounded-lg ${
                index === currentLineIndex
                  ? 'bg-accent text-accent-foreground font-semibold scale-105 shadow-sm'
                  : 'hover:bg-accent/50 text-muted-foreground'
              }`}
              style={{ fontSize: `${fontSize[0]}px` }}
              onClick={() => handleLineClick(line.timestamp)}
              data-testid={`lyrics-line-${index}`}
            >
              <div className="leading-relaxed">
                {line.text}
              </div>
              
              {showTranslation && line.translation && (
                <div className="text-sm opacity-75 mt-1 italic">
                  {line.translation}
                </div>
              )}
              
              <div className="text-xs opacity-50 mt-1">
                {formatTime(line.timestamp)}
              </div>
            </div>
          ))}
        </div>
        
        {/* Progress Indicator */}
        <div className="mt-4 flex items-center gap-2 text-sm text-muted-foreground">
          <Volume2 className="h-4 w-4" />
          <span>
            Line {currentLineIndex + 1} of {lyricsLines.length}
          </span>
          {isPlaying && <Badge variant="outline">Playing</Badge>}
        </div>
      </CardContent>
    </Card>
  );
}

function formatTime(seconds: number): string {
  const minutes = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${minutes}:${secs.toString().padStart(2, '0')}`;
}