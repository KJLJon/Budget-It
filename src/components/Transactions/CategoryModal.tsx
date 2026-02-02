import { useState } from 'react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { useCategoryStore } from '@/store/useCategoryStore';
import { useTransactionStore } from '@/store/useTransactionStore';
import type { Transaction } from '@/types';

interface CategoryModalProps {
  transaction: Transaction;
  onClose: () => void;
}

export function CategoryModal({ transaction, onClose }: CategoryModalProps) {
  const categories = useCategoryStore((state) => state.categories);
  const applyCategory = useTransactionStore((state) => state.applyCategory);
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>('');
  const [applyToAll, setApplyToAll] = useState(false);

  const handleApply = async () => {
    if (!selectedCategoryId) return;

    await applyCategory(transaction.description, selectedCategoryId, applyToAll);
    onClose();
  };

  const incomeCategories = categories.filter((c) => c.type === 'income');
  const expenseCategories = categories.filter((c) => c.type === 'expense');
  const transferCategories = categories.filter((c) => c.type === 'transfer');

  return (
    <Modal
      isOpen={true}
      onClose={onClose}
      title="Categorize Transaction"
    >
      <div className="space-y-4">
        <div>
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
            Transaction: <span className="font-medium text-gray-900 dark:text-white">{transaction.description}</span>
          </p>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Select Category
          </label>
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {incomeCategories.length > 0 && (
              <div>
                <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1 px-2">
                  INCOME
                </p>
                {incomeCategories.map((category) => (
                  <button
                    key={category.id}
                    type="button"
                    onClick={() => setSelectedCategoryId(category.id)}
                    className={`w-full text-left px-3 py-2 rounded-lg transition-colors ${
                      selectedCategoryId === category.id
                        ? 'bg-blue-50 dark:bg-blue-900/30 border-2 border-blue-500'
                        : 'hover:bg-gray-50 dark:hover:bg-gray-700 border-2 border-transparent'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <span
                        className="w-3 h-3 rounded-full flex-shrink-0"
                        style={{ backgroundColor: category.color }}
                      />
                      <span className="text-sm font-medium text-gray-900 dark:text-white">
                        {category.name}
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            )}

            {expenseCategories.length > 0 && (
              <div className="mt-3">
                <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1 px-2">
                  EXPENSES
                </p>
                {expenseCategories.map((category) => (
                  <button
                    key={category.id}
                    type="button"
                    onClick={() => setSelectedCategoryId(category.id)}
                    className={`w-full text-left px-3 py-2 rounded-lg transition-colors ${
                      selectedCategoryId === category.id
                        ? 'bg-blue-50 dark:bg-blue-900/30 border-2 border-blue-500'
                        : 'hover:bg-gray-50 dark:hover:bg-gray-700 border-2 border-transparent'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <span
                        className="w-3 h-3 rounded-full flex-shrink-0"
                        style={{ backgroundColor: category.color }}
                      />
                      <span className="text-sm font-medium text-gray-900 dark:text-white">
                        {category.name}
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            )}

            {transferCategories.length > 0 && (
              <div className="mt-3">
                <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1 px-2">
                  TRANSFERS
                </p>
                {transferCategories.map((category) => (
                  <button
                    key={category.id}
                    type="button"
                    onClick={() => setSelectedCategoryId(category.id)}
                    className={`w-full text-left px-3 py-2 rounded-lg transition-colors ${
                      selectedCategoryId === category.id
                        ? 'bg-blue-50 dark:bg-blue-900/30 border-2 border-blue-500'
                        : 'hover:bg-gray-50 dark:hover:bg-gray-700 border-2 border-transparent'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <span
                        className="w-3 h-3 rounded-full flex-shrink-0"
                        style={{ backgroundColor: category.color }}
                      />
                      <span className="text-sm font-medium text-gray-900 dark:text-white">
                        {category.name}
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={applyToAll}
              onChange={(e) => setApplyToAll(e.target.checked)}
              className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
            />
            <span className="text-sm text-gray-700 dark:text-gray-300">
              Apply to all transactions with this description
            </span>
          </label>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 ml-6">
            {applyToAll
              ? 'Will categorize all past and future transactions'
              : 'Will only categorize future transactions (today onwards)'}
          </p>
        </div>

        <div className="flex gap-3">
          <Button
            variant="primary"
            onClick={handleApply}
            disabled={!selectedCategoryId}
            className="flex-1"
          >
            Apply Category
          </Button>
          <Button variant="secondary" onClick={onClose} className="flex-1">
            Cancel
          </Button>
        </div>
      </div>
    </Modal>
  );
}
