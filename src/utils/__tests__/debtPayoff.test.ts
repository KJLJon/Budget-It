import { describe, it, expect } from 'vitest';
import { calculateAvalanche, calculateSnowball, compareStrategies } from '../debtPayoff';
import type { Account } from '@/types';

function makeDebt(overrides: Partial<Account> & { name: string }): Account {
  return {
    id: overrides.name.toLowerCase().replace(/\s/g, '-'),
    type: 'credit_card',
    category: 'liability',
    balance: overrides.balance ?? -1000,
    interestRate: overrides.interestRate ?? 18,
    minimumPayment: overrides.minimumPayment ?? 50,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    ...overrides,
  };
}

describe('debtPayoff', () => {
  describe('calculateAvalanche', () => {
    it('sorts debts by highest interest rate first', () => {
      const debts = [
        makeDebt({ name: 'Low Rate', interestRate: 5, balance: -500 }),
        makeDebt({ name: 'High Rate', interestRate: 20, balance: -500 }),
        makeDebt({ name: 'Mid Rate', interestRate: 12, balance: -500 }),
      ];

      const result = calculateAvalanche(debts, 100);
      // First debt to be paid off should be High Rate (highest interest)
      const firstPaidOff = result.debts.reduce((earliest, d) =>
        d.payments.length < earliest.payments.length ? d : earliest
      );
      expect(firstPaidOff.accountName).toBe('High Rate');
    });

    it('pays off all debts', () => {
      const debts = [
        makeDebt({ name: 'Card A', interestRate: 18, balance: -2000, minimumPayment: 50 }),
        makeDebt({ name: 'Card B', interestRate: 12, balance: -1000, minimumPayment: 30 }),
      ];

      const result = calculateAvalanche(debts, 50);
      // All balances should reach 0
      for (const schedule of result.debts) {
        const lastPayment = schedule.payments[schedule.payments.length - 1];
        expect(lastPayment.balance).toBe(0);
      }
    });
  });

  describe('calculateSnowball', () => {
    it('sorts debts by smallest balance first', () => {
      const debts = [
        makeDebt({ name: 'Big Debt', balance: -5000, interestRate: 10, minimumPayment: 100 }),
        makeDebt({ name: 'Small Debt', balance: -500, interestRate: 10, minimumPayment: 25 }),
        makeDebt({ name: 'Medium Debt', balance: -2000, interestRate: 10, minimumPayment: 50 }),
      ];

      const result = calculateSnowball(debts, 100);
      const firstPaidOff = result.debts.reduce((earliest, d) =>
        d.payments.length < earliest.payments.length ? d : earliest
      );
      expect(firstPaidOff.accountName).toBe('Small Debt');
    });
  });

  describe('cascade behavior', () => {
    it('cascades freed minimum payments to next debt', () => {
      // Debt A: $100 balance, $50 min, 0% interest → paid off in month 2 with $0 extra
      // After month 2, the freed $50 should accelerate Debt B
      const debts = [
        makeDebt({ name: 'Small', balance: -100, interestRate: 0, minimumPayment: 50 }),
        makeDebt({ name: 'Large', balance: -1000, interestRate: 0, minimumPayment: 50 }),
      ];

      const result = calculateSnowball(debts, 0);

      // Small should be paid off in 2 months
      const smallSchedule = result.debts.find((d) => d.accountName === 'Small')!;
      expect(smallSchedule.payments.length).toBe(2);

      // After Small is paid off, Large should get $100/mo (its $50 + freed $50)
      const largeSchedule = result.debts.find((d) => d.accountName === 'Large')!;
      // Month 1-2: $50/mo on Large = $100 paid
      // Month 3+: $100/mo on Large ($900 remaining) = 9 more months
      // Total: 11 months
      expect(largeSchedule.payments.length).toBe(11);
    });

    it('cascades excess payment when debt is nearly paid off', () => {
      // Debt A: $30 balance, $50 min, 0% interest → pays off with $20 excess
      // That $20 should go to Debt B in the same month
      const debts = [
        makeDebt({ name: 'Tiny', balance: -30, interestRate: 0, minimumPayment: 50 }),
        makeDebt({ name: 'Big', balance: -200, interestRate: 0, minimumPayment: 50 }),
      ];

      const result = calculateSnowball(debts, 0);

      const tinySchedule = result.debts.find((d) => d.accountName === 'Tiny')!;
      expect(tinySchedule.payments.length).toBe(1);
      expect(tinySchedule.payments[0].payment).toBe(30);

      // Big should get $70 in month 1 ($50 min + $20 excess from Tiny)
      const bigSchedule = result.debts.find((d) => d.accountName === 'Big')!;
      expect(bigSchedule.payments[0].payment).toBe(70);
    });

    it('cascades extra payment + freed minimums together', () => {
      const debts = [
        makeDebt({ name: 'A', balance: -100, interestRate: 0, minimumPayment: 100 }),
        makeDebt({ name: 'B', balance: -500, interestRate: 0, minimumPayment: 50 }),
      ];

      const result = calculateSnowball(debts, 50);
      // A: $100 balance, $100 min + $50 extra = $150 → pays off in month 1 with $50 excess
      // B month 1: $50 min + $50 excess = $100, remaining $400
      // B month 2+: $50 min + $50 extra + $100 freed = $200/mo → 2 more months
      // Total for B: 3 months
      const bSchedule = result.debts.find((d) => d.accountName === 'B')!;
      expect(bSchedule.payments.length).toBe(3);
    });
  });

  describe('interest calculations', () => {
    it('calculates monthly interest correctly', () => {
      const debts = [
        makeDebt({ name: 'Card', balance: -1200, interestRate: 12, minimumPayment: 100 }),
      ];

      const result = calculateAvalanche(debts, 0);
      // 12% APR → 1% monthly → $12 interest on $1200 balance
      expect(result.debts[0].payments[0].interest).toBeCloseTo(12, 2);
      expect(result.debts[0].payments[0].principal).toBeCloseTo(88, 2);
    });

    it('handles 0% interest debts correctly', () => {
      const debts = [
        makeDebt({ name: 'Loan', balance: -500, interestRate: 0, minimumPayment: 100 }),
      ];

      const result = calculateAvalanche(debts, 0);
      expect(result.totalInterest).toBe(0);
      expect(result.totalMonths).toBe(5);
      expect(result.totalPaid).toBe(500);
    });

    it('does not overpay on the last payment', () => {
      const debts = [
        makeDebt({ name: 'Card', balance: -120, interestRate: 0, minimumPayment: 100 }),
      ];

      const result = calculateAvalanche(debts, 0);
      expect(result.debts[0].payments.length).toBe(2);
      expect(result.debts[0].payments[1].payment).toBe(20);
      expect(result.totalPaid).toBe(120);
    });
  });

  describe('compareStrategies', () => {
    it('avalanche always saves at least as much interest as snowball', () => {
      const debts = [
        makeDebt({ name: 'High Rate Small', balance: -500, interestRate: 22, minimumPayment: 25 }),
        makeDebt({ name: 'Low Rate Big', balance: -5000, interestRate: 5, minimumPayment: 100 }),
        makeDebt({ name: 'Mid Rate Mid', balance: -2000, interestRate: 15, minimumPayment: 50 }),
      ];

      const comparison = compareStrategies(debts, 200);
      expect(comparison.interestSavings).toBeGreaterThanOrEqual(0);
      expect(comparison.avalanche.totalInterest).toBeLessThanOrEqual(
        comparison.snowball.totalInterest
      );
    });

    it('returns zero savings when there is only one debt', () => {
      const debts = [
        makeDebt({ name: 'Only Debt', balance: -1000, interestRate: 18, minimumPayment: 50 }),
      ];

      const comparison = compareStrategies(debts, 0);
      expect(comparison.interestSavings).toBeCloseTo(0);
      expect(comparison.timeSavings).toBe(0);
    });
  });

  describe('edge cases', () => {
    it('handles empty debt list', () => {
      const result = calculateAvalanche([], 100);
      expect(result.debts).toHaveLength(0);
      expect(result.totalMonths).toBe(0);
      expect(result.totalInterest).toBe(0);
    });

    it('respects 600-month safety limit', () => {
      // Very small payment relative to interest could run a long time
      const debts = [
        makeDebt({ name: 'Huge', balance: -100000, interestRate: 24, minimumPayment: 10 }),
      ];

      const result = calculateAvalanche(debts, 0);
      // With $10/mo minimum and $2000/mo interest, this never pays off
      expect(result.totalMonths).toBeLessThanOrEqual(600);
    });

    it('handles single debt with large extra payment', () => {
      const debts = [
        makeDebt({ name: 'Card', balance: -100, interestRate: 18, minimumPayment: 25 }),
      ];

      const result = calculateAvalanche(debts, 1000);
      expect(result.totalMonths).toBe(1);
    });
  });
});
