import { Edit2, Trash2 } from 'lucide-react';
import type { Account } from '@/types';

interface AccountCardProps {
  account: Account;
  onEdit: () => void;
  onDelete: () => void;
}

export function AccountCard({ account, onEdit, onDelete }: AccountCardProps) {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(Math.abs(amount));
  };

  const isLiability = account.category === 'liability';
  const displayBalance = formatCurrency(account.balance);

  return (
    <div
      className="bg-white dark:bg-gray-800 rounded-lg p-4 border-l-4 shadow-sm"
      style={{ borderLeftColor: account.color || '#10b981' }}
    >
      <div className="flex items-start justify-between mb-2">
        <div className="flex-1">
          <h3 className="font-semibold text-gray-900 dark:text-white">
            {account.name}
          </h3>
          {account.institution && (
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {account.institution}
            </p>
          )}
        </div>
        <div className="flex gap-2">
          <button
            onClick={onEdit}
            className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors tap-highlight-transparent"
            aria-label="Edit account"
          >
            <Edit2 className="w-4 h-4 text-gray-600 dark:text-gray-400" />
          </button>
          <button
            onClick={onDelete}
            className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors tap-highlight-transparent"
            aria-label="Delete account"
          >
            <Trash2 className="w-4 h-4 text-red-600 dark:text-red-400" />
          </button>
        </div>
      </div>

      <div className="flex items-baseline gap-2 mb-2">
        <span className={`text-2xl font-bold ${
          isLiability ? 'text-red-600 dark:text-red-400' : 'text-emerald-600 dark:text-emerald-400'
        }`}>
          {isLiability && '-'}{displayBalance}
        </span>
      </div>

      {isLiability && account.interestRate !== undefined && (
        <div className="text-sm text-gray-600 dark:text-gray-400">
          APR: {account.interestRate}%
          {account.minimumPayment && (
            <> • Min Payment: {formatCurrency(account.minimumPayment)}</>
          )}
        </div>
      )}

      {account.notes && (
        <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
          {account.notes}
        </p>
      )}
    </div>
  );
}
