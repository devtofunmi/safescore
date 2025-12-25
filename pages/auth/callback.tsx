import { useEffect } from 'react';
import { useRouter } from 'next/router';
import { supabase } from '@/lib/supabase';
import { toast } from 'react-toastify';

export default function AuthCallback() {
    const router = useRouter();

    useEffect(() => {
        const handleAuthCallback = async () => {
            const { error } = await supabase.auth.getSession();

            if (error) {
                toast.error('Authentication failed. Please try logging in again.');
                router.push('/auth/login');
            } else {
                toast.success('Email verified successfully!');
                router.push('/home');
            }
        };

        handleAuthCallback();
    }, [router]);

    return (
        <div className="min-h-screen bg-neutral-950 flex items-center justify-center">
            <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-500 mx-auto mb-4"></div>
                <p className="text-neutral-400">Verifying your account...</p>
            </div>
        </div>
    );
}
