/**
 * Pure calculation functions for investment projections.
 * Extracted from InvestmentPlanner component for testability.
 */

export interface InvestmentProjection {
  futureValue: number;
  totalContributions: number;
  investmentGains: number;
  realValue: number;
}

export function calculateInvestmentProjection(
  portfolioValue: number,
  monthlyContribution: number,
  annualReturn: number,
  years: number,
  inflationRate: number
): InvestmentProjection {
  const monthlyRate = annualReturn / 100 / 12;
  const months = years * 12;

  let futureValue: number;

  if (monthlyRate === 0) {
    futureValue = portfolioValue + monthlyContribution * months;
  } else {
    // Future value of initial investment
    futureValue = portfolioValue * Math.pow(1 + monthlyRate, months);

    // Future value of monthly contributions (ordinary annuity)
    if (monthlyContribution > 0) {
      futureValue +=
        monthlyContribution * ((Math.pow(1 + monthlyRate, months) - 1) / monthlyRate);
    }
  }

  const totalContributions = portfolioValue + monthlyContribution * months;
  const investmentGains = futureValue - totalContributions;

  // Inflation-adjusted value
  const realValue = inflationRate === 0
    ? futureValue
    : futureValue / Math.pow(1 + inflationRate / 100, years);

  return {
    futureValue,
    totalContributions,
    investmentGains,
    realValue,
  };
}
