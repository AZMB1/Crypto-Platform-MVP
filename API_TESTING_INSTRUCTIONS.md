# API Endpoint Testing Instructions

## How to Test Your API Endpoints in the Browser

After your code is deployed to Vercel, you can test the two API endpoints we built in Phase I Step 2.

---

## 1. Symbol Search Endpoint

### URL Format:
```
https://[your-app-name].vercel.app/api/symbols/search?q=[SEARCH_TERM]&limit=[NUMBER]
```

### Example URLs to Test:

**Search for Bitcoin:**
```
https://[your-app-name].vercel.app/api/symbols/search?q=BTC
```

**Search for Ethereum with limit:**
```
https://[your-app-name].vercel.app/api/symbols/search?q=ETH&limit=10
```

**Search for all "USD" pairs:**
```
https://[your-app-name].vercel.app/api/symbols/search?q=USD&limit=20
```

### Expected Response:
Your browser will display JSON like this:
```json
{
  "symbols": [
    {
      "id": 1,
      "ticker": "X:BTCUSD",
      "name": "Bitcoin",
      "baseCurrency": "BTC",
      "quoteCurrency": "USD",
      "isActive": true,
      "volume24hUsd": "50000000000.00",
      "volumeRank": 1,
      "lastUpdated": "2024-11-16T12:00:00.000Z"
    }
  ],
  "count": 1,
  "cached": false
}
```

### What to Check:
- ✅ Status 200 (page loads successfully)
- ✅ Returns array of symbols
- ✅ Each symbol has ticker, name, volumeRank
- ✅ First time: `"cached": false`
- ✅ Second time (within 5 min): `"cached": true`

---

## 2. Candles (OHLCV) Endpoint

### URL Format:
```
https://[your-app-name].vercel.app/api/candles/[TICKER]/[TIMEFRAME]?limit=[NUMBER]
```

### Example URLs to Test:

**Bitcoin 1-hour candles:**
```
https://[your-app-name].vercel.app/api/candles/X:BTCUSD/1h?limit=100
```

**Ethereum 4-hour candles:**
```
https://[your-app-name].vercel.app/api/candles/X:ETHUSD/4h?limit=50
```

**Bitcoin daily candles:**
```
https://[your-app-name].vercel.app/api/candles/X:BTCUSD/1d?limit=30
```

### Expected Response:
Your browser will display JSON like this:
```json
{
  "ticker": "X:BTCUSD",
  "timeframe": "1h",
  "count": 100,
  "candles": [
    {
      "timestamp": "2024-11-16T12:00:00.000Z",
      "open": 43500.50,
      "high": 43750.25,
      "low": 43400.00,
      "close": 43650.75,
      "volume": 1234.56,
      "vwap": 43600.25
    },
    // ... more candles
  ]
}
```

### What to Check:
- ✅ Status 200 (page loads successfully)
- ✅ Returns correct ticker and timeframe
- ✅ Count matches number of candles returned
- ✅ Each candle has: timestamp, open, high, low, close, volume
- ✅ Timestamps are in chronological order
- ✅ Prices are realistic numbers (> 0)

---

## 3. Health Check Endpoint (Bonus)

You can also verify your database and Redis connections:

### URL:
```
https://[your-app-name].vercel.app/api/health
```

### Expected Response:
```json
{
  "status": "ok",
  "checks": {
    "database": "connected",
    "redis": "connected",
    "timestamp": "2024-11-16T12:00:00.000Z"
  }
}
```

### What to Check:
- ✅ Status 200
- ✅ `"status": "ok"`
- ✅ `"database": "connected"`
- ✅ `"redis": "connected"`

---

## How to Find Your Vercel URL

1. Go to your Vercel dashboard: https://vercel.com/dashboard
2. Find your project: `crypto-platform-mvp`
3. Click on it
4. Look for the "Domains" section
5. Your URL will be something like: `crypto-platform-mvp.vercel.app`

Or check the latest deployment:
1. Click "Deployments" tab
2. Find the latest successful deployment
3. Click "Visit" button to see your URL

---

## Testing Notes

**Before Testing:**
- Make sure your Railway Cron Job has run at least once to populate symbols
- Otherwise, the symbol search will return empty results

**If You See Errors:**

**"Query parameter q is required"**
- You forgot to add `?q=BTC` to the URL

**"Invalid timeframe"**
- Valid timeframes: `1h`, `4h`, `1d`, `1w`, `1m`
- Make sure you typed it correctly

**"Failed to fetch candles"**
- Check that POLYGON_API_KEY is set in Vercel environment variables
- Verify the ticker format (must be `X:BTCUSD`, not just `BTCUSD`)

**Empty symbols array**
- The database is still empty - run the Railway Cron Job first

---

## Quick Test Checklist

Once you have your Vercel URL, test these three URLs:

- [ ] `/api/health` - Should show database and Redis connected
- [ ] `/api/symbols/search?q=BTC` - Should return Bitcoin symbols
- [ ] `/api/candles/X:BTCUSD/1h?limit=10` - Should return 10 candles

If all three work, Phase I Step 2 is complete! ✅

