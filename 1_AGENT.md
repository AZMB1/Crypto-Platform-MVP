# AI Agent Initialization Document

**Project:** AI-Powered Price Intelligence Platform  
**Last Updated:** November 15, 2025

---

## 📑 TABLE OF CONTENTS

| Section | Lines | Topic |
|---------|-------|-------|
| [Project Context](#project-context) | 20-25 | Overview and current phase |
| [Tech Stack](#tech-stack) | 30-60 | Technologies used |
| [Core Principles](#core-principles) | 65-75 | Development principles |
| [Performance Targets](#key-performance-targets) | 80-105 | Accuracy, performance, business goals |
| [Phase I Requirements](#phase-i-mvp-requirements) | 110-125 | MVP features |
| [Data Flow](#data-flow-summary) | 130-150 | Training, predictions, live charts |
| [File Structure](#file-structure-expectations) | 155-160 | Expected directory layout |
| [Commands](#command-reference) | 165-168 | Quick command reference |

---

## Project Context

Multi-phase cryptocurrency price prediction platform providing AI-powered forecasts across 5 timeframes (1h, 4h, 1d, 1w, 1m) for all Polygon.io-listed cryptocurrencies. Weekly model training on top 500 coins using 5 years of OHLCV data + 150+ indicators calculated on-the-fly.

**Current Phase:** Phase I - Single-page MVP with live charts and prediction console (no authentication)

---

## Tech Stack

### Frontend
- **Framework:** Next.js (next-enterprise boilerplate)
- **Deployment:** Vercel
- **UI Library:** TBD (React + Tailwind expected)
- **Charts:** TBD (TradingView lightweight-charts or recharts)

### Backend & Infrastructure
- **Platform:** Railway
- **Database:** PostgreSQL (time-series optimized)
- **Cache:** Redis
- **API Routes:** Next.js API routes + Railway backend services

### External Services
- **Market Data:** Polygon.io (REST API + WebSocket)
- **Payments:** Stripe (future phases)
- **Email:** Resend (future phases)
- **Error Monitoring:** Sentry (future phases)
- **Analytics:** Vercel Analytics

### ML & Data Pipeline
- **Training:** Python-based workers on Railway
- **Inference:** Real-time indicator calculation + model serving
- **Storage:** PostgreSQL for historical data, Redis for caching

### Version Control & CI/CD
- **VCS:** GitHub
- **CI/CD:** Vercel (frontend) + GitHub Actions (backend/ML)

---

## Core Principles

1. **Fix root causes** - Never create workaround files; always fix issues in original locations [[memory:3166394]][[memory:3155016]]
2. **Check dependencies first** - Review all related files before making changes
3. **Use placeholders for secrets** - Document all API keys/tokens in APIs_and_Services_Required.md [[memory:4477524]]
4. **Typography-forward design** - Maintain design philosophy throughout [[memory:4297312]]
5. **Task-driven development** - Follow TaskMaster phases; complete prerequisites before dependents

---

## Key Performance Targets

### Prediction Accuracy
- 1h: ≥60% within ±5%
- 4h: ≥65% within ±5%
- 1d: ≥70% within ±5%
- 1w: ≥65% within ±10%
- 1m: ≥60% within ±15%
- Direction: ≥75% correctness

### Performance
- Prediction delivery: <3s
- API latency (p95): <2s
- First meaningful paint: <3s
- Cache hit rate: >80%

### Business (Month 12-18)
- Users: 10k+
- Conversion: 15%
- MRR: $50k+

### Reliability
- Uptime: 99.5%
- Error rate: <1%

---

## Phase I MVP Requirements

**Single-page dashboard featuring:**
- Coin selector with typeahead across full Polygon.io library
- Live interactive chart (pan/zoom, drawing tools, indicator overlays)
- Prediction console:
  - "Predict Until" date picker
  - Timeframe selector (1h, 4h, 1d, 1w, 1m)
  - Generate up to 30 future candles
- Output table: projected OHLC, directional bias, confidence per step
- Indicator driver explanations
- **No authentication or multi-page navigation**

---

## Data Flow Summary

1. **Training (Weekly):** 
   - Update symbol rankings (calculate USD volume = tokens × VWAP)
   - Fetch new 7 days OHLCV from Polygon for top 500 symbols
   - Append to existing data, trim to retention period (1yr/3yr/5yr)
   - Calculate 150+ indicators
   - Train ONE model per timeframe on ALL top 500 coins combined
   - Save 5 models total (can predict ANY symbol, not just training data)

2. **Prediction (Real-time):** 
   - User selects ANY coin/timeframe
   - Fetch FRESH 200 candles from Polygon API (cached 1hr)
   - Calculate indicators on-the-fly
   - Load trained model for that timeframe (ONE model for all symbols)
   - Generate 30-step forecast
   - Model works on any symbol (learns patterns, not specific coins)

3. **Live Charts:** 
   - WebSocket streams real-time prices directly to browser
   - No database or file storage involved

---

## File Structure Expectations

```
/
├── AGENT.md                              # This file
├── 1_PHASES.md                           # Phase-based task tracking
├── 1_PROGRESS.md                         # Journey log (narrative of work done)
├── 1_Architecture.md                     # System architecture + database schemas
├── Architecture.md                       # System architecture overview
├── Design_Philosophy.md                  # UI/UX design principles
├── Environment_Variables.md              # Env vars reference
├── gist of project                       # Detailed project spec
├── TECH_STACK.md                        # Technology options reference
├── src/                                 # Next.js application code
├── ml/                                  # ML training & inference code
└── README.md                            # Project setup & documentation
```

---

## Command Reference

### Development
```bash
npm run dev                    # Start Next.js dev server
npm run build                  # Build for production
npm run lint                   # Run ESLint
```

### Deployment
```bash
vercel                         # Deploy to preview
vercel --prod                  # Deploy to production
```

### Database (Railway)
```bash
railway login                  # Authenticate
railway link                   # Link to project
railway run npm run migrate    # Run migrations
```

---

## Critical Reminders

- **Read all dependencies before editing** - Prevents conflicts and ensures comprehensive fixes
- **Never skip root cause fixes** - Temporary solutions create technical debt
- **Document all external dependencies** - Track API keys, rate limits, pricing in APIs_and_Services_Required.md
- **Maintain design consistency** - Reference Design_Philosophy.md for UI decisions
- **Follow sequential steps** - Complete tasks in dependency order per 1_PHASES.md

---

**Reference Documents:**
- Master index: `1_REFERENCE_INDEX.md` (start here!)
- Journey log: `1_PROGRESS.md` (what we've done)
- Task tracking: `1_PHASES.md` (6 steps, 85 tasks)
- System design & schemas: `1_Architecture.md`
- Design guidelines: `1_Design_Philosophy.md`

