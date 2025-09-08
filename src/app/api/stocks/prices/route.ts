/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-vars */
import {NextRequest, NextResponse} from 'next/server';
import yahooFinance from 'yahoo-finance2';

interface StockPriceResponse{
  symbol:string;
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
  error?:string;
  fromCache?: boolean;
  dataQuality?: 'complete' | 'partial' | 'basic';
}

interface EnhancedQuoteData {
  // Price module data
  regularMarketPrice?: number;
  regularMarketPreviousClose?: number;
  regularMarketChangePercent?: number;
  marketCap?: number;
  
  // Summary Detail module data
  trailingPE?: number;
  forwardPE?: number;
  dividendYield?: number;
  beta?: number;
  fiftyTwoWeekHigh?: number;
  fiftyTwoWeekLow?: number;
  averageVolume?: number;
  
  // Default Key Statistics module data
  trailingEps?: number;
  forwardEps?: number;
  bookValue?: number;
  priceToBook?: number;
  enterpriseValue?: number;
  
  // Financial Data module data
  totalRevenue?: number;
  revenuePerShare?: number;
  returnOnEquity?: number;
}

interface QueueTask {
  symbol: string;
  originalSymbol: string;
  resolve: (result: StockPriceResponse) => void;
}

interface CacheEntry {
  data: StockPriceResponse;
  timestamp: number;
  expiresAt: number;
}

class StockCache {
  private cache = new Map<string, CacheEntry>();
  private readonly defaultTTL: number;
  private readonly maxSize: number;
  
  constructor(ttlMinutes: number = 5, maxSize: number = 1000) {
    this.defaultTTL = ttlMinutes * 60 * 1000;
    this.maxSize = maxSize;
  }

  set(symbol: string, data: StockPriceResponse, customTTL?: number): void {
    const now = Date.now();
    const ttl = customTTL || this.defaultTTL;
    
    if (this.cache.size >= this.maxSize) {
      this.cleanup();
    }
    
    if (this.cache.size >= this.maxSize) {
      const oldestKey = this.cache.keys().next().value;
      if (oldestKey) {
        this.cache.delete(oldestKey);
      }
    }
    
    this.cache.set(symbol.toUpperCase(), {
      data: { ...data, fromCache: false },
      timestamp: now,
      expiresAt: now + ttl
    });
  }

  get(symbol: string): StockPriceResponse | null {
    const entry = this.cache.get(symbol.toUpperCase());
    
    if (!entry) {
      return null;
    }
    
    if (Date.now() > entry.expiresAt) {
      this.cache.delete(symbol.toUpperCase());
      return null;
    }
    
    return {
      ...entry.data,
      fromCache: true
    };
  }

  has(symbol: string): boolean {
    const entry = this.cache.get(symbol.toUpperCase());
    if (!entry) return false;
    
    if (Date.now() > entry.expiresAt) {
      this.cache.delete(symbol.toUpperCase());
      return false;
    }
    
    return true;
  }

  delete(symbol: string): boolean {
    return this.cache.delete(symbol.toUpperCase());
  }

  clear(): void {
    this.cache.clear();
  }

  cleanup(): void {
    const now = Date.now();
    const expiredKeys: string[] = [];
    
    for (const [key, entry] of this.cache.entries()) {
      if (now > entry.expiresAt) {
        expiredKeys.push(key);
      }
    }
    
    expiredKeys.forEach(key => this.cache.delete(key));
  }

  getStats(): {
    size: number;
    maxSize: number;
    hitRate: number;
    expiredEntries: number;
  } {
    this.cleanup();
    
    const now = Date.now();
    let expiredCount = 0;
    
    for (const entry of this.cache.values()) {
      if (now > entry.expiresAt) {
        expiredCount++;
      }
    }
    
    return {
      size: this.cache.size,
      maxSize: this.maxSize,
      hitRate: 0,
      expiredEntries: expiredCount
    };
  }
}

const globalStockCache = new StockCache(5, 1000);

class ConcurrencyQueue {
  private queue : QueueTask[] = [];
  private running = 0;
  private maxConcurrency: number;
  private requestDelay: number;
  private cache: StockCache;

