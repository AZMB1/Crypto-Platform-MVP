# Master Reference Index

**Purpose:** Complete index of all project documentation. Consult this FIRST before starting any task to identify relevant context.  
**Last Updated:** November 15, 2025

---

## 🔍 HOW TO USE THIS DOCUMENT

**Before Starting ANY Task:**
1. Read task description
2. Scan this index to identify relevant sections
3. Read those sections from the actual documents
4. Then perform the task with complete context

**Before Fixing/Updating:**
1. Identify what's being changed (e.g., "database schema", "ML training")
2. Use this index to find ALL documents that discuss that topic
3. Update ALL relevant sections to keep docs synchronized

---

## 📚 DOCUMENT INDEX

### AGENT.md (198 lines)
**Purpose:** AI agent initialization context, core principles, quick reference

**Project Context**
- Multi-phase cryptocurrency price prediction platform
- 5 timeframes: 1h, 4h, 1d, 1w, 1m
- AI-powered forecasts for all Polygon.io cryptocurrencies
- Current Phase: Phase I MVP (single-page dashboard, no auth)

**Tech Stack Summary**
- Frontend: Next.js (next-enterprise boilerplate), Vercel
- Backend: Railway (PostgreSQL, Redis, File Storage)
- External Services: Polygon.io (REST + WebSocket)
- ML: Python workers (XGBoost → Hybrid Ensemble)
- Charts: TradingView lightweight-charts

**Core Principles**
- Fix root causes (never create workarounds)
- Check dependencies before making changes
- Use placeholders for secrets
- Typography-forward design
- Task-driven development
- NO MOCK DATA EVER
- NO LOCAL DEVELOPMENT (Railway only)

**Performance Targets**
- Prediction Accuracy: 60-70% within tolerance depending on timeframe
- Direction Accuracy: ≥75%
- Prediction Delivery: <3s
- API Latency: <2s (p95)
- Cache Hit Rate: >80%
- Business (Month 12-18): 10k users, 15% conversion, $50k MRR

**Phase I MVP Requirements**
- Coin selector with typeahead (full Polygon.io library)
- Live interactive chart (pan/zoom, drawing tools, indicator overlays)
- Prediction console (date picker + timeframe selector)
- Output table (30 steps: OHLC, confidence, direction)
- Indicator driver explanations
- NO authentication or multi-page navigation

**Data Flow Summary**
- Training (Weekly): Update rankings → fetch 7 days new data → train 5 models on top 500 coins → save models
- Prediction (Real-time): Fetch FRESH 200 candles → calculate indicators → load model → generate 30-step forecast
- Live Charts: WebSocket direct to browser (no backend/database)
- Key: ONE model per timeframe trained on ALL top 500 coins, can predict ANY symbol

**File Structure Expectations**
- /src/app, /src/components, /src/lib, /src/types, /src/hooks
- /ml (Python ML code)
- Documentation in root

**Command Reference**
- Development: npm run dev, npm run build
- Deployment: vercel, vercel --prod
- Database: railway login, railway link, railway run

---

### Architecture.md (1,307 lines)
**Purpose:** Complete system architecture, database schemas, data workflows, ML implementation details

**Quick Reference**
- ONE model per timeframe (5 total, not 2,500)
- No OHLCV in PostgreSQL (file storage instead)
- USD volume ranking (tokens × VWAP)
- Symbols table: ALL Polygon.io cryptos (~1000-5000)
- Fresh data for predictions (max 1hr old)

**Architecture Diagram**
- Visual: User → Frontend (Vercel) → Backend (Railway) → PostgreSQL/Redis/File Storage
- Shows data flows and component relationships

**Component Breakdown**
1. **Frontend Layer (Vercel)**
   - Next.js 15 App Router
   - Server + Client components
   - TradingView charts
   - WebSocket for live data
   - Auto-deploy from GitHub

2. **Backend API (Next.js API Routes)**
   - Endpoints: /api/predictions/generate, /api/symbols/search, /api/health
   - Proxy Polygon.io with caching
   - Trigger ML inference
   - Future: Auth, webhooks, tier enforcement

3. **Database (PostgreSQL on Railway)**
   - 4 Phase I tables: symbols, predictions, prediction_steps, models
   - ~100 MB (relational data only)
   - Drizzle ORM for type-safe queries
   - Does NOT store: OHLCV data, indicators, model files

