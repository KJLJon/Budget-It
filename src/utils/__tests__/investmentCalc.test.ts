import { describe, it, expect } from 'vitest';
import { calculateInvestmentProjection } from '../investmentCalc';

describe('investmentCalc', () => {
  describe('calculateInvestmentProjection', () => {
    it('handles 0% annual return without division by zero', () => {
      const result = calculateInvestmentProjection(10000, 500, 0, 10, 0);
      expect(Number.isFinite(result.futureValue)).toBe(true);
      expect(result.futureValue).toBe(10000 + 500 * 120); // principal + contributions
      expect(result.investmentGains).toBe(0);
    });

    it('calculates future value of lump sum correctly', () => {
      // $10,000 at 12% APR (1% monthly) for 1 year, no contributions
      const result = calculateInvestmentProjection(10000, 0, 12, 1, 0);
      // FV = 10000 * (1.01)^12 ≈ 11268.25
      expect(result.futureValue).toBeCloseTo(11268.25, 0);
      expect(result.totalContributions).toBe(10000);
      expect(result.investmentGains).toBeCloseTo(1268.25, 0);
    });

    it('calculates future value of annuity correctly', () => {
      // $0 initial, $100/mo at 12% APR for 1 year
      const result = calculateInvestmentProjection(0, 100, 12, 1, 0);
      // FV = 100 * ((1.01^12 - 1) / 0.01) ≈ 1268.25
      expect(result.futureValue).toBeCloseTo(1268.25, 0);
      expect(result.totalContributions).toBe(1200);
      expect(result.investmentGains).toBeCloseTo(68.25, 0);
    });

    it('combines lump sum and annuity', () => {
      const result = calculateInvestmentProjection(10000, 100, 12, 1, 0);
      // Should be sum of both FVs
      const lumpOnly = calculateInvestmentProjection(10000, 0, 12, 1, 0);
      const annuityOnly = calculateInvestmentProjection(0, 100, 12, 1, 0);
      expect(result.futureValue).toBeCloseTo(
        lumpOnly.futureValue + annuityOnly.futureValue,
        2
      );
    });

    it('applies inflation adjustment correctly', () => {
      // $100,000 at 7% for 30 years with 3% inflation
      const result = calculateInvestmentProjection(100000, 0, 7, 30, 3);
      const nominal = calculateInvestmentProjection(100000, 0, 7, 30, 0);

      // Real value should be less than nominal
      expect(result.realValue).toBeLessThan(nominal.futureValue);

      // Manual check: real = nominal / (1.03)^30
      const inflationFactor = Math.pow(1.03, 30);
      expect(result.realValue).toBeCloseTo(nominal.futureValue / inflationFactor, 2);
    });

    it('handles 0% inflation without division issues', () => {
      const result = calculateInvestmentProjection(10000, 0, 7, 10, 0);
      expect(result.realValue).toBe(result.futureValue);
    });

    it('handles very long time horizons', () => {
      const result = calculateInvestmentProjection(1000, 100, 7, 50, 3);
      expect(Number.isFinite(result.futureValue)).toBe(true);
      expect(result.futureValue).toBeGreaterThan(0);
    });

    it('handles zero initial investment', () => {
      const result = calculateInvestmentProjection(0, 500, 7, 30, 3);
      expect(result.totalContributions).toBe(500 * 360);
      expect(result.futureValue).toBeGreaterThan(result.totalContributions);
    });

    it('handles zero contributions', () => {
      const result = calculateInvestmentProjection(50000, 0, 7, 20, 0);
      expect(result.totalContributions).toBe(50000);
      expect(result.futureValue).toBeGreaterThan(50000);
    });

    it('returns correct total contributions', () => {
      const result = calculateInvestmentProjection(10000, 500, 7, 10, 3);
      expect(result.totalContributions).toBe(10000 + 500 * 120);
    });

    it('gains are always non-negative for non-negative returns', () => {
      const result = calculateInvestmentProjection(10000, 500, 5, 20, 0);
      expect(result.investmentGains).toBeGreaterThanOrEqual(0);
    });

    it('30-year retirement projection is reasonable', () => {
      // Classic: $100k initial + $500/mo at 7% for 30 years
      const result = calculateInvestmentProjection(100000, 500, 7, 30, 3);

      // Nominal should be around $1.37M (well-known benchmark)
      expect(result.futureValue).toBeGreaterThan(1_000_000);
      expect(result.futureValue).toBeLessThan(2_000_000);

      // Real (inflation-adjusted) should be less
      expect(result.realValue).toBeLessThan(result.futureValue);
      expect(result.realValue).toBeGreaterThan(400_000);
    });
  });
});
