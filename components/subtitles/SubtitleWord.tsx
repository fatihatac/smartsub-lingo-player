import React from 'react';
import { WordTranslation } from '../../types';
import { WordTooltip } from './WordTooltip';

interface SubtitleWordProps {
  word: string;
  index: number;
  isHovered: boolean;
  isSaved: boolean;
  cleanWord: string;
  sourceLang: string;
  translation: WordTranslation | null;
  loading: boolean;
  isSaving: boolean;
  cueText: string;
  onWordEnter: (wordRaw: string, index: number) => void;
  onSaveWord: (word: string, trans: WordTranslation, text: string) => void;
  onCancelLeave: () => void;
  onContainerLeave: () => void;
}

export const SubtitleWord: React.FC<SubtitleWordProps> = React.memo(({
  word,
  index,
  isHovered,
  isSaved,
  cleanWord,
  sourceLang,
  translation,
  loading,
  isSaving,
  cueText,
  onWordEnter,
  onSaveWord,
  onCancelLeave,
  onContainerLeave
}) => {
  return (
    <div className="relative group">
      {isHovered && (
        <WordTooltip
          translation={translation}
          loading={loading}
          cleanWord={cleanWord}
          sourceLang={sourceLang}
          isSaved={isSaved}
          isSaving={isSaving}
          onSave={(tw, trans) => onSaveWord(tw, trans, cueText)}
          onMouseEnter={onCancelLeave}
          onMouseLeave={onContainerLeave}
        />
      )}

      <span
        className={`px-1.5 py-0.5 rounded-md transition-all duration-200 cursor-pointer inline-block ${
          isHovered 
            ? 'bg-white/20 text-white scale-110 shadow-sm' 
            : 'hover:bg-white/10'
        }`}
        onMouseEnter={() => onWordEnter(word, index)}
        onTouchStart={() => onWordEnter(word, index)}
      >
        {word}
      </span>
    </div>
  );
});

SubtitleWord.displayName = 'SubtitleWord';