4. **File Storage (Railway Persistent Volumes)**
   - /data/{symbol}/{timeframe}_ohlcv.parquet (~4 GB training data)
   - /models/{timeframe}_v{version}.pkl (~500 MB, 5 models)
   - Retention: 1yr (1h), 3yr (4h), 5yr (1d/1w/1m)
   - Parquet format: compressed, columnar, fast

5. **Cache (Redis on Railway)**
   - fresh_candles:{ticker}:{timeframe} (1hr TTL)
   - prediction:{symbol_id}:{timeframe} (15min TTL)
   - symbol:metadata:{ticker} (24hr TTL)
   - ~65 MB temporary cache

6. **ML Training Pipeline (Railway Python Worker)**
   - XGBoost for Steps 1-5 (MVP)
   - Hybrid Ensemble for Step 6 (40% LSTM + 40% XGBoost + 20% RF)
   - Runs every Sunday 2 AM UTC
   - Updates rankings, training data, trains 5 models

7. **ML Inference Service**
   - Fetches FRESH data from Polygon.io
   - Calculates indicators on-the-fly
   - Loads trained model
   - Returns 30-step forecast with confidence

8. **External Services**
   - Polygon.io: 3000 calls/min, REST + WebSocket
   - Stripe (Phase III): Payments
   - Resend (Phase II): Email

**Database Schema (Complete SQL)**
- **Phase I Tables:**
  - symbols: ALL Polygon.io symbols with volume_24h_usd, volume_rank
  - predictions: Cached predictions for ANY symbol, references model_id
  - prediction_steps: 30 forecast candles per prediction
  - models: 5 rows (one per timeframe), includes top_symbols JSONB

- **Phase II Tables:**
  - users: email, password_hash, tier
  - sessions: session tokens
  - watchlists, watchlist_items: User watchlists
  - alerts: Price alerts
  - trading_plans: User trading plans

- **Phase III Tables:**
  - subscriptions: Stripe integration
  - usage_tracking: API quotas

**Data Workflows**
1. **Weekly Training Job (Every Sunday 2 AM)**
   - Step 1: Update symbol rankings (calculate USD volume for ALL symbols, rank, get top 500)
   - Step 2: Update training data (fetch 7 days new data for top 500 × 5 timeframes, clean, append, trim)
   - Step 3: Train 5 models (load all 500 coins data per timeframe, combine, train ONE model, save)
   - Result: 5 models, ~3,500 API calls/week, ~2-4 hours

2. **User Prediction Request**
   - Check Redis for fresh OHLCV (200 candles)
   - If not cached: Fetch from Polygon.io, clean, cache 1hr
   - Calculate indicators on fresh data
   - Load trained model for timeframe
   - Generate 30-step iterative forecast
   - Save to PostgreSQL, return to user
   - CRITICAL: Uses FRESH data, not weekly training data

3. **Live Chart Updates**
   - WebSocket connection to Polygon.io
   - Subscribe to ticker
   - Stream real-time prices directly to chart
   - No backend, no database, no file storage

4. **Symbol Auto-Update (Daily/Weekly)**
   - Fetch ALL current tickers from Polygon.io
   - Add new symbols to database
   - Mark removed symbols as inactive
   - Users can search/predict ANY active symbol

**Data Cleaning Process**
- Always applied to Polygon.io data
- Steps: Rename columns, convert timestamps, sort, fill missing, remove duplicates, validate, reset index
- Used in: Training updates, predictions, any OHLCV fetch

**Critical Decisions Explained**
1. One model per timeframe (learns universal patterns, can predict ANY symbol)
2. USD volume ranking (tokens × VWAP, not raw token volume)
3. Symbols table has ALL Polygon.io cryptos (not just top 500)
4. No OHLCV in PostgreSQL (file storage better for time-series)
5. Two separate OHLCV sources (file for training, fresh API for predictions)
6. Predictions for ANY symbol (model generalizes)
7. Incremental updates (append 7 days, not full refresh)

**Security & Deployment**
- Authentication flow (Phase II+)
- CI/CD pipeline (GitHub → Vercel + Railway)
- Scalability strategy (MVP vs post-launch)
- Monitoring metrics and tools

**Technology Decisions Table**
- Complete tech stack with rationale
- Database ORM: Drizzle (type-safe, lightweight)
- ML: XGBoost → Hybrid Ensemble
- Charts: TradingView lightweight-charts (Apache 2.0)
- Indicators: pandas-ta + ta-lib

