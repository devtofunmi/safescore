import type { NextPage } from 'next';
import Head from 'next/head';
import React, { JSX } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { FaXTwitter } from 'react-icons/fa6';
import { FaFutbol, FaDice, FaTrophy, FaPlaneDeparture, FaBullseye, FaChartBar } from 'react-icons/fa';
import { toast } from 'react-toastify';
import Footer from '../components/landing/Footer';


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
  if (confidence >= 90) return 'bg-green-800 text-white';
  if (confidence >= 80) return 'bg-gray-800 text-white';
  return 'bg-[#18181b] text-white';
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



const Results: NextPage = () => {
  const [predictions] = React.useState<Prediction[]>(() => readStoredPredictions());
  const [filters] = React.useState<Filters | null>(() => readStoredFilters());
  const [safestFilter, setSafestFilter] = React.useState<number | null>(null);
  const [copyStatus, setCopyStatus] = React.useState('Copy');
  const [activeTooltipId, setActiveTooltipId] = React.useState<string | null>(null);

  const [selectedPrediction, setSelectedPrediction] = React.useState<Prediction | null>(null);

  const handleTooltipToggle = (predictionId: string) => {
    setActiveTooltipId(prevId => (prevId === predictionId ? null : predictionId));
  };

  const openDetails = (prediction: Prediction) => {
    setSelectedPrediction(prediction);
  };

  const closeDetails = () => {
    setSelectedPrediction(null);
  };

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
      .map(p => `${p.team1} vs ${p.team2} - ${p.betType} (${p.confidence}%)`)
      .join('\n');
    const tweetText = `Here are my football predictions from safescore.vercel.app:\n\n${textToShare}\n\n#safescore #predictions`;
    const twitterUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(tweetText)}`;
    window.open(twitterUrl, '_blank');
  };


  return (
    <>
      <Head>
        <title>Predictions - SafeScore</title>
        <meta name="description" content="Your AI-powered football predictions" />
      </Head>
      <div className="min-h-screen bg-black text-white">
        {/* Header (Animate entrance) */}
        <motion.header
          initial={{ y: -100 }}
          animate={{ y: 0 }}
          className="fixed top-0 left-0 right-0 z-50 border-b-2 border-[#18181b] bg-black backdrop-blur-sm px-4 py-3 ">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between">
              <Link href="/">
                <div className="flex-shrink-0 flex items-center cursor-pointer" >
                  <img src="/logos.png" alt="SafeScore" className="h-10" />
                </div>
              </Link>
              <div className="text-right ">
                <p className="font-bold text-sm text-gray-200">{predictions.length} Predictions</p>
                <p className="text-sm font-bold text-gray-400">Generated Just Now</p>
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
            className="bg-black mt-18 px-4 py-6 sm:px-6 lg:px-8 "
          >
            <div className="mx-auto max-w-7xl">
              <h2 className="mb-4 text-xl font-extrabold">Your Filters:</h2>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                <motion.div whileHover={{ scale: 1.02 }} className="rounded-xl border-2 border-[#18181b] bg-[#18181b] p-4">
                  <p className="text-sm font-bold text-white">Risk Level</p>
                  <p className="text-lg font-extrabold text-white">{filters.oddsType.toUpperCase()}</p>
                </motion.div>
                <motion.div whileHover={{ scale: 1.02 }} className="rounded-xl border-2 border-[#18181b] bg-[#18181b] p-4">
                  <p className="text-sm font-bold text-white">Leagues</p>
                  <p className="text-lg font-extrabold text-white">{filters.leagues.length} Selected</p>
                </motion.div>
                <motion.div whileHover={{ scale: 1.02 }} className="rounded-xl border-2 border-[#18181b] bg-[#18181b] p-4">
                  <p className="text-sm font-bold text-white">Match Day</p>
                  <p className="text-lg font-extrabold text-white">{filters.day.charAt(0).toUpperCase() + filters.day.slice(1)}</p>
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
              className="flex justify-center gap-4 mb-10"
            >
              <button
                onClick={() => setSafestFilter(5)}
                className={`rounded-xl cursor-pointer border-2 px-3 md:px-6 py-2 font-extrabold transition-all border-blue-400 ${safestFilter === 5
                  ? 'bg-blue-400 text-white shadow-lg shadow-blue-400/20'
                  : 'bg-transparent text-gray-300 hover:bg-blue-400/20'
                  }`}
              >
                Top 5
              </button>
              <button
                onClick={() => setSafestFilter(10)}
                className={`rounded-xl cursor-pointer border-2 px-3 md:px-6 py-2 font-extrabold transition-all border-blue-400 ${safestFilter === 10
                  ? 'bg-blue-400 text-white shadow-lg shadow-blue-400/20'
                  : 'bg-transparent text-gray-300 hover:bg-blue-400/20'
                  }`}
              >
                Top 10
              </button>
              <button
                onClick={() => setSafestFilter(null)}
                className={`rounded-xl cursor-pointer border-2 px-3 md:px-6 py-2 font-extrabold transition-all border-blue-400 ${safestFilter === null
                  ? 'bg-blue-400 text-white shadow-lg shadow-blue-400/20'
                  : 'bg-transparent text-gray-300 hover:bg-blue-400/20'
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
                className="rounded-xl border-2 border-[#18181b] bg-[#18181b] p-12 text-center"
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
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ margin: "-50px" }}
                    transition={{ delay: (index % 3) * 0.1, type: "spring", stiffness: 100 }}
                    key={prediction.id || index}
                    className="border border-[#18181b] bg-zinc-900/10 p-5 rounded-xl hover:border-blue-400/50 transition-colors"
                  >
                    <div className="mb-4 flex items-center justify-between border-b-2 border-[#18181b]  pb-4">
                      <div>
                        <p className="text-sm font-bold text-white ">{prediction.league}</p>
                        <p className="text-xs font-bold text-gray-400 ">{prediction.matchTime}</p>
                      </div>
                      <div className={`rounded-full px-4 py-2 font-extrabold ${getConfidenceColor(prediction.confidence)}`}>{prediction.confidence}%</div>
                    </div>
                    <div className="mb-6">
                      <div className="grid grid-cols-3 items-center gap-4">
                        <div className="text-center"><p className="font-bold text-md">{prediction.team1}</p></div>
                        <div className="text-center text-gray-500">vs</div>
                        <div className="text-center"><p className="font-bold text-md">{prediction.team2}</p></div>
                      </div>
                    </div>
                    <div className="mb-6 space-y-4">
                      <div className="rounded-lg bg-[#18181b] p-4 text-white">
                        <p className="text-xs font-bold text-gray-400 uppercase">BET TYPE</p>
                        <div className="mt-1 flex items-center space-x-3">
                          <span className="text-xl text-blue-400">{getBetTypeBadge(prediction.betType)}</span>
                          <p className="text-md font-bold">{prediction.betType}</p>
                        </div>
                      </div>
                      <div className="relative cursor-pointer" onClick={() => handleTooltipToggle(prediction.id)}>
                        <div className="rounded-lg border-2 border-[#18181b] bg-[#18181b]  p-4 hover:border-gray-700 transition-colors">
                          <p className="text-xs font-bold text-gray-400 uppercase">CONFIDENCE SCORE</p>
                          <p className="text-2xl font-bold text-white">{prediction.confidence}%</p>
                        </div>
                        {activeTooltipId === prediction.id && (
                          <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-72 rounded-lg bg-[#18181b] border border-blue-400/30 p-3 text-center text-sm text-white z-10 shadow-2xl"
                          >
                            Confidence reflects both the amount of data available and the predicted strength difference between the teams.
                          </motion.div>
                        )}
                      </div>
                    </div>
                    <motion.div
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      className="rounded-lg border-2 border-[#18181b] bg-[#18181b] p-3 cursor-pointer hover:border-blue-400 transition-colors"
                      onClick={() => openDetails(prediction)}
                    >
                      <div className="flex justify-between items-center">
                        <div>
                          <p className="text-xs font-bold text-blue-400 uppercase">AI ANALYSIS</p>
                          <p className="mt-1 font-bold text-white text-sm">View detailed stats & analysis</p>
                        </div>
                        <div className="bg-blue-400 p-2 rounded-full">
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
              onClick={closeDetails}
            >
              <motion.div
                initial={{ scale: 0.9, y: 20 }}
                animate={{ scale: 1, y: 0 }}
                exit={{ scale: 0.9, y: 20 }}
                className="bg-[#18181b] rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto border border-gray-800 p-6 shadow-2xl custom-scrollbar"
                onClick={e => e.stopPropagation()}
              >
                <div className="flex justify-between items-start mb-6">
                  <div>
                    <h3 className="text-xl font-bold text-white">{selectedPrediction.team1} vs {selectedPrediction.team2}</h3>
                    <p className="text-gray-400 text-sm">{selectedPrediction.league}</p>
                  </div>
                  <button onClick={closeDetails} className="text-gray-400 hover:text-white p-2 text-2xl font-bold">&times;</button>
                </div>

                <div className="space-y-6">
                  {/* Prediction Summary */}
                  <div className="bg-blue-400/10 border border-blue-400/30 rounded-xl p-4 flex justify-between items-center">
                    <div>
                      <p className="text-blue-400 font-bold text-xs uppercase mb-1">Recommended Bet</p>
                      <p className="text-white font-bold text-lg">{selectedPrediction.betType}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-blue-400 font-bold text-xs uppercase mb-1">Confidence</p>
                      <p className="text-white font-bold text-2xl">{selectedPrediction.confidence}%</p>
                    </div>
                  </div>

                  {selectedPrediction.details ? (
                    <>
                      {/* Form Guide */}
                      {/* Form Guide - Only show if valid form data exists */}
                      {(selectedPrediction.details.team1Form !== 'N/A' || selectedPrediction.details.team2Form !== 'N/A') && (
                        <div className="grid grid-cols-2 gap-4">
                          <div className="bg-black/50 p-4 rounded-xl border border-gray-800">
                            <p className="text-gray-400 text-xs font-bold uppercase mb-2">Home Form</p>
                            <div className="flex gap-1 justify-center">
                              {selectedPrediction.details.team1Form !== 'N/A' ? selectedPrediction.details.team1Form.split('').map((r, i) => (
                                <span key={i} className={`w-6 h-6 flex items-center justify-center rounded text-xs font-bold ${r === 'W' ? 'bg-green-500 text-black' :
                                  r === 'D' ? 'bg-gray-500 text-white' :
                                    r === 'L' ? 'bg-red-500 text-white' : 'bg-gray-700 text-gray-400'
                                  }`}>
                                  {r}
                                </span>
                              )) : <span className="text-gray-500 text-xs italic">Data Unavailable</span>}
                            </div>
                          </div>
                          <div className="bg-black/50 p-4 rounded-xl border border-gray-800">
                            <p className="text-gray-400 text-xs font-bold uppercase mb-2">Away Form</p>
                            <div className="flex gap-1 justify-center">
                              {selectedPrediction.details.team2Form !== 'N/A' ? selectedPrediction.details.team2Form.split('').map((r, i) => (
                                <span key={i} className={`w-6 h-6 flex items-center justify-center rounded text-xs font-bold ${r === 'W' ? 'bg-green-500 text-black' :
                                  r === 'D' ? 'bg-gray-500 text-white' :
                                    r === 'L' ? 'bg-red-500 text-white' : 'bg-gray-700 text-gray-400'
                                  }`}>
                                  {r}
                                </span>
                              )) : <span className="text-gray-500 text-xs italic">Data Unavailable</span>}
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Goals Stats - Only show if valid stats exist (sum of goals > 0) */}
                      {(selectedPrediction.details.team1Stats.goalsFor + selectedPrediction.details.team1Stats.goalsAgainst +
                        selectedPrediction.details.team2Stats.goalsFor + selectedPrediction.details.team2Stats.goalsAgainst > 0) ? (
                        <div className="bg-black/50 p-4 rounded-xl border border-gray-800">
                          <h4 className="text-white font-bold mb-4 text-sm uppercase">Season Goals Stats</h4>
                          <div className="grid grid-cols-2 gap-8">
                            <div>
                              <p className="text-gray-300 font-bold mb-2 text-center">{selectedPrediction.team1}</p>
                              <div className="flex justify-between text-sm mb-1 text-gray-400"><span>Scored</span> <span className="text-white">{selectedPrediction.details.team1Stats.goalsFor}</span></div>
                              <div className="flex justify-between text-sm text-gray-400"><span>Conceded</span> <span className="text-white">{selectedPrediction.details.team1Stats.goalsAgainst}</span></div>
                            </div>
                            <div>
                              <p className="text-gray-300 font-bold mb-2 text-center">{selectedPrediction.team2}</p>
                              <div className="flex justify-between text-sm mb-1 text-gray-400"><span>Scored</span> <span className="text-white">{selectedPrediction.details.team2Stats.goalsFor}</span></div>
                              <div className="flex justify-between text-sm text-gray-400"><span>Conceded</span> <span className="text-white">{selectedPrediction.details.team2Stats.goalsAgainst}</span></div>
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div className="bg-black/50 p-4 rounded-xl border border-gray-800 text-center">
                          <h4 className="text-white font-bold mb-2 text-sm uppercase">Season Goals Stats</h4>
                          <p className="text-gray-500 text-sm italic">Season statistics unavailable for this league.</p>
                        </div>
                      )}

                      {/* H2H */}
                      {/* H2H - Only show if data exists (sum > 0) */}
                      {(selectedPrediction.details.h2h.homeWins + selectedPrediction.details.h2h.draws + selectedPrediction.details.h2h.awayWins > 0) ? (
                        <div className="bg-black/50 p-4 rounded-xl border border-gray-800 text-center">
                          <h4 className="text-white font-bold mb-4 text-sm uppercase">Head to Head History</h4>
                          <div className="flex justify-center items-center gap-6">
                            <div className="text-center">
                              <div className="text-2xl font-bold text-white">{selectedPrediction.details.h2h.homeWins}</div>
                              <div className="text-xs text-gray-500">Home Wins</div>
                            </div>
                            <div className="text-center">
                              <div className="text-2xl font-bold text-gray-400">{selectedPrediction.details.h2h.draws}</div>
                              <div className="text-xs text-gray-500">Draws</div>
                            </div>
                            <div className="text-center">
                              <div className="text-2xl font-bold text-white">{selectedPrediction.details.h2h.awayWins}</div>
                              <div className="text-xs text-gray-500">Away Wins</div>
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div className="bg-black/50 p-4 rounded-xl border border-gray-800 text-center">
                          <h4 className="text-white font-bold mb-2 text-sm uppercase">Head to Head History</h4>
                          <p className="text-gray-500 text-sm italic">Historical H2H data unavailable for this matchup.</p>
                        </div>
                      )}
                    </>
                  ) : (
                    <div className="p-8 text-center text-gray-500">
                      Detailed statistics are not available for this legacy prediction. Please generate a new prediction.
                    </div>
                  )}
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="flex gap-4 mt-8 justify-center">
          <Link href="/home">
            <button className="rounded-full cursor-pointer border-2 border-blue-400 bg-blue-400 text-white hover:bg-blue-500 px-8 py-3 font-extrabold transition-all shadow-lg hover:scale-105">New Prediction</button>
          </Link>
          {/* <button className="rounded-full cursor-pointer border-2 border-black bg-white px-8 py-3 font-extrabold text-black hover:bg-gray-100 transition-all">Save Results</button> */}
        </div>

        <Footer />
      </div>
    </>
  );
};

export default Results;