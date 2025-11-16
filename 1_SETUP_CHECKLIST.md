# Project Setup Checklist

**Purpose:** Pre-build manual setup steps  
**Complete these before initializing the Next.js project**

---

## 🔐 Account Creation

- [x] Create Railway account at https://railway.app
- [x] Create Vercel account at https://vercel.com
- [x] Sign up for Polygon.io UNLIMITED plan at https://polygon.io

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

- [x] Get Polygon.io API key from dashboard
- [x] Add `POLYGON_API_KEY` to Railway shared variables
- [x] Generate NEXTAUTH_SECRET: `openssl rand -base64 32`
- [x] Store credentials in CREDENTIALS.md (gitignored)

---

## 🌐 Vercel Setup

- [x] Connect Vercel to GitHub repository
- [x] Deploy project successfully
- [x] Link Vercel project to Railway services

---

## 📝 Environment Variables

### Railway Dashboard (Project → Variables)
- [ ] Add `POLYGON_API_KEY`

### Vercel Dashboard (Project → Settings → Environment Variables)

**Production:**
- [x] `POLYGON_API_KEY=7vqpDkn55ACKTs7u5yWTcDeVZbpu5P6C`
- [x] `DATABASE_URL` (from Railway)
- [x] `REDIS_URL` (from Railway)
- [x] `NEXTAUTH_SECRET=Ik+1nNk7TlWlzcMUnx/reHSOPAlL8Oyej7X/1qj9nis=`
- [x] `NEXTAUTH_URL=https://crypto-platform-mvp.vercel.app`
- [x] `NEXT_PUBLIC_APP_URL=https://crypto-platform-mvp.vercel.app`
- [x] `NEXT_PUBLIC_WS_URL=wss://socket.massive.com/crypto`

**Preview:**
- [x] Same as production

**Development:**
- [x] Same as production

---

## ✅ Verification

- [x] Railway PostgreSQL is running
- [x] Railway Redis is running
- [x] Can access Railway dashboard
- [ ] Polygon.io API key works (test with curl)
- [x] Vercel is connected to GitHub
- [x] All environment variables set in Railway
- [x] All environment variables set in Vercel
- [x] Vercel deployment successful

---

## 🚀 Ready to Build

✅ **SETUP COMPLETE!**

Infrastructure ready:
- [x] Next.js enterprise boilerplate installed
- [x] Railway project configured (PostgreSQL + Redis + backend with volume)
- [x] Vercel deployed and connected
- [x] All credentials stored in CREDENTIALS.md (gitignored)
- [x] Environment variables configured everywhere

**Next Step:** Start Phase I Step 1 from 1_PROGRESS.md

---

**See:** 
- CREDENTIALS.md - All keys and URLs (gitignored, secure)
- docs/SETUP.md - Detailed setup instructions
- 1_PROGRESS.md - Phase I tasks