**ML Training Details**
- XGBoost configuration (n_estimators=200, max_depth=10, learning_rate=0.1)
- Feature engineering (OHLCV + 150 indicators + lagged values)
- Iterative multi-step forecasting (predict → append → predict next)
- Confidence scoring (time-decay: 85% → 60% over 30 steps)
- Step 6 upgrades: Hybrid ensemble, direct multi-output, advanced confidence

**Drizzle ORM Guide**
- What it is: Type-safe PostgreSQL ORM
- Why: Lightweight, SQL-like syntax, auto-generates types
- Example usage with code
- Comparison to Prisma

**Cost & Performance Analysis**
- Storage: ~4.6 GB total, ~$1-2/mo
- API usage: ~29,000 calls/month (well under 3000/min limit)
- Performance targets

---

### Design_Philosophy.md (380 lines)
**Purpose:** Typography-forward UI/UX guidelines for consistent premium interface

**Core Design Principle**
- Typography-forward: Text is the primary interface element
- Every font choice drives hierarchy, clarity, emotional resonance
- UI components serve the type

**Typography System**
- **Font Families:**
  - Primary: Inter (body, interface, labels)
  - Display: Inter Display (headlines, large numbers)
  - Monospace: JetBrains Mono (prices, timestamps, data)

- **Type Scale:**
  - Display XL: 72px (hero headlines)
  - Display L: 56px (major headers)
  - Display M: 48px (page titles)
  - Heading 1-4: 40px, 32px, 24px, 20px
  - Body L/M/S: 18px, 16px, 14px
  - Label: 12px
  - Tiny: 10px

- **Line Heights:** Headings 1.2, Body 1.6, Data 1.4
- **Letter Spacing:** Headings -0.02em, Body 0, Uppercase labels 0.05em

- **Font Weights:**
  - Regular (400): Body text default
  - Medium (500): Nav items, labels
  - Semibold (600): Buttons, emphasis
  - Bold (700): Headings, CTAs

**Color System**
- **Philosophy:** Minimal color, high contrast, neutral foundation

- **Neutrals (Grayscale):**
  - Gray 950-900: Dark mode text/background
  - Gray 700-600: Dark mode borders/muted text
  - Gray 500-400: Placeholder/disabled
  - Gray 300-100: Light mode borders/cards/background
  - White: Light mode text

- **Accent:**
  - Blue 600: Primary actions, links
  - Blue 500: Hover states
  - Blue 700: Active states

- **Semantic:**
  - Green 600: Bullish, success, up
  - Red 600: Bearish, error, down
  - Yellow 600: Warning, neutral

**Layout Principles**
- **Spacing System:** 8px grid (0px, 4px, 8px, 12px, 16px, 20px, 24px, 32px, 40px, 48px, 64px, 80px, 96px, 128px)
- **Application:** Inline (4px multiples), Components (8px), Sections (16px)

- **Responsive Breakpoints:**
  - xs: 0px (mobile)
  - sm: 640px (tablet portrait)
  - md: 768px (tablet landscape)
  - lg: 1024px (desktop)
  - xl: 1280px (large desktop)
  - 2xl: 1536px (extra-large)
  - Strategy: Desktop-first, mobile-friendly

**Component Design Patterns**
- **Buttons:**
  - Primary: Blue 600 bg, white text, semibold, 12px 24px padding, 8px radius, scale 1.02 on hover
  - Secondary: Border, transparent bg, hover gray
  - Ghost: No border/bg, blue text, underline on hover

- **Cards & Panels:**
  - Background: Gray 50/Gray 800
  - Border: 1px Gray 300/700
  - Radius: 12px, Padding: 24px
  - Shadow: Subtle
  - Glass effect for featured sections

- **Data Presentation:**
  - Prices/Numbers: JetBrains Mono, 18-20px, semibold, right-aligned
  - Color: Green (up), Red (down), Gray (neutral)
  - Tables: Uppercase headers (12px, semibold), 12px row padding, subtle borders

- **Forms & Inputs:**
  - Border: 1px Gray 300/700, Radius: 8px, Padding: 10px 12px
  - Font: Body M (16px), Regular
  - Focus: Blue 600 border
  - Labels: Body S (14px), Medium, Gray 700/300
  - Error: Red 600 border and text

