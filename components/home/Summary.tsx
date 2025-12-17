
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
        className="w-full rounded-xl cursor-pointer border-2 border-gray-200 bg-gray-200 px-8 py-4 text-xl font-extrabold text-black transition-all hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {loading ? 'Generating Predictions...' : 'Generate Predictions'}
      </button>
    </section>
  );
};

export default Summary;
