import { useState, useMemo } from 'react';
import { TrendingUp, TrendingDown, Plus, Minus, DollarSign } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { SignedCurrencyInput } from '@/components/ui/SignedCurrencyInput';
import { useAccountStore } from '@/store/useAccountStore';
import { useTransactionStore } from '@/store/useTransactionStore';
import { formatCurrency } from '@/utils/currency';
import { addMonths } from 'date-fns';

type ScenarioType = 'income' | 'expense' | 'savings' | 'debt';

interface ScenarioInput {
  type: ScenarioType;
  description: string;
  monthlyAmount: number;
  enabled: boolean;
}

export function Scenarios() {
  const transactions = useTransactionStore((state) => state.transactions);
  const getNetWorth = useAccountStore((state) => state.getNetWorth);
  const getTotalAssets = useAccountStore((state) => state.getTotalAssets);

  const [timeframe, setTimeframe] = useState(12); // months
  const [scenarios, setScenarios] = useState<ScenarioInput[]>([
    { type: 'income', description: 'Side hustle / income change', monthlyAmount: 0, enabled: false },
    { type: 'expense', description: 'New subscription / expense change', monthlyAmount: 0, enabled: false },
    { type: 'savings', description: 'Change 401k contribution', monthlyAmount: 0, enabled: false },
    { type: 'debt', description: 'Change debt payment', monthlyAmount: 0, enabled: false },
  ]);

  // Calculate current monthly averages
  const currentMonthly = useMemo(() => {
    const now = new Date();
    const threeMonthsAgo = addMonths(now, -3);

    const recentTransactions = transactions.filter((txn) => {
      const date = new Date(txn.date);
      return date >= threeMonthsAgo && date <= now;
    });

    const income =
      recentTransactions
        .filter((txn) => txn.amount > 0)
        .reduce((sum, txn) => sum + txn.amount, 0) / 3;

    const expenses =
      recentTransactions
        .filter((txn) => txn.amount < 0)
        .reduce((sum, txn) => sum + Math.abs(txn.amount), 0) / 3;

    return { income, expenses, net: income - expenses };
  }, [transactions]);

  // Calculate scenario impact
  const scenarioImpact = useMemo(() => {
    const enabled = scenarios.filter((s) => s.enabled);

    let incomeChange = 0;
    let expenseChange = 0;
    let savingsChange = 0;
    let debtChange = 0;

    for (const scenario of enabled) {
      switch (scenario.type) {
        case 'income':
          // Positive = income increase, Negative = income decrease
          incomeChange += scenario.monthlyAmount;
          break;
        case 'expense':
          // Positive = expense increase, Negative = expense decrease (savings)
          expenseChange += scenario.monthlyAmount;
          break;
        case 'savings':
          // Positive = increase savings, Negative = decrease savings
          savingsChange += scenario.monthlyAmount;
          break;
        case 'debt':
          // Positive = increase debt payment, Negative = decrease debt payment
          debtChange += scenario.monthlyAmount;
          break;
      }
    }

    const newIncome = currentMonthly.income + incomeChange;
    const newExpenses = currentMonthly.expenses + expenseChange;
    const newNet = newIncome - newExpenses - savingsChange - debtChange;

    // Include baseline growth (current net * timeframe) plus scenario delta
    const baselineGrowth = currentMonthly.net * timeframe;
    const scenarioGrowth = (newNet - currentMonthly.net) * timeframe;
    const projectedChange = baselineGrowth + scenarioGrowth;
    const projectedNetWorth = getNetWorth() + projectedChange;
    const projectedSavings = getTotalAssets() + (savingsChange + debtChange) * timeframe;

    return {
      incomeChange,
      expenseChange,
      savingsChange,
      debtChange,
      newIncome,
      newExpenses,
      newNet,
      projectedChange,
      projectedNetWorth,
      projectedSavings,
    };
  }, [scenarios, currentMonthly, timeframe, getNetWorth, getTotalAssets]);

  const updateScenario = (index: number, updates: Partial<ScenarioInput>) => {
    setScenarios((prev) =>
      prev.map((scenario, i) => (i === index ? { ...scenario, ...updates } : scenario))
    );
  };

  const addScenario = () => {
    setScenarios((prev) => [
      ...prev,
      { type: 'income', description: 'New scenario', monthlyAmount: 0, enabled: false },
    ]);
  };

  const removeScenario = (index: number) => {
    setScenarios((prev) => prev.filter((_, i) => i !== index));
  };

  const renderScenario = (scenario: ScenarioInput, index: number) => {
    const icons = {
      income: TrendingUp,
      expense: Minus,
      savings: DollarSign,
      debt: TrendingDown,
    };

    const colors = {
      income: 'text-green-600 dark:text-green-400',
      expense: 'text-blue-600 dark:text-blue-400',
      savings: 'text-purple-600 dark:text-purple-400',
      debt: 'text-orange-600 dark:text-orange-400',
    };

    const Icon = icons[scenario.type];

    return (
      <div
        key={index}
        className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4"
      >
        <div className="flex items-start gap-3 mb-3">
          <input
            type="checkbox"
            checked={scenario.enabled}
            onChange={(e) => updateScenario(index, { enabled: e.target.checked })}
            className="w-5 h-5 mt-1 text-emerald-600 bg-gray-100 border-gray-300 rounded focus:ring-emerald-500 dark:focus:ring-emerald-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
          />
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <Icon className={`w-4 h-4 ${colors[scenario.type]}`} />
              <select
                value={scenario.type}
                onChange={(e) =>
                  updateScenario(index, { type: e.target.value as ScenarioType })
                }
                className="text-sm px-2 py-1 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              >
                <option value="income">Income Change</option>
                <option value="expense">Expense Change</option>
                <option value="savings">Savings Change</option>
                <option value="debt">Debt Payment Change</option>
              </select>
            </div>

            <input
              type="text"
              value={scenario.description}
              onChange={(e) => updateScenario(index, { description: e.target.value })}
              placeholder="Describe this scenario..."
              className="w-full mb-2 px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            />

            <div className="flex items-center gap-2">
              <div className="flex-1">
                <SignedCurrencyInput
                  value={scenario.monthlyAmount}
                  onChange={(val) => updateScenario(index, { monthlyAmount: val })}
                  className="text-sm"
                  placeholder="0.00"
                />
              </div>
              <span className="text-sm text-gray-600 dark:text-gray-400 whitespace-nowrap">/ month</span>
              <button
                onClick={() => removeScenario(index)}
                className="p-2 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded"
                title="Remove scenario"
              >
                <Minus className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
        <h3 className="font-semibold text-blue-900 dark:text-blue-100 mb-2">
          What-If Analysis
        </h3>
        <p className="text-sm text-blue-800 dark:text-blue-200">
          Model different financial scenarios to see their impact on your net worth and savings.
          Toggle scenarios on/off to compare outcomes.
        </p>
      </div>

      {/* Current Baseline */}
      <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Current Baseline (3-month average)
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Monthly Income</p>
            <p className="text-2xl font-bold text-green-600 dark:text-green-400">
              {formatCurrency(currentMonthly.income)}
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Monthly Expenses</p>
            <p className="text-2xl font-bold text-red-600 dark:text-red-400">
              {formatCurrency(currentMonthly.expenses)}
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Net Monthly</p>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">
              {formatCurrency(currentMonthly.net)}
            </p>
          </div>
        </div>
      </div>

      {/* Scenarios */}
      <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Your Scenarios
          </h3>
          <Button variant="secondary" size="sm" onClick={addScenario}>
            <Plus className="w-4 h-4 mr-2" />
            Add Scenario
          </Button>
        </div>

        <div className="space-y-3 mb-4">{scenarios.map(renderScenario)}</div>

        <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Project over:
          </label>
          <select
            value={timeframe}
            onChange={(e) => setTimeframe(parseInt(e.target.value))}
            className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
          >
            <option value={3}>3 months</option>
            <option value={6}>6 months</option>
            <option value={12}>1 year</option>
            <option value={24}>2 years</option>
            <option value={36}>3 years</option>
            <option value={60}>5 years</option>
          </select>
        </div>
      </div>

      {/* Results */}
      <div className="bg-gradient-to-br from-emerald-50 to-blue-50 dark:from-emerald-900/20 dark:to-blue-900/20 border border-emerald-200 dark:border-emerald-800 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Projected Impact ({timeframe} months)
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <div>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">Monthly Changes</p>
            <div className="space-y-2">
              {scenarioImpact.incomeChange !== 0 && (
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-700 dark:text-gray-300">Income</span>
                  <span className={`text-sm font-semibold ${
                    scenarioImpact.incomeChange > 0
                      ? 'text-green-600 dark:text-green-400'
                      : 'text-red-600 dark:text-red-400'
                  }`}>
                    {scenarioImpact.incomeChange > 0 ? '+' : ''}{formatCurrency(scenarioImpact.incomeChange)}
                  </span>
                </div>
              )}
              {scenarioImpact.expenseChange !== 0 && (
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-700 dark:text-gray-300">Expenses</span>
                  <span className={`text-sm font-semibold ${
                    scenarioImpact.expenseChange > 0
                      ? 'text-red-600 dark:text-red-400'
                      : 'text-green-600 dark:text-green-400'
                  }`}>
                    {scenarioImpact.expenseChange > 0 ? '+' : ''}{formatCurrency(scenarioImpact.expenseChange)}
                  </span>
                </div>
              )}
              {scenarioImpact.savingsChange !== 0 && (
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-700 dark:text-gray-300">Savings</span>
                  <span className={`text-sm font-semibold ${
                    scenarioImpact.savingsChange > 0
                      ? 'text-purple-600 dark:text-purple-400'
                      : 'text-orange-600 dark:text-orange-400'
                  }`}>
                    {scenarioImpact.savingsChange > 0 ? '+' : ''}{formatCurrency(scenarioImpact.savingsChange)}
                  </span>
                </div>
              )}
              {scenarioImpact.debtChange !== 0 && (
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-700 dark:text-gray-300">Debt Payment</span>
                  <span className={`text-sm font-semibold ${
                    scenarioImpact.debtChange > 0
                      ? 'text-orange-600 dark:text-orange-400'
                      : 'text-purple-600 dark:text-purple-400'
                  }`}>
                    {scenarioImpact.debtChange > 0 ? '+' : ''}{formatCurrency(scenarioImpact.debtChange)}
                  </span>
                </div>
              )}
            </div>
          </div>

          <div>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">New Monthly Net</p>
            <div className="bg-white dark:bg-gray-800 rounded-lg p-4">
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-bold text-emerald-600 dark:text-emerald-400">
                  {formatCurrency(scenarioImpact.newNet)}
                </span>
                <span
                  className={`text-sm font-semibold ${
                    scenarioImpact.newNet > currentMonthly.net
                      ? 'text-green-600 dark:text-green-400'
                      : 'text-red-600 dark:text-red-400'
                  }`}
                >
                  ({scenarioImpact.newNet > currentMonthly.net ? '+' : ''}
                  {formatCurrency(scenarioImpact.newNet - currentMonthly.net)})
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-4">
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">
              Projected Net Worth Change
            </p>
            <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
              {scenarioImpact.projectedChange >= 0 ? '+' : ''}
              {formatCurrency(scenarioImpact.projectedChange)}
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              New total: {formatCurrency(scenarioImpact.projectedNetWorth)}
            </p>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg p-4">
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">
              Additional Savings/Debt Reduction
            </p>
            <p className="text-2xl font-bold text-purple-600 dark:text-purple-400">
              {formatCurrency(
                (scenarioImpact.savingsChange + scenarioImpact.debtChange) * timeframe
              )}
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              Over {timeframe} months
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
