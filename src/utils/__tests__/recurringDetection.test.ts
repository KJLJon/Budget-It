import { describe, it, expect } from 'vitest';
import {
  detectRecurringTransactions,
  projectFutureTransactions,
  normalizeDescription,
  areSimilar,
  detectFrequency,
  predictNextOccurrence,
} from '../recurringDetection';
import type { Transaction } from '@/types';

function makeTxn(
  description: string,
  date: string,
  amount: number = -50,
  accountId: string = 'acc-1'
): Transaction {
  return {
    id: `txn-${date}-${description}`,
    accountId,
    date,
    description,
    amount,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
}

describe('recurringDetection', () => {
  describe('normalizeDescription', () => {
    it('lowercases and removes numbers and special chars', () => {
      expect(normalizeDescription('Netflix #12345')).toBe('netflix');
    });

    it('collapses multiple spaces', () => {
      expect(normalizeDescription('AMAZON   PRIME  123')).toBe('amazon prime');
    });

    it('returns empty string for purely numeric descriptions', () => {
      expect(normalizeDescription('12345-6789')).toBe('');
    });

    it('handles AT&T style names', () => {
      expect(normalizeDescription('AT&T Wireless')).toBe('att wireless');
    });
  });

  describe('areSimilar', () => {
    it('returns true for identical descriptions', () => {
      expect(areSimilar('netflix', 'netflix')).toBe(true);
    });

    it('returns true for >60% word overlap', () => {
      // {"amazon", "prime"} vs {"amazon", "prime", "video"} = 2/3 = 67%
      expect(areSimilar('amazon prime', 'amazon prime video')).toBe(true);
    });

    it('returns false for <60% word overlap', () => {
      // {"amazon"} vs {"netflix"} = 0/2 = 0%
      expect(areSimilar('amazon', 'netflix')).toBe(false);
    });

    it('returns false for empty strings', () => {
      expect(areSimilar('', '')).toBe(false);
      expect(areSimilar('hello', '')).toBe(false);
    });

    it('distinguishes sufficiently different merchants', () => {
      // {"amazon", "prime"} vs {"amazon", "fresh"} = 1/3 = 33%
      expect(areSimilar('amazon prime', 'amazon fresh')).toBe(false);
    });
  });

  describe('detectFrequency', () => {
    it('detects weekly pattern', () => {
      expect(detectFrequency([7, 7, 7, 7])).toBe('weekly');
      expect(detectFrequency([6, 8, 7])).toBe('weekly');
    });

    it('detects biweekly pattern', () => {
      expect(detectFrequency([14, 14, 14])).toBe('biweekly');
      expect(detectFrequency([13, 15, 14])).toBe('biweekly');
    });

    it('detects monthly pattern', () => {
      expect(detectFrequency([30, 31, 28, 31])).toBe('monthly');
      expect(detectFrequency([29, 31, 30])).toBe('monthly');
    });

    it('detects quarterly pattern', () => {
      expect(detectFrequency([90, 92, 91])).toBe('quarterly');
    });

    it('detects yearly pattern with wider tolerance', () => {
      // With the new 30-day tolerance, slightly off yearly should still match
      expect(detectFrequency([365, 365])).toBe('yearly');
      expect(detectFrequency([360, 370])).toBe('yearly');
      expect(detectFrequency([350, 380])).toBe('yearly');
    });

    it('rejects yearly when too far off', () => {
      expect(detectFrequency([330, 330])).toBeNull();
    });

    it('returns null for unrecognized intervals', () => {
      expect(detectFrequency([45, 47, 44])).toBeNull();
      expect(detectFrequency([200, 210])).toBeNull();
    });

    it('uses tighter tolerance for weekly', () => {
      // 7 +/- 2 days
      expect(detectFrequency([10, 10, 10])).toBeNull(); // avg 10, not within ±2 of 7
    });
  });

  describe('predictNextOccurrence', () => {
    it('adds 1 week for weekly', () => {
      const date = new Date('2024-01-01');
      const next = predictNextOccurrence(date, 'weekly');
      expect(next.toISOString().split('T')[0]).toBe('2024-01-08');
    });

    it('adds 2 weeks for biweekly', () => {
      const date = new Date('2024-01-01');
      const next = predictNextOccurrence(date, 'biweekly');
      expect(next.toISOString().split('T')[0]).toBe('2024-01-15');
    });

    it('adds 1 month for monthly', () => {
      const date = new Date('2024-01-15');
      const next = predictNextOccurrence(date, 'monthly');
      expect(next.toISOString().split('T')[0]).toBe('2024-02-15');
    });

    it('adds 3 months for quarterly', () => {
      const date = new Date('2024-01-15');
      const next = predictNextOccurrence(date, 'quarterly');
      expect(next.toISOString().split('T')[0]).toBe('2024-04-15');
    });

    it('adds 12 months for yearly', () => {
      const date = new Date('2024-01-15');
      const next = predictNextOccurrence(date, 'yearly');
      expect(next.toISOString().split('T')[0]).toBe('2025-01-15');
    });
  });

  describe('detectRecurringTransactions', () => {
    it('detects monthly recurring pattern', () => {
      const txns = [
        makeTxn('Netflix Subscription', '2024-01-15', -15.99),
        makeTxn('Netflix Subscription', '2024-02-15', -15.99),
        makeTxn('Netflix Subscription', '2024-03-15', -15.99),
        makeTxn('Netflix Subscription', '2024-04-15', -15.99),
      ];

      const patterns = detectRecurringTransactions(txns);
      expect(patterns.length).toBe(1);
      expect(patterns[0].frequency).toBe('monthly');
      expect(patterns[0].averageAmount).toBeCloseTo(-15.99);
      expect(patterns[0].confidence).toBeGreaterThan(0.9);
    });

    it('requires at least 3 occurrences', () => {
      const txns = [
        makeTxn('Spotify', '2024-01-01', -9.99),
        makeTxn('Spotify', '2024-02-01', -9.99),
      ];

      const patterns = detectRecurringTransactions(txns);
      expect(patterns.length).toBe(0);
    });

    it('groups similar descriptions together', () => {
      const txns = [
        makeTxn('NETFLIX COM 123', '2024-01-15', -15.99),
        makeTxn('NETFLIX COM 456', '2024-02-15', -15.99),
        makeTxn('NETFLIX COM 789', '2024-03-15', -15.99),
      ];

      const patterns = detectRecurringTransactions(txns);
      expect(patterns.length).toBe(1);
    });

    it('filters out low-confidence patterns', () => {
      // Very irregular intervals → low confidence
      const txns = [
        makeTxn('Random Store', '2024-01-01', -20),
        makeTxn('Random Store', '2024-01-15', -20),
        makeTxn('Random Store', '2024-04-01', -20),
        makeTxn('Random Store', '2024-04-05', -20),
      ];

      const patterns = detectRecurringTransactions(txns);
      // The irregular intervals shouldn't match any frequency or should have low confidence
      expect(patterns.length).toBe(0);
    });

    it('skips transactions with purely numeric descriptions', () => {
      const txns = [
        makeTxn('123-456', '2024-01-01', -10),
        makeTxn('123-789', '2024-02-01', -10),
        makeTxn('123-012', '2024-03-01', -10),
      ];

      const patterns = detectRecurringTransactions(txns);
      expect(patterns.length).toBe(0);
    });

    it('handles duplicate-date transactions without NaN confidence', () => {
      // All on the same day — avgInterval would be 0
      const txns = [
        makeTxn('Duplicate Import', '2024-01-15', -10),
        makeTxn('Duplicate Import', '2024-01-15', -10),
        makeTxn('Duplicate Import', '2024-01-15', -10),
      ];

      const patterns = detectRecurringTransactions(txns);
      // Should be filtered out, not produce NaN
      expect(patterns.length).toBe(0);
      for (const p of patterns) {
        expect(Number.isFinite(p.confidence)).toBe(true);
      }
    });

    it('detects income as well as expenses', () => {
      const txns = [
        makeTxn('Payroll Deposit', '2024-01-01', 3000),
        makeTxn('Payroll Deposit', '2024-02-01', 3000),
        makeTxn('Payroll Deposit', '2024-03-01', 3000),
        makeTxn('Payroll Deposit', '2024-04-01', 3000),
      ];

      const patterns = detectRecurringTransactions(txns);
      expect(patterns.length).toBe(1);
      expect(patterns[0].averageAmount).toBe(3000);
      expect(patterns[0].frequency).toBe('monthly');
    });
  });

  describe('projectFutureTransactions', () => {
    it('generates correct number of projected transactions', () => {
      const txns = [
        makeTxn('Netflix', '2024-01-15', -15.99),
        makeTxn('Netflix', '2024-02-15', -15.99),
        makeTxn('Netflix', '2024-03-15', -15.99),
      ];

      const patterns = detectRecurringTransactions(txns);
      // Project 3 months from "now" — but the next occurrence is relative to last txn
      const projected = projectFutureTransactions(patterns, 12);
      expect(projected.length).toBeGreaterThan(0);
      expect(projected[0].description).toContain('(projected)');
    });

    it('returns empty array when no patterns', () => {
      const projected = projectFutureTransactions([], 6);
      expect(projected).toHaveLength(0);
    });
  });
});
