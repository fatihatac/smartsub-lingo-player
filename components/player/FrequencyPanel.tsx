import React, { useEffect, useState, useMemo } from 'react';
import { X, BarChart3, Loader2, CheckCircle2, HelpCircle } from 'lucide-react';
import type { SubtitleCue } from '../../types';
import { computeFrequency, WordFrequency } from '../../services/wordFrequency';

interface FrequencyPanelProps {
  cues: SubtitleCue[];
  sourceLang: string;
  isOpen: boolean;
  onClose: () => void;
}

export const FrequencyPanel: React.FC<FrequencyPanelProps> = ({
  cues,
  sourceLang,
  isOpen,
  onClose,
}) => {
  const [words, setWords] = useState<WordFrequency[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!isOpen || cues.length === 0) {
      setWords([]);
      return;
    }

    let cancelled = false;
    setLoading(true);

    computeFrequency(cues, sourceLang).then((result) => {
      if (!cancelled) {
        setWords(result);
        setLoading(false);
      }
    });

    return () => {
      cancelled = true;
    };
  }, [isOpen, cues, sourceLang]);

  const top20 = useMemo(() => words.slice(0, 20), [words]);
  const maxCount = useMemo(() => (top20.length > 0 ? top20[0].count : 1), [top20]);

  const totalUnique = words.length;
  const knownCount = useMemo(() => words.filter((w) => w.isKnown).length, [words]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-200"
      role="dialog"
      aria-modal="true"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="bg-slate-900 border border-slate-700 w-full max-w-lg rounded-2xl shadow-2xl flex flex-col max-h-[80vh]">
        {/* Header */}
        <div className="p-5 border-b border-slate-700 flex justify-between items-center bg-slate-800/50 rounded-t-2xl">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-indigo-500/20 rounded-lg">
              <BarChart3 className="text-indigo-400 w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">Word Frequency</h2>
              <p className="text-slate-400 text-xs">
                {totalUnique} unique words &middot;{' '}
                <span className="text-emerald-400">{knownCount} known</span>
                {' / '}
                <span className="text-amber-400">{totalUnique - knownCount} unknown</span>
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white transition-colors p-2 hover:bg-slate-700 rounded-lg"
            aria-label="Close frequency panel"
          >
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="overflow-y-auto flex-1 p-4 custom-scrollbar">
          {loading ? (
            <div className="flex flex-col items-center justify-center h-48 text-slate-400">
              <Loader2 className="w-8 h-8 animate-spin mb-3" />
              <p>Analyzing subtitles...</p>
            </div>
          ) : cues.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-48 text-slate-500">
              <BarChart3 className="w-10 h-10 mb-3 opacity-40" />
              <p>No subtitles loaded.</p>
              <p className="text-sm mt-1">Load a video with subtitles to see word frequency.</p>
            </div>
          ) : top20.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-48 text-slate-500">
              <p>No significant words found.</p>
            </div>
          ) : (
            <div className="space-y-1">
              {top20.map((item, index) => {
                const barWidth = (item.count / maxCount) * 100;
                return (
                  <div
                    key={item.word}
                    className="flex items-center gap-3 py-2 px-3 rounded-lg hover:bg-slate-800/60 transition-colors group"
                  >
                    {/* Rank */}
                    <span className="text-xs text-slate-500 font-mono w-5 text-right shrink-0">
                      {index + 1}
                    </span>

                    {/* Icon */}
                    {item.isKnown ? (
                      <CheckCircle2 size={14} className="text-emerald-400 shrink-0" />
                    ) : (
                      <HelpCircle size={14} className="text-amber-400 shrink-0" />
                    )}

                    {/* Word + Bar */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <span
                          className={`text-sm font-semibold truncate ${
                            item.isKnown ? 'text-emerald-300' : 'text-amber-300'
                          }`}
                        >
                          {item.word}
                        </span>
                        <span className="text-xs text-slate-400 font-mono ml-2 shrink-0">
                          {item.count}x
                        </span>
                      </div>
                      {/* Frequency Bar */}
                      <div className="h-1 w-full bg-slate-700/50 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all duration-500 ${
                            item.isKnown ? 'bg-emerald-500/70' : 'bg-amber-500/70'
                          }`}
                          style={{ width: `${barWidth}%` }}
                        />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer Legend */}
        {top20.length > 0 && (
          <div className="px-5 py-3 border-t border-slate-700/50 flex items-center gap-4 text-xs text-slate-500">
            <span className="flex items-center gap-1.5">
              <CheckCircle2 size={12} className="text-emerald-400" />
              Known (in dictionary)
            </span>
            <span className="flex items-center gap-1.5">
              <HelpCircle size={12} className="text-amber-400" />
              Unknown
            </span>
          </div>
        )}
      </div>
    </div>
  );
};
