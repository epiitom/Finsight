'use client';

import React from 'react';
import { usePortfolio } from '../hooks/usePortfolio';
import { PortfolioTable } from '../components/PortfolioTable';

export const PortfolioPage: React.FC = () => {
  const { 
    portfolioData, 
    loading, 
    error, 
    lastUpdate, 
    isRealDataEnabled, 
    refreshData, 
    toggleRealData 
  } = usePortfolio();

  console.log('📄 PortfolioPage render:', {
    hasData: !!portfolioData,
    loading,
    error,
    isRealDataEnabled,
    stockCount: portfolioData?.stocks?.length || 0
  });

  if (loading && !portfolioData) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-lg text-gray-600">Loading portfolio...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
        <strong>Error:</strong> {error}
        <button 
          onClick={refreshData}
          className="ml-4 px-3 py-1 bg-red-600 text-white rounded text-sm"
        >
          Retry
        </button>
      </div>
    );
  }

  if (!portfolioData?.stocks) {
    return <div>No portfolio data available</div>;
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Debug Controls */}
      <div className="bg-yellow-100 border border-yellow-400 p-4 rounded">
        <div className="flex justify-between items-center">
          <div>
            <strong>Mode:</strong> {isRealDataEnabled ? 'LIVE DATA' : 'DEMO DATA'} | 
            <strong> Stocks:</strong> {portfolioData.stocks.length} |
            <strong> Last Update:</strong> {lastUpdate.toLocaleTimeString()}
          </div>
          
          <div className="space-x-2">
            <button
              onClick={toggleRealData}
              className={`px-3 py-1 rounded text-sm ${
                isRealDataEnabled 
                  ? 'bg-green-600 text-white' 
                  : 'bg-gray-600 text-white'
              }`}
            >
              {isRealDataEnabled ? 'Live Mode' : 'Demo Mode'}
            </button>
            
            <button
              onClick={refreshData}
              disabled={loading}
              className="px-3 py-1 bg-blue-600 text-white rounded text-sm disabled:opacity-50"
            >
              {loading ? 'Refreshing...' : 'Force Refresh'}
            </button>
          </div>
        </div>
      </div>

      {/* Quick Data Test */}
      <div className="bg-blue-100 border border-blue-400 p-4 rounded">
        <h3 className="font-bold mb-2">Quick Data Test (First 3 stocks):</h3>
        <div className="grid grid-cols-3 gap-4">
          {portfolioData.stocks.slice(0, 3).map((stock, index) => (
            <div key={stock.id || index} className="bg-white p-2 rounded">
              <div className="font-bold">{stock.symbol}</div>
              <div className="text-lg text-blue-600">₹{stock.cmp?.toFixed(2) || 'N/A'}</div>
              <div className="text-sm text-gray-600">
                Value: ₹{stock.presentValue?.toFixed(0) || 'N/A'}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Main Table */}
      <PortfolioTable 
        data={portfolioData.stocks}
        onRefresh={refreshData}
        isLoading={loading}
      />
      
      {/* Portfolio Summary */}
      <div className="bg-gray-100 p-4 rounded">
        <h3 className="font-bold mb-2">Portfolio Summary:</h3>
        <div className="grid grid-cols-3 gap-4">
          <div>
            <div className="text-sm text-gray-600">Total Investment</div>
            <div className="text-xl font-bold">
              ₹{portfolioData.totalInvestment?.toLocaleString('en-IN') || '0'}
            </div>
          </div>
          <div>
            <div className="text-sm text-gray-600">Present Value</div>
            <div className="text-xl font-bold">
              ₹{portfolioData.totalPresentValue?.toLocaleString('en-IN') || '0'}
            </div>
          </div>
          <div>
            <div className="text-sm text-gray-600">Gain/Loss</div>
            <div className={`text-xl font-bold ${
              (portfolioData.totalGainLoss || 0) > 0 ? 'text-green-600' : 'text-red-600'
            }`}>
              ₹{portfolioData.totalGainLoss?.toLocaleString('en-IN') || '0'}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};