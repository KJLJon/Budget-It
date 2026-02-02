import { create } from 'zustand';
import { db } from '@/db';
import type { Category } from '@/types';

interface CategoryStore {
  categories: Category[];
  isLoading: boolean;
  error: string | null;

  fetchCategories: () => Promise<void>;
  addCategory: (category: Omit<Category, 'id'>) => Promise<void>;
  updateCategory: (id: string, updates: Partial<Category>) => Promise<void>;
  deleteCategory: (id: string) => Promise<void>;
  getCategoryById: (id: string) => Category | undefined;
  getIncomeCategories: () => Category[];
  getExpenseCategories: () => Category[];
  getTransferCategories: () => Category[];
}

export const useCategoryStore = create<CategoryStore>((set, get) => ({
  categories: [],
  isLoading: false,
  error: null,

  fetchCategories: async () => {
    set({ isLoading: true, error: null });
    try {
      const categories = await db.categories.toArray();
      set({ categories, isLoading: false });
    } catch (error) {
      set({ error: (error as Error).message, isLoading: false });
    }
  },

  addCategory: async (categoryData) => {
    set({ isLoading: true, error: null });
    try {
      const category: Category = {
        ...categoryData,
        id: crypto.randomUUID(),
      };
      await db.categories.add(category);
      set((state) => ({
        categories: [...state.categories, category],
        isLoading: false
      }));
    } catch (error) {
      set({ error: (error as Error).message, isLoading: false });
    }
  },

  updateCategory: async (id, updates) => {
    set({ isLoading: true, error: null });
    try {
      await db.categories.update(id, updates);
      set((state) => ({
        categories: state.categories.map((cat) =>
          cat.id === id ? { ...cat, ...updates } : cat
        ),
        isLoading: false
      }));
    } catch (error) {
      set({ error: (error as Error).message, isLoading: false });
    }
  },

  deleteCategory: async (id) => {
    const category = get().getCategoryById(id);
    if (category?.isSystem) {
      set({ error: 'Cannot delete system categories' });
      return;
    }

    set({ isLoading: true, error: null });
    try {
      await db.categories.delete(id);
      set((state) => ({
        categories: state.categories.filter((cat) => cat.id !== id),
        isLoading: false
      }));
    } catch (error) {
      set({ error: (error as Error).message, isLoading: false });
    }
  },

  getCategoryById: (id) => {
    return get().categories.find((cat) => cat.id === id);
  },

  getIncomeCategories: () => {
    return get().categories.filter((cat) => cat.type === 'income');
  },

  getExpenseCategories: () => {
    return get().categories.filter((cat) => cat.type === 'expense');
  },

  getTransferCategories: () => {
    return get().categories.filter((cat) => cat.type === 'transfer');
  },
}));
