import React, { useMemo } from 'react';
import { Volume2, Trash2, Clock } from 'lucide-react';
import { SavedWord } from '../../types';
import { State } from '../../services/fsrsService';

interface DictionaryWordCardProps {
  item: SavedWord;
  onPlayAudio: (e: React.MouseEvent, text: string) => void;
  onDelete: (id: number) => void;
}

type FsrsStatus = {
  color: string;       // tailwind bg class
  label: string;       // display text
  tooltip?: string;    // optional hover detail
};

function computeFsrsStatus(item: SavedWord): FsrsStatus {
  const state = item.state;
  const due = item.due;

  // No FSRS fields → old/imported word
  if (state == null || due == null) {
    return { color: 'bg-slate-500', label: 'Not scheduled' };
  }

  const now = Date.now();
  const diffMs = due - now;
  const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

  // New card
  if (state === State.New) {
    return { color: 'bg-blue-500', label: 'New' };
  }

  // Learning / Relearning
  if (state === State.Learning || state === State.Relearning) {
    return { color: 'bg-yellow-500', label: 'Learning' };
  }

  // Review — check if due
  if (state === State.Review) {
    if (diffDays <= 0) {
      if (diffDays === 0) return { color: 'bg-green-500', label: 'Due: Today' };
      const overdue = Math.abs(diffDays);
      return { color: 'bg-green-500', label: `Overdue by ${overdue}d` };
    }
    if (diffDays === 1) return { color: 'bg-slate-500', label: 'Due: Tomorrow' };
    return { color: 'bg-slate-500', label: `Due: in ${diffDays} days` };
  }

  // Fallback
  return { color: 'bg-slate-500', label: 'Not scheduled' };
}

export const DictionaryWordCard: React.FC<DictionaryWordCardProps> = ({
  item,
  onPlayAudio,
  onDelete
}) => {
  const fsrsStatus = useMemo(() => computeFsrsStatus(item), [item.state, item.due]);

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
          <div className="flex items-center gap-1.5 mt-1">
            <span className={`inline-block w-2 h-2 rounded-full ${fsrsStatus.color}`} />
            <span className="text-xs text-slate-400 flex items-center gap-1">
              <Clock size={10} className="text-slate-500" />
              {fsrsStatus.label}
            </span>
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
