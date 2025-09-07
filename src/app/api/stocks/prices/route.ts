/* eslint-disable @typescript-eslint/no-unused-vars */
import {NextRequest, NextResponse} from 'next/server';
import yahooFinance from 'yahoo-finance2';

interface StockPriceResponse{
  symbol:string;
  price: number;
  previousClose?: number;
  changePercent?: number;
  success: boolean;
  error?:string;
  fromCache?: boolean; // Indicate if data came from cache
}

interface QuoteData {
  regularMarketPrice?: number;
  regularMarketPreviousClose?: number;
  regularMarketChangePercent?: number;
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
  private readonly defaultTTL: number; // Time to live in milliseconds
  private readonly maxSize: number;
  
  constructor(ttlMinutes: number = 5, maxSize: number = 1000) {
    this.defaultTTL = ttlMinutes * 60 * 1000; // Convert to milliseconds
    this.maxSize = maxSize;
  }

  set(symbol: string, data: StockPriceResponse, customTTL?: number): void {
    const now = Date.now();
    const ttl = customTTL || this.defaultTTL;
    
    // Clean expired entries if cache is getting large
    if (this.cache.size >= this.maxSize) {
      this.cleanup();
    }
    
    // If still at max size after cleanup, remove oldest entry
    if (this.cache.size >= this.maxSize) {
      const oldestKey = this.cache.keys().next().value;
      if (oldestKey) {
        this.cache.delete(oldestKey);
      }
    }
    
    this.cache.set(symbol.toUpperCase(), {
      data: { ...data, fromCache: false }, // Mark as fresh data initially
      timestamp: now,
      expiresAt: now + ttl
    });
  }

  get(symbol: string): StockPriceResponse | null {
    const entry = this.cache.get(symbol.toUpperCase());
    
    if (!entry) {
      return null;
    }
    
    // Check if entry has expired
    if (Date.now() > entry.expiresAt) {
      this.cache.delete(symbol.toUpperCase());
      return null;
    }
    
    // Return cached data with cache flag
    return {
      ...entry.data,
      fromCache: true
    };
  }

  has(symbol: string): boolean {
    const entry = this.cache.get(symbol.toUpperCase());
    if (!entry) return false;
    
    // Check if expired
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

  // Clean up expired entries
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

  // Get cache statistics
  getStats(): {
    size: number;
    maxSize: number;
    hitRate: number;
    expiredEntries: number;
  } {
    this.cleanup(); // Clean before getting stats
    
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
      hitRate: 0, // Would need separate tracking for actual hit rate
      expiredEntries: expiredCount
    };
  }
}

// Global cache instance - persists across requests
const globalStockCache = new StockCache(5, 1000); // 5 minutes TTL, max 1000 entries

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
    // Check cache first
    const cachedResult = this.cache.get(task.symbol);
    if (cachedResult) {
      console.log(`Cache hit for ${task.originalSymbol}`);
      return {
        ...cachedResult,
        symbol: task.originalSymbol // Restore original symbol
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
      
      // Cache successful results
      if (result.success) {
        this.cache.set(task.symbol, {
          ...result,
          symbol: task.symbol // Cache with Yahoo symbol
        });
      }
      
      task.resolve({
        ...result,
        symbol: task.originalSymbol // Return with original symbol
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
      
      // Don't cache errors, but resolve with error
      task.resolve(errorResult);
    }finally {
      this.running--;
      
      // Add delay between requests to respect rate limits
      if (this.requestDelay > 0) {
        await delay(this.requestDelay);
      }
      
      // Process next task in queue
      this.processQueue();
    }
  }

  private async executeTask(task:QueueTask): Promise<StockPriceResponse> {
    const quote = await fetchQuoteWithTimeout(task.symbol, 8000);
    if(!isValidQuote(quote)){
        throw new Error('Invalid or incomplete quote data received');
    }
   return {
      symbol: task.originalSymbol,
      price: Number(quote.regularMarketPrice),
      previousClose: quote.regularMarketPreviousClose 
        ? Number(quote.regularMarketPreviousClose) 
        : undefined,
      changePercent: quote.regularMarketChangePercent 
        ? Number(quote.regularMarketChangePercent) 
        : undefined,
      success: true,
      fromCache: false
    };
  }

  async waitForCompletion(): Promise<void> {
    while (this.running > 0 || this.queue.length > 0) {
      await delay(50); // Small delay to prevent busy waiting
    }
  }
}

export async function POST(request: NextRequest) {
  try {
    // Enhanced request validation
    const contentType = request.headers.get('content-type');
    if (!contentType?.includes('application/json')) {
      return NextResponse.json(
        { error: 'Content-Type must be application/json' }, 
        { status: 400 }
      );
    }

    // Safe JSON parsing
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

    const { symbols, bustCache } = requestBody;
    
    // Optional cache busting
    if (bustCache === true) {
      globalStockCache.clear();
      console.log('Cache cleared by request');
    }
    
    // Validate symbols
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

    if (symbols.length > 20) { // Increased limit since cache reduces API calls
      return NextResponse.json(
        { error: 'Maximum 20 symbols allowed per request' }, 
        { status: 400 }
      );
    }

    // Clean cache before processing
    globalStockCache.cleanup();

    // Create queue with cache
    const queue = new ConcurrencyQueue(3, 200, globalStockCache);
    const resultPromises: Promise<StockPriceResponse>[] = [];

    // Add all symbols to the queue (cache will be checked automatically)
    for (const symbol of symbols) {
      if (!symbol || typeof symbol !== 'string') {
        // Handle invalid symbols immediately
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

    // Wait for all requests to complete
    const results = await Promise.all(resultPromises);

    // Enhanced summary with cache statistics
    const successful = results.filter(r => r.success).length;
    const failed = results.length - successful;
    const fromCache = results.filter(r => r.fromCache).length;
    const fromAPI = successful - fromCache;
    const cacheStats = globalStockCache.getStats();

    return NextResponse.json({ 
      results,
      summary: {
        total: results.length,
        successful,
        failed,
        fromCache,
        fromAPI,
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

// Helper functions with proper typing and error handling
async function fetchQuoteWithTimeout(symbol: string, timeoutMs: number): Promise<QuoteData> {
  return new Promise((resolve, reject) => {
    const timeoutId = setTimeout(() => {
      reject(new Error(`Request timeout after ${timeoutMs}ms for ${symbol}`));
    }, timeoutMs);

    yahooFinance.quote(symbol)
      .then((quote) => {
        clearTimeout(timeoutId);
        resolve(quote as QuoteData);
      })
      .catch((error) => {
        clearTimeout(timeoutId);
        reject(error);
      });
  });
}

function isValidQuote(quote: QuoteData): boolean {
  return !!(
    quote && 
    typeof quote === 'object' && 
    quote.regularMarketPrice !== undefined && 
    quote.regularMarketPrice !== null &&
    !isNaN(Number(quote.regularMarketPrice))
  );
}

function convertToYahooSymbol(symbol: string): string {
  // Already has exchange suffix
  if (symbol.includes('.NS') || symbol.includes('.BO') || symbol.includes('.')) {
    return symbol.toUpperCase();
  }
  
  // Indian stock symbols mapping
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
    'ITC': 'ITC.NS'
  };

  const upperSymbol = symbol.toUpperCase();
  return indianStocks[upperSymbol] || `${upperSymbol}.NS`;
}

function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}


export { globalStockCache };