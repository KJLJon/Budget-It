import type { Transaction } from '@/types';
import { differenceInDays, addMonths, addWeeks } from 'date-fns';

export interface RecurringPattern {
  description: string;
  frequency: 'weekly' | 'biweekly' | 'monthly' | 'quarterly' | 'yearly';
  averageAmount: number;
  transactions: Transaction[];
  confidence: number; // 0-1, how confident we are this is recurring
  nextOccurrence: string;
}

/**
 * Detect recurring transactions based on similar descriptions and regular intervals
 */
export function detectRecurringTransactions(
  transactions: Transaction[]
): RecurringPattern[] {
  // Group transactions by similar descriptions
  const groups = groupBySimilarDescription(transactions);

  const patterns: RecurringPattern[] = [];

  for (const [description, txns] of Object.entries(groups)) {
    if (txns.length < 3) continue; // Need at least 3 occurrences

    // Sort by date
    const sorted = txns.sort(
      (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
    );

    // Calculate intervals between transactions
    const intervals: number[] = [];
    for (let i = 1; i < sorted.length; i++) {
      const days = differenceInDays(
        new Date(sorted[i].date),
        new Date(sorted[i - 1].date)
      );
      intervals.push(days);
    }

    // Detect frequency pattern
    const frequency = detectFrequency(intervals);
    if (!frequency) continue;

    // Calculate confidence based on interval consistency
    const avgInterval = intervals.reduce((a, b) => a + b, 0) / intervals.length;

    // Guard against zero/NaN average (e.g. all transactions on same date)
    if (!Number.isFinite(avgInterval) || avgInterval === 0) continue;

    const variance =
      intervals.reduce((sum, interval) => sum + Math.pow(interval - avgInterval, 2), 0) /
      intervals.length;
    const standardDeviation = Math.sqrt(variance);
    const confidence = Math.max(0, 1 - standardDeviation / avgInterval);

    // Only include if confidence is reasonable and finite
    if (!Number.isFinite(confidence) || confidence < 0.5) continue;

    // Calculate average amount
    const averageAmount =
      sorted.reduce((sum, txn) => sum + txn.amount, 0) / sorted.length;

    // Predict next occurrence
    const lastDate = new Date(sorted[sorted.length - 1].date);
    const nextOccurrence = predictNextOccurrence(lastDate, frequency);

    patterns.push({
      description,
      frequency,
      averageAmount,
      transactions: sorted,
      confidence,
      nextOccurrence: nextOccurrence.toISOString().split('T')[0],
    });
  }

  // Sort by confidence
  return patterns.sort((a, b) => b.confidence - a.confidence);
}

function groupBySimilarDescription(
  transactions: Transaction[]
): Record<string, Transaction[]> {
  const groups: Record<string, Transaction[]> = {};

  for (const txn of transactions) {
    // Normalize description
    const normalized = normalizeDescription(txn.description);

    // Skip transactions that normalize to empty string
    if (!normalized) continue;

    // Find existing similar group
    let found = false;
    for (const key of Object.keys(groups)) {
      if (areSimilar(normalized, key)) {
        groups[key].push(txn);
        found = true;
        break;
      }
    }

    if (!found) {
      groups[normalized] = [txn];
    }
  }

  return groups;
}

export function normalizeDescription(desc: string): string {
  // Remove numbers, dates, and common transaction IDs
  return desc
    .toLowerCase()
    .replace(/\d+/g, '') // Remove numbers
    .replace(/[^a-z\s]/g, '') // Remove special chars
    .trim()
    .replace(/\s+/g, ' '); // Collapse multiple spaces
}

export function areSimilar(desc1: string, desc2: string): boolean {
  const words1 = new Set(desc1.split(/\s+/).filter(Boolean));
  const words2 = new Set(desc2.split(/\s+/).filter(Boolean));

  if (words1.size === 0 || words2.size === 0) return false;

  const intersection = new Set([...words1].filter((x) => words2.has(x)));
  const union = new Set([...words1, ...words2]);

  const similarity = intersection.size / union.size;
  return similarity > 0.6; // 60% word overlap
}

export function detectFrequency(
  intervals: number[]
): 'weekly' | 'biweekly' | 'monthly' | 'quarterly' | 'yearly' | null {
  const avgInterval = intervals.reduce((a, b) => a + b, 0) / intervals.length;

  // Proportional tolerances: tighter for short cycles, wider for long ones
  if (Math.abs(avgInterval - 7) <= 2) return 'weekly';
  if (Math.abs(avgInterval - 14) <= 3) return 'biweekly';
  if (Math.abs(avgInterval - 30) <= 5) return 'monthly';
  if (Math.abs(avgInterval - 90) <= 15) return 'quarterly';
  if (Math.abs(avgInterval - 365) <= 30) return 'yearly';

  return null;
}

export function predictNextOccurrence(
  lastDate: Date,
  frequency: 'weekly' | 'biweekly' | 'monthly' | 'quarterly' | 'yearly'
): Date {
  switch (frequency) {
    case 'weekly':
      return addWeeks(lastDate, 1);
    case 'biweekly':
      return addWeeks(lastDate, 2);
    case 'monthly':
      return addMonths(lastDate, 1);
    case 'quarterly':
      return addMonths(lastDate, 3);
    case 'yearly':
      return addMonths(lastDate, 12);
  }
}

/**
 * Project future transactions based on recurring patterns
 */
export function projectFutureTransactions(
  patterns: RecurringPattern[],
  monthsAhead: number = 6
): Transaction[] {
  const projected: Transaction[] = [];
  const endDate = addMonths(new Date(), monthsAhead);

  for (const pattern of patterns) {
    let currentDate = new Date(pattern.nextOccurrence);

    while (currentDate <= endDate) {
      projected.push({
        id: `projected-${pattern.description}-${currentDate.toISOString()}`,
        date: currentDate.toISOString().split('T')[0],
        description: `${pattern.description} (projected)`,
        amount: pattern.averageAmount,
        accountId: pattern.transactions[0].accountId,
        categoryId: pattern.transactions[0].categoryId,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });

      currentDate = predictNextOccurrence(currentDate, pattern.frequency);
    }
  }

  return projected;
}
