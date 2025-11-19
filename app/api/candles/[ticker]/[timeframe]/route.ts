/**
 * Candles API Endpoint
 * 
 * GET /api/candles/X:BTCUSD/1h?limit=200
 * 
 * Returns OHLCV candle data for a ticker and timeframe
 * Results are cached in Redis for 1 hour via getFreshCandles
 */

import { NextRequest, NextResponse } from 'next/server'
import { getFreshCandles } from '@/lib/polygon/fetch-fresh-candles'
import type { Timeframe } from '@/types/shared'
import { SUPPORTED_TIMEFRAMES } from '@/types/shared'

// Add timeout to prevent hanging requests
const TIMEOUT_MS = 25000 // 25 seconds (Vercel timeout is 30s)

async function withTimeout<T>(
  promise: Promise<T>,
  timeoutMs: number,
  errorMessage: string
): Promise<T> {
  const timeout = new Promise<never>((_, reject) => {
    setTimeout(() => reject(new Error(errorMessage)), timeoutMs)
  })
  return Promise.race([promise, timeout])
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ ticker: string; timeframe: string }> }
) {
  const startTime = Date.now()
  console.log('[Candles API] Request received')

  try {
    const { ticker, timeframe } = await params
    const searchParams = request.nextUrl.searchParams
    const limitParam = searchParams.get('limit')
    const limit = limitParam ? parseInt(limitParam, 10) : 200

    console.log(`[Candles API] ticker=${ticker} timeframe=${timeframe} limit=${limit}`)

    // Validate ticker
    if (!ticker || ticker.trim().length === 0) {
      console.log('[Candles API] ❌ Validation failed: Missing ticker')
      return NextResponse.json(
        { error: 'Ticker is required' },
        { status: 400 }
      )
    }

    // Validate timeframe
    if (!SUPPORTED_TIMEFRAMES.includes(timeframe as Timeframe)) {
      console.log(`[Candles API] ❌ Validation failed: Invalid timeframe ${timeframe}`)
      return NextResponse.json(
        {
          error: 'Invalid timeframe',
          message: `Timeframe must be one of: ${SUPPORTED_TIMEFRAMES.join(', ')}`,
        },
        { status: 400 }
      )
    }

    // Validate limit
    if (isNaN(limit) || limit < 1 || limit > 1000) {
      console.log(`[Candles API] ❌ Validation failed: Invalid limit ${limit}`)
      return NextResponse.json(
        { error: 'Limit must be between 1 and 1000' },
        { status: 400 }
      )
    }

    console.log('[Candles API] 📡 Fetching candles...')

    // Fetch candles with timeout to prevent hanging
    const candles = await withTimeout(
      getFreshCandles(ticker, timeframe as Timeframe, limit),
      TIMEOUT_MS,
      'Request timed out after 25 seconds. Check database/Redis/Polygon connections.'
    )

    console.log(`[Candles API] ✅ Fetched ${candles.length} candles`)

    // Convert Date objects to ISO strings for JSON serialization
    const serializedCandles = candles.map((candle) => ({
      ...candle,
      timestamp: candle.timestamp.toISOString(),
    }))

    const duration = Date.now() - startTime
    console.log(`[Candles API] ✅ Request completed in ${duration}ms`)

    return NextResponse.json({
      ticker,
      timeframe,
      count: serializedCandles.length,
      candles: serializedCandles,
    })
  } catch (error) {
    const duration = Date.now() - startTime
    console.error(`[Candles API] ❌ Error after ${duration}ms:`, error)

    // Detailed error logging
    if (error instanceof Error) {
      console.error(`[Candles API] Error name: ${error.name}`)
      console.error(`[Candles API] Error message: ${error.message}`)
      console.error(`[Candles API] Error stack: ${error.stack}`)
    }

    return NextResponse.json(
      {
        error: 'Failed to fetch candles',
        message: error instanceof Error ? error.message : 'Unknown error',
        duration: `${duration}ms`,
      },
      { status: 500 }
    )
  }
}

