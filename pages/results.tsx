import type { NextPage } from 'next';
import Head from 'next/head';
import React, { JSX } from 'react';
import Link from 'next/link';
import { FaXTwitter } from 'react-icons/fa6';
import { FaFutbol, FaDice, FaTrophy, FaPlaneDeparture, FaBullseye, FaChartBar } from 'react-icons/fa';
import Footer from '../components/landing/Footer';


interface Prediction {
  id: string;
  team1: string;
  team2: string;
  betType: string;
  confidence: number;
  league: string;
  matchTime: string;
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

  const handleTooltipToggle = (predictionId: string) => {
    setActiveTooltipId(prevId => (prevId === predictionId ? null : predictionId));
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
        setTimeout(() => setCopyStatus('Copy'), 2000);
      },
      err => {
        console.error('Failed to copy predictions: ', err);
        setCopyStatus('Failed');
        setTimeout(() => setCopyStatus('Copy'), 2000);
      }
    );
  };

  const shareToTwitter = () => {
    const textToShare = displayedPredictions
      .map(p => `${p.team1} vs ${p.team2} - ${p.betType} (${p.confidence}%)`)
      .join('\n');
    const tweetText = `Here are my football predictions from safescore.vercel.app:\n\n${textToShare}\n\n#safescore #AI #predictions`;
    const twitterUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(tweetText)}`;
    window.open(twitterUrl, '_blank');
  };


  return (
    <>
      <Head>
        <title>Predictions - SafeScore</title>
        <meta name="description" content="Your AI-powered football predictions" />
      </Head>
      <div className="min-h-screen bg-blacktext-white">
        {/* Header */}
        <header className="fixed top-0 left-0 right-0 z-50 border-b-2 border-[#18181b] bg-black backdrop-blur-sm px-4 py-3 ">
          <div className="mx-auto max-w-7xl">
            <div className="flex items-center justify-between">
              <Link href="/">
                <div className="cursor-pointer">
                  <img src="/logos.png" alt="SafeScore Logo" className="h-12" />
                </div>
              </Link>
              <div className="text-right ">
                <p className="font-bold text-sm text-gray-200">{predictions.length} Predictions</p>
                <p className="text-sm font-bold text-gray-400">Generated Just Now</p>
              </div>

            </div>
          </div>
        </header>

        {/* Filters Summary */}
        {filters && (
          <div className="bg-black mt-18 px-4 py-6 sm:px-6 lg:px-8 ">
            <div className="mx-auto max-w-7xl">
              <h2 className="mb-4 text-xl font-extrabold">Your Filters:</h2>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                <div className="rounded-xl border-2 border-[#18181b] bg-[#18181b] p-4">
                  <p className="text-sm font-bold text-white">Risk Level</p>
                  <p className="text-lg font-extrabold text-white">{filters.oddsType.toUpperCase()}</p>
                </div>
                <div className="rounded-xl border-2 border-[#18181b] bg-[#18181b] p-4">
                  <p className="text-sm font-bold text-white">Leagues</p>
                  <p className="text-lg font-extrabold text-white">{filters.leagues.length} Selected</p>
                </div>
                <div className="rounded-xl border-2 border-[#18181b] bg-[#18181b] p-4">
                  <p className="text-sm font-bold text-white">Match Day</p>
                  <p className="text-lg font-extrabold text-white">{filters.day.charAt(0).toUpperCase() + filters.day.slice(1)}</p>
                </div>
              </div>
            </div>
          </div>
        )}

        <main className="mx-auto w-full px-4 pt-28 pb-12 sm:px-6 lg:px-8">
          {predictions.length > 0 && (
            <div className="flex justify-center gap-4 mb-6">
              <button
                onClick={() => setSafestFilter(5)}
                className={`rounded-xl cursor-pointer border-2 px-3 md:px-6 py-2 font-extrabold transition-all ${safestFilter === 5
                  ? '  bg-white text-black'
                  : 'bg-black text-white border-[#18181b]'
                  }`}
              >
                Top 5
              </button>
              <button
                onClick={() => setSafestFilter(10)}
                className={`rounded-xl cursor-pointer border-2 px-3 md:px-6 py-2 font-extrabold transition-all ${safestFilter === 10
                  ? 'bg-white text-black'
                  : 'bg-black text-white border-[#18181b]'
                  }`}
              >
                Top 10
              </button>
              <button
                onClick={() => setSafestFilter(null)}
                className={`rounded-xl cursor-pointer border-2 px-3 md:px-6 py-2 font-extrabold transition-all ${safestFilter === null
                  ? 'bg-white text-black'
                  : 'bg-black text-white border-[#18181b]'
                  }`}
              >
                All
              </button>
              <button
                onClick={copyToClipboard}
                className="rounded-xl hidden md:block cursor-pointer border-2 px-3 md:px-6 py-2 font-extrabold transition-all bg-black text-white border-[#18181b]"
              >
                {copyStatus}
              </button>
              <button
                onClick={shareToTwitter}
                className="rounded-xl cursor-pointer border-2 px-3 md:px-6 py-2 font-extrabold transition-all bg-[#1DA1F2] text-white border-[#1DA1F2]"
              >
                <FaXTwitter />
              </button>
            </div>
          )}
          {displayedPredictions.length === 0 ? (
            <div className="rounded-xl border-2 border-[#18181b] bg-[#18181b] p-12 text-center">
              <p className="text-2xl font-extrabold text-white  mb-4">No Predictions Found</p>
              <p className="font-bold text-white mb-6">Try adjusting your filters and generating predictions again.</p>
              <Link href="/">
                <button className="rounded-xl cursor-pointer border-2  bg-white px-8 py-3 font-extrabold text-black  hover:bg-[#18181b] border-[#18181b]  transition-all">Create New Prediction</button>
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
              {displayedPredictions.map((prediction, index) => (
                <div key={prediction.id || index} className="border border-[#18181b]  p-5 rounded-xl">
                  <div className="mb-4 flex items-center justify-between border-b-2 border-[#18181b]  pb-4">
                    <div>
                      <p className="text-sm font-bold text-white ">{prediction.league}</p>
                      <p className="text-xs font-bold text-white ">{prediction.matchTime}</p>
                    </div>
                    <div className={`rounded-full bg-[#18181b] px-4 py-2 font-extrabold ${getConfidenceColor(prediction.confidence)}`}>{prediction.confidence}%</div>
                  </div>
                  <div className="mb-6">
                    <div className="grid grid-cols-3 items-center gap-4">
                      <div className="text-center"><p className="font-bold text-md">{prediction.team1}</p></div>
                      <div className="text-center"><p className="text-xl">vs</p> </div>
                      <div className="text-center"><p className="font-bold text-md">{prediction.team2}</p></div>
                    </div>
                  </div>
                  <div className="mb-6 space-y-4">
                    <div className="rounded-lg bg-[#18181b] p-4 text-white">
                      <p className="text-xs font-bold text-gray-300">BET TYPE</p>
                      <div className="flex items-center space-x-3">
                        <span className="text-xl">{getBetTypeBadge(prediction.betType)}</span>
                        <p className="text-md font-bold">{prediction.betType}</p>
                      </div>
                    </div>
                    <div className="relative cursor-pointer" onClick={() => handleTooltipToggle(prediction.id)}>
                      <div className="rounded-lg border-2 border-[#18181b] bg-[#18181b]  p-4">
                        <p className="text-xs font-bold text-white">CONFIDENCE</p>
                        <p className="text-2xl font-bold text-white">{prediction.confidence}%</p>
                      </div>
                      {activeTooltipId === prediction.id && (
                        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-72 rounded-lg bg-[#18181b] border border-white p-3 text-center text-sm text-white z-10">
                          Confidence reflects both the amount of data available and the predicted strength difference between the teams.
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="rounded-lg border-2 border-[#18181b] bg-[#18181b]  p-3">
                    <p className="text-xs font-bold text-white">AI ANALYSIS</p>
                    <p className="mt-1 font-bold text-white">High-probability prediction based on team form, head-to-head history, and statistical analysis.</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </main>
        <div className="flex gap-4 justify-center">
          <Link href="/">
            <button className="rounded-xl cursor-pointer border-2 border-black  bg-white text-black hover:bg-[#18181b] hover:text-white px-8 py-3 font-extrabold   transition-all">New Prediction</button>
          </Link>
          {/* <button className="rounded-full cursor-pointer border-2 border-black bg-white px-8 py-3 font-extrabold text-black hover:bg-gray-100 transition-all">Save Results</button> */}
        </div>

        <Footer />
      </div>
    </>
  );
};

export default Results;