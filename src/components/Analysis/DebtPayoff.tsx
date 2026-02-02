import { useState, useMemo } from 'react';
import { TrendingDown, Calendar, DollarSign, Info } from 'lucide-react';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { useAccountStore } from '@/store/useAccountStore';
import { compareStrategies } from '@/utils/debtPayoff';
import { formatCurrency } from '@/utils/currency';
import type { DebtPayoffResult } from '@/utils/debtPayoff';

export function DebtPayoff() {
  const liabilities = useAccountStore((state) => state.getLiabilityAccounts());
  const [extraPayment, setExtraPayment] = useState(0);
  const [showAvalanche, setShowAvalanche] = useState(true);
  const [showSnowball, setShowSnowball] = useState(true);

  const debtsWithDetails = useMemo(() => {
    return liabilities.filter(
      (debt) =>
        debt.interestRate !== undefined &&
        debt.interestRate > 0 &&
        debt.minimumPayment !== undefined &&
        debt.minimumPayment > 0
    );
  }, [liabilities]);

  const comparison = useMemo(() => {
    if (debtsWithDetails.length === 0) return null;
    return compareStrategies(debtsWithDetails, extraPayment);
  }, [debtsWithDetails, extraPayment]);

  if (debtsWithDetails.length === 0) {
    return (
      <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-12 text-center">
        <TrendingDown className="w-12 h-12 mx-auto mb-4 text-gray-400" />
        <p className="text-gray-600 dark:text-gray-400 mb-2">
          No debts with interest rates and minimum payments found
        </p>
        <p className="text-sm text-gray-500 dark:text-gray-500">
          Add liability accounts with interest rate and minimum payment to use the debt payoff calculator
        </p>
      </div>
    );
  }

  const renderStrategy = (result: DebtPayoffResult, name: string, color: string) => (
    <div className="bg-white dark:bg-gray-800 border-2 rounded-lg overflow-hidden" style={{ borderColor: color }}>
      <div className="p-4" style={{ backgroundColor: `${color}15` }}>
        <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">
          {name} Method
        </h3>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          {result.strategy === 'avalanche'
            ? 'Pay off highest interest rate first'
            : 'Pay off smallest balance first'}
        </p>
      </div>

      <div className="p-4 space-y-4">
        <div className="grid grid-cols-3 gap-4">
          <div>
            <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 mb-1">
              <Calendar className="w-4 h-4" />
              Payoff Time
            </div>
            <p className="text-xl font-bold text-gray-900 dark:text-white">
              {Math.ceil(result.totalMonths / 12)}y {result.totalMonths % 12}m
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-500">
              {result.totalMonths} months
            </p>
          </div>

          <div>
            <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 mb-1">
              <DollarSign className="w-4 h-4" />
              Total Interest
            </div>
            <p className="text-xl font-bold text-gray-900 dark:text-white">
              {formatCurrency(result.totalInterest)}
            </p>
          </div>

          <div>
            <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 mb-1">
              <DollarSign className="w-4 h-4" />
              Total Paid
            </div>
            <p className="text-xl font-bold text-gray-900 dark:text-white">
              {formatCurrency(result.totalPaid)}
            </p>
          </div>
        </div>

        <div>
          <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
            Payoff Order
          </h4>
          <div className="space-y-2">
            {result.debts.map((debt, index) => {
              const account = debtsWithDetails.find((d) => d.id === debt.accountId);
              return (
                <div
                  key={debt.accountId}
                  className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    <span className="flex items-center justify-center w-6 h-6 rounded-full text-xs font-bold text-white" style={{ backgroundColor: color }}>
                      {index + 1}
                    </span>
                    <div>
                      <p className="font-medium text-gray-900 dark:text-white">
                        {debt.accountName}
                      </p>
                      <p className="text-xs text-gray-600 dark:text-gray-400">
                        {account?.interestRate?.toFixed(2)}% APR •{' '}
                        {formatCurrency(Math.abs(account?.balance || 0))} balance
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium text-gray-900 dark:text-white">
                      {new Date(debt.payoffDate).toLocaleDateString('en-US', {
                        month: 'short',
                        year: 'numeric',
                      })}
                    </p>
                    <p className="text-xs text-gray-600 dark:text-gray-400">
                      {formatCurrency(debt.totalInterest)} interest
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex items-start gap-2 bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
        <Info className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
        <div className="text-sm text-blue-900 dark:text-blue-100">
          <p className="font-medium mb-1">Compare Debt Payoff Strategies</p>
          <p className="text-blue-800 dark:text-blue-200">
            The <strong>Avalanche</strong> method saves more money by tackling high-interest debt first.
            The <strong>Snowball</strong> method builds momentum by paying off small balances first.
          </p>
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Extra Monthly Payment
        </h3>
        <div className="flex items-end gap-4">
          <div className="flex-1">
            <Input
              type="number"
              step="0.01"
              min="0"
              value={extraPayment}
              onChange={(e) => setExtraPayment(parseFloat(e.target.value) || 0)}
              placeholder="0.00"
              label="Additional amount to put toward debt each month"
            />
          </div>
          <Button
            variant="secondary"
            onClick={() => setExtraPayment(0)}
            disabled={extraPayment === 0}
          >
            Reset
          </Button>
        </div>

        {comparison && (
          <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
            <div>
              <p className="text-sm text-green-800 dark:text-green-300 mb-1">
                Avalanche saves you
              </p>
              <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                {formatCurrency(comparison.interestSavings)}
              </p>
              <p className="text-xs text-green-700 dark:text-green-400">
                in interest vs Snowball
              </p>
            </div>
            <div>
              <p className="text-sm text-green-800 dark:text-green-300 mb-1">
                Avalanche is faster by
              </p>
              <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                {comparison.timeSavings} months
              </p>
              <p className="text-xs text-green-700 dark:text-green-400">
                vs Snowball method
              </p>
            </div>
          </div>
        )}
      </div>

      <div className="flex gap-3">
        <Button
          variant={showAvalanche ? 'primary' : 'secondary'}
          onClick={() => setShowAvalanche(!showAvalanche)}
        >
          {showAvalanche ? 'Hide' : 'Show'} Avalanche
        </Button>
        <Button
          variant={showSnowball ? 'primary' : 'secondary'}
          onClick={() => setShowSnowball(!showSnowball)}
        >
          {showSnowball ? 'Hide' : 'Show'} Snowball
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {showAvalanche && comparison && renderStrategy(comparison.avalanche, 'Avalanche', '#ef4444')}
        {showSnowball && comparison && renderStrategy(comparison.snowball, 'Snowball', '#3b82f6')}
      </div>
    </div>
  );
}
