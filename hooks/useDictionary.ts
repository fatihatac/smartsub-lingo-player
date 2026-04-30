import { useState, useCallback } from 'react';
import { saveWordToDictionary } from '../services/db';
import { WordTranslation } from '../types';

export const useDictionary = () => {
  const [isSaving, setIsSaving] = useState(false);
  const [savedWords, setSavedWords] = useState<Set<string>>(new Set());

  const saveWord = useCallback(async (word: string, trans: WordTranslation, context: string) => {
    if (!word || !trans) return;
    
    setIsSaving(true);
    try {
      await saveWordToDictionary(word, trans.translation, trans.ipa, context);
      setSavedWords(prev => new Set(prev).add(word));
    } catch (e) {
      console.error("Failed to save word", e);
    } finally {
      setIsSaving(false);
    }
  }, []);

  return {
    saveWord,
    isSaving,
    savedWords,
    setSavedWords // Expose setter if we need to load initial state
  };
};
