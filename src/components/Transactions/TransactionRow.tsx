import { memo, useState, useRef, useEffect } from 'react';
import { Edit2, Trash2, ChevronDown, Tag } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { useAccountStore } from '@/store/useAccountStore';
import { useCategoryStore } from '@/store/useCategoryStore';
import { useTransactionStore } from '@/store/useTransactionStore';
import { formatCurrency } from '@/utils/currency';
import type { Transaction } from '@/types';

interface TransactionRowProps {
  transaction: Transaction;
  onEdit: (transaction: Transaction) => void;
  onDelete: (id: string) => void;
}

export const TransactionRow = memo(function TransactionRow({
  transaction,
  onEdit,
  onDelete,
}: TransactionRowProps) {
  const getAccountById = useAccountStore((state) => state.getAccountById);
  const getCategoryById = useCategoryStore((state) => state.getCategoryById);
  const categories = useCategoryStore((state) => state.categories);
  const updateTransaction = useTransactionStore((state) => state.updateTransaction);

  const [showCategoryDropdown, setShowCategoryDropdown] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const account = getAccountById(transaction.accountId);
  const category = transaction.categoryId
    ? getCategoryById(transaction.categoryId)
    : null;

  const isExpense = transaction.amount < 0;
  const date = new Date(transaction.date).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowCategoryDropdown(false);
      }
    };

    if (showCategoryDropdown) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [showCategoryDropdown]);

  const handleCategoryChange = async (categoryId: string) => {
    await updateTransaction(transaction.id, { categoryId });
    setShowCategoryDropdown(false);
  };

  const incomeCategories = categories.filter((c) => c.type === 'income');
  const expenseCategories = categories.filter((c) => c.type === 'expense');
  const transferCategories = categories.filter((c) => c.type === 'transfer');

  return (
    <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <p className="font-medium text-gray-900 dark:text-white truncate">
              {transaction.description}
            </p>
            <div className="relative" ref={dropdownRef}>
              {category ? (
                <button
                  onClick={() => setShowCategoryDropdown(!showCategoryDropdown)}
                  className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium hover:opacity-80 transition-opacity"
                  style={{
                    backgroundColor: `${category.color}20`,
                    color: category.color,
                  }}
                  title="Click to change category"
                >
                  {category.name}
                  <ChevronDown className="w-3 h-3" />
                </button>
              ) : (
                <button
                  onClick={() => setShowCategoryDropdown(!showCategoryDropdown)}
                  className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                  title="Click to add category"
                >
                  <Tag className="w-3 h-3" />
                  Add category
                </button>
              )}

              {showCategoryDropdown && (
                <div className="absolute z-10 mt-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg max-h-64 overflow-y-auto min-w-48">
                  {incomeCategories.length > 0 && (
                    <div className="p-2">
                      <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1 px-2">
                        INCOME
                      </p>
                      {incomeCategories.map((cat) => (
                        <button
                          key={cat.id}
                          onClick={() => handleCategoryChange(cat.id)}
                          className={`w-full text-left px-3 py-2 rounded hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors ${
                            cat.id === transaction.categoryId ? 'bg-blue-50 dark:bg-blue-900/30' : ''
                          }`}
                        >
                          <div className="flex items-center gap-2">
                            <span
                              className="w-3 h-3 rounded-full flex-shrink-0"
                              style={{ backgroundColor: cat.color }}
                            />
                            <span className="text-sm text-gray-900 dark:text-white">
                              {cat.name}
                            </span>
                          </div>
                        </button>
                      ))}
                    </div>
                  )}

                  {expenseCategories.length > 0 && (
                    <div className="p-2 border-t border-gray-200 dark:border-gray-700">
                      <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1 px-2">
                        EXPENSES
                      </p>
                      {expenseCategories.map((cat) => (
                        <button
                          key={cat.id}
                          onClick={() => handleCategoryChange(cat.id)}
                          className={`w-full text-left px-3 py-2 rounded hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors ${
                            cat.id === transaction.categoryId ? 'bg-blue-50 dark:bg-blue-900/30' : ''
                          }`}
                        >
                          <div className="flex items-center gap-2">
                            <span
                              className="w-3 h-3 rounded-full flex-shrink-0"
                              style={{ backgroundColor: cat.color }}
                            />
                            <span className="text-sm text-gray-900 dark:text-white">
                              {cat.name}
                            </span>
                          </div>
                        </button>
                      ))}
                    </div>
                  )}

                  {transferCategories.length > 0 && (
                    <div className="p-2 border-t border-gray-200 dark:border-gray-700">
                      <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1 px-2">
                        TRANSFERS
                      </p>
                      {transferCategories.map((cat) => (
                        <button
                          key={cat.id}
                          onClick={() => handleCategoryChange(cat.id)}
                          className={`w-full text-left px-3 py-2 rounded hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors ${
                            cat.id === transaction.categoryId ? 'bg-blue-50 dark:bg-blue-900/30' : ''
                          }`}
                        >
                          <div className="flex items-center gap-2">
                            <span
                              className="w-3 h-3 rounded-full flex-shrink-0"
                              style={{ backgroundColor: cat.color }}
                            />
                            <span className="text-sm text-gray-900 dark:text-white">
                              {cat.name}
                            </span>
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
          <div className="flex items-center gap-3 text-sm text-gray-600 dark:text-gray-400">
            <span>{date}</span>
            {account && (
              <>
                <span>•</span>
                <span className="truncate">{account.name}</span>
              </>
            )}
          </div>
          {transaction.notes && (
            <p className="mt-2 text-sm text-gray-600 dark:text-gray-400 line-clamp-2">
              {transaction.notes}
            </p>
          )}
        </div>

        <div className="flex flex-col items-end gap-2">
          <span
            className={`text-lg font-semibold ${
              isExpense
                ? 'text-red-600 dark:text-red-400'
                : 'text-green-600 dark:text-green-400'
            }`}
          >
            {isExpense ? '-' : '+'}
            {formatCurrency(Math.abs(transaction.amount))}
          </span>

          <div className="flex gap-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onEdit(transaction)}
              className="text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400"
              title="Edit"
            >
              <Edit2 className="w-4 h-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onDelete(transaction.id)}
              className="text-gray-600 dark:text-gray-400 hover:text-red-600 dark:hover:text-red-400"
              title="Delete"
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
});
