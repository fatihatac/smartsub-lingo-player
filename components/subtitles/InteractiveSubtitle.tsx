import React, { useRef, useEffect, useCallback, useMemo } from 'react';
import { Bookmark as BookmarkIcon } from 'lucide-react';
import { SubtitleCue } from '../../types';
import { useAppStore } from '../../store/useAppStore';
import { SubtitleWord } from './SubtitleWord';
import { useSubtitleStyling } from '../../hooks/useSubtitleStyling';
import { useSubtitleInteraction } from '../../hooks/useSubtitleInteraction';

interface InteractiveSubtitleProps {
  cue: SubtitleCue;
  onHoverStart: () => void;
  onHoverEnd: () => void;
  /** Current video playback time in seconds */
  currentTime?: number;
  /** When true, swaps source/target languages for reverse translation (target→source) */
  isSecondary?: boolean;
}

export const InteractiveSubtitle: React.FC<InteractiveSubtitleProps> = ({
  cue,
  onHoverStart,
  onHoverEnd,
  currentTime,
  isSecondary,
}) => {
  const sourceLang = useAppStore((state) => state.sourceLang);
  const targetLang = useAppStore((state) => state.targetLang);
  const subtitleSettings = useAppStore((state) => state.subtitleSettings);
  const showTranslation = useAppStore((state) => state.showTranslation);
  const bookmarks = useAppStore((state) => state.bookmarks);
  const addBookmark = useAppStore((state) => state.addBookmark);
  const removeBookmark = useAppStore((state) => state.removeBookmark);

  const isBookmarked = bookmarks.some((b) => b.cueId === cue.id);

  const handleBookmarkToggle = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    if (isBookmarked) {
      removeBookmark(cue.id);
    } else {
      addBookmark({
        cueId: cue.id,
        cueText: cue.text,
        timestamp: currentTime ?? cue.startTime,
        date: Date.now(),
      });
    }
  }, [isBookmarked, cue.id, cue.text, cue.startTime, currentTime, addBookmark, removeBookmark]);
  
  // Swap languages for secondary subtitle to translate target→source
  const effectiveSource = isSecondary ? targetLang : sourceLang;
  const effectiveTarget = isSecondary ? sourceLang : targetLang;

  const styles = useSubtitleStyling(subtitleSettings);

  const {
    hoveredWordIndex,
    translation,
    fullTranslation,
    isTranslatingFull,
    loading,
    isSaving,
    savedWords,
    handleWordHover,
    clearHover,
    handleSaveWord
  } = useSubtitleInteraction(effectiveSource, effectiveTarget, cue.text, cue.id, showTranslation);

  const leaveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const words = useMemo(() => cue.text.split(' '), [cue.text]);

  const cancelLeaveTimer = useCallback(() => {
    if (leaveTimeoutRef.current) {
      clearTimeout(leaveTimeoutRef.current);
      leaveTimeoutRef.current = null;
    }
  }, []);

  const handleContainerEnter = useCallback(() => {
    cancelLeaveTimer();
    onHoverStart();
  }, [cancelLeaveTimer, onHoverStart]);

  const handleContainerLeave = useCallback(() => {
    leaveTimeoutRef.current = setTimeout(() => {
      onHoverEnd();
      clearHover();
    }, 250);   
  }, [onHoverEnd, clearHover]);

  useEffect(() => {
    return () => {
      if (leaveTimeoutRef.current) clearTimeout(leaveTimeoutRef.current);
    };
  }, []);

  useEffect(() => {
    const handleTouchOutside = (e: TouchEvent) => {
      if (hoveredWordIndex !== null && containerRef.current && !containerRef.current.contains(e.target as Node)) {
        handleContainerLeave();
      }
    };
    document.addEventListener('touchstart', handleTouchOutside);
    return () => document.removeEventListener('touchstart', handleTouchOutside);
  }, [hoveredWordIndex, handleContainerLeave]);

  const handleWordEnter = useCallback(async (wordRaw: string, index: number) => {
    cancelLeaveTimer();
    onHoverStart(); 
    handleWordHover(wordRaw, index);
  }, [cancelLeaveTimer, onHoverStart, handleWordHover]);

  return (
    <div 
      ref={containerRef}
      className="relative p-5 rounded-2xl text-center max-w-4xl mx-auto shadow-2xl transition-all duration-300 pointer-events-auto cursor-text select-none border border-white/10 group/cue"
      style={styles}
      onMouseEnter={handleContainerEnter}
      onMouseLeave={handleContainerLeave}
      onTouchStart={handleContainerEnter}
    >
      {/* Bookmark toggle — visible on hover */}
      <button
        onClick={handleBookmarkToggle}
        className="absolute top-2 right-2 p-1.5 rounded-lg opacity-0 group-hover/cue:opacity-100 transition-opacity duration-200 hover:bg-white/20 z-10"
        title={isBookmarked ? 'Remove bookmark' : 'Bookmark this cue'}
        aria-label={isBookmarked ? 'Remove bookmark' : 'Bookmark this cue'}
        aria-pressed={isBookmarked}
      >
        <BookmarkIcon
          size={18}
          className={isBookmarked ? 'text-amber-400 fill-amber-400' : 'text-white/70'}
        />
      </button>
      {(fullTranslation || isTranslatingFull) && (
        <div className="mb-5 bg-black/60 backdrop-blur-xl text-white p-3.5 rounded-xl text-lg animate-in fade-in slide-in-from-bottom-2 shadow-2xl border border-white/10">
            {isTranslatingFull ? (
                <div className="flex items-center justify-center gap-3 opacity-80">
                    <div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin"></div>
                    <span className="text-sm font-medium tracking-wide">Translating...</span>
                </div>
            ) : (
                <div className="font-medium leading-relaxed text-slate-100">{fullTranslation}</div>
            )}
        </div>
      )}

      <div 
        className="flex flex-wrap justify-center gap-x-1.5 gap-y-1 font-semibold leading-relaxed tracking-wide"
        style={{
          fontSize: 'var(--subtitle-font-size)',
          color: 'var(--subtitle-text-color)',
          textShadow: '0 2px 8px rgba(0,0,0,0.6)'
        }}
      >
        {words.map((word, index) => {
          const isHovered = hoveredWordIndex === index;
          const cleanWord = word.replace(/[.,/#!$%^&*;:{}=\-_`~()]/g, "");
          const isSaved = savedWords.has(cleanWord);
          
          return (
            <SubtitleWord
              key={`${cue.id}-${index}`}
              word={word}
              index={index}
              isHovered={isHovered}
              isSaved={isSaved}
              cleanWord={cleanWord}
              sourceLang={effectiveSource}
              translation={isHovered ? translation : null}
              loading={isHovered ? loading : false}
              isSaving={isSaving}
              cueText={cue.text}
              onWordEnter={handleWordEnter}
              onSaveWord={handleSaveWord}
              onCancelLeave={cancelLeaveTimer}
              onContainerLeave={handleContainerLeave}
            />
          );
        })}
      </div>
    </div>
  );
};