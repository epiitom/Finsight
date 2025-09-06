// app/api/stocks/fundamentals/route.ts
import { NextRequest, NextResponse } from 'next/server';

interface FundamentalResponse {
  symbol: string;
  peRatio?: number;
  eps?: string;
  latestEarnings?: string;
  success: boolean;
  error?: string;
}

export async function POST(request: NextRequest) {
  try {
    const { symbols } = await request.json();
    
    if (!symbols || !Array.isArray(symbols)) {
      return NextResponse.json({ error: 'Invalid symbols provided' }, { status: 400 });
    }

    const API_KEY = process.env.ALPHA_VANTAGE_API_KEY || 'demo';
    const results: FundamentalResponse[] = [];

    // If using demo key, return mock data
    if (API_KEY === 'demo') {
      return NextResponse.json({ 
        results: symbols.map((symbol: string) => ({
          symbol,
          peRatio: 15 + Math.random() * 30, // Random P/E between 15-45
          eps: `₹${(10 + Math.random() * 50).toFixed(2)}`,
          latestEarnings: `₹${(1000 + Math.random() * 5000).toFixed(0)} Cr (Q2 FY24)`,
          success: true
        })),
        note: 'Using demo data - add real Alpha Vantage API key for live data'
      });
    }

    // Process each symbol with real API
    for (const symbol of symbols) {
      try {
        const response = await fetch(
          `https://www.alphavantage.co/query?function=OVERVIEW&symbol=${symbol}&apikey=${API_KEY}`
        );
        
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        
        // Check for API limit
        if (data['Note'] && data['Note'].includes('API call frequency')) {
          results.push({
            symbol,
            success: false,
            error: 'API rate limit exceeded'
          });
          continue;
        }

        if (!data.Symbol) {
          results.push({
            symbol,
            success: false,
            error: 'No data found'
          });
          continue;
        }

        results.push({
          symbol: symbol,
          peRatio: data.PERatio && data.PERatio !== 'None' ? parseFloat(data.PERatio) : undefined,
          eps: data.EPS && data.EPS !== 'None' ? `₹${data.EPS}` : undefined,
          latestEarnings: data.EPS ? `EPS: ₹${data.EPS}` : undefined,
          success: true
        });

        // Add delay between API calls (Alpha Vantage limit: 5 calls per minute)
        await new Promise(resolve => setTimeout(resolve, 12000)); // 12 second delay
        
      } catch (error) {
        console.error(`Error fetching fundamentals for ${symbol}:`, error);
        results.push({
          symbol: symbol,
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }

    return NextResponse.json({ results });

  } catch (error) {
    console.error('Fundamentals API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch fundamental data' }, 
      { status: 500 }
    );
  }
}