/**
 * Test Chart Page
 * 
 * Development page for testing the chart implementation with Bitcoin data.
 * This page can be accessed at /test-chart during development.
 */

import { Chart } from '@/components/chart'

export default function TestChartPage() {
  return (
    <div className="min-h-screen bg-black p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">
            Chart Implementation Test
          </h1>
          <p className="text-zinc-400">
            Testing TradingView lightweight-charts with Bitcoin (X:BTCUSD)
          </p>
        </div>

        {/* Chart Component */}
        <Chart
          ticker="X:BTCUSD"
          initialTimeframe="1d"
          height={600}
          enableRealtime={false}
        />

        {/* Instructions */}
        <div className="mt-8 p-6 bg-zinc-900 rounded-lg border border-zinc-800">
          <h2 className="text-xl font-semibold text-white mb-4">
            Testing Checklist
          </h2>
          <ul className="space-y-2 text-sm text-zinc-300">
            <li className="flex items-start gap-2">
              <span className="text-blue-400">✓</span>
              <span>Chart renders with Bitcoin candlestick data</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-blue-400">✓</span>
              <span>Candlesticks show green (up) and red (down) colors</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-blue-400">✓</span>
              <span>Timeframe switching works (1h, 4h, 1d, 1w, 1m)</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-blue-400">✓</span>
              <span>Pan and zoom functionality works smoothly</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-blue-400">✓</span>
              <span>Crosshair displays price and time on hover</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-blue-400">✓</span>
              <span>Real-time price updates appear (WebSocket)</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-blue-400">✓</span>
              <span>Toggle SMA indicator on/off</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-blue-400">✓</span>
              <span>Toggle EMA indicator on/off</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-blue-400">✓</span>
              <span>Toggle RSI indicator on/off</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-blue-400">✓</span>
              <span>Volume histogram displays correctly</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-blue-400">✓</span>
              <span>Chart is responsive (resize window)</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-blue-400">✓</span>
              <span>Typography matches Design Philosophy</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-blue-400">✓</span>
              <span>Loading skeleton shows during data fetch</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-blue-400">✓</span>
              <span>Error handling works (test with invalid ticker)</span>
            </li>
          </ul>
        </div>

        {/* Additional Test Cases */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Ethereum */}
          <div>
            <h3 className="text-lg font-semibold text-white mb-3">
              Ethereum (X:ETHUSD)
            </h3>
            <Chart
              ticker="X:ETHUSD"
              initialTimeframe="4h"
              height={400}
              enableRealtime={false}
            />
          </div>

          {/* Solana */}
          <div>
            <h3 className="text-lg font-semibold text-white mb-3">
              Solana (X:SOLUSD)
            </h3>
            <Chart
              ticker="X:SOLUSD"
              initialTimeframe="1h"
              height={400}
              enableRealtime={false}
            />
          </div>
        </div>
      </div>
    </div>
  )
}

