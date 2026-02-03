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
type FieldType = 'date' | 'description' | 'amount' | 'notes' | 'unused';

interface ColumnMappingRow {
  csvColumn: string;
  mappedTo: FieldType;
  sampleValue: string;
}

export function CSVImport({ onClose }: CSVImportProps) {
  const [step, setStep] = useState<ImportStep>('upload');
  const [csvData, setCsvData] = useState<CSVRow[]>([]);
  const [columnMappings, setColumnMappings] = useState<ColumnMappingRow[]>([]);
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

        // Auto-detect column mappings
        const detectedMapping = detectColumnMapping(detectedHeaders);

        // Create column mapping rows with auto-detection
        const mappings: ColumnMappingRow[] = detectedHeaders.map(header => {
          let mappedTo: FieldType = 'unused';

          // Check if this header was auto-detected for a field
          if (detectedMapping.date === header) mappedTo = 'date';
          else if (detectedMapping.description === header) mappedTo = 'description';
          else if (detectedMapping.amount === header) mappedTo = 'amount';
          else if (detectedMapping.notes === header) mappedTo = 'notes';

          return {
            csvColumn: header,
            mappedTo,
            sampleValue: rows[0]?.[header] || '',
          };
        });

        setCsvData(rows);
        setColumnMappings(mappings);
        setStep('mapping');
      } catch (error) {
        alert(`Error parsing CSV: ${(error as Error).message}`);
      }
    };
    reader.readAsText(file);
  };

  const handleMappingNext = () => {
    // Convert column mappings to ColumnMapping format
    const mapping: Partial<ColumnMapping> = {};
    columnMappings.forEach(cm => {
      if (cm.mappedTo === 'date') mapping.date = cm.csvColumn;
      else if (cm.mappedTo === 'description') mapping.description = cm.csvColumn;
      else if (cm.mappedTo === 'amount') mapping.amount = cm.csvColumn;
      else if (cm.mappedTo === 'notes') mapping.notes = cm.csvColumn;
    });

    // Validate required fields
    if (!mapping.date || !mapping.description || !mapping.amount) {
      alert('Please map required fields: Date, Description, and Amount');
      return;
    }

    if (!selectedAccount) {
      alert('Please select an account');
      return;
    }

    // Check for duplicate mappings
    const mappedFields = columnMappings.filter(cm => cm.mappedTo !== 'unused').map(cm => cm.mappedTo);
    const duplicates = mappedFields.filter((field, index) => mappedFields.indexOf(field) !== index);
    if (duplicates.length > 0) {
      alert(`Duplicate field mappings detected: ${duplicates.join(', ')}. Each field can only be mapped once.`);
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
            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 mb-4">
              <p className="text-sm font-semibold text-blue-900 dark:text-blue-100 mb-2">
                Step 1: Select Account
              </p>
              <p className="text-sm text-blue-800 dark:text-blue-200 mb-3">
                Which account do these transactions belong to? All transactions from this CSV will be imported to the selected account.
              </p>
              <Select
                label="Account for this CSV Import *"
                value={selectedAccount}
                onChange={(e) => setSelectedAccount(e.target.value)}
              >
                <option value="">Choose account (checking, credit card, etc.)</option>
                {accounts.map((account) => (
                  <option key={account.id} value={account.id}>
                    {account.name} {account.institution ? `- ${account.institution}` : ''}
                  </option>
                ))}
              </Select>
            </div>

            <div className="bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4 mb-4">
              <p className="text-sm font-semibold text-gray-900 dark:text-white mb-2">
                Step 2: Upload CSV File
              </p>
            </div>

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
                disabled={!selectedAccount}
              />
              <label htmlFor="csv-upload">
                <Button
                  variant="primary"
                  as="span"
                  className="cursor-pointer"
                  disabled={!selectedAccount}
                >
                  {selectedAccount ? 'Choose CSV File' : 'Select Account First'}
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
            <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 mb-4">
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                Found {csvData.length} transactions. Map your CSV columns to transaction fields below.
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Fields marked with * are required. Columns not needed can be set to "Unused".
              </p>
            </div>

            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3 mb-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-blue-700 dark:text-blue-300 font-medium">Importing to:</p>
                  <p className="text-sm font-semibold text-blue-900 dark:text-blue-100">
                    {accounts.find(a => a.id === selectedAccount)?.name || 'Unknown Account'}
                  </p>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setStep('upload')}
                  className="text-blue-600 dark:text-blue-400 hover:text-blue-700"
                >
                  Change
                </Button>
              </div>
            </div>

            <div className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
              <table className="w-full">
                <thead className="bg-gray-50 dark:bg-gray-700">
                  <tr>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-700 dark:text-gray-300">
                      CSV Column
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-700 dark:text-gray-300">
                      Sample Value
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-700 dark:text-gray-300">
                      Maps To
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                  {columnMappings.map((cm, index) => (
                    <tr key={cm.csvColumn} className="hover:bg-gray-50 dark:hover:bg-gray-750">
                      <td className="px-4 py-3 text-sm font-medium text-gray-900 dark:text-white">
                        {cm.csvColumn}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400 max-w-xs truncate">
                        {cm.sampleValue}
                      </td>
                      <td className="px-4 py-3">
                        <select
                          value={cm.mappedTo}
                          onChange={(e) => {
                            const newMappings = [...columnMappings];
                            newMappings[index].mappedTo = e.target.value as FieldType;
                            setColumnMappings(newMappings);
                          }}
                          className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                        >
                          <option value="unused">Unused</option>
                          <option value="date">Date *</option>
                          <option value="description">Description *</option>
                          <option value="amount">Amount *</option>
                          <option value="notes">Notes</option>
                        </select>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-3 mt-4">
              <p className="text-xs text-amber-800 dark:text-amber-200">
                <strong>Note:</strong> Each field can only be mapped once. Make sure Date, Description, and Amount are all mapped before continuing.
              </p>
            </div>

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