  constructor(maxConcurrency = 3, requestDelay = 200, cache: StockCache) {
    this.maxConcurrency = maxConcurrency;
    this.requestDelay = requestDelay;
    this.cache = cache;
  }

  async add(task: Omit<QueueTask,'resolve'>): Promise<StockPriceResponse> {
    const cachedResult = this.cache.get(task.symbol);
    if (cachedResult) {
      console.log(`Cache hit for ${task.originalSymbol}`);
      return {
        ...cachedResult,
        symbol: task.originalSymbol
      };
    }

    return new Promise((resolve) => {
      this.queue.push({...task, resolve});
      this.processQueue();
    });
  }

  private async processQueue():Promise<void> {
    if(this.running >= this.maxConcurrency || this.queue.length === 0){
      return;
    }
    const task = this.queue.shift();
    if(!task) return

    this.running++;

    try{
      const result = await this.executeTask(task);
      
      if (result.success) {
        this.cache.set(task.symbol, {
          ...result,
          symbol: task.symbol
        });
      }
      
      task.resolve({
        ...result,
        symbol: task.originalSymbol
      });
    }
    catch(error){
      const errorResult = {
        symbol: task.originalSymbol,
        price: 0,
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        fromCache: false
      };
      
      task.resolve(errorResult);
    }finally {
      this.running--;
      
      if (this.requestDelay > 0) {
        await delay(this.requestDelay);
      }
      
      this.processQueue();
    }
  }

  private async executeTask(task:QueueTask): Promise<StockPriceResponse> {
    const quote = await this.fetchEnhancedQuote(task.symbol);
    
    if(!this.isValidQuote(quote)){
        throw new Error('Invalid or incomplete quote data received');
    }

    // Determine data quality based on available financial metrics
    let dataQuality: 'complete' | 'partial' | 'basic' = 'basic';
    const hasFinancialData = quote.trailingPE || quote.forwardPE || quote.trailingEps;
    const hasExtendedData = quote.bookValue || quote.beta || quote.dividendYield;
    
    if (hasFinancialData && hasExtendedData) {
      dataQuality = 'complete';
    } else if (hasFinancialData || hasExtendedData) {
      dataQuality = 'partial';
    }

    // Log data quality for debugging
    console.log(`Data quality for ${task.originalSymbol}: ${dataQuality}`, {
      price: quote.regularMarketPrice,
      trailingPE: quote.trailingPE,
      forwardPE: quote.forwardPE,
      eps: quote.trailingEps,
      marketCap: quote.marketCap
    });

    return {
      symbol: task.originalSymbol,
      price: this.safeNumber(quote.regularMarketPrice) ?? 0,
      previousClose: this.safeNumber(quote.regularMarketPreviousClose),
      changePercent: this.safeNumber(quote.regularMarketChangePercent),
      
      // Enhanced financial metrics with better data extraction
      peRatio: this.safeNumber(quote.trailingPE),
      forwardPE: this.safeNumber(quote.forwardPE),
      earningsPerShare: this.safeNumber(quote.trailingEps),
      forwardEPS: this.safeNumber(quote.forwardEps),
      marketCap: this.safeNumber(quote.marketCap),
      dividendYield: this.safeNumber(quote.dividendYield),
      bookValue: this.safeNumber(quote.bookValue),
      priceToBook: this.safeNumber(quote.priceToBook),
      beta: this.safeNumber(quote.beta),
      fiftyTwoWeekHigh: this.safeNumber(quote.fiftyTwoWeekHigh),
      fiftyTwoWeekLow: this.safeNumber(quote.fiftyTwoWeekLow),
      avgVolume: this.safeNumber(quote.averageVolume),
      
      success: true,
      fromCache: false,
      dataQuality
    };
  }

