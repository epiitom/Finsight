// utils/calculations.ts
import { Stock, SectorSummary, PortfolioData, DataQuality } from '../types/portfolio';

export const calculateStockMetrics = (stock: Stock): Stock => {
  const investment = stock.purchasePrice * stock.quantity;
  const presentValue = stock.cmp ? stock.cmp * stock.quantity : undefined;
  const gainLoss = presentValue ? presentValue - investment : undefined;
  const gainLossPercentage = gainLoss ? (gainLoss / investment) * 100 : undefined;

  return {
    ...stock,
    investment,
    presentValue,
    gainLoss,
    gainLossPercentage,
  };
};

export const calculatePortfolioPercentages = (stocks: Stock[]): Stock[] => {
  const totalInvestment = stocks.reduce((sum, stock) => sum + stock.investment, 0);

  return stocks.map(stock => ({
    ...stock,
    portfolioPercentage: totalInvestment > 0 ? (stock.investment / totalInvestment) * 100 : 0,
  }));
};

export const groupStocksBySector = (stocks: Stock[]): SectorSummary[] => {
  const sectorMap = new Map<string, Stock[]>();

  // Group stocks by sector
  stocks.forEach(stock => {
    if (!sectorMap.has(stock.sector)) {
      sectorMap.set(stock.sector, []);
    }
    sectorMap.get(stock.sector)?.push(stock);
  });

  // Calculate sector summaries
  return Array.from(sectorMap.entries()).map(([sector, sectorStocks]) => {
    const totalInvestment = sectorStocks.reduce((sum, stock) => sum + stock.investment, 0);
    const totalPresentValue = sectorStocks.reduce((sum, stock) => sum + (stock.presentValue || 0), 0);
    const gainLoss = totalPresentValue - totalInvestment;
    const gainLossPercentage = totalInvestment > 0 ? (gainLoss / totalInvestment) * 100 : 0;

    // Calculate average PE ratio for sector (excluding invalid values)
    const validPERatios = sectorStocks
      .map(s => s.peRatio)
      .filter((pe): pe is number => pe !== undefined && pe > 0 && pe < 1000);
    const avgPERatio = validPERatios.length > 0 
      ? validPERatios.reduce((sum, pe) => sum + pe, 0) / validPERatios.length 
      : undefined;

    // Calculate average dividend yield for sector
    const validDividendYields = sectorStocks
      .map(s => s.dividendYield)
      .filter((div): div is number => div !== undefined && div >= 0);
    const avgDividendYield = validDividendYields.length > 0
      ? validDividendYields.reduce((sum, div) => sum + div, 0) / validDividendYields.length
      : undefined;

    // Find top and worst performers
    const stocksWithGainLoss = sectorStocks.filter(s => s.gainLossPercentage !== undefined);
    const topPerformer = stocksWithGainLoss.length > 0
      ? stocksWithGainLoss.reduce((best, current) => 
          (current.gainLossPercentage || 0) > (best.gainLossPercentage || 0) ? current : best
        )
      : undefined;
    const worstPerformer = stocksWithGainLoss.length > 0
      ? stocksWithGainLoss.reduce((worst, current) => 
          (current.gainLossPercentage || 0) < (worst.gainLossPercentage || 0) ? current : worst
        )
      : undefined;

    return {
      sector,
      totalInvestment,
      totalPresentValue,
      gainLoss,
      gainLossPercentage,
      stocks: sectorStocks,
      stockCount: sectorStocks.length,
      avgPERatio,
      avgDividendYield,
      topPerformer,
      worstPerformer,
    };
  }).sort((a, b) => b.totalInvestment - a.totalInvestment); // Sort by investment size
};

export const calculatePortfolioMetrics = (stocks: Stock[]) => {
  const validStocks = stocks.filter(s => !s.hasError);
  const successfulStocks = stocks.filter(s => s.cmp !== undefined && !s.hasError).length;
  const failedStocks = stocks.filter(s => s.hasError).length;
  const staleStocks = stocks.filter(s => s.isStale).length;

  // Calculate data quality distribution
  const dataQualityDistribution: Record<DataQuality, number> = {
    complete: stocks.filter(s => s.dataQuality === 'complete').length,
    partial: stocks.filter(s => s.dataQuality === 'partial').length,
    basic: stocks.filter(s => s.dataQuality === 'basic').length,
  };

  // Calculate average PE ratio (excluding invalid values)
  const validPERatios = validStocks
    .map(s => s.peRatio)
    .filter((pe): pe is number => pe !== undefined && pe > 0 && pe < 1000);
  const avgPERatio = validPERatios.length > 0 
    ? validPERatios.reduce((sum, pe) => sum + pe, 0) / validPERatios.length 
    : undefined;

  // Calculate average dividend yield
  const validDividendYields = validStocks
    .map(s => s.dividendYield)
    .filter((div): div is number => div !== undefined && div >= 0);
  const avgDividendYield = validDividendYields.length > 0
    ? validDividendYields.reduce((sum, div) => sum + div, 0) / validDividendYields.length
    : undefined;

  // Calculate average beta
  const validBetas = validStocks
    .map(s => s.beta)
    .filter((beta): beta is number => beta !== undefined && beta >= 0 && beta <= 5);
  const avgBeta = validBetas.length > 0
    ? validBetas.reduce((sum, beta) => sum + beta, 0) / validBetas.length
    : undefined;

  // Calculate total market cap
  const totalMarketCap = validStocks
    .map(s => s.marketCap)
    .filter((mc): mc is number => mc !== undefined)
    .reduce((sum, mc) => sum + mc, 0);

  return {
    avgPERatio,
    avgDividendYield,
    avgBeta,
    totalMarketCap: totalMarketCap > 0 ? totalMarketCap : undefined,
    dataQualityDistribution,
    successfulStocks,
    failedStocks,
    staleStocks,
  };
};

