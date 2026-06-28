/**
 * Word frequency analysis service.
 * Computes word→count frequency from subtitle cues, filters stop words,
 * and cross-references with the user's saved dictionary.
 */

import type { SubtitleCue } from "../types";
import { getDictionaryWords } from "./db";

// ---------------------------------------------------------------------------
// Result type
// ---------------------------------------------------------------------------

export interface WordFrequency {
  readonly word: string;
  readonly count: number;
  readonly isKnown: boolean;
}

// ---------------------------------------------------------------------------
// Stop words (minimal curated lists, <100 per language)
// ---------------------------------------------------------------------------

const ENGLISH_STOP_WORDS: ReadonlySet<string> = new Set([
  "the", "a", "an", "is", "are", "was", "were", "be", "been", "being",
  "have", "has", "had", "do", "does", "did", "will", "would", "shall",
  "should", "can", "could", "may", "might", "must", "i", "you", "he",
  "she", "it", "we", "they", "me", "him", "her", "us", "them", "my",
  "your", "his", "its", "our", "their", "this", "that", "these", "those",
  "am", "of", "in", "to", "for", "with", "on", "at", "from", "by",
  "about", "as", "into", "through", "during", "before", "after", "above",
  "below", "between", "and", "but", "or", "nor", "not", "so", "yet",
  "both", "either", "neither", "each", "every", "all", "any", "few",
  "more", "most", "other", "some", "such", "no", "only", "own", "same",
  "than", "too", "very", "just", "because", "if", "when", "where", "how",
]);

const TURKISH_STOP_WORDS: ReadonlySet<string> = new Set([
  "bir", "bu", "ve", "da", "de", "mi", "mı", "mu", "mü", "için", "gibi",
  "kadar", "çok", "daha", "en", "ile", "ki", "ama", "fakat", "veya",
  "ya", "hem", "ise", "ne", "nasıl", "neden", "niçin", "nerede",
  "ne zaman", "kim", "kimi", "onu", "ona", "onlar", "bunu", "buna",
  "bunlar", "şu", "şunu", "şuna", "şunlar", "o", "ben", "sen", "biz",
  "siz", "bana", "sana", "bize", "size", "benim", "senin", "onun",
  "bizim", "sizin", "onların", "diye", "göre", "ancak", "yani", "çünkü",
  "eğer", "zaten", "hatta", "artık", "belki", "hep", "hiç", "işte",
  "şey", "kadar",
]);

// ---------------------------------------------------------------------------
// Normalization
// ---------------------------------------------------------------------------

/** Strips leading/trailing punctuation and symbols, preserving internal chars. */
const STRIP_EDGE_PUNCTUATION = /^[\p{P}\p{S}]+|[\p{P}\p{S}]+$/gu;

function normalizeWord(raw: string): string {
  return raw.toLowerCase().replace(STRIP_EDGE_PUNCTUATION, "").trim();
}

function getStopWords(sourceLang: string): ReadonlySet<string> {
  const lang = sourceLang.toLowerCase();
  if (lang === "tr" || lang === "turkish" || lang === "türkçe") {
    return TURKISH_STOP_WORDS;
  }
  return ENGLISH_STOP_WORDS;
}

// ---------------------------------------------------------------------------
// Frequency computation
// ---------------------------------------------------------------------------

/**
 * Compute word frequency from subtitle cues, filtered by stop words
 * and cross-referenced with the user's saved dictionary.
 *
 * @param cues - Subtitle cues to analyze
 * @param sourceLang - Language code or name (e.g. "en", "tr", "english")
 * @returns Words sorted by frequency descending, with known/unknown flag
 */
export async function computeFrequency(
  cues: SubtitleCue[],
  sourceLang: string,
): Promise<WordFrequency[]> {
  const stopWords = getStopWords(sourceLang);
  const counts = new Map<string, number>();

  for (const cue of cues) {
    const tokens = cue.text.split(/\s+/);
    for (const raw of tokens) {
      const word = normalizeWord(raw);
      if (word.length <= 1) continue;
      if (stopWords.has(word)) continue;

      counts.set(word, (counts.get(word) ?? 0) + 1);
    }
  }

  // Build dictionary lookup set (lowercased saved words)
  const dictionaryWords = await getDictionaryWords();
  const knownSet = new Set(dictionaryWords.map((w) => w.word.toLowerCase()));

  // Convert to sorted array (descending by count, then alphabetical tiebreak)
  const result: WordFrequency[] = [];
  for (const [word, count] of counts) {
    result.push({ word, count, isKnown: knownSet.has(word) });
  }

  result.sort((a, b) => b.count - a.count || a.word.localeCompare(b.word));

  return result;
}