  private async fetchEnhancedQuote(symbol: string): Promise<EnhancedQuoteData> {
    try {
      // First attempt: Comprehensive data with quoteSummary
      console.log(`Fetching comprehensive data for ${symbol}`);
      
      const quoteSummaryData = await yahooFinance.quoteSummary(symbol, {
        modules: ['price', 'summaryDetail', 'defaultKeyStatistics', 'financialData']
      });

      // Extract and combine data from all modules
      const price = quoteSummaryData.price;
      const summaryDetail = quoteSummaryData.summaryDetail;
      const keyStats = quoteSummaryData.defaultKeyStatistics;
      const financialData = quoteSummaryData.financialData;

      return {
        // Price data
        regularMarketPrice: price?.regularMarketPrice,
        regularMarketPreviousClose: price?.regularMarketPreviousClose,
        regularMarketChangePercent: price?.regularMarketChangePercent,
        marketCap: price?.marketCap,
        
        // Summary detail data
        trailingPE: summaryDetail?.trailingPE,
        forwardPE: summaryDetail?.forwardPE,
        dividendYield: summaryDetail?.dividendYield,
        beta: summaryDetail?.beta,
        fiftyTwoWeekHigh: summaryDetail?.fiftyTwoWeekHigh,
        fiftyTwoWeekLow: summaryDetail?.fiftyTwoWeekLow,
        averageVolume: summaryDetail?.averageVolume,
        
        // Key statistics data
        trailingEps: keyStats?.trailingEps,
        forwardEps: keyStats?.forwardEps,
        bookValue: keyStats?.bookValue,
        priceToBook: keyStats?.priceToBook,
        enterpriseValue: keyStats?.enterpriseValue,
        
        // Financial data
        totalRevenue: financialData?.totalRevenue,
        revenuePerShare: financialData?.revenuePerShare,
        returnOnEquity: financialData?.returnOnEquity
      };
      
    } catch (error) {
      console.warn(`quoteSummary failed for ${symbol}, trying basic quote:`, error instanceof Error ? error.message : 'Unknown error');
      
      try {
        // Fallback: Basic quote data
        const basicQuote = await yahooFinance.quote(symbol);
        
        return {
          regularMarketPrice: basicQuote.regularMarketPrice,
          regularMarketPreviousClose: basicQuote.regularMarketPreviousClose,
          regularMarketChangePercent: basicQuote.regularMarketChangePercent,
          marketCap: basicQuote.marketCap,
          trailingPE: basicQuote.trailingPE,
          forwardPE: basicQuote.forwardPE,
          fiftyTwoWeekHigh: basicQuote.fiftyTwoWeekHigh,
          fiftyTwoWeekLow: basicQuote.fiftyTwoWeekLow
        };
        
      } catch (fallbackError) {
        console.error(`Both quoteSummary and quote failed for ${symbol}`);
        throw fallbackError;
      }
    }
  }

  private safeNumber(value: any): number | undefined {
    if (value === null || value === undefined || isNaN(Number(value))) {
      return undefined;
    }
    return Number(value);
  }

  private isValidQuote(quote: EnhancedQuoteData): boolean {
    return !!(
      quote && 
      typeof quote === 'object' && 
      quote.regularMarketPrice !== undefined && 
      quote.regularMarketPrice !== null &&
      !isNaN(Number(quote.regularMarketPrice))
    );
  }

  async waitForCompletion(): Promise<void> {
    while (this.running > 0 || this.queue.length > 0) {
      await delay(50);
    }
  }
}

