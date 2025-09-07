// types/portfolio.ts

/**
 * Stock exchange types used in Indian markets
 */
export type Exchange = 'NSE' | 'BSE';

/**
 * Core stock information that matches the actual data structure
 */
export interface Stock {
  // Static identifiers (from mock data)
  id: string;
  particulars: string; // Stock Name
  symbol: string; // Stock symbol for API calls (e.g., 'RELIANCE')
  exchange: Exchange;
  sector: string; // Keep as string for flexibility
  
  // Purchase information (from mock data)
  purchasePrice: number;
  quantity: number;
  
  // Calculated fields (computed by utils)
  investment: number; // purchasePrice × quantity
  portfolioPercentage: number; // calculated percentage of total portfolio
  
  // Live market data (from API, can be 0 if API fails)
  cmp: number; // Current Market Price
  peRatio: number; // Price to Earnings ratio
  latestEarnings: number; // Latest earnings as number (not string)
  
  // Calculated live fields (computed by utils, optional for when API fails)
  presentValue?: number; // cmp × quantity
  gainLoss?: number; // presentValue - investment
}

/**
 * Sector summary matching actual usage in calculations
 */
export interface SectorSummary {
  sector: string;
  totalInvestment: number;
  totalPresentValue: number;
  gainLoss: number;
  stocks: Stock[];
}

/**
 * Complete portfolio data structure matching hook implementation
 */
export interface PortfolioData {
  stocks: Stock[];
  sectorSummaries: SectorSummary[];
  totalInvestment: number;
  totalPresentValue: number;
  totalGainLoss: number;
}