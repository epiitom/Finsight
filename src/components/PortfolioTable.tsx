/* eslint-disable @typescript-eslint/no-explicit-any */
"use client"

import type React from "react"
import { useReactTable, getCoreRowModel, flexRender, createColumnHelper, type ColumnDef } from "@tanstack/react-table"
import type { Stock } from "../types/portfolio"
import { TrendingUp, TrendingDown } from "lucide-react"

interface PortfolioTableProps {
  data: Stock[]
  onRefresh?: () => void
  isLoading?: boolean
}

const columnHelper = createColumnHelper<Stock>()

export const PortfolioTable: React.FC<PortfolioTableProps> = ({ data, onRefresh, isLoading = false }) => {
  console.log("📊 PortfolioTable render:", {
    stockCount: data.length,
    timestamp: Date.now(),
    firstStock: data[0]
      ? {
          symbol: data[0].symbol,
          cmp: data[0].cmp,
          presentValue: data[0].presentValue,
        }
      : null,
  })

  const columns: ColumnDef<Stock, any>[] = [
    columnHelper.accessor("particulars", {
      header: "Stock Name",
      cell: (info) => (
        <div className="font-medium text-white">
          {info.getValue()}
          <div className="text-sm text-gray-400">{info.row.original.exchange}</div>
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
      cell: (info) => <span className="font-mono text-gray-300">₹{info.getValue().toFixed(2)}</span>,
    }),
    columnHelper.accessor("exchange", {
      header: "Exchange",
      cell: (info) => <span className="font-mono text-gray-300">{info.getValue()}</span>,
    }),
    columnHelper.accessor("peRatio", {
      header: "P/E Ratio",
      cell: (info) => <span className="font-mono text-gray-300">{info.getValue()}</span>,
    }),
    columnHelper.accessor("latestEarnings", {
      header: "Latest Earnings",
      cell: (info) => <span className="font-mono text-gray-300">{info.getValue()}</span>,
    }),
    columnHelper.accessor("portfolioPercentage", {
      header: "Portfolio (%)",
      cell: (info) => {
        const value = info.getValue()
        return <span className="font-mono text-gray-300">{value.toFixed(2)}%</span>
      },
    }),
    columnHelper.accessor("quantity", {
      header: "Qty",
      cell: (info) => <span className="font-mono text-gray-300">{info.getValue()}</span>,
    }),
    columnHelper.accessor("investment", {
      header: "Investment",
      cell: (info) => (
        <span className="font-mono font-semibold text-white">
          ₹{info.getValue().toLocaleString("en-IN", { minimumFractionDigits: 2 })}
        </span>
      ),
    }),
    columnHelper.accessor("cmp", {
      header: "CMP",
      cell: (info) => {
        const cmp = info.getValue()
        const purchasePrice = info.row.original.purchasePrice
        const isUp = cmp && cmp > purchasePrice

        return (
          <div className="flex items-center space-x-1">
            <span className="font-mono font-bold text-[#2962ff]">₹{cmp?.toFixed(2) || "N/A"}</span>
            {cmp && (
              <>
                {isUp ? (
                  <TrendingUp className="h-4 w-4 text-green-400" />
                ) : (
                  <TrendingDown className="h-4 w-4 text-red-400" />
                )}
              </>
            )}
          </div>
        )
      },
    }),
    columnHelper.accessor("presentValue", {
      header: "Present Value",
      cell: (info) => (
        <span className="font-mono font-semibold text-white">
          ₹{info.getValue()?.toLocaleString("en-IN", { minimumFractionDigits: 2 }) || "N/A"}
        </span>
      ),
    }),
    columnHelper.accessor("gainLoss", {
      header: "Gain/Loss",
      cell: (info) => {
        const gainLoss = info.getValue()
        const isPositive = gainLoss && gainLoss > 0

        return (
          <div className="flex items-center space-x-1">
            <span
              className={`font-mono font-semibold ${
                gainLoss === undefined ? "text-gray-500" : isPositive ? "text-green-400" : "text-red-400"
              }`}
            >
              {gainLoss !== undefined ? (
                <>
                  {isPositive ? "+" : ""}₹{gainLoss.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                </>
              ) : (
                "N/A"
              )}
            </span>
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
    <div className="bg-[#131722] shadow-lg rounded-lg overflow-hidden border border-gray-700/50">
      <div className="px-6 py-4 border-b border-gray-700/50 flex justify-between items-center">
        <div>
          <h2 className="text-xl font-semibold text-white">Portfolio Holdings</h2>
          <p className="text-sm text-gray-400 mt-1">
            Showing {data.length} stocks • Last update: {new Date().toLocaleTimeString()}
          </p>
        </div>

        {onRefresh && (
          <button
            onClick={onRefresh}
            disabled={isLoading}
            className={`px-4 py-2 rounded border ${
              isLoading
                ? "border-gray-600 text-gray-500 cursor-not-allowed"
                : "border-[#2962ff] text-[#2962ff] hover:bg-[#2962ff]/10"
            }`}
          >
            {isLoading ? "Loading..." : "Refresh"}
          </button>
        )}
      </div>

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
          <tbody className="bg-[#131722] divide-y divide-gray-700/30">
            {table.getRowModel().rows.map((row) => (
              <tr key={row.id} className="hover:bg-[#1a1e2e] transition-colors">
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
    </div>
  )
}