// Utility functions for risk assessment
export const calculatePortfolioRisk = (stocks: Stock[]) => {
  const validBetas = stocks
    .map(s => s.beta)
    .filter((beta): beta is number => beta !== undefined && beta >= 0 && beta <= 5);

  if (validBetas.length === 0) return undefined;

  const weightedBeta = stocks
    .filter(s => s.beta !== undefined && s.portfolioPercentage > 0)
    .reduce((sum, stock) => {
      const weight = stock.portfolioPercentage / 100;
      return sum + (stock.beta! * weight);
    }, 0);

  const riskLevel = 
    weightedBeta < 0.8 ? 'Low' :
    weightedBeta > 1.2 ? 'High' : 'Moderate';

  return {
    portfolioBeta: weightedBeta,
    riskLevel,
    highRiskStocks: stocks.filter(s => s.beta && s.beta > 1.5).length,
    lowRiskStocks: stocks.filter(s => s.beta && s.beta < 0.8).length,
  };
};

// Performance analysis utilities
export const getPerformanceStats = (stocks: Stock[]) => {
  const stocksWithPerformance = stocks.filter(s => 
    s.gainLossPercentage !== undefined && !s.hasError
  );

  if (stocksWithPerformance.length === 0) {
    return {
      winners: 0,
      losers: 0,
      avgReturn: 0,
      bestPerformer: undefined,
      worstPerformer: undefined,
      volatilityScore: undefined
    };
  }

  const returns = stocksWithPerformance.map(s => s.gainLossPercentage!);
  const winners = returns.filter(r => r > 0).length;
  const losers = returns.filter(r => r < 0).length;
  const avgReturn = returns.reduce((sum, r) => sum + r, 0) / returns.length;

  const bestPerformer = stocksWithPerformance.reduce((best, current) =>
    (current.gainLossPercentage || 0) > (best.gainLossPercentage || 0) ? current : best
  );

  const worstPerformer = stocksWithPerformance.reduce((worst, current) =>
    (current.gainLossPercentage || 0) < (worst.gainLossPercentage || 0) ? current : worst
  );

  // Calculate simple volatility score based on standard deviation of returns
  const meanReturn = avgReturn;
  const variance = returns.reduce((sum, r) => sum + Math.pow(r - meanReturn, 2), 0) / returns.length;
  const volatilityScore = Math.sqrt(variance);

  return {
    winners,
    losers,
    avgReturn,
    bestPerformer,
    worstPerformer,
    volatilityScore
  };
};

// Diversification analysis
export const analyzeDiversification = (stocks: Stock[]) => {
  const sectorMap = new Map<string, number>();
  const totalInvestment = stocks.reduce((sum, s) => sum + s.investment, 0);

  stocks.forEach(stock => {
    const current = sectorMap.get(stock.sector) || 0;
    sectorMap.set(stock.sector, current + stock.investment);
  });

  const sectorAllocations = Array.from(sectorMap.entries())
    .map(([sector, investment]) => ({
      sector,
      investment,
      percentage: (investment / totalInvestment) * 100
    }))
    .sort((a, b) => b.percentage - a.percentage);

  const concentrationRisk = sectorAllocations[0]?.percentage || 0;
  const diversificationScore = 
    concentrationRisk > 40 ? 'Poor' :
    concentrationRisk > 25 ? 'Moderate' : 'Good';

  return {
    sectorCount: sectorAllocations.length,
    topSectorAllocation: concentrationRisk,
    diversificationScore,
  
    sectorAllocations: sectorAllocations.slice(0, 5), // Top 5 sectors
    herfindahlIndex: sectorAllocations.reduce((sum, s) => sum + Math.pow(s.percentage, 2), 0) / 10000
  };
};