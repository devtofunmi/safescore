import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '../supabase';

interface AdminSession {
  access_token: string;
  refresh_token: string;
  expires_at: number;
  expires_in: number;
}

interface AdminUser {
  id: string;
  email: string;
  user_metadata: {
    email_verified?: boolean;
    full_name?: string;
    is_admin?: boolean;
    plan_type?: string;
  };
}

interface AdminAuthState {
  // State
  adminUser: AdminUser | null;
  adminSession: AdminSession | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;

  // Actions
  setAuth: (user: AdminUser, session: AdminSession) => Promise<void>;
  clearAuth: () => Promise<void>;
  refreshSession: () => Promise<void>;
  checkSession: () => Promise<boolean>;
}

export const useAdminAuthStore = create<AdminAuthState>()(
  persist(
    (set, get) => ({
      // Initial state
      adminUser: null,
      adminSession: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,

      // Set authentication data
      setAuth: async (user: AdminUser, session: AdminSession) => {
        try {
          // Set session in Supabase client
          const { error: sessionError } = await supabase.auth.setSession({
            access_token: session.access_token,
            refresh_token: session.refresh_token,
          });

          if (sessionError) {
            throw new Error('Failed to set session');
          }

          // Store in Zustand state
          set({
            adminUser: user,
            adminSession: session,
            isAuthenticated: true,
            error: null,
          });
        } catch (error: any) {
          set({
            error: error.message || 'Failed to set authentication',
            isAuthenticated: false,
          });
          throw error;
        }
      },

      // Clear authentication
      clearAuth: async () => {
        await supabase.auth.signOut();
        set({
          adminUser: null,
          adminSession: null,
          isAuthenticated: false,
          error: null,
        });
      },

      // Refresh session token
      refreshSession: async () => {
        const { adminSession } = get();
        if (!adminSession) return;

        try {
          const { data, error } = await supabase.auth.refreshSession({
            refresh_token: adminSession.refresh_token,
          });

          if (error || !data.session) {
            throw new Error('Failed to refresh session');
          }

          set({
            adminSession: {
              access_token: data.session.access_token,
              refresh_token: data.session.refresh_token,
              expires_at: data.session.expires_at || 0,
              expires_in: data.session.expires_in || 3600,
            },
          });
        } catch (error: any) {
          // If refresh fails, clear auth
          await get().clearAuth();
          throw error;
        }
      },

      // Check if session is still valid
      checkSession: async () => {
        const { adminSession } = get();
        if (!adminSession) return false;

        // Check if token is expired
        const now = Math.floor(Date.now() / 1000);
        if (adminSession.expires_at && adminSession.expires_at < now) {
          // Try to refresh
          try {
            await get().refreshSession();
            return true;
          } catch {
            return false;
          }
        }

        // Verify session with Supabase
        const { data: { session }, error } = await supabase.auth.getSession();
        if (error || !session) {
          await get().clearAuth();
          return false;
        }

        return true;
      },
    }),
    {
      name: 'admin-auth-storage',
      partialize: (state) => ({
        adminUser: state.adminUser,
        adminSession: state.adminSession,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);

// Helper hook to get auth token for API calls
export const useAdminAuthToken = (): string | null => {
  const { adminSession, checkSession } = useAdminAuthStore();
  
  // Check session validity before returning token
  if (adminSession) {
    const now = Math.floor(Date.now() / 1000);
    if (adminSession.expires_at && adminSession.expires_at < now) {
      // Token expired, try to refresh
      checkSession();
    }
  }

  return adminSession?.access_token || null;
};
