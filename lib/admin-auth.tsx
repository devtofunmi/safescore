/**
 * Legacy AdminAuthProvider - Now uses Zustand store under the hood
 * Kept for backward compatibility with existing code
 * 
 * @deprecated Use useAdminAuth from '@/lib/hooks/use-admin-auth' instead
 */
import React, { createContext, useContext } from 'react';
import { useAdminAuthStore } from './stores/admin-auth-store';
import { useAdminAuth as useNewAdminAuth } from './hooks/use-admin-auth';

interface AdminAuthContextType {
    adminUser: any;
    adminSession: any;
    loading: boolean;
    isAdminUser: boolean;
    signOut: () => Promise<void>;
}

const AdminAuthContext = createContext<AdminAuthContextType>({
    adminUser: null,
    adminSession: null,
    loading: true,
    isAdminUser: false,
    signOut: async () => { },
});

export const AdminAuthProvider = ({ children }: { children: React.ReactNode }) => {
    // Use the new Zustand-based auth system
    const store = useAdminAuthStore();
    const { logout } = useNewAdminAuth();

    const value: AdminAuthContextType = {
        adminUser: store.adminUser,
        adminSession: store.adminSession,
        loading: store.isLoading,
        isAdminUser: store.isAuthenticated,
        signOut: async () => {
            await logout();
        },
    };

    return <AdminAuthContext.Provider value={value}>{children}</AdminAuthContext.Provider>;
};

/**
 * @deprecated Use useAdminAuth from '@/lib/hooks/use-admin-auth' instead
 */
export const useAdminAuthLegacy = () => {
    const context = useContext(AdminAuthContext);
    if (context === undefined) {
        throw new Error('useAdminAuthLegacy must be used within an AdminAuthProvider');
    }
    return context;
};
