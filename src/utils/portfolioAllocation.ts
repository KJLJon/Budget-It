/**
 * Portfolio allocation algorithm
 * Provides personalized asset allocation recommendations based on age, time horizon, and goals
 */

import { differenceInYears } from 'date-fns';
import { getETFsByAssetClass } from './etfData';

export interface PortfolioInputs {
  birthdate: string; // ISO date string
  firstWithdrawalDate: string; // ISO date string
  annualWithdrawal: number;
  portfolioAmount: number;
}

export interface AssetAllocation {
  assetClass: string;
  percentage: number;
  amount: number;
  description: string;
}

export interface ETFRecommendation {
  ticker: string;
  name: string;
  provider: string;
  percentage: number;
  amount: number;
  expenseRatio: number;
  description: string;
}

export interface PortfolioRecommendation {
  allocations: AssetAllocation[];
  etfRecommendations: ETFRecommendation[];
  rationale: string[];
  riskLevel: 'Conservative' | 'Moderate' | 'Balanced' | 'Growth' | 'Aggressive';
  withdrawalRate: number; // percentage
  isSustainable: boolean;
}

/**
 * Calculate recommended portfolio allocation
 */
export function calculatePortfolioAllocation(inputs: PortfolioInputs): PortfolioRecommendation {
  const age = differenceInYears(new Date(), new Date(inputs.birthdate));
  const yearsUntilWithdrawal = differenceInYears(new Date(inputs.firstWithdrawalDate), new Date());
  const withdrawalRate = inputs.portfolioAmount > 0
    ? (inputs.annualWithdrawal / inputs.portfolioAmount) * 100
    : 0;

  // Determine risk level and allocation
  const { stockPercentage, bondPercentage, cashPercentage, riskLevel, rationale } =
    determineAllocation(age, yearsUntilWithdrawal, withdrawalRate);

  // Break down stocks into US and International
  const usStockPercentage = stockPercentage * 0.70; // 70% US
  const intlStockPercentage = stockPercentage * 0.30; // 30% International

  // Create asset allocations
  const allocations: AssetAllocation[] = [
    {
      assetClass: 'US Stocks',
      percentage: usStockPercentage,
      amount: inputs.portfolioAmount * (usStockPercentage / 100),
      description: 'Domestic equity for growth and dividend income',
    },
    {
      assetClass: 'International Stocks',
      percentage: intlStockPercentage,
      amount: inputs.portfolioAmount * (intlStockPercentage / 100),
      description: 'Global diversification and exposure to developed/emerging markets',
    },
    {
      assetClass: 'Bonds',
      percentage: bondPercentage,
      amount: inputs.portfolioAmount * (bondPercentage / 100),
      description: 'Fixed income for stability and income generation',
    },
  ];

  // Add cash if recommended
  if (cashPercentage > 0) {
    allocations.push({
      assetClass: 'Cash',
      percentage: cashPercentage,
      amount: inputs.portfolioAmount * (cashPercentage / 100),
      description: 'Liquidity and emergency reserves',
    });
  }

  // Generate ETF recommendations
  const etfRecommendations = generateETFRecommendations(
    usStockPercentage,
    intlStockPercentage,
    bondPercentage,
    cashPercentage,
    inputs.portfolioAmount,
    yearsUntilWithdrawal
  );

  // Check if withdrawal rate is sustainable (4% rule as baseline)
  const isSustainable = withdrawalRate <= 4.5;
  if (!isSustainable) {
    rationale.push(
      `⚠️ Warning: Your withdrawal rate of ${withdrawalRate.toFixed(1)}% exceeds the commonly recommended 4% rule, which may not be sustainable long-term.`
    );
  }

  return {
    allocations,
    etfRecommendations,
    rationale,
    riskLevel,
    withdrawalRate,
    isSustainable,
  };
}

/**
 * Determine optimal allocation based on investor profile
 */
