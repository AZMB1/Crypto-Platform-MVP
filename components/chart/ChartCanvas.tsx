'use client'

/**
 * ChartCanvas Component
 * 
 * Core chart rendering using TradingView lightweight-charts library.
 * Handles chart initialization, candlestick series rendering, and lifecycle management.
 */

/* eslint-disable sort-imports */
import {
  CandlestickSeries,
  ColorType,
  createChart,
  CrosshairMode,
} from 'lightweight-charts'
import type {
  CandlestickSeriesPartialOptions,
  IChartApi,
} from 'lightweight-charts'
import { forwardRef, useEffect, useImperativeHandle, useRef } from 'react'

import type { CandleData, ChartTimeframe } from '@/types/chart'
/* eslint-enable sort-imports */

interface ChartCanvasProps {
  data: CandleData[]
  ticker: string
  timeframe: ChartTimeframe
  onCrosshairMove?: (price: number, time: number) => void
  height?: number
}

/**
 * ChartCanvas - Core rendering component for candlestick charts
 * 
 * Features:
 * - Automatic chart initialization and cleanup
 * - Responsive resize handling
 * - Typography-forward styling (Design Philosophy)
 * - Crosshair event handling
 * - Ref forwarding for parent component access
 */
export const ChartCanvas = forwardRef<IChartApi, ChartCanvasProps>(
  function ChartCanvas({ data, ticker, timeframe, onCrosshairMove, height = 500 }, ref) {
    const chartContainerRef = useRef<HTMLDivElement>(null)
    const chartRef = useRef<IChartApi | null>(null)
    const candlestickSeriesRef = useRef<ReturnType<IChartApi['addSeries']> | null>(null)
    const resizeObserverRef = useRef<ResizeObserver | null>(null)

    // Expose chart API to parent via ref
    useImperativeHandle(ref, () => chartRef.current!)

    // Initialize chart on mount
    useEffect(() => {
      if (!chartContainerRef.current) return

      // Chart options (Design Philosophy: Typography-forward, minimal, dark theme)
      const chartOptions = {
        layout: {
          background: { type: ColorType.Solid, color: '#0a0a0a' },
          textColor: '#e5e5e5',
          fontFamily: 'Inter, system-ui, sans-serif',
        } as const,
        grid: {
          vertLines: { color: '#1a1a1a' },
          horzLines: { color: '#1a1a1a' },
        },
        crosshair: {
          mode: CrosshairMode.Normal,
          vertLine: {
            width: 1,
            color: '#4b5563',
            style: 3, // Dashed
          },
          horzLine: {
            width: 1,
            color: '#4b5563',
            style: 3, // Dashed
          },
        },
        rightPriceScale: {
          borderColor: '#2d3748',
          textColor: '#e5e5e5',
        },
        timeScale: {
          borderColor: '#2d3748',
          timeVisible: true,
          secondsVisible: false,
        },
        handleScroll: {
          mouseWheel: true,
          pressedMouseMove: true,
          horzTouchDrag: true,
          vertTouchDrag: true,
        },
        handleScale: {
          axisPressedMouseMove: true,
          mouseWheel: true,
          pinch: true,
        },
      }

      // Create chart
      const chart = createChart(chartContainerRef.current, {
        ...chartOptions,
        width: chartContainerRef.current.clientWidth,
        height,
      } as Parameters<typeof createChart>[1])

      chartRef.current = chart

      // Candlestick series options
      const candlestickOptions: CandlestickSeriesPartialOptions = {
        upColor: '#10b981', // Green (Design Philosophy)
        downColor: '#ef4444', // Red (Design Philosophy)
        borderUpColor: '#10b981',
        borderDownColor: '#ef4444',
        wickUpColor: '#10b981',
        wickDownColor: '#ef4444',
      }

      // Add candlestick series using v5 API: addSeries(CandlestickSeries, options)
      const candlestickSeries = chart.addSeries(CandlestickSeries, candlestickOptions)
      candlestickSeriesRef.current = candlestickSeries

      // Set initial data
      if (data.length > 0) {
        // Cast time to UTCTimestamp for v5 API compatibility
        candlestickSeries.setData(data.map(d => ({ ...d, time: d.time as Parameters<typeof candlestickSeries.setData>[0][0]['time'] })))
      }

      // Handle crosshair move events
      if (onCrosshairMove) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        chart.subscribeCrosshairMove((param: any) => {
          if (param.time && param.seriesData.size > 0) {
            const seriesData = param.seriesData.get(candlestickSeries)
            if (seriesData && 'close' in seriesData) {
              onCrosshairMove(seriesData.close as number, param.time as number)
            }
          }
        })
      }

      // Responsive resize handling
      const handleResize = () => {
        if (chartContainerRef.current && chartRef.current) {
          chartRef.current.applyOptions({
            width: chartContainerRef.current.clientWidth,
          })
        }
      }

      resizeObserverRef.current = new ResizeObserver(handleResize)
      resizeObserverRef.current.observe(chartContainerRef.current)

      // Cleanup on unmount
      return () => {
        resizeObserverRef.current?.disconnect()
        chartRef.current?.remove()
        chartRef.current = null
        candlestickSeriesRef.current = null
      }
    }, [height, onCrosshairMove]) // Only re-initialize if height or callback changes

    // Update data when it changes
    useEffect(() => {
      if (candlestickSeriesRef.current && data.length > 0) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        candlestickSeriesRef.current.setData(data as any)
        
        // Auto-fit content on initial load
        if (chartRef.current) {
          chartRef.current.timeScale().fitContent()
        }
      }
    }, [data])

    return (
      <div
        ref={chartContainerRef}
        className="relative"
        style={{ height: `${height}px` }}
        aria-label={`${ticker} ${timeframe} candlestick chart`}
      />
    )
  }
)

ChartCanvas.displayName = 'ChartCanvas'