- **Charts:**
  - Clean axis labels (Body S, Gray 600)
  - Gridlines: 1px Gray 300/700, 0.3 opacity
  - Candlesticks: Green (bullish), Red (bearish)
  - Volume: Gray 400, lower opacity
  - Indicators: Blue 600, Yellow 600 (secondary)

**Animation & Transitions**
- Philosophy: Subtle, purposeful, never distract from data
- Durations: 150ms (fast), 300ms (standard), 500ms (slow)
- Easing: ease-in-out (most), ease-out (entrances)
- Common animations: Button hover (scale 1.02, 150ms), Card hover (shadow, 200ms), Modal (fade + scale, 300ms)
- Avoid: Excessive bounce, long durations, janky scrolling

**Iconography**
- Style: Line icons, 1.5px stroke
- Sizes: 16px (small), 20px (medium), 24px (large)
- Library: Lucide, Heroicons, or custom SVGs
- Always pair with text labels

**Dark Mode**
- Default mode: Dark (traders prefer dark)
- Implementation: CSS variables, toggle in settings, localStorage persistence
- Adjustments: Gray 900 instead of pure black, lower shadow opacity, 85% text opacity

**Accessibility**
- WCAG 2.1 Level AA minimum (AAA preferred)
- Keyboard navigation for all interactive elements
- Focus indicators (2px Blue 600 outline)
- Aria labels for screen readers
- Color contrast 7:1
- Support 200% zoom

**Design Checklist**
- Typography hierarchy clear (3+ levels)
- Font sizes follow scale exactly
- Line heights appropriate
- Spacing follows 8px grid
- Color contrast meets WCAG AAA
- Interactive elements have states
- Animations subtle (<300ms)
- Mobile breakpoints tested
- Dark mode implemented
- Keyboard navigation works
- Screen reader labels present

**When to read:** Before building ANY UI component, styling anything, making design decisions

---

### Architecture.md (1,307 lines)
**Purpose:** Complete system architecture, database schemas, workflows, ML implementation

**Quick Reference - Critical Decisions**
- ONE model per timeframe (5 total, not per symbol)
- No OHLCV in PostgreSQL (file storage instead)
- USD volume ranking (tokens × VWAP)
- Symbols table: ALL Polygon.io cryptos
- Fresh data for predictions (Polygon API → Redis)

**Architecture Diagram**
- Visual system overview
- User → Frontend → Backend → Database/Redis/File Storage
- Shows all connections and data flows

**Component Breakdown**
1. **Frontend (Vercel):** Next.js 15, server/client components, auto-deploy
2. **Backend API:** Next.js API routes, endpoints listed
3. **Database (PostgreSQL):** 4 Phase I tables, Drizzle ORM, what's stored vs not stored
4. **File Storage:** Training data structure, model files, retention periods, sizes
5. **Redis Cache:** Cache keys, TTLs, why two OHLCV sources
6. **ML Training Pipeline:** XGBoost → Hybrid, responsibilities, schedule
7. **ML Inference:** Fresh data fetching, prediction generation
8. **External Services:** Polygon.io (REST + WebSocket), Stripe, Resend

**Database Schema - Complete SQL for All Tables**
- **Phase I (4 tables):**
  - symbols: ALL cryptos, volume_24h_usd, volume_rank
  - predictions: Cached predictions, references model_id
  - prediction_steps: 30 forecast candles
  - models: 5 rows (one per timeframe), top_symbols JSONB

- **Phase II (8 tables):**
  - users, sessions (auth)
  - watchlists, watchlist_items
  - alerts
  - trading_plans

- **Phase III (2 tables):**
  - subscriptions (Stripe)
  - usage_tracking (quotas)

**Data Workflows - Complete Code Examples**
1. **Weekly Training Job:**
   - Step 1: Update rankings (calculate USD volume, rank all symbols)
   - Step 2: Update training data (500 symbols × 5 timeframes, fetch 7 days, clean, append, trim)
   - Step 3: Train 5 models (combine all 500 coins data, train ONE model per timeframe)
   - Includes complete Python code examples

2. **User Prediction Request:**
   - 12-step flow from user click to display
   - Check cache → fetch fresh data → clean → calculate indicators → load model → predict → save → return
   - Uses FRESH data (max 1hr old)

3. **Live Chart Updates:**
   - WebSocket connection
   - Subscribe to ticker
   - Stream real-time to chart
   - No backend/database

