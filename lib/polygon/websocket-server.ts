/**
 * Polygon.io Server-Side WebSocket Manager
 * 
 * Node.js-only WebSocket client for maintaining a single shared connection
 * to Polygon.io on the server. Broadcasts trade data to multiple API route clients.
 * 
 * Security: API key stays on server, never exposed to browser
 * Architecture: Singleton pattern - one connection shared by all SSE clients
 */

import { WebSocket } from 'ws'
import { EventEmitter } from 'events'
import type {
  PolygonCryptoTrade,
  PolygonWebSocketMessage,
} from '@/types/polygon'

const POLYGON_API_KEY = process.env.POLYGON_API_KEY
const WEBSOCKET_URL = 'wss://socket.massive.com/crypto'
const RECONNECT_DELAY_MS = 3000
const HEARTBEAT_INTERVAL_MS = 30000

type ConnectionState = 'disconnected' | 'connecting' | 'connected' | 'authenticated'

/**
 * Server-side WebSocket manager for Polygon.io
 * Emits 'trade' events when new trade data arrives
 */
export class PolygonWebSocketServer extends EventEmitter {
  private ws: WebSocket | null = null
  private state: ConnectionState = 'disconnected'
  private subscriptions: Set<string> = new Set()
  private reconnectTimer: NodeJS.Timeout | null = null
  private heartbeatTimer: NodeJS.Timeout | null = null
  private subscriberCount = 0

  constructor() {
    super()
  }

  /**
   * Connect to Polygon.io WebSocket (called automatically when first subscriber connects)
   */
  public connect(): void {
    if (this.state === 'connected' || this.state === 'connecting' || this.state === 'authenticated') {
      console.log('[WebSocket Server] Already connected or connecting')
      return
    }

    if (!POLYGON_API_KEY) {
      console.error('[WebSocket Server] ❌ POLYGON_API_KEY not set')
      this.emit('error', new Error('POLYGON_API_KEY not configured'))
      return
    }

    this.setState('connecting')
    console.log(`[WebSocket Server] 🔌 Connecting to ${WEBSOCKET_URL}...`)

    try {
      this.ws = new WebSocket(WEBSOCKET_URL)

      this.ws.on('open', this.handleOpen.bind(this))
      this.ws.on('message', this.handleMessage.bind(this))
      this.ws.on('error', this.handleError.bind(this))
      this.ws.on('close', this.handleClose.bind(this))
    } catch (error) {
      console.error('[WebSocket Server] ❌ Failed to create WebSocket:', error)
      this.handleError(error as Error)
    }
  }

  /**
   * Disconnect from WebSocket
   */
  public disconnect(): void {
    console.log('[WebSocket Server] 🔌 Disconnecting...')

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

    this.setState('disconnected')
    this.subscriptions.clear()
  }

  /**
   * Subscribe to ticker(s)
   */
  public subscribe(tickers: string | string[]): void {
    const tickerArray = Array.isArray(tickers) ? tickers : [tickers]

    tickerArray.forEach((ticker) => this.subscriptions.add(ticker))

    // Subscribe to trades (XT)
    const tradeParams = tickerArray.map((t) => `XT.${t}`).join(',')
    this.send({ action: 'subscribe', params: tradeParams })

    console.log(`[WebSocket Server] ✅ Subscribed to: ${tickerArray.join(', ')}`)
  }

  /**
   * Unsubscribe from ticker(s)
   */
  public unsubscribe(tickers: string | string[]): void {
    const tickerArray = Array.isArray(tickers) ? tickers : [tickers]

    tickerArray.forEach((ticker) => this.subscriptions.delete(ticker))

    const tradeParams = tickerArray.map((t) => `XT.${t}`).join(',')
    this.send({ action: 'unsubscribe', params: tradeParams })

    console.log(`[WebSocket Server] ✅ Unsubscribed from: ${tickerArray.join(', ')}`)
  }

  /**
   * Increment subscriber count (SSE client connected)
   */
  public addSubscriber(): void {
    this.subscriberCount++
    console.log(`[WebSocket Server] 📊 Subscriber count: ${this.subscriberCount}`)

    // Auto-connect when first subscriber joins
    if (this.subscriberCount === 1 && this.state === 'disconnected') {
      this.connect()
    }
  }

