import { createContext, ReactNode, useContext, useEffect, useState } from "react";
import {
  useQuery,
  useMutation,
  UseMutationResult,
} from "@tanstack/react-query";
import { type User } from "@shared/schema";
import { apiRequest, queryClient } from "../lib/queryClient";
import toast from "react-hot-toast";

// Phone auth types
type SendOtpRequest = {
  phoneNumber: string;
};

type SendOtpResponse = {
  success: boolean;
  message: string;
  dev_otp?: string;
};

type VerifyOtpRequest = {
  phoneNumber: string;
  otp: string;
};

type VerifyOtpResponse = {
  success: boolean;
  message: string;
  token: string;
  user: User;
};

// Update profile types
type UpdateProfileRequest = {
  firstName?: string;
  lastName?: string;
  username?: string;
  email?: string;
  bio?: string;
  preferredLanguages?: string[];
  favoriteGenres?: string[];
  onboardingCompleted?: boolean;
};

type AuthContextType = {
  user: User | null;
  isLoading: boolean;
  error: Error | null;
  loginMutation: UseMutationResult<LoginResponse, Error, LoginData>;
  adminLoginMutation: UseMutationResult<LoginResponse, Error, LoginData>;
  logoutMutation: UseMutationResult<void, Error, void>;
  registerMutation: UseMutationResult<LoginResponse, Error, RegisterData>;
  sendOtpMutation: UseMutationResult<SendOtpResponse, Error, SendOtpRequest>;
  verifyOtpMutation: UseMutationResult<VerifyOtpResponse, Error, VerifyOtpRequest>;
  updateProfileMutation: UseMutationResult<{user: User}, Error, UpdateProfileRequest>;
  sendOtp: (phoneNumber: string) => Promise<SendOtpResponse>;
  verifyOtp: (phoneNumber: string, otp: string) => Promise<VerifyOtpResponse>;
  updateProfile: (data: UpdateProfileRequest) => Promise<{user: User}>;
  isAdmin: boolean;
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
  // Remove token state - use database-only authentication

  const {
    data: user,
    error,
    isLoading,
  } = useQuery<User | null, Error>({
    queryKey: ["/api/auth/me"],
    queryFn: async () => {
      const response = await fetch('/api/auth/me', {
        credentials: 'include', // Send HTTP-only cookies automatically
      });
      
      // Only return null for actual authentication failures (401/403)
      if (response.status === 401 || response.status === 403) {
        return null;
      }
      
      // Throw for all other non-OK responses so React Query can retry
      if (!response.ok) {
        throw new Error(`Auth check failed with status ${response.status}`);
      }
      
      return response.json();
    },
    retry: (failureCount) => {
      // Retry up to 3 times for network/server errors
      return failureCount < 3;
    },
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
    staleTime: 1000 * 60 * 5, // Consider data fresh for 5 minutes
    gcTime: 1000 * 60 * 10, // Keep in cache for 10 minutes
    refetchOnWindowFocus: true, // Refetch when window gains focus for faster recovery
    refetchOnMount: true, // Always refetch when component mounts
    refetchOnReconnect: true, // Refetch when network reconnects
    placeholderData: (previousData) => previousData, // Keep last known user to avoid flicker
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

      queryClient.setQueryData(["/api/auth/me"], response.user);
    },
    onError: () => {
      // Error handling is done by the promise toast
    },
  });

  const adminLoginMutation = useMutation({
    mutationFn: async (credentials: LoginData): Promise<LoginResponse> => {
      const loginPromise = async () => {
        const res = await apiRequest("/api/admin/login", "POST", credentials);
        return await res.json();
      };

      return toast.promise(
        loginPromise(),
        {
          loading: 'Authenticating admin...',
          success: <b>Admin login successful!</b>,
          error: <b>Admin login failed.</b>,
        }
      );
    },
    onSuccess: (response: LoginResponse) => {
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

      queryClient.setQueryData(["/api/auth/me"], response.user);
    },
    onError: () => {
      // Error handling is done by the promise toast
    },
  });

  const sendOtpMutation = useMutation({
    mutationFn: async (data: SendOtpRequest): Promise<SendOtpResponse> => {
      const response = await fetch('/api/auth/send-otp', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to send OTP');
      }
      
      return response.json();
    },
  });

  const verifyOtpMutation = useMutation({
    mutationFn: async (data: VerifyOtpRequest): Promise<VerifyOtpResponse> => {
      const response = await fetch('/api/auth/verify-otp', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to verify OTP');
      }
      
      return response.json();
    },
    onSuccess: (data) => {
      // Server sets HTTP-only cookie automatically, no client-side storage
      queryClient.setQueryData(["/api/auth/me"], data.user);
    },
  });

  const logoutMutation = useMutation({
    mutationFn: async () => {
      // Call backend logout to revoke database JWT token and clear cookie
      const response = await fetch('/api/auth/logout', {
        method: 'POST',
        credentials: 'include', // Send HTTP-only cookies
      });
      
      if (!response.ok && response.status !== 401) {
        throw new Error('Logout failed');
      }
    },
    onSuccess: () => {
      queryClient.setQueryData(["/api/auth/me"], null);
      queryClient.clear(); // Clear all cached data
      toast.success('Successfully logged out!');
    },
    onError: () => {
      toast.error("Logout failed.");
    },
  });

  const updateProfileMutation = useMutation({
    mutationFn: async (data: UpdateProfileRequest) => {
      const response = await fetch('/api/auth/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
        credentials: 'include', // Use database session
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to update profile');
      }
      
      return response.json();
    },
    onSuccess: (data) => {
      queryClient.setQueryData(["/api/auth/me"], data.user);
    },
  });

  const isAdmin = user?.role === 'admin';

  // Helper functions for phone auth
  const sendOtp = (phoneNumber: string) => {
    return sendOtpMutation.mutateAsync({ phoneNumber });
  };

  const verifyOtp = (phoneNumber: string, otp: string) => {
    return verifyOtpMutation.mutateAsync({ phoneNumber, otp });
  };

  const updateProfile = (data: UpdateProfileRequest) => {
    return updateProfileMutation.mutateAsync(data);
  };

  return (
    <AuthContext.Provider
      value={{
        user: user ?? null,
        isLoading,
        error,
        loginMutation,
        adminLoginMutation,
        logoutMutation,
        registerMutation,
        sendOtpMutation,
        verifyOtpMutation,
        updateProfileMutation,
        sendOtp,
        verifyOtp,
        updateProfile,
        isAdmin,
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