/* eslint-disable @typescript-eslint/no-explicit-any */
// services/stockApi.ts
interface StockPriceData {
  symbol: string;
  currentPrice: number;
  previousClose?: number;
  changePercent?: number;
}

interface StockFundamentalData {
  symbol: string;
  peRatio?: number;
  eps?: string;
  marketCap?: string;
  latestEarnings?: string;
}

// Cache to prevent excessive API calls
const priceCache = new Map<string, { data: StockPriceData; timestamp: number }>();
const fundamentalCache = new Map<string, { data: StockFundamentalData; timestamp: number }>();
const PRICE_CACHE_DURATION = 30000; // 30 seconds for prices
const FUNDAMENTAL_CACHE_DURATION = 300000; // 5 minutes for fundamentals

class StockApiService {
  // Fetch stock prices via Next.js API route
  async getStockPrices(symbols: string[]): Promise<Map<string, StockPriceData | null>> {
    const results = new Map<string, StockPriceData | null>();
    const uncachedSymbols: string[] = [];

    // Check cache first
    symbols.forEach(symbol => {
      const cached = priceCache.get(symbol);
      if (cached && Date.now() - cached.timestamp < PRICE_CACHE_DURATION) {
        results.set(symbol, cached.data);
      } else {
        uncachedSymbols.push(symbol);
      }
    });

    // Fetch uncached symbols
    if (uncachedSymbols.length > 0) {
      try {
        const response = await fetch('/api/stocks/prices', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ symbols: uncachedSymbols }),
        });

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        
        if (data.results) {
          data.results.forEach((result: any) => {
            if (result.success && result.price > 0) {
              const stockData: StockPriceData = {
                symbol: result.symbol,
                currentPrice: result.price,
                previousClose: result.previousClose,
                changePercent: result.changePercent,
              };
              
              // Cache the result
              priceCache.set(result.symbol, { data: stockData, timestamp: Date.now() });
              results.set(result.symbol, stockData);
            } else {
              results.set(result.symbol, null);
            }
          });
        }
      } catch (error) {
        console.error('Error fetching stock prices:', error);
        uncachedSymbols.forEach(symbol => results.set(symbol, null));
      }
    }

    return results;
  }

  // Fetch fundamental data via Next.js API route
  async getStockFundamentals(symbols: string[]): Promise<Map<string, StockFundamentalData | null>> {
    const results = new Map<string, StockFundamentalData | null>();
    const uncachedSymbols: string[] = [];

    // Check cache first
    symbols.forEach(symbol => {
      const cached = fundamentalCache.get(symbol);
      if (cached && Date.now() - cached.timestamp < FUNDAMENTAL_CACHE_DURATION) {
        results.set(symbol, cached.data);
      } else {
        uncachedSymbols.push(symbol);
      }
    });

    // Fetch uncached symbols
    if (uncachedSymbols.length > 0) {
      try {
        const response = await fetch('/api/stocks/fundamentals', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ symbols: uncachedSymbols }),
        });

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        
        if (data.results) {
          data.results.forEach((result: any) => {
            if (result.success) {
              const fundamentalData: StockFundamentalData = {
                symbol: result.symbol,
                peRatio: result.peRatio,
                eps: result.eps,
                latestEarnings: result.latestEarnings,
              };
              
              // Cache the result
              fundamentalCache.set(result.symbol, { data: fundamentalData, timestamp: Date.now() });
              results.set(result.symbol, fundamentalData);
            } else {
              results.set(result.symbol, null);
            }
          });
        }

        // If using demo data, show note
        if (data.note) {
          console.log('API Note:', data.note);
        }

      } catch (error) {
        console.error('Error fetching fundamentals:', error);
        uncachedSymbols.forEach(symbol => results.set(symbol, null));
      }
    }

    return results;
  }

  // Get complete stock data (prices + fundamentals)
  async batchGetStockData(symbols: string[]): Promise<Map<string, {
    price: StockPriceData | null;
    fundamentals: StockFundamentalData | null;
  }>> {
    try {
      // Fetch prices and fundamentals in parallel
      const [pricesMap, fundamentalsMap] = await Promise.all([
        this.getStockPrices(symbols),
        this.getStockFundamentals(symbols),
      ]);

      const results = new Map();
      
      symbols.forEach(symbol => {
        results.set(symbol, {
          price: pricesMap.get(symbol) || null,
          fundamentals: fundamentalsMap.get(symbol) || null,
        });
      });

      return results;
    } catch (error) {
      console.error('Error in batch fetch:', error);
      
      // Return empty results
      const results = new Map();
      symbols.forEach(symbol => {
        results.set(symbol, {
          price: null,
          fundamentals: null,
        });
      });
      return results;
    }
  }

  // Simulate price changes for demo mode
  simulatePriceChanges(currentPrices: Map<string, number>): Map<string, number> {
    const updatedPrices = new Map();
    
    currentPrices.forEach((price, symbol) => {
      // Add realistic price movement (±2%)
      const changePercent = (Math.random() - 0.5) * 0.04; // ±2%
      const newPrice = price * (1 + changePercent);
      updatedPrices.set(symbol, Math.round(newPrice * 100) / 100);
    });

    return updatedPrices;
  }

  // Clear caches
  clearCaches() {
    priceCache.clear();
    fundamentalCache.clear();
  }

  // Get cache statistics
  getCacheStats() {
    return {
      priceCache: priceCache.size,
      fundamentalCache: fundamentalCache.size,
    };
  }
}

export const stockApiService = new StockApiService();
export type { StockPriceData, StockFundamentalData };