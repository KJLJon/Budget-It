import { useState } from 'react';
import { Database, Tag } from 'lucide-react';
import { DataManagement } from '@/components/Settings/DataManagement';
import { CategoryManagement } from '@/components/Settings/CategoryManagement';

type SettingsTab = 'categories' | 'data';

export function Settings() {
  const [activeTab, setActiveTab] = useState<SettingsTab>('categories');

  return (
    <div className="p-4 max-w-screen-xl mx-auto pb-24">
      <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
        Settings
      </h2>

      {/* Tabs */}
      <div className="flex gap-2 mb-6 border-b border-gray-200 dark:border-gray-700">
        <button
          onClick={() => setActiveTab('categories')}
          className={`flex items-center gap-2 px-4 py-3 font-medium transition-colors ${
            activeTab === 'categories'
              ? 'text-blue-600 dark:text-blue-400 border-b-2 border-blue-600 dark:border-blue-400'
              : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
          }`}
        >
          <Tag className="w-4 h-4" />
          Categories
        </button>
        <button
          onClick={() => setActiveTab('data')}
          className={`flex items-center gap-2 px-4 py-3 font-medium transition-colors ${
            activeTab === 'data'
              ? 'text-blue-600 dark:text-blue-400 border-b-2 border-blue-600 dark:border-blue-400'
              : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
          }`}
        >
          <Database className="w-4 h-4" />
          Data Management
        </button>
      </div>

      {/* Tab Content */}
      {activeTab === 'categories' && <CategoryManagement />}
      {activeTab === 'data' && <DataManagement />}
    </div>
  );
}
