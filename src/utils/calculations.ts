// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { Stock, SectorSummary, PortfolioData } from '../types/portfolio';

export const calculateStockMetrics = (stock: Stock): Stock => {
  console.log(`🧮 Calculating metrics for ${stock.symbol}:`, {
    symbol: stock.symbol,
    purchasePrice: stock.purchasePrice,
    quantity: stock.quantity,
    cmp: stock.cmp,
    originalInvestment: stock.investment
  });

  const investment = stock.purchasePrice * stock.quantity;
  
  // Fix: Use proper null/undefined check instead of || which treats 0 as falsy
  const currentPrice = stock.cmp !== null && stock.cmp !== undefined ? stock.cmp : stock.purchasePrice;
  const presentValue = currentPrice * stock.quantity;
  const gainLoss = presentValue - investment;

  const result = {
    ...stock,
    investment,
    presentValue,
    gainLoss,
  };

  console.log(`📊 Calculated metrics for ${stock.symbol}:`, {
    investment: result.investment,
    currentPrice: currentPrice,
    presentValue: result.presentValue,
    gainLoss: result.gainLoss,
    gainLossPercentage: ((result.gainLoss / result.investment) * 100).toFixed(2) + '%'
  });

  return result;
};

export const calculatePortfolioPercentages = (stocks: Stock[]): Stock[] => {
  const totalInvestment = stocks.reduce((sum, stock) => sum + stock.investment, 0);
  
  console.log('📊 Calculating portfolio percentages:', {
    totalInvestment,
    stockCount: stocks.length
  });
   
  return stocks.map(stock => ({
    ...stock,
    portfolioPercentage: (stock.investment / totalInvestment) * 100,
  }));
};

export const groupStocksBySector = (stocks: Stock[]): SectorSummary[] => {
  const sectorMap = new Map<string, Stock[]>();
   
  stocks.forEach(stock => {
    if (!sectorMap.has(stock.sector)) {
      sectorMap.set(stock.sector, []);
    }
    sectorMap.get(stock.sector)!.push(stock);
  });

  const sectorSummaries = Array.from(sectorMap.entries()).map(([sector, sectorStocks]) => {
    const totalInvestment = sectorStocks.reduce((sum, stock) => sum + stock.investment, 0);
    const totalPresentValue = sectorStocks.reduce((sum, stock) => sum + (stock.presentValue || 0), 0);
    const gainLoss = totalPresentValue - totalInvestment;

    return {
      sector,
      totalInvestment,
      totalPresentValue,
      gainLoss,
      stocks: sectorStocks,
    };
  });

  console.log('📊 Sector summaries calculated:', sectorSummaries.map(s => ({
    sector: s.sector,
    stockCount: s.stocks.length,
    totalInvestment: s.totalInvestment,
    totalPresentValue: s.totalPresentValue,
    gainLoss: s.gainLoss
  })));

  return sectorSummaries;
};