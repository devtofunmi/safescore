import { supabaseAdmin } from './supabase';
import type { User } from '@supabase/supabase-js';

/**
 * Admin Utility Functions
 * 
 * Helper functions for admin operations and authentication checks.
 */

/**
 * Check if a user is an admin
 * Admins are identified by having is_admin: true in their user_metadata
 */
export async function isAdmin(userId: string): Promise<boolean> {
    try {
        const { data, error } = await supabaseAdmin.auth.admin.getUserById(userId);
        if (error || !data?.user) return false;
        return data.user.user_metadata?.is_admin === true;
    } catch {
        return false;
    }
}

/**
 * Get user by email or ID
 */
export async function getUserByIdentifier(identifier: string): Promise<User | null> {
    try {
        // Try as ID first (UUIDs are typically 36 chars)
        if (identifier.length >= 30) {
            const { data: userById, error: errorById } = await supabaseAdmin.auth.admin.getUserById(identifier);
            if (!errorById && userById?.user) {
                return userById.user;
            }
        }

        // Try as email - list all users and search
        // Note: This is not ideal for large user bases, but Supabase doesn't have a direct email search endpoint
        const { data: usersList, error: listError } = await supabaseAdmin.auth.admin.listUsers();
        if (!listError && usersList?.users) {
            const user = usersList.users.find(u =>
                u.email?.toLowerCase() === identifier.toLowerCase()
            );
            if (user) return user;
        }

        return null;
    } catch {
        return null;
    }
}

/**
 * Calculate global prediction accuracy from history table
 */
export async function getGlobalAccuracy(): Promise<{
    total: number;
    won: number;
    lost: number;
    pending: number;
    postponed: number;
    accuracy: number;
}> {
    try {
        const { data: historyData, error } = await supabaseAdmin
            .from('history')
            .select('predictions')
            .order('date', { ascending: false });

        if (error || !historyData) {
            return { total: 0, won: 0, lost: 0, pending: 0, postponed: 0, accuracy: 0 };
        }

        let total = 0;
        let won = 0;
        let lost = 0;
        let pending = 0;
        let postponed = 0;

        historyData.forEach((record: any) => {
            if (record.predictions && Array.isArray(record.predictions)) {
                record.predictions.forEach((p: any) => {
                    total++;
                    const res = p.result ? p.result.toLowerCase() : '';
                    if (res === 'won' || res === 'win') won++;
                    else if (res === 'lost' || res === 'loss') lost++;
                    else if (res === 'postponed') postponed++;
                    else pending++;
                });
            }
        });

        const activeCount = total - pending - postponed;
        const accuracy = activeCount > 0 ? Math.round((won / activeCount) * 100) : 0;

        return { total, won, lost, pending, postponed, accuracy };
    } catch {
        return { total: 0, won: 0, lost: 0, pending: 0, postponed: 0, accuracy: 0 };
    }
}

/**
 * Get total number of users
 */
export async function getTotalUsers(): Promise<number> {
    try {
        const { data, error } = await supabaseAdmin.auth.admin.listUsers();
        if (error || !data?.users) return 0;
        return data.users.length;
    } catch {
        return 0;
    }
}

/**
 * Get Pro vs Free user counts
 */
export async function getUserCounts(): Promise<{ pro: number; free: number }> {
    try {
        const { data, error } = await supabaseAdmin.auth.admin.listUsers();
        if (error || !data?.users) return { pro: 0, free: 0 };

        let pro = 0;
        let free = 0;

        data.users.forEach((user) => {
            const metadata = user.user_metadata || {};
            const planType = metadata.plan_type || 'free';
            const proExpiresAt = metadata.pro_expires_at;
            const trialExpiresAt = metadata.trial_expires_at;

            // Check if user has active Pro subscription
            let isPro = false;
            if (planType === 'pro' && proExpiresAt) {
                const expDate = new Date(proExpiresAt);
                if (expDate > new Date()) {
                    isPro = true;
                }
            }

            // Check if user has active trial
            if (!isPro && trialExpiresAt) {
                const trialDate = new Date(trialExpiresAt);
                if (trialDate > new Date()) {
                    isPro = true;
                }
            }

            if (isPro) pro++;
            else free++;
        });

        return { pro, free };
    } catch {
        return { pro: 0, free: 0 };
    }
}

/**
 * Get pending matches from history
 */
export async function getPendingMatches(): Promise<Array<{
    id: string;
    homeTeam: string;
    awayTeam: string;
    prediction: string;
    league?: string;
    date: string;
    userId?: string;
}>> {
    try {
        const { data: historyData, error } = await supabaseAdmin
            .from('history')
            .select('*')
            .order('date', { ascending: false });

        if (error || !historyData) return [];

        const pendingMatches: Array<{
            id: string;
            homeTeam: string;
            awayTeam: string;
            prediction: string;
            league?: string;
            date: string;
            userId?: string;
        }> = [];

        historyData.forEach((record: any) => {
            if (record.predictions && Array.isArray(record.predictions)) {
                record.predictions.forEach((p: any) => {
                    const res = p.result ? p.result.toLowerCase() : '';
                    if (res === 'pending' || res === '' || !p.result) {
                        pendingMatches.push({
                            id: p.id,
                            homeTeam: p.homeTeam,
                            awayTeam: p.awayTeam,
                            prediction: p.prediction,
                            league: p.league,
                            date: record.date,
                            userId: p.userId,
                        });
                    }
                });
            }
        });

        return pendingMatches;
    } catch {
        return [];
    }
}