/**
 * Reference data for common low-cost ETFs
 * Used for portfolio allocation recommendations
 */

export type AssetClassType =
  | 'us_stock_broad'
  | 'us_stock_large'
  | 'us_stock_mid'
  | 'us_stock_small'
  | 'intl_stock_developed'
  | 'intl_stock_emerging'
  | 'intl_stock_total'
  | 'bond_total'
  | 'bond_govt'
  | 'bond_corporate'
  | 'bond_tips'
  | 'bond_short_term'
  | 'bond_intl'
  | 'cash';

export interface ETFInfo {
  ticker: string;
  name: string;
  provider: 'Schwab' | 'Vanguard' | 'iShares' | 'Fidelity' | 'SPDR';
  assetClass: AssetClassType;
  expenseRatio: number; // in percentage (e.g., 0.03 = 0.03%)
  description: string;
}

export const ETF_DATABASE: ETFInfo[] = [
  // ========== US STOCKS - BROAD MARKET ==========
  {
    ticker: 'SCHB',
    name: 'Schwab U.S. Broad Market ETF',
    provider: 'Schwab',
    assetClass: 'us_stock_broad',
    expenseRatio: 0.03,
    description: 'Tracks total U.S. stock market including large, mid, and small cap stocks',
  },
  {
    ticker: 'VTI',
    name: 'Vanguard Total Stock Market ETF',
    provider: 'Vanguard',
    assetClass: 'us_stock_broad',
    expenseRatio: 0.03,
    description: 'Tracks the entire U.S. stock market across all capitalizations',
  },
  {
    ticker: 'ITOT',
    name: 'iShares Core S&P Total U.S. Stock Market ETF',
    provider: 'iShares',
    assetClass: 'us_stock_broad',
    expenseRatio: 0.03,
    description: 'Broad exposure to U.S. stocks across all market segments',
  },

  // ========== US STOCKS - LARGE CAP ==========
  {
    ticker: 'SCHX',
    name: 'Schwab U.S. Large-Cap ETF',
    provider: 'Schwab',
    assetClass: 'us_stock_large',
    expenseRatio: 0.03,
    description: 'Tracks the largest 750 U.S. publicly traded companies',
  },
  {
    ticker: 'VOO',
    name: 'Vanguard S&P 500 ETF',
    provider: 'Vanguard',
    assetClass: 'us_stock_large',
    expenseRatio: 0.03,
    description: 'Tracks the S&P 500 Index of large-cap U.S. stocks',
  },
  {
    ticker: 'IVV',
    name: 'iShares Core S&P 500 ETF',
    provider: 'iShares',
    assetClass: 'us_stock_large',
    expenseRatio: 0.03,
    description: 'S&P 500 tracking with strong liquidity',
  },

  // ========== US STOCKS - MID CAP ==========
  {
    ticker: 'SCHM',
    name: 'Schwab U.S. Mid-Cap ETF',
    provider: 'Schwab',
    assetClass: 'us_stock_mid',
    expenseRatio: 0.04,
    description: 'Mid-cap U.S. stocks with growth potential',
  },
  {
    ticker: 'VO',
    name: 'Vanguard Mid-Cap ETF',
    provider: 'Vanguard',
    assetClass: 'us_stock_mid',
    expenseRatio: 0.04,
    description: 'Mid-cap blend of U.S. companies',
  },

  // ========== US STOCKS - SMALL CAP ==========
  {
    ticker: 'SCHA',
    name: 'Schwab U.S. Small-Cap ETF',
    provider: 'Schwab',
    assetClass: 'us_stock_small',
    expenseRatio: 0.04,
    description: 'Small-cap U.S. stocks with higher growth potential and volatility',
  },
  {
    ticker: 'VB',
    name: 'Vanguard Small-Cap ETF',
    provider: 'Vanguard',
    assetClass: 'us_stock_small',
    expenseRatio: 0.05,
    description: 'Small-cap U.S. stocks across growth and value styles',
  },

  // ========== INTERNATIONAL STOCKS - TOTAL ==========
  {
    ticker: 'VXUS',
    name: 'Vanguard Total International Stock ETF',
    provider: 'Vanguard',
    assetClass: 'intl_stock_total',
    expenseRatio: 0.08,
    description: 'Total international stock market including developed and emerging markets',
  },
  {
    ticker: 'IXUS',
    name: 'iShares Core MSCI Total International Stock ETF',
    provider: 'iShares',
    assetClass: 'intl_stock_total',
    expenseRatio: 0.09,
    description: 'Broad international equity exposure excluding U.S.',
  },

  // ========== INTERNATIONAL STOCKS - DEVELOPED ==========
  {
    ticker: 'SCHF',
    name: 'Schwab International Equity ETF',
    provider: 'Schwab',
    assetClass: 'intl_stock_developed',
    expenseRatio: 0.06,
    description: 'Developed market international stocks (Europe, Pacific, Canada)',
  },
  {
    ticker: 'VEA',
    name: 'Vanguard FTSE Developed Markets ETF',
    provider: 'Vanguard',
    assetClass: 'intl_stock_developed',
    expenseRatio: 0.05,
    description: 'Large and mid-cap stocks in developed markets outside North America',
  },
  {
    ticker: 'IEFA',
    name: 'iShares Core MSCI EAFE ETF',
    provider: 'iShares',
    assetClass: 'intl_stock_developed',
    expenseRatio: 0.07,
    description: 'Developed markets in Europe, Australasia, and Far East',
  },

  // ========== INTERNATIONAL STOCKS - EMERGING ==========
  {
    ticker: 'SCHE',
    name: 'Schwab Emerging Markets Equity ETF',
    provider: 'Schwab',
    assetClass: 'intl_stock_emerging',
    expenseRatio: 0.11,
    description: 'Emerging market stocks (China, India, Brazil, etc.)',
  },
  {
    ticker: 'VWO',
    name: 'Vanguard FTSE Emerging Markets ETF',
    provider: 'Vanguard',
    assetClass: 'intl_stock_emerging',
    expenseRatio: 0.08,
    description: 'Large and mid-cap stocks in emerging markets',
  },
  {
    ticker: 'IEMG',
    name: 'iShares Core MSCI Emerging Markets ETF',
    provider: 'iShares',
    assetClass: 'intl_stock_emerging',
    expenseRatio: 0.09,
    description: 'Broad emerging markets equity exposure',
  },

  // ========== BONDS - TOTAL MARKET ==========
  {
    ticker: 'SCHZ',
    name: 'Schwab U.S. Aggregate Bond ETF',
    provider: 'Schwab',
    assetClass: 'bond_total',
    expenseRatio: 0.04,
    description: 'Total U.S. investment-grade bond market (government, corporate, mortgage-backed)',
  },
  {
    ticker: 'BND',
    name: 'Vanguard Total Bond Market ETF',
    provider: 'Vanguard',
    assetClass: 'bond_total',
    expenseRatio: 0.03,
    description: 'Broad U.S. bond market including government, corporate, and securitized debt',
  },
  {
    ticker: 'AGG',
    name: 'iShares Core U.S. Aggregate Bond ETF',
    provider: 'iShares',
    assetClass: 'bond_total',
    expenseRatio: 0.03,
    description: 'Tracks the Bloomberg U.S. Aggregate Bond Index',
  },

  // ========== BONDS - GOVERNMENT ==========
  {
    ticker: 'GOVT',
    name: 'iShares U.S. Treasury Bond ETF',
    provider: 'iShares',
    assetClass: 'bond_govt',
    expenseRatio: 0.05,
    description: 'U.S. Treasury bonds across all maturities',
  },
  {
    ticker: 'SCHR',
    name: 'Schwab Intermediate-Term U.S. Treasury ETF',
    provider: 'Schwab',
    assetClass: 'bond_govt',
    expenseRatio: 0.03,
    description: 'Intermediate-term U.S. Treasury securities (3-10 years)',
  },

  // ========== BONDS - TIPS (INFLATION PROTECTED) ==========
  {
    ticker: 'SCHP',
    name: 'Schwab U.S. TIPS ETF',
    provider: 'Schwab',
    assetClass: 'bond_tips',
    expenseRatio: 0.04,
    description: 'Treasury Inflation-Protected Securities for inflation hedge',
  },
  {
    ticker: 'VTIP',
    name: 'Vanguard Short-Term Inflation-Protected Securities ETF',
    provider: 'Vanguard',
    assetClass: 'bond_tips',
    expenseRatio: 0.04,
    description: 'Short-term TIPS with 0-5 year maturity for inflation protection',
  },
  {
    ticker: 'TIP',
    name: 'iShares TIPS Bond ETF',
    provider: 'iShares',
    assetClass: 'bond_tips',
    expenseRatio: 0.19,
    description: 'Inflation-protected U.S. Treasury securities',
  },

  // ========== BONDS - SHORT TERM ==========
  {
    ticker: 'SCHO',
    name: 'Schwab Short-Term U.S. Treasury ETF',
    provider: 'Schwab',
    assetClass: 'bond_short_term',
    expenseRatio: 0.03,
    description: 'Short-term U.S. Treasuries (1-3 years) for stability',
  },
  {
    ticker: 'VGSH',
    name: 'Vanguard Short-Term Treasury ETF',
    provider: 'Vanguard',
    assetClass: 'bond_short_term',
    expenseRatio: 0.04,
    description: 'Short-term government bonds with low interest rate risk',
  },
  {
    ticker: 'SHV',
    name: 'iShares Short Treasury Bond ETF',
    provider: 'iShares',
    assetClass: 'bond_short_term',
    expenseRatio: 0.15,
    description: 'Very short-term U.S. Treasury securities (0-1 year)',
  },

  // ========== BONDS - INTERNATIONAL ==========
  {
    ticker: 'BNDX',
    name: 'Vanguard Total International Bond ETF',
    provider: 'Vanguard',
    assetClass: 'bond_intl',
    expenseRatio: 0.07,
    description: 'Investment-grade international bonds hedged to USD for global diversification',
  },
  {
    ticker: 'IAGG',
    name: 'iShares Core International Aggregate Bond ETF',
    provider: 'iShares',
    assetClass: 'bond_intl',
    expenseRatio: 0.07,
    description: 'Broad international bond exposure from developed markets',
  },
];

/**
 * Get ETFs by asset class type
 */
export function getETFsByAssetClass(assetClass: AssetClassType): ETFInfo[] {
  return ETF_DATABASE.filter(etf => etf.assetClass === assetClass);
}

/**
 * Get ETF by ticker symbol
 */
export function getETFByTicker(ticker: string): ETFInfo | undefined {
  return ETF_DATABASE.find(etf => etf.ticker.toUpperCase() === ticker.toUpperCase());
}

/**
 * Get all available providers
 */
export function getProviders(): string[] {
  return [...new Set(ETF_DATABASE.map(etf => etf.provider))];
}

/**
 * Get ETFs by provider
 */
export function getETFsByProvider(provider: string): ETFInfo[] {
  return ETF_DATABASE.filter(etf => etf.provider === provider);
}
