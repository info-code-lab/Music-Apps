import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";

interface User {
  id: string;
  phoneNumber: string;
  email?: string;
  firstName?: string;
  lastName?: string;
  username?: string;
  profileImageUrl?: string;
  bio?: string;
  preferredLanguages?: string[];
  favoriteGenres?: string[];
  onboardingCompleted: boolean;
}

interface SendOtpRequest {
  phoneNumber: string;
}

interface SendOtpResponse {
  success: boolean;
  message: string;
  dev_otp?: string; // For development only
}

interface VerifyOtpRequest {
  phoneNumber: string;
  otp: string;
}

interface VerifyOtpResponse {
  success: boolean;
  message: string;
  token: string;
  user: User;
}

interface UpdateProfileRequest {
  firstName?: string;
  lastName?: string;
  username?: string;
  email?: string;
  bio?: string;
  preferredLanguages?: string[];
  favoriteGenres?: string[];
  onboardingCompleted?: boolean;
}

export function useAuth() {
  const queryClient = useQueryClient();
  
  const { data: user, isLoading, error } = useQuery({
    queryKey: ["/api/auth/user"],
    retry: false,
    staleTime: 5 * 60 * 1000, // 5 minutes
    queryFn: async () => {
      const token = localStorage.getItem('authToken');
      if (!token) {
        throw new Error('No token found');
      }
      
      const response = await fetch('/api/auth/user', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      
      if (!response.ok) {
        if (response.status === 401) {
          localStorage.removeItem('authToken');
          throw new Error('Authentication required');
        }
        throw new Error('Failed to fetch user');
      }
      
      return response.json();
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
      localStorage.setItem('authToken', data.token);
      queryClient.setQueryData(["/api/auth/user"], data.user);
    },
  });

  const logoutMutation = useMutation({
    mutationFn: async () => {
      const token = localStorage.getItem('authToken');
      if (token) {
        const response = await fetch('/api/auth/logout', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });
        
        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.error || 'Failed to logout');
        }
        
        return response.json();
      }
    },
    onSuccess: () => {
      localStorage.removeItem('authToken');
      queryClient.removeQueries({ queryKey: ["/api/auth/user"] });
      queryClient.clear();
    },
  });

  const updateProfileMutation = useMutation({
    mutationFn: async (data: UpdateProfileRequest) => {
      const token = localStorage.getItem('authToken');
      
      const response = await fetch('/api/auth/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(data),
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to update profile');
      }
      
      return response.json();
    },
    onSuccess: (data) => {
      queryClient.setQueryData(["/api/auth/user"], data.user);
    },
  });

  const login = async (phoneNumber: string, otp: string) => {
    return verifyOtpMutation.mutateAsync({ phoneNumber, otp });
  };

  const logout = () => {
    logoutMutation.mutate();
  };

  const sendOtp = (phoneNumber: string) => {
    return sendOtpMutation.mutateAsync({ phoneNumber });
  };

  const updateProfile = (data: UpdateProfileRequest) => {
    return updateProfileMutation.mutateAsync(data);
  };

  return {
    user,
    isLoading,
    error,
    isAuthenticated: !!user,
    login,
    logout,
    sendOtp,
    updateProfile,
    sendOtpMutation,
    verifyOtpMutation,
    logoutMutation,
    updateProfileMutation,
  };
}