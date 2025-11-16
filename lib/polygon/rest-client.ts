/**
 * Polygon.io REST API Client
 * 
 * Provides functions to fetch crypto market data from Polygon.io
 * All data is automatically cleaned before being returned
 */

import type {
  PolygonSymbol,
  PolygonAggregatesResponse,
  PolygonTickersResponse,
  PolygonDailyBar,
  PolygonLastTrade,
  PolygonError,
  CleanedCandle,
} from '@/types/polygon'
import type { Timeframe } from '@/types/shared'
import { cleanOHLCVData } from './data-cleaner'

const POLYGON_API_KEY = process.env.POLYGON_API_KEY
const POLYGON_BASE_URL = 'https://api.polygon.io'

if (!POLYGON_API_KEY) {
  console.warn('⚠️  POLYGON_API_KEY not set - Polygon.io features will be unavailable')
}

/**
 * Map timeframe to Polygon.io timespan format
 */
const TIMEFRAME_TO_TIMESPAN: Record<Timeframe, { multiplier: number; timespan: string }> = {
  '1h': { multiplier: 1, timespan: 'hour' },
  '4h': { multiplier: 4, timespan: 'hour' },
  '1d': { multiplier: 1, timespan: 'day' },
  '1w': { multiplier: 1, timespan: 'week' },
  '1m': { multiplier: 1, timespan: 'month' },
}

/**
 * Generic fetch with error handling and retries
 */
async function fetchWithRetry<T>(
  url: string,
  retries: number = 3,
  backoffMs: number = 1000
): Promise<T> {
  for (let i = 0; i < retries; i++) {
    try {
      const response = await fetch(url)

      if (!response.ok) {
        const error: PolygonError = await response.json().catch(() => ({
          status: 'error',
          message: `HTTP ${response.status}: ${response.statusText}`,
        }))

        // Don't retry on 4xx errors (client errors)
        if (response.status >= 400 && response.status < 500) {
          throw new Error(error.message || `API error: ${response.status}`)
        }

        throw new Error(error.message || 'API request failed')
      }

      return await response.json()
    } catch (error) {
      const isLastAttempt = i === retries - 1
      if (isLastAttempt) {
        throw error
      }

      // Exponential backoff
      const delay = backoffMs * Math.pow(2, i)
      console.warn(`Polygon.io request failed, retrying in ${delay}ms...`, error)
      await new Promise((resolve) => setTimeout(resolve, delay))
    }
  }

  throw new Error('Max retries exceeded')
}

/**
 * Fetch ALL crypto symbols from Polygon.io
 * Handles pagination automatically
 * 
 * @returns Array of all crypto symbols
 */
export async function getAllCryptoSymbols(): Promise<PolygonSymbol[]> {
  if (!POLYGON_API_KEY) {
    throw new Error('POLYGON_API_KEY is not configured')
  }

  const allSymbols: PolygonSymbol[] = []
  let nextUrl: string | undefined = `${POLYGON_BASE_URL}/v3/reference/tickers?market=crypto&active=true&limit=1000&apiKey=${POLYGON_API_KEY}`

  while (nextUrl) {
    const response = await fetchWithRetry<PolygonTickersResponse>(nextUrl)

    if (response.results && response.results.length > 0) {
      allSymbols.push(...response.results)
    }

    // Check for next page
    nextUrl = response.next_url
      ? `${response.next_url}&apiKey=${POLYGON_API_KEY}`
      : undefined
  }

  console.log(`✅ Fetched ${allSymbols.length} crypto symbols from Polygon.io`)
  return allSymbols
}

/**
 * Get historical aggregates (OHLCV) for a ticker
 * Handles pagination automatically
 * Returns cleaned candle data
 * 
 * @param ticker - Crypto ticker (e.g., "X:BTCUSD")
 * @param timeframe - Timeframe (1h, 4h, 1d, 1w, 1m)
 * @param from - Start date (YYYY-MM-DD)
 * @param to - End date (YYYY-MM-DD)
 * @returns Array of cleaned candles
 */
