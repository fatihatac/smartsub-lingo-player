import { useState, useCallback } from 'react';
import { translateWithExternalApi } from '../services/externalTranslationService';
import { WordTranslation, WordMeaning } from '../types';

export const useTranslation = (sourceLanguage: string, targetLanguage: string) => {
  const [cache, setCache] = useState<Record<string, WordTranslation>>({});
  const [loading, setLoading] = useState(false);

  const translateWord = useCallback(async (word: string): Promise<WordTranslation | null> => {
    const cleanWord = word.replace(/[.,/#!$%^&*;:{}=\-_`~()]/g, "");
    if (!cleanWord) return null;

    const lowerWord = cleanWord.toLowerCase();
    if (cache[lowerWord]) {
      return cache[lowerWord];
    }

    setLoading(true);
    try {
      // Try local API first
      let localData = null;
      try {
        const response = await fetch(`http://127.0.0.1:8000/api/translate/${encodeURIComponent(cleanWord)}`);
        if (response.ok) {
          localData = await response.json();
        }
      } catch (localError) {
        // Silently ignore local API errors (like CORS or server down) to fallback to external API
        console.error("Local API error", localError);
        console.warn("Local API not available, falling back to external API.");
      }
      
      if (localData && localData.data && localData.data.results && localData.data.results.length > 0) {
        const results: WordMeaning[] = localData.data.results;
        
        // Filter for Common Usage first, otherwise take the first available
        const commonUsages = results.filter(r => r.category === 'Common Usage');
        const primaryMeaning = commonUsages.length > 0 ? commonUsages[0].meaning : results[0].meaning;
        
        const result: WordTranslation = {
          translation: primaryMeaning,
          ipa: '', // Local API doesn't seem to provide IPA in the example
          meanings: results
        };
        
        setCache(prev => ({ ...prev, [lowerWord]: result }));
        return result;
      }
      
      // Fallback to external API if local fails or returns no results
      const translatedText = await translateWithExternalApi(cleanWord, sourceLanguage, targetLanguage);
      const result: WordTranslation = {
        translation: translatedText,
        ipa: ''
      };
      setCache(prev => ({ ...prev, [lowerWord]: result }));
      return result;
      
    } catch (error) {
      console.error("Word translation failed", error);
      return { translation: "Error", ipa: "" };
    } finally {
      setLoading(false);
    }
  }, [cache, sourceLanguage, targetLanguage]);

  const translateSentence = useCallback(async (text: string): Promise<string> => {
    try {
      return await translateWithExternalApi(text, sourceLanguage, targetLanguage);
    } catch (error) {
      console.error("Full translation failed", error);
      return "Translation failed.";
    }
  }, [sourceLanguage, targetLanguage]);

  return {
    translateWord,
    translateSentence,
    loading
  };
};
