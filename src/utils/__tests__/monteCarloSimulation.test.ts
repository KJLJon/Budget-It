import { describe, it, expect } from 'vitest';
import {
  boxMullerNormal,
  simulatePath,
  computeMonthlyLogParams,
  percentile,
  runMonteCarloSimulation,
} from '../monteCarloSimulation';

// Seeded pseudo-random generator for deterministic tests
function createSeededRng(seed: number): () => number {
  let s = seed;
  return () => {
    s = (s * 16807 + 0) % 2147483647;
    return s / 2147483647;
  };
}

describe('monteCarloSimulation', () => {
  describe('boxMullerNormal', () => {
    it('generates finite numbers', () => {
      for (let i = 0; i < 100; i++) {
        const z = boxMullerNormal();
        expect(Number.isFinite(z)).toBe(true);
      }
    });

    it('produces approximately standard normal distribution', () => {
      const rng = createSeededRng(42);
      const samples: number[] = [];
      for (let i = 0; i < 10000; i++) {
        samples.push(boxMullerNormal(rng));
      }

      const mean = samples.reduce((s, v) => s + v, 0) / samples.length;
      const variance = samples.reduce((s, v) => s + (v - mean) ** 2, 0) / samples.length;

      // Mean should be near 0, variance near 1
      expect(Math.abs(mean)).toBeLessThan(0.05);
      expect(Math.abs(variance - 1)).toBeLessThan(0.1);
    });

    it('handles u1=0 by re-drawing', () => {
      let callCount = 0;
      const rng = () => {
        callCount++;
        // Return 0 on first call, then valid values
        if (callCount === 1) return 0;
        return 0.5;
      };
      const z = boxMullerNormal(rng);
      expect(Number.isFinite(z)).toBe(true);
      expect(callCount).toBeGreaterThan(2); // Had to re-draw u1
    });
  });

  describe('computeMonthlyLogParams', () => {
    it('returns zero params for zero return and zero volatility', () => {
      const { monthlyLogMean, monthlyLogStd } = computeMonthlyLogParams(0, 0);
      expect(monthlyLogMean).toBe(0);
      expect(monthlyLogStd).toBe(0);
    });

    it('returns reasonable params for typical stock market (7% return, 15% vol)', () => {
      const { monthlyLogMean, monthlyLogStd } = computeMonthlyLogParams(7, 15);

      // Monthly log mean: (ln(1.07) - 0.15^2/2) / 12 ≈ (0.0677 - 0.01125) / 12 ≈ 0.0047
      expect(monthlyLogMean).toBeCloseTo(0.0047, 3);

      // Monthly log std: 0.15 / sqrt(12) ≈ 0.0433
      expect(monthlyLogStd).toBeCloseTo(0.0433, 3);
    });

    it('drift correction reduces log mean for high volatility', () => {
      const low = computeMonthlyLogParams(7, 5);
      const high = computeMonthlyLogParams(7, 30);
      // Higher volatility → lower log mean (drift correction)
      expect(high.monthlyLogMean).toBeLessThan(low.monthlyLogMean);
    });
  });

  describe('simulatePath', () => {
    it('returns correct number of yearly values', () => {
      const rng = createSeededRng(123);
      const { monthlyLogMean, monthlyLogStd } = computeMonthlyLogParams(7, 15);
      const path = simulatePath(10000, 500, monthlyLogMean, monthlyLogStd, 10, rng);
      expect(path).toHaveLength(10);
    });

    it('all values are non-negative', () => {
      const rng = createSeededRng(999);
      const { monthlyLogMean, monthlyLogStd } = computeMonthlyLogParams(7, 15);
      const path = simulatePath(10000, 500, monthlyLogMean, monthlyLogStd, 30, rng);
      for (const v of path) {
        expect(v).toBeGreaterThanOrEqual(0);
      }
    });

    it('grows over time with positive contributions and returns', () => {
      const rng = createSeededRng(42);
      const { monthlyLogMean, monthlyLogStd } = computeMonthlyLogParams(7, 10);
      const path = simulatePath(10000, 500, monthlyLogMean, monthlyLogStd, 20, rng);
      // Final should be greater than initial with positive returns + contributions
      expect(path[path.length - 1]).toBeGreaterThan(10000);
    });

    it('handles zero initial value', () => {
      const rng = createSeededRng(42);
      const { monthlyLogMean, monthlyLogStd } = computeMonthlyLogParams(7, 15);
      const path = simulatePath(0, 500, monthlyLogMean, monthlyLogStd, 5, rng);
      expect(path).toHaveLength(5);
      // Should grow from contributions alone
      expect(path[4]).toBeGreaterThan(0);
    });

    it('handles zero contributions', () => {
      const rng = createSeededRng(42);
      const { monthlyLogMean, monthlyLogStd } = computeMonthlyLogParams(7, 10);
      const path = simulatePath(100000, 0, monthlyLogMean, monthlyLogStd, 10, rng);
      expect(path).toHaveLength(10);
      expect(path[0]).toBeGreaterThan(0);
    });
  });

  describe('percentile', () => {
    it('returns 0 for empty array', () => {
      expect(percentile([], 50)).toBe(0);
    });

    it('returns the only element for single-element array', () => {
      expect(percentile([42], 50)).toBe(42);
      expect(percentile([42], 10)).toBe(42);
      expect(percentile([42], 90)).toBe(42);
    });

    it('calculates median correctly for odd-length array', () => {
      expect(percentile([1, 2, 3, 4, 5], 50)).toBe(3);
    });

    it('interpolates for even-length array', () => {
      expect(percentile([1, 2, 3, 4], 50)).toBe(2.5);
    });

    it('returns min for 0th percentile', () => {
      expect(percentile([10, 20, 30, 40, 50], 0)).toBe(10);
    });

    it('returns max for 100th percentile', () => {
      expect(percentile([10, 20, 30, 40, 50], 100)).toBe(50);
    });

    it('handles 25th and 75th percentiles', () => {
      const data = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
      const p25 = percentile(data, 25);
      const p75 = percentile(data, 75);
      expect(p25).toBeCloseTo(3.25, 2);
      expect(p75).toBeCloseTo(7.75, 2);
    });
  });

  describe('runMonteCarloSimulation', () => {
    it('returns correct yearly data length', () => {
      const result = runMonteCarloSimulation({
        initialValue: 10000,
        monthlyContribution: 500,
        annualReturn: 7,
        annualVolatility: 15,
        inflationRate: 0,
        years: 10,
        numSimulations: 100,
      });
      expect(result.yearlyData).toHaveLength(10);
      expect(result.yearlyData[0].year).toBe(1);
      expect(result.yearlyData[9].year).toBe(10);
    });

    it('percentile ordering is maintained (p10 <= p25 <= p50 <= p75 <= p90)', () => {
      const result = runMonteCarloSimulation({
        initialValue: 100000,
        monthlyContribution: 500,
        annualReturn: 7,
        annualVolatility: 15,
        inflationRate: 0,
        years: 30,
        numSimulations: 200,
      });

      for (const d of result.yearlyData) {
        expect(d.p10).toBeLessThanOrEqual(d.p25);
        expect(d.p25).toBeLessThanOrEqual(d.p50);
        expect(d.p50).toBeLessThanOrEqual(d.p75);
        expect(d.p75).toBeLessThanOrEqual(d.p90);
      }
    });

    it('all values are finite', () => {
      const result = runMonteCarloSimulation({
        initialValue: 100000,
        monthlyContribution: 500,
        annualReturn: 7,
        annualVolatility: 15,
        inflationRate: 3,
        years: 30,
        numSimulations: 100,
      });

      for (const d of result.yearlyData) {
        expect(Number.isFinite(d.p10)).toBe(true);
        expect(Number.isFinite(d.p25)).toBe(true);
        expect(Number.isFinite(d.p50)).toBe(true);
        expect(Number.isFinite(d.p75)).toBe(true);
        expect(Number.isFinite(d.p90)).toBe(true);
        expect(Number.isFinite(d.contributions)).toBe(true);
      }

      expect(Number.isFinite(result.medianFinal)).toBe(true);
      expect(Number.isFinite(result.meanFinal)).toBe(true);
      expect(Number.isFinite(result.probabilityOfDoubling)).toBe(true);
      expect(Number.isFinite(result.probabilityOfLoss)).toBe(true);
    });

    it('contributions track correctly', () => {
      const result = runMonteCarloSimulation({
        initialValue: 10000,
        monthlyContribution: 500,
        annualReturn: 7,
        annualVolatility: 15,
        inflationRate: 0,
        years: 5,
        numSimulations: 50,
      });

      // Year 1: 10000 + 500*12 = 16000
      expect(result.yearlyData[0].contributions).toBe(16000);
      // Year 5: 10000 + 500*60 = 40000
      expect(result.yearlyData[4].contributions).toBe(40000);
    });

    it('inflation adjusts values downward', () => {
      const noInflation = runMonteCarloSimulation({
        initialValue: 100000,
        monthlyContribution: 0,
        annualReturn: 7,
        annualVolatility: 15,
        inflationRate: 0,
        years: 10,
        numSimulations: 500,
      });

      const withInflation = runMonteCarloSimulation({
        initialValue: 100000,
        monthlyContribution: 0,
        annualReturn: 7,
        annualVolatility: 15,
        inflationRate: 3,
        years: 10,
        numSimulations: 500,
      });

      // Inflation-adjusted p50 at year 10 should be lower
      expect(withInflation.yearlyData[9].p50).toBeLessThan(noInflation.yearlyData[9].p50);
    });

    it('handles zero volatility (deterministic)', () => {
      const result = runMonteCarloSimulation({
        initialValue: 10000,
        monthlyContribution: 500,
        annualReturn: 12,
        annualVolatility: 0,
        inflationRate: 0,
        years: 1,
        numSimulations: 100,
      });

      // All percentiles should be the same (deterministic)
      const d = result.yearlyData[0];
      expect(d.p10).toBeCloseTo(d.p90, 2);
      expect(d.p25).toBeCloseTo(d.p75, 2);
      expect(d.p50).toBeCloseTo(d.p10, 2);

      // Should match compound interest: 10000*(1.01)^12 + 500*((1.01^12 - 1)/0.01)
      const expectedLump = 10000 * Math.pow(1.01, 12);
      const expectedAnnuity = 500 * ((Math.pow(1.01, 12) - 1) / 0.01);
      expect(d.p50).toBeCloseTo(expectedLump + expectedAnnuity, 0);
    });

    it('probability of loss decreases with longer time horizons', () => {
      const short = runMonteCarloSimulation({
        initialValue: 10000,
        monthlyContribution: 500,
        annualReturn: 7,
        annualVolatility: 15,
        inflationRate: 0,
        years: 3,
        numSimulations: 500,
      });

      const long = runMonteCarloSimulation({
        initialValue: 10000,
        monthlyContribution: 500,
        annualReturn: 7,
        annualVolatility: 15,
        inflationRate: 0,
        years: 30,
        numSimulations: 500,
      });

      // With positive expected returns, longer horizons generally have lower loss probability
      expect(long.probabilityOfLoss).toBeLessThanOrEqual(short.probabilityOfLoss);
    });

    it('higher volatility produces wider spreads', () => {
      const lowVol = runMonteCarloSimulation({
        initialValue: 100000,
        monthlyContribution: 0,
        annualReturn: 7,
        annualVolatility: 5,
        inflationRate: 0,
        years: 20,
        numSimulations: 500,
      });

      const highVol = runMonteCarloSimulation({
        initialValue: 100000,
        monthlyContribution: 0,
        annualReturn: 7,
        annualVolatility: 25,
        inflationRate: 0,
        years: 20,
        numSimulations: 500,
      });

      const lowSpread = lowVol.yearlyData[19].p90 - lowVol.yearlyData[19].p10;
      const highSpread = highVol.yearlyData[19].p90 - highVol.yearlyData[19].p10;
      expect(highSpread).toBeGreaterThan(lowSpread);
    });

    it('30-year retirement projection is reasonable', () => {
      const result = runMonteCarloSimulation({
        initialValue: 100000,
        monthlyContribution: 500,
        annualReturn: 7,
        annualVolatility: 15,
        inflationRate: 0,
        years: 30,
        numSimulations: 500,
      });

      // Median should be in a reasonable range (around $1M-$2M for these inputs)
      expect(result.medianFinal).toBeGreaterThan(500_000);
      expect(result.medianFinal).toBeLessThan(5_000_000);

      // Mean should be >= median for log-normal distribution (positive skew)
      expect(result.meanFinal).toBeGreaterThanOrEqual(result.medianFinal * 0.9);
    });

    it('probability values are between 0 and 1', () => {
      const result = runMonteCarloSimulation({
        initialValue: 50000,
        monthlyContribution: 200,
        annualReturn: 7,
        annualVolatility: 15,
        inflationRate: 3,
        years: 20,
        numSimulations: 200,
      });

      expect(result.probabilityOfDoubling).toBeGreaterThanOrEqual(0);
      expect(result.probabilityOfDoubling).toBeLessThanOrEqual(1);
      expect(result.probabilityOfLoss).toBeGreaterThanOrEqual(0);
      expect(result.probabilityOfLoss).toBeLessThanOrEqual(1);
    });

    it('handles zero initial value with contributions', () => {
      const result = runMonteCarloSimulation({
        initialValue: 0,
        monthlyContribution: 1000,
        annualReturn: 7,
        annualVolatility: 15,
        inflationRate: 0,
        years: 10,
        numSimulations: 100,
      });

      expect(result.yearlyData).toHaveLength(10);
      // Should accumulate wealth from contributions
      expect(result.medianFinal).toBeGreaterThan(0);
      expect(result.yearlyData[0].contributions).toBe(12000);
    });

    it('handles zero contributions with initial value', () => {
      const result = runMonteCarloSimulation({
        initialValue: 100000,
        monthlyContribution: 0,
        annualReturn: 7,
        annualVolatility: 15,
        inflationRate: 0,
        years: 10,
        numSimulations: 100,
      });

      expect(result.yearlyData).toHaveLength(10);
      expect(result.yearlyData[0].contributions).toBe(100000);
      // Median should grow from initial due to positive returns
      expect(result.medianFinal).toBeGreaterThan(100000);
    });
  });
});
