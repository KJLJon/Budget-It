import { useEffect, useState } from 'react';
import { useAccountStore, useTransactionStore, useCategoryStore } from '@/store';
import { NetWorthCard } from '@/components/Dashboard/NetWorthCard';
import { MonthlySnapshot } from '@/components/Dashboard/MonthlySnapshot';
import { RecentTransactions } from '@/components/Dashboard/RecentTransactions';
import { SpendingByCategory } from '@/components/Dashboard/SpendingByCategory';
import { IncomeVsExpenses } from '@/components/Dashboard/IncomeVsExpenses';
import { Select } from '@/components/ui/Select';
import { startOfMonth, endOfMonth, subMonths, format } from 'date-fns';

type DateRangeType = 'current' | 'last-month' | 'last-3-months' | 'last-6-months' | 'last-12-months' | 'custom';

export function Dashboard() {
  const { fetchAccounts } = useAccountStore();
  const { fetchTransactions } = useTransactionStore();
  const { fetchCategories } = useCategoryStore();

  const [rangeType, setRangeType] = useState<DateRangeType>('current');
  const [customStart, setCustomStart] = useState('');
  const [customEnd, setCustomEnd] = useState('');

  useEffect(() => {
    fetchAccounts();
    fetchTransactions();
    fetchCategories();
  }, [fetchAccounts, fetchTransactions, fetchCategories]);

  // Calculate date range based on selection
  const getDateRange = (): { start: Date; end: Date } => {
    const now = new Date();

    switch (rangeType) {
      case 'current':
        return { start: startOfMonth(now), end: endOfMonth(now) };
      case 'last-month':
        const lastMonth = subMonths(now, 1);
        return { start: startOfMonth(lastMonth), end: endOfMonth(lastMonth) };
      case 'last-3-months':
        return { start: startOfMonth(subMonths(now, 2)), end: endOfMonth(now) };
      case 'last-6-months':
        return { start: startOfMonth(subMonths(now, 5)), end: endOfMonth(now) };
      case 'last-12-months':
        return { start: startOfMonth(subMonths(now, 11)), end: endOfMonth(now) };
      case 'custom':
        if (customStart && customEnd) {
          return { start: new Date(customStart), end: new Date(customEnd) };
        }
        return { start: startOfMonth(now), end: endOfMonth(now) };
      default:
        return { start: startOfMonth(now), end: endOfMonth(now) };
    }
  };

  const dateRange = getDateRange();
  const rangeLabel = rangeType === 'current' ? 'This Month' :
                     rangeType === 'last-month' ? 'Last Month' :
                     rangeType === 'last-3-months' ? 'Last 3 Months' :
                     rangeType === 'last-6-months' ? 'Last 6 Months' :
                     rangeType === 'last-12-months' ? 'Last 12 Months' :
                     `${format(dateRange.start, 'MMM d, yyyy')} - ${format(dateRange.end, 'MMM d, yyyy')}`;

  return (
    <div className="p-4 max-w-screen-xl mx-auto pb-24">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
          Dashboard
        </h2>
      </div>

      {/* Date Range Filter */}
      <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Time Period
            </label>
            <Select
              value={rangeType}
              onChange={(e) => setRangeType(e.target.value as DateRangeType)}
            >
              <option value="current">Current Month</option>
              <option value="last-month">Last Month</option>
              <option value="last-3-months">Last 3 Months</option>
              <option value="last-6-months">Last 6 Months</option>
              <option value="last-12-months">Last 12 Months</option>
              <option value="custom">Custom Range</option>
            </Select>
          </div>

          {rangeType === 'custom' && (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Start Date
                </label>
                <input
                  type="date"
                  value={customStart}
                  onChange={(e) => setCustomStart(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  End Date
                </label>
                <input
                  type="date"
                  value={customEnd}
                  onChange={(e) => setCustomEnd(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
              </div>
            </>
          )}
        </div>
      </div>

      <div className="space-y-6">
        <NetWorthCard />
        <MonthlySnapshot startDate={dateRange.start} endDate={dateRange.end} label={rangeLabel} />

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <SpendingByCategory startDate={dateRange.start} endDate={dateRange.end} label={rangeLabel} />
          <IncomeVsExpenses monthsToShow={rangeType === 'last-12-months' ? 12 : 6} />
        </div>

        <RecentTransactions />
      </div>
    </div>
  );
}
