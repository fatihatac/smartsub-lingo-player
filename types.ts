export interface SubtitleCue {
  id: string;
  startTime: number; // in seconds
  endTime: number;   // in seconds
  text: string;
}

export interface WordMeaning {
  category: string;
  term: string;
  type: string;
  meaning: string;
}

export interface WordTranslation {
  translation: string; // Primary translation (first meaning or fallback)
  ipa: string;
  meanings?: WordMeaning[]; // Array of detailed meanings from the new API
}

export interface TranslationResult {
  original: string;
  translated: string;
  isLoading: boolean;
}

// Map of word -> translation object
export type TranslationCache = Record<string, WordTranslation>;

export enum AppState {
  UPLOAD = 'UPLOAD',
  PLAYER = 'PLAYER',
}

export interface SubtitleSettings {
  fontSize: number; // px
  textColor: string; // hex
  backgroundColor: string; // rgba or hex
  backgroundOpacity: number; // 0-1
  verticalPosition: number; // % from bottom
  subtitleOffset: number; // seconds (positive = delay, negative = advance)
  showSecondarySubtitle?: boolean; // toggle for dual sub
}

export interface OfflineSession {
  id: number;
  name: string;
  videoBlob: Blob;
  subtitleBlob: Blob;
  secondarySubtitleBlob?: Blob;
  sourceLang: string;
  targetLang: string;
  date: number;
}

export interface SavedWord {
  id: number;
  word: string;
  translation: string;
  ipa: string;
  contextSentence: string;
  date: number;
}