import { useState, useEffect } from 'react';
import { Stock, PortfolioData } from '../types/portfolio';
import { mockStocks, mockApiDelay } from '../data/mockData';
import { 
  calculateStockMetrics, 
  calculatePortfolioPercentages, 
  groupStocksBySector 
} from '../utils/calculations';

export const usePortfolio = () => {
  const [portfolioData, setPortfolioData] = useState<PortfolioData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const processStockData = (rawStocks: Stock[]): PortfolioData => {
    // Calculate metrics for each stock
    let processedStocks = rawStocks.map(calculateStockMetrics);
    
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
  };

  const fetchPortfolioData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Simulate API delay
      await mockApiDelay(800);
      
      // In real implementation, this would fetch from APIs
      const processedData = processStockData(mockStocks as Stock[]);
      setPortfolioData(processedData);
    } catch (err) {
      setError('Failed to fetch portfolio data');
      console.error('Portfolio fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  // Initial load
  useEffect(() => {
    fetchPortfolioData();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Auto-refresh every 15 seconds (as required)
  useEffect(() => {
    if (!portfolioData) return;

    const interval = setInterval(() => {
      // In real implementation, this would update CMP from APIs
      // For now, simulate price changes
      const updatedStocks = mockStocks.map(stock => ({
        ...stock,
        cmp: stock.cmp ? stock.cmp + (Math.random() - 0.5) * 20 : stock.cmp, // ±10 price variation
      }));

      const processedData = processStockData(updatedStocks as Stock[]);
      setPortfolioData(processedData);
    }, 15000); // 15 seconds

    return () => clearInterval(interval);
  }, [portfolioData]);

  return {
    portfolioData,
    loading,
    error,
    refreshData: fetchPortfolioData,
  };
};