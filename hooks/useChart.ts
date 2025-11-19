'use client'

/**
 * useChart Hook
 * 
 * Manages chart state, data fetching from API, and real-time WebSocket updates.
 * Transforms Polygon.io data to lightweight-charts format.
 */

import { useCallback, useEffect, useState } from 'react'
import type { CandleData, ChartTimeframe } from '@/types/chart'
import { usePolygonWebSocket } from './usePolygonWebSocket'

interface UseChartOptions {
  limit?: number // Number of candles to fetch (default: 200)
  enableRealtime?: boolean // Enable WebSocket updates (default: true)
}

interface UseChartReturn {
  data: CandleData[]
  loading: boolean
  error: string | null
  refetch: () => Promise<void>
}

/**
 * Throttle function - limits execution rate
 */
function throttle<T extends unknown[]>(
  func: (...args: T) => void,
  delay: number
): (...args: T) => void {
  let lastCall = 0
  return (...args: T) => {
    const now = Date.now()
    if (now - lastCall >= delay) {
      lastCall = now
      func(...args)
    }
  }
}

/**
 * useChart - Fetch and manage chart data with real-time updates
 * 
 * @param ticker - Symbol ticker (e.g., "X:BTCUSD")
 * @param timeframe - Chart timeframe (1h, 4h, 1d, 1w, 1m)
 * @param options - Configuration options
 * @returns Chart data, loading state, error, and refetch function
 */
export function useChart(
  ticker: string,
  timeframe: ChartTimeframe,
  options: UseChartOptions = {}
): UseChartReturn {
  const { limit = 200, enableRealtime = true } = options

  const [data, setData] = useState<CandleData[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  /**
   * Fetch initial candle data from API
   */
  const fetchCandles = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)

      const url = `/api/candles/${encodeURIComponent(ticker)}/${timeframe}?limit=${limit}`
      const res = await fetch(url)

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({})) as { error?: string }
        throw new Error(
          errorData.error || `Failed to fetch chart data: ${res.status}`
        )
      }

      const json = await res.json() as { candles?: Array<{
        timestamp: string
        open: number
        high: number
        low: number
        close: number
        volume: number
      }> }

      // Transform Polygon.io format to lightweight-charts format
      const transformed: CandleData[] = (json.candles || []).map(
        (candle: {
          timestamp: string
          open: number
          high: number
          low: number
          close: number
          volume: number
        }) => ({
          time: Math.floor(new Date(candle.timestamp).getTime() / 1000), // Convert to seconds
          open: candle.open,
          high: candle.high,
          low: candle.low,
          close: candle.close,
          volume: candle.volume,
        })
      )

      // Sort by time (ascending) - lightweight-charts requires sorted data
      transformed.sort((a, b) => a.time - b.time)

      setData(transformed)
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'Unknown error occurred'
      setError(message)
      console.error('Chart data fetch error:', err)
    } finally {
      setLoading(false)
    }
  }, [ticker, timeframe, limit])

  // Fetch data on mount and when dependencies change
  useEffect(() => {
    fetchCandles()
  }, [fetchCandles])

  // WebSocket real-time updates (throttled to 1 update/second)
  const { price, isConnected } = usePolygonWebSocket(
    enableRealtime ? ticker : undefined,
    {
      autoConnect: enableRealtime,
    }
  )

  /**
   * Update last candle with new price data from WebSocket
   * Throttled to 1 update per second to avoid excessive re-renders
   */
  const throttledUpdate = useCallback(
    throttle((newPrice: number) => {
      setData((prev) => {
        if (prev.length === 0) return prev

        const lastCandle = prev[prev.length - 1]!
        const now = Math.floor(Date.now() / 1000)

        // Determine if we need a new candle or update existing
        const candleStartTime = getCandleStartTime(now, timeframe)

        if (candleStartTime > lastCandle.time) {
          // New candle period started
          return [
            ...prev,
            {
              time: candleStartTime,
              open: newPrice,
              high: newPrice,
              low: newPrice,
              close: newPrice,
              volume: 0,
            },
          ]
        } else {
          // Update existing candle
          return [
            ...prev.slice(0, -1),
            {
              ...lastCandle,
              close: newPrice,
              high: Math.max(lastCandle.high, newPrice),
              low: Math.min(lastCandle.low, newPrice),
            },
          ]
        }
      })
    }, 1000), // 1 second throttle
    [timeframe]
  )

  useEffect(() => {
    if (enableRealtime && isConnected && price) {
      throttledUpdate(price)
    }
  }, [
    price,
    isConnected,
    enableRealtime,
    throttledUpdate,
  ])

  return {
    data,
    loading,
    error,
    refetch: fetchCandles,
  }
}

/**
 * Get candle start time based on timeframe
 * 
 * @param timestamp - Current timestamp (seconds)
 * @param timeframe - Chart timeframe
 * @returns Candle start time (seconds)
 */
function getCandleStartTime(
  timestamp: number,
  timeframe: ChartTimeframe
): number {
  const date = new Date(timestamp * 1000)

  switch (timeframe) {
    case '1h':
      date.setMinutes(0, 0, 0)
      break
    case '4h':
      date.setHours(Math.floor(date.getHours() / 4) * 4, 0, 0, 0)
      break
    case '1d':
      date.setHours(0, 0, 0, 0)
      break
    case '1w':
      date.setHours(0, 0, 0, 0)
      date.setDate(date.getDate() - date.getDay()) // Start of week (Sunday)
      break
    case '1m':
      date.setDate(1)
      date.setHours(0, 0, 0, 0)
      break
  }

  return Math.floor(date.getTime() / 1000)
}

