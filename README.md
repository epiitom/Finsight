# 📈 FinSight

A high-performance Next.js API endpoint for fetching real-time stock prices with intelligent concurrency control and rate limiting.

## 🚀 Features

- **Real-time stock data** from Yahoo Finance
- **Queue-based concurrency** for optimal performance
- **Rate limiting protection** to prevent API throttling
- **Robust error handling** with detailed logging
- **Input validation** and sanitization
- **Batch processing** up to 10 symbols per request
- **Indian stock market support** with automatic symbol mapping

## 📊 Performance

- **3x faster** than sequential processing
- **Configurable concurrency** (default: 3 concurrent requests)
- **Smart rate limiting** (200ms delay between batches)
- **Timeout protection** (8-second request timeout)

## 🛠️ Installation

```bash
# Install dependencies
npm install yahoo-finance2

# Or with yarn
yarn add yahoo-finance2
```

## 📋 API Reference

### Endpoint
```
POST /api/stocks/prices
```

### Request Body
```json
{
  "symbols": ["AAPL", "GOOGL", "MSFT", "RELIANCE", "TCS"]
}
```

### Response Format
```json
{
  "results": [
    {
      "symbol": "AAPL",
      "price": 150.25,
      "previousClose": 148.50,
      "changePercent": 1.18,
      "success": true
    },
    {
      "symbol": "INVALID",
      "price": 0,
      "success": false,
      "error": "Quote fetch failed"
    }
  ],
  "summary": {
    "total": 2,
    "successful": 1,
    "failed": 1
  }
}
```

## 📚 Usage Examples

### Basic Request
```javascript
const response = await fetch('/api/stocks/prices', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    symbols: ['AAPL', 'GOOGL', 'MSFT']
  })
});

const data = await response.json();
console.log(data.results);
```

### With Error Handling
```javascript
try {
  const response = await fetch('/api/stocks/prices', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ symbols: ['AAPL', 'TSLA'] })
  });

  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }

  const data = await response.json();
  
  // Process successful results
  const successfulQuotes = data.results.filter(result => result.success);
  successfulQuotes.forEach(quote => {
    console.log(`${quote.symbol}: $${quote.price}`);
  });

  // Handle failed requests
  const failedQuotes = data.results.filter(result => !result.success);
  failedQuotes.forEach(quote => {
    console.error(`Failed to fetch ${quote.symbol}: ${quote.error}`);
  });

} catch (error) {
  console.error('API request failed:', error);
}
```

### React Hook Example
```javascript
import { useState, useEffect } from 'react';

function useStockPrices(symbols) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!symbols?.length) return;

    setLoading(true);
    setError(null);

    fetch('/api/stocks/prices', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ symbols })
    })
    .then(res => res.json())
    .then(setData)
    .catch(setError)
    .finally(() => setLoading(false));
  }, [symbols]);

  return { data, loading, error };
}
```

## 🌍 Supported Markets

### US Stocks
- **Format**: `AAPL`, `GOOGL`, `MSFT`
- **Exchange**: Automatically mapped to Yahoo Finance symbols

### Indian Stocks (NSE)
- **Format**: `RELIANCE`, `TCS`, `HDFCBANK`
- **Auto-mapping**: Automatically adds `.NS` suffix
- **Supported symbols**:
  - `RELIANCE` → `RELIANCE.NS`
  - `TCS` → `TCS.NS`
  - `HDFCBANK` → `HDFCBANK.NS`
  - `INFY` → `INFY.NS`
  - `ICICIBANK` → `ICICIBANK.NS`
  - And more...

### Manual Exchange Specification
```json
{
  "symbols": [
    "AAPL",           // US stock
    "RELIANCE.NS",    // Indian NSE
    "RELIANCE.BO"     // Indian BSE
  ]
}
```

## ⚙️ Configuration

### Concurrency Settings
Modify the `ConcurrencyQueue` initialization in the API route:

```typescript
// Conservative (safer for rate limits)
const queue = new ConcurrencyQueue(2, 500);

// Balanced (default)
const queue = new ConcurrencyQueue(3, 200);

// Aggressive (faster but riskier)
const queue = new ConcurrencyQueue(5, 100);
```

### Parameters
- **maxConcurrency**: Number of simultaneous requests (1-5 recommended)
- **requestDelay**: Milliseconds between request batches (100-500ms recommended)

## 🚨 Error Handling

### Request Validation Errors
```json
{
  "error": "Symbols must be an array",
  "status": 400
}
```

### Rate Limiting
```json
{
  "results": [
    {
      "symbol": "AAPL",
      "success": false,
      "error": "Request timeout after 8000ms for AAPL"
    }
  ]
}
```

### Server Errors
```json
{
  "error": "Internal server error while processing stock prices",
  "requestId": "1640995200000"
}
```

## 📏 API Limits

- **Maximum symbols per request**: 10
- **Request timeout**: 8 seconds per symbol
- **Concurrency limit**: 3 simultaneous requests
- **Rate limiting**: 200ms delay between batches

## 🔧 Development

### Project Structure
```
app/
├── api/
│   └── stocks/
│       └── prices/
│           └── route.ts    # Main API endpoint
```

### Local Development
```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Test the API
curl -X POST http://localhost:3000/api/stocks/prices \
  -H "Content-Type: application/json" \
  -d '{"symbols":["AAPL","GOOGL"]}'
```

### Testing
```bash
# Test with curl
curl -X POST http://localhost:3000/api/stocks/prices \
  -H "Content-Type: application/json" \
  -d '{"symbols":["AAPL","GOOGL","MSFT","RELIANCE","TCS"]}'
```

## 🐛 Troubleshooting

### Common Issues

**1. "Request timeout" errors**
- Yahoo Finance might be slow or unreachable
- Try reducing concurrency or increasing delay

**2. "Invalid symbol" errors**
- Verify symbol exists on Yahoo Finance
- Check if exchange suffix is needed (e.g., `.NS` for Indian stocks)

**3. Rate limiting**
- Reduce concurrency limit
- Increase delay between requests
- Implement exponential backoff for retries

### Debug Logging
The API includes comprehensive error logging:
```typescript
console.error('Failed to fetch quote for SYMBOL:', {
  symbol,
  yahooSymbol,
  error: error.message,
  timestamp: new Date().toISOString()
});
```

## 📄 License

MIT License - feel free to use in your projects!

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request



---

Built with ❤️ using Next.js and Yahoo Finance API
