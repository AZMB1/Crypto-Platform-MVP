/**
 * DEPRECATED: Use lib/polygon/websocket-server.ts instead
 * 
 * This client-side WebSocket implementation exposes the API key to the browser.
 * The new server-side implementation keeps the API key secure on the server.
 * 
 * Polygon.io WebSocket Client
 * 
 * Real-time streaming client for crypto market data
 * WebSocket URL: wss://socket.massive.com/crypto (updated from polygon.io)
 * 
 * Features:
 * - Automatic reconnection
 * - Event emitter pattern
 * - Subscribe/unsubscribe to tickers
 * - Connection state management
 */

import { EventEmitter } from 'events'
import type {
  PolygonCryptoAggregate,
  PolygonCryptoQuote,
  PolygonCryptoTrade,
  PolygonWebSocketMessage,
} from '@/types/polygon'
import { WebSocketState } from '@/types/polygon'

const POLYGON_API_KEY = process.env.POLYGON_API_KEY
const WEBSOCKET_URL = 'wss://socket.massive.com/crypto'
const RECONNECT_DELAY_MS = 3000
const HEARTBEAT_INTERVAL_MS = 30000

export class PolygonWebSocketClient extends EventEmitter {
  private ws: WebSocket | null = null
  private state: WebSocketState = WebSocketState.DISCONNECTED
  private subscriptions: Set<string> = new Set()
  private reconnectTimer: NodeJS.Timeout | null = null
  private heartbeatTimer: NodeJS.Timeout | null = null
  private messageBuffer: string[] = []

  constructor() {
    super()
  }

  /**
   * Connect to Polygon.io WebSocket
   */
  public connect(): void {
    if (this.state === WebSocketState.CONNECTED || this.state === WebSocketState.CONNECTING) {
      console.log('WebSocket already connected or connecting')
      return
    }

    if (!POLYGON_API_KEY) {
      console.error('❌ POLYGON_API_KEY not set')
      this.emit('error', new Error('POLYGON_API_KEY not configured'))
      return
    }

    this.setState(WebSocketState.CONNECTING)
    console.log(`🔌 Connecting to ${WEBSOCKET_URL}...`)

    try {
      this.ws = new WebSocket(WEBSOCKET_URL)

      this.ws.onopen = this.handleOpen.bind(this)
      this.ws.onmessage = this.handleMessage.bind(this)
      this.ws.onerror = this.handleError.bind(this)
      this.ws.onclose = this.handleClose.bind(this)
    } catch (error) {
      console.error('❌ Failed to create WebSocket:', error)
      this.handleError(error as Event)
    }
  }

