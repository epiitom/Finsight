/* eslint-disable @typescript-eslint/no-unused-vars */
import {NextRequest, NextResponse} from 'next/server';
import yahooFinance from 'yahoo-finance2';
import yahooFinace from 'yahoo-finance2'

interface StockPriceResponse{
  symbol:string;
  price: number;
  previousClose?: number;
  changePercent?: number;
  success: boolean;
  error?:string;
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

class ConcurrencyQueue {
  private queue : QueueTask[] = [];
  private running = 0;
 private maxConcurrency: number;
  private requestDelay: number;

  constructor(maxConcurrency = 3, requestDelay = 200) {
    this.maxConcurrency = maxConcurrency;
    this.requestDelay = requestDelay;
  }
    async add(task: Omit<QueueTask,'resolve'>): Promise<StockPriceResponse> {
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
         const result = await this.execuetTask(task)
         task.resolve(result)
      }
      catch(error){
        task.resolve({
          symbol: task.originalSymbol,
        price: 0,
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
        })
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

  private async execuetTask(task:QueueTask): Promise<StockPriceResponse> {
    const quote = await fetchQuoteWithTimeout(task.symbol,8000);
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
      success: true
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

    const { symbols } = requestBody;
    
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

    if (symbols.length > 10) {
      return NextResponse.json(
        { error: 'Maximum 10 symbols allowed per request' }, 
        { status: 400 }
      );
    }

    // Create queue with concurrency limit of 3 and 200ms delay between requests
    const queue = new ConcurrencyQueue(3, 200);
    const resultPromises: Promise<StockPriceResponse>[] = [];

    // Add all symbols to the queue
    for (const symbol of symbols) {
      if (!symbol || typeof symbol !== 'string') {
        // Handle invalid symbols immediately
        resultPromises.push(
          Promise.resolve({
            symbol: symbol?.toString() || 'undefined',
            price: 0,
            success: false,
            error: 'Invalid symbol format'
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

    // Provide summary in response
    const successful = results.filter(r => r.success).length;
    const failed = results.length - successful;

    return NextResponse.json({ 
      results,
      summary: {
        total: results.length,
        successful,
        failed
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
    'SBIN': 'SBIN.NS',
    'ITC': 'ITC.NS'
  };

  const upperSymbol = symbol.toUpperCase();
  return indianStocks[upperSymbol] || `${upperSymbol}.NS`;
}

function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}