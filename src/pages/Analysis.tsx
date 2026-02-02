import { useState } from 'react';
import { TrendingDown, TrendingUp, DollarSign, GitBranch, Repeat, PieChart } from 'lucide-react';
import { DebtPayoff } from '@/components/Analysis/DebtPayoff';
import { RecurringTransactions } from '@/components/Analysis/RecurringTransactions';
import { Scenarios } from '@/components/Analysis/Scenarios';
import { InvestmentPlanner } from '@/components/Analysis/InvestmentPlanner';
import { CashFlowSankey } from '@/components/Analysis/CashFlowSankey';
import { PortfolioMix } from '@/components/Analysis/PortfolioMix';

type AnalysisTab = 'cashflow' | 'debt' | 'recurring' | 'investments' | 'portfolio-mix' | 'scenarios';

export function Analysis() {
  const [activeTab, setActiveTab] = useState<AnalysisTab>('debt');

  return (
    <div className="p-4 max-w-screen-xl mx-auto pb-24">
      <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
        Financial Analysis
      </h2>

      {/* Tabs */}
      <div className="flex gap-2 mb-6 border-b border-gray-200 dark:border-gray-700 overflow-x-auto">
        <button
          onClick={() => setActiveTab('cashflow')}
          className={`flex items-center gap-2 px-4 py-3 font-medium transition-colors whitespace-nowrap ${
            activeTab === 'cashflow'
              ? 'text-blue-600 dark:text-blue-400 border-b-2 border-blue-600 dark:border-blue-400'
              : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
          }`}
        >
          <TrendingUp className="w-4 h-4" />
          Cash Flow
        </button>
        <button
          onClick={() => setActiveTab('debt')}
          className={`flex items-center gap-2 px-4 py-3 font-medium transition-colors whitespace-nowrap ${
            activeTab === 'debt'
              ? 'text-blue-600 dark:text-blue-400 border-b-2 border-blue-600 dark:border-blue-400'
              : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
          }`}
        >
          <TrendingDown className="w-4 h-4" />
          Debt Payoff
        </button>
        <button
          onClick={() => setActiveTab('recurring')}
          className={`flex items-center gap-2 px-4 py-3 font-medium transition-colors whitespace-nowrap ${
            activeTab === 'recurring'
              ? 'text-blue-600 dark:text-blue-400 border-b-2 border-blue-600 dark:border-blue-400'
              : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
          }`}
        >
          <Repeat className="w-4 h-4" />
          Recurring
        </button>
        <button
          onClick={() => setActiveTab('investments')}
          className={`flex items-center gap-2 px-4 py-3 font-medium transition-colors whitespace-nowrap ${
            activeTab === 'investments'
              ? 'text-blue-600 dark:text-blue-400 border-b-2 border-blue-600 dark:border-blue-400'
              : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
          }`}
        >
          <DollarSign className="w-4 h-4" />
          Investments
        </button>
        <button
          onClick={() => setActiveTab('portfolio-mix')}
          className={`flex items-center gap-2 px-4 py-3 font-medium transition-colors whitespace-nowrap ${
            activeTab === 'portfolio-mix'
              ? 'text-blue-600 dark:text-blue-400 border-b-2 border-blue-600 dark:border-blue-400'
              : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
          }`}
        >
          <PieChart className="w-4 h-4" />
          Portfolio Mix
        </button>
        <button
          onClick={() => setActiveTab('scenarios')}
          className={`flex items-center gap-2 px-4 py-3 font-medium transition-colors whitespace-nowrap ${
            activeTab === 'scenarios'
              ? 'text-blue-600 dark:text-blue-400 border-b-2 border-blue-600 dark:border-blue-400'
              : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
          }`}
        >
          <GitBranch className="w-4 h-4" />
          Scenarios
        </button>
      </div>

      {/* Tab Content */}
      {activeTab === 'cashflow' && <CashFlowSankey />}

      {activeTab === 'debt' && <DebtPayoff />}

      {activeTab === 'recurring' && <RecurringTransactions />}

      {activeTab === 'investments' && <InvestmentPlanner />}

      {activeTab === 'portfolio-mix' && <PortfolioMix />}

      {activeTab === 'scenarios' && <Scenarios />}
    </div>
  );
}
