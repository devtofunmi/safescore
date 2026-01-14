import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from './supabase';
import { isAdmin } from './admin';
import { useRouter } from 'next/router';

interface AdminAuthContextType {
    adminUser: User | null;
    adminSession: Session | null;
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
    const [adminUser, setAdminUser] = useState<User | null>(null);
    const [adminSession, setAdminSession] = useState<Session | null>(null);
    const [loading, setLoading] = useState(true);
    const [isAdminUser, setIsAdminUser] = useState(false);

    useEffect(() => {
        const checkAdminSession = async () => {
            // Check if admin session exists in sessionStorage
            const adminSessionFlag = typeof window !== 'undefined' 
                ? sessionStorage.getItem('admin_session') 
                : null;

            if (!adminSessionFlag) {
                setLoading(false);
                return;
            }

            // Get current session
            const { data: { session }, error } = await supabase.auth.getSession();
            if (error || !session) {
                // Clear admin session if no valid session
                if (typeof window !== 'undefined') {
                    sessionStorage.removeItem('admin_session');
                    sessionStorage.removeItem('admin_user_id');
                }
                setLoading(false);
                return;
            }

            // Verify admin status
            const adminStatus = await isAdmin(session.user.id);
            if (!adminStatus) {
                // Clear admin session if not admin
                if (typeof window !== 'undefined') {
                    sessionStorage.removeItem('admin_session');
                    sessionStorage.removeItem('admin_user_id');
                }
                setLoading(false);
                return;
            }

            setAdminSession(session);
            setAdminUser(session.user);
            setIsAdminUser(true);
            setLoading(false);
        };

        checkAdminSession();

        // Listen for auth changes
        const { data: listener } = supabase.auth.onAuthStateChange(
            async (_event, session) => {
                if (!session) {
                    setAdminSession(null);
                    setAdminUser(null);
                    setIsAdminUser(false);
                    if (typeof window !== 'undefined') {
                        sessionStorage.removeItem('admin_session');
                        sessionStorage.removeItem('admin_user_id');
                    }
                    setLoading(false);
                    return;
                }

                // Verify admin status on auth change
                const adminStatus = await isAdmin(session.user.id);
                if (adminStatus) {
                    setAdminSession(session);
                    setAdminUser(session.user);
                    setIsAdminUser(true);
                    if (typeof window !== 'undefined') {
                        sessionStorage.setItem('admin_session', 'true');
                        sessionStorage.setItem('admin_user_id', session.user.id);
                    }
                } else {
                    setAdminSession(null);
                    setAdminUser(null);
                    setIsAdminUser(false);
                    if (typeof window !== 'undefined') {
                        sessionStorage.removeItem('admin_session');
                        sessionStorage.removeItem('admin_user_id');
                    }
                }
                setLoading(false);
            }
        );

        return () => {
            listener.subscription.unsubscribe();
        };
    }, []);

    const signOut = async () => {
        await supabase.auth.signOut();
        setAdminSession(null);
        setAdminUser(null);
        setIsAdminUser(false);
        if (typeof window !== 'undefined') {
            sessionStorage.removeItem('admin_session');
            sessionStorage.removeItem('admin_user_id');
        }
    };

    const value: AdminAuthContextType = {
        adminUser,
        adminSession,
        loading,
        isAdminUser,
        signOut,
    };

    return <AdminAuthContext.Provider value={value}>{children}</AdminAuthContext.Provider>;
};

export const useAdminAuth = () => {
    const context = useContext(AdminAuthContext);
    if (context === undefined) {
        throw new Error('useAdminAuth must be used within an AdminAuthProvider');
    }
    return context;
};
