import React from 'react';
import { Volume2, Plus, Check } from 'lucide-react';
import { WordTranslation } from '../../types';
import { getLanguageCode } from '../../services/externalTranslationService';

interface WordTooltipProps {
  translation: WordTranslation | null;
  loading: boolean;
  cleanWord: string;
  sourceLang: string;
  isSaved: boolean;
  isSaving: boolean;
  onSave: (word: string, translation: WordTranslation) => void;
  onMouseEnter: () => void;
  onMouseLeave: () => void;
}

export const WordTooltip: React.FC<WordTooltipProps> = ({
  translation,
  loading,
  cleanWord,
  sourceLang,
  isSaved,
  isSaving,
  onSave,
  onMouseEnter,
  onMouseLeave
}) => {
  const handlePlayAudio = (e: React.MouseEvent, text: string) => {
    e.stopPropagation();
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = getLanguageCode(sourceLang);
      utterance.rate = 0.9;
      window.speechSynthesis.speak(utterance);
    }
  };

  return (
    <div 
      className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-[min(320px,90vw)] z-[100] pointer-events-auto"
      style={{ marginBottom: '12px' }}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
    >
      <div className="bg-[#202124] text-white p-3 md:p-4 rounded-xl shadow-2xl border border-white/5 animate-in fade-in zoom-in-95 duration-150 origin-bottom font-sans w-full text-left">
        {loading ? (
          <div className="flex items-center justify-center p-4">
            <div className="w-5 h-5 border-2 border-[#1A73E8] border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : (
          <div className="flex flex-col gap-2 md:gap-3 w-full">
            {/* Top Bar: Word and Actions */}
            <div className="flex items-center justify-between gap-2 w-full">
              <div className="text-base md:text-lg text-[#E8EAED] font-normal tracking-wide select-text text-left truncate">
                {cleanWord}
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <button 
                  onClick={(e) => handlePlayAudio(e, cleanWord)}
                  className="text-[#9AA0A6] hover:text-[#E8EAED] transition-colors p-1"
                  title="Listen"
                >
                  <Volume2 size={18} className="md:w-5 md:h-5" />
                </button>
                {translation && (
                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      onSave(cleanWord, translation);
                    }}
                    className={`flex items-center justify-center w-7 h-7 md:w-8 md:h-8 rounded transition-colors ${
                      isSaved ? 'bg-[#188038] hover:bg-[#146c2e]' : 'bg-[#1A73E8] hover:bg-[#1557B0]'
                    } text-white`}
                    disabled={isSaved || isSaving}
                    title={isSaved ? "Saved" : "Add to dictionary"}
                  >
                    {isSaved ? <Check size={16} strokeWidth={2.5} /> : <Plus size={16} strokeWidth={2.5} />}
                  </button>
                )}
              </div>
            </div>

            {/* Main Translation */}
            {translation?.translation && (
              <div className="text-[15px] md:text-base font-semibold text-[#FABB05] tracking-wide select-text text-left w-full break-words mt-0.5">
                {translation.translation}
              </div>
            )}

            {/* Meanings Grid */}
            {translation?.meanings && translation.meanings.length > 0 && (
              <div className="grid grid-cols-[1fr_auto] gap-x-4 gap-y-2 items-baseline mt-1 w-full text-left">
                {translation.meanings
                  .filter(m => m.category === 'Common Usage' || m.category === 'General')
                  .slice(0, 4)
                  .map((m, i) => (
                    <React.Fragment key={i}>
                      <div className="text-[13px] md:text-[14px] text-[#9AA0A6] leading-snug select-text break-words">
                        {m.meaning}
                      </div>
                      <div className="text-[11px] md:text-[12px] text-[#9AA0A6]/70 lowercase select-none whitespace-nowrap text-right">
                        {m.type || ''}
                      </div>
                    </React.Fragment>
                  ))}
              </div>
            )}
            
            {/* IPA Fallback */}
            {translation?.ipa && (!translation.meanings || translation.meanings.length === 0) && (
              <div className="text-xs md:text-[13px] text-[#9AA0A6] font-mono tracking-wide text-left mt-1">
                /{translation.ipa}/
              </div>
            )}
          </div>
        )}
        
        {/* Tooltip Arrow */}
        <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-px border-[8px] border-transparent border-t-[#202124]"></div>
      </div>
    </div>
  );
};
