/**
 * Polygon.io Data Cleaning Utility
 * 
 * All data from Polygon.io MUST be cleaned before use to ensure:
 * - Consistent timestamp formats
 * - No duplicates
 * - No missing/invalid values
 * - Proper sorting
 */

import type { CleanedCandle, PolygonAggregate } from '@/types/polygon'

/**
 * Clean OHLCV data from Polygon.io aggregates
 * 
 * Process:
 * 1. Convert Unix timestamps (milliseconds) to Date objects
 * 2. Remove duplicates based on timestamp
 * 3. Validate prices > 0 and volume >= 0
 * 4. Forward fill any missing values
 * 5. Sort by timestamp ascending
 * 
 * @param rawData - Array of raw Polygon aggregates
 * @returns Array of cleaned candles
 */
export function cleanOHLCVData(rawData: PolygonAggregate[]): CleanedCandle[] {
  if (!rawData || rawData.length === 0) {
    return []
  }

  // Step 1: Convert timestamps and create initial cleaned data
  const candlesWithTimestamps = rawData.map((candle) => ({
    timestamp: new Date(candle.t),
    open: candle.o,
    high: candle.h,
    low: candle.l,
    close: candle.c,
    volume: candle.v,
    vwap: candle.vw,
    transactions: candle.n,
  }))

  // Step 2: Remove duplicates based on timestamp
  const uniqueCandles = removeDuplicates(candlesWithTimestamps)

  // Step 3: Validate and fix invalid values
  const validatedCandles = validateCandles(uniqueCandles)

  // Step 4: Forward fill missing values if needed
  const filledCandles = forwardFillMissingValues(validatedCandles)

  // Step 5: Sort by timestamp ascending
  const sortedCandles = filledCandles.sort(
    (a, b) => a.timestamp.getTime() - b.timestamp.getTime()
  )

  return sortedCandles
}

/**
 * Remove duplicate candles based on timestamp
 * Keeps the first occurrence
 */
function removeDuplicates(candles: CleanedCandle[]): CleanedCandle[] {
  const seen = new Set<number>()
  const unique: CleanedCandle[] = []

  for (const candle of candles) {
    const timestamp = candle.timestamp.getTime()
    if (!seen.has(timestamp)) {
      seen.add(timestamp)
      unique.push(candle)
    }
  }

  return unique
}

/**
 * Validate candle data and fix invalid values
 * - Prices must be > 0
 * - Volume must be >= 0
 * - High must be >= Low
 * - High must be >= Open and Close
 * - Low must be <= Open and Close
 */
function validateCandles(candles: CleanedCandle[]): CleanedCandle[] {
  return candles
    .filter((candle) => {
      // Filter out candles with invalid prices
      if (candle.open <= 0 || candle.high <= 0 || candle.low <= 0 || candle.close <= 0) {
        console.warn(
          `Invalid prices in candle at ${candle.timestamp.toISOString()}: O=${candle.open}, H=${candle.high}, L=${candle.low}, C=${candle.close}`
        )
        return false
      }

      // Filter out candles with negative volume
      if (candle.volume < 0) {
        console.warn(`Negative volume in candle at ${candle.timestamp.toISOString()}: ${candle.volume}`)
        return false
      }

      return true
    })
    .map((candle) => {
      // Fix OHLC relationships if needed
      const fixedCandle = { ...candle }

      // Ensure high is the highest
      fixedCandle.high = Math.max(candle.open, candle.high, candle.low, candle.close)

      // Ensure low is the lowest
      fixedCandle.low = Math.min(candle.open, candle.high, candle.low, candle.close)

      return fixedCandle
    })
}

/**
 * Forward fill missing values
 * If there are gaps in the data, use the previous candle's close as the fill value
 */
function forwardFillMissingValues(candles: CleanedCandle[]): CleanedCandle[] {
  if (candles.length === 0) return candles

  const filled: CleanedCandle[] = [candles[0]!]

  for (let i = 1; i < candles.length; i++) {
    const current = candles[i]!
    const previous = filled[filled.length - 1]!

    // If any OHLC value is missing or invalid, use previous close
    if (!current.open || !current.high || !current.low || !current.close) {
      filled.push({
        ...current,
        open: previous.close,
        high: previous.close,
        low: previous.close,
        close: previous.close,
      })
    } else {
      filled.push(current)
    }
  }

  return filled
}

/**
 * Validate a single cleaned candle
 * Returns true if the candle is valid
 */
export function isValidCandle(candle: CleanedCandle): boolean {
  return (
    candle.open > 0 &&
    candle.high > 0 &&
    candle.low > 0 &&
    candle.close > 0 &&
    candle.volume >= 0 &&
    candle.high >= candle.low &&
    candle.high >= candle.open &&
    candle.high >= candle.close &&
    candle.low <= candle.open &&
    candle.low <= candle.close
  )
}

/**
 * Get summary statistics from cleaned candles
 * Useful for debugging and validation
 */
export function getCandleStats(candles: CleanedCandle[]): {
  count: number
  firstTimestamp: Date | null
  lastTimestamp: Date | null
  avgVolume: number
  minPrice: number
  maxPrice: number
} {
  if (candles.length === 0) {
    return {
      count: 0,
      firstTimestamp: null,
      lastTimestamp: null,
      avgVolume: 0,
      minPrice: 0,
      maxPrice: 0,
    }
  }

  const totalVolume = candles.reduce((sum, c) => sum + c.volume, 0)
  const allPrices = candles.flatMap((c) => [c.open, c.high, c.low, c.close])

  return {
    count: candles.length,
    firstTimestamp: candles[0]!.timestamp,
    lastTimestamp: candles[candles.length - 1]!.timestamp,
    avgVolume: totalVolume / candles.length,
    minPrice: Math.min(...allPrices),
    maxPrice: Math.max(...allPrices),
  }
}