function determineAllocation(
  age: number,
  yearsUntilWithdrawal: number,
  withdrawalRate: number
): {
  stockPercentage: number;
  bondPercentage: number;
  cashPercentage: number;
  riskLevel: 'Conservative' | 'Moderate' | 'Balanced' | 'Growth' | 'Aggressive';
  rationale: string[];
} {
  const rationale: string[] = [];

  // Use time horizon as primary factor
  let stockPercentage: number;
  let bondPercentage: number;
  let cashPercentage: number;
  let riskLevel: 'Conservative' | 'Moderate' | 'Balanced' | 'Growth' | 'Aggressive';

  if (yearsUntilWithdrawal > 20) {
    // Long time horizon - aggressive growth
    stockPercentage = 90;
    bondPercentage = 10;
    cashPercentage = 0;
    riskLevel = 'Aggressive';
    rationale.push(`With ${yearsUntilWithdrawal} years until withdrawal, you have time to ride out market volatility.`);
    rationale.push('A growth-focused allocation maximizes long-term returns.');
  } else if (yearsUntilWithdrawal > 15) {
    // Still long horizon - growth focused
    stockPercentage = 80;
    bondPercentage = 20;
    cashPercentage = 0;
    riskLevel = 'Growth';
    rationale.push(`${yearsUntilWithdrawal} years provides good time for stock market growth.`);
    rationale.push('20% bonds provide some stability while maintaining growth potential.');
  } else if (yearsUntilWithdrawal > 10) {
    // Moderate horizon - balanced approach
    stockPercentage = 70;
    bondPercentage = 25;
    cashPercentage = 5;
    riskLevel = 'Balanced';
    rationale.push(`With ${yearsUntilWithdrawal} years until withdrawals, a balanced approach is appropriate.`);
    rationale.push('Beginning to add bonds and cash for stability as you approach retirement.');
  } else if (yearsUntilWithdrawal > 5) {
    // Approaching withdrawal - moderate
    stockPercentage = 60;
    bondPercentage = 30;
    cashPercentage = 10;
    riskLevel = 'Moderate';
    rationale.push(`${yearsUntilWithdrawal} years until withdrawals - reducing equity risk.`);
    rationale.push('Building cash reserves for near-term needs.');
  } else if (yearsUntilWithdrawal > 0) {
    // Near-term withdrawal - conservative
    stockPercentage = 50;
    bondPercentage = 35;
    cashPercentage = 15;
    riskLevel = 'Moderate';
    rationale.push(`With withdrawals starting in ${yearsUntilWithdrawal} years, maintaining some growth while prioritizing stability.`);
    rationale.push('Increased cash allocation for upcoming withdrawal needs.');
  } else {
    // Already withdrawing - conservative with income focus
    const yearsIntoWithdrawal = Math.abs(yearsUntilWithdrawal);

    // Use age-based rule: 110 - age for stocks (more modern than 100 - age)
    stockPercentage = Math.max(110 - age, 40); // minimum 40% stocks even in late retirement
    bondPercentage = Math.min(60 - stockPercentage, 50);
    cashPercentage = 100 - stockPercentage - bondPercentage;
    riskLevel = 'Conservative';

    if (yearsIntoWithdrawal === 0) {
      rationale.push('You are at the start of your withdrawal phase.');
    } else {
      rationale.push(`You are ${yearsIntoWithdrawal} years into your withdrawal phase.`);
    }
    rationale.push('Maintaining growth assets to combat inflation over a potentially long retirement.');
    rationale.push(`At age ${age}, ${stockPercentage}% stocks provides balance between growth and stability.`);
  }

  // Adjust for high withdrawal rates
  if (withdrawalRate > 5) {
    // Need more conservative allocation if withdrawal rate is high
    const adjustment = Math.min(10, withdrawalRate - 5);
    stockPercentage = Math.max(stockPercentage - adjustment, 30);
    bondPercentage += adjustment / 2;
    cashPercentage += adjustment / 2;
    rationale.push(`⚠️ Higher withdrawal rate requires more conservative allocation for sustainability.`);
  }

  // Round to nearest 5%
  stockPercentage = Math.round(stockPercentage / 5) * 5;
  bondPercentage = Math.round(bondPercentage / 5) * 5;
  cashPercentage = 100 - stockPercentage - bondPercentage;

  return {
    stockPercentage,
    bondPercentage,
    cashPercentage,
    riskLevel,
    rationale,
  };
}

