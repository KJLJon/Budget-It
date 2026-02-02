import { useState } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { TrendingUp, AlertCircle, Info, DollarSign } from 'lucide-react';
import { Input } from '@/components/ui/Input';
import { CurrencyInput } from '@/components/ui/CurrencyInput';
import { Button } from '@/components/ui/Button';
import { formatCurrency } from '@/utils/currency';
import { calculatePortfolioAllocation, type PortfolioInputs } from '@/utils/portfolioAllocation';

const COLORS = {
  stocks: '#10b981',
  bonds: '#3b82f6',
  cash: '#f59e0b',
  usStocks: '#059669',
  intlStocks: '#34d399',
};

export function PortfolioMix() {
  const [inputs, setInputs] = useState<PortfolioInputs>({
    birthdate: '',
    firstWithdrawalDate: '',
    annualWithdrawal: 40000,
    portfolioAmount: 500000,
  });

  const [showRecommendation, setShowRecommendation] = useState(false);

  const handleCalculate = () => {
    setShowRecommendation(true);
  };

  const recommendation = showRecommendation
    ? calculatePortfolioAllocation(inputs)
    : null;

  // Prepare chart data
  const chartData = recommendation
    ? recommendation.allocations.map(alloc => ({
        name: alloc.assetClass,
        value: alloc.percentage,
        amount: alloc.amount,
      }))
    : [];

  const getColor = (name: string) => {
    if (name.includes('US')) return COLORS.usStocks;
    if (name.includes('International')) return COLORS.intlStocks;
    if (name.includes('Bond')) return COLORS.bonds;
    if (name.includes('Cash')) return COLORS.cash;
    return COLORS.stocks;
  };

  const totalExpenseRatio = recommendation
    ? recommendation.etfRecommendations
        .filter(etf => etf.ticker !== 'CASH')
        .reduce((sum, etf) => sum + (etf.expenseRatio * etf.percentage) / 100, 0)
    : 0;

  return (
    <div className="space-y-6">
      {/* Info Card */}
      <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
        <h3 className="font-semibold text-blue-900 dark:text-blue-100 mb-2 flex items-center gap-2">
          <TrendingUp className="w-5 h-5" />
          Portfolio Mix Recommendation
        </h3>
        <p className="text-sm text-blue-800 dark:text-blue-200">
          Get personalized asset allocation recommendations based on your age, retirement timeline, and withdrawal needs.
          Uses modern portfolio theory and the 4% safe withdrawal rate as guidelines.
        </p>
      </div>

      {/* Input Form */}
      <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Your Information
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Birthdate
            </label>
            <Input
              type="date"
              value={inputs.birthdate}
              onChange={(e) => setInputs({ ...inputs, birthdate: e.target.value })}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              First Withdrawal Date
            </label>
            <Input
              type="date"
              value={inputs.firstWithdrawalDate}
              onChange={(e) => setInputs({ ...inputs, firstWithdrawalDate: e.target.value })}
            />
          </div>

          <CurrencyInput
            label="Annual Withdrawal Amount"
            value={inputs.annualWithdrawal}
            onChange={(val) => setInputs({ ...inputs, annualWithdrawal: val })}
          />

          <CurrencyInput
            label="Current Portfolio Amount"
            value={inputs.portfolioAmount}
            onChange={(val) => setInputs({ ...inputs, portfolioAmount: val })}
          />
        </div>

        <Button
          variant="primary"
          onClick={handleCalculate}
          className="mt-4 w-full md:w-auto"
        >
          Calculate Recommendation
        </Button>
      </div>

      {/* Recommendation Results */}
      {recommendation && (
        <>
          {/* Risk Level & Withdrawal Rate */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4">
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Risk Level</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {recommendation.riskLevel}
              </p>
            </div>

            <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4">
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Withdrawal Rate</p>
              <p className={`text-2xl font-bold ${
                recommendation.isSustainable
                  ? 'text-green-600 dark:text-green-400'
                  : 'text-red-600 dark:text-red-400'
              }`}>
                {recommendation.withdrawalRate.toFixed(2)}%
              </p>
              {!recommendation.isSustainable && (
                <p className="text-xs text-red-600 dark:text-red-400 mt-1">
                  Above 4.5% safe rate
                </p>
              )}
            </div>

            <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4">
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Weighted Expense Ratio</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {totalExpenseRatio.toFixed(3)}%
              </p>
            </div>
          </div>

          {/* Asset Allocation Chart */}
          <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Recommended Asset Allocation
            </h3>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={chartData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, value }) => `${name}: ${value.toFixed(0)}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                      className="[&_text]:fill-gray-700 [&_text]:dark:fill-gray-300"
                    >
                      {chartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={getColor(entry.name)} />
                      ))}
                    </Pie>
                    <Tooltip
                      formatter={(value: number, name: string, props: any) => [
                        `${value.toFixed(1)}% (${formatCurrency(props.payload.amount)})`,
                        name
                      ]}
                      contentStyle={{
                        backgroundColor: 'rgb(255 255 255 / 0.95)',
                        border: '1px solid rgb(229 231 235)',
                        borderRadius: '0.5rem',
                      }}
                      wrapperClassName="[&_.recharts-tooltip-wrapper]:dark:text-gray-900"
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>

              <div className="space-y-3">
                {recommendation.allocations.map((alloc) => (
                  <div key={alloc.assetClass} className="border-l-4 pl-3" style={{ borderColor: getColor(alloc.assetClass) }}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-medium text-gray-900 dark:text-white">
                        {alloc.assetClass}
                      </span>
                      <span className="text-sm font-semibold text-gray-900 dark:text-white">
                        {alloc.percentage.toFixed(0)}%
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                      {alloc.description}
                    </p>
                    <p className="text-sm font-medium text-gray-900 dark:text-white">
                      {formatCurrency(alloc.amount)}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* ETF Recommendations */}
          <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Specific ETF Recommendations
            </h3>

            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200 dark:border-gray-700">
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-700 dark:text-gray-300">
                      Ticker
                    </th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-700 dark:text-gray-300">
                      Fund Name
                    </th>
                    <th className="text-right py-3 px-4 text-sm font-medium text-gray-700 dark:text-gray-300">
                      Allocation
                    </th>
                    <th className="text-right py-3 px-4 text-sm font-medium text-gray-700 dark:text-gray-300">
                      Target Amount
                    </th>
                    <th className="text-right py-3 px-4 text-sm font-medium text-gray-700 dark:text-gray-300">
                      Expense Ratio
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {recommendation.etfRecommendations.map((etf) => (
                    <tr
                      key={etf.ticker}
                      className="border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-750"
                    >
                      <td className="py-3 px-4">
                        <span className="font-mono font-semibold text-blue-600 dark:text-blue-400">
                          {etf.ticker}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <div>
                          <p className="text-sm font-medium text-gray-900 dark:text-white">
                            {etf.name}
                          </p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">
                            {etf.provider}
                          </p>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-right font-medium text-gray-900 dark:text-white">
                        {etf.percentage.toFixed(1)}%
                      </td>
                      <td className="py-3 px-4 text-right font-medium text-gray-900 dark:text-white">
                        {formatCurrency(etf.amount)}
                      </td>
                      <td className="py-3 px-4 text-right text-sm text-gray-600 dark:text-gray-400">
                        {etf.expenseRatio > 0 ? `${etf.expenseRatio.toFixed(2)}%` : 'N/A'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Rationale */}
          <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <Info className="w-5 h-5" />
              Why This Allocation?
            </h3>

            <div className="space-y-2">
              {recommendation.rationale.map((reason, index) => (
                <div key={index} className="flex gap-3">
                  <div className={`mt-1 ${reason.includes('⚠️') ? 'text-amber-500' : 'text-blue-500'}`}>
                    {reason.includes('⚠️') ? <AlertCircle className="w-4 h-4" /> : <DollarSign className="w-4 h-4" />}
                  </div>
                  <p className="text-sm text-gray-700 dark:text-gray-300">
                    {reason.replace('⚠️', '')}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Rebalancing Guidance */}
          <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-4">
            <h4 className="font-semibold text-amber-900 dark:text-amber-100 mb-2">
              Rebalancing Guidance
            </h4>
            <ul className="text-sm text-amber-800 dark:text-amber-200 space-y-1 list-disc list-inside">
              <li>Review your portfolio allocation at least annually</li>
              <li>Rebalance when any asset class drifts more than 5% from target</li>
              <li>Consider tax implications - rebalance in tax-advantaged accounts when possible</li>
              <li>Use new contributions to rebalance rather than selling when possible</li>
              <li>Adjust allocation as you age and as your retirement date approaches</li>
            </ul>
          </div>

          {/* Disclaimer */}
          <div className="bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg p-4">
            <p className="text-xs text-gray-600 dark:text-gray-400">
              <strong>Disclaimer:</strong> This tool provides general educational guidance only and is not personalized financial advice.
              Asset allocation recommendations are based on common rules of thumb and may not be suitable for your specific situation.
              Past performance does not guarantee future results. Consider consulting with a qualified financial advisor before making
              investment decisions. The 4% withdrawal rate is a guideline and may not be appropriate for all retirement scenarios.
            </p>
          </div>
        </>
      )}
    </div>
  );
}
