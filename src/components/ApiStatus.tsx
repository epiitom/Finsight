
'use client';

import React, { useState, useEffect } from 'react';
import { stockApiService } from '../services/Stockapi';
import { Activity, AlertCircle, CheckCircle, Clock } from 'lucide-react';

interface ApiStatusProps {
  isRealDataEnabled: boolean;
}

export const ApiStatus: React.FC<ApiStatusProps> = ({ isRealDataEnabled }) => {
  const [cacheStats, setCacheStats] = useState({ priceCache: 0, fundamentalCache: 0 });
  const [isExpanded, setIsExpanded] = useState(false);

  useEffect(() => {
    const interval = setInterval(() => {
      setCacheStats(stockApiService.getCacheStats());
    }, 5000); // Update every 5 seconds

    return () => clearInterval(interval);
  }, []);

  if (!isRealDataEnabled) {
    return (
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mb-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center">
              <Activity className="h-4 w-4 text-gray-500" />
            </div>
            <div>
              <h3 className="text-sm font-medium text-gray-900">Demo Mode Active</h3>
              <p className="text-xs text-gray-600">Using simulated data with realistic price movements</p>
            </div>
          </div>
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="text-xs text-gray-500 hover:text-gray-700"
          >
            {isExpanded ? 'Hide' : 'Show'} Details
          </button>
        </div>

        {isExpanded && (
          <div className="mt-4 pt-4 border-t border-gray-200">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
              <div className="flex items-center space-x-2">
                <CheckCircle className="h-3 w-3 text-green-500" />
                <span className="text-gray-700">Simulated price updates</span>
              </div>
              <div className="flex items-center space-x-2">
                <CheckCircle className="h-3 w-3 text-green-500" />
                <span className="text-gray-700">Real-time calculations</span>
              </div>
              <div className="flex items-center space-x-2">
                <Clock className="h-3 w-3 text-blue-500" />
                <span className="text-gray-700">15-second refresh cycle</span>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
            <Activity className="h-4 w-4 text-blue-600 animate-pulse" />
          </div>
          <div>
            <h3 className="text-sm font-medium text-blue-900">Live Data Mode</h3>
            <p className="text-xs text-blue-700">
              Fetching real-time data from Yahoo Finance & Alpha Vantage APIs
            </p>
          </div>
        </div>
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="text-xs text-blue-600 hover:text-blue-800"
        >
          {isExpanded ? 'Hide' : 'Show'} API Status
        </button>
      </div>

      {isExpanded && (
        <div className="mt-4 pt-4 border-t border-blue-200">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
            <div className="flex items-center space-x-2">
              <CheckCircle className="h-3 w-3 text-green-500" />
              <div>
                <div className="text-blue-900 font-medium">Yahoo Finance</div>
                <div className="text-blue-700">Stock Prices (CMP)</div>
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <CheckCircle className="h-3 w-3 text-green-500" />
              <div>
                <div className="text-blue-900 font-medium">Alpha Vantage</div>
                <div className="text-blue-700">P/E Ratios & Earnings</div>
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <Clock className="h-3 w-3 text-blue-500" />
              <div>
                <div className="text-blue-900 font-medium">Price Cache</div>
                <div className="text-blue-700">{cacheStats.priceCache} entries</div>
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <Clock className="h-3 w-3 text-blue-500" />
              <div>
                <div className="text-blue-900 font-medium">Fundamental Cache</div>
                <div className="text-blue-700">{cacheStats.fundamentalCache} entries</div>
              </div>
            </div>
          </div>

          <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-md">
            <div className="flex items-start space-x-2">
              <AlertCircle className="h-4 w-4 text-yellow-600 mt-0.5 flex-shrink-0" />
              <div className="text-xs text-yellow-800">
                <strong>Rate Limiting:</strong> API calls are cached and batched to prevent rate limiting. 
                Price data refreshes every minute, fundamental data every 10 minutes. 
                Free tier: 5 calls/min, 500 calls/day.
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};