  /**
   * Disconnect from WebSocket
   */
  public disconnect(): void {
    console.log('🔌 Disconnecting...')

    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer)
      this.reconnectTimer = null
    }

    if (this.heartbeatTimer) {
      clearInterval(this.heartbeatTimer)
      this.heartbeatTimer = null
    }

    if (this.ws) {
      this.ws.close()
      this.ws = null
    }

    this.setState(WebSocketState.DISCONNECTED)
  }

  /**
   * Subscribe to ticker(s)
   * @param tickers - Array of tickers (e.g., ["X:BTCUSD", "X:ETHUSD"])
   */
  public subscribe(tickers: string | string[]): void {
    const tickerArray = Array.isArray(tickers) ? tickers : [tickers]

    tickerArray.forEach((ticker) => this.subscriptions.add(ticker))

    // Subscribe to trades (XT)
    const tradeParams = tickerArray.map((t) => `XT.${t}`).join(',')
    this.send({ action: 'subscribe', params: tradeParams })

    console.log(`✅ Subscribed to: ${tickerArray.join(', ')}`)
  }

  /**
   * Unsubscribe from ticker(s)
   * @param tickers - Array of tickers to unsubscribe from
   */
  public unsubscribe(tickers: string | string[]): void {
    const tickerArray = Array.isArray(tickers) ? tickers : [tickers]

    tickerArray.forEach((ticker) => this.subscriptions.delete(ticker))

    const tradeParams = tickerArray.map((t) => `XT.${t}`).join(',')
    this.send({ action: 'unsubscribe', params: tradeParams })

    console.log(`✅ Unsubscribed from: ${tickerArray.join(', ')}`)
  }

  /**
   * Get current connection state
   */
  public getState(): WebSocketState {
    return this.state
  }

  /**
   * Get currently subscribed tickers
   */
  public getSubscriptions(): string[] {
    return Array.from(this.subscriptions)
  }

  /**
   * Handle WebSocket open event
   */
  private handleOpen(): void {
    console.log('✅ WebSocket connected')
    this.setState(WebSocketState.CONNECTED)

    // Authenticate
    this.send({ action: 'auth', params: POLYGON_API_KEY! })

    // Start heartbeat
    this.startHeartbeat()

    this.emit('connected')
  }

  /**
   * Handle WebSocket message
   */
  private handleMessage(event: MessageEvent): void {
    try {
      const messages = JSON.parse(event.data) as PolygonWebSocketMessage[]

      if (!Array.isArray(messages)) {
        console.warn('Received non-array message:', event.data)
        return
      }

      messages.forEach((message) => {
        if (message.ev === 'status') {
          this.handleStatusMessage(message)
        } else if (message.ev === 'XT') {
          this.emit('trade', message as PolygonCryptoTrade)
        } else if (message.ev === 'XQ') {
          this.emit('quote', message as PolygonCryptoQuote)
        } else if (message.ev === 'XA') {
          this.emit('aggregate', message as PolygonCryptoAggregate)
        }
      })
    } catch (error) {
      console.error('❌ Failed to parse WebSocket message:', error)
    }
  }

  /**
   * Handle status messages
   */
  private handleStatusMessage(message: { ev: 'status'; status: string; message: string }): void {
    console.log(`📊 Status: ${message.status} - ${message.message}`)

    if (message.status === 'auth_success') {
      this.setState(WebSocketState.AUTHENTICATED)
      this.emit('authenticated')

      // Resubscribe to previous subscriptions
      if (this.subscriptions.size > 0) {
        const tickers = Array.from(this.subscriptions)
        this.subscribe(tickers)
      }

      // Send buffered messages
      this.flushMessageBuffer()
    } else if (message.status === 'auth_failed') {
      console.error('❌ Authentication failed')
      this.setState(WebSocketState.ERROR)
      this.emit('error', new Error('Authentication failed'))
    }
  }

  /**
   * Handle WebSocket error
   */
  private handleError(event: Event): void {
    console.error('❌ WebSocket error:', event)
    this.setState(WebSocketState.ERROR)
    this.emit('error', event)
  }

  /**
   * Handle WebSocket close
   */
  private handleClose(event: CloseEvent): void {
    console.log(`🔌 WebSocket closed: ${event.code} - ${event.reason}`)

    if (this.heartbeatTimer) {
      clearInterval(this.heartbeatTimer)
      this.heartbeatTimer = null
    }

    this.setState(WebSocketState.DISCONNECTED)
    this.emit('disconnected', event)

    // Attempt to reconnect if not a clean close
    if (!event.wasClean) {
      this.scheduleReconnect()
    }
  }

  /**
   * Schedule reconnection attempt
   */
  private scheduleReconnect(): void {
    if (this.reconnectTimer) {
      return
    }

    console.log(`🔄 Reconnecting in ${RECONNECT_DELAY_MS}ms...`)
    this.setState(WebSocketState.RECONNECTING)

    this.reconnectTimer = setTimeout(() => {
      this.reconnectTimer = null
      this.connect()
    }, RECONNECT_DELAY_MS)
  }

  /**
   * Send message to WebSocket
   * Buffers messages if not authenticated yet
   */
  private send(message: { action: string; params: string }): void {
    if (!this.ws || this.state !== WebSocketState.AUTHENTICATED) {
      // Buffer the message until authenticated
      this.messageBuffer.push(JSON.stringify(message))
      return
    }

    try {
      this.ws.send(JSON.stringify(message))
    } catch (error) {
      console.error('❌ Failed to send message:', error)
    }
  }

  /**
   * Flush buffered messages
   */
  private flushMessageBuffer(): void {
    if (this.messageBuffer.length === 0) {
      return
    }

    console.log(`📤 Sending ${this.messageBuffer.length} buffered messages...`)

    this.messageBuffer.forEach((message) => {
      if (this.ws && this.state === WebSocketState.AUTHENTICATED) {
        this.ws.send(message)
      }
    })

    this.messageBuffer = []
  }

  /**
   * Start heartbeat to keep connection alive
   */
  private startHeartbeat(): void {
    this.heartbeatTimer = setInterval(() => {
      if (this.ws && this.state === WebSocketState.AUTHENTICATED) {
        // Polygon.io doesn't require explicit ping, but we log for monitoring
        console.log('💓 Heartbeat')
      }
    }, HEARTBEAT_INTERVAL_MS)
  }

  /**
   * Update connection state
   */
  private setState(newState: WebSocketState): void {
    if (this.state !== newState) {
      this.state = newState
      this.emit('stateChange', newState)
    }
  }
}

/**
 * Singleton instance
 */
let wsClient: PolygonWebSocketClient | null = null

/**
 * Get or create the WebSocket client instance
 */
export function getWebSocketClient(): PolygonWebSocketClient {
  if (!wsClient) {
    wsClient = new PolygonWebSocketClient()
  }
  return wsClient
}

