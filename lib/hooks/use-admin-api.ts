import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAdminAuthToken, useAdminAuthStore } from '../stores/admin-auth-store';

/**
 * Base function to make authenticated admin API calls
 */
const adminApiCall = async <T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> => {
  const token = useAdminAuthStore.getState().adminSession?.access_token;

  if (!token) {
    throw new Error('No authentication token available');
  }

  const response = await fetch(endpoint, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
      ...options.headers,
    },
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.message || error.error || `API call failed: ${response.statusText}`);
  }

  return response.json();
};

/**
 * Hook for fetching admin stats
 */
export const useAdminStats = () => {
  const token = useAdminAuthToken();

  return useQuery({
    queryKey: ['admin-stats'],
    queryFn: () => adminApiCall<{
      accuracy: number;
      totalPredictions: number;
      totalUsers: number;
      proUsers: number;
      freeUsers: number;
      won: number;
      lost: number;
      pending: number;
      postponed: number;
    }>('/api/admin/stats'),
    enabled: !!token,
    refetchInterval: 30 * 1000, // Refetch every 30 seconds
  });
};

/**
 * Hook for fetching admin latency
 */
export const useAdminLatency = () => {
  const token = useAdminAuthToken();

  return useQuery({
    queryKey: ['admin-latency'],
    queryFn: () => adminApiCall<{
      latency: number;
      status: string;
    }>('/api/admin/latency'),
    enabled: !!token,
    refetchInterval: 60 * 1000, // Refetch every minute
  });
};

/**
 * Hook for fetching pending matches
 */
export const useAdminPendingMatches = () => {
  const token = useAdminAuthToken();
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ['admin-pending-matches'],
    queryFn: () => adminApiCall<{
      count: number;
      matches: Array<{
        id: string;
        homeTeam: string;
        awayTeam: string;
        prediction: string;
        league?: string;
        date: string;
        userId?: string;
      }>;
    }>('/api/admin/pending-matches'),
    enabled: !!token,
    refetchInterval: 60 * 1000, // Refetch every minute
  });

  const verifyMutation = useMutation({
    mutationFn: async () => {
      return adminApiCall('/api/history/verify', { method: 'POST' });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-pending-matches'] });
      queryClient.invalidateQueries({ queryKey: ['admin-stats'] });
    },
  });

  return {
    ...query,
    verifyMatches: verifyMutation.mutate,
    isVerifying: verifyMutation.isPending,
  };
};

/**
 * Hook for user list
 */
export const useAdminUserList = (
  page: number = 1,
  limit: number = 20,
  planType: 'all' | 'pro' | 'free' = 'all',
  search: string = ''
) => {
  const token = useAdminAuthToken();

  return useQuery({
    queryKey: ['admin-users', page, limit, planType, search],
    queryFn: () =>
      adminApiCall<{
        users: any[];
        total: number;
        page: number;
        limit: number;
      }>(
        `/api/admin/users/list?page=${page}&limit=${limit}&planType=${planType}&search=${encodeURIComponent(search)}`
      ),
    enabled: !!token,
  });
};

/**
 * Hook for user search
 */
export const useAdminUserSearch = () => {
  const token = useAdminAuthToken();
  const queryClient = useQueryClient();

  const searchMutation = useMutation({
    mutationFn: async (query: string) => {
      return adminApiCall<{
        id: string;
        email: string;
        createdAt: string;
        planType: 'pro' | 'free';
        proExpiresAt?: string;
        trialExpiresAt?: string;
        lastGenDate?: string;
        genCount: number;
      }>(`/api/admin/users/search?q=${encodeURIComponent(query)}`);
    },
  });

  return {
    search: searchMutation.mutate,
    searchResult: searchMutation.data,
    isSearching: searchMutation.isPending,
    searchError: searchMutation.error,
  };
};

/**
 * Hook for user detail
 */
export const useAdminUserDetail = (userId: string | null) => {
  const token = useAdminAuthToken();

  return useQuery({
    queryKey: ['admin-user-detail', userId],
    queryFn: () =>
      adminApiCall<{
        user: any;
        dashboard: any;
        predictions: any[];
        history: any[];
      }>(`/api/admin/users/dashboard?userId=${userId}`),
    enabled: !!token && !!userId,
  });
};

/**
 * Hook for user actions (upgrade, reset quota, etc.)
 */
export const useAdminUserActions = () => {
  const queryClient = useQueryClient();
  const token = useAdminAuthToken();

  const upgradeMutation = useMutation({
    mutationFn: async (userId: string) => {
      return adminApiCall(`/api/admin/users/upgrade`, {
        method: 'POST',
        body: JSON.stringify({ userId }),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
      queryClient.invalidateQueries({ queryKey: ['admin-user-detail'] });
      queryClient.invalidateQueries({ queryKey: ['admin-stats'] });
    },
  });

  const resetQuotaMutation = useMutation({
    mutationFn: async (userId: string) => {
      return adminApiCall(`/api/admin/users/reset-quota`, {
        method: 'POST',
        body: JSON.stringify({ userId }),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-user-detail'] });
    },
  });

  const generatePredictionsMutation = useMutation({
    mutationFn: async (data: {
      userId: string;
      riskLevel: 'very safe' | 'safe' | 'medium safe';
      day: 'today' | 'tomorrow' | 'weekend';
      leagues: string[];
    }) => {
      return adminApiCall(`/api/admin/users/generate-predictions`, {
        method: 'POST',
        body: JSON.stringify(data),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-user-detail'] });
      queryClient.invalidateQueries({ queryKey: ['admin-stats'] });
    },
  });

  return {
    upgradeUser: upgradeMutation.mutate,
    resetQuota: resetQuotaMutation.mutate,
    generatePredictions: generatePredictionsMutation.mutate,
    isUpgrading: upgradeMutation.isPending,
    isResetting: resetQuotaMutation.isPending,
    isGenerating: generatePredictionsMutation.isPending,
  };
};
