import { useState, useEffect, useRef } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Search, X, TrendingUp, Clock, Music, Users, Disc } from "lucide-react";
import { cn } from "@/lib/utils";

interface SearchSuggestion {
  id: string;
  text: string;
  type: 'song' | 'artist' | 'album' | 'trending' | 'recent';
  count?: number;
}

interface EnhancedSearchProps {
  onSearch?: (query: string) => void;
  searchQuery?: string;
  className?: string;
}

export default function EnhancedSearch({ 
  onSearch, 
  searchQuery = "",
  className = ""
}: EnhancedSearchProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [inputValue, setInputValue] = useState(searchQuery);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const searchRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Mock trending searches - in real app, get from API
  const trendingSearches: SearchSuggestion[] = [
    { id: '1', text: 'Arijit Singh hits', type: 'trending', count: 12400 },
    { id: '2', text: 'Classical piano', type: 'trending', count: 8900 },
    { id: '3', text: 'Bollywood romantic', type: 'trending', count: 7800 },
    { id: '4', text: 'Electronic dance', type: 'trending', count: 6500 },
    { id: '5', text: 'Rock classics', type: 'trending', count: 5200 },
  ];

  // Load recent searches from localStorage
  useEffect(() => {
    const stored = localStorage.getItem('recentSearches');
    if (stored) {
      setRecentSearches(JSON.parse(stored));
    }
  }, []);

  // Save recent searches to localStorage
  const saveRecentSearch = (query: string) => {
    if (!query.trim()) return;
    
    const updated = [query, ...recentSearches.filter(s => s !== query)].slice(0, 5);
    setRecentSearches(updated);
    localStorage.setItem('recentSearches', JSON.stringify(updated));
  };

  // Handle search input change
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setInputValue(value);
    onSearch?.(value);
  };

  // Handle search submission
  const handleSearch = (query: string) => {
    if (query.trim()) {
      saveRecentSearch(query.trim());
      onSearch?.(query.trim());
      setIsOpen(false);
    }
  };

  // Handle suggestion click
  const handleSuggestionClick = (suggestion: SearchSuggestion) => {
    setInputValue(suggestion.text);
    handleSearch(suggestion.text);
  };

  // Clear recent searches
  const clearRecentSearches = () => {
    setRecentSearches([]);
    localStorage.removeItem('recentSearches');
  };

  // Handle click outside to close dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Sync with external searchQuery
  useEffect(() => {
    setInputValue(searchQuery);
  }, [searchQuery]);

  const getIconForType = (type: string) => {
    switch (type) {
      case 'song': return <Music className="w-4 h-4" />;
      case 'artist': return <Users className="w-4 h-4" />;
      case 'album': return <Disc className="w-4 h-4" />;
      case 'trending': return <TrendingUp className="w-4 h-4" />;
      case 'recent': return <Clock className="w-4 h-4" />;
      default: return <Search className="w-4 h-4" />;
    }
  };

  const recentSuggestions: SearchSuggestion[] = recentSearches.map((search, index) => ({
    id: `recent-${index}`,
    text: search,
    type: 'recent'
  }));

  return (
    <div ref={searchRef} className={cn("relative w-full max-w-2xl", className)}>
      {/* Enhanced Search Input */}
      <div className="relative">
        <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-muted-foreground w-5 h-5" />
        <Input
          ref={inputRef}
          type="text"
          placeholder="What do you want to listen to?"
          className="pl-12 pr-12 py-4 text-lg bg-white dark:bg-gray-900 border-2 border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 focus:border-primary dark:focus:border-primary rounded-full shadow-lg transition-all duration-200 font-medium"
          value={inputValue}
          onChange={handleInputChange}
          onFocus={() => setIsOpen(true)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              handleSearch(inputValue);
            }
            if (e.key === 'Escape') {
              setIsOpen(false);
            }
          }}
          data-testid="enhanced-search-input"
        />
        {inputValue && (
          <Button
            variant="ghost"
            size="sm"
            className="absolute right-3 top-1/2 transform -translate-y-1/2 p-1 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full"
            onClick={() => {
              setInputValue('');
              onSearch?.('');
              inputRef.current?.focus();
            }}
            data-testid="clear-search"
          >
            <X className="w-4 h-4" />
          </Button>
        )}
      </div>

      {/* Search Dropdown */}
      {isOpen && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-2xl shadow-2xl z-50 max-h-96 overflow-y-auto">
          <div className="p-4">
            {/* Recent Searches */}
            {recentSuggestions.length > 0 && (
              <div className="mb-6">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
                    <Clock className="w-4 h-4" />
                    Recent searches
                  </h3>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={clearRecentSearches}
                    className="text-xs text-muted-foreground hover:text-foreground"
                    data-testid="clear-recent-searches"
                  >
                    Clear all
                  </Button>
                </div>
                <div className="space-y-1">
                  {recentSuggestions.map((suggestion) => (
                    <div
                      key={suggestion.id}
                      className="flex items-center gap-3 p-2 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-lg cursor-pointer transition-colors"
                      onClick={() => handleSuggestionClick(suggestion)}
                      data-testid={`recent-search-${suggestion.id}`}
                    >
                      {getIconForType(suggestion.type)}
                      <span className="text-sm text-foreground">{suggestion.text}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Trending Searches */}
            <div>
              <h3 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
                <TrendingUp className="w-4 h-4" />
                Trending searches
              </h3>
              <div className="space-y-1">
                {trendingSearches.map((suggestion) => (
                  <div
                    key={suggestion.id}
                    className="flex items-center justify-between p-2 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-lg cursor-pointer transition-colors group"
                    onClick={() => handleSuggestionClick(suggestion)}
                    data-testid={`trending-search-${suggestion.id}`}
                  >
                    <div className="flex items-center gap-3">
                      {getIconForType(suggestion.type)}
                      <span className="text-sm text-foreground">{suggestion.text}</span>
                    </div>
                    {suggestion.count && (
                      <Badge variant="secondary" className="text-xs group-hover:bg-gray-200 dark:group-hover:bg-gray-700">
                        {suggestion.count.toLocaleString()}
                      </Badge>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Quick Filters */}
            <div className="mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
              <h3 className="text-sm font-semibold text-foreground mb-3">Browse by category</h3>
              <div className="flex flex-wrap gap-2">
                {[
                  { label: 'Songs', icon: Music, color: 'bg-blue-500' },
                  { label: 'Artists', icon: Users, color: 'bg-green-500' },
                  { label: 'Albums', icon: Disc, color: 'bg-purple-500' },
                ].map(({ label, icon: Icon, color }) => (
                  <Button
                    key={label}
                    variant="outline"
                    size="sm"
                    className="flex items-center gap-2 hover:bg-gray-50 dark:hover:bg-gray-800"
                    onClick={() => handleSuggestionClick({ id: label, text: label.toLowerCase(), type: 'trending' })}
                    data-testid={`category-${label.toLowerCase()}`}
                  >
                    <div className={cn("w-3 h-3 rounded-full", color)} />
                    {label}
                  </Button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}