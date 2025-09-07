// types/portfolio.ts

export type Exchange = 'NSE' | 'BSE';



export interface Stock {
 
  id: string;
  particulars: string; 
  symbol: string; 
  exchange: Exchange;
  sector: string;
  
  
  purchasePrice: number;
  quantity: number;
  
 
  investment: number; 
  portfolioPercentage: number; 
  

  cmp: number; 
  peRatio: number;
  latestEarnings: number;
  
  
  presentValue?: number; 
  gainLoss?: number; 
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