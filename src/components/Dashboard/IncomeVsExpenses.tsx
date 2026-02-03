import { useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { useTransactionStore } from '@/store/useTransactionStore';
import { useCategoryStore } from '@/store/useCategoryStore';
import { ChartTooltip } from '@/components/ui/ChartTooltip';
import { formatCurrency } from '@/utils/currency';
import { startOfMonth, endOfMonth, subMonths, format } from 'date-fns';

interface IncomeVsExpensesProps {
  monthsToShow: number;
}

export function IncomeVsExpenses({ monthsToShow }: IncomeVsExpensesProps) {
  const transactions = useTransactionStore((state) => state.transactions);
  const { categories } = useCategoryStore();

  const chartData = useMemo(() => {
    const months = [];
    const now = new Date();

    // Get last N months
    for (let i = monthsToShow - 1; i >= 0; i--) {
      const date = subMonths(now, i);
      const start = startOfMonth(date);
      const end = endOfMonth(date);

      const monthTransactions = transactions.filter((txn) => {
        const txnDate = new Date(txn.date);
        return txnDate >= start && txnDate <= end;
      });

      const income = monthTransactions
        .filter((txn) => {
          const category = categories.find((cat) => cat.id === txn.categoryId);
          return category?.type === 'income';
        })
        .reduce((sum, txn) => sum + Math.abs(txn.amount), 0);

      const expenses = monthTransactions
        .filter((txn) => {
          const category = categories.find((cat) => cat.id === txn.categoryId);
          return category?.type === 'expense';
        })
        .reduce((sum, txn) => sum + Math.abs(txn.amount), 0);

      months.push({
        month: format(date, 'MMM'),
        income,
        expenses,
        net: income - expenses,
      });
    }

    return months;
  }, [transactions, categories, monthsToShow]);

  const hasData = chartData.some((month) => month.income > 0 || month.expenses > 0);

  if (!hasData) {
    return (
      <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Income vs Expenses
        </h3>
        <p className="text-gray-600 dark:text-gray-400 text-center py-8">
          No transaction data available
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6">
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
        Income vs Expenses (Last {monthsToShow} Months)
      </h3>

      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" className="stroke-gray-200 dark:stroke-gray-700" />
          <XAxis
            dataKey="month"
            className="text-xs"
            tick={{ fill: 'currentColor', className: 'fill-gray-600 dark:fill-gray-400' }}
            stroke="currentColor"
          />
          <YAxis
            className="text-xs"
            tick={{ fill: 'currentColor', className: 'fill-gray-600 dark:fill-gray-400' }}
            stroke="currentColor"
            tickFormatter={(value) => `$${(value / 1000).toFixed(0)}k`}
          />
          <Tooltip
            content={(props) => (
              <ChartTooltip
                {...props}
                formatter={(value: number) => [formatCurrency(value), '']}
              />
            )}
          />
          <Legend />
          <Bar dataKey="income" fill="#10b981" name="Income" radius={[4, 4, 0, 0]} />
          <Bar dataKey="expenses" fill="#ef4444" name="Expenses" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>

      <div className="mt-4 grid grid-cols-3 gap-4 text-center">
        <div>
          <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">Avg Income</p>
          <p className="text-sm font-semibold text-green-600 dark:text-green-400">
            {formatCurrency(
              chartData.reduce((sum, m) => sum + m.income, 0) / chartData.length
            )}
          </p>
        </div>
        <div>
          <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">Avg Expenses</p>
          <p className="text-sm font-semibold text-red-600 dark:text-red-400">
            {formatCurrency(
              chartData.reduce((sum, m) => sum + m.expenses, 0) / chartData.length
            )}
          </p>
        </div>
        <div>
          <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">Avg Net</p>
          <p className="text-sm font-semibold text-gray-900 dark:text-white">
            {formatCurrency(
              chartData.reduce((sum, m) => sum + m.net, 0) / chartData.length
            )}
          </p>
        </div>
      </div>
    </div>
  );
}
