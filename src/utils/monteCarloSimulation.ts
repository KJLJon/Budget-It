/**
 * Monte Carlo simulation for investment projections.
 * Uses log-normal return model with Box-Muller transform for normal random variates.
 */

export interface MonteCarloParams {
  initialValue: number;
  monthlyContribution: number;
  annualReturn: number;       // Expected arithmetic return (e.g. 7 for 7%)
  annualVolatility: number;   // Standard deviation of annual returns (e.g. 15 for 15%)
  inflationRate: number;      // Annual inflation (e.g. 3 for 3%)
  years: number;
  numSimulations: number;
}

export interface YearlyPercentiles {
  year: number;
  p10: number;
  p25: number;
  p50: number;
  p75: number;
  p90: number;
  contributions: number;
}

export interface MonteCarloResult {
  yearlyData: YearlyPercentiles[];
  finalValues: number[];          // All final simulation values (sorted)
  medianFinal: number;
  meanFinal: number;
  probabilityOfDoubling: number;  // P(final > 2 * totalContributions)
  probabilityOfLoss: number;      // P(final < totalContributions)
}

/**
 * Box-Muller transform: generates a standard normal variate from two uniform randoms.
 * Accepts an optional RNG function for testability.
 */
export function boxMullerNormal(rng: () => number = Math.random): number {
  let u1 = rng();
  // Avoid log(0)
  while (u1 === 0) u1 = rng();
  const u2 = rng();
  return Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
}

/**
 * Run a single simulation path, returning the portfolio value at the end of each year.
 */
export function simulatePath(
  initialValue: number,
  monthlyContribution: number,
  monthlyLogMean: number,
  monthlyLogStd: number,
  years: number,
  rng: () => number = Math.random
): number[] {
  const yearlyValues: number[] = [];
  let balance = initialValue;

  for (let year = 1; year <= years; year++) {
    for (let month = 0; month < 12; month++) {
      // Log-normal monthly return
      const z = boxMullerNormal(rng);
      const monthlyReturn = Math.exp(monthlyLogMean + monthlyLogStd * z) - 1;
      balance = balance * (1 + monthlyReturn) + monthlyContribution;
      // Floor at 0 — portfolio can't go negative
      if (balance < 0) balance = 0;
    }
    yearlyValues.push(balance);
  }

  return yearlyValues;
}

/**
 * Convert user-facing annual return/volatility into monthly log-normal parameters.
 * The drift correction ensures E[arithmetic return] matches the user's input.
 */
export function computeMonthlyLogParams(
  annualReturn: number,
  annualVolatility: number
): { monthlyLogMean: number; monthlyLogStd: number } {
  const r = annualReturn / 100;
  const sigma = annualVolatility / 100;

  // Annual log return mean (drift-corrected for log-normal)
  const annualLogMean = Math.log(1 + r) - (sigma * sigma) / 2;

  // Monthly parameters
  const monthlyLogMean = annualLogMean / 12;
  const monthlyLogStd = sigma / Math.sqrt(12);

  return { monthlyLogMean, monthlyLogStd };
}

/**
 * Extract a percentile from a sorted array.
 * Uses linear interpolation between nearest ranks.
 */
export function percentile(sorted: number[], p: number): number {
  if (sorted.length === 0) return 0;
  if (sorted.length === 1) return sorted[0];

  const index = (p / 100) * (sorted.length - 1);
  const lower = Math.floor(index);
  const upper = Math.ceil(index);

  if (lower === upper) return sorted[lower];

  const fraction = index - lower;
  return sorted[lower] + fraction * (sorted[upper] - sorted[lower]);
}

/**
 * Run the full Monte Carlo simulation and return percentile bands per year.
 */
