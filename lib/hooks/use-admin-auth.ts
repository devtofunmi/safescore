import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useAdminAuthStore, useAdminAuthToken } from '../stores/admin-auth-store';
import { useRouter } from 'next/router';
import { toast } from 'react-toastify';

interface LoginCredentials {
  email: string;
  password: string;
}

interface LoginResponse {
  success: boolean;
  user: {
    id: string;
    email: string;
    user_metadata: {
      email_verified?: boolean;
      full_name?: string;
      is_admin?: boolean;
      plan_type?: string;
    };
  };
  session: {
    access_token: string;
    refresh_token: string;
    expires_at: number;
    expires_in: number;
  };
}

/**
 * Hook for admin authentication
 */
export const useAdminAuth = () => {
  const router = useRouter();
  const queryClient = useQueryClient();
  const store = useAdminAuthStore();
  const token = useAdminAuthToken();

  // Login mutation
  const loginMutation = useMutation({
    mutationFn: async (credentials: LoginCredentials): Promise<LoginResponse> => {
      const response = await fetch('/api/admin/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(credentials),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || error.error || 'Login failed');
      }

      return response.json();
    },
    onSuccess: async (data) => {
      await store.setAuth(data.user, data.session);
      toast.success('Admin access granted');
      router.push('/admin');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Login failed');
    },
  });

  // Logout mutation
  const logoutMutation = useMutation({
    mutationFn: async () => {
      await store.clearAuth();
    },
    onSuccess: () => {
      queryClient.clear();
      router.push('/admin/login');
      toast.success('Logged out successfully');
    },
  });

  // Session check query
  const sessionQuery = useQuery({
    queryKey: ['admin-session'],
    queryFn: async () => {
      const isValid = await store.checkSession();
      if (!isValid) {
        await store.clearAuth();
        router.push('/admin/login');
      }
      return isValid;
    },
    enabled: store.isAuthenticated,
    refetchInterval: 5 * 60 * 1000, // Check every 5 minutes
    retry: false,
  });

  return {
    // State
    adminUser: store.adminUser,
    adminSession: store.adminSession,
    isAuthenticated: store.isAuthenticated,
    isLoading: store.isLoading || loginMutation.isPending || sessionQuery.isLoading,
    token,

    // Actions
    login: loginMutation.mutate,
    logout: logoutMutation.mutate,
    isLoggingIn: loginMutation.isPending,
    isLoggingOut: logoutMutation.isPending,
    error: store.error || loginMutation.error?.message || null,
  };
};