/**
 * Generate specific ETF recommendations
 */
function generateETFRecommendations(
  usStockPct: number,
  intlStockPct: number,
  bondPct: number,
  cashPct: number,
  portfolioAmount: number,
  yearsUntilWithdrawal: number
): ETFRecommendation[] {
  const recommendations: ETFRecommendation[] = [];

  // US Stocks - prefer broad market
  if (usStockPct > 0) {
    const usStockETFs = getETFsByAssetClass('us_stock_broad');
    // Prefer Schwab for low costs
    const schb = usStockETFs.find(etf => etf.ticker === 'SCHB');
    if (schb) {
      recommendations.push({
        ticker: schb.ticker,
        name: schb.name,
        provider: schb.provider,
        percentage: usStockPct,
        amount: portfolioAmount * (usStockPct / 100),
        expenseRatio: schb.expenseRatio,
        description: schb.description,
      });
    }
  }

  // International Stocks
  if (intlStockPct > 0) {
    if (intlStockPct >= 15) {
      // Use total international for larger allocations
      const vxus = getETFsByAssetClass('intl_stock_total').find(etf => etf.ticker === 'VXUS');
      if (vxus) {
        recommendations.push({
          ticker: vxus.ticker,
          name: vxus.name,
          provider: vxus.provider,
          percentage: intlStockPct,
          amount: portfolioAmount * (intlStockPct / 100),
          expenseRatio: vxus.expenseRatio,
          description: vxus.description,
        });
      }
    } else {
      // Small allocation - use total international
      const intlETFs = getETFsByAssetClass('intl_stock_total');
      const vxus = intlETFs.find(etf => etf.ticker === 'VXUS');
      if (vxus) {
        recommendations.push({
          ticker: vxus.ticker,
          name: vxus.name,
          provider: vxus.provider,
          percentage: intlStockPct,
          amount: portfolioAmount * (intlStockPct / 100),
          expenseRatio: vxus.expenseRatio,
          description: vxus.description,
        });
      }
    }
  }

  // Bonds
  if (bondPct > 0) {
    if (yearsUntilWithdrawal < 5) {
      // Near retirement - mix of total market and short-term for stability
      const totalBondPct = bondPct * 0.60;
      const shortTermPct = bondPct * 0.40;

      const bnd = getETFsByAssetClass('bond_total').find(etf => etf.ticker === 'BND');
      if (bnd) {
        recommendations.push({
          ticker: bnd.ticker,
          name: bnd.name,
          provider: bnd.provider,
          percentage: totalBondPct,
          amount: portfolioAmount * (totalBondPct / 100),
          expenseRatio: bnd.expenseRatio,
          description: bnd.description,
        });
      }

      const vgsh = getETFsByAssetClass('bond_short_term').find(etf => etf.ticker === 'VGSH');
      if (vgsh) {
        recommendations.push({
          ticker: vgsh.ticker,
          name: vgsh.name,
          provider: vgsh.provider,
          percentage: shortTermPct,
          amount: portfolioAmount * (shortTermPct / 100),
          expenseRatio: vgsh.expenseRatio,
          description: vgsh.description,
        });
      }
    } else {
      // Long time horizon - use total bond market
      const schz = getETFsByAssetClass('bond_total').find(etf => etf.ticker === 'SCHZ');
      if (schz) {
        recommendations.push({
          ticker: schz.ticker,
          name: schz.name,
          provider: schz.provider,
          percentage: bondPct,
          amount: portfolioAmount * (bondPct / 100),
          expenseRatio: schz.expenseRatio,
          description: schz.description,
        });
      }
    }
  }

  // Cash - just note it as recommendation
  if (cashPct > 0) {
    recommendations.push({
      ticker: 'CASH',
      name: 'High-Yield Savings or Money Market',
      provider: 'Various',
      percentage: cashPct,
      amount: portfolioAmount * (cashPct / 100),
      expenseRatio: 0,
      description: 'Keep in high-yield savings account or money market fund for immediate liquidity',
    });
  }

  return recommendations;
}
