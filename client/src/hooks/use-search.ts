import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import type { SearchResult } from "@shared/schema";

export function useSearch() {
  const [searchQuery, setSearchQuery] = useState("");

  // Main unified search using the /api/search endpoint
  const { data: searchResults, isLoading } = useQuery<SearchResult>({
    queryKey: ["/api/search", { q: searchQuery }],
    enabled: !!searchQuery,
  });

  const handleSearch = (query: string) => {
    setSearchQuery(query);
  };

  const clearSearch = () => {
    setSearchQuery("");
  };

  return {
    searchQuery,
    searchResults,
    isLoading,
    handleSearch,
    clearSearch,
  };
}