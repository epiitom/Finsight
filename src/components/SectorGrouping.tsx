"use client"

import type React from "react"
import { useState } from "react"
import type { SectorSummary } from "../types/portfolio"
import { ChevronDown, ChevronUp, TrendingUp, TrendingDown, DollarSign } from "lucide-react"

interface SectorGroupingProps {
  sectorSummaries: SectorSummary[]
}

const SectorCard: React.FC<{ sectorSummary: SectorSummary }> = ({ sectorSummary }) => {
  const [isExpanded, setIsExpanded] = useState(false)
  const { sector, totalInvestment, totalPresentValue, gainLoss, stocks } = sectorSummary

  const isPositive = gainLoss > 0
  const returnPercentage = (gainLoss / totalInvestment) * 100

  return (
    <div className="bg-[#0a0a0b] rounded-lg shadow-lg border border-gray-700/50 overflow-hidden">
      {/* Sector Header */}
      <div
        className="p-6 cursor-pointer hover:bg-[#1a1e2e] transition-colors"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="flex-shrink-0">
              <div className="w-12 h-12 bg-[#2962ff]/20 rounded-lg flex items-center justify-center border border-[#2962ff]/30">
                <DollarSign className="h-6 w-6 text-[#2962ff]" />
              </div>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-white">{sector}</h3>
              <p className="text-sm text-gray-400">{stocks.length} stocks</p>
            </div>
          </div>

          <div className="flex items-center space-x-6">
            {/* Investment */}
            <div className="text-right">
              <p className="text-sm text-gray-400">Investment</p>
              <p className="text-lg font-semibold text-white">
                ₹{totalInvestment.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
              </p>
            </div>

            {/* Present Value */}
            <div className="text-right">
              <p className="text-sm text-gray-400">Present Value</p>
              <p className="text-lg font-semibold text-white">
                ₹{totalPresentValue.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
              </p>
            </div>

            {/* Gain/Loss */}
            <div className="text-right">
              <p className="text-sm text-gray-400">Gain/Loss</p>
              <div className="flex items-center space-x-2">
                <span className={`text-lg font-semibold ${isPositive ? "text-green-400" : "text-red-400"}`}>
                  {isPositive ? "+" : ""}₹{gainLoss.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                </span>
                {isPositive ? (
                  <TrendingUp className="h-4 w-4 text-green-400" />
                ) : (
                  <TrendingDown className="h-4 w-4 text-red-400" />
                )}
              </div>
              <p className={`text-sm ${isPositive ? "text-green-400" : "text-red-400"}`}>
                {isPositive ? "+" : ""}
                {returnPercentage.toFixed(2)}%
              </p>
            </div>

            {/* Expand/Collapse Icon */}
            <div className="flex-shrink-0">
              {isExpanded ? (
                <ChevronUp className="h-5 w-5 text-gray-400" />
              ) : (
                <ChevronDown className="h-5 w-5 text-gray-400" />
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Expanded Stock List */}
      {isExpanded && (
        <div className="border-t border-gray-700/50 bg-[#0a0a0b]">
          <div className="p-6">
            <h4 className="text-sm font-medium text-white mb-4">Stocks in {sector}</h4>
            <div className="space-y-3">
              {stocks.map((stock) => (
                <div
                  key={stock.id}
                  className="flex items-center justify-between py-3 px-4 bg-[#0a0a0b] rounded-md border border-gray-700/30 hover:bg-[#1a1e2e] transition-colors"
                >
                  <div className="flex items-center space-x-3">
                    <div>
                      <p className="font-medium text-white">{stock.particulars}</p>
                      <p className="text-sm text-gray-400">{stock.quantity} shares</p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-6 text-sm">
                    <div className="text-right">
                      <p className="text-gray-400">Investment</p>
                      <p className="font-medium text-gray-300">₹{stock.investment.toLocaleString("en-IN")}</p>
                    </div>

                    <div className="text-right">
                      <p className="text-gray-400">Current</p>
                      <p className="font-medium text-gray-300">₹{(stock.presentValue || 0).toLocaleString("en-IN")}</p>
                    </div>

                    <div className="text-right">
                      <p className="text-gray-400">Gain/Loss</p>
                      <p className={`font-medium ${(stock.gainLoss || 0) > 0 ? "text-green-400" : "text-red-400"}`}>
                        {(stock.gainLoss || 0) > 0 ? "+" : ""}₹{(stock.gainLoss || 0).toLocaleString("en-IN")}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export const SectorGrouping: React.FC<SectorGroupingProps> = ({ sectorSummaries }) => {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-white">Sector Analysis</h2>
        <p className="text-sm text-gray-400">{sectorSummaries.length} sectors</p>
      </div>

      <div className="space-y-4">
        {sectorSummaries.map((sectorSummary) => (
          <SectorCard key={sectorSummary.sector} sectorSummary={sectorSummary} />
        ))}
      </div>
    </div>
  )
}