export function runMonteCarloSimulation(params: MonteCarloParams): MonteCarloResult {
  const {
    initialValue,
    monthlyContribution,
    annualReturn,
    annualVolatility,
    inflationRate,
    years,
    numSimulations,
  } = params;

  // Handle zero-volatility edge case: deterministic path
  if (annualVolatility === 0) {
    return runDeterministicSimulation(
      initialValue, monthlyContribution, annualReturn, inflationRate, years
    );
  }

  const { monthlyLogMean, monthlyLogStd } = computeMonthlyLogParams(annualReturn, annualVolatility);

  // Run all simulations, collecting yearly values
  // allPaths[sim][year] = portfolio value at end of that year
  const allPaths: number[][] = [];
  for (let sim = 0; sim < numSimulations; sim++) {
    allPaths.push(simulatePath(initialValue, monthlyContribution, monthlyLogMean, monthlyLogStd, years));
  }

  // Transpose: for each year, collect all simulation values and sort
  const yearlyData: YearlyPercentiles[] = [];
  for (let y = 0; y < years; y++) {
    const valuesAtYear = allPaths.map((path) => path[y]);
    valuesAtYear.sort((a, b) => a - b);

    const contributionsAtYear = initialValue + monthlyContribution * 12 * (y + 1);

    yearlyData.push({
      year: y + 1,
      p10: percentile(valuesAtYear, 10),
      p25: percentile(valuesAtYear, 25),
      p50: percentile(valuesAtYear, 50),
      p75: percentile(valuesAtYear, 75),
      p90: percentile(valuesAtYear, 90),
      contributions: contributionsAtYear,
    });
  }

  // Final year statistics
  const finalValues = allPaths.map((path) => path[years - 1]);
  finalValues.sort((a, b) => a - b);

  const totalContributions = initialValue + monthlyContribution * 12 * years;
  const meanFinal = finalValues.reduce((sum, v) => sum + v, 0) / finalValues.length;
  const medianFinal = percentile(finalValues, 50);

  const probabilityOfDoubling = finalValues.filter((v) => v >= 2 * totalContributions).length / finalValues.length;
  const probabilityOfLoss = finalValues.filter((v) => v < totalContributions).length / finalValues.length;

  // Apply inflation adjustment to percentile data
  if (inflationRate > 0) {
    const rate = inflationRate / 100;
    for (const d of yearlyData) {
      const factor = Math.pow(1 + rate, d.year);
      d.p10 /= factor;
      d.p25 /= factor;
      d.p50 /= factor;
      d.p75 /= factor;
      d.p90 /= factor;
      d.contributions /= factor;
    }
  }

  return {
    yearlyData,
    finalValues,
    medianFinal,
    meanFinal,
    probabilityOfDoubling,
    probabilityOfLoss,
  };
}

/**
 * Deterministic path when volatility is 0.
 */
function runDeterministicSimulation(
  initialValue: number,
  monthlyContribution: number,
  annualReturn: number,
  inflationRate: number,
  years: number,
): MonteCarloResult {
  const monthlyRate = annualReturn / 100 / 12;
  const yearlyData: YearlyPercentiles[] = [];
  let balance = initialValue;

  for (let y = 1; y <= years; y++) {
    for (let m = 0; m < 12; m++) {
      balance = balance * (1 + monthlyRate) + monthlyContribution;
    }

    const contributions = initialValue + monthlyContribution * 12 * y;
    let value = balance;

    if (inflationRate > 0) {
      const factor = Math.pow(1 + inflationRate / 100, y);
      value /= factor;
    }

    yearlyData.push({
      year: y,
      p10: value,
      p25: value,
      p50: value,
      p75: value,
      p90: value,
      contributions: inflationRate > 0
        ? contributions / Math.pow(1 + inflationRate / 100, y)
        : contributions,
    });
  }

  const totalContributions = initialValue + monthlyContribution * 12 * years;

  return {
    yearlyData,
    finalValues: [balance],
    medianFinal: balance,
    meanFinal: balance,
    probabilityOfDoubling: balance >= 2 * totalContributions ? 1 : 0,
    probabilityOfLoss: balance < totalContributions ? 1 : 0,
  };
}
