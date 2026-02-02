import { create } from 'zustand';
import { db } from '@/db';
import type { FinancialProfile } from '@/types';

interface ProfileStore {
  profiles: FinancialProfile[];
  activeProfile: FinancialProfile | null;
  isLoading: boolean;
  error: string | null;

  fetchProfiles: () => Promise<void>;
  addProfile: (profile: Omit<FinancialProfile, 'id' | 'createdAt'>) => Promise<void>;
  updateProfile: (id: string, updates: Partial<FinancialProfile>) => Promise<void>;
  deleteProfile: (id: string) => Promise<void>;
  setActiveProfile: (id: string) => Promise<void>;
  getActiveProfile: () => FinancialProfile | null;
}

export const useProfileStore = create<ProfileStore>((set, get) => ({
  profiles: [],
  activeProfile: null,
  isLoading: false,
  error: null,

  fetchProfiles: async () => {
    set({ isLoading: true, error: null });
    try {
      const profiles = await db.profiles.toArray();
      const activeProfile = profiles.find((p) => p.isActive) || profiles[0] || null;
      set({ profiles, activeProfile, isLoading: false });
    } catch (error) {
      set({ error: (error as Error).message, isLoading: false });
    }
  },

  addProfile: async (profileData) => {
    set({ isLoading: true, error: null });
    try {
      const profile: FinancialProfile = {
        ...profileData,
        id: crypto.randomUUID(),
        createdAt: new Date().toISOString(),
      };
      await db.profiles.add(profile);
      set((state) => ({
        profiles: [...state.profiles, profile],
        isLoading: false
      }));
    } catch (error) {
      set({ error: (error as Error).message, isLoading: false });
    }
  },

  updateProfile: async (id, updates) => {
    set({ isLoading: true, error: null });
    try {
      await db.profiles.update(id, updates);
      set((state) => {
        const updatedProfiles = state.profiles.map((p) =>
          p.id === id ? { ...p, ...updates } : p
        );
        const activeProfile = state.activeProfile?.id === id
          ? { ...state.activeProfile, ...updates }
          : state.activeProfile;
        return { profiles: updatedProfiles, activeProfile, isLoading: false };
      });
    } catch (error) {
      set({ error: (error as Error).message, isLoading: false });
    }
  },

  deleteProfile: async (id) => {
    set({ isLoading: true, error: null });
    try {
      await db.profiles.delete(id);
      set((state) => ({
        profiles: state.profiles.filter((p) => p.id !== id),
        activeProfile: state.activeProfile?.id === id ? null : state.activeProfile,
        isLoading: false
      }));
    } catch (error) {
      set({ error: (error as Error).message, isLoading: false });
    }
  },

  setActiveProfile: async (id) => {
    set({ isLoading: true, error: null });
    try {
      // Deactivate all profiles first
      const { profiles } = get();
      await Promise.all(
        profiles.map((p) => db.profiles.update(p.id, { isActive: false }))
      );
      // Activate the selected profile
      await db.profiles.update(id, { isActive: true });

      set((state) => {
        const updatedProfiles = state.profiles.map((p) => ({
          ...p,
          isActive: p.id === id,
        }));
        const activeProfile = updatedProfiles.find((p) => p.id === id) || null;
        return { profiles: updatedProfiles, activeProfile, isLoading: false };
      });
    } catch (error) {
      set({ error: (error as Error).message, isLoading: false });
    }
  },

  getActiveProfile: () => {
    return get().activeProfile;
  },
}));
