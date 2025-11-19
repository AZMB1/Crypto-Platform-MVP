'use client'

/**
 * Chart Component
 * 
 * Main chart component that composes all sub-components into a single exportable unit.
 * Manages state for timeframe selection and indicator configuration.
 */

import type { IChartApi } from 'lightweight-charts'
import { useRef, useState } from 'react'

import { useChart } from '@/hooks/useChart'
import { DEFAULT_PERIODS } from '@/lib/chart/indicators'
import type { ChartTimeframe, IndicatorConfig } from '@/types/chart'

import { ChartCanvas } from './ChartCanvas'
import { ChartControls } from './ChartControls'
import { IndicatorOverlay } from './IndicatorOverlay'

export interface ChartProps {
  ticker: string
  initialTimeframe?: ChartTimeframe
  height?: number
  enableRealtime?: boolean
}

/**
 * ChartSkeleton - Loading state with shimmer effect
 */
function ChartSkeleton({ height }: { height: number }) {
  return (
    <div className="animate-pulse">
      <div className="h-16 bg-zinc-800 rounded-t-lg mb-px" />
      <div
        className="bg-zinc-800 rounded-b-lg"
        style={{ height: `${height}px` }}
      />
    </div>
  )
}

/**
 * ChartError - Error state with retry button
 */
function ChartError({
  message,
  onRetry,
}: {
  message: string
  onRetry: () => void
}) {
  return (
    <div className="flex flex-col items-center justify-center p-8 bg-zinc-900 rounded-lg border border-zinc-800">
      <div className="flex items-center gap-2 mb-4">
        <svg
          className="w-6 h-6 text-red-500"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
        <h3 className="text-lg font-semibold text-white">
          Failed to load chart
        </h3>
      </div>
      <p className="text-sm text-zinc-400 mb-6 text-center max-w-md">
        {message}
      </p>
      <button
        onClick={onRetry}
        className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-md transition-colors"
      >
        Try Again
      </button>
    </div>
  )
}

/**
 * Chart - Main export component
 * 
 * Combines ChartCanvas, ChartControls, and IndicatorOverlay into a single component.
 * Manages timeframe and indicator state.
 */
export function Chart({
  ticker,
  initialTimeframe = '1d',
  height = 500,
  enableRealtime = true,
}: ChartProps) {
  const [timeframe, setTimeframe] = useState<ChartTimeframe>(initialTimeframe)
  const [indicators, setIndicators] = useState<IndicatorConfig[]>([
    {
      type: 'sma',
      enabled: false,
      params: { period: DEFAULT_PERIODS.sma },
    },
    {
      type: 'ema',
      enabled: false,
      params: { period: DEFAULT_PERIODS.ema },
    },
    {
      type: 'rsi',
      enabled: false,
      params: { period: DEFAULT_PERIODS.rsi },
    },
    {
      type: 'volume',
      enabled: true, // Volume enabled by default
      params: {},
    },
  ])

  const chartRef = useRef<IChartApi>(null!)

  // Fetch chart data
  const { data, loading, error, refetch } = useChart(ticker, timeframe, {
    limit: 200,
    enableRealtime,
  })

  /**
   * Handle indicator toggle
   */
  const handleIndicatorToggle = (type: string) => {
    setIndicators((prev) =>
      prev.map((ind) =>
        ind.type === type ? { ...ind, enabled: !ind.enabled } : ind
      )
    )
  }

  /**
   * Handle timeframe change
   */
  const handleTimeframeChange = (newTimeframe: ChartTimeframe) => {
    setTimeframe(newTimeframe)
  }

  // Loading state
  if (loading) {
    return <ChartSkeleton height={height + 64} />
  }

  // Error state
  if (error) {
    return <ChartError message={error} onRetry={refetch} />
  }

  // Empty data state
  if (data.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-8 bg-zinc-900 rounded-lg border border-zinc-800">
        <svg
          className="w-12 h-12 text-zinc-600 mb-4"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
          />
        </svg>
        <h3 className="text-lg font-semibold text-white mb-2">No data available</h3>
        <p className="text-sm text-zinc-400 text-center max-w-md">
          No historical data available for {ticker} at {timeframe} timeframe.
        </p>
      </div>
    )
  }

  // Main chart render
  return (
    <div className="bg-zinc-900 rounded-lg overflow-hidden border border-zinc-800">
      <ChartControls
        currentTimeframe={timeframe}
        onTimeframeChange={handleTimeframeChange}
        indicators={indicators}
        onIndicatorToggle={handleIndicatorToggle}
      />
      <div className="relative">
        <ChartCanvas
          ref={chartRef}
          data={data}
          ticker={ticker}
          timeframe={timeframe}
          height={height}
        />
        <IndicatorOverlay
          chartApi={chartRef.current}
          data={data}
          indicators={indicators.filter((i) => i.enabled)}
        />
      </div>
    </div>
  )
}

