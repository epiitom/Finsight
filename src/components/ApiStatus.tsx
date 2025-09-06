"use client"

import type React from "react"
import { CheckCircle, AlertCircle, Wifi, WifiOff } from "lucide-react"

interface ApiStatusProps {
  isRealDataEnabled: boolean
}

export const ApiStatus: React.FC<ApiStatusProps> = ({ isRealDataEnabled }) => {
  return (
    <div className="bg-[#131722] rounded-lg shadow-lg p-4 mb-6 border border-gray-700/50">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="flex items-center space-x-2">
            {isRealDataEnabled ? (
              <Wifi className="h-5 w-5 text-green-400" />
            ) : (
              <WifiOff className="h-5 w-5 text-gray-500" />
            )}
            <span className="font-medium text-white">API Status</span>
          </div>
        </div>

        <div className="flex items-center space-x-6">
          {/* Market Data API */}
          <div className="flex items-center space-x-2">
            {isRealDataEnabled ? (
              <AlertCircle className="h-4 w-4 text-yellow-400" />
            ) : (
              <CheckCircle className="h-4 w-4 text-green-400" />
            )}
            <div className="text-sm">
              <span className="text-gray-400">Market Data: </span>
              <span className={isRealDataEnabled ? "text-yellow-400" : "text-green-400"}>
                {isRealDataEnabled ? "Limited" : "Demo"}
              </span>
            </div>
          </div>

          {/* Portfolio Sync */}
          <div className="flex items-center space-x-2">
            <CheckCircle className="h-4 w-4 text-green-400" />
            <div className="text-sm">
              <span className="text-gray-400">Portfolio: </span>
              <span className="text-green-400">Active</span>
            </div>
          </div>

          {/* Real-time Updates */}
          <div className="flex items-center space-x-2">
            <CheckCircle className="h-4 w-4 text-green-400" />
            <div className="text-sm">
              <span className="text-gray-400">Updates: </span>
              <span className="text-green-400">15s</span>
            </div>
          </div>
        </div>
      </div>

      {isRealDataEnabled && (
        <div className="mt-3 p-3 bg-yellow-900/20 border border-yellow-500/30 rounded-md">
          <div className="flex items-start space-x-2">
            <AlertCircle className="h-4 w-4 text-yellow-400 mt-0.5 flex-shrink-0" />
            <div className="text-sm text-yellow-400">
              <p className="font-medium">Limited Market Data Access</p>
              <p className="text-xs mt-1 text-yellow-400/80">
                Real-time market data requires API configuration. Currently showing simulated data with random
                variations.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
