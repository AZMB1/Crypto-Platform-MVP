# AI-Powered Crypto Price Prediction Platform

Multi-phase cryptocurrency price prediction platform providing AI-powered forecasts across 5 timeframes (1h, 4h, 1d, 1w, 1m) for all Polygon.io-listed cryptocurrencies.

---

## 📑 TABLE OF CONTENTS

| Section | Lines | Topic |
|---------|-------|-------|
| [Quick Start](#quick-start) | 25-50 | Installation and setup |
| [Documentation](#documentation) | 55-75 | All project documents |
| [Tech Stack](#tech-stack) | 80-110 | Technologies used |
| [Project Phases](#project-phases) | 115-165 | 5 development phases |
| [Performance Targets](#key-performance-targets) | 170-190 | KPIs and goals |
| [Development](#development) | 195-230 | Commands and workflow |

---

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ and npm
- PostgreSQL (via Railway)
- Redis (via Railway)
- Polygon.io API key

### Installation

```bash
# Clone repository
git clone https://github.com/AZMB1/Crypto-Platform-MVP.git
cd Crypto-Platform-MVP

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env.local
# Edit .env.local with your actual values

# Run development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to see the application.

---

## 📚 Documentation

### Core Documents
- **[1_REFERENCE_INDEX.md](./1_REFERENCE_INDEX.md)** ⭐ **START HERE** - Master index of all documentation
- **[1_PROGRESS.md](./1_PROGRESS.md)** 📓 **JOURNEY LOG** - Narrative of what we've done, learnings, blockers
- **[1_PHASES.md](./1_PHASES.md)** - Task tracking with shared registry (Phase I: 6 steps, 85 tasks)
- **[1_AGENT.md](./1_AGENT.md)** - AI agent context and core principles
- **[1_Architecture.md](./1_Architecture.md)** - Complete system architecture, database schemas, workflows
- **[1_Design_Philosophy.md](./1_Design_Philosophy.md)** - Typography-forward UI/UX guidelines
- **[CREDENTIALS.md](./CREDENTIALS.md)** - All API keys and secrets (gitignored, not in repo)

### Setup & Reference (docs/)
- **[docs/SETUP.md](./docs/SETUP.md)** - Complete setup guide (services, environment variables, CLI commands)
- **[docs/Polygon_Integration.md](./docs/Polygon_Integration.md)** - Polygon.io integration reference (REST, WebSocket, MCP)
- **[docs/TECH_STACK.md](./docs/TECH_STACK.md)** - Technology options reference

---

## 🏗️ Tech Stack

### Frontend
- **Framework:** Next.js 15 (App Router)
- **Language:** TypeScript
- **Styling:** Tailwind CSS
- **Charts:** TradingView lightweight-charts
- **Deployment:** Vercel

### Backend
- **Platform:** Railway
- **Database:** PostgreSQL
- **Cache:** Redis
- **API:** Next.js API Routes + Railway services

### External Services
- **Market Data:** Polygon.io (REST + WebSocket)
- **Payments:** Stripe (Phase III)
- **Email:** Resend (Phase II)
- **Monitoring:** Sentry (Phase IV)

### ML Pipeline
- **Language:** Python
- **Training:** scikit-learn, TensorFlow/PyTorch
- **Indicators:** ta-lib, pandas
- **Deployment:** Railway workers

---

## 📋 Project Phases

### Phase I: MVP (Current)
Single-page dashboard with:
- Coin selector (typeahead across Polygon.io library)
- Live interactive charts
- Prediction console (date picker + timeframe selector)
- Up to 30 forecasted candles with confidence scores
- **No authentication required**

### Phase II: Full Platform
- Authentication (email/password + OAuth)
- User dashboard with watchlists
- Price alerts and notifications
- Trading plans
- Prediction history and accuracy tracking

### Phase III: Monetization
- Subscription tiers (Free, Premium $19.99, Pro $49.99)
- Stripe payment integration
- Feature gating by tier
- Usage quotas and limits

### Phase IV: UI/UX Polish
- Design system refinement
- Micro-interactions and animations
- Responsive optimization
- Accessibility compliance (WCAG 2.1 AA+)

### Phase V: Launch
- Security hardening
- Comprehensive testing (unit, integration, load)
- Legal compliance (Terms, Privacy, GDPR)
- Marketing and go-to-market prep

---

## 🎯 Key Performance Targets

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

---

## 🛠️ Development

### Available Scripts

```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run start        # Start production server
npm run lint         # Run ESLint
```

### Railway Commands

```bash
railway login        # Authenticate with Railway
railway link         # Link to Railway project
railway up           # Deploy service
```

### Vercel Commands

```bash
vercel               # Deploy to preview
vercel --prod        # Deploy to production
vercel env pull      # Pull environment variables
```

---

## 🔐 Environment Variables

See [docs/SETUP.md](./docs/SETUP.md) for complete setup guide.

**Required for MVP:**
- `POLYGON_API_KEY` - Polygon.io API key
- `DATABASE_URL` - PostgreSQL connection string (Railway)
- `REDIS_URL` - Redis connection string (Railway)
- `NEXTAUTH_SECRET` - NextAuth.js secret (generate with `openssl rand -base64 32`)
- `NEXTAUTH_URL` - Application URL

---

## 📦 Project Structure

```
/
├── src/
│   ├── app/                 # Next.js App Router pages
│   ├── components/          # React components
│   ├── lib/                 # Utility libraries
│   ├── hooks/               # Custom React hooks
│   └── types/               # TypeScript types
```

---

## 🤝 Contributing

This is a solo project with AI assistance. Not currently accepting external contributions.

---

## 📄 License

Proprietary - All rights reserved

---

## 🔗 Links

- **GitHub:** https://github.com/AZMB1/Crypto-Platform-MVP
- **Vercel:** TBD (set up after deployment)
- **Railway:** TBD (set up after deployment)

---

## 📞 Support

For setup instructions and troubleshooting, see [docs/SETUP.md](./docs/SETUP.md).

For questions or issues, refer to the comprehensive documentation in the root directory.

---

**Current Status:** Phase I setup in progress

**Next Steps:**
1. Start Phase I Step 1 from [1_PHASES.md](./1_PHASES.md)
2. Refer to [1_PROGRESS.md](./1_PROGRESS.md) for journey log
3. Use [1_REFERENCE_INDEX.md](./1_REFERENCE_INDEX.md) to find relevant docs
