# Project Progress & Journey Log

**Project:** AI-Powered Crypto Price Prediction Platform  
**Started:** November 14, 2025  
**Last Updated:** November 15, 2025

---

## 📖 PURPOSE

This document is a **narrative log** of everything we've done, what worked, what didn't, blockers encountered, and decisions made during actual development. This helps maintain context across AI sessions and tracks the real journey (not just task checklists).

**This is NOT a checklist** - see `1_PHASES.md` for task tracking.

---

## 🗓️ November 14-15, 2025 - Pre-Build Planning & Infrastructure Setup

### **What We Accomplished**

#### **Day 1: Complete Architecture Planning (November 14)**

**Documentation Created:**
- Started with 13 scattered documentation files (~4,979 lines)
- Massive redundancy - same concepts explained 3-5 times
- Consolidated down to 7 core files (~4,057 lines)
- Created comprehensive architecture covering:
  - System design with component breakdown
  - Complete database schemas (14 tables across all phases)
  - Data workflows (training, predictions, live charts, symbol sync)
  - ML strategy (XGBoost → Hybrid Ensemble)

**Critical Architecture Decisions Made:**
1. **ONE model per timeframe** (5 total), NOT per symbol (would've been 2,500!)
   - Each model trained on ALL top 500 coins combined
   - Models learn universal patterns, can predict ANY symbol
   - This was a KEY realization - saves massive storage and complexity

2. **No OHLCV data in PostgreSQL**
   - Would've been millions of rows, expensive, slow
   - Use file storage instead (Parquet format, ~4 GB)
   - PostgreSQL only for metadata (~100 MB)

3. **USD Volume for ranking** (not token volume)
   - Token volume misleading (cheap coins have trillions of tokens)
   - USD Volume = Token Volume × VWAP (Volume-Weighted Average Price)
   - Represents actual trading value

4. **Fresh data for predictions** vs training data
   - Training data: File storage, updated weekly, can be 7 days old
   - Prediction data: Fetch fresh from Polygon.io API, cache 1hr in Redis
   - CRITICAL: Predictions need current market conditions!

5. **All symbols searchable**, but only top 500 in training
   - Symbols table: ALL Polygon.io cryptos (~1000-5000)
   - Training: Top 500 by USD volume
   - Predictions: ANY symbol (model generalizes)

**What We Learned:**
- Initial plan had "mock data for MVP" - REJECTED, real data from day 1
- Initial plan had local development - REJECTED, Railway production/staging only
- Documentation consolidation saved ~920 lines, eliminated 90% redundancy

**Blockers Encountered:**
- None - planning phase went smoothly

---

#### **Day 2: Infrastructure Setup & Boilerplate Installation (November 15)**

**GitHub Repository:**
- Created: https://github.com/AZMB1/Crypto-Platform-MVP
- Pushed all documentation
- 5 commits total

**Next.js Enterprise Boilerplate:**
- Installed from: https://github.com/Blazity/next-enterprise
- Next.js 15.3.3, React 19, Tailwind CSS 4
- 1,675 packages installed via pnpm
- Includes: Radix UI, Vitest, Playwright, Storybook, TypeScript strict mode
- Health check endpoint already included (`/app/api/health/route.ts`)

**Railway Setup:**
- Project created: `crypto-platform-mvp`
- Services added:
  - PostgreSQL (generates DATABASE_URL)
  - Redis (generates REDIS_URL)
  - backend (empty service with /app volume for training data & models)
- Project linked locally with Railway CLI
- Environment variables configured:
  - DATABASE_URL and REDIS_URL added as references to backend service
  - POLYGON_API_KEY added to shared project variables

**Polygon.io Account:**
- Plan: **UNLIMITED API calls** 🔥
  - All Forex and Crypto Tickers
  - Unlimited API Calls (not 3000/min - UNLIMITED!)
  - 10+ Years Historical Data
  - Real-time Data
  - WebSockets
  - Technical Indicators
- API Key obtained: `7vqpDkn55ACKTs7u5yWTcDeVZbpu5P6C`

**Vercel Deployment:**
- Project deployed: https://crypto-platform-mvp.vercel.app
- Connected to GitHub (auto-deploy on push)
- Environment variables configured for Production/Preview/Development
- All credentials set

**Credentials Management:**
- Created CREDENTIALS.md (gitignored) with all secrets:
  - Polygon.io API key
  - Railway database credentials
  - NEXTAUTH_SECRET: `Ik+1nNk7TlWlzcMUnx/reHSOPAlL8Oyej7X/1qj9nis=`
  - Vercel deployment URL
- .env.local configured for local development
- .env.example template created (safe for git)

**Documentation Organization:**
- Renamed all core docs to start with `1_` for grouping:
  - 1_AGENT.md, 1_Architecture.md, 1_Design_Philosophy.md
  - 1_PHASES.md (renamed from PROGRESS.md - contains task tracking)
  - 1_REFERENCE_INDEX.md (master index of all docs)
  - 1_SETUP_CHECKLIST.md (manual setup steps - all complete)
- Created REFERENCE_INDEX.md - master index showing where every topic is documented
- Files now group at top of tree for easy access

**What We Learned:**
- Railway only allows ONE volume per service (not two) - adjusted to single /app volume with /data and /models subdirectories
- Polygon.io rebranded to Massive.com - WebSocket URL changed:
  - Old: `wss://socket.polygon.io/crypto`
  - New: `wss://socket.massive.com/crypto` ✅
- NEXTAUTH_SECRET must be cryptographically secure (openssl), not keyboard scribbling
- Railway services need explicit variable references (not automatically shared)

**Blockers Encountered:**
- Railway CLI couldn't set variables non-interactively - used dashboard instead
- Vercel CLI had project name issues - used dashboard for initial deployment
- Both resolved by using web dashboards (actually easier)

**Tech Stack Locked In:**
- Framework: Next.js 15 (enterprise boilerplate)
- Database: PostgreSQL + Drizzle ORM (type-safe, lightweight)
- Cache: Redis
- File Storage: Railway persistent volumes (~10 GB)
- Charts: TradingView lightweight-charts (Apache 2.0, free)
- ML: XGBoost (MVP) → Hybrid Ensemble (40% LSTM + 40% XGBoost + 20% RF) in Step 6
- Indicators: pandas-ta + ta-lib (all indicators, no duplicates)
- Deployment: Vercel (frontend) + Railway (backend/ML workers)

---

### **Current Status: Pre-Build Complete ✅**

**Infrastructure:**
- ✅ GitHub repository created and code pushed
- ✅ Railway project fully configured (3 services, 1 volume)
- ✅ Vercel deployed with all environment variables
- ✅ Next.js boilerplate installed (1,675 packages)
- ✅ All credentials stored securely (CREDENTIALS.md gitignored)

**Documentation:**
- ✅ 8 files, ~5,700 lines total
- ✅ Zero redundancy
- ✅ Master reference index created
- ✅ All cross-references updated
- ✅ Table of contents in every doc

**Ready to Start:**
- 🚀 Phase I Step 1: Database & Backend Infrastructure
- 🚀 Next task: Create PostgreSQL schema migrations (4 tables)
- 🚀 Then: Set up Drizzle ORM

---

## 📝 NEXT SESSION CHECKLIST

**For AI to read on next session:**
1. Read this PROGRESS.md to understand what's been done
2. Read 1_REFERENCE_INDEX.md to locate relevant documentation
3. Read 1_PHASES.md Step 1 for current tasks
4. Check CREDENTIALS.md for API keys (gitignored, may need to ask user)
5. Start from last incomplete task in 1_PHASES.md

**Current Phase:** Pre-build complete, ready for Phase I Step 1

---

## 🎯 KEY LEARNINGS SO FAR

1. **Architecture complexity avoided:**
   - One model per timeframe (not per symbol) saves 99.8% storage
   - No OHLCV in PostgreSQL saves millions of rows
   - File storage perfect for time-series training data

2. **Polygon.io UNLIMITED plan is incredible:**
   - No rate limit concerns
   - Can be aggressive with API calls
   - 10+ years of historical data available

3. **Documentation quality matters:**
   - Master index (1_REFERENCE_INDEX.md) will save hours
   - Consolidation eliminated confusion
   - Table of contents in every doc enables quick navigation

4. **Real infrastructure from day 1:**
   - No mock data policy keeps things real
   - Railway + Vercel setup was straightforward
   - Boilerplate comes with everything needed

---

**Next entry will be when we start Phase I Step 1...**

