import { useEffect, useState } from 'react';
import { Plus } from 'lucide-react';
import { useAccountStore } from '@/store';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { AccountCard } from '@/components/Accounts/AccountCard';
import { AccountForm } from '@/components/Accounts/AccountForm';
import toast from 'react-hot-toast';
import type { Account } from '@/types';

export function Accounts() {
  const {
    accounts,
    fetchAccounts,
    addAccount,
    updateAccount,
    deleteAccount,
    getTotalAssets,
    getTotalLiabilities,
    getNetWorth,
  } = useAccountStore();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingAccount, setEditingAccount] = useState<Account | undefined>();

  useEffect(() => {
    fetchAccounts();
  }, [fetchAccounts]);

  const assetAccounts = accounts.filter((acc) => acc.category === 'asset');
  const liabilityAccounts = accounts.filter((acc) => acc.category === 'liability');

  const handleSubmit = async (data: Omit<Account, 'id' | 'createdAt' | 'updatedAt'>) => {
    try {
      if (editingAccount) {
        await updateAccount(editingAccount.id, data);
        toast.success('Account updated successfully');
      } else {
        await addAccount(data);
        toast.success('Account created successfully');
      }
      setIsModalOpen(false);
      setEditingAccount(undefined);
    } catch (error) {
      toast.error('Failed to save account');
    }
  };

  const handleEdit = (account: Account) => {
    setEditingAccount(account);
    setIsModalOpen(true);
  };

  const handleDelete = async (account: Account) => {
    if (window.confirm(`Are you sure you want to delete ${account.name}?`)) {
      try {
        await deleteAccount(account.id);
        toast.success('Account deleted');
      } catch (error) {
        toast.error('Failed to delete account');
      }
    }
  };

  const handleAddNew = () => {
    setEditingAccount(undefined);
    setIsModalOpen(true);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  return (
    <div className="p-4 max-w-screen-xl mx-auto pb-24">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
          Accounts
        </h2>
        <Button onClick={handleAddNew} size="sm">
          <Plus className="w-4 h-4 mr-1" />
          Add Account
        </Button>
      </div>

      {/* Net Worth Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-lg p-4 text-white">
          <p className="text-sm opacity-90">Total Assets</p>
          <p className="text-2xl font-bold">{formatCurrency(getTotalAssets())}</p>
        </div>
        <div className="bg-gradient-to-br from-red-500 to-red-600 rounded-lg p-4 text-white">
          <p className="text-sm opacity-90">Total Liabilities</p>
          <p className="text-2xl font-bold">{formatCurrency(getTotalLiabilities())}</p>
        </div>
        <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg p-4 text-white">
          <p className="text-sm opacity-90">Net Worth</p>
          <p className="text-2xl font-bold">{formatCurrency(getNetWorth())}</p>
        </div>
      </div>

      {/* Asset Accounts */}
      <div className="mb-8">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
          Assets ({assetAccounts.length})
        </h3>
        {assetAccounts.length === 0 ? (
          <p className="text-gray-600 dark:text-gray-400">No asset accounts yet</p>
        ) : (
          <div className="space-y-3">
            {assetAccounts.map((account) => (
              <AccountCard
                key={account.id}
                account={account}
                onEdit={() => handleEdit(account)}
                onDelete={() => handleDelete(account)}
              />
            ))}
          </div>
        )}
      </div>

      {/* Liability Accounts */}
      <div>
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
          Liabilities ({liabilityAccounts.length})
        </h3>
        {liabilityAccounts.length === 0 ? (
          <p className="text-gray-600 dark:text-gray-400">No liability accounts yet</p>
        ) : (
          <div className="space-y-3">
            {liabilityAccounts.map((account) => (
              <AccountCard
                key={account.id}
                account={account}
                onEdit={() => handleEdit(account)}
                onDelete={() => handleDelete(account)}
              />
            ))}
          </div>
        )}
      </div>

      {/* Account Form Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditingAccount(undefined);
        }}
        title={editingAccount ? 'Edit Account' : 'Add Account'}
      >
        <AccountForm
          account={editingAccount}
          onSubmit={handleSubmit}
          onCancel={() => {
            setIsModalOpen(false);
            setEditingAccount(undefined);
          }}
        />
      </Modal>
    </div>
  );
}
