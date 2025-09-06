// app/page.tsx
'use client';

import React, { useState } from 'react';
import { PortfolioTable } from '../components/PortfolioTable';
import { SectorGrouping } from '../components/SectorGrouping';
import { ApiStatus } from '../components/ApiStatus';
import { usePortfolio } from '../hooks/usePortfolio';
import { RefreshCw, TrendingUp, TrendingDown, DollarSign, PieChart, BarChart3, Table, Clock, Wifi, WifiOff } from 'lucide-react';

export default function Dashboard() {
  const { 
    portfolioData, 
    loading, 
    error, 
    lastUpdate,
    isRealDataEnabled,
    refreshData,
    toggleRealData 
  } = usePortfolio();
  
  const [activeView, setActiveView] = useState<'table' | 'sectors'>('table');

  if (loading && !portfolioData) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <RefreshCw className="h-12 w-12 text-blue-600 animate-spin mx-auto mb-4" />
          <p className="text-lg text-gray-600">Loading your portfolio...</p>
        </div>
      </div>
    );
  }

  if (error && !portfolioData) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            <p className="font-medium">Error loading portfolio</p>
            <p className="text-sm">{error}</p>
          </div>
          <button
            onClick={refreshData}
            className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  if (!portfolioData) return null;

  const { stocks, sectorSummaries, totalInvestment, totalPresentValue, totalGainLoss } = portfolioData;
  const isPositive = totalGainLoss > 0;
  const returnPercentage = (totalGainLoss / totalInvestment) * 100;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Portfolio Dashboard</h1>
              <div className="flex items-center space-x-4 mt-1">
                <p className="text-sm text-gray-600">Real-time portfolio tracking and analysis</p>
                <div className="flex items-center space-x-2 text-xs">
                  {isRealDataEnabled ? (
                    <><Wifi className="h-3 w-3 text-green-500" /><span className="text-green-600">Live Data</span></>
                  ) : (
                    <><WifiOff className="h-3 w-3 text-gray-500" /><span className="text-gray-500">Demo Mode</span></>
                  )}
                  <span className="text-gray-400">•</span>
                  <Clock className="h-3 w-3 text-gray-400" />
                  <span className="text-gray-500">Last updated: {lastUpdate.toLocaleTimeString()}</span>
                </div>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <button
                onClick={toggleRealData}
                className={`flex items-center space-x-2 px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                  isRealDataEnabled 
                    ? 'bg-green-100 text-green-800 hover:bg-green-200' 
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {isRealDataEnabled ? <Wifi className="h-4 w-4" /> : <WifiOff className="h-4 w-4" />}
                <span>{isRealDataEnabled ? 'Live Mode' : 'Demo Mode'}</span>
              </button>
              
              <button
                onClick={refreshData}
                disabled={loading}
                className="flex items-center space-x-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-medium py-2 px-4 rounded transition-colors"
              >
                <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                <span>Refresh</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Portfolio Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
            <div className="flex items-center">
              <DollarSign className="h-8 w-8 text-blue-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Total Investment</p>
                <p className="text-2xl font-bold text-gray-900">
                  ₹{totalInvestment.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
            <div className="flex items-center">
              <PieChart className="h-8 w-8 text-purple-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Present Value</p>
                <p className="text-2xl font-bold text-gray-900">
                  ₹{totalPresentValue.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
            <div className="flex items-center">
              {isPositive ? (
                <TrendingUp className="h-8 w-8 text-green-600" />
              ) : (
                <TrendingDown className="h-8 w-8 text-red-600" />
              )}
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Total Gain/Loss</p>
                <p className={`text-2xl font-bold ${isPositive ? 'text-green-600' : 'text-red-600'}`}>
                  {isPositive ? '+' : ''}₹{totalGainLoss.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
            <div className="flex items-center">
              {isPositive ? (
                <TrendingUp className="h-8 w-8 text-green-600" />
              ) : (
                <TrendingDown className="h-8 w-8 text-red-600" />
              )}
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Returns (%)</p>
                <p className={`text-2xl font-bold ${isPositive ? 'text-green-600' : 'text-red-600'}`}>
                  {isPositive ? '+' : ''}{returnPercentage.toFixed(2)}%
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* API Status */}
        <ApiStatus isRealDataEnabled={isRealDataEnabled} />

        {/* Auto-refresh indicator */}
        {loading && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <div className="flex items-center">
              <RefreshCw className="h-4 w-4 text-blue-600 animate-spin mr-2" />
              <span className="text-blue-800 text-sm">
                {isRealDataEnabled ? 'Fetching live market data...' : 'Updating portfolio data...'}
              </span>
            </div>
          </div>
        )}

        {/* API Status Warning */}
        {error && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
            <div className="flex items-center">
              <div className="text-yellow-800 text-sm">
                <strong>API Notice:</strong> {error}
              </div>
            </div>
          </div>
        )}

        {/* View Toggle */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-1 bg-gray-100 rounded-lg p-1">
            <button
              onClick={() => setActiveView('table')}
              className={`flex items-center space-x-2 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                activeView === 'table'
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <Table className="h-4 w-4" />
              <span>Holdings Table</span>
            </button>
            <button
              onClick={() => setActiveView('sectors')}
              className={`flex items-center space-x-2 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                activeView === 'sectors'
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <BarChart3 className="h-4 w-4" />
              <span>Sector Analysis</span>
            </button>
          </div>
          
          <div className="text-sm text-gray-500">
            {activeView === 'table' ? `${stocks.length} stocks` : `${sectorSummaries.length} sectors`}
          </div>
        </div>

        {/* Content based on active view */}
        {activeView === 'table' ? (
          <PortfolioTable data={stocks} />
        ) : (
          <SectorGrouping sectorSummaries={sectorSummaries} />
        )}

        {/* Auto-refresh info */}
        <div className="mt-6 text-center">
          <p className="text-sm text-gray-500">
            Portfolio data refreshes automatically every 15 seconds • 
            {isRealDataEnabled ? ' Using live market data' : ' Demo mode with simulated data'}
          </p>
        </div>
      </div>
    </div>
  );
}