import { useState, useEffect, useRef } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, X } from "lucide-react";
import { cn } from "@/lib/utils";

interface SimpleSearchProps {
  onSearch?: (query: string) => void;
  searchQuery?: string;
  className?: string;
  placeholder?: string;
}

export default function SimpleSearch({ 
  onSearch, 
  searchQuery = "",
  className = "",
  placeholder = "Search for songs, artists, albums..."
}: SimpleSearchProps) {
  const [inputValue, setInputValue] = useState(searchQuery);
  const inputRef = useRef<HTMLInputElement>(null);

  // Handle search input change
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setInputValue(value);
    onSearch?.(value);
  };

  // Handle search submission
  const handleSearch = (query: string) => {
    if (query.trim()) {
      onSearch?.(query.trim());
    }
  };

  // Clear search
  const clearSearch = () => {
    setInputValue('');
    onSearch?.('');
    inputRef.current?.focus();
  };

  // Sync with external searchQuery
  useEffect(() => {
    setInputValue(searchQuery);
  }, [searchQuery]);

  return (
    <div className={cn("relative w-full", className)}>
      {/* Simple Search Input - JioSaavn Style */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
        <Input
          ref={inputRef}
          type="text"
          placeholder={placeholder}
          className="pl-10 pr-10 py-2 bg-background border border-border hover:border-gray-300 dark:hover:border-gray-600 focus:border-primary dark:focus:border-primary rounded-md transition-all duration-200 text-sm"
          value={inputValue}
          onChange={handleInputChange}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              handleSearch(inputValue);
            }
          }}
          data-testid="simple-search-input"
        />
        {inputValue && (
          <Button
            variant="ghost"
            size="sm"
            className="absolute right-2 top-1/2 transform -translate-y-1/2 p-1 h-6 w-6 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full"
            onClick={clearSearch}
            data-testid="clear-search"
          >
            <X className="w-3 h-3" />
          </Button>
        )}
      </div>
    </div>
  );
}