import { TrendingUp, TrendingDown } from 'lucide-react';
import { useAccountStore } from '@/store';
import { formatCurrency } from '@/utils/currency';

export function NetWorthCard() {
  const { getTotalAssets, getTotalLiabilities, getNetWorth } = useAccountStore();

  const assets = getTotalAssets();
  const liabilities = getTotalLiabilities();
  const netWorth = getNetWorth();

  return (
    <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg p-6 text-white">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold opacity-90">Net Worth</h3>
        {netWorth >= 0 ? (
          <TrendingUp className="w-6 h-6" />
        ) : (
          <TrendingDown className="w-6 h-6" />
        )}
      </div>
      <p className="text-3xl font-bold mb-4">{formatCurrency(netWorth)}</p>
      <div className="grid grid-cols-2 gap-4 pt-4 border-t border-blue-400">
        <div>
          <p className="text-sm opacity-75">Assets</p>
          <p className="text-lg font-semibold">{formatCurrency(assets)}</p>
        </div>
        <div>
          <p className="text-sm opacity-75">Liabilities</p>
          <p className="text-lg font-semibold">{formatCurrency(liabilities)}</p>
        </div>
      </div>
    </div>
  );
}
