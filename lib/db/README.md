# Database Layer Documentation

This directory contains all database-related code for the Crypto Platform MVP.

## Overview

- **ORM**: Drizzle ORM (type-safe, lightweight)
- **Database**: PostgreSQL (Railway)
- **Client**: pg (connection pooling)
- **Migrations**: Drizzle Kit

## Files

### `schema.ts`
Defines all database tables using Drizzle's schema builder:
- `symbols` - All Polygon.io crypto symbols
- `models` - ML model metadata (5 rows)
- `predictions` - Cached predictions
- `predictionSteps` - Individual forecast candles

### `index.ts`
Database client and connection pool:
- Exports configured Drizzle instance
- Connection pool with 20 max connections
- Helper functions: `testConnection()`, `closeConnections()`

### `queries.ts`
Type-safe CRUD operations:
- **Symbols**: `getSymbolByTicker`, `searchSymbols`, `upsertSymbol`, `getTopSymbolsByVolume`
- **Models**: `getActiveModelByTimeframe`, `getAllActiveModels`
- **Predictions**: `createPrediction`, `getPredictionById`, `getRecentPredictionsBySymbol`
- **Utilities**: `getDatabaseStats`

## Usage Examples

### Querying Symbols

```typescript
import { getSymbolByTicker, searchSymbols } from '@/lib/db/queries'

// Get specific symbol
const btc = await getSymbolByTicker('X:BTCUSD')

// Search symbols (typeahead)
const results = await searchSymbols('BTC', 10)

// Get top 500 by volume
const top500 = await getTopSymbolsByVolume(500)
```

### Creating Predictions

```typescript
import { createPrediction } from '@/lib/db/queries'
import type { PredictionInsert, PredictionStepInsert } from '@/types/database'

const predictionData: PredictionInsert = {
  symbolId: 'uuid-here',
  modelId: 'uuid-here',
  timeframe: '1d',
  predictionDate: new Date(),
  predictUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
  numSteps: 30,
  confidenceAvg: '0.68',
  direction: 'bullish',
}

const stepsData: PredictionStepInsert[] = [
  {
    stepNumber: 1,
    timestamp: new Date(),
    open: '50000.00',
    high: '51000.00',
    low: '49500.00',
    close: '50500.00',
    confidence: '0.72',
    direction: 'bullish',
  },
  // ... 29 more steps
]

const prediction = await createPrediction(predictionData, stepsData)
// Returns full prediction with steps, symbol, and model
```

### Getting Database Stats

```typescript
import { getDatabaseStats } from '@/lib/db/queries'

const stats = await getDatabaseStats()
console.log(stats)
// { symbols: 1234, models: 5, predictions: 567, predictionSteps: 17010 }
```

## Database Schema

### symbols
Stores ALL Polygon.io cryptocurrency symbols (~1000-5000 rows).

| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| ticker | VARCHAR(20) | Unique ticker (e.g., "X:BTCUSD") |
| name | VARCHAR(255) | Coin name (e.g., "Bitcoin") |
| base_currency | VARCHAR(10) | Base currency (e.g., "BTC") |
| quote_currency | VARCHAR(10) | Quote currency (e.g., "USD") |
| is_active | BOOLEAN | Whether symbol is active |
| volume_24h_usd | NUMERIC(20,2) | 24h USD volume for ranking |
| volume_rank | INTEGER | Rank by USD volume |
| last_updated | TIMESTAMP | Last metadata update |
| created_at | TIMESTAMP | Creation timestamp |

**Indexes**: ticker, volume_rank, is_active

---

### models
ML model metadata - **ONE model per timeframe** (5 rows total).

| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| timeframe | VARCHAR(10) | '1h', '4h', '1d', '1w', '1m' |
| version | VARCHAR(50) | Model version (e.g., "v1.0") |
| training_start | TIMESTAMP | Training period start |
| training_end | TIMESTAMP | Training period end |
| num_symbols | INTEGER | Number of symbols trained on (500) |
| top_symbols | JSONB | Array of top symbol tickers |
| accuracy_avg | NUMERIC(5,4) | Average accuracy score |
| feature_count | INTEGER | Number of features used (150+) |
| model_path | VARCHAR(255) | Path to .pkl file (e.g., "/models/1d_v1.0.pkl") |
| is_active | BOOLEAN | Whether this model is active |
| trained_at | TIMESTAMP | When model was trained |
| created_at | TIMESTAMP | Creation timestamp |

