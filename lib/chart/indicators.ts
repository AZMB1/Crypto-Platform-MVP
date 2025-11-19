/**
 * Frontend Indicator Calculations
 * 
 * Client-side indicator formulas (TradingView-style) for chart overlays.
 * These are simple TypeScript implementations for visualization purposes.
 * 
 * For ML training, we use backend indicators (pandas-ta, TA-Lib).
 */

import type { CandleData, LineData, VolumeData } from '@/types/chart'

/**
 * Simple Moving Average (SMA)
 * 
 * Calculates the arithmetic mean of closing prices over a period.
 * 
 * @param data - Array of candle data
 * @param period - Number of periods to average (e.g., 20)
 * @returns Array of SMA values with time coordinates
 */
export function calculateSMA(data: CandleData[], period: number): LineData[] {
  if (data.length < period) return []
  
  const sma: LineData[] = []
  
  for (let i = period - 1; i < data.length; i++) {
    const sum = data
      .slice(i - period + 1, i + 1)
      .reduce((acc, candle) => acc + candle.close, 0)
    
    sma.push({
      time: data[i]!.time,
      value: sum / period,
    })
  }
  
  return sma
}

/**
 * Exponential Moving Average (EMA)
 * 
 * Gives more weight to recent prices using exponential smoothing.
 * Formula: EMA = Price(t) × k + EMA(y) × (1 − k)
 * where k = 2 / (period + 1)
 * 
 * @param data - Array of candle data
 * @param period - Number of periods (e.g., 50)
 * @returns Array of EMA values with time coordinates
 */
export function calculateEMA(data: CandleData[], period: number): LineData[] {
  if (data.length < period) return []
  
  const ema: LineData[] = []
  const k = 2 / (period + 1)
  
  // Start with SMA for first value
  const firstSMA = data
    .slice(0, period)
    .reduce((acc, candle) => acc + candle.close, 0) / period
  
  ema.push({
    time: data[period - 1]!.time,
    value: firstSMA,
  })
  
  // Calculate EMA for remaining values
  for (let i = period; i < data.length; i++) {
    const price = data[i]!.close
    const prevEMA = ema[ema.length - 1]!.value
    const newEMA = price * k + prevEMA * (1 - k)
    
    ema.push({
      time: data[i]!.time,
      value: newEMA,
    })
  }
  
  return ema
}

/**
 * Relative Strength Index (RSI)
 * 
 * Momentum oscillator measuring speed and magnitude of price changes.
 * Values range from 0-100. Traditionally:
 * - RSI > 70: Overbought
 * - RSI < 30: Oversold
 * 
 * Formula: RSI = 100 - (100 / (1 + RS))
 * where RS = Average Gain / Average Loss
 * 
 * @param data - Array of candle data
 * @param period - Number of periods (typically 14)
 * @returns Array of RSI values (0-100) with time coordinates
 */
export function calculateRSI(data: CandleData[], period: number = 14): LineData[] {
  if (data.length < period + 1) return []
  
  const rsi: LineData[] = []
  const gains: number[] = []
  const losses: number[] = []
  
  // Calculate price changes
  for (let i = 1; i < data.length; i++) {
    const change = data[i]!.close - data[i - 1]!.close
    gains.push(change > 0 ? change : 0)
    losses.push(change < 0 ? -change : 0)
  }
  
  // First RSI: Use simple average
  let avgGain = gains.slice(0, period).reduce((a, b) => a + b, 0) / period
  let avgLoss = losses.slice(0, period).reduce((a, b) => a + b, 0) / period
  
  const rs = avgLoss === 0 ? 100 : avgGain / avgLoss
  rsi.push({
    time: data[period]!.time,
    value: 100 - 100 / (1 + rs),
  })
  
  // Subsequent RSI values: Use smoothed averages (Wilder's smoothing)
  for (let i = period; i < gains.length; i++) {
    avgGain = (avgGain * (period - 1) + gains[i]!) / period
    avgLoss = (avgLoss * (period - 1) + losses[i]!) / period
    
    const rs = avgLoss === 0 ? 100 : avgGain / avgLoss
    rsi.push({
      time: data[i + 1]!.time,
      value: 100 - 100 / (1 + rs),
    })
  }
  
  return rsi
}

/**
 * Format Volume Data with Directional Coloring
 * 
 * Colors volume bars based on price direction:
 * - Green if close > open (up candle)
 * - Red if close <= open (down candle)
 * 
 * @param data - Array of candle data
 * @param upColor - Color for up volume bars (default: green)
 * @param downColor - Color for down volume bars (default: red)
 * @returns Array of volume data with colors
 */
export function formatVolumeData(
  data: CandleData[],
  upColor: string = '#10b981',
  downColor: string = '#ef4444'
): VolumeData[] {
  return data.map((candle) => ({
    time: candle.time,
    value: candle.volume,
    color: candle.close >= candle.open ? upColor : downColor,
  }))
}

/**
 * Utility: Check if we have enough data for an indicator
 * 
 * @param dataLength - Number of candles available
 * @param period - Required period length
 * @returns True if we have enough data
 */
export function hasEnoughData(dataLength: number, period: number): boolean {
  return dataLength >= period
}

/**
 * Utility: Get default periods for each indicator type
 */
export const DEFAULT_PERIODS = {
  sma: 20,
  ema: 50,
  rsi: 14,
} as const

