# Setup & Configuration Guide

**Purpose:** Complete setup guide for development, staging, and production environments  
**Last Updated:** November 15, 2025

---

## 📑 TABLE OF CONTENTS

| Section | Lines | Topic |
|---------|-------|-------|
| [External Services](#external-services--apis) | 25-120 | Polygon.io, Railway, Vercel, Stripe, Resend, Sentry |
| [Environment Variables](#environment-variables) | 125-335 | All env vars by category and environment |
| [CLI Instructions](#cli-instructions) | 340-465 | Railway and Vercel commands |
| [Setup Checklist](#setup-checklist) | 470-535 | Step-by-step setup process |
| [Troubleshooting](#troubleshooting) | 540-552 | Common issues and solutions |

---

## External Services & APIs

### Required for Phase I MVP

#### 1. Polygon.io (Market Data)

**Purpose:** Primary data source for cryptocurrency OHLCV, real-time quotes, WebSocket streams

**Pricing:**
- Starter: $29/month (5 API calls/min)
- Developer: $99/month (3000 calls/min) ← **Recommended for MVP**
- Advanced: $299/month (unlimited)

**API Keys:**
- `POLYGON_API_KEY`

**Configuration:**
- Get API key: https://polygon.io/dashboard/api-keys
- Used in: `/lib/polygon-client.ts`, `/ml/data-fetchers/polygon.py`

**Status:** 🟢 Configured - UNLIMITED plan active

---

#### 2. Railway (Infrastructure)

**Purpose:** Backend hosting, PostgreSQL database, Redis cache, ML worker services

**Pricing:**
- $5/month minimum usage credit
- Pay-as-you-go beyond credit
- Estimate: $20-50/month for MVP

**Services:**
- PostgreSQL database
- Redis instance
- Backend API service
- ML worker service (Python)

**Environment Variables** (auto-generated):
- `DATABASE_URL`
- `REDIS_URL`

**Documentation:** https://docs.railway.app

**Status:** 🟢 Configured - Project created with PostgreSQL, Redis, and backend service

---

#### 3. Vercel (Frontend Hosting)

**Purpose:** Next.js application deployment, serverless functions, edge caching

**Pricing:**
- Hobby: Free (personal projects)
- Pro: $20/month (recommended for production)

**Features:**
- Automatic GitHub deployments
- Environment variables management
- Vercel Analytics (included)
- Edge Functions

**Documentation:** https://vercel.com/docs

**Status:** 🟢 Configured - Deployed at https://crypto-platform-mvp.vercel.app

---

### Future Phases

#### 4. Stripe (Payments - Phase III)

**Purpose:** Subscription billing, payment processing

**Pricing:** 2.9% + $0.30 per transaction

**API Keys:**
- `STRIPE_PUBLIC_KEY` (client-side)
- `STRIPE_SECRET_KEY` (server-side)
- `STRIPE_WEBHOOK_SECRET`

**Documentation:** https://stripe.com/docs

**Status:** 🟡 Phase III dependency

---

#### 5. Resend (Email - Phase II)

**Purpose:** Transactional emails for alerts, verification

**Pricing:**
- Free: 3,000 emails/month
- Pro: $20/month (50,000 emails)

**API Key:** `RESEND_API_KEY`

**Documentation:** https://resend.com/docs

**Status:** 🟡 Phase II dependency

---

#### 6. Sentry (Error Monitoring - Phase IV)

**Purpose:** Error tracking, performance monitoring

**Pricing:**
- Free: 5,000 errors/month
- Team: $26/month (50,000 errors)

**API Keys:**
- `SENTRY_DSN`
- `SENTRY_AUTH_TOKEN`

**Documentation:** https://docs.sentry.io/platforms/javascript/guides/nextjs/

**Status:** 🟡 Phase IV dependency

---

## Environment Variables

### Variable Categories

#### 1. Database & Cache

```bash
# PostgreSQL (Railway auto-generated)
DATABASE_URL=postgresql://user:password@host:port/database

# Redis (Railway auto-generated)
REDIS_URL=redis://host:port
```

**Where Used:**
- Backend API: `/lib/db/index.ts`, `/lib/redis/index.ts`
- ML Workers: `/ml/config.py`

---

#### 2. Authentication

```bash
# NextAuth.js Secret (generate with: openssl rand -base64 32)
NEXTAUTH_SECRET=generate_random_secret_here_min_32_chars

# NextAuth URL
NEXTAUTH_URL=http://localhost:3000  # Production: https://yourdomain.com

# OAuth Providers (Phase II)
GOOGLE_CLIENT_ID=your_google_oauth_client_id
GOOGLE_CLIENT_SECRET=your_google_oauth_client_secret
```

**Where Used:**
- Frontend: `/app/api/auth/[...nextauth]/route.ts`
- Backend: Session validation middleware

---

#### 3. External APIs

```bash
# Polygon.io Market Data
POLYGON_API_KEY=your_polygon_io_api_key

# CoinGecko (Optional)
COINGECKO_API_KEY=your_coingecko_api_key
```

**Where Used:**
- Frontend: `/lib/polygon/websocket-client.ts` (WebSocket)
- Backend: `/lib/polygon/rest-client.ts` (REST)
- ML Workers: `/ml/data-fetchers/polygon.py`

**Security:**
- Use separate keys for development/production
- Never expose server-side keys to client

---

#### 4. Payments (Phase III)

```bash
# Stripe
STRIPE_PUBLIC_KEY=pk_test_... or pk_live_...
STRIPE_SECRET_KEY=sk_test_... or sk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...
```

---

#### 5. Application Config

```bash
# Environment
NODE_ENV=development | staging | production

# Next.js Public Variables (exposed to client)
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_WS_URL=wss://socket.massive.com/crypto
```

---

#### 6. ML & Data Pipeline

```bash
# Model Storage
MODEL_STORAGE_PATH=/app/models

# Training Configuration
TRAINING_ENABLED=false  # disable on frontend services
TRAINING_CRON=0 2 * * 0  # Sunday 2 AM UTC

# Inference Service URL
ML_INFERENCE_URL=http://ml-service:5000
```

---

### Environment-Specific Configurations

#### Local Development (`.env.local`)

```bash
# Database & Cache (Railway Staging)
DATABASE_URL=postgresql://user:pass@staging-host:port/db
REDIS_URL=redis://staging-host:port

# Auth
NEXTAUTH_SECRET=local_dev_secret_min_32_chars
NEXTAUTH_URL=http://localhost:3000

# APIs
POLYGON_API_KEY=your_dev_api_key

# App Config
NODE_ENV=development
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_WS_URL=wss://socket.massive.com/crypto

# Disable in dev
SENTRY_ENABLED=false
TRAINING_ENABLED=false

# ML
ML_INFERENCE_URL=http://localhost:5000
```

---

#### Staging (Vercel Preview + Railway Staging)

```bash
DATABASE_URL=<railway-staging-db-url>
REDIS_URL=<railway-staging-redis-url>
NEXTAUTH_SECRET=<staging-secret>
NEXTAUTH_URL=https://preview-xyz.vercel.app
POLYGON_API_KEY=<dev-api-key>
NODE_ENV=staging
```

---

#### Production (Vercel + Railway Production)

```bash
DATABASE_URL=<railway-prod-db-url>
REDIS_URL=<railway-prod-redis-url>
NEXTAUTH_SECRET=<production-secret-64-chars>
NEXTAUTH_URL=https://yourdomain.com
POLYGON_API_KEY=<prod-api-key>
NODE_ENV=production
```

---

### Security Best Practices

**DO:**
- ✅ Use different keys for dev/staging/production
- ✅ Rotate secrets before production launch
- ✅ Store secrets in platform dashboards (Vercel/Railway)
- ✅ Use `.env.local` for local development (gitignored)
- ✅ Prefix client-exposed variables with `NEXT_PUBLIC_`

**DON'T:**
- ❌ Commit `.env` or `.env.local` to Git
- ❌ Share production keys in Slack/email
- ❌ Use production keys in development
- ❌ Expose server secrets to client
- ❌ Hardcode API keys in code

---

## CLI Instructions

### Railway CLI

#### Installation
```bash
railway --version  # Already installed via brew/npm
```

#### Authentication
```bash
export RAILWAY_TOKEN=your_project_token
```

#### Common Commands

**Initialize Project:**
```bash
railway init --workspace=YOUR_WORKSPACE_ID
railway link --environment=production
```

**Deploy:**
```bash
railway up --ci --service=SERVICE_ID --environment=production
```

**Environment Variables:**
```bash
railway variables set KEY=value --environment=production
railway variables  # View all
```

**Run Commands:**
```bash
railway run npm start
railway run npm run migrate
```

---

### Vercel CLI

#### Installation
```bash
vercel --version  # Already installed globally
```

#### Authentication
```bash
vercel login
```

#### Common Commands

**Link Project:**
```bash
vercel link
```

**Deploy:**
```bash
vercel              # Preview
vercel --prod       # Production
```

**Environment Variables:**
```bash
vercel env pull                      # Pull to .env.local
vercel env add KEY_NAME production   # Add variable
```

**Development:**
```bash
vercel dev          # Run with Vercel dev server
npm run dev         # Standard Next.js
```

---

### Workflow for This Project

#### Initial Setup

**1. Create Railway project:**
```bash
railway init --workspace=YOUR_WORKSPACE_ID
railway link --environment=production
```

**2. Create Vercel project:**
```bash
# Option A: Via Dashboard (recommended)
# Visit https://vercel.com/new and import GitHub repo

# Option B: Via CLI
vercel
```

**3. Configure Environment Variables:**

**Vercel Dashboard:**
- Go to Project → Settings → Environment Variables
- Add all required variables for Production/Preview/Development

**Railway Dashboard:**
- Go to Project → Variables
- Add `POLYGON_API_KEY` (DATABASE_URL and REDIS_URL are auto-generated)

**Local `.env.local`:**
```bash
cp .env.example .env.local
# Edit with your actual values
```

---

#### Deploy Workflow

```bash
# Push to GitHub
git push origin main

# Vercel auto-deploys (once connected to GitHub)

# Railway deploy (if needed manually)
railway up --ci --service=backend --environment=production
```

---

#### Local Development Workflow

```bash
# Pull environment variables
vercel env pull

# Install dependencies
npm install

# Run development server
npm run dev

# Open http://localhost:3000
```

---

## Setup Checklist

### Phase I MVP - Required

**1. Polygon.io**
- [ ] Create account at https://polygon.io
- [ ] Choose Developer plan ($99/month recommended)
- [ ] Get API key from dashboard
- [ ] Add `POLYGON_API_KEY` to Vercel environment variables
- [ ] Add `POLYGON_API_KEY` to Railway environment variables
- [ ] Add `POLYGON_API_KEY` to local `.env.local`

**2. Railway**
- [ ] Create account at https://railway.app
- [ ] Create new project
- [ ] Add PostgreSQL database service
- [ ] Add Redis service
- [ ] Copy `DATABASE_URL` from Railway dashboard
- [ ] Copy `REDIS_URL` from Railway dashboard
- [ ] Link local project: `railway link`

**3. Vercel**
- [ ] Create account at https://vercel.com
- [ ] Connect GitHub repository
- [ ] Configure project settings
- [ ] Add all environment variables in dashboard
- [ ] Link local project: `vercel link`

**4. Local Setup**
- [ ] Create `.env.local` file
- [ ] Add all required environment variables
- [ ] Generate `NEXTAUTH_SECRET`: `openssl rand -base64 32`
- [ ] Run `npm install`
- [ ] Test with `npm run dev`

---

### Verification Checklist

Before deploying:
- [ ] All required variables set in Vercel dashboard
- [ ] All required variables set in Railway dashboard
- [ ] Production keys different from development keys
- [ ] `NEXTAUTH_SECRET` is 32+ characters
- [ ] `NEXT_PUBLIC_` prefix only used for client-safe values
- [ ] `.env.local` exists locally and gitignored
- [ ] Database connection strings tested and working
- [ ] API keys have appropriate rate limits set

---

### Troubleshooting

**"Missing required environment variable"**
- Check Vercel/Railway dashboard (not just local `.env.local`)
- Redeploy after adding new variables
- Verify variable names match exactly (case-sensitive)

**"Database connection failed"**
- Ensure `DATABASE_URL` includes all components
- Check Railway service is running
- Verify network access

**"Polygon.io rate limit exceeded"**
- Check Redis cache is working
- Upgrade Polygon.io plan if necessary
- Implement exponential backoff

---

## Rate Limit Strategy

| Service | Limit | Mitigation |
|---------|-------|------------|
| Polygon.io | 5 calls/min (Starter), 3000 calls/min (Developer) | Developer plan ($99) highly recommended, Redis caching |
| Resend | 3,000 emails/month | Batch notifications, free tier OK for MVP |
| CoinGecko | 10-30 calls/min | Cache rankings, weekly refresh only |

---

## Next Steps

1. Complete setup checklist above
2. Configure environment variables in all environments
3. Test local development server
4. Review 1_Architecture.md for system design and database schemas
5. Start Phase I development from 1_PHASES.md

