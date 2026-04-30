import React from 'react';
import { ArrowLeft } from 'lucide-react';

interface VideoHeaderProps {
  onBack: () => void;
}

export const VideoHeader: React.FC<VideoHeaderProps> = ({ onBack }) => {
  return (
    <div className="w-full max-w-6xl flex justify-between items-center mb-4">
      <h1 className="text-xl font-bold text-white flex items-center gap-2">
        <span className="bg-indigo-600 w-2 h-6 rounded-full"></span>
        SmartSub Player
      </h1>
      <button 
        onClick={onBack}
        className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-all text-sm font-medium"
      >
        <ArrowLeft size={16} />
        Back to Library
      </button>
    </div>
  );
};
