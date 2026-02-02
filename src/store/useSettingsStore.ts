import { create } from 'zustand';
import { db } from '@/db';
import type { AppSettings } from '@/types';

interface SettingsStore {
  settings: AppSettings | null;
  isLoading: boolean;
  error: string | null;

  fetchSettings: () => Promise<void>;
  updateSettings: (updates: Partial<AppSettings>) => Promise<void>;
  toggleDarkMode: () => Promise<void>;
  setShowDemoWizard: (show: boolean) => Promise<void>;
}

export const useSettingsStore = create<SettingsStore>((set, get) => ({
  settings: null,
  isLoading: false,
  error: null,

  fetchSettings: async () => {
    set({ isLoading: true, error: null });
    try {
      const settings = await db.settings.get('default');
      set({ settings: settings || null, isLoading: false });
    } catch (error) {
      set({ error: (error as Error).message, isLoading: false });
    }
  },

  updateSettings: async (updates) => {
    set({ isLoading: true, error: null });
    try {
      await db.settings.update('default', updates);
      set((state) => ({
        settings: state.settings ? { ...state.settings, ...updates } : null,
        isLoading: false
      }));
    } catch (error) {
      set({ error: (error as Error).message, isLoading: false });
    }
  },

  toggleDarkMode: async () => {
    const { settings } = get();
    if (settings) {
      const newDarkMode = !settings.darkMode;
      await get().updateSettings({ darkMode: newDarkMode });

      // Apply dark mode class to document
      if (newDarkMode) {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
    }
  },

  setShowDemoWizard: async (show) => {
    await get().updateSettings({ showDemoWizard: show });
  },
}));