export async function POST(request: NextRequest) {
  try {
    const contentType = request.headers.get('content-type');
    if (!contentType?.includes('application/json')) {
      return NextResponse.json(
        { error: 'Content-Type must be application/json' }, 
        { status: 400 }
      );
    }

    let requestBody;
    try {
      const bodyText = await request.text();
      if (!bodyText.trim()) {
        return NextResponse.json(
          { error: 'Request body cannot be empty' }, 
          { status: 400 }
        );
      }
      requestBody = JSON.parse(bodyText);
    } catch (parseError) {
      return NextResponse.json(
        { 
          error: 'Invalid JSON format in request body',
          details: parseError instanceof Error ? parseError.message : 'Parse error'
        }, 
        { status: 400 }
      );
    }

    const { symbols, bustCache, includeFinancials = true } = requestBody;
    
    if (bustCache === true) {
      globalStockCache.clear();
      console.log('Cache cleared by request');
    }
    
    if (!symbols) {
      return NextResponse.json(
        { error: 'Missing symbols field in request body' }, 
        { status: 400 }
      );
    }
    
    if (!Array.isArray(symbols)) {
      return NextResponse.json(
        { error: 'Symbols must be an array' }, 
        { status: 400 }
      );
    }

    if (symbols.length === 0) {
      return NextResponse.json(
        { error: 'Symbols array cannot be empty' }, 
        { status: 400 }
      );
    }

    if (symbols.length > 50) {
      return NextResponse.json(
        { error: 'Maximum 50 symbols allowed per request' }, 
        { status: 400 }
      );
    }

    console.log(`Processing ${symbols.length} symbols with financials: ${includeFinancials}`);

    globalStockCache.cleanup();

    const queue = new ConcurrencyQueue(5, 150, globalStockCache);
    const resultPromises: Promise<StockPriceResponse>[] = [];

    for (const symbol of symbols) {
      if (!symbol || typeof symbol !== 'string') {
        resultPromises.push(
          Promise.resolve({
            symbol: symbol?.toString() || 'undefined',
            price: 0,
            success: false,
            error: 'Invalid symbol format',
            fromCache: false
          })
        );
        continue;
      }

      const yahooSymbol = convertToYahooSymbol(symbol.trim());
      resultPromises.push(
        queue.add({
          symbol: yahooSymbol,
          originalSymbol: symbol
        })
      );
    }

    const results = await Promise.all(resultPromises);

    // Enhanced analytics
    const analytics = {
      total: results.length,
      successful: results.filter(r => r.success).length,
      failed: results.filter(r => !r.success).length,
      fromCache: results.filter(r => r.fromCache).length,
      dataQuality: {
        complete: results.filter(r => r.dataQuality === 'complete').length,
        partial: results.filter(r => r.dataQuality === 'partial').length,
        basic: results.filter(r => r.dataQuality === 'basic').length
      },
      financialMetrics: {
        withPE: results.filter(r => r.peRatio !== undefined).length,
        withEPS: results.filter(r => r.earningsPerShare !== undefined).length,
        withDividend: results.filter(r => r.dividendYield !== undefined).length,
        withBookValue: results.filter(r => r.bookValue !== undefined).length
      }
    };

    console.log('Enhanced API Results:', analytics);

    const successful = analytics.successful;
    const fromCache = analytics.fromCache;
    const cacheStats = globalStockCache.getStats();

    return NextResponse.json({ 
      results,
      summary: {
        ...analytics,
        fromAPI: successful - fromCache,
        cacheHitRate: results.length > 0 ? ((fromCache / results.length) * 100).toFixed(1) + '%' : '0%'
      },
      cache: {
        size: cacheStats.size,
        maxSize: cacheStats.maxSize
      }
    });
    
  } catch (error) {
    console.error('Stock prices API critical error:', {
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      timestamp: new Date().toISOString()
    });
    
    return NextResponse.json(
      { 
        error: 'Internal server error while processing stock prices',
        requestId: Date.now().toString()
      }, 
      { status: 500 }
    );
  }
}

function convertToYahooSymbol(symbol: string): string {
  if (symbol.includes('.NS') || symbol.includes('.BO') || symbol.includes('.')) {
    return symbol.toUpperCase();
  }
  
  const indianStocks: Record<string, string> = {
    'RELIANCE': 'RELIANCE.NS',
    'TCS': 'TCS.NS',
    'HDFCBANK': 'HDFCBANK.NS',
    'INFY': 'INFY.NS',
    'ICICIBANK': 'ICICIBANK.NS',
    'ASIANPAINT': 'ASIANPAINT.NS',
    'BHARTIARTL': 'BHARTIARTL.NS',
    'WIPRO': 'WIPRO.NS',
    'LTIM': 'LTIM.NS',
    'AFFLE': 'AFFLE.NS',
    'SBIN': 'SBIN.NS',
    'ITC': 'ITC.NS',
    'HCLTECH': 'HCLTECH.NS',
    'AXISBANK': 'AXISBANK.NS',
    'KOTAKBANK': 'KOTAKBANK.NS',
    'MARUTI': 'MARUTI.NS',
    'TITAN': 'TITAN.NS',
    'NESTLEIND': 'NESTLEIND.NS',
    'HINDUNILVR': 'HINDUNILVR.NS',
    'BAJFINANCE': 'BAJFINANCE.NS'
  };

  const upperSymbol = symbol.toUpperCase();
  return indianStocks[upperSymbol] || `${upperSymbol}.NS`;
}

function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

export { globalStockCache };