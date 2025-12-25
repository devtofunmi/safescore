import type { NextPage } from 'next';
import SEO from '../components/SEO';
import React, { JSX } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { FaXTwitter } from 'react-icons/fa6';
import { FaFutbol, FaDice, FaTrophy, FaPlaneDeparture, FaBullseye, FaChartBar } from 'react-icons/fa';
import { MdShield, MdCalendarToday } from 'react-icons/md';
import { IoFootballOutline } from 'react-icons/io5';
import { toast } from 'react-toastify';
import Footer from '../components/landing/Footer';
import { track } from '@vercel/analytics';
import { useAuth } from '@/lib/auth';
import { useRouter } from 'next/router';



interface Prediction {
  id: string;
  team1: string;
  team2: string;
  betType: string;
  confidence: number;
  league: string;
  matchTime: string;
  details?: {
    team1Form: string;
    team2Form: string;
    team1Stats: {
      goalsFor: number;
      goalsAgainst: number;
    };
    team2Stats: {
      goalsFor: number;
      goalsAgainst: number;
    };
    h2h: {
      homeWins: number;
      awayWins: number;
      draws: number;
    };
    reasoning?: string;
  };
}

interface Filters {
  oddsType: string;
  leagues: string[];
  day: string;
}

const readStoredPredictions = (): Prediction[] => {
  if (typeof window === 'undefined') return [];
  const raw = sessionStorage.getItem('predictions');
  if (!raw || raw === 'undefined') return [];
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (e) {
    console.warn('Invalid storedPredictions in sessionStorage, clearing it.', e);
    sessionStorage.removeItem('predictions');
    return [];
  }
};

const readStoredFilters = (): Filters | null => {
  if (typeof window === 'undefined') return null;
  const raw = sessionStorage.getItem('filters');
  if (!raw || raw === 'undefined') return null;
  try {
    return JSON.parse(raw);
  } catch (e) {
    console.warn('Invalid storedFilters in sessionStorage, clearing it.', e);
    sessionStorage.removeItem('filters');
    return null;
  }
};

const getConfidenceColor = (confidence: number) => {
  if (confidence >= 85) return 'bg-green-500/10 text-green-500 border border-green-500/20';
  if (confidence >= 70) return 'bg-yellow-500/10 text-yellow-500 border border-yellow-500/20';
  return 'bg-red-500/10 text-red-500 border border-red-500/20';
};

const getBetTypeBadge = (betType: string) => {
  const badges: { [key: string]: JSX.Element } = {
    'Over 0.5 goals': <FaFutbol />,
    'Double chance': <FaDice />,
    'Home win': <FaTrophy />,
    'Away win': <FaPlaneDeparture />,
    'Both teams score': <FaBullseye />,
  };
  return badges[betType] || <FaChartBar />;
};



const truncateText = (text: string, length: number = 10) => {
  if (!text) return '';
  return text.length > length ? text.substring(0, length) + '...' : text;
};