  /**
   * Decrement subscriber count (SSE client disconnected)
   */
  public removeSubscriber(): void {
    this.subscriberCount = Math.max(0, this.subscriberCount - 1)
    console.log(`[WebSocket Server] 📊 Subscriber count: ${this.subscriberCount}`)

    // Auto-disconnect when last subscriber leaves (after 30s grace period)
    if (this.subscriberCount === 0) {
      setTimeout(() => {
        if (this.subscriberCount === 0) {
          console.log('[WebSocket Server] No subscribers, disconnecting...')
          this.disconnect()
        }
      }, 30000) // 30 second grace period
    }
  }

  /**
   * Get current connection state
   */
  public getState(): ConnectionState {
    return this.state
  }

  /**
   * Handle WebSocket open event
   */
  private handleOpen(): void {
    console.log('[WebSocket Server] ✅ Connected')
    this.setState('connected')

    // Authenticate
    this.send({ action: 'auth', params: POLYGON_API_KEY! })

    // Start heartbeat
    this.startHeartbeat()
  }

  /**
   * Handle WebSocket message
   */
  private handleMessage(data: Buffer): void {
    try {
      const messages = JSON.parse(data.toString()) as PolygonWebSocketMessage[]

      messages.forEach((msg) => {
        switch (msg.ev) {
          case 'status':
            if (msg.status === 'auth_success') {
              console.log('[WebSocket Server] ✅ Authenticated')
              this.setState('authenticated')
              this.emit('authenticated')

              // Resubscribe to existing tickers
              if (this.subscriptions.size > 0) {
                this.subscribe(Array.from(this.subscriptions))
              }
            } else if (msg.status === 'auth_failed') {
              console.error('[WebSocket Server] ❌ Authentication failed')
              this.emit('error', new Error('Authentication failed'))
            }
            break

          case 'XT': // Crypto trade
            const trade = msg as PolygonCryptoTrade
            // Emit trade event for SSE clients
            this.emit('trade', {
              type: 'trade',
              ticker: trade.pair,
              price: trade.p,
              volume: trade.s,
              timestamp: trade.t,
            })
            break

          default:
            // Ignore other event types
            break
        }
      })
    } catch (error) {
      console.error('[WebSocket Server] ❌ Failed to parse message:', error)
    }
  }

  /**
   * Handle WebSocket error
   */
  private handleError(error: Error): void {
    console.error('[WebSocket Server] ❌ Error:', error.message)
    this.emit('error', error)
  }

  /**
   * Handle WebSocket close
   */
  private handleClose(code: number, reason: Buffer): void {
    console.log(`[WebSocket Server] 🔌 Disconnected (code: ${code}, reason: ${reason.toString()})`)
    this.setState('disconnected')
    this.emit('disconnected')

    // Stop heartbeat
    if (this.heartbeatTimer) {
      clearInterval(this.heartbeatTimer)
      this.heartbeatTimer = null
    }

    // Attempt reconnection if there are active subscribers
    if (this.subscriberCount > 0) {
      console.log(`[WebSocket Server] 🔄 Reconnecting in ${RECONNECT_DELAY_MS}ms...`)
      this.reconnectTimer = setTimeout(() => {
        this.connect()
      }, RECONNECT_DELAY_MS)
    }
  }

  /**
   * Send message to Polygon.io
   */
  private send(message: { action: string; params: string }): void {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
      console.warn('[WebSocket Server] ⚠️ Cannot send, WebSocket not open')
      return
    }

    this.ws.send(JSON.stringify(message))
  }

  /**
   * Start heartbeat timer
   */
  private startHeartbeat(): void {
    this.heartbeatTimer = setInterval(() => {
      if (this.ws && this.ws.readyState === WebSocket.OPEN) {
        this.ws.ping()
      }
    }, HEARTBEAT_INTERVAL_MS)
  }

  /**
   * Update connection state
   */
  private setState(newState: ConnectionState): void {
    if (this.state !== newState) {
      this.state = newState
      this.emit('stateChange', newState)
    }
  }
}

// Export singleton instance
export const polygonWSServer = new PolygonWebSocketServer()

