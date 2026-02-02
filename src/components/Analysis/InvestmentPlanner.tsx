import { useState, useMemo } from 'react';
import { Info, Target, BarChart3 } from 'lucide-react';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { formatCurrency } from '@/utils/currency';
import { calculateInvestmentProjection } from '@/utils/investmentCalc';
import { runMonteCarloSimulation } from '@/utils/monteCarloSimulation';
import {
  PieChart, Pie, Cell, ResponsiveContainer, Tooltip,
  Area, XAxis, YAxis, CartesianGrid, Legend, Line, ComposedChart,
} from 'recharts';

interface Bucket {
  name: string;
  percentage: number;
  color: string;
  withdrawalOrder: number;
}

const DEFAULT_BUCKETS: Bucket[] = [
  { name: 'Cash & Equivalents', percentage: 10, color: '#10b981', withdrawalOrder: 1 },
  { name: 'Bonds & Fixed Income', percentage: 30, color: '#3b82f6', withdrawalOrder: 2 },
  { name: 'Stocks & Equity', percentage: 50, color: '#8b5cf6', withdrawalOrder: 3 },
  { name: 'Real Estate & Alternatives', percentage: 10, color: '#f59e0b', withdrawalOrder: 4 },
];

const NUM_SIMULATIONS = 500;

