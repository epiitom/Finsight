'use client';

import React, { useMemo } from 'react';
import {
  useReactTable,
  getCoreRowModel,
  flexRender,
  createColumnHelper,
  ColumnDef,
} from '@tanstack/react-table';
import { Stock } from '../types/portfolio';
import { TrendingUp, TrendingDown } from 'lucide-react';

interface PortfolioTableProps {
  data: Stock[];
}

const columnHelper = createColumnHelper<Stock>();

export const PortfolioTable: React.FC<PortfolioTableProps> = ({ data }) => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const columns = useMemo<ColumnDef<Stock, any>[]>(
    () => [
      columnHelper.accessor('particulars', {
        header: 'Stock Name',
        cell: (info) => (
          <div className="font-medium text-gray-900">
            {info.getValue()}
            <div className="text-sm text-gray-500">{info.row.original.exchange}</div>
          </div>
        ),
      }),
      columnHelper.accessor('sector', {
        header: 'Sector',
        cell: (info) => (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
            {info.getValue()}
          </span>
        ),
      }),
      columnHelper.accessor('purchasePrice', {
        header: 'Purchase Price',
        cell: (info) => (
          <span className="font-mono">₹{info.getValue().toFixed(2)}</span>
        ),
      }),
      columnHelper.accessor('quantity', {
        header: 'Qty',
        cell: (info) => <span className="font-mono">{info.getValue()}</span>,
      }),
      columnHelper.accessor('investment', {
        header: 'Investment',
        cell: (info) => (
          <span className="font-mono font-semibold">₹{info.getValue().toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
        ),
      }),
      columnHelper.accessor('portfolioPercentage', {
        header: 'Portfolio %',
        cell: (info) => (
          <span className="font-mono">{info.getValue().toFixed(2)}%</span>
        ),
      }),
      columnHelper.accessor('cmp', {
        header: 'CMP',
        cell: (info) => {
          const cmp = info.getValue();
          const purchasePrice = info.row.original.purchasePrice;
          const isUp = cmp && cmp > purchasePrice;
          
          return (
            <div className="flex items-center space-x-1">
              <span className="font-mono">₹{cmp?.toFixed(2) || 'N/A'}</span>
              {cmp && (
                <>
                  {isUp ? (
                    <TrendingUp className="h-4 w-4 text-green-500" />
                  ) : (
                    <TrendingDown className="h-4 w-4 text-red-500" />
                  )}
                </>
              )}
            </div>
          );
        },
      }),
      columnHelper.accessor('presentValue', {
        header: 'Present Value',
        cell: (info) => (
          <span className="font-mono font-semibold">₹{info.getValue()?.toLocaleString('en-IN', { minimumFractionDigits: 2 }) || 'N/A'}</span>
        ),
      }),
      columnHelper.accessor('gainLoss', {
        header: 'Gain/Loss',
        cell: (info) => {
          const gainLoss = info.getValue();
          const isPositive = gainLoss && gainLoss > 0;
          
          return (
            <div className="flex items-center space-x-1">
              <span 
                className={`font-mono font-semibold ${
                  gainLoss === undefined 
                    ? 'text-gray-500' 
                    : isPositive 
                      ? 'text-green-600' 
                      : 'text-red-600'
                }`}
              >
                {gainLoss !== undefined ? (
                  <>
                    {isPositive ? '+' : ''}₹{gainLoss.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                  </>
                ) : 'N/A'}
              </span>
              {gainLoss !== undefined && (
                <>
                  {isPositive ? (
                    <TrendingUp className="h-4 w-4 text-green-500" />
                  ) : (
                    <TrendingDown className="h-4 w-4 text-red-500" />
                  )}
                </>
              )}
            </div>
          );
        },
      }),
      columnHelper.accessor('peRatio', {
        header: 'P/E Ratio',
        cell: (info) => (
          <span className="font-mono">{info.getValue()?.toFixed(1) || 'N/A'}</span>
        ),
      }),
      columnHelper.accessor('latestEarnings', {
        header: 'Latest Earnings',
        cell: (info) => (
          <span className="text-sm text-gray-600">{info.getValue() || 'N/A'}</span>
        ),
      }),
    ],
    []
  );

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  return (
    <div className="bg-white shadow-lg rounded-lg overflow-hidden">
      <div className="px-6 py-4 border-b border-gray-200">
        <h2 className="text-xl font-semibold text-gray-900">Portfolio Holdings</h2>
        <p className="text-sm text-gray-600 mt-1">
          Real-time portfolio performance and stock details
        </p>
      </div>
      
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            {table.getHeaderGroups().map((headerGroup) => (
              <tr key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <th
                    key={header.id}
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                  >
                    {header.isPlaceholder
                      ? null
                      : flexRender(header.column.columnDef.header, header.getContext())}
                  </th>
                ))}
              </tr>
            ))}
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {table.getRowModel().rows.map((row, index) => (
              <tr 
                key={row.id}
                className={`${index % 2 === 0 ? 'bg-white' : 'bg-gray-50'} hover:bg-gray-100 transition-colors duration-150`}
              >
                {row.getVisibleCells().map((cell) => (
                  <td
                    key={cell.id}
                    className="px-6 py-4 whitespace-nowrap text-sm"
                  >
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};