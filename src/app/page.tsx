/* eslint-disable @typescript-eslint/no-unused-vars */
"use client"

import { useState } from "react"
import { PortfolioTable } from "../components/PortfolioTable"
import { SectorGrouping } from "../components/SectorGrouping"
import { usePortfolio } from "../hooks/usePortfolio"
import {
  RefreshCw,
  TrendingUp,
  TrendingDown,
  DollarSign,
  PieChart,
  BarChart3,
  Table,
  Clock,
  Wifi,
  WifiOff,
  Activity,
  Target,
} from "lucide-react"

export default function Dashboard() {
  const { portfolioData, loading, error, lastUpdate, isRealDataEnabled, refreshData, toggleRealData } = usePortfolio()

  const [activeView, setActiveView] = useState<"table" | "sectors">("table")

  if (loading && !portfolioData) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center px-4">
        <div className="text-center">
          <div className="relative">
            <div className="absolute inset-0 bg-blue-500/20 rounded-full blur-xl animate-pulse"></div>
            <RefreshCw className="relative h-12 w-12 sm:h-16 sm:w-16 text-blue-400 animate-spin mx-auto mb-4 sm:mb-6" />
          </div>
          <p className="text-lg sm:text-xl font-medium text-white mb-2">Loading Portfolio</p>
          <p className="text-gray-400 text-sm sm:text-base">Fetching your latest market data...</p>
        </div>
      </div>
    )
  }

  if (error && !portfolioData) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center px-4">
        <div className="text-center max-w-md w-full">
          <div className="bg-[#1a1a1a] border border-red-500/20 rounded-2xl p-6 sm:p-8 mb-6 shadow-2xl shadow-red-500/10">
            <div className="w-12 h-12 sm:w-16 sm:h-16 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <Activity className="h-6 w-6 sm:h-8 sm:w-8 text-red-400" />
            </div>
            <h3 className="text-lg sm:text-xl font-semibold text-white mb-2">Connection Error</h3>
            <p className="text-gray-400 text-sm mb-4">{error}</p>
          </div>
          <button
            onClick={refreshData}
            className="bg-blue-600 hover:bg-blue-500 text-white font-medium py-3 px-6 rounded-xl transition-all duration-200 hover:scale-105 shadow-lg shadow-blue-500/25 w-full sm:w-auto"
          >
            Retry Connection
          </button>
        </div>
      </div>
    )
  }

  if (!portfolioData) return null

  const { stocks, sectorSummaries, totalInvestment, totalPresentValue, totalGainLoss } = portfolioData
  const isPositive = totalGainLoss > 0
  const returnPercentage = (totalGainLoss / totalInvestment) * 100

  return (
    <div className="min-h-screen bg-[#0a0a0a]">
      <header className="bg-[#111111] border-b border-gray-800/50 sticky top-0 px-3 sm:px-5 py-3 sm:py-4 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col space-y-4 sm:flex-row sm:items-center sm:justify-between sm:space-y-0">
            <div className="flex items-center space-x-3 sm:space-x-4">
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-green-400 rounded-xl sm:rounded-2xl flex items-center justify-center shadow-lg">
                <Target className="h-5 w-5 sm:h-7 sm:w-7 text-white" />
              </div>
              <div>
                <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight">FinSight</h1>
                <p className="text-gray-400 text-xs sm:text-sm">Professional Trading Dashboard</p>
              </div>
            </div>

            <div className="flex items-center space-x-2 sm:space-x-4">
              <button
                onClick={toggleRealData}
                className={`flex items-center space-x-2 px-3 py-2 sm:px-4 sm:py-3 cursor-pointer rounded-md text-xs sm:text-sm focus:outline-none font-medium transition-all duration-200 ${
                  isRealDataEnabled
                    ? "bg-green-500/20 text-green-400 hover:bg-green-500/30 border border-green-500/30 shadow-lg shadow-green-500/20"
                    : "bg-[#1a1a1a] text-gray-400 hover:bg-[#222222] border border-gray-700/50"
                }`}
              >
                {isRealDataEnabled ? <Wifi className="h-3 w-3 sm:h-4 sm:w-4" /> : <WifiOff className="h-3 w-3 sm:h-4 sm:w-4" />}
                <span className="hidden sm:inline">{isRealDataEnabled ? "Live Trading" : "Demo Mode"}</span>
                <span className="sm:hidden">{isRealDataEnabled ? "Live" : "Demo"}</span>
              </button>

              <button
                onClick={refreshData}
                disabled={loading}
                className="flex items-center space-x-1 sm:space-x-2 focus:outline-none focus:ring-0 bg-[#fefeff] hover:bg-neutral-200 disabled:opacity-50 cursor-pointer text-black font-medium py-2 px-3 sm:py-3 sm:px-4 rounded-md text-xs sm:text-sm"
              >
                <RefreshCw className={`h-3 w-3 sm:h-4 sm:w-4 ${loading ? "animate-spin" : ""}`} />
                <span className="hidden sm:inline">Refresh Data</span>
                <span className="sm:hidden">Refresh</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-8 space-y-6 sm:space-y-8">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6">
          <div className="bg-[#111111] border border-gray-800/50 rounded-xl sm:rounded-2xl p-4 sm:p-6 hover:scale-[1.02] transition-all duration-300 hover:border-gray-700/50 shadow-xl">
            <div className="flex flex-col space-y-3 sm:flex-row sm:items-center sm:justify-between sm:space-y-0 sm:mb-4">
              <div className="w-10 h-10 sm:w-14 sm:h-14 bg-blue-500/20 rounded-xl sm:rounded-2xl flex items-center justify-center shadow-lg shadow-blue-500/20 mx-auto sm:mx-0">
                <DollarSign className="h-5 w-5 sm:h-7 sm:w-7 text-blue-400" />
              </div>
              <div className="text-center sm:text-right">
                <p className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-1">Total Investment</p>
                <p className="text-lg sm:text-2xl font-bold text-white">
                  ₹{(totalInvestment / 1000).toFixed(0)}k
                  <span className="hidden sm:inline">
                    {totalInvestment >= 1000 ? `.${Math.floor((totalInvestment % 1000) / 100)}` : ""}
                  </span>
                </p>
              </div>
            </div>
          </div>

          <div className="bg-[#111111] border border-gray-800/50 rounded-xl sm:rounded-2xl p-4 sm:p-6 hover:scale-[1.02] transition-all duration-300 hover:border-gray-700/50 shadow-xl">
            <div className="flex flex-col space-y-3 sm:flex-row sm:items-center sm:justify-between sm:space-y-0 sm:mb-4">
              <div className="w-10 h-10 sm:w-14 sm:h-14 bg-purple-500/20 rounded-xl sm:rounded-2xl flex items-center justify-center shadow-lg shadow-purple-500/20 mx-auto sm:mx-0">
                <PieChart className="h-5 w-5 sm:h-7 sm:w-7 text-purple-400" />
              </div>
              <div className="text-center sm:text-right">
                <p className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-1">Present Value</p>
                <p className="text-lg sm:text-2xl font-bold text-white">
                  ₹{(totalPresentValue / 1000).toFixed(0)}k
                  <span className="hidden sm:inline">
                    {totalPresentValue >= 1000 ? `.${Math.floor((totalPresentValue % 1000) / 100)}` : ""}
                  </span>
                </p>
              </div>
            </div>
          </div>

          <div
            className={`bg-[#111111] border rounded-xl sm:rounded-2xl p-4 sm:p-6 hover:scale-[1.02] transition-all duration-300 shadow-xl ${
              isPositive
                ? "border-green-500/30 shadow-green-500/10 hover:border-green-500/50"
                : "border-red-500/30 shadow-red-500/10 hover:border-red-500/50"
            }`}
          >
            <div className="flex flex-col space-y-3 sm:flex-row sm:items-center sm:justify-between sm:space-y-0 sm:mb-4">
              <div
                className={`w-10 h-10 sm:w-14 sm:h-14 rounded-xl sm:rounded-2xl flex items-center justify-center shadow-lg mx-auto sm:mx-0 ${
                  isPositive ? "bg-green-500/20 shadow-green-500/20" : "bg-red-500/20 shadow-red-500/20"
                }`}
              >
                {isPositive ? (
                  <TrendingUp className="h-5 w-5 sm:h-7 sm:w-7 text-green-400" />
                ) : (
                  <TrendingDown className="h-5 w-5 sm:h-7 sm:w-7 text-red-400" />
                )}
              </div>
              <div className="text-center sm:text-right">
                <p className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-1">Total P&L</p>
                <p className={`text-lg sm:text-2xl font-bold ${isPositive ? "text-green-400" : "text-red-400"}`}>
                  {isPositive ? "+" : ""}₹
                  {Math.abs(totalGainLoss) >= 1000 
                    ? `${(Math.abs(totalGainLoss) / 1000).toFixed(0)}k`
                    : Math.abs(totalGainLoss).toLocaleString("en-IN", { minimumFractionDigits: 0 })
                  }
                </p>
              </div>
            </div>
          </div>

          <div
            className={`bg-[#111111] border rounded-xl sm:rounded-2xl p-4 sm:p-6 hover:scale-[1.02] transition-all duration-300 shadow-xl ${
              isPositive
                ? "border-green-500/30 shadow-green-500/10 hover:border-green-500/50"
                : "border-red-500/30 shadow-red-500/10 hover:border-red-500/50"
            }`}
          >
            <div className="flex flex-col space-y-3 sm:flex-row sm:items-center sm:justify-between sm:space-y-0 sm:mb-4">
              <div
                className={`w-10 h-10 sm:w-14 sm:h-14 rounded-xl sm:rounded-2xl flex items-center justify-center shadow-lg mx-auto sm:mx-0 ${
                  isPositive ? "bg-green-500/20 shadow-green-500/20" : "bg-red-500/20 shadow-red-500/20"
                }`}
              >
                {isPositive ? (
                  <TrendingUp className="h-5 w-5 sm:h-7 sm:w-7 text-green-400" />
                ) : (
                  <TrendingDown className="h-5 w-5 sm:h-7 sm:w-7 text-red-400" />
                )}
              </div>
              <div className="text-center sm:text-right">
                <p className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-1">Returns</p>
                <p className={`text-lg sm:text-2xl font-bold ${isPositive ? "text-green-400" : "text-red-400"}`}>
                  {isPositive ? "+" : ""}
                  {returnPercentage.toFixed(1)}%
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="flex flex-col space-y-4 sm:flex-row sm:items-center sm:justify-between sm:space-y-0">
          <div className="bg-[#111111] border border-gray-800/50 rounded-lg p-1 flex items-center space-x-1 shadow-xl overflow-x-auto">
            <button
              onClick={() => setActiveView("table")}
              className={`flex items-center space-x-2 sm:space-x-3 px-4 sm:px-6 py-2 sm:py-3 rounded-lg cursor-pointer text-xs sm:text-sm font-semibold transition-all duration-200 whitespace-nowrap ${
                activeView === "table"
                  ? "bg-[#fefeff] text-black shadow-lg shadow-white-500/25"
                  : "text-gray-400 hover:text-white hover:bg-[#1a1a1a]"
              }`}
            >
              <Table className="h-3 w-3 sm:h-4 sm:w-4" />
              <span>Holdings</span>
            </button>
            <button
              onClick={() => setActiveView("sectors")}
              className={`flex items-center space-x-2 sm:space-x-3 px-4 sm:px-6 py-2 sm:py-3 rounded-lg cursor-pointer text-xs sm:text-sm font-semibold transition-all duration-200 whitespace-nowrap ${
                activeView === "sectors"
                  ? "bg-[#fefeff] text-black shadow-lg shadow-blue-500/25"
                  : "text-gray-400 hover:text-white hover:bg-[#1a1a1a]"
              }`}
            >
              <BarChart3 className="h-3 w-3 sm:h-4 sm:w-4" />
              <span>Sectors</span>
            </button>
          </div>

          <div className="text-xs sm:text-sm text-gray-400 font-semibold text-center sm:text-right">
            {activeView === "table" ? `${stocks.length} Holdings` : `${sectorSummaries.length} Sectors`}
          </div>
        </div>

        {/* Content based on active view */}
        {activeView === "table" ? (
          <PortfolioTable data={stocks} />
        ) : (
          <SectorGrouping sectorSummaries={sectorSummaries} />
        )}

        <div className="text-center py-6 sm:py-8">
          <div className="bg-[#111111] border border-gray-800/50 rounded-xl sm:rounded-2xl p-4 sm:p-6 max-w-2xl mx-auto shadow-xl">
            <p className="text-gray-400 text-xs sm:text-sm leading-relaxed">
              <span className="font-semibold text-white">Auto-refresh enabled</span> • Portfolio syncs every 15 seconds
              •{isRealDataEnabled ? " Connected to live market feeds" : " Running in demo mode with simulated data"}
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}