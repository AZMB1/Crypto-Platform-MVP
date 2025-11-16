/**
 * Polygon.io API Type Definitions
 * API Documentation: https://polygon.io/docs
 * Note: Polygon.io rebranded to Massive.com but API remains the same
 */

/**
 * Polygon.io Crypto Symbol (from /v3/reference/tickers)
 */
export interface PolygonSymbol {
  ticker: string // e.g., "X:BTCUSD"
  name: string // e.g., "Bitcoin"
  market: string // "crypto"
  locale: string // "global"
  primary_exchange?: string
  type?: string
  active: boolean
  currency_symbol?: string
  currency_name?: string
  base_currency_symbol?: string // e.g., "BTC"
  base_currency_name?: string // e.g., "Bitcoin"
  last_updated_utc?: string
}

/**
 * Polygon.io Aggregate (OHLCV candle data)
 * From /v2/aggs/ticker/{ticker}/range/{multiplier}/{timespan}/{from}/{to}
 */
export interface PolygonAggregate {
  o: number // Open price
  h: number // High price
  l: number // Low price
  c: number // Close price
  v: number // Volume (in tokens)
  vw?: number // Volume-weighted average price (VWAP)
  t: number // Unix timestamp in milliseconds
  n?: number // Number of transactions
}

/**
 * Response from aggregates endpoint
 */
export interface PolygonAggregatesResponse {
  ticker: string
  queryCount: number
  resultsCount: number
  adjusted: boolean
  results: PolygonAggregate[]
  status: string
  request_id?: string
  next_url?: string // For pagination
}

/**
 * Cleaned candle data (after processing)
 */
export interface CleanedCandle {
  timestamp: Date
  open: number
  high: number
  low: number
  close: number
  volume: number
  vwap?: number
  transactions?: number
}

/**
 * Polygon.io Last Trade
 * From /v2/last/trade/{ticker}
 */
export interface PolygonLastTrade {
  request_id: string
  status: string
  results: {
    T: string // Ticker
    t: number // Timestamp (nanoseconds)
    f: number // TRF timestamp
    q: number // Sequence number
    i: string // Trade ID
    x: number // Exchange ID
    s: number // Size
    c: number[] // Conditions
    p: number // Price
    z: number // Tape
  }
}

/**
 * Polygon.io Real-time Trade (WebSocket)
 * Event type: XT (crypto trade)
 */
export interface PolygonCryptoTrade {
  ev: 'XT' // Event type
  pair: string // Currency pair (e.g., "BTC-USD")
  p: number // Price
  t: number // Timestamp (milliseconds)
  s: number // Size
  c: number[] // Conditions
  i: string // Trade ID
  x: number // Exchange ID
  r: number // Received timestamp
}

/**
 * Polygon.io Real-time Quote (WebSocket)
 * Event type: XQ (crypto quote)
 */
export interface PolygonCryptoQuote {
  ev: 'XQ' // Event type
  pair: string // Currency pair
  lp: number // Last price
  ls: number // Last size
  bp: number // Bid price
  bs: number // Bid size
  ap: number // Ask price
  as: number // Ask size
  t: number // Timestamp (milliseconds)
  x: number // Exchange ID
  r: number // Received timestamp
}

/**
 * Polygon.io Real-time Aggregate (WebSocket)
 * Event type: XA (crypto aggregate)
 */
export interface PolygonCryptoAggregate {
  ev: 'XA' // Event type
  pair: string // Currency pair
  o: number // Open price
  h: number // High price
  l: number // Low price
  c: number // Close price
  v: number // Volume
  s: number // Start timestamp (milliseconds)
  e: number // End timestamp (milliseconds)
}

/**
 * WebSocket Status Message
 */
export interface PolygonWebSocketStatus {
  ev: 'status'
  status: 'connected' | 'auth_success' | 'auth_failed' | 'success' | 'error'
  message: string
}

/**
 * WebSocket Message Union Type
 */
export type PolygonWebSocketMessage =
  | PolygonCryptoTrade
  | PolygonCryptoQuote
  | PolygonCryptoAggregate
  | PolygonWebSocketStatus

/**
 * Polygon.io Tickers List Response
 * From /v3/reference/tickers
 */
export interface PolygonTickersResponse {
  results: PolygonSymbol[]
  status: string
  count: number
  request_id?: string
  next_url?: string // For pagination
}

/**
 * Polygon.io Daily Bar (Previous Close)
 * From /v2/aggs/ticker/{ticker}/prev
 */
export interface PolygonDailyBar {
  ticker: string
  queryCount: number
  resultsCount: number
  adjusted: boolean
  results: PolygonAggregate[]
  status: string
  request_id?: string
}

/**
 * WebSocket Connection State
 */
export enum WebSocketState {
  CONNECTING = 'connecting',
  CONNECTED = 'connected',
  AUTHENTICATED = 'authenticated',
  DISCONNECTED = 'disconnected',
  ERROR = 'error',
  RECONNECTING = 'reconnecting',
}

/**
 * WebSocket Subscription
 */
export interface WebSocketSubscription {
  action: 'subscribe' | 'unsubscribe'
  params: string // e.g., "XT.X:BTCUSD,XT.X:ETHUSD"
}

/**
 * WebSocket Authentication
 */
export interface WebSocketAuth {
  action: 'auth'
  params: string // API key
}

/**
 * Error response from Polygon.io
 */
export interface PolygonError {
  status: string
  error?: string
  message?: string
  request_id?: string
}

