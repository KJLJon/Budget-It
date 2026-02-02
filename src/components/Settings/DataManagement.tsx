import { useState } from 'react';
import { Download, Upload, Trash2, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';
import {
  exportAllData,
  importData,
  clearAllData,
  downloadFile,
  validateImportData,
} from '@/utils/dataManagement';
import { initializeDefaultData } from '@/db';
import toast from 'react-hot-toast';

export function DataManagement() {
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [clearConfirmText, setClearConfirmText] = useState('');
  const [showImportModal, setShowImportModal] = useState(false);
  const [importMode, setImportMode] = useState<'replace' | 'merge'>('replace');

  const handleExport = async () => {
    try {
      const data = await exportAllData();
      const filename = `budget-it-export-${new Date().toISOString().split('T')[0]}.json`;
      downloadFile(data, filename);
      toast.success('Data exported successfully');
    } catch (error) {
      toast.error('Failed to export data');
      console.error(error);
    }
  };

  const handleImportFile = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      const text = await file.text();
      const validation = validateImportData(text);

      if (!validation.valid) {
        toast.error(validation.error || 'Invalid file');
        return;
      }

      await importData(text, importMode);
      toast.success('Data imported successfully');
      setShowImportModal(false);

      // Reload page to refresh all data
      window.location.reload();
    } catch (error) {
      toast.error('Failed to import data');
      console.error(error);
    }

    // Reset file input
    event.target.value = '';
  };

  const handleClearAll = async () => {
    if (clearConfirmText !== 'DELETE') {
      toast.error('Please type DELETE to confirm');
      return;
    }

    try {
      await clearAllData();
      await initializeDefaultData();
      toast.success('All data cleared');
      setShowClearConfirm(false);
      setClearConfirmText('');

      // Reload page to refresh
      window.location.reload();
    } catch (error) {
      toast.error('Failed to clear data');
      console.error(error);
    }
  };

  return (
    <div className="space-y-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Export Data
        </h3>
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
          Download all your data as a JSON file. This includes accounts, transactions, categories, and settings.
        </p>
        <Button onClick={handleExport} variant="secondary">
          <Download className="w-4 h-4 mr-2" />
          Export All Data
        </Button>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Import Data
        </h3>
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
          Import data from a previously exported JSON file.
        </p>
        <Button onClick={() => setShowImportModal(true)} variant="secondary">
          <Upload className="w-4 h-4 mr-2" />
          Import Data
        </Button>
      </div>

      <div className="bg-red-50 dark:bg-red-900/20 rounded-lg p-6 border border-red-200 dark:border-red-800">
        <div className="flex items-start gap-3 mb-4">
          <AlertTriangle className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
          <div>
            <h3 className="text-lg font-semibold text-red-900 dark:text-red-100 mb-2">
              Danger Zone
            </h3>
            <p className="text-sm text-red-800 dark:text-red-200 mb-4">
              This will permanently delete all your data. This action cannot be undone.
            </p>
          </div>
        </div>
        <Button onClick={() => setShowClearConfirm(true)} variant="danger">
          <Trash2 className="w-4 h-4 mr-2" />
          Clear All Data
        </Button>
      </div>

      {/* Import Modal */}
      <Modal
        isOpen={showImportModal}
        onClose={() => setShowImportModal(false)}
        title="Import Data"
      >
        <div className="space-y-4">
          <div>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
              Choose how to import your data:
            </p>
            <div className="space-y-2">
              <label className="flex items-center">
                <input
                  type="radio"
                  name="importMode"
                  value="replace"
                  checked={importMode === 'replace'}
                  onChange={(e) => setImportMode(e.target.value as 'replace')}
                  className="mr-2"
                />
                <span className="text-sm text-gray-900 dark:text-white">
                  Replace all data (clears existing data first)
                </span>
              </label>
              <label className="flex items-center">
                <input
                  type="radio"
                  name="importMode"
                  value="merge"
                  checked={importMode === 'merge'}
                  onChange={(e) => setImportMode(e.target.value as 'merge')}
                  className="mr-2"
                />
                <span className="text-sm text-gray-900 dark:text-white">
                  Merge with existing data
                </span>
              </label>
            </div>
          </div>

          <div>
            <label className="block">
              <span className="sr-only">Choose file</span>
              <input
                type="file"
                accept=".json"
                onChange={handleImportFile}
                className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-emerald-50 file:text-emerald-700 hover:file:bg-emerald-100 dark:file:bg-emerald-900/20 dark:file:text-emerald-400"
              />
            </label>
          </div>

          <Button variant="secondary" onClick={() => setShowImportModal(false)} className="w-full">
            Cancel
          </Button>
        </div>
      </Modal>

      {/* Clear Confirmation Modal */}
      <Modal
        isOpen={showClearConfirm}
        onClose={() => {
          setShowClearConfirm(false);
          setClearConfirmText('');
        }}
        title="Clear All Data"
      >
        <div className="space-y-4">
          <div className="bg-red-50 dark:bg-red-900/20 rounded-lg p-4 border border-red-200 dark:border-red-800">
            <p className="text-sm text-red-800 dark:text-red-200">
              This will permanently delete all your accounts, transactions, categories, and settings.
              This action cannot be undone.
            </p>
          </div>

          <Input
            label="Type DELETE to confirm"
            placeholder="DELETE"
            value={clearConfirmText}
            onChange={(e) => setClearConfirmText(e.target.value)}
          />

          <div className="flex gap-3">
            <Button
              variant="danger"
              onClick={handleClearAll}
              disabled={clearConfirmText !== 'DELETE'}
              className="flex-1"
            >
              Delete Everything
            </Button>
            <Button
              variant="secondary"
              onClick={() => {
                setShowClearConfirm(false);
                setClearConfirmText('');
              }}
            >
              Cancel
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
