import { useEffect, useState } from 'react';
import { Toaster } from 'react-hot-toast';
import { initializeDefaultData } from '@/db';
import { Layout } from '@/components/Layout/Layout';
import { WelcomeWizard } from '@/components/Onboarding/WelcomeWizard';
import { useRouter } from '@/hooks/useRouter';
import { useSettingsStore, useCategoryStore, useProfileStore } from '@/store';
import { Dashboard, Accounts, Transactions, Analysis, Settings } from '@/pages';

function App() {
  const { currentRoute } = useRouter();
  const { settings, fetchSettings } = useSettingsStore();
  const { fetchCategories } = useCategoryStore();
  const { fetchProfiles } = useProfileStore();
  const [showWizard, setShowWizard] = useState(false);

  useEffect(() => {
    // Initialize database and fetch initial data
    const initialize = async () => {
      await initializeDefaultData();
      await Promise.all([
        fetchSettings(),
        fetchCategories(),
        fetchProfiles(),
      ]);
    };

    initialize().catch(console.error);
  }, [fetchSettings, fetchCategories, fetchProfiles]);

  useEffect(() => {
    // Show welcome wizard if enabled in settings
    if (settings && settings.showDemoWizard) {
      setShowWizard(true);
    }
  }, [settings]);

  useEffect(() => {
    // Apply dark mode on mount and when settings change
    if (settings?.darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [settings?.darkMode]);

  const renderPage = () => {
    switch (currentRoute) {
      case 'dashboard':
        return <Dashboard />;
      case 'accounts':
        return <Accounts />;
      case 'transactions':
        return <Transactions />;
      case 'analysis':
        return <Analysis />;
      case 'settings':
        return <Settings />;
      default:
        return <Dashboard />;
    }
  };

  return (
    <Layout>
      {renderPage()}
      <Toaster position="top-center" />
      <WelcomeWizard isOpen={showWizard} onClose={() => setShowWizard(false)} />
    </Layout>
  );
}

export default App;
