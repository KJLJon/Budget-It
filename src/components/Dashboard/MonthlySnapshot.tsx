import { ArrowDownCircle, ArrowUpCircle, TrendingUp } from 'lucide-react';
import { useTransactionStore, useCategoryStore } from '@/store';
import { formatCurrency, formatPercentage } from '@/utils/currency';
import { startOfMonth, endOfMonth } from 'date-fns';

export function MonthlySnapshot() {
  const { transactions } = useTransactionStore();
  const { categories } = useCategoryStore();

  const now = new Date();
  const monthStart = startOfMonth(now);
  const monthEnd = endOfMonth(now);

  const currentMonthTransactions = transactions.filter((txn) => {
    const txnDate = new Date(txn.date);
    return txnDate >= monthStart && txnDate <= monthEnd;
  });

  const income = currentMonthTransactions
    .filter((txn) => {
      const category = categories.find((cat) => cat.id === txn.categoryId);
      return category?.type === 'income';
    })
    .reduce((sum, txn) => sum + Math.abs(txn.amount), 0);

  const expenses = currentMonthTransactions
    .filter((txn) => {
      const category = categories.find((cat) => cat.id === txn.categoryId);
      return category?.type === 'expense';
    })
    .reduce((sum, txn) => sum + Math.abs(txn.amount), 0);

  const netCashFlow = income - expenses;
  const savingsRate = income > 0 ? (netCashFlow / income) * 100 : 0;

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm">
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
        This Month
      </h3>

      <div className="space-y-4">
        <div className="flex items-center justify-between p-3 bg-emerald-50 dark:bg-emerald-900/20 rounded-lg">
          <div className="flex items-center gap-3">
            <ArrowUpCircle className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Income</p>
              <p className="text-xl font-bold text-emerald-600 dark:text-emerald-400">
                {formatCurrency(income)}
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between p-3 bg-red-50 dark:bg-red-900/20 rounded-lg">
          <div className="flex items-center gap-3">
            <ArrowDownCircle className="w-5 h-5 text-red-600 dark:text-red-400" />
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Expenses</p>
              <p className="text-xl font-bold text-red-600 dark:text-red-400">
                {formatCurrency(expenses)}
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
          <div className="flex items-center gap-3">
            <TrendingUp className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Savings Rate</p>
              <p className="text-xl font-bold text-blue-600 dark:text-blue-400">
                {formatPercentage(savingsRate)}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
