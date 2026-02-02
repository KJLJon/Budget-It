import { useEffect } from 'react';
import { useAccountStore, useTransactionStore, useCategoryStore } from '@/store';
import { NetWorthCard } from '@/components/Dashboard/NetWorthCard';
import { MonthlySnapshot } from '@/components/Dashboard/MonthlySnapshot';
import { RecentTransactions } from '@/components/Dashboard/RecentTransactions';
import { SpendingByCategory } from '@/components/Dashboard/SpendingByCategory';
import { IncomeVsExpenses } from '@/components/Dashboard/IncomeVsExpenses';

export function Dashboard() {
  const { fetchAccounts } = useAccountStore();
  const { fetchTransactions } = useTransactionStore();
  const { fetchCategories } = useCategoryStore();

  useEffect(() => {
    fetchAccounts();
    fetchTransactions();
    fetchCategories();
  }, [fetchAccounts, fetchTransactions, fetchCategories]);

  return (
    <div className="p-4 max-w-screen-xl mx-auto pb-24">
      <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
        Dashboard
      </h2>

      <div className="space-y-6">
        <NetWorthCard />
        <MonthlySnapshot />

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <SpendingByCategory />
          <IncomeVsExpenses />
        </div>

        <RecentTransactions />
      </div>
    </div>
  );
}
