/**
 * Fresh Candles Fetcher
 * 
 * Fetches the most recent N candles for a given ticker and timeframe
 * Used by the prediction engine to get current market conditions
 * Results are cached in Redis with 1-hour TTL
 */

import type { CleanedCandle } from '@/types/polygon'
import type { Timeframe } from '@/types/shared'
import { cacheFreshCandles, getCachedFreshCandles } from '../redis/cache-helpers'
import { calculateDateRange, getAggregates } from './rest-client'

/**
 * Get fresh candles for predictions
 * 
 * This function:
 * 1. Checks Redis cache first (1hr TTL)
 * 2. If not cached, fetches from Polygon.io
 * 3. Returns exactly `count` candles (or fewer if not enough data)
 * 4. Caches result in Redis
 * 
 * @param ticker - Crypto ticker (e.g., "X:BTCUSD")
 * @param timeframe - Timeframe (1h, 4h, 1d, 1w, 1m)
 * @param count - Number of candles to fetch (default: 200)
 * @returns Array of cleaned candles
 */
export async function getFreshCandles(
  ticker: string,
  timeframe: Timeframe,
  count: number = 200
): Promise<CleanedCandle[]> {
  // Check cache first
  const cached = await getCachedFreshCandles<CleanedCandle[]>(ticker, timeframe)
  if (cached && cached.length >= count) {
    console.log(`✅ Cache hit: ${ticker} ${timeframe} (${cached.length} candles)`)
    return cached.slice(-count) // Return last N candles
  }

  console.log(`📡 Cache miss: Fetching fresh candles for ${ticker} ${timeframe}`)

  // Calculate date range to fetch enough candles
  const { from, to } = calculateDateRange(timeframe, count)

  try {
    // Fetch from Polygon.io
    const candles = await getAggregates(ticker, timeframe, from, to)

    if (candles.length === 0) {
      console.warn(`⚠️  No candles found for ${ticker} ${timeframe}`)
      return []
    }

    // Sort by timestamp descending and take last N
    const sortedCandles = candles.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
    const recentCandles = sortedCandles.slice(0, count)

    // Cache the result (1hr TTL)
    await cacheFreshCandles(ticker, timeframe, recentCandles)

    console.log(
      `✅ Fetched ${recentCandles.length} fresh candles for ${ticker} ${timeframe} (cached for 1hr)`
    )

    return recentCandles
  } catch (error) {
    console.error(`❌ Failed to fetch fresh candles for ${ticker} ${timeframe}:`, error)
    throw error
  }
}

/**
 * Prefetch candles for multiple tickers
 * Useful for warming up the cache
 * 
 * @param tickers - Array of tickers to prefetch
 * @param timeframe - Timeframe to prefetch
 * @param count - Number of candles per ticker
 */
export async function prefetchCandles(
  tickers: string[],
  timeframe: Timeframe,
  count: number = 200
): Promise<void> {
  console.log(`🔥 Prefetching ${timeframe} candles for ${tickers.length} tickers...`)

  const promises = tickers.map((ticker) =>
    getFreshCandles(ticker, timeframe, count).catch((error) => {
      console.error(`Failed to prefetch ${ticker}:`, error)
      return null
    })
  )

  await Promise.all(promises)

  console.log(`✅ Prefetch complete for ${tickers.length} tickers`)
}

/**
 * Get the latest price from fresh candles
 * 
 * @param ticker - Crypto ticker
 * @param timeframe - Timeframe (default: 1h)
 * @returns Latest close price or null if unavailable
 */
export async function getLatestPrice(
  ticker: string,
  timeframe: Timeframe = '1h'
): Promise<number | null> {
  try {
    const candles = await getFreshCandles(ticker, timeframe, 1)
    return candles.length > 0 ? candles[0].close : null
  } catch (error) {
    console.error(`Failed to get latest price for ${ticker}:`, error)
    return null
  }
}

