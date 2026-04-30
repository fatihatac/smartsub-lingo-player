import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { SubtitleCue, WordTranslation } from '../../types';
import { useTranslation } from '../../hooks/useTranslation';
import { useDictionary } from '../../hooks/useDictionary';
import { useAppStore } from '../../store/useAppStore';
import { SubtitleWord } from './SubtitleWord';
import { useSubtitleStyling } from '../../hooks/useSubtitleStyling';

interface InteractiveSubtitleProps {
  cue: SubtitleCue;
  onHoverStart: () => void;
  onHoverEnd: () => void;
}

export const InteractiveSubtitle: React.FC<InteractiveSubtitleProps> = ({
  cue,
  onHoverStart,
  onHoverEnd,
}) => {
  const { sourceLang, targetLang, subtitleSettings, showTranslation } = useAppStore();
  const styles = useSubtitleStyling(subtitleSettings);
  
  const [hoveredWordIndex, setHoveredWordIndex] = useState<number | null>(null);
  const [translation, setTranslation] = useState<WordTranslation | null>(null);
  
  const [fullTranslation, setFullTranslation] = useState<string | null>(null);
  const [isTranslatingFull, setIsTranslatingFull] = useState(false);
  
  const { translateWord, translateSentence, loading } = useTranslation(sourceLang, targetLang);
  const { saveWord, isSaving, savedWords } = useDictionary();

  const activeWordRequestRef = useRef<number | null>(null);
  const leaveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const words = useMemo(() => cue.text.split(' '), [cue.text]);

  const handleFullTranslation = useCallback(async () => {
    setIsTranslatingFull(true);
    try {
      const result = await translateSentence(cue.text);
      setFullTranslation(result);
    } finally {
      setIsTranslatingFull(false);
    }
  }, [cue.text, translateSentence]);

  useEffect(() => {
    setFullTranslation(null);
    setIsTranslatingFull(false);
    
    setHoveredWordIndex(null);
    setTranslation(null);
    activeWordRequestRef.current = null;
    
    if (showTranslation) {
      handleFullTranslation();
    }
  }, [cue.id, showTranslation, handleFullTranslation]);

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
      setHoveredWordIndex(null);
      setTranslation(null);
      activeWordRequestRef.current = null;
      if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
    }, 250);   
  }, [onHoverEnd]);

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
    
    setHoveredWordIndex(index);
    setTranslation(null);
    activeWordRequestRef.current = index; 
    
    const result = await translateWord(wordRaw);
    
    if (activeWordRequestRef.current === index) {
      if (result) {
        setTranslation(result);
      }
    }
  }, [cancelLeaveTimer, onHoverStart, translateWord]);

  // Wrap saveWord in useCallback so it's referentially stable
  const handleSaveWord = useCallback((tw: string, trans: WordTranslation, text: string) => {
    saveWord(tw, trans, text);
  }, [saveWord]);

  return (
    <div 
      ref={containerRef}
      className="p-5 rounded-2xl text-center max-w-4xl mx-auto shadow-2xl transition-all duration-300 pointer-events-auto cursor-text select-none border border-white/10"
      style={styles}
      onMouseEnter={handleContainerEnter}
      onMouseLeave={handleContainerLeave}
      onTouchStart={handleContainerEnter}
    >
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
              sourceLang={sourceLang}
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