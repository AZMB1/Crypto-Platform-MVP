# System Architecture & Data Strategy

**Purpose:** Complete system architecture, data strategy, database schemas, and workflows  
**Last Updated:** November 15, 2025

---

## 📑 TABLE OF CONTENTS

| Section | Lines | Topic |
|---------|-------|-------|
| [Quick Reference](#quick-reference) | 25-60 | Critical decisions at a glance |
| [Architecture Diagram](#architecture-diagram) | 65-115 | System overview diagram |
| [Component Breakdown](#component-breakdown) | 120-345 | Frontend, Backend, Database, File Storage, Redis, ML Pipeline |
| [Database Schema](#database-schema) | 350-670 | Complete SQL schemas for all tables |
| [Data Workflows](#data-workflows) | 675-820 | Training, Predictions, Live Charts, Symbol Sync |
| [Critical Decisions](#critical-decisions) | 825-920 | Why we made key architecture choices |
| [Error Handling](#error-handling) | 925-975 | Error states, messages, loading states |
| [Security & Deployment](#security--deployment) | 980-1135 | Auth, scaling, monitoring, CI/CD |
| [Technology Decisions](#technology-decisions) | 1105-1120 | Tech stack summary table |
| [ML Training Details](#ml-training-details) | 1145-1250 | XGBoost implementation, multi-step forecasting |
| [Drizzle ORM Guide](#drizzle-orm-explanation) | 1255-1295 | Database client explanation |

---

## Quick Reference

### **Critical Architecture Decisions**

**1. ONE Model Per Timeframe**
- Total models: 5 (not 2,500)
- Trained on: ALL top 500 coins combined
- Can predict: ANY symbol (learns universal patterns)

**2. No OHLCV in PostgreSQL**
- PostgreSQL: Metadata only (~100 MB)
- File Storage: Training data (~4 GB)
- Redis: Fresh prediction data (cached 1hr)

**3. USD Volume Ranking**
- Formula: Token Volume × VWAP
- Top 500: Most liquid by USD volume
- Updated: Weekly

**4. Symbols Table: ALL Polygon.io Cryptos**
- Stores: ~1000-5000 symbols
- Training: Top 500 only
- Predictions: Any symbol
- Auto-syncs: Daily/weekly

**5. Fresh Data for Predictions**
- Training data: Can be 7 days old (file storage)
- Prediction data: Max 1 hour old (Polygon API → Redis)

---

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                         USER LAYER                               │
├─────────────────────────────────────────────────────────────────┤
│  Web Browser (Desktop/Mobile)                                    │
│  - Next.js React App                                             │
│  - TradingView Charts                                            │
│  - Real-time WebSocket Connection                                │
└────────────────────────┬────────────────────────────────────────┘
                         │ HTTPS/WSS
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│                    FRONTEND (Vercel)                             │
├─────────────────────────────────────────────────────────────────┤
│  Next.js Application                                             │
│  - Server Components (data fetching)                             │
│  - Client Components (interactive UI)                            │
│  - API Routes (lightweight middleware)                           │
│  - Edge Functions (geo-distributed)                              │
└────────────────────────┬────────────────────────────────────────┘
                         │
         ┌───────────────┼───────────────┐
         │               │               │
         ▼               ▼               ▼
┌────────────────┐ ┌─────────────┐ ┌────────────────┐
│  Polygon.io    │ │   Railway   │ │   Stripe       │
│  (Market Data) │ │  (Backend)  │ │  (Payments)    │
└────────────────┘ └──────┬──────┘ └────────────────┘
                          │
         ┌────────────────┼────────────────┐
         │                │                │
         ▼                ▼                ▼
┌─────────────────┐ ┌──────────────┐ ┌──────────────┐
│  PostgreSQL     │ │    Redis     │ │ File Storage │
│  (Metadata)     │ │  (Cache)     │ │ (Training)   │
│                 │ │              │ │              │
│  - Users        │ │  - Fresh     │ │  - OHLCV     │
│  - Predictions  │ │    OHLCV     │ │  - Models    │
│  - Symbols      │ │  - Cache     │ │  (~4.5 GB)   │
│  (~100 MB)      │ │  (~65 MB)    │ │              │
└─────────────────┘ └──────────────┘ └──────────────┘
```

---

## Component Breakdown

### 1. Frontend Layer (Vercel)

**Technology:** Next.js 15 (App Router)

**Responsibilities:**
- Render UI components (server + client)
- Handle user interactions
- Display live charts with real-time data
- Route requests to backend APIs

**Key Files:**
```
/app/                         → App Router pages
/components/                  → React components
/lib/polygon-client.ts        → Polygon.io API wrapper
/lib/api-client.ts            → Backend API client
/hooks/                       → Custom React hooks
```

**Deployment:**
- Auto-deploys from GitHub `main` branch
- Preview deployments for PRs
- Environment variables managed in Vercel dashboard

---

### 2. Backend API (Next.js API Routes)

**Technology:** Next.js API Routes + Railway services

**Responsibilities:**
- Authenticate users (Phase II+)
- Enforce tier-based rate limits and quotas (Phase II+)
- Proxy Polygon.io requests with caching
- Trigger ML inference for predictions
- Process alerts, watchlists, trading plans (Phase II+)
- Handle webhooks (Stripe, Polygon.io)

**Key Endpoints:**
```
POST   /api/predictions/generate      → Generate new prediction
GET    /api/predictions/:id           → Fetch cached prediction
GET    /api/symbols/search            → Search coins (typeahead)
GET    /api/health                    → Health check

Phase II+:
POST   /api/watchlists                → Create watchlist
GET    /api/alerts                    → Fetch user alerts
POST   /api/alerts                    → Create alert
POST   /api/webhooks/stripe           → Handle Stripe events
```

---

### 3. Database (PostgreSQL on Railway)

**Purpose:** Store relational data ONLY (~100 MB)

**Phase I Tables (4 tables):**
- `symbols` - ALL Polygon.io symbols (~1000-5000 rows)
- `predictions` - Cached predictions (grows over time)
- `prediction_steps` - Forecast candles (30 × predictions)
- `models` - Model metadata (5 rows - one per timeframe)

**Phase II+ Tables:**
- `users`, `sessions`, `accounts` - Authentication
- `watchlists`, `watchlist_items` - User watchlists
- `alerts`, `alert_logs` - Price alerts
- `trading_plans` - Trading plans
- `subscriptions`, `usage_tracking` - Payments & quotas
- `model_accuracy` - Accuracy tracking

**What PostgreSQL Does NOT Store:**
- ❌ Historical OHLCV data (lives in file storage)
- ❌ Calculated indicators (computed on-the-fly)
- ❌ Trained model files (lives in file storage)

**Connection:**
- URL: `DATABASE_URL` environment variable
- **ORM:** Drizzle ORM (type-safe, lightweight, SQL-like syntax)
- Client: `pg` for connection pooling
- Backups: Automated daily snapshots by Railway

---

### 4. File Storage (Railway Persistent Volumes)

**Purpose:** Store training data and ML models (~4.5 GB)

**Structure:**
```
/data/                                  # Training OHLCV data
├── X_BTCUSD/
│   ├── 1h_ohlcv.parquet (4 MB)       # 1 year
│   ├── 4h_ohlcv.parquet (3 MB)       # 3 years
│   ├── 1d_ohlcv.parquet (1 MB)       # 5 years
│   ├── 1w_ohlcv.parquet (150 KB)     # 5 years
│   └── 1m_ohlcv.parquet (50 KB)      # 5 years
├── X_ETHUSD/
│   └── ... (same structure)
└── ... (498 more top symbols)

/models/                                # Trained ML models
├── 1h_v1.0.pkl (100 MB)               # ONE model for ALL symbols
├── 4h_v1.0.pkl (100 MB)               # ONE model for ALL symbols
├── 1d_v1.0.pkl (100 MB)               # ONE model for ALL symbols
├── 1w_v1.0.pkl (100 MB)               # ONE model for ALL symbols
└── 1m_v1.0.pkl (100 MB)               # ONE model for ALL symbols
```

**Data Format:**
- Columns: timestamp, open, high, low, close, volume + 150+ indicators
- Format: Parquet (compressed, columnar, fast)
- Updated: Weekly (incremental append + trim)

**Retention Periods:**
| Timeframe | Retention | Candles | Size/Symbol | 500 Symbols |
|-----------|-----------|---------|-------------|-------------|
| 1h | 1 year | ~8,760 | 4 MB | 2 GB |
| 4h | 3 years | ~6,570 | 3 MB | 1.5 GB |
| 1d | 5 years | ~1,825 | 1 MB | 500 MB |
| 1w | 5 years | ~260 | 150 KB | 75 MB |
| 1m | 5 years | ~60 | 50 KB | 25 MB |
| **Total** | | | | **~4 GB** |

**Why File Storage?**
- ✅ Perfect for large time-series datasets
- ✅ Much cheaper than PostgreSQL for millions of rows
- ✅ Parquet format optimized for columnar data
- ✅ Railway persistent volumes scale easily

---

### 5. Cache (Redis on Railway)

**Purpose:** High-speed temporary cache (~65 MB)

**Cache Keys:**
```bash
# Fresh OHLCV for predictions (1 hour TTL)
fresh_candles:{ticker}:{timeframe}  → 200 candles from Polygon.io API

# Cached predictions (15 min TTL)
prediction:{symbol_id}:{timeframe}  → Recent prediction results

# Symbol metadata (24 hour TTL)
symbol:metadata:{ticker}            → Symbol info

# User quotas (Phase II - 24 hour TTL)
user:quota:{user_id}:{date}         → API call counts

# Alert prices (Phase II - 1 min TTL)
alert:scan:{symbol_id}              → Latest prices for alerts
```

**Why Two OHLCV Sources?**
- **File Storage:** Training data (updated weekly, can be 7 days old)
- **Redis Cache:** Prediction data (fresh from API, max 1 hour old)
- **Critical:** Predictions need fresh data for accuracy!

---

### 6. ML Training Pipeline (Railway Worker)

**Technology:** Python (XGBoost, pandas, ta-lib, pandas-ta)

**ML Algorithm:**
- **Phase I Steps 1-5:** XGBoost (Gradient Boosting)
  - Fast training (~2-4 hours), accurate, runs on CPU, explainable
  - Multi-step: Iterative forecasting
  - Confidence: Simple time-decay (85% → 60%)
- **Phase I Step 6 (Final):** Hybrid Ensemble
  - 40% LSTM + 40% XGBoost + 20% Random Forest
  - Direct multi-output forecasting
  - Advanced confidence estimation
  - **Required before Phase I completion**

**Responsibilities:**
- Update symbol rankings (USD volume calculation)
- Incrementally update training data (append 7 days, trim old)
- Calculate 150+ indicators (pandas-ta + ta-lib, no duplicates)
- Train 5 XGBoost models (one per timeframe on ALL top 500 coins)
- Save models and metadata

**Schedule:** Every Sunday 2 AM UTC

**See:** [Data Workflows → Weekly Training](#weekly-training-job) for complete workflow

---

### 7. ML Inference Service (Railway Worker / API Route)

**Technology:** Python (Flask/FastAPI or Next.js API route)

**Responsibilities:**
- Fetch FRESH OHLCV from Polygon.io (NOT file storage)
- Calculate indicators on-the-fly
- Load trained model from file storage
- Generate 30-step forecast
- Return prediction JSON

**API Endpoint:**
```
POST /ml/predict
Body: {
  "symbol": "X:BTCUSD",
  "timeframe": "1d",
  "predict_until": "2025-12-01T00:00:00Z"
}

Response: {
  "prediction_id": "uuid",
  "steps": [ {...}, {...}, ... ],
  "key_indicators": ["RSI", "MACD", "Bollinger Upper"],
  "confidence_avg": 0.78
}
```

---

### 8. External Services

#### Polygon.io (Market Data)
- **REST API:** Training updates + fresh prediction data
  - Rate Limit: 3000 calls/minute (Developer plan $99/mo)
- **WebSocket:** Live chart updates only
  - Unlimited connections
- **Optimization:** Redis caching + incremental updates

#### Stripe (Payments - Phase III)
- Subscription billing and payment processing

#### Resend (Email - Phase II)
- Transactional emails for alerts and notifications

---

## Database Schema

### Phase I Tables (Required for MVP)

#### `symbols`
ALL Polygon.io cryptocurrency symbols (~1000-5000 rows).

```sql
CREATE TABLE symbols (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ticker            VARCHAR(20) UNIQUE NOT NULL,  -- "X:BTCUSD"
  name              VARCHAR(255) NOT NULL,         -- "Bitcoin"
  base_currency     VARCHAR(10),                   -- "BTC"
  quote_currency    VARCHAR(10),                   -- "USD"
  is_active         BOOLEAN DEFAULT true,
  
  -- Ranking columns (determines top 500 for training)
  volume_24h_usd    NUMERIC(20, 2),               -- USD volume (tokens × VWAP)
  volume_rank       INTEGER,                      -- Rank by USD volume
  
  last_updated      TIMESTAMP,
  created_at        TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_symbols_ticker ON symbols(ticker);
CREATE INDEX idx_symbols_volume_rank ON symbols(volume_rank);
CREATE INDEX idx_symbols_active ON symbols(is_active);
```

---

#### `predictions`
Cached prediction results. Can be for ANY symbol.

```sql
CREATE TABLE predictions (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  symbol_id         UUID NOT NULL REFERENCES symbols(id) ON DELETE CASCADE,
  user_id           UUID,                                 -- Nullable in Phase I (no auth), FK added in Phase II
  timeframe         VARCHAR(10) NOT NULL CHECK (timeframe IN ('1h', '4h', '1d', '1w', '1m')),
  model_id          UUID NOT NULL REFERENCES models(id),
  prediction_date   TIMESTAMP NOT NULL,
  predict_until     TIMESTAMP NOT NULL,
  num_steps         INTEGER NOT NULL,
  confidence_avg    NUMERIC(5, 4),
  direction         VARCHAR(10),
  key_indicators    JSONB,
  created_at        TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_predictions_symbol_id ON predictions(symbol_id);
CREATE INDEX idx_predictions_user_id ON predictions(user_id);
CREATE INDEX idx_predictions_timeframe ON predictions(timeframe);
CREATE INDEX idx_predictions_model_id ON predictions(model_id);
CREATE INDEX idx_predictions_created_at ON predictions(created_at);
```

**Phase I Note:** user_id is nullable with no foreign key constraint (no users table yet).  
**Phase II Migration:** Add foreign key constraint: `ALTER TABLE predictions ADD CONSTRAINT fk_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL;`

---

#### `prediction_steps`
Individual forecast candles (up to 30 per prediction).

```sql
CREATE TABLE prediction_steps (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  prediction_id  UUID NOT NULL REFERENCES predictions(id) ON DELETE CASCADE,
  step_number    INTEGER NOT NULL,
  timestamp      TIMESTAMP NOT NULL,
  open           NUMERIC(20, 8) NOT NULL,
  high           NUMERIC(20, 8) NOT NULL,
  low            NUMERIC(20, 8) NOT NULL,
  close          NUMERIC(20, 8) NOT NULL,
  confidence     NUMERIC(5, 4),
  direction      VARCHAR(10),
  actual_close   NUMERIC(20, 8),
  is_accurate    BOOLEAN,
  UNIQUE(prediction_id, step_number)
);

CREATE INDEX idx_prediction_steps_prediction_id ON prediction_steps(prediction_id);
CREATE INDEX idx_prediction_steps_timestamp ON prediction_steps(timestamp);
```

---

#### `models`
ML model metadata. ONE model per timeframe (5 rows total).

```sql
CREATE TABLE models (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  timeframe         VARCHAR(10) NOT NULL CHECK (timeframe IN ('1h', '4h', '1d', '1w', '1m')),
  version           VARCHAR(50) NOT NULL,
  training_start    TIMESTAMP NOT NULL,
  training_end      TIMESTAMP NOT NULL,
  num_symbols       INTEGER NOT NULL,              -- Number trained on (500)
  top_symbols       JSONB,                         -- ["X:BTCUSD", "X:ETHUSD", ...]
  accuracy_avg      NUMERIC(5, 4),
  feature_count     INTEGER,                       -- 150+
  model_path        TEXT NOT NULL,                 -- "/models/1d_v1.0.pkl"
  is_active         BOOLEAN DEFAULT false,
  trained_at        TIMESTAMP NOT NULL,
  created_at        TIMESTAMP DEFAULT NOW(),
  UNIQUE(timeframe, version)
);

CREATE INDEX idx_models_timeframe ON models(timeframe);
CREATE INDEX idx_models_active ON models(is_active);
```

**Note:** 5 rows total. Each model trained on ALL top 500 coins combined, can predict ANY symbol.

---

### Phase II Tables (Authentication & User Features)

#### `users`
```sql
CREATE TABLE users (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email             VARCHAR(255) UNIQUE NOT NULL,
  email_verified    TIMESTAMP,
  name              VARCHAR(255),
  image             TEXT,
  password_hash     VARCHAR(255),
  tier              VARCHAR(20) DEFAULT 'free' CHECK (tier IN ('free', 'premium', 'pro')),
  created_at        TIMESTAMP DEFAULT NOW(),
  updated_at        TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_tier ON users(tier);
```

---

#### `sessions`
```sql
CREATE TABLE sessions (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id        UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  session_token  VARCHAR(255) UNIQUE NOT NULL,
  expires        TIMESTAMP NOT NULL,
  created_at     TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_sessions_user_id ON sessions(user_id);
CREATE INDEX idx_sessions_token ON sessions(session_token);
```

---

#### `watchlists`
```sql
CREATE TABLE watchlists (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name        VARCHAR(100) NOT NULL,
  is_default  BOOLEAN DEFAULT false,
  created_at  TIMESTAMP DEFAULT NOW(),
  updated_at  TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_watchlists_user_id ON watchlists(user_id);
```

---

#### `watchlist_items`
```sql
CREATE TABLE watchlist_items (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  watchlist_id  UUID NOT NULL REFERENCES watchlists(id) ON DELETE CASCADE,
  symbol_id     UUID NOT NULL REFERENCES symbols(id) ON DELETE CASCADE,
  position      INTEGER NOT NULL DEFAULT 0,
  added_at      TIMESTAMP DEFAULT NOW(),
  UNIQUE(watchlist_id, symbol_id)
);

CREATE INDEX idx_watchlist_items_watchlist_id ON watchlist_items(watchlist_id);
CREATE INDEX idx_watchlist_items_symbol_id ON watchlist_items(symbol_id);
```

---

#### `alerts`
```sql
CREATE TABLE alerts (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id          UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  symbol_id        UUID NOT NULL REFERENCES symbols(id) ON DELETE CASCADE,
  condition_type   VARCHAR(20) NOT NULL CHECK (condition_type IN ('above', 'below', 'crossing')),
  target_price     NUMERIC(20, 8) NOT NULL,
  is_active        BOOLEAN DEFAULT true,
  expires_at       TIMESTAMP,
  triggered_at     TIMESTAMP,
  notified_at      TIMESTAMP,
  created_at       TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_alerts_user_id ON alerts(user_id);
CREATE INDEX idx_alerts_symbol_id ON alerts(symbol_id);
CREATE INDEX idx_alerts_active ON alerts(is_active);
```

---

#### `trading_plans`
```sql
CREATE TABLE trading_plans (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  symbol_id     UUID NOT NULL REFERENCES symbols(id) ON DELETE CASCADE,
  title         VARCHAR(255) NOT NULL,
  entry_price   NUMERIC(20, 8),
  target_price  NUMERIC(20, 8),
  stop_loss     NUMERIC(20, 8),
  risk_reward   NUMERIC(5, 2),
  status        VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'closed', 'paused')),
  notes         TEXT,
  created_at    TIMESTAMP DEFAULT NOW(),
  updated_at    TIMESTAMP DEFAULT NOW(),
  closed_at     TIMESTAMP
);

CREATE INDEX idx_trading_plans_user_id ON trading_plans(user_id);
CREATE INDEX idx_trading_plans_symbol_id ON trading_plans(symbol_id);
```

---

### Phase III Tables (Payments)

#### `subscriptions`
```sql
CREATE TABLE subscriptions (
  id                     UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id                UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  stripe_customer_id     VARCHAR(255) UNIQUE NOT NULL,
  stripe_subscription_id VARCHAR(255) UNIQUE,
  tier                   VARCHAR(20) NOT NULL CHECK (tier IN ('free', 'premium', 'pro')),
  status                 VARCHAR(20) NOT NULL,
  current_period_start   TIMESTAMP,
  current_period_end     TIMESTAMP,
  cancel_at_period_end   BOOLEAN DEFAULT false,
  created_at             TIMESTAMP DEFAULT NOW(),
  updated_at             TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_subscriptions_user_id ON subscriptions(user_id);
```

---

#### `usage_tracking`
```sql
CREATE TABLE usage_tracking (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  date        DATE NOT NULL,
  api_calls   INTEGER DEFAULT 0,
  limit       INTEGER NOT NULL,
  created_at  TIMESTAMP DEFAULT NOW(),
  UNIQUE(user_id, date)
);

CREATE INDEX idx_usage_tracking_user_id ON usage_tracking(user_id);
CREATE INDEX idx_usage_tracking_date ON usage_tracking(date);
```

---

## Data Workflows

### Weekly Training Job (Every Sunday 2 AM UTC)

**STEP 1: Update Symbol Rankings (~1,000 API calls)**
```python
# Calculate USD volume for ALL symbols
for symbol in all_symbols:
    agg = polygon.get_aggs(symbol.ticker, 1, 'day', yesterday(), today())
    volume_tokens = agg['results'][0]['v']
    vwap_usd = agg['results'][0]['vw']
    volume_usd = volume_tokens * vwap_usd
    
    db.update('symbols', 
        where={'ticker': symbol.ticker},
        set={'volume_24h_usd': volume_usd}
    )

# Rank all symbols by USD volume
db.execute('''
    UPDATE symbols 
    SET volume_rank = (
        SELECT COUNT(*) + 1 
        FROM symbols s2 
        WHERE s2.volume_24h_usd > symbols.volume_24h_usd
    )
''')

# Get top 500 for training
top_500 = db.query('SELECT ticker FROM symbols WHERE volume_rank <= 500 ORDER BY volume_rank')
```

---

**STEP 2: Update Training Data (~2,500 API calls)**
```python
# For each of top 500 symbols × 5 timeframes = 2,500 files
for ticker in top_500:
    for timeframe in ['1h', '4h', '1d', '1w', '1m']:
        # 1. Load existing training data
        file_path = f'/data/{ticker}/{timeframe}_ohlcv.parquet'
        df_existing = pd.read_parquet(file_path)
        last_date = df_existing['timestamp'].max()
        
        # 2. Fetch NEW data only (last 7 days)
        df_new = polygon.get_aggs(ticker, timeframe, last_date + 1, today())
        
        # 3. Clean the new data
        df_new = clean_polygon_data(df_new)
        
        # 4. Append to existing
        df_combined = pd.concat([df_existing, df_new])
        
        # 5. Trim to retention period
        retention_days = {'1h': 365, '4h': 1095, '1d': 1825, '1w': 1825, '1m': 1825}
        cutoff = today() - timedelta(days=retention_days[timeframe])
        df_trimmed = df_combined[df_combined['timestamp'] >= cutoff]
        
        # 6. Calculate 150+ indicators
        df_trimmed['RSI'] = ta.RSI(df_trimmed['close'], timeperiod=14)
        df_trimmed['MACD'], _, _ = ta.MACD(df_trimmed['close'])
        df_trimmed['BB_upper'], _, df_trimmed['BB_lower'] = ta.BBANDS(df_trimmed['close'])
        # ... 147 more indicators
        
        # 7. Save updated data
        df_trimmed.to_parquet(file_path)
```

---

**STEP 3: Train Models (5 iterations - ONE per timeframe)**
```python
# For each timeframe, train ONE model on ALL top 500 coins
for timeframe in ['1h', '4h', '1d', '1w', '1m']:
    # 1. Load training data for ALL top 500 symbols
    combined_data = []
    for ticker in top_500:
        df = pd.read_parquet(f'/data/{ticker}/{timeframe}_ohlcv.parquet')
        combined_data.append(df)
    
    # 2. Combine into ONE massive dataset
    full_dataset = pd.concat(combined_data, ignore_index=True)
    print(f"Training {timeframe}: {len(full_dataset):,} samples from 500 coins")
    # Example: 500 coins × 1,825 days = 912,500 training samples
    
    # 3. Train ONE model on combined data
    model = train_model(full_dataset)  # Learns universal patterns across all coins
    
    # 4. Validate accuracy
    accuracy = validate_model(model, holdout_set)
    
    # 5. Save ONE model per timeframe
    model_path = f'/models/{timeframe}_v1.0.pkl'
    joblib.dump(model, model_path)
    
    # 6. Update PostgreSQL (ONE row per timeframe)
    db.insert('models', {
        'timeframe': timeframe,
        'version': 'v1.0',
        'training_start': full_dataset['timestamp'].min(),
        'training_end': full_dataset['timestamp'].max(),
        'num_symbols': 500,
        'top_symbols': json.dumps(top_500),
        'accuracy_avg': accuracy,
        'feature_count': 150,
        'model_path': model_path,
        'is_active': True,
        'trained_at': now()
    })

print("Training complete! 5 models ready (not 2,500!)")
```

**Result:**
- 5 models (one per timeframe)
- Each trained on ALL top 500 coins
- Can predict ANY symbol
- API Calls: ~3,500/week
- Time: ~2-3 hours

---

### User Prediction Request (Real-Time)

```
1. User clicks "Predict" for ANY symbol + timeframe
   ↓
2. Frontend → POST /api/predictions/generate
   ↓
3. Backend checks PostgreSQL for cached prediction (15min)
   ↓
4. If not cached → ML Inference Service
   ↓
5. ML Service checks Redis for fresh OHLCV
   Cache key: fresh_candles:{ticker}:{timeframe}
   ↓
6. If NOT in Redis:
   → Fetch FRESH 200 candles from Polygon.io REST API
   → Clean data (timestamps, missing values, validation)
   → Cache in Redis (1 hour TTL)
   ↓
7. Calculate 150+ indicators on fresh data
   ↓
8. Load trained model for this timeframe
   → Query: SELECT model_path FROM models WHERE timeframe = ? AND is_active = true
   → Load: joblib.load('/models/1d_v1.0.pkl')
   ↓
9. Generate 30-step forecast
   → Model works on ANY symbol (learned universal patterns)
   ↓
10. Save prediction to PostgreSQL
    ↓
11. Return to frontend
    ↓
12. Display prediction table + chart overlay

CRITICAL: Uses FRESH data (max 1hr old), NOT weekly training data!
```

---

### Live Chart Updates (Continuous)

```
1. User opens chart for symbol
   ↓
2. Frontend establishes WebSocket connection
   → wss://socket.massive.com/crypto
   ↓
3. Authenticate with API key
   ↓
4. Subscribe to ticker: XT.X:BTCUSD
   ↓
5. Polygon.io streams real-time trades/prices
   → Every second
   ↓
6. Frontend updates chart canvas directly
   → No backend, no database, no file storage
   ↓
7. On page close → disconnect WebSocket

Result: Live prices with zero API calls overhead
```

---

### Symbol Auto-Update (Daily/Weekly)

```python
def sync_symbols_table():
    """
    Keep symbols table synchronized with Polygon.io catalog
    """
    # 1. Get ALL current crypto tickers from Polygon.io
    current_tickers = polygon.list_tickers(
        market='crypto',
        active=True,
        limit=10000
    )
    current_set = {t['ticker'] for t in current_tickers}
    
    # 2. Get our existing tickers
    our_tickers = db.query('SELECT ticker FROM symbols')
    our_set = {t.ticker for t in our_tickers}
    
    # 3. Add new symbols
    new_tickers = current_set - our_set
    for ticker_data in current_tickers:
        if ticker_data['ticker'] in new_tickers:
            db.insert('symbols', {
                'ticker': ticker_data['ticker'],
                'name': ticker_data['name'],
                'base_currency': ticker_data.get('base_currency_symbol'),
                'quote_currency': ticker_data.get('currency_symbol'),
                'is_active': True
            })
    
    # 4. Mark removed symbols as inactive
    removed_tickers = our_set - current_set
    if removed_tickers:
        db.update('symbols',
            where={'ticker': {'in': list(removed_tickers)}},
            set={'is_active': False}
        )
    
    print(f"Sync complete: +{len(new_tickers)} new, -{len(removed_tickers)} removed")

# Run daily or weekly
```

**Result:** Users can search/predict on ANY active Polygon.io symbol

---

### Data Cleaning Process

**Applied to ALL Polygon.io data:**

```python
def clean_polygon_data(raw_data):
    """
    Clean and standardize Polygon.io OHLCV data
    """
    df = pd.DataFrame(raw_data['results'])
    
    # 1. Rename columns
    df.rename(columns={
        't': 'timestamp',
        'o': 'open',
        'h': 'high',
        'l': 'low',
        'c': 'close',
        'v': 'volume'
    }, inplace=True)
    
    # 2. Convert Unix timestamp (ms) to datetime
    df['timestamp'] = pd.to_datetime(df['timestamp'], unit='ms', utc=True)
    
    # 3. Sort by timestamp
    df.sort_values('timestamp', inplace=True)
    
    # 4. Handle missing values (forward fill)
    df.fillna(method='ffill', inplace=True)
    
    # 5. Remove duplicates (keep latest)
    df.drop_duplicates(subset=['timestamp'], keep='last', inplace=True)
    
    # 6. Validate data
    df = df[(df['open'] > 0) & 
            (df['high'] > 0) & 
            (df['low'] > 0) & 
            (df['close'] > 0) & 
            (df['volume'] >= 0)]
    
    # 7. Reset index
    df.reset_index(drop=True, inplace=True)
    
    return df
```

**Used in:**
- Training data updates
- Fresh prediction data
- Any OHLCV from Polygon.io

---

## Critical Decisions

### 1. One Model Per Timeframe (NOT Per Symbol)

**Total Models:** 5 (1h, 4h, 1d, 1w, 1m)  
**NOT:** 2,500 (500 symbols × 5 timeframes)

**Why This Works:**
- Models learn **universal patterns** (RSI behavior, MACD signals, Bollinger breakouts)
- NOT coin-specific (Bitcoin vs Dogecoin patterns are similar at technical level)
- Same indicators apply across all cryptocurrencies
- Can predict **ANY symbol**, even ones not in training data

**Training Example:**
```python
# Load data for ALL 500 top coins
combined = []
for ticker in top_500:
    df = pd.read_parquet(f'/data/{ticker}/1d_ohlcv.parquet')
    combined.append(df)

# 500 coins × 1,825 days = 912,500 training samples
full_dataset = pd.concat(combined, ignore_index=True)

# Train ONE model
model = train_model(full_dataset)
joblib.dump(model, '/models/1d_v1.0.pkl')
```

---

### 2. USD Volume for Ranking (NOT Token Volume)

**Problem:** Token volume is misleading
- Cheap coins: Billions of tokens = huge volume numbers
- But low actual dollar value

**Solution:** USD Volume = Token Volume × VWAP

**From Polygon.io aggregate:**
```python
volume_tokens = agg['v']   # Number of tokens traded
vwap_usd = agg['vw']       # Volume-weighted average price
volume_usd = volume_tokens * vwap_usd
```

**Example:**
- Shitcoin: 1 trillion tokens × $0.0001 = $100M USD volume
- Bitcoin: 1,000 tokens × $50,000 = $50M USD volume
- Bitcoin ranks by meaningful trading activity

---

### 3. Symbols Table: ALL Polygon.io Cryptos

**NOT just top 500!**

**Purpose:**
- Store ALL available cryptocurrencies (~1000-5000)
- Enable search/prediction for any symbol
- Track rankings to determine top 500 for training

**User Experience:**
- Search: Any Polygon.io symbol
- Predictions: Any symbol (model generalizes)
- Training: Only top 500 by USD volume

**Auto-Update:**
- Daily/weekly sync with Polygon.io
- Add new symbols automatically
- Mark removed symbols as inactive

---

### 4. No OHLCV in PostgreSQL

**What We DON'T Store in PostgreSQL:**
- ❌ Historical OHLCV data (millions of rows)
- ❌ Calculated indicators (150+ columns)
- ❌ Trained model files (100 MB each)

**Why:**
- PostgreSQL optimized for relational data, not time-series
- Would cost too much and be slow
- File storage is perfect for this

**What We DO Store:**
- ✅ Symbol metadata (ticker, name, volume, rank)
- ✅ Prediction results (cached forecasts)
- ✅ Model metadata (version, path, accuracy)

---

### 5. Two Separate OHLCV Sources

**File Storage (Training):**
- Updated: Weekly (every Sunday)
- Freshness: Can be up to 7 days old
- Purpose: Train models
- Why old data is OK: Models learn patterns, not real-time conditions

**Redis Cache (Predictions):**
- Updated: On-demand (when prediction requested)
- Freshness: Max 1 hour old
- Purpose: Generate predictions
- Why fresh data required: Predictions need current market conditions

**Critical:** Stale data for predictions = inaccurate forecasts!

---

### 6. Predictions for ANY Symbol

**User can get predictions for:**
- Top 500 coins (high confidence - familiar to model)
- Outside top 500 (lower confidence - still works)
- Even brand new coins (model generalizes)

**How it works:**
```python
# User requests prediction for obscure coin #1,234
# Not in top 500 training data

# 1. Fetch fresh OHLCV for this coin
df = fetch_fresh_ohlcv("X:OBSCURECOIN", "1d", 200)

# 2. Calculate indicators (same as training)
df = calculate_indicators(df)

# 3. Load 1d model (trained on top 500)
model = load_model('1d')

# 4. Predict
forecast = model.predict(df)

# Works! Model learned universal patterns
```

---

### 7. Incremental Updates (NOT Full Refresh)

**Weekly training:**
- Fetch: Last 7 days only
- Append: To existing dataset
- Trim: Remove data older than retention period
- Result: Always 1yr/3yr/5yr rolling window

**NOT full refresh:**
- Would require ~45 million API calls
- Would take forever
- Would cost too much
- Completely unnecessary

---

## Error Handling

### Phase I Error States

**Polygon.io API Down:**
- Display: Error icon with message "Unable to connect to market data"
- Action: Retry button
- Fallback: Show cached data if available

**Symbol Has No Data:**
- Behavior: Filter out from search results (don't display)
- Reason: Prevents confusion if Polygon.io doesn't have data for symbol

**Prediction Generation Fails:**
- Display: Error message "Unable to generate prediction. Please try again."
- Action: "Retry" button
- Log: Error details for debugging
- Fallback: Show last successful prediction if available

**WebSocket Connection Lost:**
- Display: Warning banner "Live data disconnected. Reconnecting..."
- Action: Auto-reconnect with exponential backoff
- Max retries: 5 attempts

**Loading States:**
- Chart loading: Skeleton chart with shimmer animation
- Prediction loading: Spinner with "Generating prediction..." text
- Search loading: Skeleton list items
- Duration: Show after 300ms delay (avoid flash for fast responses)

**General API Errors:**
- 429 Rate Limit: "Too many requests. Please wait a moment."
- 500 Server Error: "Server error. Please try again."
- Network Error: "Connection lost. Check your internet."
- Timeout: "Request timed out. Please try again."

---

## Security & Deployment

### Authentication Flow (Phase II+)

```
1. User signs in
2. Backend validates credentials
3. Generate session token
4. Store in PostgreSQL sessions table
5. Return httpOnly cookie
6. Validate on every API request
```

### CI/CD Pipeline

```
1. Push to GitHub
2. GitHub Actions runs tests
3. Vercel auto-deploys (frontend)
4. Railway auto-deploys (backend/workers)
5. Smoke tests
6. Monitor errors (rollback if >5%)
```

### Scalability

**MVP (Phase I):**
- Single Railway backend
- Single PostgreSQL instance
- Single Redis instance
- Expected load: <100 concurrent users

**Post-Launch:**
- Horizontal scaling (load balancer)
- Read replicas for analytics
- Redis cluster
- CDN for static assets

---

### Monitoring

**Track:**
- API latency (p50, p95, p99)
- Prediction generation time
- Error rates
- Cache hit rates
- Training job success/failures

**Tools:**
- Sentry (Phase IV)
- Railway logs
- Vercel Analytics

---

## Technology Decisions

| Component | Technology | Why |
|-----------|-----------|-----|
| Frontend | Next.js + Vercel | Best DX, auto-scaling, edge optimization |
| Backend | Railway | Unified platform for API + workers + DB |
| Database | PostgreSQL | Relational data, Railway native |
| Database ORM | Drizzle ORM | Type-safe, lightweight, SQL-like syntax |
| File Storage | Railway Volumes | Perfect for time-series training data |
| Cache | Redis | Industry standard, fast, Railway native |
| ML (MVP) | XGBoost | Fast training, CPU-friendly, explainable |
| ML (Post-MVP) | Hybrid Ensemble | LSTM + XGBoost + RF for best accuracy |
| Charts | TradingView lightweight-charts | Apache 2.0, free, professional |
| Indicators | pandas-ta + ta-lib | Comprehensive indicator libraries |
| Data Source | Polygon.io | 3000 calls/min, WebSocket support |

---

## Cost & Performance

### Storage
- PostgreSQL: ~100 MB ($0)
- File Storage: ~4.5 GB ($1-2/mo)
- Redis: ~65 MB ($0)
- **Total: ~$1-2/mo**

### API Usage
- Weekly training: ~3,500 calls
- Daily predictions: ~500 calls
- **Monthly: ~29,000 calls**
- With 3000/min limit: No issues

### Performance
- Prediction: <3s
- API latency: <2s
- First paint: <3s
- Cache hit rate: >80%

---

## ML Training Details

### XGBoost Implementation (Phase I MVP)

**Model Configuration:**
```python
import xgboost as xgb

model = xgb.XGBRegressor(
    n_estimators=200,           # 200 trees
    max_depth=10,               # Maximum tree depth
    learning_rate=0.1,          # Learning rate
    objective='reg:squarederror',  # Regression task
    subsample=0.8,              # Row sampling
    colsample_bytree=0.8,       # Feature sampling
    n_jobs=-1                   # Use all CPU cores
)
```

**Feature Engineering:**
```python
# For each candle, create features:
features = [
    # Current OHLCV
    'open', 'high', 'low', 'close', 'volume',
    
    # 150+ Technical Indicators
    'RSI_14', 'RSI_7', 'RSI_21',
    'MACD', 'MACD_signal', 'MACD_hist',
    'BB_upper', 'BB_middle', 'BB_lower',
    'ATR_14', 'Stochastic_K', 'Stochastic_D',
    # ... 140+ more from pandas-ta + ta-lib
    
    # Lagged values (last 5 candles)
    'close_lag_1', 'close_lag_2', 'close_lag_3', 'close_lag_4', 'close_lag_5',
    'volume_lag_1', 'volume_lag_2', 'volume_lag_3', 'volume_lag_4', 'volume_lag_5',
    
    # Price changes
    'price_change_1d', 'price_change_7d', 'price_change_30d',
    
    # Volume ratios
    'volume_sma_ratio', 'volume_ema_ratio'
]

# Target: Next candle close price
target = 'close_next'
```

**Iterative Multi-Step Forecasting:**
```python
def predict_30_steps(model, initial_features):
    """
    Generate 30-step forecast iteratively
    """
    forecast = []
    current = initial_features.copy()
    
    for step in range(1, 31):
        # 1. Predict next close
        next_close = model.predict([current])[0]
        
        # 2. Estimate OHLC (simple heuristic for MVP)
        volatility = current['ATR_14']
        next_open = current['close']
        next_high = next_close + (volatility * 0.5)
        next_low = next_close - (volatility * 0.5)
        
        # 3. Calculate confidence (time-decay)
        confidence = 0.85 - ((step - 1) * 0.25 / 30)
        confidence = max(0.60, confidence)  # Floor at 60%
        
        # 4. Determine direction
        direction = 'up' if next_close > current['close'] else 'down'
        
        # 5. Store forecast step
        forecast.append({
            'step': step,
            'timestamp': calculate_timestamp(step),
            'open': next_open,
            'high': next_high,
            'low': next_low,
            'close': next_close,
            'confidence': round(confidence, 2),
            'direction': direction
        })
        
        # 6. Update features for next iteration
        current = update_features(current, {
            'close': next_close,
            'open': next_open,
            'high': next_high,
            'low': next_low
        })
    
    return forecast
```

**Confidence Scoring (Steps 1-5):**
- Step 1-10: 85% → 77% (high confidence, near-term)
- Step 11-20: 77% → 68% (medium confidence, mid-term)
- Step 21-30: 68% → 60% (lower confidence, far-term)

**Step 6 Upgrades (Before Phase I Completion):**
- Upgrade to hybrid ensemble (LSTM + XGBoost + RF weighted average)
- Direct multi-output forecasting (all 30 steps at once)
- Advanced confidence (model uncertainty, prediction intervals)
- A/B test and deploy if accuracy improves

---

### Drizzle ORM Explanation

**What is Drizzle ORM?**
- TypeScript ORM for PostgreSQL
- Type-safe database queries
- SQL-like syntax (easier than Prisma)
- Lightweight (minimal bundle size)
- Auto-generates TypeScript types from schema

**Example Usage:**
```typescript
// Define schema
import { pgTable, uuid, varchar, timestamp } from 'drizzle-orm/pg-core';

export const symbols = pgTable('symbols', {
  id: uuid('id').primaryKey().defaultRandom(),
  ticker: varchar('ticker', { length: 20 }).unique().notNull(),
  name: varchar('name', { length: 255 }).notNull(),
  volumeRank: integer('volume_rank'),
  createdAt: timestamp('created_at').defaultNow()
});

// Type-safe queries
import { eq } from 'drizzle-orm';

const symbol = await db
  .select()
  .from(symbols)
  .where(eq(symbols.ticker, 'X:BTCUSD'))
  .limit(1);

// symbol is fully typed! TypeScript knows all fields
```

**Why Drizzle over Prisma:**
- ✅ Lighter weight
- ✅ SQL-like (easier to learn)
- ✅ Faster performance
- ✅ More control over queries

---

**See:** [1_REFERENCE_INDEX.md](./1_REFERENCE_INDEX.md) for master index  
**See:** [1_PROGRESS.md](./1_PROGRESS.md) for journey log  
**See:** [docs/SETUP.md](./docs/SETUP.md) for environment setup  
**See:** [1_SETUP_CHECKLIST.md](./1_SETUP_CHECKLIST.md) for manual setup steps  
**See:** [1_PHASES.md](./1_PHASES.md) for Phase I tasks  
**See:** [CREDENTIALS.md](./CREDENTIALS.md) for all API keys and secrets
