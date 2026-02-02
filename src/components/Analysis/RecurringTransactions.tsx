import { useMemo, useState } from 'react';
import { Repeat, TrendingUp, TrendingDown, Calendar, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { useTransactionStore } from '@/store/useTransactionStore';
import { detectRecurringTransactions, projectFutureTransactions } from '@/utils/recurringDetection';
import { formatCurrency } from '@/utils/currency';
import type { RecurringPattern } from '@/utils/recurringDetection';

export function RecurringTransactions() {
  const transactions = useTransactionStore((state) => state.transactions);
  const [showProjections, setShowProjections] = useState(false);
  const [monthsAhead, setMonthsAhead] = useState(3);

  const patterns = useMemo(() => {
    return detectRecurringTransactions(transactions);
  }, [transactions]);

  const projectedTransactions = useMemo(() => {
    if (!showProjections) return [];
    return projectFutureTransactions(patterns, monthsAhead);
  }, [patterns, showProjections, monthsAhead]);

  const projectedCashFlow = useMemo(() => {
    const income = projectedTransactions
      .filter((txn) => txn.amount > 0)
      .reduce((sum, txn) => sum + txn.amount, 0);

    const expenses = projectedTransactions
      .filter((txn) => txn.amount < 0)
      .reduce((sum, txn) => sum + Math.abs(txn.amount), 0);

    return { income, expenses, net: income - expenses };
  }, [projectedTransactions]);

  if (patterns.length === 0) {
    return (
      <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-12 text-center">
        <Repeat className="w-12 h-12 mx-auto mb-4 text-gray-400" />
        <p className="text-gray-600 dark:text-gray-400 mb-2">
          No recurring transactions detected
        </p>
        <p className="text-sm text-gray-500 dark:text-gray-500">
          Add more transactions to detect recurring patterns
        </p>
      </div>
    );
  }

  const frequencyLabels = {
    weekly: 'Weekly',
    biweekly: 'Bi-weekly',
    monthly: 'Monthly',
    quarterly: 'Quarterly',
    yearly: 'Yearly',
  };

  const renderPattern = (pattern: RecurringPattern) => {
    const isIncome = pattern.averageAmount > 0;

    return (
      <div
        key={pattern.description}
        className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4"
      >
        <div className="flex items-start justify-between mb-3">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <Repeat className="w-4 h-4 text-gray-600 dark:text-gray-400" />
              <h4 className="font-semibold text-gray-900 dark:text-white">
                {pattern.description}
              </h4>
              <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-200">
                {frequencyLabels[pattern.frequency]}
              </span>
            </div>
            <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400">
              <span className="flex items-center gap-1">
                <Calendar className="w-3 h-3" />
                Next: {new Date(pattern.nextOccurrence).toLocaleDateString()}
              </span>
              <span className="flex items-center gap-1">
                <CheckCircle className="w-3 h-3" />
                {Math.round(pattern.confidence * 100)}% confidence
              </span>
            </div>
          </div>
          <div className="text-right">
            <div
              className={`text-xl font-bold ${
                isIncome
                  ? 'text-green-600 dark:text-green-400'
                  : 'text-red-600 dark:text-red-400'
              }`}
            >
              {isIncome ? '+' : '-'}
              {formatCurrency(Math.abs(pattern.averageAmount))}
            </div>
            <div className="text-xs text-gray-500 dark:text-gray-400">
              {pattern.transactions.length} occurrences
            </div>
          </div>
        </div>

        <div className="h-1 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
          <div
            className="h-full bg-blue-500"
            style={{ width: `${pattern.confidence * 100}%` }}
          />
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Detected Patterns
          </h3>
          <span className="text-sm text-gray-600 dark:text-gray-400">
            {patterns.length} recurring transactions found
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {patterns.map(renderPattern)}
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Cash Flow Projection
        </h3>

        <div className="flex items-center gap-4 mb-4">
          <div className="flex items-center gap-2">
            <label className="text-sm text-gray-700 dark:text-gray-300">
              Project ahead:
            </label>
            <select
              value={monthsAhead}
              onChange={(e) => setMonthsAhead(parseInt(e.target.value))}
              className="px-3 py-1 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
            >
              <option value={1}>1 month</option>
              <option value={3}>3 months</option>
              <option value={6}>6 months</option>
              <option value={12}>12 months</option>
            </select>
          </div>
          <Button
            variant={showProjections ? 'primary' : 'secondary'}
            size="sm"
            onClick={() => setShowProjections(!showProjections)}
          >
            {showProjections ? 'Hide' : 'Show'} Projections
          </Button>
        </div>

        {showProjections && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
            <div className="flex items-center gap-3">
              <TrendingUp className="w-8 h-8 text-green-600 dark:text-green-400" />
              <div>
                <p className="text-xs text-gray-600 dark:text-gray-400">Projected Income</p>
                <p className="text-xl font-bold text-green-600 dark:text-green-400">
                  {formatCurrency(projectedCashFlow.income)}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <TrendingDown className="w-8 h-8 text-red-600 dark:text-red-400" />
              <div>
                <p className="text-xs text-gray-600 dark:text-gray-400">Projected Expenses</p>
                <p className="text-xl font-bold text-red-600 dark:text-red-400">
                  {formatCurrency(projectedCashFlow.expenses)}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
                <span className="text-gray-700 dark:text-gray-300 font-bold text-sm">=</span>
              </div>
              <div>
                <p className="text-xs text-gray-600 dark:text-gray-400">Projected Net</p>
                <p
                  className={`text-xl font-bold ${
                    projectedCashFlow.net >= 0
                      ? 'text-green-600 dark:text-green-400'
                      : 'text-red-600 dark:text-red-400'
                  }`}
                >
                  {formatCurrency(projectedCashFlow.net)}
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
