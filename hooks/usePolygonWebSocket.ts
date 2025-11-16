'use client'

/**
 * usePolygonWebSocket Hook
 * 
 * React hook for real-time crypto price updates via Polygon.io WebSocket
 * 
 * Usage:
 * const { price, status, subscribe, unsubscribe } = usePolygonWebSocket('X:BTCUSD')
 */

import { useEffect, useState, useCallback, useRef } from 'react'
import { getWebSocketClient } from '@/lib/polygon/websocket-client'
import type { PolygonCryptoTrade } from '@/types/polygon'
import type { WebSocketState } from '@/types/polygon'

interface UsePolygonWebSocketOptions {
  autoConnect?: boolean
  onTrade?: (trade: PolygonCryptoTrade) => void
}

interface UsePolygonWebSocketReturn {
  price: number | null
  volume: number | null
  timestamp: Date | null
  status: WebSocketState
  isConnected: boolean
  subscribe: (ticker: string) => void
  unsubscribe: (ticker: string) => void
  connect: () => void
  disconnect: () => void
}

/**
 * Hook for real-time WebSocket price updates
 * 
 * @param ticker - Initial ticker to subscribe to (e.g., "X:BTCUSD")
 * @param options - Configuration options
 * @returns WebSocket state and control functions
 */
export function usePolygonWebSocket(
  ticker?: string,
  options: UsePolygonWebSocketOptions = {}
): UsePolygonWebSocketReturn {
  const { autoConnect = true, onTrade } = options

  const [price, setPrice] = useState<number | null>(null)
  const [volume, setVolume] = useState<number | null>(null)
  const [timestamp, setTimestamp] = useState<Date | null>(null)
  const [status, setStatus] = useState<WebSocketState>('disconnected' as WebSocketState)

  const wsClientRef = useRef(getWebSocketClient())
  const subscribedTickersRef = useRef<Set<string>>(new Set())

  /**
   * Handle incoming trade data
   */
  const handleTrade = useCallback(
    (trade: PolygonCryptoTrade) => {
      setPrice(trade.p)
      setVolume(trade.s)
      setTimestamp(new Date(trade.t))

      // Call custom trade handler if provided
      if (onTrade) {
        onTrade(trade)
      }
    },
    [onTrade]
  )

  /**
   * Connect to WebSocket
   */
  const connect = useCallback(() => {
    wsClientRef.current.connect()
  }, [])

  /**
   * Disconnect from WebSocket
   */
  const disconnect = useCallback(() => {
    wsClientRef.current.disconnect()
    subscribedTickersRef.current.clear()
  }, [])

  /**
   * Subscribe to a ticker
   */
  const subscribe = useCallback((tickerToSubscribe: string) => {
    if (!tickerToSubscribe) return

    wsClientRef.current.subscribe(tickerToSubscribe)
    subscribedTickersRef.current.add(tickerToSubscribe)
  }, [])

  /**
   * Unsubscribe from a ticker
   */
  const unsubscribe = useCallback((tickerToUnsubscribe: string) => {
    if (!tickerToUnsubscribe) return

    wsClientRef.current.unsubscribe(tickerToUnsubscribe)
    subscribedTickersRef.current.delete(tickerToUnsubscribe)
  }, [])

  /**
   * Set up WebSocket event listeners
   */
  useEffect(() => {
    const client = wsClientRef.current

    const handleStateChange = (newState: WebSocketState) => {
      setStatus(newState)
    }

    const handleAuthenticated = () => {
      console.log('✅ WebSocket authenticated')
    }

    const handleError = (error: Error) => {
      console.error('❌ WebSocket error:', error)
    }

    const handleDisconnected = () => {
      console.log('🔌 WebSocket disconnected')
    }

    // Register event listeners
    client.on('stateChange', handleStateChange)
    client.on('trade', handleTrade)
    client.on('authenticated', handleAuthenticated)
    client.on('error', handleError)
    client.on('disconnected', handleDisconnected)

    // Auto-connect if enabled
    if (autoConnect && status === 'disconnected') {
      connect()
    }

    // Subscribe to initial ticker if provided
    if (ticker && status === 'authenticated') {
      subscribe(ticker)
    }

    // Cleanup on unmount
    return () => {
      client.off('stateChange', handleStateChange)
      client.off('trade', handleTrade)
      client.off('authenticated', handleAuthenticated)
      client.off('error', handleError)
      client.off('disconnected', handleDisconnected)
    }
  }, [autoConnect, connect, handleTrade, status, subscribe, ticker])

  /**
   * Subscribe to initial ticker when authenticated
   */
  useEffect(() => {
    if (ticker && status === 'authenticated' && !subscribedTickersRef.current.has(ticker)) {
      subscribe(ticker)
    }
  }, [ticker, status, subscribe])

  return {
    price,
    volume,
    timestamp,
    status,
    isConnected: status === 'authenticated',
    subscribe,
    unsubscribe,
    connect,
    disconnect,
  }
}

/**
 * Hook for subscribing to multiple tickers
 * 
 * @param tickers - Array of tickers to subscribe to
 * @param options - Configuration options
 * @returns Map of ticker prices and WebSocket state
 */
export function usePolygonMultiWebSocket(
  tickers: string[],
  options: UsePolygonWebSocketOptions = {}
): {
  prices: Map<string, number>
  status: WebSocketState
  isConnected: boolean
} {
  const { autoConnect = true } = options

  const [prices, setPrices] = useState<Map<string, number>>(new Map())
  const [status, setStatus] = useState<WebSocketState>('disconnected' as WebSocketState)

  const wsClientRef = useRef(getWebSocketClient())

  useEffect(() => {
    const client = wsClientRef.current

    const handleTrade = (trade: PolygonCryptoTrade) => {
      setPrices((prev) => {
        const updated = new Map(prev)
        updated.set(trade.pair, trade.p)
        return updated
      })
    }

    const handleStateChange = (newState: WebSocketState) => {
      setStatus(newState)
    }

    client.on('trade', handleTrade)
    client.on('stateChange', handleStateChange)

    if (autoConnect && status === 'disconnected') {
      client.connect()
    }

    if (status === 'authenticated' && tickers.length > 0) {
      client.subscribe(tickers)
    }

    return () => {
      client.off('trade', handleTrade)
      client.off('stateChange', handleStateChange)

      if (tickers.length > 0) {
        client.unsubscribe(tickers)
      }
    }
  }, [autoConnect, status, tickers])

  return {
    prices,
    status,
    isConnected: status === 'authenticated',
  }
}

