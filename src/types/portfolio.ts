export interface Stock {
  id: string;
  particulars: string; // Stock Name
  symbol: string; // Stock symbol for API calls
  purchasePrice: number;
  quantity: number;
  investment: number; // Purchase Price × Qty (calculated)
  portfolioPercentage: number; // Proportional weight
  exchange: 'NSE' | 'BSE';
  sector: string;
  cmp?: number; // Current Market Price (from Yahoo Finance)
  presentValue?: number; // CMP × Qty (calculated)
  gainLoss?: number; // Present Value - Investment (calculated)
  peRatio?: number; // From Google Finance
  latestEarnings?: string; // From Google Finance
}

export interface SectorSummary {
  sector: string;
  totalInvestment: number;
  totalPresentValue: number;
  gainLoss: number;
  stocks: Stock[];
}

export interface PortfolioData {
  stocks: Stock[];
  sectorSummaries: SectorSummary[];
  totalInvestment: number;
  totalPresentValue: number;
  totalGainLoss: number;
}