import { StateCreator } from 'zustand';
import { SubtitleSettings, Bookmark } from '../types';

export interface SettingsSlice {
  sourceLang: string;
  targetLang: string;
  showSettings: boolean;
  showTranslation: boolean;
  subtitleSettings: SubtitleSettings;
  setSourceLang: (lang: string) => void;
  setTargetLang: (lang: string) => void;
  toggleSettings: () => void;
  setShowSettings: (show: boolean) => void;
  toggleTranslation: () => void;
  setSubtitleSettings: (settings: SubtitleSettings) => void;
  updateSubtitleSettings: (settings: Partial<SubtitleSettings>) => void;
  playbackTimes: Record<string, number>;
  savePlaybackTime: (name: string, time: number) => void;
  clearPlaybackTime: (name: string) => void;
  toggleSecondarySubtitle: () => void;
  bookmarks: Bookmark[];
  addBookmark: (bookmark: Bookmark) => void;
  removeBookmark: (cueId: string) => void;
}

const DEFAULT_SETTINGS: SubtitleSettings = {
  fontSize: 24,
  textColor: '#ffffff',
  backgroundColor: '#000000',
  backgroundOpacity: 0.7,
  verticalPosition: 10,
  subtitleOffset: 0,
  showSecondarySubtitle: true,
};

export const createSettingsSlice: StateCreator<SettingsSlice> = (set) => ({
  sourceLang: 'English',
  targetLang: 'Turkish',
  showSettings: false,
  showTranslation: false,
  subtitleSettings: DEFAULT_SETTINGS,
  setSourceLang: (sourceLang) => set({ sourceLang }),
  setTargetLang: (targetLang) => set({ targetLang }),
  toggleSettings: () => set((state) => ({ showSettings: !state.showSettings })),
  setShowSettings: (showSettings) => set({ showSettings }),
  toggleTranslation: () => set((state) => ({ showTranslation: !state.showTranslation })),
  setSubtitleSettings: (subtitleSettings) => set({ subtitleSettings }),
  updateSubtitleSettings: (newSettings) => set((state) => ({
    subtitleSettings: { ...state.subtitleSettings, ...newSettings }
  })),
  playbackTimes: {},
  savePlaybackTime: (name, time) => set((state) => ({
    playbackTimes: { ...state.playbackTimes, [name]: time }
  })),
  clearPlaybackTime: (name) => set((state) => {
    const newTimes = { ...state.playbackTimes };
    delete newTimes[name];
    return { playbackTimes: newTimes };
  }),
  toggleSecondarySubtitle: () => set((state) => ({
    subtitleSettings: {
      ...state.subtitleSettings,
      showSecondarySubtitle: !state.subtitleSettings.showSecondarySubtitle
    }
  })),
  bookmarks: [],
  addBookmark: (bookmark) => set((state) => {
    // Avoid duplicate cueId entries
    const exists = state.bookmarks.some((b) => b.cueId === bookmark.cueId);
    if (exists) return state;
    return { bookmarks: [bookmark, ...state.bookmarks] };
  }),
  removeBookmark: (cueId) => set((state) => ({
    bookmarks: state.bookmarks.filter((b) => b.cueId !== cueId),
  })),
});
