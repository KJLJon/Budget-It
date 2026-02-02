import type { Account, Transaction } from '@/types';
import { subDays, subMonths } from 'date-fns';

/**
 * Generate sample accounts for demo mode
 */
export function generateDemoAccounts(): Omit<Account, 'id' | 'createdAt' | 'updatedAt'>[] {
  return [
    {
      name: 'Main Checking',
      type: 'checking',
      category: 'asset',
      balance: 3240.75,
      institution: 'Chase Bank',
    },
    {
      name: 'Savings Account',
      type: 'savings',
      category: 'asset',
      balance: 12500.0,
      institution: 'Ally Bank',
    },
    {
      name: 'Investment Portfolio',
      type: 'investment',
      category: 'asset',
      balance: 45800.0,
      institution: 'Vanguard',
    },
    {
      name: 'Credit Card',
      type: 'credit_card',
      category: 'liability',
      balance: -1250.0,
      institution: 'Chase',
      interestRate: 18.99,
      minimumPayment: 35.0,
    },
    {
      name: 'Auto Loan',
      type: 'loan',
      category: 'liability',
      balance: -8500.0,
      institution: 'Toyota Financial',
      interestRate: 4.5,
      minimumPayment: 285.0,
      termMonths: 48,
    },
    {
      name: 'Student Loan',
      type: 'loan',
      category: 'liability',
      balance: -22000.0,
      institution: 'Federal Direct',
      interestRate: 5.8,
      minimumPayment: 245.0,
      termMonths: 120,
    },
  ];
}

/**
 * Generate sample transactions for demo mode
 */
export function generateDemoTransactions(
  accountIds: string[],
  categoryIds: { income: string[]; expense: string[] }
): Omit<Transaction, 'id' | 'createdAt' | 'updatedAt'>[] {
  const transactions: Omit<Transaction, 'id' | 'createdAt' | 'updatedAt'>[] = [];
  const checkingId = accountIds[0];
  const now = new Date();

  // Salary (monthly, last 3 months)
  for (let i = 0; i < 3; i++) {
    transactions.push({
      date: subMonths(now, i).toISOString().split('T')[0],
      description: 'Salary Deposit - Acme Corp',
      amount: 4200.0,
      accountId: checkingId,
      categoryId: categoryIds.income[0], // Salary
      notes: 'Monthly salary',
    });
  }

  // Recurring expenses
  const recurringExpenses = [
    { desc: 'Netflix Subscription', amount: -15.99, days: 30, categoryIdx: 4 }, // Entertainment
    { desc: 'Spotify Premium', amount: -9.99, days: 30, categoryIdx: 4 },
    { desc: 'Electric Bill', amount: -85.0, days: 30, categoryIdx: 1 }, // Utilities
    { desc: 'Internet Service', amount: -65.0, days: 30, categoryIdx: 1 },
    { desc: 'Car Insurance', amount: -125.0, days: 30, categoryIdx: 7 }, // Insurance
    { desc: 'Gym Membership', amount: -45.0, days: 30, categoryIdx: 6 }, // Health
  ];

  for (const expense of recurringExpenses) {
    for (let i = 0; i < 3; i++) {
      transactions.push({
        date: subDays(now, i * expense.days + 5).toISOString().split('T')[0],
        description: expense.desc,
        amount: expense.amount,
        accountId: checkingId,
        categoryId: categoryIds.expense[expense.categoryIdx],
      });
    }
  }

  // Random groceries (weekly)
  const groceryStores = ['Whole Foods', 'Trader Joes', 'Safeway', 'Kroger'];
  for (let i = 0; i < 12; i++) {
    transactions.push({
      date: subDays(now, i * 7 + 2).toISOString().split('T')[0],
      description: groceryStores[i % groceryStores.length],
      amount: -(Math.random() * 80 + 40), // $40-$120
      accountId: checkingId,
      categoryId: categoryIds.expense[0], // Groceries
    });
  }

  // Random restaurants
  const restaurants = ['Chipotle', 'Panera Bread', 'Local Pizza', 'Thai Kitchen', 'Burger Place'];
  for (let i = 0; i < 15; i++) {
    transactions.push({
      date: subDays(now, Math.floor(Math.random() * 60)).toISOString().split('T')[0],
      description: restaurants[i % restaurants.length],
      amount: -(Math.random() * 40 + 15), // $15-$55
      accountId: checkingId,
      categoryId: categoryIds.expense[2], // Dining
    });
  }

  // Gas/fuel
  for (let i = 0; i < 8; i++) {
    transactions.push({
      date: subDays(now, i * 10 + 3).toISOString().split('T')[0],
      description: 'Shell Gas Station',
      amount: -(Math.random() * 30 + 35), // $35-$65
      accountId: checkingId,
      categoryId: categoryIds.expense[3], // Transportation
    });
  }

  // Shopping
  const stores = ['Amazon', 'Target', 'Best Buy', 'Home Depot'];
  for (let i = 0; i < 10; i++) {
    transactions.push({
      date: subDays(now, Math.floor(Math.random() * 60)).toISOString().split('T')[0],
      description: stores[i % stores.length],
      amount: -(Math.random() * 100 + 25), // $25-$125
      accountId: checkingId,
      categoryId: categoryIds.expense[5], // Shopping
    });
  }

  // Loan payments
  transactions.push({
    date: subDays(now, 5).toISOString().split('T')[0],
    description: 'Auto Loan Payment',
    amount: -285.0,
    accountId: checkingId,
    categoryId: categoryIds.expense[8], // Loan Payment
  });

  transactions.push({
    date: subDays(now, 5).toISOString().split('T')[0],
    description: 'Student Loan Payment',
    amount: -245.0,
    accountId: checkingId,
    categoryId: categoryIds.expense[8],
  });

  return transactions;
}

/**
 * Check if demo mode is active
 */
export function isDemoMode(): boolean {
  return localStorage.getItem('demoMode') === 'true';
}

/**
 * Enable demo mode
 */
export function enableDemoMode(): void {
  localStorage.setItem('demoMode', 'true');
}

/**
 * Disable demo mode
 */
export function disableDemoMode(): void {
  localStorage.removeItem('demoMode');
}
