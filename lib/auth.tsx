import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from './supabase';

interface AuthContextType {
    user: User | null;
    session: Session | null;
    loading: boolean;
    plan: 'free' | 'pro';
    isPro: boolean;
    trialEndsAt: string | null;
    isTrialActive: boolean;
    daysRemaining: number;
    signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
    user: null,
    session: null,
    loading: true,
    plan: 'free',
    isPro: false,
    trialEndsAt: null,
    isTrialActive: false,
    daysRemaining: 0,
    signOut: async () => { },
});

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
    const [user, setUser] = useState<User | null>(null);
    const [session, setSession] = useState<Session | null>(null);
    const [loading, setLoading] = useState(true);

    // Subscription & Plan state
    const [plan, setPlan] = useState<'free' | 'pro'>('free');
    const [trialEndsAt, setTrialEndsAt] = useState<string | null>(null);
    const [isTrialActive, setIsTrialActive] = useState(false);
    const [daysRemaining, setDaysRemaining] = useState(0);

    const checkSubscription = (u: User | null) => {
        if (!u) {
            setPlan('free');
            setTrialEndsAt(null);
            setIsTrialActive(false);
            setDaysRemaining(0);
            return;
        }

        const metadata = u.user_metadata;
        const metaPlan = metadata?.plan_type || 'free';
        const metaTrialEnd = metadata?.trial_expires_at || null;

        let activePlan: 'free' | 'pro' = 'free';
        let trialActive = false;
        let days = 0;

        if (metaTrialEnd) {
            const end = new Date(metaTrialEnd);
            const now = new Date();
            const diffTime = end.getTime() - now.getTime();
            days = Math.max(0, Math.ceil(diffTime / (1000 * 60 * 60 * 24)));

            if (diffTime > 0) {
                trialActive = true;
                activePlan = 'pro'; // Trial counts as Pro
            }
        }

        // If explicitly set to pro (paid), override trial check
        if (metaPlan === 'pro') {
            activePlan = 'pro';
        }

        setPlan(activePlan);
        setTrialEndsAt(metaTrialEnd);
        setIsTrialActive(trialActive);
        setDaysRemaining(days);
    };

    useEffect(() => {
        // Check active sessions and sets the user
        const setData = async () => {
            const { data: { session }, error } = await supabase.auth.getSession();
            if (error) {
                console.error('Error getting session:', error);
            }
            setSession(session);
            const currentUser = session?.user ?? null;
            setUser(currentUser);
            checkSubscription(currentUser);
            setLoading(false);
        };

        const { data: listener } = supabase.auth.onAuthStateChange(
            (_event, session) => {
                setSession(session);
                const currentUser = session?.user ?? null;
                setUser(currentUser);
                checkSubscription(currentUser);
                setLoading(false);
            }
        );

        setData();

        return () => {
            listener.subscription.unsubscribe();
        };
    }, []);

    const signOut = async () => {
        const { error } = await supabase.auth.signOut();
        if (error) console.error('Error signing out:', error.message);
    };

    const value: AuthContextType = {
        user,
        session,
        loading,
        plan,
        isPro: plan === 'pro',
        trialEndsAt,
        isTrialActive,
        daysRemaining,
        signOut,
    };

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};