/**
 * Symbol Search API Endpoint
 * 
 * GET /api/symbols/search?q=BTC&limit=20
 * 
 * Returns matching crypto symbols for typeahead search
 * Results are cached in Redis for 5 minutes
 */

import { NextRequest, NextResponse } from 'next/server'
import { searchSymbols } from '@/lib/db/queries'
import { getCache, setCache } from '@/lib/redis/cache-helpers'

const CACHE_TTL_SECONDS = 300 // 5 minutes

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const query = searchParams.get('q')
    const limitParam = searchParams.get('limit')
    const limit = limitParam ? parseInt(limitParam, 10) : 20

    // Validate query parameter
    if (!query || query.trim().length === 0) {
      return NextResponse.json(
        { error: 'Query parameter "q" is required' },
        { status: 400 }
      )
    }

    // Validate limit
    if (isNaN(limit) || limit < 1 || limit > 100) {
      return NextResponse.json(
        { error: 'Limit must be between 1 and 100' },
        { status: 400 }
      )
    }

    // Check cache first
    const cacheKey = `symbol_search:${query.toLowerCase()}:${limit}`
    const cached = await getCache<{ symbols: unknown[]; count: number }>(cacheKey)

    if (cached) {
      return NextResponse.json({
        symbols: cached.symbols,
        count: cached.count,
        cached: true,
      })
    }

    // Query database
    const symbols = await searchSymbols(query, limit)

    // Cache the result
    const response = {
      symbols,
      count: symbols.length,
    }

    await setCache(cacheKey, response, CACHE_TTL_SECONDS)

    return NextResponse.json({
      ...response,
      cached: false,
    })
  } catch (error) {
    console.error('Symbol search error:', error)

    return NextResponse.json(
      {
        error: 'Failed to search symbols',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}

