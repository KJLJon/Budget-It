import { useState } from 'react';
import { Wallet, TrendingUp, Shield, Download, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { useAccountStore } from '@/store/useAccountStore';
import { useTransactionStore } from '@/store/useTransactionStore';
import { useCategoryStore } from '@/store/useCategoryStore';
import { useSettingsStore } from '@/store/useSettingsStore';
import { generateDemoAccounts, generateDemoTransactions, enableDemoMode } from '@/utils/demoData';

interface WelcomeWizardProps {
  isOpen: boolean;
  onClose: () => void;
}

export function WelcomeWizard({ isOpen, onClose }: WelcomeWizardProps) {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);

  const addAccount = useAccountStore((state) => state.addAccount);
  const addTransaction = useTransactionStore((state) => state.addTransaction);
  const categories = useCategoryStore((state) => state.categories);
  const updateSettings = useSettingsStore((state) => state.updateSettings);

  const handleLoadDemo = async () => {
    setLoading(true);
    try {
      // Generate demo accounts
      const demoAccounts = generateDemoAccounts();
      const accountIds: string[] = [];

      for (const account of demoAccounts) {
        const id = crypto.randomUUID();
        await addAccount({ ...account, id } as any);
        accountIds.push(id);
      }

      // Get category IDs
      const incomeCategories = categories.filter((c) => c.type === 'income').map((c) => c.id);
      const expenseCategories = categories.filter((c) => c.type === 'expense').map((c) => c.id);

      // Generate demo transactions
      const demoTransactions = generateDemoTransactions(accountIds, {
        income: incomeCategories,
        expense: expenseCategories,
      });

      for (const txn of demoTransactions) {
        await addTransaction(txn);
      }

      // Mark demo mode and wizard as complete
      enableDemoMode();
      await updateSettings({ showDemoWizard: false });

      onClose();
    } catch (error) {
      console.error('Error loading demo data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSkip = async () => {
    await updateSettings({ showDemoWizard: false });
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={handleSkip} title="Welcome to Budget It!">
      <div className="space-y-6">
        {step === 1 && (
          <>
            <div className="text-center">
              <div className="w-16 h-16 bg-emerald-100 dark:bg-emerald-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                <Wallet className="w-8 h-8 text-emerald-600 dark:text-emerald-400" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                Your Privacy-First Finance Tracker
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                Take control of your finances with a completely private, offline-first app.
              </p>
            </div>

            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <Shield className="w-5 h-5 text-emerald-600 dark:text-emerald-400 flex-shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-semibold text-gray-900 dark:text-white text-sm">
                    100% Private
                  </h4>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    All data stored locally in your browser. No accounts, no servers, no tracking.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <TrendingUp className="w-5 h-5 text-emerald-600 dark:text-emerald-400 flex-shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-semibold text-gray-900 dark:text-white text-sm">
                    Powerful Analytics
                  </h4>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Track accounts, categorize transactions, optimize debt, and plan investments.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <Download className="w-5 h-5 text-emerald-600 dark:text-emerald-400 flex-shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-semibold text-gray-900 dark:text-white text-sm">
                    Your Data, Your Control
                  </h4>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Export anytime as JSON. Import bank CSVs. Complete data portability.
                  </p>
                </div>
              </div>
            </div>

            <div className="flex gap-3">
              <Button variant="secondary" onClick={handleSkip} className="flex-1">
                Start Fresh
              </Button>
              <Button variant="primary" onClick={() => setStep(2)} className="flex-1">
                Continue
              </Button>
            </div>
          </>
        )}

        {step === 2 && (
          <>
            <div className="text-center">
              <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                <Sparkles className="w-8 h-8 text-blue-600 dark:text-blue-400" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                Try the Demo
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                Explore the app with sample data to see all features in action.
              </p>
            </div>

            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
              <h4 className="font-semibold text-blue-900 dark:text-blue-100 mb-2">
                Demo includes:
              </h4>
              <ul className="text-sm text-blue-800 dark:text-blue-200 space-y-1">
                <li>• 6 sample accounts (checking, savings, investments, loans)</li>
                <li>• 60+ realistic transactions over 3 months</li>
                <li>• Pre-categorized transactions with patterns</li>
                <li>• Charts and analytics ready to explore</li>
                <li>• Recurring transaction detection examples</li>
              </ul>
            </div>

            <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
              <p className="text-sm text-gray-700 dark:text-gray-300">
                <strong>Note:</strong> You can clear demo data anytime from Settings → Data Management.
                All demo data is stored only on your device.
              </p>
            </div>

            <div className="flex gap-3">
              <Button variant="secondary" onClick={handleSkip} className="flex-1">
                Skip Demo
              </Button>
              <Button
                variant="primary"
                onClick={handleLoadDemo}
                disabled={loading}
                className="flex-1"
              >
                {loading ? 'Loading Demo...' : 'Load Demo Data'}
              </Button>
            </div>
          </>
        )}
      </div>
    </Modal>
  );
}