**Indexes**: timeframe, is_active, (timeframe, version)

---

### predictions
Cached prediction results for ANY symbol.

| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| symbol_id | UUID | FK to symbols |
| user_id | UUID | Nullable in Phase I (no auth yet) |
| timeframe | VARCHAR(10) | Prediction timeframe |
| model_id | UUID | FK to models |
| prediction_date | TIMESTAMP | When prediction was made |
| predict_until | TIMESTAMP | Last forecast timestamp |
| num_steps | INTEGER | Number of forecast steps (usually 30) |
| confidence_avg | NUMERIC(5,4) | Average confidence across all steps |
| direction | VARCHAR(10) | Overall direction (bullish/bearish/neutral) |
| key_indicators | JSONB | Key technical indicators used |
| created_at | TIMESTAMP | Creation timestamp |

**Indexes**: symbol_id, user_id, timeframe, model_id, created_at

---

### prediction_steps
Individual forecast candles (up to 30 per prediction).

| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| prediction_id | UUID | FK to predictions (cascade delete) |
| step_number | INTEGER | Step number (1-30) |
| timestamp | TIMESTAMP | Forecast timestamp |
| open | NUMERIC(20,8) | Predicted open price |
| high | NUMERIC(20,8) | Predicted high price |
| low | NUMERIC(20,8) | Predicted low price |
| close | NUMERIC(20,8) | Predicted close price |
| confidence | NUMERIC(5,4) | Confidence score for this step |
| direction | VARCHAR(10) | Direction for this step |
| actual_close | NUMERIC(20,8) | Actual close (for validation) |
| is_accurate | BOOLEAN | Whether prediction was accurate |

**Indexes**: prediction_id, timestamp, (prediction_id, step_number)

## Migrations

### Generate Migration
```bash
pnpm run db:generate
```
Creates SQL migration files in `./drizzle/` based on schema changes.

### Run Migrations
```bash
pnpm run db:migrate
```
Applies pending migrations to the database. Automatically runs on deployment (postbuild hook).

### Push Schema (Dev Only)
```bash
pnpm run db:push
```
Pushes schema directly to database without creating migration files. Use for rapid development iteration.

### Database Studio
```bash
pnpm run db:studio
```
Opens Drizzle Studio - a visual database explorer at `https://local.drizzle.studio`.

## Environment Variables

Required environment variables:

```bash
DATABASE_URL=postgresql://user:password@host:5432/database
```

## Connection Pool Configuration

```typescript
{
  max: 20,                    // Maximum connections
  idleTimeoutMillis: 30000,   // Close idle connections after 30s
  connectionTimeoutMillis: 2000 // Fail if connection takes > 2s
}
```

## Type Safety

All database operations are fully typed using Drizzle's inference:

```typescript
import type { Symbol, SymbolInsert } from '@/types/database'

// Compiler knows exact shape of Symbol
const symbol: Symbol = await getSymbolByTicker('X:BTCUSD')

// Insert type ensures all required fields
const newSymbol: SymbolInsert = {
  ticker: 'X:ETHUSD',
  name: 'Ethereum',
  // TypeScript error if missing required fields!
}
```

## Best Practices

1. **Always use query functions** from `queries.ts` instead of raw Drizzle queries
2. **Never expose database client** to API routes or components
3. **Use transactions** for multi-table operations (e.g., creating prediction + steps)
4. **Close connections** when shutting down: `await closeConnections()`
5. **Test locally** using Railway CLI: `railway run tsx scripts/test-db.ts`

## Testing

Run the test script to verify database connection:

```bash
railway run --service backend tsx scripts/test-db.ts
```

Or test via the health check endpoint:

```bash
curl https://your-domain.vercel.app/api/health
```

Response:
```json
{
  "status": "ok",
  "checks": {
    "database": "connected",
    "redis": "connected",
    "timestamp": "2025-11-16T..."
  }
}
```

## Troubleshooting

### Connection Timeout
- Check DATABASE_URL is set correctly
- Verify Railway database is running
- Check network connectivity

### Migration Errors
- Ensure schema changes are compatible
- Check for existing data conflicts
- Review migration SQL in `./drizzle/`

### Type Errors
- Run `pnpm run db:generate` to regenerate types
- Restart TypeScript server in IDE
- Check schema.ts for correct type annotations

