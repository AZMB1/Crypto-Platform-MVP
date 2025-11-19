/**
 * Server-Sent Events (SSE) API Route
 * 
 * Streams real-time trade data from Polygon.io to browser clients
 * Keeps API key secure on the server
 * 
 * Usage: GET /api/websocket/stream?tickers=X:BTCUSD,X:ETHUSD
 */

import { NextRequest } from 'next/server'
import { polygonWSServer } from '@/lib/polygon/websocket-server'

export const runtime = 'nodejs' // Force Node.js runtime (not Edge)
export const dynamic = 'force-dynamic' // Disable caching

interface TradeEvent {
  type: 'trade'
  ticker: string
  price: number
  volume: number
  timestamp: number
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const tickersParam = searchParams.get('tickers')

  if (!tickersParam) {
    return new Response(JSON.stringify({ error: 'Missing tickers parameter' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  const tickers = tickersParam.split(',').map((t) => t.trim()).filter(Boolean)

  if (tickers.length === 0) {
    return new Response(JSON.stringify({ error: 'No valid tickers provided' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  console.log(`[SSE] Client connected, subscribing to: ${tickers.join(', ')}`)

  // Create readable stream for SSE
  const stream = new ReadableStream({
    start(controller) {
      // Track if this client is still connected
      let isConnected = true

      // Add this client to subscriber count
      polygonWSServer.addSubscriber()

      // Subscribe to tickers on the server-side WebSocket
      polygonWSServer.subscribe(tickers)

      // Send initial connection message
      const encoder = new TextEncoder()
      controller.enqueue(
        encoder.encode(`data: ${JSON.stringify({ type: 'connected', tickers })}\n\n`)
      )

      // Handle trade events
      const tradeHandler = (trade: TradeEvent) => {
        // Only send trades for tickers this client subscribed to
        if (tickers.includes(trade.ticker) && isConnected) {
          try {
            controller.enqueue(
              encoder.encode(`data: ${JSON.stringify(trade)}\n\n`)
            )
          } catch (error) {
            console.error('[SSE] Error sending trade data:', error)
            isConnected = false
          }
        }
      }

      // Handle errors
      const errorHandler = (error: Error) => {
        if (isConnected) {
          try {
            controller.enqueue(
              encoder.encode(
                `data: ${JSON.stringify({ type: 'error', message: error.message })}\n\n`
              )
            )
          } catch (err) {
            console.error('[SSE] Error sending error message:', err)
          }
        }
      }

      // Handle disconnection
      const disconnectHandler = () => {
        if (isConnected) {
          try {
            controller.enqueue(
              encoder.encode(`data: ${JSON.stringify({ type: 'disconnected' })}\n\n`)
            )
          } catch (err) {
            console.error('[SSE] Error sending disconnect message:', err)
          }
        }
      }

      // Register event listeners
      polygonWSServer.on('trade', tradeHandler)
      polygonWSServer.on('error', errorHandler)
      polygonWSServer.on('disconnected', disconnectHandler)

      // Cleanup on client disconnect
      request.signal.addEventListener('abort', () => {
        console.log(`[SSE] Client disconnected from: ${tickers.join(', ')}`)
        isConnected = false

        // Remove event listeners
        polygonWSServer.off('trade', tradeHandler)
        polygonWSServer.off('error', errorHandler)
        polygonWSServer.off('disconnected', disconnectHandler)

        // Unsubscribe from tickers
        polygonWSServer.unsubscribe(tickers)

        // Decrement subscriber count
        polygonWSServer.removeSubscriber()

        // Close the stream
        try {
          controller.close()
        } catch (error) {
          // Stream already closed, ignore
        }
      })

      // Send keepalive messages every 15 seconds
      const keepaliveInterval = setInterval(() => {
        if (isConnected) {
          try {
            controller.enqueue(encoder.encode(`: keepalive\n\n`))
          } catch (error) {
            console.error('[SSE] Error sending keepalive:', error)
            isConnected = false
            clearInterval(keepaliveInterval)
          }
        } else {
          clearInterval(keepaliveInterval)
        }
      }, 15000)

      // Cleanup keepalive on abort
      request.signal.addEventListener('abort', () => {
        clearInterval(keepaliveInterval)
      })
    },
  })

  // Return SSE response
  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      'Connection': 'keep-alive',
      'X-Accel-Buffering': 'no', // Disable buffering in nginx
    },
  })
}

