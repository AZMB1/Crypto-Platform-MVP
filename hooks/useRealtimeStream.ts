'use client'

/**
 * useRealtimeStream Hook
 * 
 * Connects to server-side SSE endpoint for real-time trade data
 * Replaces usePolygonWebSocket with secure server-side proxy
 * 
 * Security: API key stays on server, never exposed to browser
 */

import { useEffect, useState, useCallback, useRef } from 'react'

interface TradeEvent {
  type: 'trade'
  ticker: string
  price: number
  volume: number
  timestamp: number
}

interface ConnectionEvent {
  type: 'connected'
  tickers: string[]
}

interface ErrorEvent {
  type: 'error'
  message: string
}

interface DisconnectedEvent {
  type: 'disconnected'
}

type SSEEvent = TradeEvent | ConnectionEvent | ErrorEvent | DisconnectedEvent

interface UseRealtimeStreamOptions {
  autoConnect?: boolean
  onTrade?: (trade: TradeEvent) => void
}

interface UseRealtimeStreamReturn {
  price: number | null
  volume: number | null
  timestamp: Date | null
  status: 'disconnected' | 'connecting' | 'connected'
  isConnected: boolean
  connect: () => void
  disconnect: () => void
}

/**
 * Hook for real-time price updates via Server-Sent Events (SSE)
 * 
 * @param ticker - Ticker to subscribe to (e.g., "X:BTCUSD")
 * @param options - Configuration options
 * @returns Real-time price data and connection status
 */
export function useRealtimeStream(
  ticker?: string,
  options: UseRealtimeStreamOptions = {}
): UseRealtimeStreamReturn {
  const { autoConnect = true, onTrade } = options

  const [price, setPrice] = useState<number | null>(null)
  const [volume, setVolume] = useState<number | null>(null)
  const [timestamp, setTimestamp] = useState<Date | null>(null)
  const [status, setStatus] = useState<'disconnected' | 'connecting' | 'connected'>('disconnected')

  const eventSourceRef = useRef<EventSource | null>(null)
  const isConnectingRef = useRef(false)
  const retryCountRef = useRef(0)
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  const MAX_RETRIES = 3 // Stop after 3 failed attempts
  const BASE_RETRY_DELAY = 5000 // Start with 5 seconds

  /**
   * Connect to SSE endpoint
   */
  const connect = useCallback(() => {
    if (!ticker) return
    if (eventSourceRef.current || isConnectingRef.current) return

    isConnectingRef.current = true
    setStatus('connecting')

    console.log(`[SSE] Connecting to ticker: ${ticker}`)

    try {
      const eventSource = new EventSource(`/api/websocket/stream?tickers=${encodeURIComponent(ticker)}`)
      eventSourceRef.current = eventSource

      eventSource.onopen = () => {
        console.log(`[SSE] ✅ Connected to ticker: ${ticker}`)
        setStatus('connected')
        isConnectingRef.current = false
        retryCountRef.current = 0 // Reset retry count on successful connection
      }

      eventSource.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data) as SSEEvent

          switch (data.type) {
            case 'connected':
              console.log(`[SSE] Subscribed to: ${data.tickers.join(', ')}`)
              break

            case 'trade':
              if (data.ticker === ticker) {
                setPrice(data.price)
                setVolume(data.volume)
                setTimestamp(new Date(data.timestamp))

                // Call custom trade handler if provided
                if (onTrade) {
                  onTrade(data)
                }
              }
              break

            case 'error':
              console.error(`[SSE] Error: ${data.message}`)
              break

            case 'disconnected':
              console.log('[SSE] Server disconnected')
              setStatus('disconnected')
              break
          }
        } catch (error) {
          console.error('[SSE] Failed to parse message:', error)
        }
      }

      eventSource.onerror = (error) => {
        console.error('[SSE] ❌ Connection error:', error)
        setStatus('disconnected')
        isConnectingRef.current = false

        // Close and cleanup
        if (eventSourceRef.current) {
          eventSourceRef.current.close()
          eventSourceRef.current = null
        }

        // Increment retry count
        retryCountRef.current += 1

        // Stop retrying after MAX_RETRIES
        if (retryCountRef.current >= MAX_RETRIES) {
          console.warn(`[SSE] ⚠️  Max retries (${MAX_RETRIES}) reached for ${ticker}. Stopping reconnection attempts.`)
          return
        }

        // Exponential backoff: 5s, 10s, 20s
        const delay = BASE_RETRY_DELAY * Math.pow(2, retryCountRef.current - 1)
        console.log(`[SSE] 🔄 Retry ${retryCountRef.current}/${MAX_RETRIES} in ${delay}ms...`)

        // Attempt reconnection with exponential backoff
        reconnectTimeoutRef.current = setTimeout(() => {
          if (ticker && autoConnect) {
            connect()
          }
        }, delay)
      }
    } catch (error) {
      console.error('[SSE] Failed to create EventSource:', error)
      setStatus('disconnected')
      isConnectingRef.current = false
    }
  }, [ticker, autoConnect, onTrade])

  /**
   * Disconnect from SSE endpoint
   */
  const disconnect = useCallback(() => {
    console.log('[SSE] Disconnecting...')

    // Clear any pending reconnection attempts
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current)
      reconnectTimeoutRef.current = null
    }

    if (eventSourceRef.current) {
      eventSourceRef.current.close()
      eventSourceRef.current = null
    }

    isConnectingRef.current = false
    retryCountRef.current = 0
    setStatus('disconnected')
  }, [])

  /**
   * Auto-connect on mount if enabled
   */
  useEffect(() => {
    if (autoConnect && ticker && status === 'disconnected') {
      connect()
    }

    // Cleanup on unmount
    return () => {
      disconnect()
    }
  }, [autoConnect, ticker, status, connect, disconnect])

  return {
    price,
    volume,
    timestamp,
    status,
    isConnected: status === 'connected',
    connect,
    disconnect,
  }
}

