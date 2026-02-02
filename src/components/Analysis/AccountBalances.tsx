import { useMemo } from 'react';
import { TrendingUp, TrendingDown, Wallet, CreditCard, PiggyBank } from 'lucide-react';
import { useAccountStore } from '@/store/useAccountStore';
import { formatCurrency } from '@/utils/currency';

interface AccountGroup {
  type: string;
  accounts: Array<{
    id: string;
    name: string;
    balance: number;
    institution?: string;
    percentage: number;
  }>;
  total: number;
  icon: JSX.Element;
  color: string;
}

export function AccountBalances() {
  const accounts = useAccountStore((state) => state.accounts);
  const getTotalAssets = useAccountStore((state) => state.getTotalAssets);
  const getTotalLiabilities = useAccountStore((state) => state.getTotalLiabilities);
  const getNetWorth = useAccountStore((state) => state.getNetWorth);

  const totalAssets = getTotalAssets();
  const totalLiabilities = getTotalLiabilities();
  const netWorth = getNetWorth();

  // Group accounts by type
  const accountGroups = useMemo((): AccountGroup[] => {
    const groups: AccountGroup[] = [];

    // Asset accounts grouped by type
    const checkingAccounts = accounts.filter(acc => acc.category === 'asset' && acc.type === 'checking');
    const savingsAccounts = accounts.filter(acc => acc.category === 'asset' && acc.type === 'savings');
    const investmentAccounts = accounts.filter(acc => acc.category === 'asset' && acc.type === 'investment');
    const otherAssetAccounts = accounts.filter(acc =>
      acc.category === 'asset' && !['checking', 'savings', 'investment'].includes(acc.type)
    );

    // Liability accounts grouped by type
    const creditCardAccounts = accounts.filter(acc => acc.category === 'liability' && acc.type === 'credit_card');
    const loanAccounts = accounts.filter(acc =>
      acc.category === 'liability' && ['loan', 'mortgage'].includes(acc.type)
    );
    const otherLiabilityAccounts = accounts.filter(acc =>
      acc.category === 'liability' && !['credit_card', 'loan', 'mortgage'].includes(acc.type)
    );

    // Helper to create group
    const createGroup = (
      type: string,
      accountList: typeof accounts,
      icon: JSX.Element,
      color: string
    ): AccountGroup | null => {
      if (accountList.length === 0) return null;

      const total = accountList.reduce((sum, acc) => sum + Math.abs(acc.balance), 0);
      const referenceTotal = accountList[0].category === 'asset' ? totalAssets : totalLiabilities;

      return {
        type,
        accounts: accountList.map(acc => ({
          id: acc.id,
          name: acc.name,
          balance: acc.balance,
          institution: acc.institution,
          percentage: referenceTotal > 0 ? (Math.abs(acc.balance) / referenceTotal) * 100 : 0,
        })),
        total,
        icon,
        color,
      };
    };

    // Add asset groups
    const checking = createGroup('Checking Accounts', checkingAccounts, <Wallet className="w-5 h-5" />, 'emerald');
    const savings = createGroup('Savings Accounts', savingsAccounts, <PiggyBank className="w-5 h-5" />, 'blue');
    const investments = createGroup('Investment Accounts', investmentAccounts, <TrendingUp className="w-5 h-5" />, 'purple');
    const otherAssets = createGroup('Other Assets', otherAssetAccounts, <Wallet className="w-5 h-5" />, 'gray');

    if (checking) groups.push(checking);
    if (savings) groups.push(savings);
    if (investments) groups.push(investments);
    if (otherAssets) groups.push(otherAssets);

    // Add liability groups
    const creditCards = createGroup('Credit Cards', creditCardAccounts, <CreditCard className="w-5 h-5" />, 'red');
    const loans = createGroup('Loans & Mortgages', loanAccounts, <TrendingDown className="w-5 h-5" />, 'orange');
    const otherLiabilities = createGroup('Other Liabilities', otherLiabilityAccounts, <CreditCard className="w-5 h-5" />, 'gray');

    if (creditCards) groups.push(creditCards);
    if (loans) groups.push(loans);
    if (otherLiabilities) groups.push(otherLiabilities);

    return groups;
  }, [accounts, totalAssets, totalLiabilities]);

  const getColorClasses = (color: string) => {
    const colors: Record<string, { bg: string; text: string; border: string; bar: string }> = {
      emerald: {
        bg: 'bg-emerald-50 dark:bg-emerald-900/20',
        text: 'text-emerald-700 dark:text-emerald-400',
        border: 'border-emerald-200 dark:border-emerald-800',
        bar: 'bg-emerald-500',
      },
      blue: {
        bg: 'bg-blue-50 dark:bg-blue-900/20',
        text: 'text-blue-700 dark:text-blue-400',
        border: 'border-blue-200 dark:border-blue-800',
        bar: 'bg-blue-500',
      },
      purple: {
        bg: 'bg-purple-50 dark:bg-purple-900/20',
        text: 'text-purple-700 dark:text-purple-400',
        border: 'border-purple-200 dark:border-purple-800',
        bar: 'bg-purple-500',
      },
      red: {
        bg: 'bg-red-50 dark:bg-red-900/20',
        text: 'text-red-700 dark:text-red-400',
        border: 'border-red-200 dark:border-red-800',
        bar: 'bg-red-500',
      },
      orange: {
        bg: 'bg-orange-50 dark:bg-orange-900/20',
        text: 'text-orange-700 dark:text-orange-400',
        border: 'border-orange-200 dark:border-orange-800',
        bar: 'bg-orange-500',
      },
      gray: {
        bg: 'bg-gray-50 dark:bg-gray-900/20',
        text: 'text-gray-700 dark:text-gray-400',
        border: 'border-gray-200 dark:border-gray-700',
        bar: 'bg-gray-500',
      },
    };
    return colors[color] || colors.gray;
  };

  if (accounts.length === 0) {
    return (
      <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-12 text-center">
        <Wallet className="w-12 h-12 text-gray-400 mx-auto mb-4" />
        <p className="text-gray-600 dark:text-gray-400 mb-4">
          No accounts yet
        </p>
        <p className="text-sm text-gray-500 dark:text-gray-500">
          Add accounts to see your balance sheet and bucket allocations
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Info Card */}
      <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
        <h3 className="font-semibold text-blue-900 dark:text-blue-100 mb-2">
          Account Balances & Bucket Allocation
        </h3>
        <p className="text-sm text-blue-800 dark:text-blue-200">
          See where your money is sitting across all accounts (buckets). Perfect for envelope budgeting -
          track how much is allocated to each category while the Cash Flow tab shows how money moves from income to expenses.
        </p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-emerald-100 dark:bg-emerald-900/30 rounded-lg">
              <TrendingUp className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400">Total Assets</p>
          </div>
          <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
            {formatCurrency(totalAssets)}
          </p>
        </div>

        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-red-100 dark:bg-red-900/30 rounded-lg">
              <TrendingDown className="w-5 h-5 text-red-600 dark:text-red-400" />
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400">Total Liabilities</p>
          </div>
          <p className="text-2xl font-bold text-red-600 dark:text-red-400">
            {formatCurrency(totalLiabilities)}
          </p>
        </div>

        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
              <Wallet className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400">Net Worth</p>
          </div>
          <p className={`text-2xl font-bold ${
            netWorth >= 0
              ? 'text-blue-600 dark:text-blue-400'
              : 'text-red-600 dark:text-red-400'
          }`}>
            {formatCurrency(netWorth)}
          </p>
        </div>
      </div>

      {/* Account Groups */}
      <div className="space-y-4">
        {accountGroups.map((group) => {
          const colors = getColorClasses(group.color);

          return (
            <div
              key={group.type}
              className={`border rounded-lg p-6 ${colors.bg} ${colors.border}`}
            >
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className={colors.text}>
                    {group.icon}
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 dark:text-white">
                      {group.type}
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {group.accounts.length} account{group.accounts.length !== 1 ? 's' : ''}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className={`text-xl font-bold ${colors.text}`}>
                    {formatCurrency(group.total)}
                  </p>
                </div>
              </div>

              <div className="space-y-3">
                {group.accounts.map((account) => (
                  <div
                    key={account.id}
                    className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex-1">
                        <h4 className="font-medium text-gray-900 dark:text-white">
                          {account.name}
                        </h4>
                        {account.institution && (
                          <p className="text-xs text-gray-500 dark:text-gray-400">
                            {account.institution}
                          </p>
                        )}
                      </div>
                      <div className="text-right ml-4">
                        <p className="font-semibold text-gray-900 dark:text-white">
                          {formatCurrency(Math.abs(account.balance))}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          {account.percentage.toFixed(1)}%
                        </p>
                      </div>
                    </div>

                    {/* Progress bar */}
                    <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                      <div
                        className={`h-2 rounded-full ${colors.bar}`}
                        style={{ width: `${Math.min(account.percentage, 100)}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {/* Envelope Budgeting Tip */}
      <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-4">
        <h4 className="font-semibold text-amber-900 dark:text-amber-100 mb-2">
          💡 Envelope Budgeting Tip
        </h4>
        <p className="text-sm text-amber-800 dark:text-amber-200">
          Create separate accounts for each "envelope" or "bucket" (e.g., "Daycare Fund", "Emergency Fund", "Vacation Fund").
          This view shows you exactly how much is in each bucket at any time. When you move money between buckets,
          use the "Transfer" category so it doesn't show up as income or expenses in your Cash Flow analysis.
        </p>
      </div>
    </div>
  );
}
