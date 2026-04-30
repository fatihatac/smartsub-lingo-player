import { StateCreator } from 'zustand';
import { AppState, SubtitleCue } from '../types';

export interface AppSlice {
  appState: AppState;
  subtitles: SubtitleCue[];
  secondarySubtitles: SubtitleCue[];
  setAppState: (state: AppState) => void;
  setSubtitles: (subtitles: SubtitleCue[]) => void;
  setSecondarySubtitles: (subtitles: SubtitleCue[]) => void;
  resetApp: () => void;
}

export const createAppSlice: StateCreator<AppSlice> = (set) => ({
  appState: AppState.UPLOAD,
  subtitles: [],
  secondarySubtitles: [],
  setAppState: (appState) => set({ appState }),
  setSubtitles: (subtitles) => set({ subtitles }),
  setSecondarySubtitles: (secondarySubtitles) => set({ secondarySubtitles }),
  resetApp: () => set({
    appState: AppState.UPLOAD,
    subtitles: [],
    secondarySubtitles: [],
  }),
});
