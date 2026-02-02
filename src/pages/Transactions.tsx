import { useState, useEffect, useMemo } from 'react';
import { Plus, Search, Filter, Upload } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Select } from '@/components/ui/Select';
import { Modal } from '@/components/ui/Modal';
import { TransactionForm } from '@/components/Transactions/TransactionForm';
import { TransactionRow } from '@/components/Transactions/TransactionRow';
import { CSVImport } from '@/components/Transactions/CSVImport';
import { useTransactionStore } from '@/store/useTransactionStore';
import { useAccountStore } from '@/store/useAccountStore';
import { useCategoryStore } from '@/store/useCategoryStore';
import { useDebounce } from '@/hooks/useDebounce';
import { formatCurrency } from '@/utils/currency';
import type { Transaction } from '@/types';

export function Transactions() {
  const transactions = useTransactionStore((state) => state.transactions);
  const fetchTransactions = useTransactionStore((state) => state.fetchTransactions);
  const addTransaction = useTransactionStore((state) => state.addTransaction);
  const updateTransaction = useTransactionStore((state) => state.updateTransaction);
  const deleteTransaction = useTransactionStore((state) => state.deleteTransaction);

  const accounts = useAccountStore((state) => state.accounts);
  const categories = useCategoryStore((state) => state.categories);

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isImportOpen, setIsImportOpen] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);

  const [searchQuery, setSearchQuery] = useState('');
  const [filterAccount, setFilterAccount] = useState('');
  const [filterCategory, setFilterCategory] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'income' | 'expense'>('all');

  // Debounce search query to improve performance
  const debouncedSearchQuery = useDebounce(searchQuery, 300);

  useEffect(() => {
    fetchTransactions();
  }, [fetchTransactions]);

  const filteredTransactions = useMemo(() => {
    return transactions.filter((txn) => {
      // Search filter (using debounced value)
      if (debouncedSearchQuery && !txn.description.toLowerCase().includes(debouncedSearchQuery.toLowerCase())) {
        return false;
      }

      // Account filter
      if (filterAccount && txn.accountId !== filterAccount) {
        return false;
      }

      // Category filter
      if (filterCategory) {
        if (filterCategory === 'uncategorized' && txn.categoryId) {
          return false;
        } else if (filterCategory !== 'uncategorized' && txn.categoryId !== filterCategory) {
          return false;
        }
      }

      // Type filter
      if (filterType === 'income' && txn.amount <= 0) {
        return false;
      }
      if (filterType === 'expense' && txn.amount >= 0) {
        return false;
      }

      return true;
    });
  }, [transactions, debouncedSearchQuery, filterAccount, filterCategory, filterType]);

  const handleAddTransaction = async (data: Omit<Transaction, 'id' | 'createdAt' | 'updatedAt'>) => {
    await addTransaction(data);
    setIsFormOpen(false);
  };

  const handleEditTransaction = async (data: Omit<Transaction, 'id' | 'createdAt' | 'updatedAt'>) => {
    if (editingTransaction) {
      await updateTransaction(editingTransaction.id, data);
      setEditingTransaction(null);
    }
  };

  const handleDeleteTransaction = async (id: string) => {
    if (confirm('Are you sure you want to delete this transaction?')) {
      await deleteTransaction(id);
    }
  };

  const totalIncome = filteredTransactions
    .filter((txn) => {
      const category = categories.find((cat) => cat.id === txn.categoryId);
      return category?.type === 'income';
    })
    .reduce((sum, txn) => sum + Math.abs(txn.amount), 0);

  const totalExpenses = filteredTransactions
    .filter((txn) => {
      const category = categories.find((cat) => cat.id === txn.categoryId);
      return category?.type === 'expense';
    })
    .reduce((sum, txn) => sum + Math.abs(txn.amount), 0);

  const clearFilters = () => {
    setSearchQuery('');
    setFilterAccount('');
    setFilterCategory('');
    setFilterType('all');
  };

  const hasActiveFilters = searchQuery || filterAccount || filterCategory || filterType !== 'all';

  return (
    <div className="p-4 max-w-screen-xl mx-auto pb-24">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
          Transactions
        </h2>
        <div className="flex gap-2">
          <Button
            variant="secondary"
            onClick={() => setIsImportOpen(true)}
            className="flex items-center gap-2"
          >
            <Upload className="w-4 h-4" />
            Import CSV
          </Button>
          <Button
            variant="primary"
            onClick={() => setIsFormOpen(true)}
            className="flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Add
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4">
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Total Transactions</p>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">
            {filteredTransactions.length}
          </p>
        </div>
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4">
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Total Income</p>
          <p className="text-2xl font-bold text-green-600 dark:text-green-400">
            {formatCurrency(totalIncome)}
          </p>
        </div>
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4">
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Total Expenses</p>
          <p className="text-2xl font-bold text-red-600 dark:text-red-400">
            {formatCurrency(totalExpenses)}
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4 mb-6">
        <div className="flex items-center gap-2 mb-4">
          <Filter className="w-4 h-4 text-gray-600 dark:text-gray-400" />
          <h3 className="font-medium text-gray-900 dark:text-white">Filters</h3>
          {hasActiveFilters && (
            <Button
              variant="ghost"
              size="sm"
              onClick={clearFilters}
              className="ml-auto text-blue-600 dark:text-blue-400"
            >
              Clear all
            </Button>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search description..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent"
            />
          </div>

          <Select
            value={filterAccount}
            onChange={(e) => setFilterAccount(e.target.value)}
          >
            <option value="">All Accounts</option>
            {accounts.map((account) => (
              <option key={account.id} value={account.id}>
                {account.name}
              </option>
            ))}
          </Select>

          <Select
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
          >
            <option value="">All Categories</option>
            <option value="uncategorized">Uncategorized</option>
            {categories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </Select>

          <Select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value as 'all' | 'income' | 'expense')}
          >
            <option value="all">All Types</option>
            <option value="income">Income Only</option>
            <option value="expense">Expenses Only</option>
          </Select>
        </div>
      </div>

      {/* Transactions List */}
      {filteredTransactions.length === 0 ? (
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-12 text-center">
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            {hasActiveFilters
              ? 'No transactions match your filters'
              : 'No transactions yet'}
          </p>
          {!hasActiveFilters && (
            <Button variant="primary" onClick={() => setIsFormOpen(true)}>
              Add Your First Transaction
            </Button>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {filteredTransactions.map((transaction) => (
            <TransactionRow
              key={transaction.id}
              transaction={transaction}
              onEdit={setEditingTransaction}
              onDelete={handleDeleteTransaction}
            />
          ))}
        </div>
      )}

      {/* Add/Edit Transaction Modal */}
      {(isFormOpen || editingTransaction) && (
        <Modal
          isOpen={true}
          onClose={() => {
            setIsFormOpen(false);
            setEditingTransaction(null);
          }}
          title={editingTransaction ? 'Edit Transaction' : 'Add Transaction'}
        >
          <TransactionForm
            transaction={editingTransaction || undefined}
            onSubmit={editingTransaction ? handleEditTransaction : handleAddTransaction}
            onCancel={() => {
              setIsFormOpen(false);
              setEditingTransaction(null);
            }}
          />
        </Modal>
      )}

      {/* CSV Import Modal */}
      {isImportOpen && (
        <CSVImport onClose={() => setIsImportOpen(false)} />
      )}
    </div>
  );
}