4. **Symbol Auto-Update:**
   - Sync with Polygon.io catalog
   - Add new symbols, mark removed as inactive
   - Python code example

**Data Cleaning Process**
- Complete Python function
- Applied to ALL Polygon.io data
- Steps: Rename, convert timestamps, sort, fill missing, dedupe, validate, reset index

**Critical Decisions - Why We Made Them**
1. One model per timeframe (learns universal patterns)
2. USD volume ranking (meaningful trading activity)
3. Symbols table: ALL cryptos (search any, predict any)
4. No OHLCV in PostgreSQL (cost, performance)
5. Two OHLCV sources (stale for training OK, fresh for predictions required)
6. Predictions for ANY symbol (model generalizes)
7. Incremental updates (efficient, saves API calls)

**Error Handling**
- Polygon.io down: Error icon, retry button, fallback to cache
- Symbol no data: Filter from search
- Prediction fails: "Unable to generate prediction. Please try again." + Retry button
- WebSocket lost: Warning banner, auto-reconnect (max 5 retries)
- Loading states: Skeletons/spinners after 300ms delay
- API errors: Specific messages for 429, 500, network, timeout

**Security & Deployment**
- Auth flow (Phase II+)
- CI/CD pipeline
- Scalability (MVP vs post-launch)
- Monitoring metrics and tools

**Technology Decisions**
- Complete table with rationale for each choice
- Frontend, Backend, Database, ORM, File Storage, Cache, ML, Charts, Indicators, Data Source

**Cost & Performance**
- Storage breakdown (~$1-2/mo)
- API usage (~29,000 calls/month)
- Performance metrics

**ML Training Details**
- XGBoost configuration (complete parameters)
- Feature engineering (OHLCV + indicators + lagged values + price changes)
- Iterative multi-step forecasting (complete Python function)
- Confidence scoring (time-decay formula)
- Step 6 upgrades (hybrid ensemble, direct multi-output, advanced confidence)

**Drizzle ORM Guide**
- What it is, why we chose it
- Schema definition example
- Type-safe query examples
- Comparison to Prisma

**When to read:** Architecture questions, database schema, workflows, ML implementation, system design

---

### Design_Philosophy.md (380 lines)
**Purpose:** Complete UI/UX design system

**When to read:** Building ANY UI - buttons, forms, tables, charts, layouts, colors, typography

**(See complete breakdown above for all sections)**

---

### SETUP_CHECKLIST.md (80 lines)
**Purpose:** Minimal pre-build manual setup checklist (checkboxes only)

**Account Creation**
- Railway account
- Vercel account  
- Polygon.io Developer plan

**Railway Project Setup**
- Create project, add PostgreSQL, add Redis
- Create persistent volumes (/data, /models)
- Copy connection strings

**API Keys & Credentials**
- Get Polygon.io API key
- Generate NEXTAUTH_SECRET

**Vercel Setup**
- Connect to GitHub
- Link to Railway

**Environment Variables**
- Set in Railway dashboard
- Set in Vercel dashboard (production, preview, development)

**Verification**
- Test all services are running
- Test API connections
- Verify env vars

**When to read:** Before initializing Next.js project (one-time setup)

---

### PROGRESS.md (771 lines)
**Purpose:** Task tracking, shared registry, work phases (6 steps in Phase I)

**Phase I Mission**
- Single-page MVP dashboard
- Live charts + AI predictions
- No auth
- 6 sequential steps

**Shared Conventions**
- **File Structure:** Complete /src directory layout with descriptions
- **Naming Conventions:**
  - Components: PascalCase.tsx
  - Utilities: kebab-case.ts
  - Hooks: useHookName.ts
  - Types: kebab-case.ts
  - Variables: camelCase
  - Constants: UPPER_SNAKE_CASE
  - Database: snake_case
  - API endpoints: /api/kebab-case

**Shared Registry (Update as You Build)**
- Database tables & schemas (current status, what to create)
- TypeScript type definitions (files to create, interfaces needed)
- API endpoints (URLs and purposes)
- Constants & enums (shared constants)
- Cache key patterns (Redis key formats)

**Phase I Steps (6 total)**
1. **Step 1: Database & Infrastructure**
   - Tasks: PostgreSQL migrations (4 tables), Railway volumes setup, Drizzle ORM, Redis client, caching, health endpoint
   - Deliverables: DB types, cache patterns, connection clients
   - Dependencies: None

