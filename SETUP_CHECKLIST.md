# Project Setup Checklist

**Purpose:** Pre-build manual setup steps  
**Complete these before initializing the Next.js project**

---

## 🔐 Account Creation

- [ ] Create Railway account at https://railway.app
- [ ] Create Vercel account at https://vercel.com
- [ ] Sign up for Polygon.io Developer plan ($99/mo) at https://polygon.io

---

## 🚂 Railway Project Setup

- [x] Create new Railway project: `crypto-platform-mvp`
- [x] Add PostgreSQL service
- [x] Add Redis service
- [x] Copy `DATABASE_URL` from PostgreSQL service
- [x] Copy `REDIS_URL` from Redis service
- [x] Create service: `backend`
- [x] Add persistent volume to `backend`: `/app` (5-10 GB)
- [x] Add `DATABASE_URL` reference to `backend` (from PostgreSQL)
- [x] Add `REDIS_URL` reference to `backend` (from Redis)
- [x] Add `POLYGON_API_KEY` to shared project variables

---

## 🔑 API Keys & Credentials

- [ ] Get Polygon.io API key from dashboard
- [ ] Update `POLYGON_API_KEY` value in Railway (currently placeholder)
- [ ] Generate NEXTAUTH_SECRET: `openssl rand -base64 32`

---

## 🌐 Vercel Setup

- [ ] Connect Vercel to GitHub repository
- [ ] Link Vercel project to Railway services

---

## 📝 Environment Variables

### Railway Dashboard (Project → Variables)
- [ ] Add `POLYGON_API_KEY`

### Vercel Dashboard (Project → Settings → Environment Variables)

**Production:**
- [ ] `POLYGON_API_KEY`
- [ ] `DATABASE_URL` (from Railway)
- [ ] `REDIS_URL` (from Railway)
- [ ] `NEXTAUTH_SECRET`
- [ ] `NEXTAUTH_URL` (your production domain)
- [ ] `NEXT_PUBLIC_APP_URL` (your production domain)
- [ ] `NEXT_PUBLIC_WS_URL=wss://socket.massive.com/crypto`

**Preview:**
- [ ] Same as production (or use staging values)

**Development:**
- [ ] Same as production (or use staging values)

---

## ✅ Verification

- [ ] Railway PostgreSQL is running
- [ ] Railway Redis is running
- [ ] Can access Railway dashboard
- [ ] Polygon.io API key works (test with curl)
- [ ] Vercel is connected to GitHub
- [ ] All environment variables set in Railway
- [ ] All environment variables set in Vercel

---

## 🚀 Ready to Build

Once all checkboxes are complete:
1. Initialize Next.js enterprise boilerplate
2. Connect to Railway database
3. Start Phase I Step 1 from PROGRESS.md

---

**See:** docs/SETUP.md for detailed setup instructions

