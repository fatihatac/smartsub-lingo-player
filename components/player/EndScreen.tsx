import React from 'react';
import { Repeat, Home } from 'lucide-react';

interface EndScreenProps {
  onReplay: () => void;
  onBack: () => void;
}

export const EndScreen: React.FC<EndScreenProps> = ({ onReplay, onBack }) => {
  return (
    <div className="absolute inset-0 z-50 bg-black/80 backdrop-blur-sm flex flex-col items-center justify-center animate-in fade-in duration-300">
      <h2 className="text-3xl font-bold text-white mb-8">Session Complete</h2>
      <div className="flex gap-4">
        <button 
          onClick={onReplay}
          className="flex items-center gap-2 px-6 py-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-semibold transition-transform hover:scale-105"
        >
          <Repeat size={20} />
          Replay Video
        </button>
        <button 
          onClick={onBack}
          className="flex items-center gap-2 px-6 py-3 bg-slate-700 hover:bg-slate-600 text-white rounded-xl font-semibold transition-transform hover:scale-105"
        >
          <Home size={20} />
          Back to Library
        </button>
      </div>
    </div>
  );
};
