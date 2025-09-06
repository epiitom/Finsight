// Create a new file: components/DataTest.tsx
'use client';

import React from 'react';
import { usePortfolio } from '../hooks/usePortfolio';

export const DataTest: React.FC = () => {
  const { portfolioData, isRealDataEnabled, refreshData } = usePortfolio();
  
  if (!portfolioData?.stocks) {
    return <div>No data available</div>;
  }

  return (
    <div className="bg-white p-6 rounded-lg shadow-lg border-4 border-red-500">
      <h2 className="text-xl font-bold mb-4 text-red-600">
        DATA FLOW TEST - {isRealDataEnabled ? 'LIVE MODE' : 'DEMO MODE'}
      </h2>
      
      <button 
        onClick={refreshData}
        className="bg-red-500 text-white px-4 py-2 rounded mb-4"
      >
        Force Refresh
      </button>
      
      <div className="space-y-2">
        {portfolioData.stocks.slice(0, 3).map((stock, index) => (
          <div key={stock.id || index} className="p-3 bg-gray-100 rounded">
            <div className="font-bold text-lg">
              {stock.symbol || stock.particulars} 
            </div>
            <div className="text-2xl font-mono text-blue-600">
              CMP: ₹{stock.cmp?.toFixed(2) || 'N/A'}
            </div>
            <div className="text-sm text-gray-600">
              Present Value: ₹{stock.presentValue?.toFixed(2) || 'N/A'}
            </div>
            <div className="text-xs text-gray-500">
              Object ID: {stock.id} | Timestamp: {Date.now()}
            </div>
          </div>
        ))}
      </div>
      
      <div className="mt-4 text-sm text-gray-600">
        Total stocks: {portfolioData.stocks.length} | 
        Last update: {new Date().toISOString()}
      </div>
    </div>
  );
};