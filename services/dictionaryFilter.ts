/**
 * Dictionary filter and sort service.
 * Pure functions for filtering and sorting SavedWord collections.
 */

import type { SavedWord } from "../types";

// ---------------------------------------------------------------------------
// FilterOptions
// ---------------------------------------------------------------------------

export interface FilterOptions {
  sourceLang?: string;
  targetLang?: string;
  searchTerm?: string;
  sortBy?: "date" | "word" | "dueDate" | "frequency";
}

// ---------------------------------------------------------------------------
// SavedWord extensions (FSRS + language fields added by T1 in parallel)
// Access as optional — fields may not exist yet on all SavedWord records.
// ---------------------------------------------------------------------------

type SavedWordWithExtensions = SavedWord & {
  sourceLang?: string;
  targetLang?: string;
  due?: string | null;
};

// ---------------------------------------------------------------------------
// Filter helpers
// ---------------------------------------------------------------------------

function matchesLangPair(
  word: SavedWordWithExtensions,
  sourceLang?: string,
  targetLang?: string,
): boolean {
  if (sourceLang !== undefined && word.sourceLang !== undefined) {
    if (word.sourceLang !== sourceLang) return false;
  }
  if (targetLang !== undefined && word.targetLang !== undefined) {
    if (word.targetLang !== targetLang) return false;
  }
  return true;
}

function matchesSearchTerm(
  word: SavedWordWithExtensions,
  term: string,
): boolean {
  const lower = term.toLowerCase();
  return (
    word.word.toLowerCase().includes(lower) ||
    word.translation.toLowerCase().includes(lower) ||
    word.contextSentence.toLowerCase().includes(lower)
  );
}

// ---------------------------------------------------------------------------
// Sort helpers
// ---------------------------------------------------------------------------

type SortKey = NonNullable<FilterOptions["sortBy"]>;

function compareByDate(a: SavedWordWithExtensions, b: SavedWordWithExtensions): number {
  return b.date - a.date; // newest first
}

function compareByWord(a: SavedWordWithExtensions, b: SavedWordWithExtensions): number {
  return a.word.localeCompare(b.word);
}

function compareByDueDate(a: SavedWordWithExtensions, b: SavedWordWithExtensions): number {
  const aDue = a.due;
  const bDue = b.due;

  // null/undefined due dates go to end
  if (aDue == null && bDue == null) return 0;
  if (aDue == null) return 1;
  if (bDue == null) return -1;

  return new Date(aDue).getTime() - new Date(bDue).getTime(); // ascending (earliest due first)
}

function getComparator(sortBy: SortKey): (a: SavedWordWithExtensions, b: SavedWordWithExtensions) => number {
  switch (sortBy) {
    case "date":
      return compareByDate;
    case "word":
      return compareByWord;
    case "dueDate":
      return compareByDueDate;
    case "frequency":
      console.warn("[dictionaryFilter] frequency sort not yet integrated");
      return compareByDate;
  }
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

export function filterAndSort(
  words: SavedWord[],
  options: FilterOptions,
): SavedWord[] {
  if (words.length === 0) return [];

  const { sourceLang, targetLang, searchTerm, sortBy = "date" } = options;

  let result = words as SavedWordWithExtensions[];

  // Filter by language pair
  if (sourceLang !== undefined || targetLang !== undefined) {
    result = result.filter((w) => matchesLangPair(w, sourceLang, targetLang));
  }

  // Filter by search term
  if (searchTerm !== undefined && searchTerm !== "") {
    result = result.filter((w) => matchesSearchTerm(w, searchTerm));
  }

  // Sort
  const comparator = getComparator(sortBy);
  result = [...result].sort(comparator);

  return result;
}
