import { useState } from 'react';
import { Upload, CheckCircle, XCircle, Download } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Select } from '@/components/ui/Select';
import { Modal } from '@/components/ui/Modal';
import { useTransactionStore } from '@/store/useTransactionStore';
import { useAccountStore } from '@/store/useAccountStore';
import { parseCSV, detectColumnMapping, parseAmount, parseDate } from '@/utils/csvParser';
import type { CSVRow, ColumnMapping } from '@/utils/csvParser';
import type { Transaction } from '@/types';

interface CSVImportProps {
  onClose: () => void;
}

type ImportStep = 'upload' | 'mapping' | 'preview' | 'complete';

export function CSVImport({ onClose }: CSVImportProps) {
  const [step, setStep] = useState<ImportStep>('upload');
  const [csvData, setCsvData] = useState<CSVRow[]>([]);
  const [headers, setHeaders] = useState<string[]>([]);
  const [mapping, setMapping] = useState<Partial<ColumnMapping>>({});
  const [selectedAccount, setSelectedAccount] = useState('');
  const [previewTransactions, setPreviewTransactions] = useState<Omit<Transaction, 'id' | 'createdAt' | 'updatedAt'>[]>([]);
  const [importErrors, setImportErrors] = useState<string[]>([]);

  const accounts = useAccountStore((state) => state.accounts);
  const bulkAddTransactions = useTransactionStore((state) => state.bulkAddTransactions);

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const content = e.target?.result as string;
        const rows = parseCSV(content);
        const detectedHeaders = Object.keys(rows[0] || {});

        setCsvData(rows);
        setHeaders(detectedHeaders);
        setMapping(detectColumnMapping(detectedHeaders));
        setStep('mapping');
      } catch (error) {
        alert(`Error parsing CSV: ${(error as Error).message}`);
      }
    };
    reader.readAsText(file);
  };

  const handleMappingNext = () => {
    if (!mapping.date || !mapping.description || !mapping.amount || !selectedAccount) {
      alert('Please map required columns (Date, Description, Amount) and select an account');
      return;
    }

    // Generate preview
    const errors: string[] = [];
    const transactions: Omit<Transaction, 'id' | 'createdAt' | 'updatedAt'>[] = [];

    csvData.forEach((row, index) => {
      try {
        const date = parseDate(row[mapping.date!]);
        const description = row[mapping.description!]?.trim();
        const amount = parseAmount(row[mapping.amount!]);
        const notes = mapping.notes ? row[mapping.notes]?.trim() : undefined;

        if (!description) {
          throw new Error('Description is empty');
        }

        transactions.push({
          date,
          description,
          amount,
          accountId: selectedAccount,
          notes,
        });
      } catch (error) {
        errors.push(`Row ${index + 2}: ${(error as Error).message}`);
      }
    });

    setPreviewTransactions(transactions);
    setImportErrors(errors);
    setStep('preview');
  };

  const handleImport = async () => {
    try {
      await bulkAddTransactions(previewTransactions);
      setStep('complete');
    } catch (error) {
      alert(`Error importing transactions: ${(error as Error).message}`);
    }
  };

  const downloadSampleCSV = () => {
    const sampleCSV = `Date,Description,Amount
2024-01-15,Grocery Store,-45.67
2024-01-16,Salary Deposit,3000.00
2024-01-17,Coffee Shop,-5.25`;

    const blob = new Blob([sampleCSV], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'sample-transactions.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <Modal isOpen={true} onClose={onClose} title="Import Transactions from CSV">
      <div className="space-y-4">
        {step === 'upload' && (
          <>
            <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-8 text-center">
              <Upload className="w-12 h-12 mx-auto mb-4 text-gray-400" />
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                Upload your bank or credit card CSV export
              </p>
              <input
                type="file"
                accept=".csv"
                onChange={handleFileUpload}
                className="hidden"
                id="csv-upload"
              />
              <label htmlFor="csv-upload">
                <Button variant="primary" as="span" className="cursor-pointer">
                  Choose CSV File
                </Button>
              </label>
            </div>

            <div className="bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
              <p className="text-sm text-blue-900 dark:text-blue-100 font-medium mb-2">
                CSV Requirements:
              </p>
              <ul className="text-sm text-blue-800 dark:text-blue-200 space-y-1 list-disc list-inside">
                <li>Must include columns for Date, Description, and Amount</li>
                <li>First row should be column headers</li>
                <li>Dates in MM/DD/YYYY or YYYY-MM-DD format</li>
                <li>Amounts can include currency symbols and commas</li>
                <li>Negative amounts or parentheses indicate expenses</li>
              </ul>
            </div>

            <Button variant="secondary" onClick={downloadSampleCSV} className="w-full flex items-center justify-center gap-2">
              <Download className="w-4 h-4" />
              Download Sample CSV
            </Button>
          </>
        )}

        {step === 'mapping' && (
          <>
            <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                Found {csvData.length} transactions. Map your CSV columns to transaction fields:
              </p>
            </div>

            <Select
              label="Account *"
              value={selectedAccount}
              onChange={(e) => setSelectedAccount(e.target.value)}
            >
              <option value="">Select account for these transactions</option>
              {accounts.map((account) => (
                <option key={account.id} value={account.id}>
                  {account.name}
                </option>
              ))}
            </Select>

            <Select
              label="Date Column *"
              value={mapping.date || ''}
              onChange={(e) => setMapping({ ...mapping, date: e.target.value })}
            >
              <option value="">Select column</option>
              {headers.map((header) => (
                <option key={header} value={header}>
                  {header}
                </option>
              ))}
            </Select>

            <Select
              label="Description Column *"
              value={mapping.description || ''}
              onChange={(e) => setMapping({ ...mapping, description: e.target.value })}
            >
              <option value="">Select column</option>
              {headers.map((header) => (
                <option key={header} value={header}>
                  {header}
                </option>
              ))}
            </Select>

            <Select
              label="Amount Column *"
              value={mapping.amount || ''}
              onChange={(e) => setMapping({ ...mapping, amount: e.target.value })}
            >
              <option value="">Select column</option>
              {headers.map((header) => (
                <option key={header} value={header}>
                  {header}
                </option>
              ))}
            </Select>

            <Select
              label="Notes Column (optional)"
              value={mapping.notes || ''}
              onChange={(e) => setMapping({ ...mapping, notes: e.target.value })}
            >
              <option value="">None</option>
              {headers.map((header) => (
                <option key={header} value={header}>
                  {header}
                </option>
              ))}
            </Select>

            <div className="flex gap-3">
              <Button variant="secondary" onClick={() => setStep('upload')} className="flex-1">
                Back
              </Button>
              <Button variant="primary" onClick={handleMappingNext} className="flex-1">
                Preview Import
              </Button>
            </div>
          </>
        )}

        {step === 'preview' && (
          <>
            <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2 text-green-600 dark:text-green-400">
                  <CheckCircle className="w-5 h-5" />
                  <span className="font-medium">{previewTransactions.length} transactions ready</span>
                </div>
                {importErrors.length > 0 && (
                  <div className="flex items-center gap-2 text-red-600 dark:text-red-400">
                    <XCircle className="w-5 h-5" />
                    <span className="font-medium">{importErrors.length} errors</span>
                  </div>
                )}
              </div>
            </div>

            {importErrors.length > 0 && (
              <div className="bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-lg p-4 max-h-32 overflow-y-auto">
                <p className="text-sm font-medium text-red-900 dark:text-red-100 mb-2">
                  Import Errors (these rows will be skipped):
                </p>
                <ul className="text-xs text-red-800 dark:text-red-200 space-y-1">
                  {importErrors.slice(0, 10).map((error, i) => (
                    <li key={i}>{error}</li>
                  ))}
                  {importErrors.length > 10 && (
                    <li className="font-medium">...and {importErrors.length - 10} more</li>
                  )}
                </ul>
              </div>
            )}

            <div className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden max-h-64 overflow-y-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 dark:bg-gray-700 sticky top-0">
                  <tr>
                    <th className="px-3 py-2 text-left text-gray-700 dark:text-gray-300">Date</th>
                    <th className="px-3 py-2 text-left text-gray-700 dark:text-gray-300">Description</th>
                    <th className="px-3 py-2 text-right text-gray-700 dark:text-gray-300">Amount</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                  {previewTransactions.slice(0, 20).map((txn, i) => (
                    <tr key={i} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                      <td className="px-3 py-2 text-gray-900 dark:text-white whitespace-nowrap">
                        {new Date(txn.date).toLocaleDateString()}
                      </td>
                      <td className="px-3 py-2 text-gray-900 dark:text-white truncate max-w-xs">
                        {txn.description}
                      </td>
                      <td className={`px-3 py-2 text-right whitespace-nowrap ${
                        txn.amount < 0
                          ? 'text-red-600 dark:text-red-400'
                          : 'text-green-600 dark:text-green-400'
                      }`}>
                        {txn.amount < 0 ? '-' : ''}${Math.abs(txn.amount).toFixed(2)}
                      </td>
                    </tr>
                  ))}
                  {previewTransactions.length > 20 && (
                    <tr>
                      <td colSpan={3} className="px-3 py-2 text-center text-gray-600 dark:text-gray-400">
                        ...and {previewTransactions.length - 20} more
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            <div className="flex gap-3">
              <Button variant="secondary" onClick={() => setStep('mapping')} className="flex-1">
                Back
              </Button>
              <Button
                variant="primary"
                onClick={handleImport}
                disabled={previewTransactions.length === 0}
                className="flex-1"
              >
                Import {previewTransactions.length} Transactions
              </Button>
            </div>
          </>
        )}

        {step === 'complete' && (
          <>
            <div className="text-center py-8">
              <CheckCircle className="w-16 h-16 mx-auto mb-4 text-green-600 dark:text-green-400" />
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                Import Complete!
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                Successfully imported {previewTransactions.length} transactions
              </p>
            </div>

            <Button variant="primary" onClick={onClose} className="w-full">
              Done
            </Button>
          </>
        )}
      </div>
    </Modal>
  );
}