export function InvestmentPlanner() {
  const [portfolioValue, setPortfolioValue] = useState(100000);
  const [monthlyContribution, setMonthlyContribution] = useState(500);
  const [annualReturn, setAnnualReturn] = useState(7);
  const [years, setYears] = useState(30);
  const [inflationRate, setInflationRate] = useState(3);
  const [annualVolatility, setAnnualVolatility] = useState(15);
  const [showMonteCarlo, setShowMonteCarlo] = useState(false);
  const [buckets, setBuckets] = useState<Bucket[]>(DEFAULT_BUCKETS);

  // Deterministic projection
  const projection = useMemo(() => {
    const calc = calculateInvestmentProjection(
      portfolioValue, monthlyContribution, annualReturn, years, inflationRate
    );

    const allocations = buckets
      .map((bucket) => ({
        name: bucket.name,
        amount: (calc.futureValue * bucket.percentage) / 100,
        color: bucket.color,
        withdrawalOrder: bucket.withdrawalOrder,
      }))
      .sort((a, b) => a.withdrawalOrder - b.withdrawalOrder);

    return {
      ...calc,
      allocations,
    };
  }, [portfolioValue, monthlyContribution, annualReturn, years, inflationRate, buckets]);

  // Monte Carlo simulation (only computed when toggled on)
  const monteCarloResult = useMemo(() => {
    if (!showMonteCarlo) return null;
    return runMonteCarloSimulation({
      initialValue: portfolioValue,
      monthlyContribution,
      annualReturn,
      annualVolatility,
      inflationRate,
      years,
      numSimulations: NUM_SIMULATIONS,
    });
  }, [showMonteCarlo, portfolioValue, monthlyContribution, annualReturn, annualVolatility, inflationRate, years]);

  // Chart data for Monte Carlo
  const chartData = useMemo(() => {
    if (!monteCarloResult) return [];
    return [
      {
        year: 0,
        p10: portfolioValue,
        p25: portfolioValue,
        p50: portfolioValue,
        p75: portfolioValue,
        p90: portfolioValue,
        contributions: portfolioValue,
      },
      ...monteCarloResult.yearlyData,
    ];
  }, [monteCarloResult, portfolioValue]);

  const updateBucket = (index: number, percentage: number) => {
    setBuckets((prev) =>
      prev.map((bucket, i) => (i === index ? { ...bucket, percentage } : bucket))
    );
  };

  const rebalanceBuckets = () => {
    const equal = 100 / buckets.length;
    setBuckets((prev) => prev.map((bucket) => ({ ...bucket, percentage: equal })));
  };

  const totalAllocation = buckets.reduce((sum, bucket) => sum + bucket.percentage, 0);

  const formatYAxis = (value: number) => {
    if (value >= 1_000_000) return `$${(value / 1_000_000).toFixed(1)}M`;
    if (value >= 1_000) return `$${(value / 1_000).toFixed(0)}K`;
    return `$${value}`;
  };

  return (
    <div className="space-y-6">
      <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
        <div className="flex items-start gap-2">
          <Info className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
          <div className="text-sm text-blue-900 dark:text-blue-100">
            <p className="font-medium mb-1">Investment Planning & Bucket Strategy</p>
            <p className="text-blue-800 dark:text-blue-200">
              Model portfolio growth and organize investments into withdrawal buckets for retirement.
              Bucket strategy helps manage sequence of returns risk.
            </p>
          </div>
        </div>
      </div>

      {/* Inputs */}
      <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Portfolio Parameters
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input
            type="number"
            step="1000"
            min="0"
            label="Current Portfolio Value"
            value={portfolioValue}
            onChange={(e) => setPortfolioValue(parseFloat(e.target.value) || 0)}
          />

          <Input
            type="number"
            step="100"
            min="0"
            label="Monthly Contribution"
            value={monthlyContribution}
            onChange={(e) => setMonthlyContribution(parseFloat(e.target.value) || 0)}
          />

          <Input
            type="number"
            step="0.1"
            min="0"
            max="20"
            label="Expected Annual Return (%)"
            value={annualReturn}
            onChange={(e) => setAnnualReturn(parseFloat(e.target.value) || 0)}
          />

          <Input
            type="number"
            step="1"
            min="1"
            max="50"
            label="Time Horizon (years)"
            value={years}
            onChange={(e) => setYears(parseInt(e.target.value) || 1)}
          />

          <Input
            type="number"
            step="0.1"
            min="0"
            max="10"
            label="Inflation Rate (%)"
            value={inflationRate}
            onChange={(e) => setInflationRate(parseFloat(e.target.value) || 0)}
          />

          {showMonteCarlo && (
            <Input
              type="number"
              step="1"
              min="1"
              max="40"
              label="Annual Volatility (%)"
              value={annualVolatility}
              onChange={(e) => setAnnualVolatility(parseFloat(e.target.value) || 1)}
            />
          )}
        </div>
      </div>

      {/* Projection Results */}
      <div className="bg-gradient-to-br from-emerald-50 to-blue-50 dark:from-emerald-900/20 dark:to-blue-900/20 border border-emerald-200 dark:border-emerald-800 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          {years}-Year Projection
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <Target className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              <p className="text-sm text-gray-600 dark:text-gray-400">Future Value</p>
            </div>
            <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
              {formatCurrency(projection.futureValue)}
            </p>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg p-4">
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">Total Contributions</p>
            <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
              {formatCurrency(projection.totalContributions)}
            </p>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg p-4">
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">Investment Gains</p>
            <p className="text-2xl font-bold text-purple-600 dark:text-purple-400">
              {formatCurrency(projection.investmentGains)}
            </p>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg p-4">
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
              Inflation-Adjusted Value
            </p>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">
              {formatCurrency(projection.realValue)}
            </p>
          </div>
        </div>
      </div>

      {/* Monte Carlo Toggle & Results */}
      <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-purple-600 dark:text-purple-400" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Monte Carlo Simulation
            </h3>
          </div>
          <Button
            variant={showMonteCarlo ? 'primary' : 'secondary'}
            size="sm"
            onClick={() => setShowMonteCarlo(!showMonteCarlo)}
          >
            {showMonteCarlo ? 'Hide Simulation' : 'Run Simulation'}
          </Button>
        </div>

        {!showMonteCarlo && (
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Run {NUM_SIMULATIONS} randomized simulations to see the range of possible outcomes
            based on historical market volatility. Shows probability bands rather than a single
            deterministic projection.
          </p>
        )}

        {showMonteCarlo && monteCarloResult && (
          <div className="space-y-6">
            {/* Probability Stats */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-purple-50 dark:bg-purple-900/20 rounded-lg p-4">
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Median Outcome</p>
                <p className="text-xl font-bold text-purple-600 dark:text-purple-400">
                  {formatCurrency(monteCarloResult.medianFinal)}
                </p>
              </div>
              <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4">
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Mean Outcome</p>
                <p className="text-xl font-bold text-blue-600 dark:text-blue-400">
                  {formatCurrency(monteCarloResult.meanFinal)}
                </p>
              </div>
              <div className="bg-emerald-50 dark:bg-emerald-900/20 rounded-lg p-4">
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">P(Double Contributions)</p>
                <p className="text-xl font-bold text-emerald-600 dark:text-emerald-400">
                  {(monteCarloResult.probabilityOfDoubling * 100).toFixed(1)}%
                </p>
              </div>
              <div className="bg-red-50 dark:bg-red-900/20 rounded-lg p-4">
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">P(Loss vs. Contributions)</p>
                <p className="text-xl font-bold text-red-600 dark:text-red-400">
                  {(monteCarloResult.probabilityOfLoss * 100).toFixed(1)}%
                </p>
              </div>
            </div>

            {/* Chart */}
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">
                {inflationRate > 0 ? 'Inflation-adjusted ' : ''}year-by-year projection with probability bands ({NUM_SIMULATIONS} simulations)
              </p>
              <ResponsiveContainer width="100%" height={400}>
                <ComposedChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis
                    dataKey="year"
                    label={{ value: 'Year', position: 'insideBottom', offset: -5 }}
                    stroke="#9ca3af"
                  />
                  <YAxis
                    tickFormatter={formatYAxis}
                    stroke="#9ca3af"
                    width={70}
                  />
                  <Tooltip
                    formatter={(value: number, name: string) => {
                      const labels: Record<string, string> = {
                        p10: '10th Percentile',
                        p25: '25th Percentile',
                        p50: 'Median',
                        p75: '75th Percentile',
                        p90: '90th Percentile',
                        contributions: 'Total Contributions',
                      };
                      return [formatCurrency(value), labels[name] || name];
                    }}
                    labelFormatter={(label) => `Year ${label}`}
                    contentStyle={{
                      backgroundColor: 'rgba(255,255,255,0.95)',
                      border: '1px solid #e5e7eb',
                      borderRadius: '8px',
                    }}
                  />
                  <Legend
                    formatter={(value) => {
                      const labels: Record<string, string> = {
                        p10: '10th %ile (Pessimistic)',
                        p25: '25th %ile',
                        p50: 'Median (50th)',
                        p75: '75th %ile',
                        p90: '90th %ile (Optimistic)',
                        contributions: 'Contributions',
                      };
                      return labels[value] || value;
                    }}
                  />

                  {/* Outer band: 10th-90th */}
                  <Area
                    type="monotone"
                    dataKey="p90"
                    stroke="none"
                    fill="#c4b5fd"
                    fillOpacity={0.3}
                    name="p90"
                  />
                  <Area
                    type="monotone"
                    dataKey="p10"
                    stroke="none"
                    fill="#ffffff"
                    fillOpacity={1}
                    name="p10"
                  />

                  {/* Inner band: 25th-75th */}
                  <Area
                    type="monotone"
                    dataKey="p75"
                    stroke="none"
                    fill="#a78bfa"
                    fillOpacity={0.3}
                    name="p75"
                  />
                  <Area
                    type="monotone"
                    dataKey="p25"
                    stroke="none"
                    fill="#ffffff"
                    fillOpacity={1}
                    name="p25"
                  />

                  {/* Median line */}
                  <Line
                    type="monotone"
                    dataKey="p50"
                    stroke="#7c3aed"
                    strokeWidth={2}
                    dot={false}
                    name="p50"
                  />

                  {/* Contributions baseline */}
                  <Line
                    type="monotone"
                    dataKey="contributions"
                    stroke="#6b7280"
                    strokeWidth={1.5}
                    strokeDasharray="5 5"
                    dot={false}
                    name="contributions"
                  />
                </ComposedChart>
              </ResponsiveContainer>
            </div>

            {/* Explanation */}
            <div className="bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 rounded-lg p-3">
              <p className="text-sm text-purple-900 dark:text-purple-100">
                <strong>How to read:</strong> The shaded bands show the range of likely outcomes.
                The inner band (25th-75th percentile) covers the most probable 50% of outcomes.
                The outer band (10th-90th) covers 80%. The median line shows the middle outcome.
                {inflationRate > 0 && ' All values shown in today\'s dollars.'}
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Bucket Allocation */}
      <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Withdrawal Bucket Allocation
          </h3>
          <Button variant="secondary" size="sm" onClick={rebalanceBuckets}>
            Equal Split
          </Button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div>
            <div className="space-y-3 mb-4">
              {buckets.map((bucket, index) => (
                <div key={bucket.name} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: bucket.color }}
                      />
                      <span className="text-sm font-medium text-gray-900 dark:text-white">
                        {bucket.name}
                      </span>
                      <span className="text-xs text-gray-500 dark:text-gray-400">
                        (Withdraw {bucket.withdrawalOrder})
                      </span>
                    </div>
                    <span className="text-sm font-semibold text-gray-900 dark:text-white">
                      {bucket.percentage}%
                    </span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={bucket.percentage}
                    onChange={(e) => updateBucket(index, parseFloat(e.target.value))}
                    className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer dark:bg-gray-700"
                    style={{
                      background: `linear-gradient(to right, ${bucket.color} 0%, ${bucket.color} ${bucket.percentage}%, #e5e7eb ${bucket.percentage}%, #e5e7eb 100%)`,
                    }}
                  />
                </div>
              ))}
            </div>

            {totalAllocation !== 100 && (
              <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-3">
                <p className="text-sm text-yellow-800 dark:text-yellow-200">
                  Total allocation: {totalAllocation.toFixed(1)}% (should be 100%)
                </p>
              </div>
            )}
          </div>

          <div>
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={buckets.map((b) => ({ name: b.name, value: b.percentage }))}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, value }) => `${name}: ${value}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {buckets.map((bucket, index) => (
                    <Cell key={`cell-${index}`} fill={bucket.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Bucket Amounts */}
      <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Projected Bucket Values
        </h3>

        <div className="space-y-3">
          {projection.allocations.map((allocation) => (
            <div
              key={allocation.name}
              className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg"
            >
              <div className="flex items-center gap-3">
                <div
                  className="w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-sm"
                  style={{ backgroundColor: allocation.color }}
                >
                  {allocation.withdrawalOrder}
                </div>
                <span className="font-medium text-gray-900 dark:text-white">
                  {allocation.name}
                </span>
              </div>
              <span className="text-lg font-bold text-gray-900 dark:text-white">
                {formatCurrency(allocation.amount)}
              </span>
            </div>
          ))}
        </div>

        <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
          <p className="text-sm text-blue-900 dark:text-blue-100">
            <strong>Bucket Strategy:</strong> Withdraw from buckets in order (1→4) to maintain your
            asset allocation and manage sequence of returns risk. Replenish earlier buckets from
            later buckets during market growth.
          </p>
        </div>
      </div>
    </div>
  );
}
