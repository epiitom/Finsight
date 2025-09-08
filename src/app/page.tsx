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
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
        <div className="text-center">
          <div className="relative">
            <div className="absolute inset-0 bg-blue-500/20 rounded-full blur-xl animate-pulse"></div>
            <RefreshCw className="relative h-16 w-16 text-blue-400 animate-spin mx-auto mb-6" />
          </div>
          <p className="text-xl font-medium text-white mb-2">Loading Portfolio</p>
          <p className="text-gray-400">Fetching your latest market data...</p>
        </div>
      </div>
    )
  }

  if (error && !portfolioData) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
        <div className="text-center max-w-md">
          <div className="bg-[#1a1a1a] border border-red-500/20 rounded-2xl p-8 mb-6 shadow-2xl shadow-red-500/10">
            <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <Activity className="h-8 w-8 text-red-400" />
            </div>
            <h3 className="text-xl font-semibold text-white mb-2">Connection Error</h3>
            <p className="text-gray-400 text-sm mb-4">{error}</p>
          </div>
          <button
            onClick={refreshData}
            className="bg-blue-600 hover:bg-blue-500 text-white font-medium py-3 px-6 rounded-xl transition-all duration-200 hover:scale-105 shadow-lg shadow-blue-500/25"
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
      <header className="bg-[#11111] border-b border-gray-800/50  sticky top-0 px-5 py-2 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-6 lg:px-8 ">
          <div className="flex items-center justify-between">
            <div className="space-y-3">
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 bg-gradient-to-br from-green-400 rounded-2xl flex items-center justify-center shadow-lg ">
                  <Target className="h-7 w-7 text-white" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-white tracking-tight">FinSight</h1>
                  <p className="text-gray-400 ">Professional Trading Dashboard</p>
                </div>
              </div>
              
            </div>

            <div className="flex items-center space-x-4">
              <button
                onClick={toggleRealData}
                className={`flex items-center space-x-3 px-4 py-3 cursor-pointer rounded-md text-sm focus:outline-none font-medium transition-all duration-200 ${
                  isRealDataEnabled
                    ? "bg-green-500/20 text-green-400 hover:bg-green-500/30 border border-green-500/30 shadow-lg shadow-green-500/20"
                    : "bg-[#1a1a1a] text-gray-400 hover:bg-[#222222] border border-gray-700/50"
                }`}
              >
                {isRealDataEnabled ? <Wifi className="h-4 w-4" /> : <WifiOff className="h-4 w-4" />}
                <span>{isRealDataEnabled ? "Live Trading" : "Demo Mode"}</span>
              </button>

              <button
                onClick={refreshData}
                disabled={loading}
                className="flex items-center space-x-1 focus:outline-none focus:ring-0 bg-[#fefeff] hover:bg-neutral-200 disabled:opacity-50 cursor-pointer text-black font-medium py-3 px-2 rounded-md "
              >
                <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
                <span>Refresh Data</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-6 lg:px-8 py-8 space-y-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-[#111111] border border-gray-800/50 rounded-2xl p-6 hover:scale-[1.02] transition-all duration-300 hover:border-gray-700/50 shadow-xl">
            <div className="flex items-center justify-between mb-4">
              <div className="w-14 h-14 bg-blue-500/20 rounded-2xl flex items-center justify-center shadow-lg shadow-blue-500/20">
                <DollarSign className="h-7 w-7 text-blue-400" />
              </div>
              <div className="text-right">
                <p className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-1">Total Investment</p>
                <p className="text-2xl font-bold text-white">
                  ₹{totalInvestment.toLocaleString("en-IN", { minimumFractionDigits: 0 })}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-[#111111] border border-gray-800/50 rounded-2xl p-6 hover:scale-[1.02] transition-all duration-300 hover:border-gray-700/50 shadow-xl">
            <div className="flex items-center justify-between mb-4">
              <div className="w-14 h-14 bg-purple-500/20 rounded-2xl flex items-center justify-center shadow-lg shadow-purple-500/20">
                <PieChart className="h-7 w-7 text-purple-400" />
              </div>
              <div className="text-right">
                <p className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-1">Present Value</p>
                <p className="text-2xl font-bold text-white">
                  ₹{totalPresentValue.toLocaleString("en-IN", { minimumFractionDigits: 0 })}
                </p>
              </div>
            </div>
          </div>

          <div
            className={`bg-[#111111] border rounded-2xl p-6 hover:scale-[1.02] transition-all duration-300 shadow-xl ${
              isPositive
                ? "border-green-500/30 shadow-green-500/10 hover:border-green-500/50"
                : "border-red-500/30 shadow-red-500/10 hover:border-red-500/50"
            }`}
          >
            <div className="flex items-center justify-between mb-4">
              <div
                className={`w-14 h-14 rounded-2xl flex items-center justify-center shadow-lg ${
                  isPositive ? "bg-green-500/20 shadow-green-500/20" : "bg-red-500/20 shadow-red-500/20"
                }`}
              >
                {isPositive ? (
                  <TrendingUp className="h-7 w-7 text-green-400" />
                ) : (
                  <TrendingDown className="h-7 w-7 text-red-400" />
                )}
              </div>
              <div className="text-right">
                <p className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-1">Total P&L</p>
                <p className={`text-2xl font-bold ${isPositive ? "text-green-400" : "text-red-400"}`}>
                  {isPositive ? "+" : ""}₹
                  {Math.abs(totalGainLoss).toLocaleString("en-IN", { minimumFractionDigits: 0 })}
                </p>
              </div>
            </div>
          </div>

          <div
            className={`bg-[#111111] border rounded-2xl p-6 hover:scale-[1.02] transition-all duration-300 shadow-xl ${
              isPositive
                ? "border-green-500/30 shadow-green-500/10 hover:border-green-500/50"
                : "border-red-500/30 shadow-red-500/10 hover:border-red-500/50"
            }`}
          >
            <div className="flex items-center justify-between mb-4 focus:outline-none">
              <div
                className={`w-14 h-14 rounded-2xl flex items-center justify-center shadow-lg ${
                  isPositive ? "bg-green-500/20 shadow-green-500/20" : "bg-red-500/20 shadow-red-500/20"
                }`}
              >
                {isPositive ? (
                  <TrendingUp className="h-7 w-7 text-green-400" />
                ) : (
                  <TrendingDown className="h-7 w-7 text-red-400" />
                )}
              </div>
              <div className="text-right">
                <p className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-1">Returns</p>
                <p className={`text-2xl font-bold ${isPositive ? "text-green-400" : "text-red-400"}`}>
                  {isPositive ? "+" : ""}
                  {returnPercentage.toFixed(2)}%
                </p>
              </div>
            </div>
          </div>
        </div>


       

        <div className="flex items-center justify-between">
          <div className="bg-[#111111] border border-gray-800/50 rounded-md p-1 flex items-center space-x-2 shadow-xl">
            <button
              onClick={() => setActiveView("table")}
              className={`flex items-center space-x-3 px-6 py-3 rounded-xl cursor-pointer text-sm font-semibold transition-all duration-200 ${
                activeView === "table"
                  ? "bg-[#fefeff] text-black shadow-lg shadow-white-500/25"
                  : "text-gray-400 hover:text-white hover:bg-[#1a1a1a]"
              }`}
            >
              <Table className="h-4 w-4" />
              <span>Holdings Table</span>
            </button>
            <button
              onClick={() => setActiveView("sectors")}
              className={`flex items-center space-x-3 px-6 py-3 rounded-xl cursor-pointer text-sm font-semibold transition-all duration-200 ${
                activeView === "sectors"
                  ? "bg-[#fefeff] text-black shadow-lg shadow-blue-500/25"
                  : "text-gray-400 hover:text-white hover:bg-[#1a1a1a]"
              }`}
            >
              <BarChart3 className="h-4 w-4" />
              <span>Sector Analysis</span>
            </button>
          </div>

          <div className="text-sm text-gray-400 font-semibold">
            {activeView === "table" ? `${stocks.length} Holdings` : `${sectorSummaries.length} Sectors`}
          </div>
        </div>

        {/* Content based on active view */}
        {activeView === "table" ? (
          <PortfolioTable data={stocks} />
        ) : (
        <SectorGrouping sectorSummaries={sectorSummaries} />

        )}

        <div className="text-center py-8">
          <div className="bg-[#111111] border border-gray-800/50 rounded-2xl p-6 max-w-2xl mx-auto shadow-xl">
            <p className="text-gray-400 text-sm leading-relaxed">
              <span className="font-semibold text-white">Auto-refresh enabled</span> • Portfolio syncs every 15 seconds
              •{isRealDataEnabled ? " Connected to live market feeds" : " Running in demo mode with simulated data"}
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
