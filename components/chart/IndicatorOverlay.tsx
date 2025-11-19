'use client'

/**
 * IndicatorOverlay Component
 * 
 * Calculates and renders technical indicators as overlays on the chart.
 * Handles SMA, EMA (line series), RSI (separate pane), and Volume (histogram).
 */

import type { IChartApi } from 'lightweight-charts'
import { useEffect, useRef } from 'react'

import {
  calculateEMA,
  calculateRSI,
  calculateSMA,
  formatVolumeData,
} from '@/lib/chart/indicators'
import type { CandleData, IndicatorConfig } from '@/types/chart'

interface IndicatorOverlayProps {
  chartApi: IChartApi | null | undefined
  data: CandleData[]
  indicators: IndicatorConfig[]
}

/**
 * IndicatorOverlay - Manages indicator calculations and rendering
 * 
 * This component has no visual output; it modifies the chart directly
 * by adding/removing indicator series based on enabled state.
 */
export function IndicatorOverlay({
  chartApi,
  data,
  indicators,
}: IndicatorOverlayProps) {
  // Track created series for cleanup
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const seriesRefs = useRef<Map<string, any>>(
    new Map()
  )

  useEffect(() => {
    if (!chartApi || data.length === 0) return

    // Clean up all existing indicator series
    seriesRefs.current.forEach((series) => {
      chartApi.removeSeries(series)
    })
    seriesRefs.current.clear()

    // Add enabled indicators
    indicators.forEach((indicator) => {
      if (!indicator.enabled) return

      const period = indicator.params.period ?? 14

      try {
        switch (indicator.type) {
          case 'sma': {
            const smaData = calculateSMA(data, period)
            if (smaData.length > 0) {
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              const smaSeries = (chartApi as any).addLineSeries({
                color: indicator.color ?? '#2962FF', // Blue
                lineWidth: 2,
                title: `SMA(${period})`,
                priceLineVisible: false,
                lastValueVisible: true,
              })
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              smaSeries.setData(smaData as any)
              seriesRefs.current.set(`sma-${period}`, smaSeries)
            }
            break
          }

          case 'ema': {
            const emaData = calculateEMA(data, period)
            if (emaData.length > 0) {
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              const emaSeries = (chartApi as any).addLineSeries({
                color: indicator.color ?? '#f59e0b', // Amber
                lineWidth: 2,
                title: `EMA(${period})`,
                priceLineVisible: false,
                lastValueVisible: true,
              })
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              emaSeries.setData(emaData as any)
              seriesRefs.current.set(`ema-${period}`, emaSeries)
            }
            break
          }

          case 'rsi': {
            const rsiData = calculateRSI(data, period)
            if (rsiData.length > 0) {
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              const rsiSeries = (chartApi as any).addLineSeries({
                color: indicator.color ?? '#8b5cf6', // Purple
                lineWidth: 2,
                title: `RSI(${period})`,
                priceLineVisible: false,
                lastValueVisible: true,
                // RSI should be in separate pane, but lightweight-charts
                // requires manual pane creation. For MVP, we'll overlay on main chart.
                // TODO: In Phase IV, create separate pane for RSI
                priceFormat: {
                  type: 'custom',
                  formatter: (price: number) => price.toFixed(2),
                  minMove: 0.01,
                },
              })
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              rsiSeries.setData(rsiData as any)
              seriesRefs.current.set(`rsi-${period}`, rsiSeries)
            }
            break
          }

          case 'volume': {
            const volumeData = formatVolumeData(
              data,
              indicator.color ?? '#10b981', // Green
              '#ef4444' // Red
            )
            if (volumeData.length > 0) {
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              const volumeSeries = (chartApi as any).addHistogramSeries({
                color: '#10b981',
                priceFormat: {
                  type: 'volume',
                },
                priceScaleId: 'volume',
                title: 'Volume',
                priceLineVisible: false,
                lastValueVisible: false,
              })
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              volumeSeries.setData(volumeData as any)
              
              // Position volume at bottom with smaller scale
              chartApi.priceScale('volume').applyOptions({
                scaleMargins: {
                  top: 0.8, // Volume takes bottom 20%
                  bottom: 0,
                },
              })
              
              seriesRefs.current.set('volume', volumeSeries)
            }
            break
          }

          default:
            console.warn(`Unknown indicator type: ${indicator.type}`)
        }
      } catch (error) {
        console.error(`Failed to calculate ${indicator.type}:`, error)
      }
    })

    // Cleanup function
    return () => {
      seriesRefs.current.forEach((series) => {
        try {
          chartApi.removeSeries(series)
        } catch (error) {
          // Series might already be removed
          console.debug('Series cleanup warning:', error)
        }
      })
      seriesRefs.current.clear()
    }
  }, [chartApi, data, indicators])

  // This component has no visual output
  return null
}

