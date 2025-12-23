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
    <section className="bg-[#18181b] text-gray-100 border-gray-700 p-5 rounded-xl">
      <h3 className="mb-4 text-xl font-extrabold">Your Selection</h3>
      <div className="mb-6 space-y-2 font-bold">
        <p>Risk Level: <span className="font-extrabold">{oddsType.toUpperCase()}</span></p>
        <p>Leagues: <span className="font-extrabold">{selectedLeagues.length} selected</span></p>
        <p>Match Day: <span className="font-extrabold">{day.charAt(0).toUpperCase() + day.slice(1)}</span></p>
      </div>
      <button
        onClick={handleGeneratePredictions}
        disabled={loading}
        className="w-full rounded-xl cursor-pointer border-2 border-blue-400 bg-blue-400 px-8 py-4 text-xl font-extrabold text-white transition-all hover:bg-blue-500 hover:scale-[1.02] shadow-lg shadow-blue-400/20 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
      >
        {loading ? 'Processing Leagues...' : 'Generate Predictions'}
      </button>
    </section>
  );
};

export default Summary;