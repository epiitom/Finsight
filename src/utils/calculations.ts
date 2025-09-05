// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { Stock, SectorSummary, PortfolioData } from '../types/portfolio';

export const calculateStockMetrics = (stock: Stock): Stock => {
  const investment = stock.purchasePrice * stock.quantity;
  const presentValue = (stock.cmp || stock.purchasePrice) * stock.quantity;
  const gainLoss = presentValue - investment;

  return {
    ...stock,
    investment,
    presentValue,
    gainLoss,
  };
};

export const calculatePortfolioPercentages = (stocks: Stock[]): Stock[] => {
  const totalInvestment = stocks.reduce((sum, stock) => sum + stock.investment, 0);
  
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

  return Array.from(sectorMap.entries()).map(([sector, sectorStocks]) => {
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
};