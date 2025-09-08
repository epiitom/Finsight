// types/portfolio.ts
export type Exchange = 'NSE' | 'BSE';
export type DataQuality = 'complete' | 'partial' | 'basic';

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
  
  // Real-time market data
  cmp?: number;
  previousClose?: number;
  changePercent?: number;
  
  // Enhanced financial metrics
  peRatio?: number;
  forwardPE?: number;
  earningsPerShare?: number;
  forwardEPS?: number;
  marketCap?: number;
  dividendYield?: number;
  bookValue?: number;
  priceToBook?: number;
  beta?: number;
  fiftyTwoWeekHigh?: number;
  fiftyTwoWeekLow?: number;
  avgVolume?: number;
  
  // Calculated fields
  presentValue?: number;
  gainLoss?: number;
  gainLossPercentage?: number;
  
  // Data quality indicators
  dataQuality?: DataQuality;
  lastUpdated?: Date;
  isStale?: boolean;
  hasError?: boolean;
  errorMessage?: string;
  
  // Legacy support
  latestEarnings?: number; // Mapped from earningsPerShare for backward compatibility
}

export interface SectorSummary {
  sector: string;
  totalInvestment: number;
  totalPresentValue: number;
  gainLoss: number;
  gainLossPercentage: number;
  stocks: Stock[];
  stockCount: number;
  avgPERatio?: number;
  avgDividendYield?: number;
  topPerformer?: Stock;
  worstPerformer?: Stock;
}

export interface PortfolioData {
  stocks: Stock[];
  sectorSummaries: SectorSummary[];
  totalInvestment: number;
  totalPresentValue: number;
  totalGainLoss: number;
  totalGainLossPercentage: number;
  
  // Enhanced portfolio metrics
  portfolioMetrics: {
    avgPERatio?: number;
    avgDividendYield?: number;
    avgBeta?: number;
    totalMarketCap?: number;
    dataQualityDistribution: Record<DataQuality, number>;
    successfulStocks: number;
    failedStocks: number;
    staleStocks: number; // Fixed: Changed from 'stalestocks' to 'staleStocks'
  };
  
  // API performance data
  apiPerformance?: {
    lastUpdate: Date;
    responseTime?: number;
    cacheHitRate: string;
    fromCache: number;
    fromAPI: number;
    retryCount: number;
  };
}

// API Response interfaces
export interface StockPriceResponse {
  symbol: string;
  price: number;
  previousClose?: number;
  changePercent?: number;
  peRatio?: number;
  forwardPE?: number;
  earningsPerShare?: number;
  forwardEPS?: number;
  marketCap?: number;
  dividendYield?: number;
  bookValue?: number;
  priceToBook?: number;
  beta?: number;
  fiftyTwoWeekHigh?: number;
  fiftyTwoWeekLow?: number;
  avgVolume?: number;
  success: boolean;
  error?: string;
  fromCache?: boolean;
  dataQuality?: DataQuality;
}

export interface ApiResponse {
  results: StockPriceResponse[];
  summary: {
    total: number;
    successful: number;
    failed: number;
    fromCache: number;
    fromAPI: number;
    cacheHitRate: string;
    dataQuality: {
      complete: number;
      partial: number;
      basic: number;
    };
    financialMetrics: {
      withPE: number;
      withEPS: number;
      withDividend: number;
      withBookValue: number;
    };
  };
  cache: {
    size: number;
    maxSize: number;
  };
}

export interface ApiError {
  error: string;
  details?: string;
  requestId?: string;
}