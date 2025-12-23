import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiDownload, FiX, FiCheckCircle } from 'react-icons/fi';

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
                className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[100] w-[90%] max-w-md"
            >
                <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 shadow-2xl backdrop-blur-xl bg-opacity-90">
                    <div className="flex items-start gap-4">
                        <div className="w-16 h-16 flex-shrink-0 bg-blue-500 rounded-2xl flex items-center justify-center shadow-lg shadow-blue-500/20">
                            <img src="/logo.png" alt="SafeScore Icon" className="w-10 h-10 object-contain" />
                        </div>
                        <div className="flex-1">
                            <h3 className="text-white font-bold text-lg mb-1">Install SafeScore</h3>
                            <p className="text-zinc-400 text-sm mb-4 leading-relaxed">
                                Get instant access to predictions and faster scores right from your home screen.
                            </p>
                            <div className="flex flex-col md:flex-row gap-3">
                                <button
                                    onClick={handleInstallClick}
                                    className="cursor-pointer flex-1 bg-blue-500 hover:bg-blue-600 text-white font-bold py-2.5 px-4 rounded-full transition-all flex items-center justify-center gap-2 active:scale-95"
                                >
                                    <FiDownload size={18} />
                                    Install Now
                                </button>
                                <button
                                    onClick={handleDismiss}
                                    className="cursor-pointer px-4 py-2.5 text-zinc-400 hover:text-white font-medium transition-colors"
                                >
                                    Maybe later
                                </button>
                            </div>
                        </div>
                    </div>

                    <div className="mt-4 pt-4 border-t border-zinc-800 flex items-center gap-2 text-xs text-zinc-500">
                        <FiCheckCircle className="text-green-500" />
                        <span>Faster, offline-ready & secure</span>
                    </div>
                </div>
            </motion.div>
        </AnimatePresence>
    );
};

export default PWAInstallPrompt;