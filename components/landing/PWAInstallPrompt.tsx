import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    IoDownloadOutline,
    IoCloseOutline,
    IoShieldCheckmarkOutline,
    IoCheckmarkCircleOutline
} from 'react-icons/io5';

const PWAInstallPrompt: React.FC = () => {
    const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
    const [isVisible, setIsVisible] = useState(false);
    const [isInstalled, setIsInstalled] = useState(false);

    useEffect(() => {
        // Check if app is already installed
        if (window.matchMedia('(display-mode: standalone)').matches) {
            setIsInstalled(true);
            return;
        }

        let timer: NodeJS.Timeout;

        const handleBeforeInstallPrompt = (e: Event) => {
            e.preventDefault();
            setDeferredPrompt(e);

            // Only show the custom prompt if the browser says it's installable
            setIsVisible(false);
            timer = setTimeout(() => {
                setIsVisible(true);
            }, 5000);
        };

        window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

        window.addEventListener('appinstalled', () => {
            setIsInstalled(true);
            setIsVisible(false);
            setDeferredPrompt(null);
            console.log('PWA was installed');
        });

        return () => {
            window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
            if (timer) clearTimeout(timer);
        };
    }, []);

    const handleInstallClick = async () => {
        if (!deferredPrompt) return;

        // Show the native install prompt
        deferredPrompt.prompt();

        // Wait for the user to respond to the prompt
        const { outcome } = await deferredPrompt.userChoice;
        console.log(`User response to the install prompt: ${outcome}`);

        // Used the prompt, and can't use it again, throw it away
        setDeferredPrompt(null);
        setIsVisible(false);
    };

    const handleDismiss = () => {
        setIsVisible(false);
    };

    if (isInstalled || !isVisible || !deferredPrompt) return null;

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0, scale: 0.9, y: 50 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9, y: 50 }}
                className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[100] w-[95%] max-w-[420px]"
            >
                <div className="bg-[#0c0c0c] border border-white/5 rounded-[2rem] p-6 shadow-2xl backdrop-blur-xl bg-opacity-95 relative overflow-hidden group">
                    {/* Subtle Glow Background */}
                    <div className="absolute top-0 right-0 w-32 h-32 bg-blue-600/10 blur-3xl -mr-16 -mt-16 group-hover:bg-blue-600/20 transition-colors" />

                    <div className="flex items-start gap-5 relative z-10">
                        <div className="w-16 h-16 flex-shrink-0 bg-blue-600 border border-blue-600 rounded-2xl md:rounded-3xl flex items-center justify-center shadow-lg">
                            <img src="/logo.png" alt="SafeScore Icon" className="w-10 h-10 object-contain p-1" />
                        </div>
                        <div className="flex-1">
                            <div className="flex justify-between items-start">
                                <h3 className="text-white font-black text-xl mb-1 tracking-tight">Install SafeScore</h3>
                                <button aria-label="Close" onClick={handleDismiss} className="text-neutral-600 hover:text-white transition-colors cursor-pointer">
                                    <IoCloseOutline size={24} />
                                </button>
                            </div>
                            <p className="text-neutral-500 text-sm mb-6 leading-relaxed font-medium">
                                Get instant access to daily high-confidence predictions on your home screen.
                            </p>

                            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                                <button
                                    onClick={handleInstallClick}
                                    className="cursor-pointer w-full sm:w-auto bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded-full transition-all flex items-center justify-center gap-2 active:scale-95 shadow-lg shadow-blue-600/30"
                                >
                                    <IoDownloadOutline size={20} />
                                    Install Now
                                </button>
                                <button
                                    onClick={handleDismiss}
                                    className="cursor-pointer w-full sm:w-auto py-3 px-4 text-neutral-500 hover:text-blue-500 font-bold text-sm transition-colors text-center"
                                >
                                    Maybe later
                                </button>
                            </div>
                        </div>
                    </div>

                    <div className="mt-6 pt-5 border-t border-white/5 flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-neutral-600 relative z-10">
                        <IoShieldCheckmarkOutline className="text-blue-500" size={14} />
                        <span>Faster • Offline-ready • Secure</span>
                    </div>
                </div>
            </motion.div>
        </AnimatePresence>
    );
};

export default PWAInstallPrompt;