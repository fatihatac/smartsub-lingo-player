export interface ExternalTranslationResponse {
  original_text: string;
  source_language: string;
  target_language: string;
  translated_text: string;
}

const LANGUAGE_CODES: Record<string, string> = {
  'Turkish': 'tr',
  'English': 'en',
  'Spanish': 'es',
  'German': 'de',
  'French': 'fr',
  'Japanese': 'ja',
  'Korean': 'ko',
  'Italian': 'it',
  'Portuguese': 'pt',
  'Russian': 'ru',
  'Chinese': 'zh-CN',
  'Arabic': 'ar',
  'Hindi': 'hi',
};

export const getLanguageCode = (languageName: string): string => {
  return LANGUAGE_CODES[languageName] || 'en';
};

const translationCache = new Map<string, string>();

export const clearTranslationCache = () => {
  translationCache.clear();
};

export const translateWithExternalApi = async (
  text: string, 
  sourceLang: string, 
  targetLang: string
): Promise<string> => {
  try {
    const sourceCode = getLanguageCode(sourceLang);
    const targetCode = getLanguageCode(targetLang);
    const cacheKey = `${sourceCode}:${targetCode}:${text.trim()}`;

    if (translationCache.has(cacheKey)) {
      return translationCache.get(cacheKey)!;
    }

    // Use Google Translate unofficial API (gtx)
    // This is generally reliable for free usage without API key
    const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=${sourceCode}&tl=${targetCode}&dt=t&q=${encodeURIComponent(text)}`;

    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(`Translation API failed with status ${response.status}`);
    }

    const data = await response.json();
    
    type GTranslateSegment = [string, string | null, ...unknown[]];
    type GTranslateResponse = [GTranslateSegment[], ...unknown[]];

    const parsedResponse = data as GTranslateResponse;
    if (!Array.isArray(parsedResponse[0])) {
      throw new Error('Unexpected translation API response format');
    }
    const translatedText = parsedResponse[0]
      .map((segment) => segment[0] ?? '')
      .join('');
    
    // Cache the result
    translationCache.set(cacheKey, translatedText);
    
    return translatedText;
  } catch (error) {
    console.error("External translation error:", error);
    // Fallback to original text if translation fails, to avoid breaking UI
    return text; 
  }
};
