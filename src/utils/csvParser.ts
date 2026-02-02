export interface CSVRow {
  [key: string]: string;
}

export interface ColumnMapping {
  date: string;
  description: string;
  amount: string;
  notes?: string;
}

/**
 * Split CSV content into fields, handling quoted fields that may contain
 * newlines, commas, and escaped quotes per RFC 4180.
 */
export function parseCSV(csvContent: string): CSVRow[] {
  const records = parseCSVRecords(csvContent);
  if (records.length < 2) {
    throw new Error('CSV file must have at least a header row and one data row');
  }

  const headers = records[0];
  const rows: CSVRow[] = [];

  for (let i = 1; i < records.length; i++) {
    const values = records[i];
    if (values.length === 0 || values.every((v) => !v.trim())) {
      continue;
    }

    const row: CSVRow = {};
    headers.forEach((header, index) => {
      row[header] = values[index] || '';
    });
    rows.push(row);
  }

  return rows;
}

/**
 * Parse CSV content into an array of records (each record is an array of fields).
 * Handles quoted fields containing newlines, commas, and escaped quotes.
 */
function parseCSVRecords(content: string): string[][] {
  const records: string[][] = [];
  let current = '';
  let inQuotes = false;
  const fields: string[] = [];

  for (let i = 0; i < content.length; i++) {
    const char = content[i];
    const nextChar = content[i + 1];

    if (char === '"') {
      if (inQuotes && nextChar === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === ',' && !inQuotes) {
      fields.push(current.trim());
      current = '';
    } else if ((char === '\n' || (char === '\r' && nextChar === '\n')) && !inQuotes) {
      if (char === '\r') i++; // skip \n in \r\n
      fields.push(current.trim());
      if (fields.length > 0 && !fields.every((f) => !f)) {
        records.push([...fields]);
      }
      fields.length = 0;
      current = '';
    } else if (char === '\r' && !inQuotes) {
      // Bare \r (old Mac line ending)
      fields.push(current.trim());
      if (fields.length > 0 && !fields.every((f) => !f)) {
        records.push([...fields]);
      }
      fields.length = 0;
      current = '';
    } else {
      current += char;
    }
  }

  // Handle last field/record
  fields.push(current.trim());
  if (fields.length > 0 && !fields.every((f) => !f)) {
    records.push([...fields]);
  }

  return records;
}

export function detectColumnMapping(headers: string[]): Partial<ColumnMapping> {
  const mapping: Partial<ColumnMapping> = {};

  // Common date column names
  const datePatterns = ['date', 'transaction date', 'posting date', 'trans date'];
  const dateColumn = headers.find((h) =>
    datePatterns.some((p) => h.toLowerCase().includes(p))
  );
  if (dateColumn) mapping.date = dateColumn;

  // Common description column names
  const descPatterns = ['description', 'memo', 'merchant', 'payee', 'details'];
  const descColumn = headers.find((h) =>
    descPatterns.some((p) => h.toLowerCase().includes(p))
  );
  if (descColumn) mapping.description = descColumn;

  // Common amount column names
  const amountPatterns = ['amount', 'transaction amount', 'debit', 'value'];
  const amountColumn = headers.find((h) =>
    amountPatterns.some((p) => h.toLowerCase().includes(p))
  );
  if (amountColumn) mapping.amount = amountColumn;

  // Optional notes column
  const notesPatterns = ['notes', 'note', 'comments'];
  const notesColumn = headers.find((h) =>
    notesPatterns.some((p) => h.toLowerCase().includes(p))
  );
  if (notesColumn) mapping.notes = notesColumn;

  return mapping;
}

export function parseAmount(value: string): number {
  // Remove all non-numeric characters except digits, decimal point, minus, and parens
  const cleaned = value.replace(/[^0-9.\-()]/g, '');

  if (!cleaned) return NaN;

  // Handle parentheses as negative (common in accounting)
  if (cleaned.startsWith('(') && cleaned.endsWith(')')) {
    const num = parseFloat(cleaned.slice(1, -1));
    return isNaN(num) ? NaN : -num;
  }

  const num = parseFloat(cleaned);
  return isNaN(num) ? NaN : num;
}

export function parseDate(value: string): string {
  const trimmed = value.trim();

  // Try explicit MM/DD/YYYY or MM-DD-YYYY
  const mdyMatch = trimmed.match(/^(\d{1,2})[/\-](\d{1,2})[/\-](\d{4})$/);
  if (mdyMatch) {
    const [, month, day, year] = mdyMatch;
    const date = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
    if (!isNaN(date.getTime())) {
      return date.toISOString().split('T')[0];
    }
  }

  // Try YYYY-MM-DD (ISO)
  const isoMatch = trimmed.match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/);
  if (isoMatch) {
    const [, year, month, day] = isoMatch;
    const date = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
    if (!isNaN(date.getTime())) {
      return date.toISOString().split('T')[0];
    }
  }

  // Fallback: try native Date parsing
  const date = new Date(trimmed);
  if (isNaN(date.getTime())) {
    throw new Error(`Invalid date: ${value}`);
  }

  return date.toISOString().split('T')[0];
}
