import { useMemo } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { useTransactionStore } from '@/store/useTransactionStore';
import { useCategoryStore } from '@/store/useCategoryStore';
import { formatCurrency } from '@/utils/currency';
import { startOfMonth, endOfMonth } from 'date-fns';

export function SpendingByCategory() {
  const transactions = useTransactionStore((state) => state.transactions);
  const categories = useCategoryStore((state) => state.categories);

  const chartData = useMemo(() => {
    const now = new Date();
    const start = startOfMonth(now).toISOString();
    const end = endOfMonth(now).toISOString();

    // Filter to current month expenses only
    const expenses = transactions.filter((txn) => {
      const date = new Date(txn.date);
      const category = categories.find((cat) => cat.id === txn.categoryId);
      return (
        category?.type === 'expense' &&
        date >= new Date(start) &&
        date <= new Date(end)
      );
    });

    // Group by category
    const categoryTotals = expenses.reduce((acc, txn) => {
      const categoryId = txn.categoryId || 'uncategorized';
      acc[categoryId] = (acc[categoryId] || 0) + Math.abs(txn.amount);
      return acc;
    }, {} as Record<string, number>);

    // Convert to array and sort by amount
    const data = Object.entries(categoryTotals)
      .map(([categoryId, amount]) => {
        const category = categories.find((c) => c.id === categoryId);
        return {
          name: category?.name || 'Uncategorized',
          value: amount,
          color: category?.color || '#9ca3af',
        };
      })
      .sort((a, b) => b.value - a.value);

    return data;
  }, [transactions, categories]);

  const total = chartData.reduce((sum, item) => sum + item.value, 0);

  if (chartData.length === 0) {
    return (
      <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Spending by Category
        </h3>
        <p className="text-gray-600 dark:text-gray-400 text-center py-8">
          No expenses this month
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
          Spending by Category
        </h3>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Total: <span className="font-semibold text-gray-900 dark:text-white">{formatCurrency(total)}</span>
        </p>
      </div>

      <ResponsiveContainer width="100%" height={300}>
        <PieChart>
          <Pie
            data={chartData}
            cx="50%"
            cy="50%"
            labelLine={false}
            label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
            outerRadius={80}
            fill="#8884d8"
            dataKey="value"
          >
            {chartData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.color} />
            ))}
          </Pie>
          <Tooltip
            formatter={(value: number) => formatCurrency(value)}
            contentStyle={{
              backgroundColor: 'rgba(255, 255, 255, 0.95)',
              border: '1px solid #e5e7eb',
              borderRadius: '0.5rem',
            }}
          />
        </PieChart>
      </ResponsiveContainer>

      <div className="mt-4 space-y-2">
        {chartData.slice(0, 5).map((item) => (
          <div key={item.name} className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-2">
              <div
                className="w-3 h-3 rounded-full"
                style={{ backgroundColor: item.color }}
              />
              <span className="text-gray-700 dark:text-gray-300">{item.name}</span>
            </div>
            <span className="font-medium text-gray-900 dark:text-white">
              {formatCurrency(item.value)}
            </span>
          </div>
        ))}
        {chartData.length > 5 && (
          <p className="text-xs text-gray-500 dark:text-gray-400 text-center pt-2">
            +{chartData.length - 5} more categories
          </p>
        )}
      </div>
    </div>
  );
}
