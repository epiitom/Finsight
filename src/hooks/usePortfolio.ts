/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-vars */
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
  const [isRealDataEnabled, setIsRealDataEnabled] = useState<boolean>(true); // ✅ Enable real data by default
  const [apiCallCount, setApiCallCount] = useState<number>(0); // For debugging

  // Direct API call to your working endpoint
  const fetchRealStockPrices = async (symbols: string[]) => {
    try {
      console.log('🚀 Calling real API with symbols:', symbols);
      
      const response = await fetch('/api/stocks/prices', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Cache-Control': 'no-cache'
        },
        body: JSON.stringify({ symbols })
      });

      if (!response.ok) {
        throw new Error(`API responded with status: ${response.status}`);
      }

      const data = await response.json();
      console.log('✅ Real API response:', data);
      
      setApiCallCount(prev => prev + 1);
      return data.results || [];
    } catch (error) {
      console.error('❌ Real API call failed:', error);
      throw error;
    }
  };

  const processStockData = useCallback(async (rawStocks: typeof mockStocks, useRealData: boolean = false): Promise<PortfolioData> => {
    let processedStocks: Stock[] = [];

    if (useRealData) {
      try {
        console.log('🔄 Fetching real data for', rawStocks.length, 'stocks');
        
        // Get symbols from mock stocks
        const symbols = rawStocks.map(stock => stock.symbol);
        
        // Call your working API endpoint directly
        const realPrices = await fetchRealStockPrices(symbols);
        
        // Map real prices to stocks
        const priceMap = new Map();
        realPrices.forEach((item: any) => {
          if (item.success && item.price > 0) {
            priceMap.set(item.symbol, {
              currentPrice: item.price,
              previousClose: item.previousClose,
              changePercent: item.changePercent
            });
          }
        });

        console.log('📊 Price map:', priceMap);

        processedStocks = rawStocks.map(stock => {
          const realPrice = priceMap.get(stock.symbol);
          
          if (realPrice) {
            return {
              ...stock,
              cmp: realPrice.currentPrice,
              // Keep other data from mock since Yahoo doesn't provide PE, etc.
              peRatio: stock.peRatio,
              latestEarnings: stock.latestEarnings,
            };
          } else {
            console.warn(`⚠️ No real price found for ${stock.symbol}, using mock price`);
            return {
              ...stock,
              cmp: (stock.cmp ?? 0) + (Math.random() - 0.5) * 10, // Add variation to show it's different
            };
          }
        }) as Stock[];
        
        console.log('✅ Successfully processed real data for', processedStocks.length, 'stocks');
        
      } catch (apiError) {
        console.error('❌ Real API failed, using mock data:', apiError);
        setError('API temporarily unavailable. Using demo data.');
        
        // Fallback to mock data with variations
        processedStocks = rawStocks.map(stock => ({
          ...stock,
          cmp: stock.cmp ? stock.cmp + (Math.random() - 0.5) * 10 : stock.cmp,
        })) as Stock[];
      }
    } else {
      console.log('📝 Using mock data');
      // Use mock data with slight variations
      processedStocks = rawStocks.map(stock => ({
        ...stock,
        cmp: stock.cmp ? stock.cmp + (Math.random() - 0.5) * 10 : stock.cmp,
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
      
      console.log(`🔄 Fetching portfolio data - Real data: ${useRealData}`);
      
      const processedData = await processStockData(mockStocks, useRealData);
      setPortfolioData(processedData);
      setLastUpdate(new Date());
      
      console.log('✅ Portfolio data updated successfully');
    } catch (err) {
      const errorMessage = 'Failed to fetch portfolio data';
      setError(errorMessage);
      console.error('❌ Portfolio fetch error:', err);
    } finally {
      setLoading(false);
    }
  }, [isRealDataEnabled, processStockData]);

  const toggleRealData = useCallback(() => {
    const newValue = !isRealDataEnabled;
    console.log(`🔄 Toggling real data: ${isRealDataEnabled} → ${newValue}`);
    setIsRealDataEnabled(newValue);
    // Immediately fetch with new setting
    fetchPortfolioData(newValue);
  }, [isRealDataEnabled, fetchPortfolioData]);

  const forceRefresh = useCallback(() => {
    console.log('🔄 Force refreshing data...');
    fetchPortfolioData(isRealDataEnabled);
  }, [fetchPortfolioData, isRealDataEnabled]);

  // Initial load
  useEffect(() => {
    console.log('🚀 Initial portfolio data load');
    fetchPortfolioData();
  }, []); // Remove fetchPortfolioData dependency to avoid infinite loop

  // Auto-refresh every 30 seconds (increased from 15s to reduce API calls)
  useEffect(() => {
    if (!portfolioData) return;

    console.log('⏰ Setting up auto-refresh interval');
    const interval = setInterval(() => {
      console.log('⏰ Auto-refresh triggered');
      fetchPortfolioData(isRealDataEnabled);
    }, 30000); // 30 seconds

    return () => {
      console.log('🛑 Clearing auto-refresh interval');
      clearInterval(interval);
    };
  }, [portfolioData, isRealDataEnabled]);

  return {
    portfolioData,
    loading,
    error,
    lastUpdate,
    isRealDataEnabled,
    apiCallCount, // For debugging
    refreshData: forceRefresh,
    toggleRealData,
  };
};