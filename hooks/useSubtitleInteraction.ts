import { useState, useCallback, useRef, useEffect } from 'react';
import { useTranslation } from './useTranslation';
import { useDictionary } from './useDictionary';
import { WordTranslation } from '../types';

export const useSubtitleInteraction = (sourceLang: string, targetLang: string, cueText: string, cueId: string, showTranslation: boolean) => {
  const [hoveredWordIndex, setHoveredWordIndex] = useState<number | null>(null);
  const [translation, setTranslation] = useState<WordTranslation | null>(null);
  
  const [fullTranslation, setFullTranslation] = useState<string | null>(null);
  const [isTranslatingFull, setIsTranslatingFull] = useState(false);
  
  const { translateWord, translateSentence, loading } = useTranslation(sourceLang, targetLang);
  const { saveWord, isSaving, savedWords } = useDictionary();

  const activeWordRequestRef = useRef<number | null>(null);

  const handleFullTranslation = useCallback(async () => {
    setIsTranslatingFull(true);
    try {
      const result = await translateSentence(cueText);
      setFullTranslation(result);
    } finally {
      setIsTranslatingFull(false);
    }
  }, [cueText, translateSentence]);

  useEffect(() => {
    setFullTranslation(null);
    setIsTranslatingFull(false);
    
    setHoveredWordIndex(null);
    setTranslation(null);
    activeWordRequestRef.current = null;
    
    if (showTranslation) {
      handleFullTranslation();
    }
  }, [cueId, showTranslation, handleFullTranslation]);

  const handleWordHover = useCallback(async (wordRaw: string, index: number) => {
    setHoveredWordIndex(index);
    setTranslation(null);
    activeWordRequestRef.current = index; 
    
    const result = await translateWord(wordRaw);
    
    if (activeWordRequestRef.current === index) {
      if (result) {
        setTranslation(result);
      }
    }
  }, [translateWord]);

  const clearHover = useCallback(() => {
    setHoveredWordIndex(null);
    setTranslation(null);
    activeWordRequestRef.current = null;
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
  }, []);

  const handleSaveWord = useCallback((tw: string, trans: WordTranslation, text: string) => {
    const contextSentence = fullTranslation ? `${text} → ${fullTranslation}` : text;
    saveWord(tw, trans, contextSentence);
  }, [saveWord, fullTranslation]);

  return {
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
  };
};
