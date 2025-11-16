# Polygon.io Integration Reference

**Company:** Polygon.io (now rebranded as Massive.com)  
**Purpose:** Comprehensive financial market data APIs for crypto, stocks, forex, and more  
**Last Updated:** November 15, 2025

---

## 📑 TABLE OF CONTENTS

| Section | Lines | Topic |
|---------|-------|-------|
| [Overview](#overview) | 25-30 | Three data access methods |
| [REST API](#1-rest-api) | 35-115 | Historical OHLCV, endpoints, integration |
| [WebSocket API](#2-websocket-api) | 120-195 | Real-time streaming, subscription |
| [MCP Protocol](#3-massive-client-protocol-mcp) | 200-250 | AI-native API layer |
| [Integration Strategy](#integration-recommendations-by-phase) | 255-285 | When to use each method |
| [Rate Limiting](#rate-limit-mitigation-strategy) | 290-335 | Caching, batching, backoff |
| [Official Clients](#official-client-libraries) | 340-365 | JS/TS and Python libraries |
| [Environment Variables](#environment-variables-needed) | 370-385 | Required API keys |
| [Summary](#summary-table) | 390-400 | Quick reference table |

---

## Overview

Polygon.io provides three primary data access methods:
1. **REST API** - On-demand historical and reference data
2. **WebSocket API** - Real-time streaming data
3. **Massive Client Protocol (MCP)** - Advanced querying for AI workflows

---

## 1. REST API

### Purpose
On-demand requests for historical OHLCV data, symbol metadata, and market analytics.

### Best Use Cases for Our Project
- **Initial chart loading** - Fetch historical candles when user selects a symbol
- **Backfilling data** - Download 5 years of OHLCV for model training (weekly job)
- **Symbol metadata** - Get coin names, tickers, market cap for typeahead search
- **Reference data** - Asset catalogs, exchange info

### Authentication
```bash
# Query parameter
GET https://api.polygon.io/v2/aggs/ticker/X:BTCUSD/range/1/day/2023-01-01/2023-12-31?apiKey=YOUR_API_KEY

# Or Authorization header
Authorization: Bearer YOUR_API_KEY
```

### Key Endpoints for Crypto

**Historical Aggregates (OHLCV):**
```
GET /v2/aggs/ticker/{ticker}/range/{multiplier}/{timespan}/{from}/{to}

Example:
GET /v2/aggs/ticker/X:BTCUSD/range/1/hour/2023-01-01/2023-12-31
```

**Real-time Last Trade:**
```
GET /v2/last/trade/{ticker}

Example:
GET /v2/last/trade/X:BTCUSD
```

**Symbol Metadata:**
```
GET /v3/reference/tickers

Example:
GET /v3/reference/tickers?market=crypto&active=true&limit=1000
```

### Rate Limits
- **Starter Plan ($29/mo):** 5 calls/minute
- **Developer Plan ($99/mo):** 3000 calls/minute ← **Recommended for MVP**
- **Advanced Plan ($299/mo):** Unlimited

### Integration Strategy
```typescript
// /lib/polygon/rest-client.ts
import axios from 'axios';
import { redis } from './redis';

export async function getHistoricalCandles(
  ticker: string,
  timeframe: string,
  from: string,
  to: string
) {
  const cacheKey = `candles:${ticker}:${timeframe}:${from}:${to}`;
  
  // Check cache first
  const cached = await redis.get(cacheKey);
  if (cached) return JSON.parse(cached);
  
  // Fetch from Polygon.io
  const response = await axios.get(
    `https://api.polygon.io/v2/aggs/ticker/${ticker}/range/1/${timeframe}/${from}/${to}`,
    { params: { apiKey: process.env.POLYGON_API_KEY } }
  );
  
  // Cache for 24 hours (historical data doesn't change)
  await redis.set(cacheKey, JSON.stringify(response.data), 'EX', 86400);
  
  return response.data;
}
```

---

## 2. WebSocket API

### Purpose
Real-time streaming of trades, quotes, and per-second/per-minute aggregates.

### Best Use Cases for Our Project
- **Live chart updates** - Stream real-time price updates to chart component
- **Alert scanning** - Monitor live prices for alert triggers
- **Market pulse** - Show live market activity in dashboard header

### Supported Streams
- **Trades (XT)** - Individual trade executions
- **Quotes (XQ)** - Bid/ask updates
- **Aggregates per minute (XA)** - OHLCV candles every minute
- **Aggregates per second (XAS)** - OHLCV candles every second

### WebSocket Connection
```
wss://socket.massive.com/crypto
```

**Note:** Polygon.io has rebranded to Massive.com. The WebSocket endpoint has changed from `wss://socket.polygon.io/crypto` to `wss://socket.massive.com/crypto`. See [official documentation](https://massive.com/docs/websocket/quickstart).

### Authentication
Send API key immediately after connection:
```json
{"action":"auth","params":"YOUR_API_KEY"}
```

### Subscription
```json
{"action":"subscribe","params":"XT.X:BTCUSD,XA.X:BTCUSD"}
```

### Integration Strategy
```typescript
// /hooks/usePolygonWebSocket.ts
import { useEffect, useRef, useState } from 'react';

export function usePolygonWebSocket(ticker: string) {
  const ws = useRef<WebSocket | null>(null);
  const [price, setPrice] = useState<number | null>(null);
  
  useEffect(() => {
    ws.current = new WebSocket('wss://socket.massive.com/crypto');
    
    ws.current.onopen = () => {
      // Authenticate
      ws.current?.send(JSON.stringify({
        action: 'auth',
        params: process.env.NEXT_PUBLIC_POLYGON_API_KEY
      }));
      
      // Subscribe to ticker
      ws.current?.send(JSON.stringify({
        action: 'subscribe',
        params: `XT.${ticker}`  // e.g., XT.X:BTCUSD
      }));
    };
    
    ws.current.onmessage = (event) => {
      const data = JSON.parse(event.data);
      if (data[0]?.ev === 'XT') {
        setPrice(data[0].p);  // Update price
      }
    };
    
    return () => ws.current?.close();
  }, [ticker]);
  
  return { price };
}
```

### Rate Limits
- **Starter Plan:** 1 concurrent WebSocket connection
- **Developer Plan+:** Unlimited connections

---

## 3. Massive Client Protocol (MCP)

### Purpose
Advanced protocol for efficient querying and streaming of financial data, designed for AI workflows.

### What is MCP?
The Model Context Protocol enables AI agents (like Claude) to interact with Polygon.io data directly within their context. Think of it as an AI-native API layer.

### Best Use Cases for Our Project
- **AI-powered analysis** - Let Claude/LLMs query market data directly
- **Research assistant** - Ask questions about historical patterns
- **Training data exploration** - Query specific market conditions for model training
- **Anomaly detection** - AI can scan for unusual patterns

### Integration Example
```python
# Using MCP with Pydantic AI and Claude
from pydantic_ai import Agent
from polygon_mcp import PolygonMCP

# Initialize MCP server
mcp = PolygonMCP(api_key=os.getenv('POLYGON_API_KEY'))

# Create agent with MCP tools
agent = Agent(
    'claude-4',
    tools=[mcp.query_historical, mcp.get_symbol_info],
)

# Ask AI to analyze data
result = agent.run(
    "What was Bitcoin's average volatility during 2023?"
)
```

### MCP Server Setup
```bash
# Install Polygon MCP server (if available)
npm install @polygon-io/mcp-server

# Or use via Docker
docker pull polygon/mcp-server
```

### When to Use MCP
- **Phase IV+** - Not needed for MVP
- **Advanced analytics** - When building AI-powered insights
- **Research tools** - For admin dashboard analysis
- **Customer support** - AI answering user questions about markets

---

## Integration Recommendations by Phase

### Phase I (MVP)
**REST API:**
- ✅ Fetch historical candles for chart display
- ✅ Get symbol metadata for typeahead search
- ✅ Cache aggressively (24h TTL for historical, 5min for recent)

**WebSocket API:**
- ✅ Stream live prices to chart component
- ✅ Single connection per user session
- ✅ Reconnect with exponential backoff

**MCP:**
- ❌ Skip for MVP

### Phase II (Full Platform)
**REST API:**
- ✅ All Phase I uses
- ✅ Background jobs for weekly data refresh (top 500 coins)
- ✅ Alert price checking (with Redis caching)

**WebSocket API:**
- ✅ All Phase I uses
- ✅ Real-time alert triggering
- ✅ Market pulse dashboard updates

**MCP:**
- ⚠️ Optional - Explore for admin analytics

### Phase III-V (Advanced Features)
**MCP:**
- ✅ AI-powered market insights
- ✅ Natural language data queries
- ✅ Automated pattern detection

---

## Rate Limit Mitigation Strategy

### Caching Layers
```typescript
// 1. Redis Cache (L1)
const cached = await redis.get(cacheKey);
if (cached) return cached;

// 2. PostgreSQL (L2) - for training data
const dbCached = await db.query('SELECT * FROM historical_data WHERE ...');
if (dbCached.rows.length) return dbCached.rows;

// 3. Polygon.io API (L3)
const fresh = await polygon.getHistoricalCandles(...);
await redis.set(cacheKey, fresh, 'EX', ttl);
return fresh;
```

### Request Batching
```typescript
// Batch multiple symbol requests
async function batchFetchSymbols(tickers: string[]) {
  const chunks = chunk(tickers, 100);  // 100 per request
  
  for (const chunk of chunks) {
    await fetchSymbolsBatch(chunk);
    await sleep(60000 / 100);  // Stay under rate limit
  }
}
```

### Backoff Strategy
```typescript
async function fetchWithRetry(url: string, maxRetries = 3) {
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await axios.get(url);
    } catch (error) {
      if (error.response?.status === 429) {
        await sleep(Math.pow(2, i) * 1000);  // Exponential backoff
        continue;
      }
      throw error;
    }
  }
}
```

---

## Official Client Libraries

**JavaScript/TypeScript:**
```bash
npm install @polygon.io/client-js
```

```typescript
import { restClient } from '@polygon.io/client-js';

const client = restClient(process.env.POLYGON_API_KEY);
const aggs = await client.crypto.aggregates('X:BTCUSD', 1, 'day', '2023-01-01', '2023-12-31');
```

**Python (for ML workers):**
```bash
pip install polygon-api-client
```

```python
from polygon import RESTClient

client = RESTClient(api_key=os.getenv('POLYGON_API_KEY'))
aggs = client.get_aggs('X:BTCUSD', 1, 'day', '2023-01-01', '2023-12-31')
```

---

## Documentation Links

- **Official Docs:** https://polygon.io/docs
- **REST API Reference:** https://polygon.io/docs/crypto/getting-started
- **WebSocket Docs:** https://polygon.io/docs/websocket/crypto/overview
- **MCP Server:** https://massive.com (check for MCP-specific docs)
- **GitHub (JS Client):** https://github.com/polygon-io/client-js
- **GitHub (Python Client):** https://github.com/polygon-io/client-python

---

## Environment Variables Needed

```bash
# Server-side (Next.js API routes, Railway workers)
POLYGON_API_KEY=your_api_key_here

# Client-side (WebSocket only)
NEXT_PUBLIC_POLYGON_API_KEY=your_api_key_here
# ⚠️ WARNING: WebSocket requires client exposure
# Use same key or create separate restricted key
```

---

## Cost Optimization Tips

1. **Upgrade to Developer Plan ($99/mo)** - 3000 calls/min is excellent for production
2. **Cache aggressively** - Historical data never changes, cache for 24h+
3. **Use WebSocket for live data** - Avoid polling REST API every second
4. **Batch training data downloads** - Weekly refresh instead of daily
5. **Limit free tier users** - Restrict to cached predictions only
6. **Monitor usage** - Set up alerts for approaching limits

---

## Summary Table

| Method | Use Case | Cost | Rate Limit | Cache Strategy |
|--------|----------|------|------------|----------------|
| **REST API** | Historical data, metadata | $99/mo (Dev) | 3000/min | 24h for historical, 5min for recent |
| **WebSocket** | Real-time prices, alerts | Included | Unlimited | 1min TTL in Redis |
| **MCP** | AI analytics, research | Included | TBD | N/A (on-demand) |

---

**Next Steps:**
1. Sign up for Polygon.io Developer Plan ($99/mo)
2. Get API key from dashboard
3. Test REST API with sample requests
4. Implement WebSocket connection for live charts
5. Consider MCP for Phase IV+ advanced features

