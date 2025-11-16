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

interface RouteParams {
  params: {
    ticker: string
    timeframe: string
  }
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { ticker, timeframe } = params
    const searchParams = request.nextUrl.searchParams
    const limitParam = searchParams.get('limit')
    const limit = limitParam ? parseInt(limitParam, 10) : 200

    // Validate ticker
    if (!ticker || ticker.trim().length === 0) {
      return NextResponse.json(
        { error: 'Ticker is required' },
        { status: 400 }
      )
    }

    // Validate timeframe
    if (!SUPPORTED_TIMEFRAMES.includes(timeframe as Timeframe)) {
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
      return NextResponse.json(
        { error: 'Limit must be between 1 and 1000' },
        { status: 400 }
      )
    }

    // Fetch candles (cached for 1hr via getFreshCandles)
    const candles = await getFreshCandles(ticker, timeframe as Timeframe, limit)

    // Convert Date objects to ISO strings for JSON serialization
    const serializedCandles = candles.map((candle) => ({
      ...candle,
      timestamp: candle.timestamp.toISOString(),
    }))

    return NextResponse.json({
      ticker,
      timeframe,
      count: serializedCandles.length,
      candles: serializedCandles,
    })
  } catch (error) {
    console.error('Candles fetch error:', error)

    return NextResponse.json(
      {
        error: 'Failed to fetch candles',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}

