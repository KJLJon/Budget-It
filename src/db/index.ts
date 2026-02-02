import Dexie, { Table } from 'dexie';
import type {
  Account,
  Transaction,
  Category,
  RecurringRule,
  InvestmentPlan,
  AppSettings,
  FinancialProfile,
} from '@/types';

export class BudgetDatabase extends Dexie {
  accounts!: Table<Account>;
  transactions!: Table<Transaction>;
  categories!: Table<Category>;
  recurringRules!: Table<RecurringRule>;
  investmentPlans!: Table<InvestmentPlan>;
  settings!: Table<AppSettings>;
  profiles!: Table<FinancialProfile>;

  constructor() {
    super('BudgetItDB');

    this.version(1).stores({
      accounts: 'id, category, type, name',
      transactions: 'id, accountId, date, categoryId, description',
      categories: 'id, type, name, parentId',
      recurringRules: 'id, description, accountId',
      investmentPlans: 'id, name',
      settings: 'id',
      profiles: 'id, isActive',
    });
  }
}

export const db = new BudgetDatabase();

// Initialize default data
export async function initializeDefaultData() {
  const settingsCount = await db.settings.count();
  if (settingsCount === 0) {
    await db.settings.add({
      id: 'default',
      currency: 'USD',
      dateFormat: 'MM/dd/yyyy',
      darkMode: false,
      showDemoWizard: true,
    });
  }

  const categoriesCount = await db.categories.count();
  if (categoriesCount === 0) {
    await db.categories.bulkAdd(getDefaultCategories());
  }

  const profilesCount = await db.profiles.count();
  if (profilesCount === 0) {
    await db.profiles.add({
      id: crypto.randomUUID(),
      name: 'Personal',
      type: 'individual',
      isActive: true,
      createdAt: new Date().toISOString(),
    });
  }
}

function getDefaultCategories(): Category[] {
  return [
    // Income
    { id: 'income-salary', name: 'Salary/Wages', type: 'income', color: '#10b981', isSystem: true },
    { id: 'income-bonus', name: 'Bonus', type: 'income', color: '#059669', isSystem: true },
    { id: 'income-investment', name: 'Investment Income', type: 'income', color: '#047857', isSystem: true },
    { id: 'income-side', name: 'Side Income', type: 'income', color: '#34d399', isSystem: true },
    { id: 'income-other', name: 'Other Income', type: 'income', color: '#6ee7b7', isSystem: true },

    // Expenses
    { id: 'expense-housing', name: 'Housing', type: 'expense', color: '#ef4444', isSystem: true },
    { id: 'expense-utilities', name: 'Utilities', type: 'expense', color: '#dc2626', isSystem: true },
    { id: 'expense-transportation', name: 'Transportation', type: 'expense', color: '#b91c1c', isSystem: true },
    { id: 'expense-food', name: 'Food & Dining', type: 'expense', color: '#f97316', isSystem: true },
    { id: 'expense-healthcare', name: 'Healthcare', type: 'expense', color: '#ea580c', isSystem: true },
    { id: 'expense-insurance', name: 'Insurance', type: 'expense', color: '#c2410c', isSystem: true },
    { id: 'expense-debt', name: 'Debt Payments', type: 'expense', color: '#7c2d12', isSystem: true },
    { id: 'expense-entertainment', name: 'Entertainment', type: 'expense', color: '#8b5cf6', isSystem: true },
    { id: 'expense-shopping', name: 'Shopping', type: 'expense', color: '#6366f1', isSystem: true },
    { id: 'expense-travel', name: 'Travel', type: 'expense', color: '#3b82f6', isSystem: true },
    { id: 'expense-personal', name: 'Personal Care', type: 'expense', color: '#06b6d4', isSystem: true },
    { id: 'expense-education', name: 'Education', type: 'expense', color: '#0891b2', isSystem: true },
    { id: 'expense-family', name: 'Childcare/Family', type: 'expense', color: '#0e7490', isSystem: true },
    { id: 'expense-pets', name: 'Pets', type: 'expense', color: '#ec4899', isSystem: true },
    { id: 'expense-gifts', name: 'Gifts/Donations', type: 'expense', color: '#db2777', isSystem: true },
    { id: 'expense-fees', name: 'Fees', type: 'expense', color: '#9f1239', isSystem: true },
    { id: 'expense-other', name: 'Other', type: 'expense', color: '#9ca3af', isSystem: true },

    // Transfers
    { id: 'transfer-savings', name: 'Savings Transfer', type: 'transfer', color: '#a855f7', isSystem: true },
    { id: 'transfer-investment', name: 'Investment Transfer', type: 'transfer', color: '#9333ea', isSystem: true },
    { id: 'transfer-internal', name: 'Internal Transfer', type: 'transfer', color: '#7e22ce', isSystem: true },
  ];
}
