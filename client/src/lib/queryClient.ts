import { QueryClient, QueryFunction } from "@tanstack/react-query";

async function throwIfResNotOk(res: Response) {
  if (!res.ok) {
    const text = (await res.text()) || res.statusText;
    throw new Error(`${res.status}: ${text}`);
  }
}

export async function apiRequest(
  url: string,
  method: string,
  data?: unknown | undefined,
): Promise<Response> {
  const token = localStorage.getItem('auth_token');
  const headers: Record<string, string> = {};
  
  // Only set Content-Type for non-FormData requests
  if (data && !(data instanceof FormData)) {
    headers["Content-Type"] = "application/json";
  }
  
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const res = await fetch(url, {
    method,
    headers,
    body: data instanceof FormData ? data : (data ? JSON.stringify(data) : undefined),
  });

  await throwIfResNotOk(res);
  return res;
}

type UnauthorizedBehavior = "returnNull" | "throw";
export const getQueryFn: <T>(options: {
  on401: UnauthorizedBehavior;
}) => QueryFunction<T> =
  ({ on401: unauthorizedBehavior }) =>
  async ({ queryKey }) => {
    const token = localStorage.getItem('auth_token');
    const headers: Record<string, string> = {};
    
    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }

    // Construct URL properly handling both path segments and query parameters
    const [base, ...rest] = queryKey;
    let url = base as string;
    
    // Handle path segments (non-object elements) and query parameters (object elements)
    if (rest.length > 0) {
      // Separate path segments from query parameter objects
      const pathSegments = rest.filter(v => typeof v !== 'object' && v != null);
      const paramObjects = rest.filter(v => v && typeof v === 'object') as Record<string, any>[];
      
      // Append path segments to URL
      if (pathSegments.length > 0) {
        const encodedSegments = pathSegments.map(segment => encodeURIComponent(String(segment)));
        url = [url.replace(/\/$/, ''), ...encodedSegments].join('/');
      }
      
      // Merge all query parameter objects and append to URL
      if (paramObjects.length > 0) {
        const searchParams = new URLSearchParams();
        for (const params of paramObjects) {
          for (const [key, value] of Object.entries(params)) {
            if (value !== undefined && value !== null) {
              searchParams.append(key, String(value));
            }
          }
        }
        if (searchParams.toString()) {
          url += `?${searchParams.toString()}`;
        }
      }
    }

    const res = await fetch(url, {
      headers,
    });

    if (unauthorizedBehavior === "returnNull" && res.status === 401) {
      return null;
    }

    await throwIfResNotOk(res);
    return await res.json();
  };

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      queryFn: getQueryFn({ on401: "throw" }),
      refetchInterval: false,
      refetchOnWindowFocus: true,
      staleTime: 1000 * 60 * 5, // 5 minutes
      retry: false,
    },
    mutations: {
      retry: false,
    },
  },
});
