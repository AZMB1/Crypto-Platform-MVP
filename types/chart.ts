/**
 * Chart Types
 * 
 * Types for TradingView lightweight-charts integration, indicator configuration,
 * and chart styling options.
 */

/**
 * Candlestick data format (lightweight-charts compatible)
 * 
 * Time must be in Unix timestamp (seconds, not milliseconds)
 */
export interface CandleData {
  time: number // Unix timestamp in seconds
  open: number
  high: number
  low: number
  close: number
  volume: number
}

/**
 * Supported timeframes (matches backend API)
 */
export type ChartTimeframe = '1h' | '4h' | '1d' | '1w' | '1m'

/**
 * Indicator types available in MVP
 */
export type IndicatorType = 'sma' | 'ema' | 'rsi' | 'volume'

/**
 * Indicator configuration
 */
export interface IndicatorConfig {
  type: IndicatorType
  enabled: boolean
  params: Record<string, number> // e.g., { period: 20 }
  color?: string // Optional custom color
}

/**
 * Chart styling options (Design Philosophy compliant)
 */
export interface ChartOptions {
  layout: {
    background: { color: string }
    textColor: string
  }
  grid: {
    vertLines: { color: string }
    horzLines: { color: string }
  }
  crosshair: {
    mode: number
  }
  timeScale: {
    timeVisible: boolean
    secondsVisible: boolean
  }
}

/**
 * Volume data with directional coloring
 */
export interface VolumeData {
  time: number
  value: number
  color: string
}

/**
 * Line data for indicator overlays (SMA, EMA)
 */
export interface LineData {
  time: number
  value: number
}

/**
 * Chart error states
 */
export interface ChartError {
  message: string
  code?: 'API_ERROR' | 'WEBSOCKET_ERROR' | 'INVALID_TICKER' | 'NO_DATA'
}

