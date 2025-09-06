// hooks/usePortfolio.ts
import { useState, useEffect, useCallback } from 'react';
import { Stock, PortfolioData } from '../types/portfolio';
import { mockStocks, mockApiDelay } from '../data/mockData';
import { stockApiService, StockPriceData, StockFundamentalData } from '../services/Stockapi';
import { 
  calculateStockMetrics, 
  calculatePortfolioPercentages, 
  groupStocksBySector 
} from '../utils/calculations';

export const usePortfolio = () => {
  const [portfolioData, setPortfolioData] = useState<PortfolioData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());
  const [isRealDataEnabled, setIsRealDataEnabled] = useState<boolean>(false); // Toggle for demo

  const processStockData = useCallback(async (rawStocks: typeof mockStocks, useRealData: boolean = false): Promise<PortfolioData> => {
    let processedStocks: Stock[] = [];

    if (useRealData) {
      try {
        // Fetch real data from APIs
        const symbols = rawStocks.map(stock => stock.symbol);
        const apiDataMap = await stockApiService.batchGetStockData(symbols);

        processedStocks = rawStocks.map(stock => {
          const apiData = apiDataMap.get(stock.symbol);
          
          return {
            ...stock,
            cmp: apiData?.price?.currentPrice || stock.cmp,
            peRatio: apiData?.fundamentals?.peRatio || stock.peRatio,
            latestEarnings: apiData?.fundamentals?.latestEarnings || stock.latestEarnings,
          };
        }) as Stock[];
      } catch (apiError) {
        console.error('API fetch failed, using mock data:', apiError);
        // Fallback to mock data with variations
        processedStocks = rawStocks.map(stock => ({
          ...stock,
          cmp: stock.cmp ? stock.cmp + (Math.random() - 0.5) * 10 : stock.cmp, // ±5 price variation
        })) as Stock[];
      }
    } else {
      // Use mock data with slight variations for demo
      processedStocks = rawStocks.map(stock => ({
        ...stock,
        cmp: stock.cmp ? stock.cmp + (Math.random() - 0.5) * 10 : stock.cmp, // ±5 price variation
      })) as Stock[];
    }

    // Calculate metrics for each stock
    processedStocks = processedStocks.map(calculateStockMetrics);
    
    // Calculate portfolio percentages
    processedStocks = calculatePortfolioPercentages(processedStocks);
    
    // Group by sectors
    const sectorSummaries = groupStocksBySector(processedStocks);
    
    // Calculate totals
    const totalInvestment = processedStocks.reduce((sum, stock) => sum + stock.investment, 0);
    const totalPresentValue = processedStocks.reduce((sum, stock) => sum + (stock.presentValue || 0), 0);
    const totalGainLoss = totalPresentValue - totalInvestment;

    return {
      stocks: processedStocks,
      sectorSummaries,
      totalInvestment,
      totalPresentValue,
      totalGainLoss,
    };
  }, []);

  const fetchPortfolioData = useCallback(async (useRealData: boolean = isRealDataEnabled) => {
    try {
      setLoading(true);
      setError(null);
      
      if (!useRealData) {
        // Simulate API delay for mock data
        await mockApiDelay(500);
      }
      
      const processedData = await processStockData(mockStocks, useRealData);
      setPortfolioData(processedData);
      setLastUpdate(new Date());
    } catch (err) {
      const errorMessage = useRealData 
        ? 'API temporarily unavailable. Using demo data with realistic price movements.' 
        : 'Failed to fetch portfolio data';
      setError(errorMessage);
      console.error('Portfolio fetch error:', err);
      
      // Fallback to mock data if real API fails
      if (useRealData) {
        try {
          const fallbackData = await processStockData(mockStocks, false);
          setPortfolioData(fallbackData);
          setLastUpdate(new Date());
        } catch (fallbackErr) {
          console.error('Fallback also failed:', fallbackErr);
        }
      }
    } finally {
      setLoading(false);
    }
  }, [isRealDataEnabled, processStockData]);

  const toggleRealData = useCallback(() => {
    setIsRealDataEnabled(prev => !prev);
  }, []);

  // Initial load
  useEffect(() => {
    fetchPortfolioData();
  }, [fetchPortfolioData]);

  // Auto-refresh every 15 seconds (as required)
  useEffect(() => {
    if (!portfolioData) return;

    const interval = setInterval(() => {
      fetchPortfolioData(isRealDataEnabled);
    }, 15000); // 15 seconds

    return () => clearInterval(interval);
  }, [portfolioData, isRealDataEnabled, fetchPortfolioData]);

  return {
    portfolioData,
    loading,
    error,
    lastUpdate,
    isRealDataEnabled,
    refreshData: () => fetchPortfolioData(isRealDataEnabled),
    toggleRealData,
  };
};