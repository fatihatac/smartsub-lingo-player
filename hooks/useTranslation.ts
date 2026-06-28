import { useState, useCallback, useRef, useEffect } from 'react';
import { translateWord as translateWordService, translateSentence as translateSentenceService } from '../services/translationService';
import { WordTranslation } from '../types';

export const useTranslation = (sourceLanguage: string, targetLanguage: string) => {
  const [loading, setLoading] = useState(false);
  const [sentenceLoading, setSentenceLoading] = useState(false);
  const wordAbortRef = useRef<AbortController | null>(null);
  const sentenceAbortRef = useRef<AbortController | null>(null);

  // Abort any in-flight requests on unmount
  useEffect(() => {
    return () => {
      wordAbortRef.current?.abort();
      sentenceAbortRef.current?.abort();
    };
  }, []);

  const translateWord = useCallback(async (word: string): Promise<WordTranslation | null> => {
    const cleanWord = word.replace(/[.,/#!$%^&*;:{}=\-_`~()]/g, "");
    if (!cleanWord) return null;

    // Abort previous in-flight word request
    wordAbortRef.current?.abort();
    const controller = new AbortController();
    wordAbortRef.current = controller;

    setLoading(true);
    try {
      const result = await translateWordService(cleanWord, sourceLanguage, targetLanguage, controller.signal);
      return result;
    } catch (error) {
      if (error instanceof DOMException && error.name === 'AbortError') {
        return null;
      }
      console.error("Word translation failed", error);
      return null;
    } finally {
      // Only clear loading if this is still the active controller
      if (wordAbortRef.current === controller) {
        setLoading(false);
      }
    }
  }, [sourceLanguage, targetLanguage]);

  const translateSentence = useCallback(async (text: string): Promise<string> => {
    // Abort previous in-flight sentence request
    sentenceAbortRef.current?.abort();
    const controller = new AbortController();
    sentenceAbortRef.current = controller;

    setSentenceLoading(true);
    try {
      const result = await translateSentenceService(text, sourceLanguage, targetLanguage, controller.signal);
      return result;
    } catch (error) {
      if (error instanceof DOMException && error.name === 'AbortError') {
        return text;
      }
      console.error("Sentence translation failed", error);
      return text;
    } finally {
      if (sentenceAbortRef.current === controller) {
        setSentenceLoading(false);
      }
    }
  }, [sourceLanguage, targetLanguage]);

  return {
    translateWord,
    translateSentence,
    loading,
    sentenceLoading
  };
};
