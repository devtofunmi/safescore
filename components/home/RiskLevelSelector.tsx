import React from 'react';
import { MdShield, MdCheckCircle, MdThunderstorm } from 'react-icons/md';

interface RiskLevelSelectorProps {
  oddsType: string;
  setOddsType: (oddsType: string) => void;
}

const RiskLevelSelector: React.FC<RiskLevelSelectorProps> = ({ oddsType, setOddsType }) => {
  return (
    <section className="p-5 md:p-8 bg-[#0c0c0c] border border-white/5 rounded-3xl">
      <h2 className="mb-6 text-2xl font-extrabold tracking-tight">
        1. Select Risk Level
      </h2>
      <p className="mb-6 font-medium text-neutral-500 leading-relaxed">
        Choose your preferred betting risk profile
      </p>
      <div className="grid grid-cols-3 gap-2 sm:gap-4 sm:grid-cols-3">
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
              className={`border p-2 md:p-6 cursor-pointer rounded-2xl font-bold text-xs md:text-lg transition-all transform hover:scale-105 ${oddsType === option.id
                ? 'border-blue-500/20 bg-blue-500 text-white shadow-lg shadow-blue-500/20'
                : 'border-white/5 bg-[#0a0a0a] hover:border-blue-500/30 hover:bg-white/[0.03] text-neutral-300'
                }`}
            >
              <div className="text-2xl md:text-3xl mb-2 flex justify-center">
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