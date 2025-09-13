import { createContext, useContext, ReactNode } from "react";
import { invalidateAllSongQueries } from "@/lib/queryClient";

interface QueryInvalidationContextType {
  invalidateAllSongQueries: () => void;
}

const QueryInvalidationContext = createContext<QueryInvalidationContextType | null>(null);

export function QueryInvalidationProvider({ children }: { children: ReactNode }) {
  return (
    <QueryInvalidationContext.Provider value={{
      invalidateAllSongQueries
    }}>
      {children}
    </QueryInvalidationContext.Provider>
  );
}

export function useQueryInvalidation() {
  const context = useContext(QueryInvalidationContext);
  if (!context) {
    throw new Error('useQueryInvalidation must be used within a QueryInvalidationProvider');
  }
  return context;
}