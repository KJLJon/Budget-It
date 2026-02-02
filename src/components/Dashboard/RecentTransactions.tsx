import { format } from 'date-fns';
import { ArrowRight } from 'lucide-react';
import { useTransactionStore, useAccountStore, useCategoryStore } from '@/store';
import { useRouter } from '@/hooks/useRouter';
import { formatCurrency } from '@/utils/currency';

export function RecentTransactions() {
  const { transactions } = useTransactionStore();
  const { getAccountById } = useAccountStore();
  const { getCategoryById } = useCategoryStore();
  const { navigate } = useRouter();

  const recentTransactions = transactions.slice(0, 5);

  if (recentTransactions.length === 0) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Recent Transactions
        </h3>
        <p className="text-gray-600 dark:text-gray-400 text-center py-8">
          No transactions yet
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
          Recent Transactions
        </h3>
        <button
          onClick={() => navigate('transactions')}
          className="text-sm text-emerald-600 dark:text-emerald-400 hover:underline flex items-center gap-1"
        >
          View all
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>

      <div className="space-y-3">
        {recentTransactions.map((transaction) => {
          const account = getAccountById(transaction.accountId);
          const category = getCategoryById(transaction.categoryId || '');
          const isPositive = transaction.amount > 0;

          return (
            <div
              key={transaction.id}
              className="flex items-center justify-between p-3 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg transition-colors"
            >
              <div className="flex-1 min-w-0">
                <p className="font-medium text-gray-900 dark:text-white truncate">
                  {transaction.description}
                </p>
                <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                  <span>{format(new Date(transaction.date), 'MMM d')}</span>
                  {account && (
                    <>
                      <span>•</span>
                      <span>{account.name}</span>
                    </>
                  )}
                  {category && (
                    <>
                      <span>•</span>
                      <span>{category.name}</span>
                    </>
                  )}
                </div>
              </div>
              <div className={`font-semibold ${
                isPositive
                  ? 'text-emerald-600 dark:text-emerald-400'
                  : 'text-red-600 dark:text-red-400'
              }`}>
                {isPositive ? '+' : ''}{formatCurrency(transaction.amount)}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
