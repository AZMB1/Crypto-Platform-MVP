import type { Timeframe } from '@/types/shared'

import { CACHE_TTL } from '@/types/shared'

import { redis } from './index'

/**
 * Redis Cache Key Patterns
 * Standardized keys for consistent caching across the application
 */

/**
 * Fresh OHLCV Candles Cache Key
 * Pattern: fresh_candles:{ticker}:{timeframe}
 * TTL: 1 hour
 * Usage: Cache fresh candles fetched from Polygon.io for predictions
 */
export function getFreshCandlesCacheKey(ticker: string, timeframe: Timeframe): string {
  return `fresh_candles:${ticker}:${timeframe}`
}

/**
 * Prediction Cache Key
 * Pattern: prediction:{predictionId}
 * TTL: 15 minutes
 * Usage: Cache complete prediction results
 */
export function getPredictionCacheKey(predictionId: string): string {
  return `prediction:${predictionId}`
}

/**
 * Symbol Metadata Cache Key
 * Pattern: symbol:{ticker}
 * TTL: 24 hours
 * Usage: Cache symbol information (name, base/quote currency)
 */
export function getSymbolCacheKey(ticker: string): string {
  return `symbol:${ticker}`
}

/**
 * Top Symbols Cache Key
 * Pattern: top_symbols:{count}
 * TTL: 1 hour
 * Usage: Cache list of top N symbols by volume rank
 */
export function getTopSymbolsCacheKey(count: number = 500): string {
  return `top_symbols:${count}`
}

/**
 * CACHE OPERATIONS
 */

/**
 * Set a value in cache with TTL
 */
export async function setCache<T>(key: string, value: T, ttlSeconds: number): Promise<void> {
  const serialized = JSON.stringify(value)
  await redis.setex(key, ttlSeconds, serialized)
}

/**
 * Get a value from cache
 */
export async function getCache<T>(key: string): Promise<T | null> {
  const value = await redis.get(key)
  if (!value) {
    return null
  }
  try {
    return JSON.parse(value) as T
  } catch {
    return null
  }
}

/**
 * Delete a key from cache
 */
export async function deleteCache(key: string): Promise<void> {
  await redis.del(key)
}

/**
 * Delete multiple keys matching a pattern
 */
export async function deleteCachePattern(pattern: string): Promise<number> {
  const keys = await redis.keys(pattern)
  if (keys.length === 0) {
    return 0
  }
  return redis.del(...keys)
}

/**
 * Check if a key exists in cache
 */
export async function cacheExists(key: string): Promise<boolean> {
  const exists = await redis.exists(key)
  return exists === 1
}

/**
 * Get remaining TTL for a key (in seconds)
 */
export async function getCacheTTL(key: string): Promise<number> {
  return redis.ttl(key)
}

/**
 * DOMAIN-SPECIFIC CACHE FUNCTIONS
 */

/**
 * Cache fresh candles
 */
export async function cacheFreshCandles<T>(ticker: string, timeframe: Timeframe, candles: T): Promise<void> {
  const key = getFreshCandlesCacheKey(ticker, timeframe)
  await setCache(key, candles, CACHE_TTL.FRESH_CANDLES)
}

/**
 * Get cached fresh candles
 */
export async function getCachedFreshCandles<T>(ticker: string, timeframe: Timeframe): Promise<T | null> {
  const key = getFreshCandlesCacheKey(ticker, timeframe)
  return getCache<T>(key)
}

/**
 * Cache a prediction
 */
export async function cachePrediction<T>(predictionId: string, prediction: T): Promise<void> {
  const key = getPredictionCacheKey(predictionId)
  await setCache(key, prediction, CACHE_TTL.PREDICTION)
}

/**
 * Get cached prediction
 */
export async function getCachedPrediction<T>(predictionId: string): Promise<T | null> {
  const key = getPredictionCacheKey(predictionId)
  return getCache<T>(key)
}

/**
 * Cache symbol metadata
 */
export async function cacheSymbol<T>(ticker: string, symbolData: T): Promise<void> {
  const key = getSymbolCacheKey(ticker)
  await setCache(key, symbolData, CACHE_TTL.SYMBOL_METADATA)
}

/**
 * Get cached symbol metadata
 */
export async function getCachedSymbol<T>(ticker: string): Promise<T | null> {
  const key = getSymbolCacheKey(ticker)
  return getCache<T>(key)
}

/**
 * Cache top symbols list
 */
export async function cacheTopSymbols<T>(symbols: T, count: number = 500): Promise<void> {
  const key = getTopSymbolsCacheKey(count)
  await setCache(key, symbols, CACHE_TTL.TOP_SYMBOLS)
}

/**
 * Get cached top symbols list
 */
export async function getCachedTopSymbols<T>(count: number = 500): Promise<T | null> {
  const key = getTopSymbolsCacheKey(count)
  return getCache<T>(key)
}

/**
 * Invalidate all prediction caches
 */
export async function invalidateAllPredictions(): Promise<number> {
  return deleteCachePattern('prediction:*')
}

/**
 * Invalidate all fresh candles caches for a specific ticker
 */
export async function invalidateTickerCandles(ticker: string): Promise<number> {
  return deleteCachePattern(`fresh_candles:${ticker}:*`)
}

