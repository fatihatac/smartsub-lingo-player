/**
 * Translation service using the centralized apiClient.
 * Provides word and sentence translation with an LRU in-memory cache.
 */

import { apiGet, apiPost, ApiError } from "./apiClient";
import type { WordTranslation, WordMeaning } from "../types";
import { createLRUCache } from "./lruCache";
import {
  initCacheFromIndexedDB,
  saveToIndexedDBCache,
  clearIndexedDBCache,
} from "./cachePersistence";

// ---------------------------------------------------------------------------
// LRU cache (500 entries, O(1) get/set, auto-evicts oldest on overflow)
// ---------------------------------------------------------------------------

const MAX_CACHE_SIZE = 500;
const cache = createLRUCache<string, WordTranslation>(MAX_CACHE_SIZE);

// Clear cache on page unload to free memory
if (typeof window !== "undefined") {
  window.addEventListener("beforeunload", () => cache.clear());
}

// Hydrate the in-memory LRU cache from IndexedDB on module load (fire-and-forget)
initCacheFromIndexedDB().then((entries) => {
  for (const [key, value] of entries) {
    cache.set(key, value);
  }
});

// ---------------------------------------------------------------------------
// Response parsing helpers
// ---------------------------------------------------------------------------

interface TranslateApiResponse {
  data?: {
    results?: WordMeaning[];
    audio?: {
      us?: string;
      uk?: string;
      aus?: string;
    };
  };
}

interface BatchTranslateApiResponse {
  results?: Record<string, { results?: WordMeaning[] } | { detail: string }>;
}

function parseWordTranslation(response: unknown): WordTranslation | null {
  try {
    const body = response as TranslateApiResponse;
    const results = body?.data?.results;

    if (!results || !Array.isArray(results) || results.length === 0) {
      return null;
    }

    // Primary translation: use the first meaning's "meaning" field
    const firstMeaning = results[0];
    const translation = firstMeaning.meaning ?? firstMeaning.term ?? "";

    return {
      translation,
      ipa: "",
      meanings: results,
    };
  } catch {
    return null;
  }
}

// ---------------------------------------------------------------------------
// Language name → ISO-639-1 code mapping
// Store keeps display names ("English", "Turkish"); the backend expects codes.
// ---------------------------------------------------------------------------

const LANG_NAME_TO_CODE: Record<string, string> = {
  english: "en",
  turkish: "tr",
  spanish: "es",
  german: "de",
  french: "fr",
  japanese: "ja",
  korean: "ko",
  italian: "it",
  portuguese: "pt",
  russian: "ru",
  chinese: "zh",
  arabic: "ar",
  dutch: "nl",
  polish: "pl",
};

function toLangCode(nameOrCode: string): string {
  // Already a 2-letter code → return as-is
  if (nameOrCode.length === 2) return nameOrCode.toLowerCase();
  return LANG_NAME_TO_CODE[nameOrCode.toLowerCase()] ?? nameOrCode.toLowerCase();
}

// ---------------------------------------------------------------------------
// Text cleaning — strip sound effects, stage directions, and disallowed chars
// Backend WordStr pattern: ^[a-zA-ZçğıöşüÇĞİÖŞÜ0-9\- ']+$
// ---------------------------------------------------------------------------

const ALLOWED_CHARS_RE = /[^a-zA-ZçğıöşüÇĞİÖŞÜ0-9\- ']/g;
const BRACKET_RE = /\[.*?\]/g;
const MULTI_SPACE_RE = /\s+/g;
const HAS_ALPHANUM_RE = /[a-zA-ZçğıöşüÇĞİÖŞÜ0-9]/;

function cleanForApi(text: string): string {
  const result = text
    .replace(BRACKET_RE, '')        // strip [SNIFFS], [BLOWS NOSE], etc.
    .replace(ALLOWED_CHARS_RE, '')  // strip any char the backend rejects
    .replace(MULTI_SPACE_RE, ' ')   // collapse whitespace
    .trim();
  // Backend requires at least one alphanumeric character
  return HAS_ALPHANUM_RE.test(result) ? result : '';
}

function isAbortError(error: unknown): boolean {
  return error instanceof DOMException && error.name === 'AbortError';
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Translate a single word and return detailed translation info.
 * Returns null if the request fails or the response is empty.
 */
export async function translateWord(
  word: string,
  sourceLang: string,
  targetLang: string,
  signal?: AbortSignal,
): Promise<WordTranslation | null> {
  const trimmed = word.trim();
  if (!trimmed) return null;

  const cleaned = cleanForApi(trimmed);
  if (!cleaned) return null;

  const cacheKey = `${sourceLang}:${targetLang}:${trimmed.toLowerCase()}`;
  const cached = cache.get(cacheKey);
  if (cached) return cached;

  try {
    const path = `/api/v1/translate/${encodeURIComponent(cleaned)}`;
    const response = await apiGet(path, { signal });
    const result = parseWordTranslation(response);

    if (result) {
      cache.set(cacheKey, result);
      // Fire-and-forget: persist to IndexedDB without blocking the response
      saveToIndexedDBCache(cacheKey, result);
    }

    return result;
  } catch (error) {
    if (isAbortError(error)) return null;
    if (error instanceof ApiError) {
      console.warn(
        `[translationService] translateWord failed: ${error.status} ${error.message}`,
      );
    } else {
      console.warn("[translationService] translateWord failed:", error);
    }
    return null;
  }
}

interface SentenceTranslateApiResponse {
  translated_text: string;
  source_lang: string;
  target_lang: string;
  provider: string;
  cached: boolean;
}

/**
 * Translate a full sentence.
 * Calls the POST /api/v1/translate/sentence endpoint.
 * Returns the translated string, or empty string on failure.
 */
export async function translateSentence(
  sentence: string,
  sourceLang: string,
  targetLang: string,
  signal?: AbortSignal,
): Promise<string> {
  const trimmed = sentence.trim();
  if (!trimmed) return "";

  const cleaned = cleanForApi(trimmed);
  if (!cleaned) return "";

  try {
    const response = await apiPost("/api/v1/translate/sentence", {
      text: cleaned,
      source_lang: toLangCode(sourceLang),
      target_lang: toLangCode(targetLang),
    }, { signal }) as SentenceTranslateApiResponse;

    return response?.translated_text ?? "";
  } catch (error) {
    if (isAbortError(error)) return "";
    if (error instanceof ApiError) {
      console.warn(
        `[translationService] sentence translate failed: ${error.status} ${error.message}`,
      );
    } else {
      console.warn("[translationService] sentence translate failed:", error);
    }
    return "";
  }
}

/**
 * Clear the translation cache (in-memory + IndexedDB).
 */
export function clearCache(): void {
  cache.clear();
  // Fire-and-forget: clear persistent store without blocking
  clearIndexedDBCache();
}