2. **Step 2: Polygon.io Integration**
   - Tasks: REST client, data cleaning, populate symbols, auto-update job, WebSocket client, symbol search, fresh OHLCV fetch, hooks, types, API endpoints
   - Deliverables: Client functions, data structures, endpoints, cache strategies
   - Dependencies: Step 1 (Redis)

3. **Step 3: Chart Implementation**
   - Tasks: Install TradingView, chart component, candlesticks, timeframe switching, pan/zoom, drawing tools, indicator overlays, WebSocket connection, controls, hooks, types
   - Deliverables: Chart component, config interface, timeframes, indicators list
   - Dependencies: Step 2 (OHLCV structure, WebSocket hook)

4. **Step 4: Prediction Engine & ML**
   - Tasks: Indicator library (pandas-ta + ta-lib, core 30 for MVP), prediction API, fresh data fetch + cache, model loading, XGBoost training setup, initial data download, train 5 models, weekly job, model serving
   - ML Training: Python packages, XGBoost pipeline, feature engineering, iterative forecasting, time-decay confidence, initial full historical download (1yr/3yr/5yr), train from scratch (~2-4 hours)
   - Critical: NO MOCK DATA, real models, fresh data for predictions
   - Deliverables: Indicator functions, prediction format, API endpoint, forecast structure
   - Dependencies: Step 1 (DB/Redis), Step 2 (Polygon client)

5. **Step 5: UI Assembly**
   - Tasks: Tailwind config, reusable UI components (Button, Input, Select, DatePicker, Table, Card), coin selector, prediction console (date picker + timeframe selector), prediction table, indicator explanations, main dashboard, responsive layout, loading/error states, design system application
   - Deliverables: Component names/props, design tokens, layout structure
   - Dependencies: Step 2 (symbol API), Step 3 (chart), Step 4 (prediction API)

6. **Step 6: ML Enhancement (Final Step)**
   - Tasks: Implement LSTM, Random Forest, ensemble pipeline (40/40/20 weighting), advanced confidence (ensemble variance), direct multi-output forecasting, A/B testing, update training job, update serving
   - Expected improvements: +5-10% accuracy, realistic confidence, better long-term forecasts
   - Dependencies: Step 4 (XGBoost baseline)
   - Estimated time: 1-2 weeks
   - REQUIRED before Phase I completion

**Testing & Quality**
- Unit tests, indicator accuracy tests, prediction validation, performance testing, error boundaries, browser testing

**Documentation**
- Update README, document APIs, code comments, user guide

**Definition of Done - Phase I MVP**
- Functional: Search any crypto, live charts, predictions for any symbol, 30-step forecasts, indicator drivers, drawing tools
- Technical: All types, no errors, responsive, loading states, error handling, env vars, naming conventions, code comments
- Integration: All steps integrated, data flows correct, WebSocket working, caching working, hybrid ensemble deployed, accuracy targets met

**Phase II-V Overview**
- High-level summary of future phases
- Authentication, user features, payments, UI polish, launch prep

**Future Enhancements**
- Architecture: Scaling, replicas, clustering, CDN
- Features: Backtesting, custom indicators, portfolio tracking, mobile app, expand to 150+ indicators

**Progress Summary**
- Phase I: 0/85 tasks (6 steps + testing)
- Total: 0/205 tasks across all phases

**When to read:** ALWAYS before starting work (tasks, conventions, registry status, dependencies)

---

### PRE_BUILD_CHECKLIST.md (292 lines)
**Purpose:** All locked-in technical decisions for Phase I

**All Critical Decisions Locked In**
1. **Project Init:** Next.js enterprise boilerplate, TypeScript, Tailwind
2. **Chart Library:** TradingView lightweight-charts (Apache 2.0, free commercial)
3. **UI Components:** Boilerplate's library or shadcn/ui
4. **Indicators:** pandas-ta + ta-lib (all indicators, no duplicates, core 30 for MVP)
5. **Database Strategy:** PostgreSQL (4 tables), Drizzle ORM (type-safe), File Storage (4GB), Redis (cache)
6. **ML Training:**
   - Steps 1-5: XGBoost (fast, CPU, explainable)
   - Step 6: Hybrid Ensemble (40% LSTM + 40% XGBoost + 20% RF)
   - Multi-step: Iterative → Direct multi-output
   - Confidence: Time-decay → Ensemble variance
   - Complete code examples included
