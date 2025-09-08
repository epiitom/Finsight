// hooks/usePortfolio.ts
import { useState, useEffect, useCallback } from 'react';
import { 
  Stock, 
  PortfolioData, 
  StockPriceResponse, 
  ApiResponse, 
  ApiError,
  DataQuality 
} from '../types/portfolio';
import { mockStocks, mockApiDelay } from '../data/mockData';
import { 
  calculateStockMetrics, 
  calculatePortfolioPercentages, 
  groupStocksBySector,
  calculatePortfolioMetrics 
} from '../utils/calculations';

export const usePortfolio = () => {
  const [portfolioData, setPortfolioData] = useState<PortfolioData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());
  const [isRealDataEnabled, setIsRealDataEnabled] = useState<boolean>(false);
  const [apiStats, setApiStats] = useState<ApiResponse['summary'] | null>(null);
  const [cacheStats, setCacheStats] = useState<ApiResponse['cache'] | null>(null);
  const [retryCount, setRetryCount] = useState<number>(0);
  const [responseTime, setResponseTime] = useState<number>(0);

  // Enhanced stock data fetching with comprehensive error handling
  const fetchStockPrices = useCallback(async (
    symbols: string[], 
    bustCache: boolean = false
  ): Promise<Map<string, StockPriceResponse>> => {
    const startTime = Date.now();
    
    try {
      const response = await fetch('/api/stocks/prices', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          symbols,
          bustCache,
          includeFinancials: true
        }),
      });

      if (!response.ok) {
        let errorData: ApiError;
        try {
          errorData = await response.json();
        } catch {
          errorData = { error: `HTTP ${response.status}: ${response.statusText}` };
        }
        
        throw new Error(errorData.error || `API request failed with status ${response.status}`);
      }

      const data: ApiResponse = await response.json();
      const endTime = Date.now();
      
      setResponseTime(endTime - startTime);
      setApiStats(data.summary);
      setCacheStats(data.cache);
      
      console.log('Enhanced Stock API Response:', {
        total: data.summary.total,
        successful: data.summary.successful,
        cacheHitRate: data.summary.cacheHitRate,
        dataQuality: data.summary.dataQuality,
        financialMetrics: data.summary.financialMetrics,
        responseTime: endTime - startTime,
        sampleStock: data.results[0]
      });

      // Convert results to Map for easy lookup
      const priceMap = new Map<string, StockPriceResponse>();
      data.results.forEach(result => {
        priceMap.set(result.symbol.toUpperCase(), result);
      });

      return priceMap;
      
    } catch (error) {
      console.error('Stock price fetch error:', error);
      throw error;
    }
  }, []);

  const processStockData = useCallback(async (
    rawStocks: typeof mockStocks, 
    useRealData: boolean = false
  ): Promise<PortfolioData> => {
    let processedStocks: Stock[] = [];

    if (useRealData) {
      const symbols = rawStocks.map(stock => stock.symbol);
      
      try {
        const priceMap = await fetchStockPrices(symbols, retryCount > 0);
        
        processedStocks = rawStocks.map(stock => {
          const priceData = priceMap.get(stock.symbol.toUpperCase());
          
          if (priceData && priceData.success) {
            // Enhanced stock data mapping with all API fields
            const enhancedStock: Stock = {
              ...stock,
              // Real-time market data
              cmp: priceData.price,
              previousClose: priceData.previousClose,
              changePercent: priceData.changePercent,
              
              // Enhanced financial metrics
              peRatio: priceData.peRatio,
              forwardPE: priceData.forwardPE,
              earningsPerShare: priceData.earningsPerShare,
              forwardEPS: priceData.forwardEPS,
              marketCap: priceData.marketCap,
              dividendYield: priceData.dividendYield,
              bookValue: priceData.bookValue,
              priceToBook: priceData.priceToBook,
              beta: priceData.beta,
              fiftyTwoWeekHigh: priceData.fiftyTwoWeekHigh,
              fiftyTwoWeekLow: priceData.fiftyTwoWeekLow,
              avgVolume: priceData.avgVolume,
              
              // Calculated fields
              investment: stock.purchasePrice * stock.quantity,
              portfolioPercentage: 0, // Will be calculated later
              presentValue: priceData.price * stock.quantity,
              gainLoss: (priceData.price * stock.quantity) - (stock.purchasePrice * stock.quantity),
              gainLossPercentage: ((priceData.price - stock.purchasePrice) / stock.purchasePrice) * 100,
              
              // Data quality indicators
              dataQuality: priceData.dataQuality || 'basic',
              lastUpdated: new Date(),
              isStale: false,
              hasError: false,
              
              // Legacy support
              latestEarnings: priceData.earningsPerShare || stock.latestEarnings
            };
            
            return enhancedStock;
          } else {
            // Handle failed price fetch - keep original data with error indicators
            console.warn(`Failed to fetch price for ${stock.symbol}:`, priceData?.error);
            return {
              ...stock,
              investment: stock.purchasePrice * stock.quantity,
              portfolioPercentage: 0,
              presentValue: undefined,
              gainLoss: undefined,
              gainLossPercentage: undefined,
              dataQuality: 'basic' as DataQuality,
              lastUpdated: new Date(),
              isStale: true,
              hasError: true,
              errorMessage: priceData?.error || 'Failed to fetch price data'
            };
          }
        });
        
        setRetryCount(0);
        
      } catch (error) {
        console.error('Real-time data fetch failed:', error);
        throw new Error(`Unable to fetch real-time prices: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    } else {
      // Mock data mode with enhanced demo data
      processedStocks = rawStocks.map(stock => {
        const mockPrice = stock.cmp || stock.purchasePrice * (1 + (Math.random() - 0.5) * 0.2);
        const mockPEVariation = (Math.random() - 0.5) * 5;
        const mockEPSVariation = (Math.random() - 0.5) * 10;
        
        return {
          ...stock,
          // Mock real-time data
          cmp: mockPrice,
          previousClose: mockPrice * 0.98,
          changePercent: ((mockPrice - (mockPrice * 0.98)) / (mockPrice * 0.98)) * 100,
          
          // Mock enhanced financial data
          peRatio: (stock.peRatio ?? 15) + mockPEVariation,
          forwardPE: (stock.peRatio ?? 15) + mockPEVariation - 2,
          earningsPerShare: (stock.latestEarnings ?? 0) + mockEPSVariation,
          forwardEPS: (stock.latestEarnings ?? 0) + mockEPSVariation + 5,
          marketCap: mockPrice * stock.quantity * 1000000,
          dividendYield: Math.random() * 5,
          bookValue: mockPrice * 0.8,
          priceToBook: mockPrice / (mockPrice * 0.8),
          beta: 0.8 + Math.random() * 0.8,
          fiftyTwoWeekHigh: mockPrice * 1.3,
          fiftyTwoWeekLow: mockPrice * 0.7,
          avgVolume: Math.floor(Math.random() * 1000000),
          
          // Calculated fields
          investment: stock.purchasePrice * stock.quantity,
          portfolioPercentage: 0,
          presentValue: mockPrice * stock.quantity,
          gainLoss: (mockPrice * stock.quantity) - (stock.purchasePrice * stock.quantity),
          gainLossPercentage: ((mockPrice - stock.purchasePrice) / stock.purchasePrice) * 100,
          
          // Mock quality indicators
          dataQuality: 'complete' as DataQuality,
          lastUpdated: new Date(),
          isStale: false,
          hasError: false,
          
          // Legacy support
          latestEarnings: (stock.latestEarnings ?? 0) + mockEPSVariation
        };
      });
    }

    // Calculate portfolio percentages
    processedStocks = calculatePortfolioPercentages(processedStocks);
    
    // Group by sectors with enhanced metrics
    const sectorSummaries = groupStocksBySector(processedStocks);
    
    // Calculate totals
    const totalInvestment = processedStocks.reduce((sum, stock) => sum + stock.investment, 0);
    const totalPresentValue = processedStocks.reduce((sum, stock) => sum + (stock.presentValue || 0), 0);
    const totalGainLoss = totalPresentValue - totalInvestment;
    const totalGainLossPercentage = totalInvestment > 0 ? (totalGainLoss / totalInvestment) * 100 : 0;

    // Calculate enhanced portfolio metrics
    const portfolioMetrics = calculatePortfolioMetrics(processedStocks);

    return {
      stocks: processedStocks,
      sectorSummaries,
      totalInvestment,
      totalPresentValue,
      totalGainLoss,
      totalGainLossPercentage,
      portfolioMetrics,
      apiPerformance: useRealData ? {
        lastUpdate: new Date(),
        responseTime,
        cacheHitRate: apiStats?.cacheHitRate || '0%',
        fromCache: apiStats?.fromCache || 0,
        fromAPI: apiStats?.fromAPI || 0,
        retryCount
      } : undefined
    };
  }, [fetchStockPrices, retryCount, apiStats, responseTime]);

  const fetchPortfolioData = useCallback(async (useRealData: boolean = isRealDataEnabled) => {
    try {
      setLoading(true);
      setError(null);
      
      if (!useRealData) {
        await mockApiDelay(500);
      }
      
      const processedData = await processStockData(mockStocks, useRealData);
      setPortfolioData(processedData);
      setLastUpdate(new Date());
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      setError(errorMessage);
      console.error('Portfolio fetch error:', err);
      
      // Don't clear existing data on error, just mark it as stale
      if (portfolioData) {
        setPortfolioData(prev => prev ? {
          ...prev,
          stocks: prev.stocks.map(stock => ({
            ...stock,
            isStale: true
          }))
        } : null);
      }
    } finally {
      setLoading(false);
    }
  }, [isRealDataEnabled, processStockData, portfolioData]);

  const toggleRealData = useCallback(() => {
    setIsRealDataEnabled(prev => {
      const newValue = !prev;
      setTimeout(() => {
        fetchPortfolioData(newValue);
      }, 100);
      return newValue;
    });
  }, [fetchPortfolioData]);

  const retryFetch = useCallback(async () => {
    setRetryCount(prev => prev + 1);
    setError(null);
    
    await new Promise(resolve => setTimeout(resolve, 500));
    
    try {
      await fetchPortfolioData(isRealDataEnabled);
    } catch (err) {
      console.error('Retry failed:', err);
    }
  }, [fetchPortfolioData, isRealDataEnabled]);

  const clearCache = useCallback(async () => {
    if (!isRealDataEnabled) return;
    
    try {
      setLoading(true);
      const symbols = mockStocks.map(stock => stock.symbol);
      await fetchStockPrices(symbols, true);
      await fetchPortfolioData(true);
    } catch (err) {
      console.error('Cache clear failed:', err);
      setError('Failed to clear cache and refresh data');
    }
  }, [isRealDataEnabled, fetchStockPrices, fetchPortfolioData]);

  // Initial load
  useEffect(() => {
    fetchPortfolioData();
  }, []);

  // Auto-refresh every 30 seconds when using real data (increased from 15s for better performance)
  useEffect(() => {
    if (!portfolioData || !isRealDataEnabled) return;

    const interval = setInterval(() => {
      fetchPortfolioData(true);
    }, 30000);

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
    retryFetch,
    clearCache,
    apiStats,
    cacheStats,
    retryCount,
    responseTime,
    isStale: portfolioData && isRealDataEnabled ? 
      Date.now() - lastUpdate.getTime() > 60000 : false,
    hasFailedStocks: portfolioData?.stocks?.some(stock => stock.hasError) || false,
    dataQualityStats: portfolioData?.portfolioMetrics?.dataQualityDistribution
  };
};