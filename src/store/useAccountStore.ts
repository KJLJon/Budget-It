import { create } from 'zustand';
import { db } from '@/db';
import type { Account } from '@/types';

interface AccountStore {
  accounts: Account[];
  isLoading: boolean;
  error: string | null;

  fetchAccounts: () => Promise<void>;
  addAccount: (account: Omit<Account, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  updateAccount: (id: string, updates: Partial<Account>) => Promise<void>;
  deleteAccount: (id: string) => Promise<void>;
  getAccountById: (id: string) => Account | undefined;
  getAssetAccounts: () => Account[];
  getLiabilityAccounts: () => Account[];
  getTotalAssets: () => number;
  getTotalLiabilities: () => number;
  getNetWorth: () => number;
}

export const useAccountStore = create<AccountStore>((set, get) => ({
  accounts: [],
  isLoading: false,
  error: null,

  fetchAccounts: async () => {
    set({ isLoading: true, error: null });
    try {
      const accounts = await db.accounts.toArray();
      set({ accounts, isLoading: false });
    } catch (error) {
      set({ error: (error as Error).message, isLoading: false });
    }
  },

  addAccount: async (accountData) => {
    set({ isLoading: true, error: null });
    try {
      const now = new Date().toISOString();
      const account: Account = {
        ...accountData,
        id: crypto.randomUUID(),
        createdAt: now,
        updatedAt: now,
      };
      await db.accounts.add(account);
      set((state) => ({
        accounts: [...state.accounts, account],
        isLoading: false
      }));
    } catch (error) {
      set({ error: (error as Error).message, isLoading: false });
    }
  },

  updateAccount: async (id, updates) => {
    set({ isLoading: true, error: null });
    try {
      const updatedData = { ...updates, updatedAt: new Date().toISOString() };
      await db.accounts.update(id, updatedData);
      set((state) => ({
        accounts: state.accounts.map((acc) =>
          acc.id === id ? { ...acc, ...updatedData } : acc
        ),
        isLoading: false
      }));
    } catch (error) {
      set({ error: (error as Error).message, isLoading: false });
    }
  },

  deleteAccount: async (id) => {
    set({ isLoading: true, error: null });
    try {
      await db.accounts.delete(id);
      set((state) => ({
        accounts: state.accounts.filter((acc) => acc.id !== id),
        isLoading: false
      }));
    } catch (error) {
      set({ error: (error as Error).message, isLoading: false });
    }
  },

  getAccountById: (id) => {
    return get().accounts.find((acc) => acc.id === id);
  },

  getAssetAccounts: () => {
    return get().accounts.filter((acc) => acc.category === 'asset');
  },

  getLiabilityAccounts: () => {
    return get().accounts.filter((acc) => acc.category === 'liability');
  },

  getTotalAssets: () => {
    return get().accounts
      .filter((acc) => acc.category === 'asset')
      .reduce((sum, acc) => sum + acc.balance, 0);
  },

  getTotalLiabilities: () => {
    return get().accounts
      .filter((acc) => acc.category === 'liability')
      .reduce((sum, acc) => sum + Math.abs(acc.balance), 0);
  },

  getNetWorth: () => {
    return get().getTotalAssets() - get().getTotalLiabilities();
  },
}));