export async function getAggregates(
  ticker: string,
  timeframe: Timeframe,
  from: string,
  to: string
): Promise<CleanedCandle[]> {
  if (!POLYGON_API_KEY) {
    throw new Error('POLYGON_API_KEY is not configured')
  }

  const { multiplier, timespan } = TIMEFRAME_TO_TIMESPAN[timeframe]
  const allResults: CleanedCandle[] = []

  let nextUrl: string | undefined = `${POLYGON_BASE_URL}/v2/aggs/ticker/${ticker}/range/${multiplier}/${timespan}/${from}/${to}?adjusted=true&sort=asc&limit=5000&apiKey=${POLYGON_API_KEY}`

  while (nextUrl) {
    const response = await fetchWithRetry<PolygonAggregatesResponse>(nextUrl)

    if (response.results && response.results.length > 0) {
      // Clean the data before adding
      const cleaned = cleanOHLCVData(response.results)
      allResults.push(...cleaned)
    }

    // Check for next page
    nextUrl = response.next_url
      ? `${response.next_url}&apiKey=${POLYGON_API_KEY}`
      : undefined
  }

  console.log(
    `✅ Fetched ${allResults.length} ${timeframe} candles for ${ticker} from ${from} to ${to}`
  )
  return allResults
}

/**
 * Get the last trade for a ticker
 * 
 * @param ticker - Crypto ticker (e.g., "X:BTCUSD")
 * @returns Last trade data
 */
export async function getLastTrade(ticker: string): Promise<PolygonLastTrade> {
  if (!POLYGON_API_KEY) {
    throw new Error('POLYGON_API_KEY is not configured')
  }

  const url = `${POLYGON_BASE_URL}/v2/last/trade/${ticker}?apiKey=${POLYGON_API_KEY}`
  return fetchWithRetry<PolygonLastTrade>(url)
}

/**
 * Get daily bar (previous close) for a ticker
 * Used for calculating 24h USD volume
 * 
 * @param ticker - Crypto ticker (e.g., "X:BTCUSD")
 * @returns Daily bar with OHLCV data
 */
export async function getDailyBar(ticker: string): Promise<CleanedCandle | null> {
  if (!POLYGON_API_KEY) {
    throw new Error('POLYGON_API_KEY is not configured')
  }

  const url = `${POLYGON_BASE_URL}/v2/aggs/ticker/${ticker}/prev?adjusted=true&apiKey=${POLYGON_API_KEY}`

  try {
    const response = await fetchWithRetry<PolygonDailyBar>(url)

    if (response.results && response.results.length > 0) {
      const cleaned = cleanOHLCVData(response.results)
      return cleaned[0] || null
    }

    return null
  } catch (error) {
    console.error(`Failed to fetch daily bar for ${ticker}:`, error)
    return null
  }
}

/**
 * Calculate date range for fetching N candles of a given timeframe
 * 
 * @param timeframe - Timeframe (1h, 4h, 1d, 1w, 1m)
 * @param count - Number of candles to fetch
 * @returns Object with from and to dates (YYYY-MM-DD format)
 */
export function calculateDateRange(
  timeframe: Timeframe,
  count: number
): { from: string; to: string } {
  const now = new Date()
  const to = now.toISOString().split('T')[0] // YYYY-MM-DD

  // Calculate milliseconds per candle
  const msPerCandle: Record<Timeframe, number> = {
    '1h': 60 * 60 * 1000,
    '4h': 4 * 60 * 60 * 1000,
    '1d': 24 * 60 * 60 * 1000,
    '1w': 7 * 24 * 60 * 60 * 1000,
    '1m': 30 * 24 * 60 * 60 * 1000,
  }

  // Add 20% buffer to account for gaps (weekends, low liquidity)
  const totalMs = msPerCandle[timeframe] * count * 1.2
  const fromDate = new Date(now.getTime() - totalMs)
  const from = fromDate.toISOString().split('T')[0]

  return { from, to }
}

/**
 * Health check - verify API key is valid
 * 
 * @returns True if API key is valid and working
 */
export async function testPolygonConnection(): Promise<boolean> {
  if (!POLYGON_API_KEY) {
    return false
  }

  try {
    const url = `${POLYGON_BASE_URL}/v3/reference/tickers?market=crypto&limit=1&apiKey=${POLYGON_API_KEY}`
    const response = await fetchWithRetry<PolygonTickersResponse>(url, 1, 500)
    return response.status === 'OK' || response.status === 'success'
  } catch (error) {
    console.error('Polygon.io connection test failed:', error)
    return false
  }
}

