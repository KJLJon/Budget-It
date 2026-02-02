import { create } from 'zustand';
import { db } from '@/db';
import type { Transaction } from '@/types';
import { startOfMonth, endOfMonth } from 'date-fns';

interface TransactionStore {
  transactions: Transaction[];
  isLoading: boolean;
  error: string | null;

  fetchTransactions: () => Promise<void>;
  addTransaction: (transaction: Omit<Transaction, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  updateTransaction: (id: string, updates: Partial<Transaction>) => Promise<void>;
  deleteTransaction: (id: string) => Promise<void>;
  bulkAddTransactions: (transactions: Omit<Transaction, 'id' | 'createdAt' | 'updatedAt'>[]) => Promise<void>;
  getTransactionById: (id: string) => Transaction | undefined;
  getTransactionsByAccount: (accountId: string) => Transaction[];
  getTransactionsByCategory: (categoryId: string) => Transaction[];
  getTransactionsByDateRange: (startDate: string, endDate: string) => Transaction[];
  getCurrentMonthTransactions: () => Transaction[];
  applyCategory: (description: string, categoryId: string, applyToAll?: boolean) => Promise<void>;
}

export const useTransactionStore = create<TransactionStore>((set, get) => ({
  transactions: [],
  isLoading: false,
  error: null,

  fetchTransactions: async () => {
    set({ isLoading: true, error: null });
    try {
      const transactions = await db.transactions.toArray();
      // Sort by date descending
      transactions.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      set({ transactions, isLoading: false });
    } catch (error) {
      set({ error: (error as Error).message, isLoading: false });
    }
  },

  addTransaction: async (transactionData) => {
    set({ isLoading: true, error: null });
    try {
      const now = new Date().toISOString();
      const transaction: Transaction = {
        ...transactionData,
        id: crypto.randomUUID(),
        createdAt: now,
        updatedAt: now,
      };
      await db.transactions.add(transaction);
      set((state) => {
        const newTransactions = [...state.transactions, transaction];
        newTransactions.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
        return { transactions: newTransactions, isLoading: false };
      });
    } catch (error) {
      set({ error: (error as Error).message, isLoading: false });
    }
  },

  updateTransaction: async (id, updates) => {
    set({ isLoading: true, error: null });
    try {
      const updatedData = { ...updates, updatedAt: new Date().toISOString() };
      await db.transactions.update(id, updatedData);
      set((state) => ({
        transactions: state.transactions.map((txn) =>
          txn.id === id ? { ...txn, ...updatedData } : txn
        ),
        isLoading: false
      }));
    } catch (error) {
      set({ error: (error as Error).message, isLoading: false });
    }
  },

  deleteTransaction: async (id) => {
    set({ isLoading: true, error: null });
    try {
      await db.transactions.delete(id);
      set((state) => ({
        transactions: state.transactions.filter((txn) => txn.id !== id),
        isLoading: false
      }));
    } catch (error) {
      set({ error: (error as Error).message, isLoading: false });
    }
  },

  bulkAddTransactions: async (transactionsData) => {
    set({ isLoading: true, error: null });
    try {
      const now = new Date().toISOString();
      const transactions: Transaction[] = transactionsData.map((data) => ({
        ...data,
        id: crypto.randomUUID(),
        createdAt: now,
        updatedAt: now,
      }));
      await db.transactions.bulkAdd(transactions);
      set((state) => {
        const newTransactions = [...state.transactions, ...transactions];
        newTransactions.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
        return { transactions: newTransactions, isLoading: false };
      });
    } catch (error) {
      set({ error: (error as Error).message, isLoading: false });
    }
  },

  getTransactionById: (id) => {
    return get().transactions.find((txn) => txn.id === id);
  },

  getTransactionsByAccount: (accountId) => {
    return get().transactions.filter((txn) => txn.accountId === accountId);
  },

  getTransactionsByCategory: (categoryId) => {
    return get().transactions.filter((txn) => txn.categoryId === categoryId);
  },

  getTransactionsByDateRange: (startDate, endDate) => {
    const start = new Date(startDate).getTime();
    const end = new Date(endDate).getTime();
    return get().transactions.filter((txn) => {
      const txnDate = new Date(txn.date).getTime();
      return txnDate >= start && txnDate <= end;
    });
  },

  getCurrentMonthTransactions: () => {
    const now = new Date();
    const start = startOfMonth(now).toISOString();
    const end = endOfMonth(now).toISOString();
    return get().getTransactionsByDateRange(start, end);
  },

  applyCategory: async (description, categoryId, applyToAll = false) => {
    set({ isLoading: true, error: null });
    try {
      const { transactions } = get();
      const matchingTransactions = transactions.filter((txn) => {
        if (applyToAll) {
          return txn.description.toLowerCase().includes(description.toLowerCase());
        } else {
          // Only apply to future transactions (today and onwards)
          return (
            txn.description.toLowerCase().includes(description.toLowerCase()) &&
            new Date(txn.date) >= new Date()
          );
        }
      });

      // Update all matching transactions
      await Promise.all(
        matchingTransactions.map((txn) =>
          db.transactions.update(txn.id, {
            categoryId,
            updatedAt: new Date().toISOString()
          })
        )
      );

      // Update state
      set((state) => ({
        transactions: state.transactions.map((txn) => {
          const shouldUpdate = matchingTransactions.some((m) => m.id === txn.id);
          return shouldUpdate
            ? { ...txn, categoryId, updatedAt: new Date().toISOString() }
            : txn;
        }),
        isLoading: false
      }));
    } catch (error) {
      set({ error: (error as Error).message, isLoading: false });
    }
  },
}));
