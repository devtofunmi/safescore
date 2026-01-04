import React, { useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FaTrophy, FaDownload, FaTimes } from 'react-icons/fa';
import { MdShield } from 'react-icons/md';
import { toast } from 'react-toastify';
import { track } from '@vercel/analytics';


interface Prediction {
    id: string;
    team1: string;
    team2: string;
    betType: string;
    confidence: number;
    matchTime: string;
}

interface ShareModalProps {
    isOpen: boolean;
    onClose: () => void;
    predictions: Prediction[];
    shareCount: number;
    setShareCount: (count: number) => void;
}

const formatBetType = (betType: string) => {
    if (betType === 'Both Teams to Score: Yes' || betType === 'BTTS: Yes') return 'Both Teams to Score: Yes';
    if (betType === 'Both Teams to Score: No' || betType === 'BTTS: No') return 'Both Teams to Score: No';
    return betType;
};

const truncateText = (text: string, length: number = 10) => {
    if (!text) return '';
    return text.length > length ? text.substring(0, length) + '...' : text;
};

const formatMatchTime = (isoString?: string) => {
    if (!isoString) return '';
    try {
        const date = new Date(isoString);
        return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });
    } catch (e) {
        return isoString;
    }
};

const ShareModal: React.FC<ShareModalProps> = ({
    isOpen,
    onClose,
    predictions,
    shareCount,
    setShareCount
}) => {
    const cardRef = useRef<HTMLDivElement>(null);

    const handleDownloadImage = async () => {
        if (!cardRef.current) return;
        try {
            // @ts-ignore
            const { toPng } = await import('html-to-image');
            const dataUrl = await toPng(cardRef.current, {
                cacheBust: true,
                backgroundColor: '#050505',
                skipFonts: true,
                style: {
                    // Force standard font rendering
                    fontFamily: 'sans-serif',
                }
            });
            const link = document.createElement('a');
            link.download = `SafeScore-Predictions-${new Date().toISOString().split('T')[0]}.png`;
            link.href = dataUrl;
            link.click();
            toast.success('Slip downloaded!');
            track('download_prediction_card', { count: shareCount });
        } catch (err) {
            console.error('Image generation failed', err);
            toast.error('Failed to generate image.');
        }
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/90 backdrop-blur-md"
                    onClick={onClose}
                >
                    <motion.div
                        initial={{ scale: 0.9, y: 20 }}
                        animate={{ scale: 1, y: 0 }}
                        exit={{ scale: 0.9, y: 20 }}
                        className="bg-[#0c0c0c] rounded-3xl w-full max-w-xl border border-white/5 p-6 shadow-2xl relative flex flex-col max-h-[90vh]"
                        onClick={e => e.stopPropagation()}
                    >
                        <div className="flex justify-between items-center mb-6 shrink-0">
                            <div className="flex items-center gap-3">
                                <h3 className="text-xl font-extrabold text-white">Share Predictions</h3>
                            </div>
                            <button onClick={onClose} className="cursor-pointer text-neutral-500 hover:text-white bg-white/5 hover:bg-white/10 p-2 rounded-full transition-colors">
                                <FaTimes />
                            </button>
                        </div>

                        <div className="flex justify-center gap-3 mb-6 shrink-0">
                            {[3, 5, 10].map(n => (
                                <button
                                    key={n}
                                    onClick={() => setShareCount(n)}
                                    className={`px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-widest transition-all ${shareCount === n ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20' : 'bg-[#1a1a1a] text-neutral-400 hover:bg-[#252525]'
                                        }`}
                                >
                                    Top {n}
                                </button>
                            ))}
                        </div>

                        {/* The Catchable Card Area */}
                        <div className="overflow-y-auto custom-scrollbar flex-1 min-h-0 bg-[#050505] rounded-2xl border border-white/10 p-1 mb-6">
                            <div
                                ref={cardRef}
                                data-card-capture="true"
                                className="w-full p-6 relative overflow-hidden"
                                style={{
                                    minHeight: '400px',
                                    backgroundColor: '#050505',
                                    backgroundImage: `
                        radial-gradient(circle at top right, rgba(37, 99, 235, 0.15) 0%, transparent 35%),
                        radial-gradient(circle at bottom left, rgba(147, 51, 234, 0.15) 0%, transparent 35%)
                      `
                                }}
                            >
                                {/* Header */}
                                <div
                                    className="flex justify-between items-center mb-6 relative z-10 pb-4"
                                    style={{ borderBottom: '1px solid rgba(255,255,255,0.1)' }}
                                >
                                    <div className="flex items-center gap-2">
                                        <img src="/logos.png" alt="SafeScore" className="h-6" style={{ opacity: 0.9 }} />
                                    </div>
                                    <div className="text-right">
                                        <p className="text-xs font-black tracking-wide" style={{ color: '#3b82f6' }}>safescore.pro</p>
                                    </div>
                                </div>

                                {/* Matches List */}
                                <div className="space-y-3 relative z-10">
                                    {predictions
                                        .sort((a, b) => b.confidence - a.confidence)
                                        .slice(0, shareCount)
                                        .map((p, i) => (
                                            <div
                                                key={i}
                                                className="flex items-center gap-3 pb-2 last:pb-0"
                                                style={{ borderBottom: i === shareCount - 1 ? 'none' : '1px solid rgba(255,255,255,0.05)' }}
                                            >
                                                <div className="flex flex-col items-center justify-center w-10 shrink-0">
                                                    <span className="text-[10px] font-bold" style={{ color: '#525252' }}>{formatMatchTime(p.matchTime)}</span>
                                                    {p.confidence >= 90 && <FaTrophy className="text-xs mt-1" style={{ color: '#eab308' }} />}
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-center gap-2">
                                                        <span className="text-sm font-bold truncate" style={{ color: '#ffffff' }}>{truncateText(p.team1, 12)}</span>
                                                        <span className="text-[10px]" style={{ color: '#525252' }}>vs</span>
                                                        <span className="text-sm font-bold truncate" style={{ color: '#ffffff' }}>{truncateText(p.team2, 12)}</span>
                                                    </div>
                                                    <p className="text-[10px] font-black uppercase tracking-wider" style={{ color: '#60a5fa' }}>{formatBetType(p.betType)}</p>
                                                </div>
                                                <div className="shrink-0 text-right">
                                                    <div
                                                        className={`px-2 py-1 rounded text-[10px] font-black`}
                                                        style={{
                                                            color: p.confidence >= 85 ? '#22c55e' : p.confidence >= 70 ? '#eab308' : '#ef4444',
                                                            backgroundColor: p.confidence >= 85 ? 'rgba(34, 197, 94, 0.1)' : p.confidence >= 70 ? 'rgba(234, 179, 8, 0.1)' : 'rgba(239, 68, 68, 0.1)'
                                                        }}
                                                    >
                                                        {p.confidence}%
                                                    </div>
                                                </div>
                                            </div>

                                        ))
                                    }
                                    {predictions.length === 0 && (
                                        <div className="text-center text-xs py-8" style={{ color: '#737373' }}>Generate predictions first!</div>
                                    )}
                                </div>

                                {/* Footer */}
                                <div
                                    className="mt-6 pt-4 flex justify-between items-center relative z-10"
                                    style={{ borderTop: '1px solid rgba(255,255,255,0.1)' }}
                                >
                                    <div className="flex items-center gap-2">
                                        <MdShield className="text-xs" style={{ color: '#3b82f6' }} />
                                        <span className="text-[8px] font-bold uppercase tracking-widest" style={{ color: '#737373' }}>SafeScore Verified</span>
                                    </div>
                                    <div className="text-[8px] font-bold uppercase tracking-widest" style={{ color: '#525252' }}>
                                        {new Date().toLocaleDateString()}
                                    </div>
                                </div>

                            </div>
                        </div>

                        <div className="mt-0 flex justify-end gap-3 shrink-0">
                            <button
                                onClick={handleDownloadImage}
                                className="flex cursor-pointer items-center gap-2 bg-white text-black px-5 py-2.5 rounded-xl font-bold hover:bg-neutral-200 transition-colors"
                            >
                                <FaDownload />
                                <span>Download Slip</span>
                            </button>
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};

export default ShareModal;