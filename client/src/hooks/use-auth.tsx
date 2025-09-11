import { createContext, ReactNode, useContext, useEffect, useState } from "react";
import {
  useQuery,
  useMutation,
  UseMutationResult,
} from "@tanstack/react-query";
import { type User } from "@shared/schema";
import { apiRequest, queryClient } from "../lib/queryClient";
import toast from "react-hot-toast";

type AuthContextType = {
  user: User | null;
  isLoading: boolean;
  error: Error | null;
  loginMutation: UseMutationResult<LoginResponse, Error, LoginData>;
  logoutMutation: UseMutationResult<void, Error, void>;
  registerMutation: UseMutationResult<LoginResponse, Error, RegisterData>;
  isAdmin: boolean;
  token: string | null;
};

type LoginData = {
  username: string;
  password: string;
};

type RegisterData = {
  username: string;
  password: string;
  role: string;
};

type LoginResponse = {
  message: string;
  token: string;
  user: User;
};

export const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(() => {
    const storedToken = localStorage.getItem('auth_token');
    console.log('AuthProvider - Initial token from localStorage:', !!storedToken);
    return storedToken;
  });

  // Set auth header for all requests if token exists
  useEffect(() => {
    if (token) {
      localStorage.setItem('auth_token', token);
    } else {
      localStorage.removeItem('auth_token');
    }
  }, [token]);

  const {
    data: user,
    error,
    isLoading,
  } = useQuery<User | undefined, Error>({
    queryKey: ["/api/auth/me"],
    queryFn: async () => {
      if (!token) return undefined;
      
      const response = await fetch('/api/auth/me', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      
      if (!response.ok) {
        if (response.status === 401 || response.status === 403) {
          setToken(null);
          return undefined;
        }
        throw new Error('Failed to fetch user');
      }
      
      return response.json();
    },
    enabled: !!token,
  });

  const loginMutation = useMutation({
    mutationFn: async (credentials: LoginData): Promise<LoginResponse> => {
      const loginPromise = async () => {
        const res = await apiRequest("/api/auth/login", "POST", credentials);
        return await res.json();
      };

      return toast.promise(
        loginPromise(),
        {
          loading: 'Signing in...',
          success: <b>Welcome back!</b>,
          error: <b>Login failed.</b>,
        }
      );
    },
    onSuccess: (response: LoginResponse) => {
      setToken(response.token);
      queryClient.setQueryData(["/api/auth/me"], response.user);
    },
    onError: () => {
      // Error handling is done by the promise toast
    },
  });

  const registerMutation = useMutation({
    mutationFn: async (credentials: RegisterData): Promise<LoginResponse> => {
      const registerPromise = async () => {
        const res = await apiRequest("/api/auth/register", "POST", credentials);
        return await res.json();
      };

      return toast.promise(
        registerPromise(),
        {
          loading: 'Creating account...',
          success: <b>Account created!</b>,
          error: <b>Registration failed.</b>,
        }
      );
    },
    onSuccess: (response: LoginResponse) => {
      setToken(response.token);
      queryClient.setQueryData(["/api/auth/me"], response.user);
    },
    onError: () => {
      // Error handling is done by the promise toast
    },
  });

  const logoutMutation = useMutation({
    mutationFn: async () => {
      // No server logout needed for JWT, just clear local storage
    },
    onSuccess: () => {
      setToken(null);
      queryClient.setQueryData(["/api/auth/me"], null);
      queryClient.clear(); // Clear all cached data
      toast.success('Successfully logged out!');
    },
    onError: () => {
      toast.error("Logout failed.");
    },
  });

  const isAdmin = user?.role === 'admin';

  return (
    <AuthContext.Provider
      value={{
        user: user ?? null,
        isLoading,
        error,
        loginMutation,
        logoutMutation,
        registerMutation,
        isAdmin,
        token,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}