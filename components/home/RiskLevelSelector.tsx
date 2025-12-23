import React from 'react';
import { MdShield, MdCheckCircle, MdThunderstorm } from 'react-icons/md';

interface RiskLevelSelectorProps {
  oddsType: string;
  setOddsType: (oddsType: string) => void;
}

const RiskLevelSelector: React.FC<RiskLevelSelectorProps> = ({ oddsType, setOddsType }) => {
  return (
    <section className="card">
      <h2 className="mb-6 text-2xl font-extrabold">
        1. Select Risk Level
      </h2>
      <p className="mb-6 font-bold text-gray-300">
        Choose your preferred betting risk profile
      </p>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {[
          { id: 'very safe', label: 'Very Safe', icon: MdShield },
          { id: 'safe', label: 'Safe', icon: MdCheckCircle },
          { id: 'medium safe', label: 'Medium-Safe', icon: MdThunderstorm },
        ].map((option) => {
          const IconComponent = option.icon;
          return (
            <button
              key={option.id}
              onClick={() => setOddsType(option.id)}
              className={`border-2 p-6 cursor-pointer rounded-xl font-bold text-lg transition-all transform hover:scale-105 ${oddsType === option.id
                ? 'border-blue-400 bg-blue-400 text-white shadow-lg shadow-blue-400/20'
                : 'border-[#18181b] bg-black hover:border-blue-400/50 hover:bg-[#18181b] text-gray-300'
                }`}
            >
              <div className="text-3xl mb-2 flex justify-center">
                <IconComponent />
              </div>
              {option.label}
            </button>
          );
        })}
      </div>
    </section>
  );
};

export default RiskLevelSelector;