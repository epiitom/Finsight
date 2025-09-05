'use client';

import React from 'react';
import { PortfolioTable } from '../components/PortfolioTable';
import { usePortfolio } from '../hooks/usePortfolio';
import { RefreshCw, TrendingUp, TrendingDown, DollarSign, PieChart } from 'lucide-react';

export default function Dashboard() {
  const { portfolioData, loading, error, refreshData } = usePortfolio();

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

  const { stocks, totalInvestment, totalPresentValue, totalGainLoss } = portfolioData;
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
              <p className="text-sm text-gray-600 mt-1">Real-time portfolio tracking and analysis</p>
            </div>
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

        {/* Auto-refresh indicator */}
        {loading && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <div className="flex items-center">
              <RefreshCw className="h-4 w-4 text-blue-600 animate-spin mr-2" />
              <span className="text-blue-800 text-sm">Updating portfolio data...</span>
            </div>
          </div>
        )}

        {/* Portfolio Table */}
        <PortfolioTable data={stocks} />

        {/* Auto-refresh info */}
        <div className="mt-6 text-center">
          <p className="text-sm text-gray-500">
            Portfolio data refreshes automatically every 15 seconds
          </p>
        </div>
      </div>
    </div>
  );
}