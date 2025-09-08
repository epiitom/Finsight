/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
"use client"
import type React from "react"
import { useReactTable, getCoreRowModel, flexRender, createColumnHelper, type ColumnDef } from "@tanstack/react-table"
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from "recharts"
import type { Stock, DataQuality } from "../types/portfolio"
import { 
  TrendingUp, 
  TrendingDown, 
  PieChartIcon, 
  BarChart3, 
  AlertTriangle, 
  CheckCircle, 
  Clock,
  Zap,
  DollarSign
} from "lucide-react"

interface PortfolioTableProps {
  data: Stock[]
  onRefresh?: () => void
  isLoading?: boolean
  apiStats?: any
  cacheStats?: any
  dataQualityStats?: Record<DataQuality, number>
}

const columnHelper = createColumnHelper<Stock>()

const CHART_COLORS = [
  "#2962ff", "#00d4aa", "#ff6b6b", "#4ecdc4", "#45b7d1", 
  "#96ceb4", "#feca57", "#ff9ff3", "#54a0ff", "#5f27cd"
]

const DataQualityBadge: React.FC<{ quality: DataQuality; hasError?: boolean }> = ({ quality, hasError }) => {
  if (hasError) {
    return (
      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-red-500/20 text-red-400 border border-red-500/30">
        <AlertTriangle className="h-3 w-3 mr-1" />
        Error
      </span>
    )
  }

  const config = {
    complete: { color: "text-green-400", bg: "bg-green-500/20", border: "border-green-500/30", icon: CheckCircle },
    partial: { color: "text-yellow-400", bg: "bg-yellow-500/20", border: "border-yellow-500/30", icon: Clock },
    basic: { color: "text-blue-400", bg: "bg-blue-500/20", border: "border-blue-500/30", icon: Zap }
  }

  const { color, bg, border, icon: Icon } = config[quality]

  return (
    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs ${color} ${bg} border ${border}`}>
      <Icon className="h-3 w-3 mr-1" />
      {quality.charAt(0).toUpperCase() + quality.slice(1)}
    </span>
  )
}

const FinancialMetricCell: React.FC<{ value?: number; format?: 'currency' | 'percentage' | 'ratio' | 'number' }> = ({ 
  value, 
  format = 'ratio' 
}) => {
  if (value === undefined || value === null || isNaN(value)) {
    return <span className="text-gray-500">-</span>
  }

  const formatValue = (val: number) => {
    switch (format) {
      case 'currency':
        return `₹${val.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`
      case 'percentage':
        return `${val.toFixed(2)}%`
      case 'number':
        return val.toLocaleString('en-IN')
      case 'ratio':
      default:
        return val.toFixed(2)
    }
  }

  return <span className="font-mono text-gray-300">{formatValue(value)}</span>
}

export const PortfolioTable: React.FC<PortfolioTableProps> = ({ 
  data, 
  onRefresh, 
  isLoading = false,
  apiStats,
  cacheStats,
  dataQualityStats
}) => {
  const sectorData = data.reduce(
    (acc, stock) => {
      const existing = acc.find((item) => item.sector === stock.sector)
      if (existing) {
        existing.value += stock.investment
        existing.percentage += stock.portfolioPercentage
      } else {
        acc.push({
          sector: stock.sector,
          value: stock.investment,
          percentage: stock.portfolioPercentage,
        })
      }
      return acc
    },
    [] as Array<{ sector: string; value: number; percentage: number }>
  )

  const performanceData = data
    .filter((stock) => stock.gainLoss !== undefined)
    .map((stock) => ({
      name: stock.particulars.length > 10 ? stock.particulars.substring(0, 10) + "..." : stock.particulars,
      gainLoss: stock.gainLoss || 0,
      gainLossPercentage: stock.gainLossPercentage || 0,
      investment: stock.investment,
      presentValue: stock.presentValue || 0,
    }))
    .sort((a, b) => (b.gainLossPercentage || 0) - (a.gainLossPercentage || 0))
    .slice(0, 10)

  const peRatioData = data
    .filter(stock => stock.peRatio && stock.peRatio > 0 && stock.peRatio < 100)
    .map(stock => ({
      name: stock.symbol,
      peRatio: stock.peRatio,
      sector: stock.sector
    }))

  const columns: ColumnDef<Stock, any>[] = [
    columnHelper.accessor("particulars", {
      header: "Stock Details",
      cell: (info) => (
        <div className="min-w-0">
          <div className="font-medium text-white truncate">
            {info.getValue()}
          </div>
          <div className="flex items-center space-x-2 mt-1">
            <span className="text-sm text-gray-400">{info.row.original.symbol}</span>
            <span className="text-xs text-gray-500">•</span>
            <span className="text-xs text-gray-500">{info.row.original.exchange}</span>
          
          </div>
        </div>
      ),
    }),
    columnHelper.accessor("sector", {
      header: "Sector",
      cell: (info) => (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-[#2962ff]/20 text-[#2962ff] border border-[#2962ff]/30">
          {info.getValue()}
        </span>
      ),
    }),
    columnHelper.accessor("purchasePrice", {
      header: "Purchase Price",
      cell: (info) => <FinancialMetricCell value={info.getValue()} format="currency" />,
    }),
    columnHelper.accessor("cmp", {
      header: "Current Price",
      cell: (info) => {
        const cmp = info.getValue()
        const stock = info.row.original
        const purchasePrice = stock.purchasePrice
        const changePercent = stock.changePercent
        const isUp = cmp && cmp > purchasePrice

        return (
          <div className="space-y-1">
            <div className="flex items-center space-x-1">
              <FinancialMetricCell value={cmp} format="currency" />
              {cmp && (
                <>
                  {isUp ? (
                    <TrendingUp className="h-3 w-3 text-green-400" />
                  ) : (
                    <TrendingDown className="h-3 w-3 text-red-400" />
                  )}
                </>
              )}
            </div>
            
          
          </div>
        )
      },
    }),
    columnHelper.accessor("quantity", {
      header: "Qty",
      cell: (info) => <span className="font-mono text-gray-300">{info.getValue()}</span>,
    }),
    columnHelper.accessor("investment", {
      header: "Investment",
      cell: (info) => <FinancialMetricCell value={info.getValue()} format="currency" />,
    }),
    columnHelper.accessor("presentValue", {
      header: "Present Value",
      cell: (info) => <FinancialMetricCell value={info.getValue()} format="currency" />,
    }),
    columnHelper.accessor("gainLoss", {
      header: "Gain/Loss",
      cell: (info) => {
        const gainLoss = info.getValue()
        const gainLossPercentage = info.row.original.gainLossPercentage
        const isPositive = gainLoss && gainLoss > 0
        
        return (
          <div className="space-y-1">
            <div className={`font-mono font-semibold ${
              gainLoss === undefined ? "text-gray-500" : isPositive ? "text-green-400" : "text-red-400"
            }`}>
              {gainLoss !== undefined ? (
                <>
                  {isPositive ? "+" : ""}₹{gainLoss.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                </>
              ) : (
                "N/A"
              )}
            </div>
            {gainLossPercentage !== undefined && (
              <div className={`text-xs ${gainLossPercentage >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                {gainLossPercentage >= 0 ? '+' : ''}{gainLossPercentage.toFixed(2)}%
              </div>
            )}
          </div>
        )
      },
    }),
    columnHelper.accessor("peRatio", {
      header: "P/E Ratio",
      cell: (info) => {
        const peRatio = info.getValue()
        const forwardPE = info.row.original.forwardPE
        
        return (
          <div className="space-y-1">
            <FinancialMetricCell value={info.getValue()} format="ratio" />
            {forwardPE !== undefined && (
              <div className="text-xs text-gray-500">
                F: {forwardPE.toFixed(2)}
              </div>
            )}
          </div>
        )
      },
    }),
    columnHelper.accessor("marketCap", {
      header: "Market Cap",
      cell: (info) => {
        const marketCap = info.getValue()
        if (!marketCap) return <span className="text-gray-500">-</span>
        
        const formatMarketCap = (value: number) => {
          if (value >= 1e12) return `₹${(value / 1e12).toFixed(1)}T`
          if (value >= 1e9) return `₹${(value / 1e9).toFixed(1)}B`
          if (value >= 1e7) return `₹${(value / 1e7).toFixed(1)}Cr`
          return `₹${(value / 1e5).toFixed(1)}L`
        }
        
        return <span className="font-mono text-gray-300">{formatMarketCap(marketCap)}</span>
      },
    }),
    columnHelper.accessor("dividendYield", {
      header: "Div. Yield",
      cell: (info) => <FinancialMetricCell value={info.getValue()} format="percentage" />,
    }),
    columnHelper.accessor("beta", {
      header: "Beta",
      cell: (info) => {
        const beta = info.getValue()
        if (!beta) return <span className="text-gray-500">-</span>
        
        const getBetaColor = (betaValue: number) => {
          if (betaValue < 0.8) return "text-green-400"
          if (betaValue > 1.2) return "text-red-400"
          return "text-yellow-400"
        }
        
        return (
          <span className={`font-mono ${getBetaColor(beta)}`}>
            {beta.toFixed(2)}
          </span>
        )
      },
    }),
    columnHelper.accessor("portfolioPercentage", {
      header: "Portfolio %",
      cell: (info) => {
        const percentage = info.getValue()
        return (
          <div className="flex items-center space-x-2">
            <span className="font-mono text-gray-300">{percentage.toFixed(2)}%</span>
            <div className="w-12 bg-gray-700 rounded-full h-1.5">
              <div 
                className="bg-[#2962ff] h-1.5 rounded-full transition-all duration-300" 
                style={{ width: `${Math.min(percentage, 100)}%` }}
              />
            </div>
          </div>
        )
      },
    }),
  ]

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
  })

  return (
    <div className="bg-[#0a0a0b] shadow-lg rounded-lg overflow-hidden border border-gray-700/50">
      {/* Enhanced Header with API Stats */}
      <div className="px-6 py-4 border-b border-gray-700/50">
        <div className="flex justify-between items-start">
          <div>
            <h2 className="text-xl font-semibold text-white flex items-center gap-2">
              <DollarSign className="h-5 w-5 text-[#2962ff]" />
              Portfolio Holdings
            </h2>
            <p className="text-sm text-gray-400 mt-1">
              Showing {data.length} stocks • Last update: {new Date().toLocaleTimeString()}
            </p>
            
            {/* API Performance Stats */}
            {apiStats && (
              <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
                <span>Success: {apiStats.successful}/{apiStats.total}</span>
                <span>Cache: {apiStats.cacheHitRate}</span>
                {dataQualityStats && (
                  <span>Complete Data: {dataQualityStats.complete || 0}</span>
                )}
              </div>
            )}
          </div>

          <div className="flex items-center gap-3">
            {/* Data Quality Indicator */}
            {dataQualityStats && (
              <div className="flex items-center gap-1 text-xs">
                <DataQualityBadge quality="complete" />
                <span className="text-gray-400">{dataQualityStats.complete || 0}</span>
                <DataQualityBadge quality="partial" />
                <span className="text-gray-400">{dataQualityStats.partial || 0}</span>
                <DataQualityBadge quality="basic" />
                <span className="text-gray-400">{dataQualityStats.basic || 0}</span>
              </div>
            )}
            
            {onRefresh && (
              <button
                onClick={onRefresh}
                disabled={isLoading}
                className={`px-4 py-2 rounded border transition-colors ${
                  isLoading
                    ? "border-gray-600 text-gray-500 cursor-not-allowed"
                    : "border-[#2962ff] text-[#2962ff] hover:bg-[#2962ff]/10"
                }`}
              >
                {isLoading ? "Loading..." : "Refresh"}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Enhanced Charts Section */}
      {data.length > 0 && (
        <div className="px-6 py-6 border-b border-gray-700/50">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Sector Allocation Pie Chart */}
            <div className="bg-[#0d1421] rounded-lg p-4">
              <div className="flex items-center gap-2 mb-4">
                <PieChartIcon className="h-5 w-5 text-[#2962ff]" />
                <h3 className="text-lg font-semibold text-white">Sector Allocation</h3>
              </div>
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie
                    data={sectorData}
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                    label={({ sector, percentage }) => `${sector}: ${percentage.toFixed(1)}%`}
                  >
                    {sectorData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(value: number) => [`₹${value.toLocaleString("en-IN")}`, "Investment"]}
                    contentStyle={{
                      backgroundColor: "#1a1e2e",
                      border: "1px solid #374151",
                      borderRadius: "8px",
                      color: "#fff",
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>

            {/* Performance Bar Chart */}
            <div className="bg-[#0d1421] rounded-lg p-4">
              <div className="flex items-center gap-2 mb-4">
                <BarChart3 className="h-5 w-5 text-[#2962ff]" />
                <h3 className="text-lg font-semibold text-white">Top Performers</h3>
              </div>
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={performanceData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                  <XAxis dataKey="name" stroke="#9ca3af" fontSize={12} angle={-45} textAnchor="end" height={80} />
                  <YAxis stroke="#9ca3af" fontSize={12} />
                  <Tooltip
                    formatter={(value: number, name: string) => [
                      name === "gainLossPercentage" ? `${value.toFixed(2)}%` : `₹${value.toLocaleString("en-IN")}`,
                      name === "gainLossPercentage" ? "Return %" : "Gain/Loss"
                    ]}
                    contentStyle={{
                      backgroundColor: "#1a1e2e",
                      border: "1px solid #374151",
                      borderRadius: "8px",
                      color: "#fff",
                    }}
                  />
                  <Bar dataKey="gainLossPercentage" fill="#10b981" radius={[4, 4, 0, 0]}>
                    {performanceData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.gainLossPercentage >= 0 ? "#10b981" : "#ef4444"} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* PE Ratio Distribution */}
            <div className="bg-[#0d1421] rounded-lg p-4">
              <div className="flex items-center gap-2 mb-4">
                <TrendingUp className="h-5 w-5 text-[#2962ff]" />
                <h3 className="text-lg font-semibold text-white">P/E Ratios</h3>
              </div>
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={peRatioData.slice(0, 8)}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                  <XAxis dataKey="name" stroke="#9ca3af" fontSize={12} angle={-45} textAnchor="end" height={80} />
                  <YAxis stroke="#9ca3af" fontSize={12} />
                  <Tooltip
                    formatter={(value: number) => [`${value.toFixed(2)}`, "P/E Ratio"]}
                    contentStyle={{
                      backgroundColor: "#1a1e2e",
                      border: "1px solid #374151",
                      borderRadius: "8px",
                      color: "#fff",
                    }}
                  />
                  <Bar dataKey="peRatio" fill="#feca57" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}

      {/* Enhanced Table */}
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-700/50">
          <thead className="bg-[#0d1421]">
            {table.getHeaderGroups().map((headerGroup) => (
              <tr key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <th
                    key={header.id}
                    className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider"
                  >
                    {header.isPlaceholder ? null : flexRender(header.column.columnDef.header, header.getContext())}
                  </th>
                ))}
              </tr>
            ))}
          </thead>
          <tbody className="bg-[#0a0a0b] divide-y divide-gray-700/30">
            {table.getRowModel().rows.map((row) => (
              <tr key={row.id} className={`hover:bg-[#1a1e2e] transition-colors ${
                row.original.hasError ? 'bg-red-500/5' : row.original.isStale ? 'bg-yellow-500/5' : ''
              }`}>
                {row.getVisibleCells().map((cell) => (
                  <td key={cell.id} className="px-6 py-4 whitespace-nowrap text-sm">
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Enhanced Footer with Stats */}
      {data.length > 0 && (
        <div className="px-6 py-4 bg-[#0d1421] border-t border-gray-700/50">
          <div className="flex justify-between items-center text-sm text-gray-400">
            <div className="flex items-center gap-4">
              <span>Total Stocks: {data.length}</span>
              <span>With Errors: {data.filter(s => s.hasError).length}</span>
              <span>Stale Data: {data.filter(s => s.isStale).length}</span>
            </div>
            {cacheStats && (
              <div className="flex items-center gap-4">
                <span>Cache: {cacheStats.size}/{cacheStats.maxSize}</span>
                {apiStats && <span>API Success: {((apiStats.successful / apiStats.total) * 100).toFixed(1)}%</span>}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
    