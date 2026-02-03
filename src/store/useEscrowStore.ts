import { create } from 'zustand';
import { db } from '@/db';
import type { EscrowItem } from '@/types';

interface EscrowStore {
  escrowItems: EscrowItem[];
  fetchEscrowItems: () => Promise<void>;
  addEscrowItem: (item: Omit<EscrowItem, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  updateEscrowItem: (id: string, updates: Partial<Omit<EscrowItem, 'id' | 'createdAt' | 'updatedAt'>>) => Promise<void>;
  deleteEscrowItem: (id: string) => Promise<void>;
}

export const useEscrowStore = create<EscrowStore>((set) => ({
  escrowItems: [],

  fetchEscrowItems: async () => {
    try {
      const items = await db.escrowItems.toArray();
      set({ escrowItems: items });
    } catch (error) {
      console.error('Failed to fetch escrow items:', error);
    }
  },

  addEscrowItem: async (item) => {
    try {
      const now = new Date().toISOString();
      const newItem: EscrowItem = {
        ...item,
        id: crypto.randomUUID(),
        createdAt: now,
        updatedAt: now,
      };

      await db.escrowItems.add(newItem);
      set((state) => ({ escrowItems: [...state.escrowItems, newItem] }));
    } catch (error) {
      console.error('Failed to add escrow item:', error);
      throw error;
    }
  },

  updateEscrowItem: async (id, updates) => {
    try {
      await db.escrowItems.update(id, {
        ...updates,
        updatedAt: new Date().toISOString(),
      });

      set((state) => ({
        escrowItems: state.escrowItems.map((item) =>
          item.id === id
            ? { ...item, ...updates, updatedAt: new Date().toISOString() }
            : item
        ),
      }));
    } catch (error) {
      console.error('Failed to update escrow item:', error);
      throw error;
    }
  },

  deleteEscrowItem: async (id) => {
    try {
      await db.escrowItems.delete(id);
      set((state) => ({
        escrowItems: state.escrowItems.filter((item) => item.id !== id),
      }));
    } catch (error) {
      console.error('Failed to delete escrow item:', error);
      throw error;
    }
  },
}));
