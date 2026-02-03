import { create } from 'zustand';
import { db } from '@/db';
import type { AnalysisType } from '@/types';

interface AnalysisStore {
  analysisData: Record<AnalysisType, any>;
  loadAnalysisData: () => Promise<void>;
  saveAnalysisData: (type: AnalysisType, data: any) => Promise<void>;
  getAnalysisData: (type: AnalysisType) => any;
}

export const useAnalysisStore = create<AnalysisStore>((set, get) => ({
  analysisData: {
    'investment-planner': null,
    'debt-payoff': null,
    'portfolio-mix': null,
    'scenarios': null,
    'escrow': null,
  },

  loadAnalysisData: async () => {
    try {
      const allData = await db.analysisData.toArray();
      const dataMap: Record<AnalysisType, any> = {
        'investment-planner': null,
        'debt-payoff': null,
        'portfolio-mix': null,
        'scenarios': null,
        'escrow': null,
      };

      allData.forEach((item) => {
        dataMap[item.type] = item.data;
      });

      set({ analysisData: dataMap });
    } catch (error) {
      console.error('Failed to load analysis data:', error);
    }
  },

  saveAnalysisData: async (type: AnalysisType, data: any) => {
    try {
      const existing = await db.analysisData.get({ type });

      if (existing) {
        await db.analysisData.update(existing.id, {
          data,
          updatedAt: new Date().toISOString(),
        });
      } else {
        await db.analysisData.add({
          id: crypto.randomUUID(),
          type,
          data,
          updatedAt: new Date().toISOString(),
        });
      }

      set((state) => ({
        analysisData: {
          ...state.analysisData,
          [type]: data,
        },
      }));
    } catch (error) {
      console.error('Failed to save analysis data:', error);
    }
  },

  getAnalysisData: (type: AnalysisType) => {
    return get().analysisData[type];
  },
}));