7. **Data & Training:** NO MOCK DATA, Railway only, real everything from day 1
8. **Error Handling:** Specific messages for each error type
9. **Development:** Railway production/staging only, NO LOCAL DEV
10. **Architecture:** All key decisions (5 models, USD volume, fresh data, etc.)
11. **Testing:** Manual for MVP, automated in Phase IV

**Phase 1-6 Overview**
- Step-by-step what to build
- Database → Polygon → Charts → ML → UI → Ensemble

**Pre-Build Setup Required**
- Manual steps before coding
- Railway, Vercel, Polygon.io setup checklist

**Definition of Done**
- Functional, technical, infrastructure requirements

**When to read:** Before making ANY technical decision, reference for locked-in choices

---

### docs/SETUP.md (555 lines)
**Purpose:** Complete setup guide for all environments

**External Services & APIs**
- **Required for Phase I:**
  1. Polygon.io: Market data, pricing ($99/mo Developer), 3000 calls/min, API key setup
  2. Railway: Infrastructure, PostgreSQL, Redis, pricing ($20-50/mo estimate), auto-generated env vars
  3. Vercel: Frontend hosting, free hobby/pro plans, auto-deploy from GitHub

- **Future Phases:**
  4. Stripe (Phase III): Payments, 2.9% + $0.30 per transaction
  5. Resend (Phase II): Email, 3000 emails/month free
  6. Sentry (Phase IV): Error monitoring, 5000 errors/month free

**Environment Variables**
- **By Category:**
  1. Database & Cache: DATABASE_URL, REDIS_URL (Railway auto-generated)
  2. Authentication: NEXTAUTH_SECRET, NEXTAUTH_URL, OAuth providers
  3. External APIs: POLYGON_API_KEY, COINGECKO_API_KEY (optional)
  4. Payments: STRIPE_PUBLIC_KEY, STRIPE_SECRET_KEY, STRIPE_WEBHOOK_SECRET
  5. Application Config: NODE_ENV, NEXT_PUBLIC_APP_URL, NEXT_PUBLIC_WS_URL
  6. ML & Data: MODEL_STORAGE_PATH, TRAINING_ENABLED, ML_INFERENCE_URL

- **By Environment:**
  - Local Development: .env.local setup
  - Staging: Vercel preview + Railway staging
  - Production: Full production config

- **Security Best Practices:** Different keys per environment, rotation, storage, prefixing

**CLI Instructions**
- **Railway CLI:**
  - Installation, authentication
  - Commands: init, link, up, variables, run
  - Non-interactive flags for CI/CD

- **Vercel CLI:**
  - Installation, authentication
  - Commands: link, deploy, env pull/add
  - Deployment workflow

**Setup Checklist**
- Phase I required steps
- Polygon.io account + API key
- Railway project setup
- Vercel setup
- Environment variables in all locations
- Verification checklist

**Troubleshooting**
- Common errors and solutions
- Missing env vars, database connection, webhook issues, rate limits

**Rate Limit Strategy**
- Per service limits and mitigation
- Polygon.io: 5 calls/min (Starter) or 3000/min (Developer)

**When to read:** Setting up services, configuring environment variables, CLI commands, troubleshooting

---

### docs/Polygon_Integration.md (417 lines)
**Purpose:** Polygon.io API integration reference

**Overview**
- Three access methods: REST API, WebSocket, MCP

**REST API**
- Purpose: On-demand historical OHLCV, symbol metadata
- Use cases: Chart loading, training backfill, symbol search
- Authentication methods (query param or header)
- Key endpoints: Historical aggregates, last trade, symbol metadata
- Rate limits: 5/min (Starter), 3000/min (Developer), unlimited (Advanced)
- Integration code examples (TypeScript with caching)

**WebSocket API**
- Purpose: Real-time streaming (trades, quotes, aggregates)
- Use cases: Live charts, alert scanning, market pulse
- Supported streams: XT (trades), XQ (quotes), XA (per-minute), XAS (per-second)
- Connection URL: wss://socket.polygon.io/crypto
- Authentication: Send API key after connection
- Subscription format
- Integration code example (React hook)
- Rate limits: 1 connection (Starter), unlimited (Developer+)

**MCP Protocol**
- Purpose: AI-native API layer for advanced querying
- Use cases: AI analysis, research, anomaly detection
- Integration example (Pydantic AI)
- When to use: Phase IV+ (not MVP)

