import React, { JSX } from 'react';
import Link from 'next/link';
import { FiCoffee } from 'react-icons/fi';
import { AiOutlineHeart } from 'react-icons/ai';
import { FaXTwitter } from 'react-icons/fa6';
import { FaFutbol, FaDice, FaTrophy, FaPlaneDeparture, FaBullseye, FaChartBar } from 'react-icons/fa';
import { MdOutlineLightMode, MdDarkMode } from 'react-icons/md';

interface Prediction {
  id: string;
  team1: string;
  team2: string;
  betType: string;
  confidence: number;
  odds: number;
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
  if (confidence >= 90) return 'bg-black text-white';
  if (confidence >= 80) return 'bg-gray-800 text-white';
  return 'bg-gray-700 text-white';
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

export default function ResultsClient() {
  const [predictions] = React.useState<Prediction[]>(() => readStoredPredictions());
  const [filters] = React.useState<Filters | null>(() => readStoredFilters());
  const [safestFilter, setSafestFilter] = React.useState<number | null>(null);

  const displayedPredictions = React.useMemo(() => {
    if (safestFilter === null) {
      return predictions;
    }
    return [...predictions]
      .sort((a, b) => b.confidence - a.confidence)
      .slice(0, safestFilter);
  }, [predictions, safestFilter]);

  const [theme, setTheme] = React.useState<'light' | 'dark'>(() => {
    if (typeof window === 'undefined') return 'light';
    const stored = localStorage.getItem('theme');
    if (stored === 'dark' || stored === 'light') return stored as 'light' | 'dark';
    return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  });

  React.useEffect(() => {
    if (typeof window === 'undefined') return;
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [theme]);

  const toggleTheme = () => {
    setTheme(theme === 'dark' ? 'light' : 'dark');
  };

  return (
    <div className="min-h-screen bg-white text-black dark:bg-black dark:text-white">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 border-b-2 dark:border-[#18181b] border-gray-200 bg-white/90 dark:bg-black backdrop-blur-sm px-4 py-3 ">
        <div className="mx-auto max-w-7xl">
          <div className="flex items-center justify-between">
            <Link href="/">
              <div className="cursor-pointer">
                <h1 className="text-2xl font-extrabold">SafeScore</h1>
                <p className="mt-3 text-sm font-bold text-gray-700 dark:text-gray-300">← Back to Home</p>
              </div>
            </Link>
            <div className="flex items-center space-x-4">
              <div className="text-right hidden sm:block">
                <p className="font-bold text-gray-800 dark:text-gray-200">{predictions.length} Predictions</p>
                <p className="text-sm font-bold text-gray-600 dark:text-gray-400">Generated Just Now</p>
              </div>
              <button
                onClick={toggleTheme}
                aria-label="Toggle theme"
                className="rounded-full p-2 text-xl hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
              >
                {theme === 'dark' ? <MdOutlineLightMode /> : <MdDarkMode />}
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Filters Summary */}
      {filters && (
        <div className="bg-gray-100 dark:bg-black mt-18 px-4 py-6 sm:px-6 lg:px-8 ">
          <div className="mx-auto max-w-7xl">
            <h2 className="mb-4 text-xl font-extrabold">Your Filters:</h2>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <div className="rounded-xl border-2 border-gray-200 dark:border-[#18181b] bg-white dark:bg-[#18181b] p-4">
                <p className="text-sm font-bold text-gray-600 dark:text-white">Risk Level</p>
                <p className="text-lg font-extrabold text-black dark:text-white">{filters.oddsType.toUpperCase()}</p>
              </div>
              <div className="rounded-xl border-2 border-gray-200 dark:border-[#18181b] bg-white dark:bg-[#18181b] p-4">
                <p className="text-sm font-bold text-gray-600 dark:text-white">Leagues</p>
                <p className="text-lg font-extrabold text-black dark:text-white">{filters.leagues.length} Selected</p>
              </div>
              <div className="rounded-xl border-2 border-gray-200 dark:border-[#18181b] bg-white dark:bg-[#18181b] p-4">
                <p className="text-sm font-bold text-gray-600 dark:text-white">Match Day</p>
                <p className="text-lg font-extrabold text-black dark:text-white">{filters.day.charAt(0).toUpperCase() + filters.day.slice(1)}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      <main className="mx-auto max-w-3xl px-4 pt-28 pb-12 sm:px-6 lg:px-8">
        {predictions.length > 0 && (
          <div className="flex justify-center gap-4 mb-6">
            <button
              onClick={() => setSafestFilter(5)}
              className={`rounded-xl cursor-pointer border-2 px-6 py-2 font-extrabold transition-all ${
                safestFilter === 5
                  ? 'bg-black text-white dark:bg-white dark:text-black'
                  : 'bg-white text-black dark:bg-black dark:text-white border-gray-200 dark:border-[#18181b]'
              }`}
            >
              Top 5
            </button>
            <button
              onClick={() => setSafestFilter(10)}
              className={`rounded-xl cursor-pointer border-2 px-6 py-2 font-extrabold transition-all ${
                safestFilter === 10
                  ? 'bg-black text-white dark:bg-white dark:text-black'
                  : 'bg-white text-black dark:bg-black dark:text-white border-gray-200 dark:border-[#18181b]'
              }`}
            >
              Top 10
            </button>
            <button
              onClick={() => setSafestFilter(null)}
              className={`rounded-xl cursor-pointer border-2 px-6 py-2 font-extrabold transition-all ${
                safestFilter === null
                  ? 'bg-black text-white dark:bg-white dark:text-black'
                  : 'bg-white text-black dark:bg-black dark:text-white border-gray-200 dark:border-[#18181b]'
              }`}
            >
              All
            </button>
          </div>
        )}
        {displayedPredictions.length === 0 ? (
          <div className="rounded-xl border-2 border-gray-200 dark:border-[#18181b] bg-gray-50 dark:bg-[#18181b] p-12 text-center">
            <p className="text-2xl font-extrabold text-black dark:text-white  mb-4">No Predictions Found</p>
            <p className="font-bold text-gray-700 dark:text-white mb-6">Try adjusting your filters and generating predictions again.</p>
            <Link href="/">
              <button className="rounded-xl cursor-pointer border-2 border-gray-200 bg-black dark:bg-white px-8 py-3 font-extrabold dark:text-black text-white hover:bg-gray-800 dark:hover:bg-white dark:border-[#18181b]  transition-all">Create New Prediction</button>
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            {displayedPredictions.map((prediction, index) => (
              <div key={prediction.id || index} className="card border dark:border-[#18181b] border-gray-200 p-5 rounded-xl">
                <div className="mb-4 flex items-center justify-between border-b-2 dark:border-[#18181b] border-gray-200 pb-4">
                  <div>
                    <p className="text-sm font-bold dark:text-white text-gray-600">{prediction.league}</p>
                    <p className="text-xs font-bold dark:text-white text-gray-500">{prediction.matchTime}</p>
                  </div>
                  <div className={`rounded-full dark:bg-[#18181b] px-4 py-2 font-extrabold ${getConfidenceColor(prediction.confidence)}`}>{prediction.confidence}%</div>
                </div>
                <div className="mb-6">
                  <div className="grid grid-cols-3 items-center gap-4">
                    <div className="text-center"><p className="font-bold text-md">{prediction.team1}</p></div>
                    <div className="text-center"><p className="text-xl">vs</p></div>
                    <div className="text-center"><p className="font-bold text-md">{prediction.team2}</p></div>
                  </div>
                </div>
                <div className="mb-6 space-y-4">
                  <div className="rounded-lg bg-black dark:bg-[#18181b] p-4 text-white">
                    <p className="text-xs font-bold text-gray-300">BET TYPE</p>
                    <div className="flex items-center space-x-3">
                      <span className="text-xl">{getBetTypeBadge(prediction.betType)}</span>
                      <p className="text-md font-bold">{prediction.betType}</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="rounded-lg border-2 border-gray-200 dark:border-[#18181b] dark:bg-[#18181b] bg-gray-50 p-4">
                      <p className="text-xs font-bold text-gray-600 dark:text-white">CONFIDENCE</p>
                      <p className="text-2xl font-bold text-black dark:text-white">{prediction.confidence}%</p>
                    </div>
                    <div className="rounded-lg border-2 border-gray-200 dark:border-[#18181b] dark:bg-[#18181b] bg-gray-50 p-4">
                      <p className="text-xs font-bold text-gray-600 dark:text-white">ODDS</p>
                      <p className="text-2xl font-bold text-black dark:text-white">{prediction.odds.toFixed(2)}</p>
                    </div>
                  </div>
                </div>
                <div className="rounded-lg border-2 border-gray-300 dark:border-[#18181b] dark:bg-[#18181b] bg-white p-3">
                  <p className="text-xs font-bold text-gray-600 dark:text-white">AI ANALYSIS</p>
                  <p className="mt-1 font-bold text-black dark:text-white">High-probability prediction based on team form, head-to-head history, and statistical analysis.</p>
                </div>
                 </div>
            ))}
          </div>
        )}
      </main>
      <div className="flex gap-4 justify-center">
            <Link href="/">
              <button className="rounded-xl cursor-pointer border-2 border-black bg-black dark:bg-white dark:text-black dark:hover:bg-[#18181b] dark:hover:text-white px-8 py-3 font-extrabold text-white hover:bg-gray-800 transition-all">New Prediction</button>
            </Link>
            {/* <button className="rounded-full cursor-pointer border-2 border-black bg-white px-8 py-3 font-extrabold text-black hover:bg-gray-100 transition-all">Save Results</button> */}
          </div>

      <footer className="border-t-2 mt-10 border-gray-200 dark:border-[#18181b]  bg-white px-4 py-8 sm:px-6 lg:px-8 dark:bg-black">
        <div className="mx-auto max-w-7xl space-y-4 text-center">
          
          <div className="mt-4 flex items-center justify-center space-x-2 font-bold text-gray-600">
                        <span>Made with</span>
                        <FiCoffee className="text-lg" />
                        <span>and</span>
                        <AiOutlineHeart className="text-lg text-red-600" />
                        <span>by</span>
                        <a
                          href="https://twitter.com/codebreak_er"
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center space-x-1 hover:text-black transition-colors"
                        >
                          <FaXTwitter className="text-lg" />
                          <span>codebreak_er</span>
                        </a>
                      </div>
          <p className="font-bold text-gray-600">© 2025 SafeScore - AI-Powered Football Predictions</p>
        </div>
      </footer>
    </div>
  );
}
