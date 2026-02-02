export type AccountCategory = 'asset' | 'liability';

export type AccountType =
  | 'checking'
  | 'savings'
  | 'investment'
  | 'credit_card'
  | 'loan'
  | 'mortgage'
  | 'other_asset'
  | 'other_liability';

export interface Account {
  id: string;
  name: string;
  type: AccountType;
  category: AccountCategory;
  balance: number;
  institution?: string;
  color?: string;
  notes?: string;
  // For liabilities
  interestRate?: number;
  originalAmount?: number;
  originationDate?: string;
  termMonths?: number;
  minimumPayment?: number;
  isRevolving?: boolean;
  createdAt: string;
  updatedAt: string;
}

export type CategoryType = 'income' | 'expense' | 'transfer';

export interface Category {
  id: string;
  name: string;
  type: CategoryType;
  color: string;
  icon?: string;
  parentId?: string;
  isSystem: boolean;
}

export interface Transaction {
  id: string;
  accountId: string;
  date: string;
  description: string;
  amount: number;
  categoryId?: string;
  subcategory?: string;
  notes?: string;
  tags?: string[];
  isTransfer?: boolean;
  linkedTransactionId?: string;
  isRecurring?: boolean;
  recurringRuleId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface RecurringRule {
  id: string;
  description: string;
  categoryId?: string;
  frequency: 'daily' | 'weekly' | 'biweekly' | 'monthly' | 'quarterly' | 'yearly';
  amount?: number;
  accountId?: string;
  isActive: boolean;
  createdAt: string;
}

export type AssetClass = 'us_stock' | 'intl_stock' | 'bond' | 'cash';

export interface Allocation {
  assetClass: AssetClass;
  percentage: number;
  currentValue?: number;
}

export interface WithdrawalBucket {
  yearsOut: number;
  amount: number;
  inflationAdjusted: boolean;
}

export interface InvestmentPlan {
  id: string;
  name: string;
  birthDate: string;
  withdrawalBuckets: WithdrawalBucket[];
  currentAllocations: Allocation[];
  targetAllocations: Allocation[];
  monthlyContribution: number;
  createdAt: string;
  updatedAt: string;
}

export interface AppSettings {
  id?: string;
  currency: string;
  dateFormat: string;
  darkMode: boolean;
  transactionStartDate?: string;
  showDemoWizard: boolean;
}

export interface FinancialProfile {
  id: string;
  name: string;
  type: 'individual' | 'joint';
  isActive: boolean;
  createdAt: string;
}