**Integration Recommendations by Phase**
- Phase I: REST (charts, metadata, caching), WebSocket (live charts), skip MCP
- Phase II: Add background jobs, alert triggering
- Phase III-V: Add MCP for AI insights

**Rate Limit Mitigation**
- Caching layers (Redis L1, PostgreSQL L2, Polygon L3)
- Request batching
- Exponential backoff strategy
- Complete code examples

**Official Client Libraries**
- JavaScript/TypeScript: @polygon.io/client-js
- Python: polygon-api-client
- Usage examples for both

**Environment Variables**
- POLYGON_API_KEY (server-side)
- NEXT_PUBLIC_POLYGON_API_KEY (client-side WebSocket)
- Security warning about client exposure

**Cost Optimization**
- Upgrade to Developer plan
- Aggressive caching
- WebSocket instead of polling
- Batch downloads
- Monitor usage

**Summary Table**
- REST, WebSocket, MCP comparison
- Use cases, costs, rate limits, cache strategies

**When to read:** Integrating Polygon.io API, WebSocket, understanding rate limits, API examples

---

### docs/TECH_STACK.md (465 lines)
**Purpose:** Technology options reference (archived for your personal reference)

**Primary Stack**
- Next.js, GitHub, Vercel, Firebase/Supabase, Authentication options, File storage options, Stripe, Email services, Analytics, Error monitoring, CI/CD, CMS options

**Supplementary Services**
- Alternative backends, auth providers, hosting, analytics, CMS, file storage, email, real-time, payments

**Quick Start Checklist**
- Install CLIs, typical project setup commands

**Usage Philosophy**
- Start simple, scale when needed
- Don't install everything at once

**When to read:** Evaluating alternative technologies, reference for your own projects

---

### docs/CONSOLIDATION_SUMMARY.md (177 lines)
**Purpose:** Documentation consolidation record

**What We Accomplished**
- Before/after comparison (13 files → 7 files, 4,979 lines → 4,057 lines)
- Reduction percentages
- Redundancy elimination

**Files Deleted and Where They Went**
- Complete list of merged/deleted files

**Final Structure**
- Root directory (5 core docs)
- docs/ directory (3 reference docs)

**Benefits**
- Table of contents in every doc
- Architecture.md is comprehensive
- No redundancy
- Professional structure

**When to read:** Understanding documentation history, what was consolidated

---

## 🎯 WORKFLOW RULE

**For EVERY task I'm asked to do:**

1. **Consult REFERENCE_INDEX.md** (this document)
2. **Identify relevant sections** across all documents
3. **Read those sections** to gather complete context
4. **Then perform the task** with full understanding

**When fixing/updating content:**

1. **Use REFERENCE_INDEX.md** to find ALL documents mentioning the topic
2. **Update ALL relevant sections** to keep docs synchronized
3. **Verify consistency** across documents

---

## 📍 COMMON TASK → DOCUMENT MAPPING

**Task: Build Database Schema**
→ Read: Architecture.md (Database Schema section), PROGRESS.md (Step 1, Registry)

**Task: Implement Prediction API**
→ Read: Architecture.md (Data Workflows, ML Details), PROGRESS.md (Step 4), PRE_BUILD_CHECKLIST.md (ML Strategy)

**Task: Build UI Component**
→ Read: Design_Philosophy.md (entire doc), PROGRESS.md (Step 5, Conventions), Architecture.md (Frontend)

**Task: Integrate Polygon.io**
→ Read: docs/Polygon_Integration.md, Architecture.md (External Services), PROGRESS.md (Step 2)

**Task: Set Up Environment**
→ Read: docs/SETUP.md, SETUP_CHECKLIST.md, Architecture.md (Component Breakdown)

**Task: Train ML Models**
→ Read: Architecture.md (ML Training Details, Data Workflows), PROGRESS.md (Step 4 + Step 6)

**Task: Handle Errors**
→ Read: Architecture.md (Error Handling section), Design_Philosophy.md (UI patterns)

**Task: Fix Database-Related Issue**
→ Read: Architecture.md (Database Schema, Critical Decisions), PROGRESS.md (Registry, Step 1)

**Task: Update Architecture Decision**
→ Update: Architecture.md (Critical Decisions + relevant section), PROGRESS.md (relevant step), AGENT.md (if affects data flow)

---

**This document is the master index. Use it to navigate the complete knowledge base efficiently.**

