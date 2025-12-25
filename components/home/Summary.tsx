import React from 'react';

interface SummaryProps {
  oddsType: string;
  selectedLeagues: string[];
  day: string;
  loading: boolean;
  handleGeneratePredictions: () => void;
}

const Summary: React.FC<SummaryProps> = ({
  oddsType,
  selectedLeagues,
  day,
  loading,
  handleGeneratePredictions,
}) => {
  return (
    <section className="bg-[#0c0c0c] border border-white/5 text-white p-8 rounded-3xl">
      <h3 className="mb-4 text-xl font-extrabold tracking-tight">Your Selection</h3>
      <div className="mb-6 space-y-2 font-medium text-neutral-400">
        <p>Risk Level: <span className="font-extrabold text-white">{oddsType.toUpperCase()}</span></p>
        <p>Leagues: <span className="font-extrabold text-white">{selectedLeagues.length} selected</span></p>
        <p>Match Day: <span className="font-extrabold text-white">{day.charAt(0).toUpperCase() + day.slice(1)}</span></p>
      </div>
      <button
        onClick={handleGeneratePredictions}
        disabled={loading}
        className="w-full rounded-2xl cursor-pointer border border-blue-500/20 bg-blue-500 px-8 py-4 text-xl font-extrabold text-white transition-all hover:bg-blue-600 hover:scale-[1.02] shadow-lg shadow-blue-500/20 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
      >
        {loading ? 'Processing Leagues...' : 'Generate Predictions'}
      </button>
    </section>
  );
};

export default Summary;