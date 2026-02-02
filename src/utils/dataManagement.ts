import { db } from '@/db';

export interface ExportData {
  version: string;
  exportDate: string;
  accounts: any[];
  transactions: any[];
  categories: any[];
  settings: any;
  profiles: any[];
}

export async function exportAllData(): Promise<string> {
  const [accounts, transactions, categories, settings, profiles] = await Promise.all([
    db.accounts.toArray(),
    db.transactions.toArray(),
    db.categories.toArray(),
    db.settings.get('default'),
    db.profiles.toArray(),
  ]);

  const exportData: ExportData = {
    version: '1.0.0',
    exportDate: new Date().toISOString(),
    accounts,
    transactions,
    categories,
    settings: settings || {},
    profiles,
  };

  return JSON.stringify(exportData, null, 2);
}

export async function importData(
  jsonString: string,
  mode: 'replace' | 'merge' = 'replace'
): Promise<void> {
  const data: ExportData = JSON.parse(jsonString);

  if (mode === 'replace') {
    // Clear all existing data first
    await clearAllData();
  }

  // Import data in order
  if (data.categories && data.categories.length > 0) {
    await db.categories.bulkPut(data.categories);
  }

  if (data.profiles && data.profiles.length > 0) {
    await db.profiles.bulkPut(data.profiles);
  }

  if (data.settings) {
    await db.settings.put({ ...data.settings, id: 'default' });
  }

  if (data.accounts && data.accounts.length > 0) {
    await db.accounts.bulkPut(data.accounts);
  }

  if (data.transactions && data.transactions.length > 0) {
    await db.transactions.bulkPut(data.transactions);
  }
}

export async function clearAllData(): Promise<void> {
  await Promise.all([
    db.accounts.clear(),
    db.transactions.clear(),
    db.categories.clear(),
    db.settings.clear(),
    db.profiles.clear(),
  ]);
}

export function downloadFile(content: string, filename: string): void {
  const blob = new Blob([content], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export function validateImportData(jsonString: string): {
  valid: boolean;
  error?: string;
} {
  try {
    const data = JSON.parse(jsonString);

    if (!data.version) {
      return { valid: false, error: 'Invalid file format: missing version' };
    }

    if (!data.accounts && !data.transactions && !data.categories) {
      return { valid: false, error: 'Invalid file format: no data found' };
    }

    return { valid: true };
  } catch (error) {
    return { valid: false, error: 'Invalid JSON format' };
  }
}
