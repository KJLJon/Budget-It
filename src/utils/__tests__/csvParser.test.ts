import { describe, it, expect } from 'vitest';
import { parseCSV, parseAmount, parseDate, detectColumnMapping } from '../csvParser';

describe('csvParser', () => {
  describe('parseCSV', () => {
    it('parses basic CSV with headers', () => {
      const csv = 'Date,Description,Amount\n2024-01-01,Coffee,-4.50\n2024-01-02,Salary,3000';
      const rows = parseCSV(csv);
      expect(rows).toHaveLength(2);
      expect(rows[0]).toEqual({ Date: '2024-01-01', Description: 'Coffee', Amount: '-4.50' });
      expect(rows[1]).toEqual({ Date: '2024-01-02', Description: 'Salary', Amount: '3000' });
    });

    it('handles quoted fields with commas', () => {
      const csv = 'Name,Description,Amount\n"Smith, John","Payment, monthly",100';
      const rows = parseCSV(csv);
      expect(rows).toHaveLength(1);
      expect(rows[0].Name).toBe('Smith, John');
      expect(rows[0].Description).toBe('Payment, monthly');
    });

    it('handles escaped quotes inside quoted fields', () => {
      const csv = 'Name,Note\nJohn,"He said ""hello"""\n';
      const rows = parseCSV(csv);
      expect(rows).toHaveLength(1);
      expect(rows[0].Note).toBe('He said "hello"');
    });

    it('handles newlines inside quoted fields (RFC 4180)', () => {
      const csv = 'Name,Address,Amount\n"John","123 Main St\nApt 4","100"\n"Jane","456 Oak",200';
      const rows = parseCSV(csv);
      expect(rows).toHaveLength(2);
      expect(rows[0].Address).toBe('123 Main St\nApt 4');
      expect(rows[1].Name).toBe('Jane');
    });

    it('handles Windows line endings (\\r\\n)', () => {
      const csv = 'A,B\r\n1,2\r\n3,4';
      const rows = parseCSV(csv);
      expect(rows).toHaveLength(2);
      expect(rows[0]).toEqual({ A: '1', B: '2' });
      expect(rows[1]).toEqual({ A: '3', B: '4' });
    });

    it('handles old Mac line endings (\\r)', () => {
      const csv = 'A,B\r1,2\r3,4';
      const rows = parseCSV(csv);
      expect(rows).toHaveLength(2);
      expect(rows[0]).toEqual({ A: '1', B: '2' });
    });

    it('skips empty rows', () => {
      const csv = 'A,B\n1,2\n\n3,4\n';
      const rows = parseCSV(csv);
      expect(rows).toHaveLength(2);
    });

    it('throws on single-line input', () => {
      expect(() => parseCSV('just headers')).toThrow(
        'CSV file must have at least a header row and one data row'
      );
    });

    it('handles missing values at end of row', () => {
      const csv = 'A,B,C\n1,2\n4,5,6';
      const rows = parseCSV(csv);
      expect(rows[0].C).toBe('');
      expect(rows[1].C).toBe('6');
    });
  });

  describe('parseAmount', () => {
    it('parses simple numbers', () => {
      expect(parseAmount('100')).toBe(100);
      expect(parseAmount('42.50')).toBe(42.50);
      expect(parseAmount('-75.00')).toBe(-75);
    });

    it('strips dollar signs', () => {
      expect(parseAmount('$1,234.56')).toBe(1234.56);
      expect(parseAmount('$100')).toBe(100);
    });

    it('strips other currency symbols', () => {
      expect(parseAmount('€1,234.56')).toBe(1234.56);
      expect(parseAmount('£100.00')).toBe(100);
      expect(parseAmount('¥5000')).toBe(5000);
    });

    it('handles accounting notation (parentheses = negative)', () => {
      expect(parseAmount('(500.00)')).toBe(-500);
      expect(parseAmount('($1,234.56)')).toBe(-1234.56);
    });

    it('returns NaN for empty strings', () => {
      expect(parseAmount('')).toBeNaN();
      expect(parseAmount('   ')).toBeNaN();
    });

    it('returns NaN for non-numeric strings', () => {
      expect(parseAmount('abc')).toBeNaN();
      expect(parseAmount('N/A')).toBeNaN();
    });

    it('handles zero correctly', () => {
      expect(parseAmount('0')).toBe(0);
      expect(parseAmount('$0.00')).toBe(0);
    });

    it('handles spaces and commas', () => {
      expect(parseAmount('1 234 567.89')).toBe(1234567.89);
      expect(parseAmount('1,000,000')).toBe(1000000);
    });
  });

  describe('parseDate', () => {
    it('parses ISO format (YYYY-MM-DD)', () => {
      expect(parseDate('2024-01-15')).toBe('2024-01-15');
      expect(parseDate('2024-12-31')).toBe('2024-12-31');
    });

    it('parses MM/DD/YYYY format', () => {
      expect(parseDate('01/15/2024')).toBe('2024-01-15');
      expect(parseDate('12/31/2024')).toBe('2024-12-31');
    });

    it('parses MM-DD-YYYY format', () => {
      expect(parseDate('01-15-2024')).toBe('2024-01-15');
    });

    it('parses single-digit month/day', () => {
      expect(parseDate('1/5/2024')).toBe('2024-01-05');
    });

    it('throws on invalid dates', () => {
      expect(() => parseDate('not-a-date')).toThrow('Invalid date');
      expect(() => parseDate('')).toThrow('Invalid date');
    });

    it('handles whitespace', () => {
      expect(parseDate('  2024-01-15  ')).toBe('2024-01-15');
    });
  });

  describe('detectColumnMapping', () => {
    it('detects common date column names', () => {
      const mapping = detectColumnMapping(['Transaction Date', 'Description', 'Amount']);
      expect(mapping.date).toBe('Transaction Date');
    });

    it('detects common description column names', () => {
      const mapping = detectColumnMapping(['Date', 'Merchant Name', 'Amount']);
      expect(mapping.description).toBe('Merchant Name');
    });

    it('detects common amount column names', () => {
      const mapping = detectColumnMapping(['Date', 'Description', 'Transaction Amount']);
      expect(mapping.amount).toBe('Transaction Amount');
    });

    it('detects notes column', () => {
      const mapping = detectColumnMapping(['Date', 'Description', 'Amount', 'Notes']);
      expect(mapping.notes).toBe('Notes');
    });

    it('returns partial mapping when columns are ambiguous', () => {
      const mapping = detectColumnMapping(['Col1', 'Col2', 'Col3']);
      expect(mapping.date).toBeUndefined();
      expect(mapping.description).toBeUndefined();
      expect(mapping.amount).toBeUndefined();
    });

    it('is case-insensitive', () => {
      const mapping = detectColumnMapping(['DATE', 'DESCRIPTION', 'AMOUNT']);
      expect(mapping.date).toBe('DATE');
      expect(mapping.description).toBe('DESCRIPTION');
      expect(mapping.amount).toBe('AMOUNT');
    });
  });
});
