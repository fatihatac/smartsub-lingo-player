import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { createAppSlice, AppSlice } from './createAppSlice';
import { createSettingsSlice, SettingsSlice } from './createSettingsSlice';

export const useAppStore = create<AppSlice & SettingsSlice>()(
  persist(
    (...a) => ({
      ...createAppSlice(...a),
      ...createSettingsSlice(...a),
    }),
    {
      name: 'app-storage',
      partialize: (state) => ({
        sourceLang: state.sourceLang,
        targetLang: state.targetLang,
        subtitleSettings: state.subtitleSettings,
        showTranslation: state.showTranslation,
        playbackTimes: state.playbackTimes,
      }),
    }
  )
);
