import React from 'react';
import { Volume2, Trash2 } from 'lucide-react';
import { SavedWord } from '../../types';

interface DictionaryWordCardProps {
  item: SavedWord;
  onPlayAudio: (e: React.MouseEvent, text: string) => void;
  onDelete: (id: number) => void;
}

export const DictionaryWordCard: React.FC<DictionaryWordCardProps> = ({
  item,
  onPlayAudio,
  onDelete
}) => {
  return (
    <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-4 hover:border-slate-600 transition-colors group">
      <div className="flex justify-between items-start gap-4">
        <div className="flex-1">
          <div className="flex items-baseline gap-3 mb-1">
            <span className="text-lg font-bold text-white">{item.word}</span>
            <span className="text-emerald-400 font-medium">{item.translation}</span>
            {item.ipa && (
              <span className="text-slate-500 font-mono text-xs border border-slate-700 px-1.5 rounded bg-slate-800">
                /{item.ipa}/
              </span>
            )}
          </div>
          {item.contextSentence && (
            <p className="text-slate-400 text-sm italic mt-2 border-l-2 border-slate-700 pl-3 py-0.5">
              "{item.contextSentence}"
            </p>
          )}
          <div className="mt-2 text-xs text-slate-600">
            Added on {new Date(item.date).toLocaleDateString()}
          </div>
        </div>
        
        <div className="flex flex-col gap-2">
          <button 
            onClick={(e) => onPlayAudio(e, item.word)}
            className="text-slate-400 hover:text-indigo-400 p-2 rounded-lg hover:bg-indigo-400/10 transition-colors"
            title="Listen"
          >
            <Volume2 size={18} />
          </button>
          <button 
            onClick={() => onDelete(item.id)}
            className="text-slate-600 hover:text-red-400 p-2 rounded-lg hover:bg-red-400/10 transition-colors"
            title="Remove word"
          >
            <Trash2 size={18} />
          </button>
        </div>
      </div>
    </div>
  );
};