const Results: NextPage = () => {
  const [predictions] = React.useState<Prediction[]>(() => readStoredPredictions());
  const [filters] = React.useState<Filters | null>(() => readStoredFilters());
  const [safestFilter, setSafestFilter] = React.useState<number | null>(10);
  const [copyStatus, setCopyStatus] = React.useState('Copy');
  const [activeTooltipId, setActiveTooltipId] = React.useState<string | null>(null);

  const [selectedPrediction, setSelectedPrediction] = React.useState<Prediction | null>(null);
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();

  React.useEffect(() => {
    if (!authLoading && !user) {
      router.push('/auth/login');
    }
  }, [user, authLoading, router]);


  const handleTooltipToggle = (predictionId: string) => {
    setActiveTooltipId(prevId => (prevId === predictionId ? null : predictionId));
  };

  const openDetails = (prediction: Prediction) => {
    // console.debug('Opening AI Details for:', prediction.team1, 'vs', prediction.team2);
    // console.debug('Raw details data:', JSON.stringify(prediction.details, null, 2));
    setSelectedPrediction(prediction);
  };

  const closeDetails = () => {
    setSelectedPrediction(null);
  };

  React.useEffect(() => {
    if (selectedPrediction) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [selectedPrediction]);

  const displayedPredictions = React.useMemo(() => {
    if (safestFilter === null) {
      return predictions;
    }
    return [...predictions]
      .sort((a, b) => b.confidence - a.confidence)
      .slice(0, safestFilter);
  }, [predictions, safestFilter]);

  const copyToClipboard = () => {
    const textToCopy = displayedPredictions
      .map(p => `${p.team1} vs ${p.team2} - ${p.betType} (${p.confidence}%)`)
      .join('\n');
    navigator.clipboard.writeText(textToCopy).then(
      () => {
        setCopyStatus('Copied!');
        toast.success('Predictions copied to clipboard!');
        track('copy_predictions', { count: displayedPredictions.length });
        setTimeout(() => setCopyStatus('Copy'), 2000);
      },
      err => {
        console.error('Failed to copy predictions: ', err);
        setCopyStatus('Failed');
        toast.error('Failed to copy to clipboard.');
        setTimeout(() => setCopyStatus('Copy'), 2000);
      }
    );
  };

  const shareToTwitter = () => {
    const textToShare = displayedPredictions
      .map(p => `• ${p.team1} vs ${p.team2}: ${p.betType}`)
      .join('\n');
    const tweetText = `Just generated these high-probability predictions on SafeScore! \n\n${textToShare}\n\n`;
    const shareUrl = 'https://www.safescore.pro';
    const twitterUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(tweetText)}&url=${encodeURIComponent(shareUrl)}&hashtags=SafeScore,Picks`;
    track('share_to_twitter', { count: displayedPredictions.length });
    window.open(twitterUrl, '_blank');
  };


  return (
    <>
      <SEO
        title="Your Predictions"
        description="View your Generated football predictions with confidence scores and detailed analysis."
      />
      <div className="min-h-screen bg-[#050505] text-white custom-scrollbar">
        {/* Header (Animate entrance) */}
        <motion.header
          initial={{ y: -100 }}
          animate={{ y: 0 }}
          className="fixed top-0 left-0 right-0 z-50 border-b border-white/5 bg-[#0a0a0a]/80 backdrop-blur-xl px-4 py-4 ">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between">
              <Link href="/dashboard">
                <div className="flex-shrink-0 flex items-center cursor-pointer" >
                  <img src="/logos.png" alt="SafeScore" className="h-10" />
                </div>
              </Link>
              <div className="text-right ">
                <p className="font-bold text-sm text-white tracking-tight">{predictions.length} Predictions</p>
                <p className="text-xs font-bold text-neutral-500 uppercase tracking-widest">Generated Just Now</p>
              </div>

            </div>
          </div>
        </motion.header>

        {/* Filters Summary */}
        {filters && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="bg-[#050505] mt-18 px-4 py-6 sm:px-6 lg:px-8 ">
            <div className="mx-auto max-w-7xl">
              <h1 className="mb-2 text-3xl md:text-4xl font-extrabold text-white tracking-tight">Match <span className="text-blue-500">Predictions</span></h1>
              <p className="mb-6 text-neutral-500 text-base font-medium leading-relaxed">Based on your selected filters and data-driven analysis.</p>
              <h2 className="mb-4 text-xl font-extrabold tracking-tight">Your Filters:</h2>
              <div className="grid grid-cols-2 gap-2 md:grid-cols-3 md:gap-4">
                <motion.div whileHover={{ scale: 1.02 }} className="p-3 md:p-6 bg-[#0a0a0a] border border-white/5 rounded-2xl md:rounded-[2rem] hover:border-blue-500/30 transition-all group relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-24 h-24 bg-blue-600/5 blur-3xl -mr-12 -mt-12 group-hover:bg-blue-600/10 transition-colors" />
                  <MdShield className="text-neutral-600 group-hover:text-blue-500 transition-colors mb-2 md:mb-6" size={24} />
                  <p className="text-[10px] md:text-xs font-bold text-neutral-500 uppercase tracking-widest mb-1">Risk Level</p>
                  <p className="text-lg md:text-3xl font-black">{filters.oddsType.toUpperCase()}</p>
                </motion.div>
                <motion.div whileHover={{ scale: 1.02 }} className="p-3 md:p-6 bg-[#0a0a0a] border border-white/5 rounded-2xl md:rounded-[2rem] hover:border-blue-500/30 transition-all group relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-24 h-24 bg-blue-600/5 blur-3xl -mr-12 -mt-12 group-hover:bg-blue-600/10 transition-colors" />
                  <IoFootballOutline className="text-neutral-600 group-hover:text-blue-500 transition-colors mb-2 md:mb-6" size={24} />
                  <p className="text-[10px] md:text-xs font-bold text-neutral-500 uppercase tracking-widest mb-1">Leagues</p>
                  <p className="text-lg md:text-3xl font-black">{filters.leagues.length} Selected</p>
                </motion.div>
                <motion.div whileHover={{ scale: 1.02 }} className="p-3 md:p-6 bg-[#0a0a0a] border border-white/5 rounded-2xl md:rounded-[2rem] hover:border-blue-500/30 transition-all group relative overflow-hidden col-span-2 md:col-span-1">
                  <div className="absolute top-0 right-0 w-24 h-24 bg-blue-600/5 blur-3xl -mr-12 -mt-12 group-hover:bg-blue-600/10 transition-colors" />
                  <MdCalendarToday className="text-neutral-600 group-hover:text-blue-500 transition-colors mb-2 md:mb-6" size={24} />
                  <p className="text-[10px] md:text-xs font-bold text-neutral-500 uppercase tracking-widest mb-1">Match Day</p>
                  <p className="text-lg md:text-3xl font-black">{filters.day.charAt(0).toUpperCase() + filters.day.slice(1)}</p>
                </motion.div>
              </div>
            </div>
          </motion.div>
        )}

        <main className="mx-auto w-full px-4 pt-12 pb-12 sm:px-6 lg:px-8">
          {predictions.length > 0 && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="flex flex-wrap justify-center gap-2 md:gap-4 mb-8 md:mb-10"
            >
              <button
                onClick={() => setSafestFilter(5)}
                className={`rounded-xl cursor-pointer border-2 px-3 md:px-6 py-2 font-extrabold transition-all border-blue-500 ${safestFilter === 5
                  ? 'bg-blue-500 text-white shadow-lg shadow-blue-500/20'
                  : 'bg-transparent text-gray-300 hover:bg-blue-500/20'
                  }`}
              >
                Top 5
              </button>
              <button
                onClick={() => setSafestFilter(10)}
                className={`rounded-xl cursor-pointer border-2 px-3 md:px-6 py-2 font-extrabold transition-all border-blue-500 ${safestFilter === 10
                  ? 'bg-blue-500 text-white shadow-lg shadow-blue-500/20'
                  : 'bg-transparent text-gray-300 hover:bg-blue-500/20'
                  }`}
              >
                Top 10
              </button>
              <button
                onClick={() => setSafestFilter(null)}
                className={`rounded-xl cursor-pointer border-2 px-3 md:px-6 py-2 font-extrabold transition-all border-blue-500 ${safestFilter === null
                  ? 'bg-blue-500 text-white shadow-lg shadow-blue-500/20'
                  : 'bg-transparent text-gray-300 hover:bg-blue-500/20'
                  }`}
              >
                All
              </button>
              <button
                onClick={copyToClipboard}
                className="rounded-xl hidden md:block cursor-pointer border-2 px-3 md:px-6 py-2 font-extrabold transition-all bg-black text-gray-300 border-[#18181b] hover:border-gray-500"
              >
                {copyStatus}
              </button>
              <button
                onClick={shareToTwitter}
                className="rounded-xl cursor-pointer border-2 px-3 md:px-6 py-2 font-extrabold transition-all bg-[#1DA1F2] text-white border-[#1DA1F2]"
              >
                <FaXTwitter />
              </button>
            </motion.div>
          )}

          <AnimatePresence mode="popLayout">
            {displayedPredictions.length === 0 ? (
              <motion.div
                key="empty"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="rounded-xl border-2 border-[#18181b] mt-20 bg-[#18181b] p-12 text-center"
              >
                <p className="text-2xl font-extrabold text-white  mb-4">No Predictions Found</p>
                <p className="font-bold text-white mb-6">Try adjusting your filters and generating predictions again.</p>
                <Link href="/home">
                  <button className="rounded-full cursor-pointer border-2 bg-blue-400 text-white px-8 py-3 font-extrabold hover:bg-blue-500 border-blue-400 transition-all shadow-lg hover:scale-105">Create New Prediction</button>
                </Link>
              </motion.div>
            ) : (
              <motion.div
                key="grid"
                layout
                className="grid grid-cols-1 gap-6 lg:grid-cols-3"
              >
                {displayedPredictions.map((prediction, index) => (
                  <motion.div
                    layout
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: (index % 3) * 0.1, type: "spring", stiffness: 100 }}
                    key={prediction.id || index}
                    className={`border border-white/5 bg-[#0c0c0c] p-6 rounded-3xl transition-all relative overflow-hidden hover:bg-white/[0.03] group ${index < 10
                      ? 'border-blue-500/20'
                      : ''
                      }`}
                  >
                    {index < 10 && (
                      <div className="absolute top-0 right-0 bg-gradient-to-l from-blue-600 to-blue-500 text-white text-[10px] font-extrabold px-3 py-1 rounded-bl-2xl shadow-lg shadow-blue-500/20">
                        AI VERIFIED
                      </div>
                    )}
                    <div className="mb-4 flex items-center justify-between border-b border-white/5 pb-4">
                      <div>
                        <p className="text-sm font-bold text-white tracking-tight">{prediction.league}</p>
                        <p className="text-xs font-bold text-neutral-500 uppercase tracking-widest">{prediction.matchTime}</p>
                      </div>
                      <div className={`rounded-full px-4 py-2 font-extrabold text-xs uppercase tracking-widest ${getConfidenceColor(prediction.confidence)}`}>{prediction.confidence}%</div>
                    </div>
                    <div className="mb-6">
                      <div className="grid grid-cols-3 items-center gap-4">
                        <div className="text-center"><p className="font-bold text-base" title={prediction.team1}>{truncateText(prediction.team1)}</p></div>
                        <div className="text-center text-neutral-500 font-bold">vs</div>
                        <div className="text-center"><p className="font-bold text-base" title={prediction.team2}>{truncateText(prediction.team2)}</p></div>
                      </div>
                    </div>
                    <div className="mb-6 space-y-4">
                      <div className="rounded-2xl bg-[#0a0a0a] border border-white/5 p-4 text-white">
                        <p className="text-xs font-bold text-neutral-500 uppercase tracking-widest">BET TYPE</p>
                        <div className="mt-2 flex items-center space-x-3">
                          <span className="text-xl text-blue-500">{getBetTypeBadge(prediction.betType)}</span>
                          <p className="text-sm font-bold">{prediction.betType}</p>
                        </div>
                      </div>
                      <div className="relative cursor-pointer" onClick={() => handleTooltipToggle(prediction.id)}>
                        <div className="rounded-2xl border border-white/5 bg-[#0a0a0a] p-4 hover:bg-white/[0.03] transition-all">
                          <p className="text-xs font-bold text-neutral-500 uppercase tracking-widest">CONFIDENCE SCORE</p>
                          <p className="text-2xl font-bold text-white mt-1">{prediction.confidence}%</p>
                        </div>
                        {activeTooltipId === prediction.id && (
                          <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-72 rounded-2xl bg-[#0a0a0a] border border-blue-500/30 p-4 text-center text-sm text-white z-10 shadow-2xl backdrop-blur-xl"
                          >
                            Confidence reflects both the amount of data available and the predicted strength difference between the teams.
                          </motion.div>
                        )}
                      </div>
                    </div>
                    <motion.div
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      className="rounded-2xl border border-white/5 bg-[#0a0a0a] p-4 cursor-pointer hover:bg-white/[0.03] transition-all"
                      onClick={() => openDetails(prediction)}
                    >
                      <div className="flex justify-between items-center">
                        <div>
                          <p className="text-xs font-bold text-blue-500 uppercase tracking-widest">AI ANALYSIS</p>
                          <p className="mt-1 font-bold text-white text-sm">View detailed stats & analysis</p>
                        </div>
                        <div className="bg-blue-500 p-2 rounded-full">
                          <FaChartBar className="text-white" />
                        </div>
                      </div>
                    </motion.div>
                  </motion.div>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </main>

        {/* Details Modal */}
        <AnimatePresence>
          {selectedPrediction && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
            >
              <motion.div
                initial={{ scale: 0.9, y: 20 }}
                animate={{ scale: 1, y: 0 }}
                exit={{ scale: 0.9, y: 20 }}
                className="bg-[#0c0c0c] rounded-3xl w-full max-w-2xl max-h-[90vh] overflow-y-auto border border-white/5 p-5 md:p-8 shadow-2xl custom-scrollbar"
                onClick={e => e.stopPropagation()}
              >
                <div className="flex justify-between items-start mb-6">
                  <div>
                    <h3 className="text-2xl font-extrabold text-white tracking-tight" title={`${selectedPrediction.team1} vs ${selectedPrediction.team2}`}>
                      {truncateText(selectedPrediction.team1, 12)} vs {truncateText(selectedPrediction.team2, 12)}
                    </h3>
                    <p className="text-neutral-500 text-sm font-bold uppercase tracking-widest mt-1">{selectedPrediction.league}</p>
                  </div>
                  <button onClick={closeDetails} className="cursor-pointer text-neutral-500 hover:text-white p-2 text-2xl font-bold transition-colors">×</button>
                </div>

                <div className="space-y-6">
                  {/* Prediction Summary */}
                  <div className="bg-blue-500/10 border border-blue-500/30 rounded-2xl p-5 flex justify-between items-center">
                    <div>
                      <p className="text-blue-500 font-bold text-xs uppercase tracking-widest mb-1">Recommended Bet</p>
                      <p className="text-white font-extrabold text-lg tracking-tight">{selectedPrediction.betType}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-blue-500 font-bold text-xs uppercase tracking-widest mb-1">Confidence</p>
                      <p className="text-white font-extrabold text-2xl">{selectedPrediction.confidence}%</p>
                    </div>
                  </div>

                  {selectedPrediction.details ? (
                    <>
                      {/* AI Reasoning Section */}
                      {selectedPrediction.details.reasoning && (
                        <div className="bg-gradient-to-br from-yellow-500/10 to-amber-500/5 border border-yellow-500/30 rounded-2xl p-6 shadow-lg relative overflow-hidden">
                          <div className="absolute top-0 right-0 p-4 opacity-20">
                            <FaBullseye className="text-4xl text-yellow-500" />
                          </div>
                          <p className="text-yellow-500 text-xs font-black uppercase mb-3 tracking-widest flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-yellow-500 animate-pulse"></span>
                            Verified AI Analysis
                          </p>
                          <p className="text-white text-sm leading-relaxed font-medium">
                            "{selectedPrediction.details.reasoning}"
                          </p>
                        </div>
                      )}

                      {/* Form Guide */}
                      {/* Form Guide */}
                      {selectedPrediction.details.team1Form && selectedPrediction.details.team1Form !== 'N/A' && (
                        <div className="grid grid-cols-2 gap-4">
                          <div className="bg-[#0a0a0a] border border-white/5 p-5 rounded-2xl">
                            <p className="text-neutral-500 text-xs font-bold uppercase tracking-widest mb-3">Home Form</p>
                            <div className="flex gap-1 justify-center">
                              {selectedPrediction.details.team1Form.split('').map((r, i) => (
                                <span key={i} className={`w-6 h-6 flex items-center justify-center rounded text-xs font-bold ${r === 'W' ? 'bg-green-500 text-black' :
                                  r === 'D' ? 'bg-gray-500 text-white' :
                                    r === 'L' ? 'bg-red-500 text-white' : 'bg-gray-700 text-gray-400'
                                  }`}>
                                  {r}
                                </span>
                              ))}
                            </div>
                          </div>
                          <div className="bg-[#0a0a0a] border border-white/5 p-5 rounded-2xl">
                            <p className="text-neutral-500 text-xs font-bold uppercase tracking-widest mb-3">Away Form</p>
                            <div className="flex gap-1 justify-center">
                              {selectedPrediction.details.team2Form.split('').map((r, i) => (
                                <span key={i} className={`w-6 h-6 flex items-center justify-center rounded text-xs font-bold ${r === 'W' ? 'bg-green-500 text-black' :
                                  r === 'D' ? 'bg-gray-500 text-white' :
                                    r === 'L' ? 'bg-red-500 text-white' : 'bg-gray-700 text-gray-400'
                                  }`}>
                                  {r}
                                </span>
                              ))}
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Goals Stats */}
                      {selectedPrediction.details.team1Stats && (
                        <div className="bg-[#0a0a0a] border border-white/5 p-5 rounded-2xl">
                          <h4 className="text-white font-extrabold mb-4 text-sm uppercase tracking-widest">Season Goals Stats</h4>
                          <div className="grid grid-cols-2 gap-8">
                            <div>
                              <p className="text-white font-bold mb-3 text-center" title={selectedPrediction.team1}>{truncateText(selectedPrediction.team1)}</p>
                              <div className="flex justify-between text-sm mb-2 text-neutral-400"><span>Scored</span> <span className="text-white font-bold">{selectedPrediction.details.team1Stats.goalsFor}</span></div>
                              <div className="flex justify-between text-sm text-neutral-400"><span>Conceded</span> <span className="text-white font-bold">{selectedPrediction.details.team1Stats.goalsAgainst}</span></div>
                            </div>
                            <div>
                              <p className="text-white font-bold mb-3 text-center" title={selectedPrediction.team2}>{truncateText(selectedPrediction.team2)}</p>
                              <div className="flex justify-between text-sm mb-2 text-neutral-400"><span>Scored</span> <span className="text-white font-bold">{selectedPrediction.details.team2Stats.goalsFor}</span></div>
                              <div className="flex justify-between text-sm text-neutral-400"><span>Conceded</span> <span className="text-white font-bold">{selectedPrediction.details.team2Stats.goalsAgainst}</span></div>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* H2H */}
                      {selectedPrediction.details.h2h && (selectedPrediction.details.h2h.homeWins + selectedPrediction.details.h2h.draws + selectedPrediction.details.h2h.awayWins > 0) && (
                        <div className="bg-[#0a0a0a] border border-white/5 p-5 rounded-2xl text-center">
                          <h4 className="text-white font-extrabold mb-4 text-sm uppercase tracking-widest">Head to Head History</h4>
                          <div className="flex justify-center items-center gap-6">
                            <div className="text-center">
                              <div className="text-2xl font-bold text-white">{selectedPrediction.details.h2h.homeWins}</div>
                              <div className="text-xs text-neutral-500 uppercase tracking-widest mt-1">Home Wins</div>
                            </div>
                            <div className="text-center">
                              <div className="text-2xl font-bold text-neutral-400">{selectedPrediction.details.h2h.draws}</div>
                              <div className="text-xs text-neutral-500 uppercase tracking-widest mt-1">Draws</div>
                            </div>
                            <div className="text-center">
                              <div className="text-2xl font-bold text-white">{selectedPrediction.details.h2h.awayWins}</div>
                              <div className="text-xs text-neutral-500 uppercase tracking-widest mt-1">Away Wins</div>
                            </div>
                          </div>
                        </div>
                      )}
                    </>
                  ) : (
                    <div className="p-8 text-center text-neutral-500 font-medium">
                      Detailed statistics are not available for this legacy prediction. Please generate a new prediction.
                    </div>
                  )}
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="flex flex-col sm:flex-row gap-4 mt-12 justify-center items-center">
          <Link href="/dashboard">
            <button className="w-full sm:w-auto rounded-full cursor-pointer border border-white/10 bg-white/5 text-white hover:bg-white/10 px-8 py-3 font-extrabold transition-all">Back to Dashboard</button>
          </Link>
          <Link href="/home">
            <button className="w-full sm:w-auto rounded-full cursor-pointer border border-blue-500/20 bg-blue-500 text-white hover:bg-blue-600 px-10 py-3 font-extrabold transition-all shadow-lg shadow-blue-500/20 hover:scale-105">New Prediction</button>
          </Link>
        </div>

        <Footer />
      </div>
    </>
  );
};

export default Results;