# Preferred Tech Stack

**Purpose:** Standard technology stack for building web applications  
**Usage:** Use the full stack or select components based on project needs

---

## 🎯 PRIMARY STACK (Default Choice)

### **Frontend Framework**
**Next.js** ⭐⭐⭐⭐⭐
- Full-stack React framework for building dynamic, server-rendered web apps
- Built-in routing, API routes, and SEO optimization
- **CLI:** `npx create-next-app`
- **Why:** Best-in-class developer experience, automatic code splitting, hybrid rendering

---

### **Version Control**
**GitHub** ⭐⭐⭐⭐⭐
- Store and manage code, track versions, and collaborate efficiently
- **CLI:** `gh` (GitHub CLI)
- **Why:** Industry standard, excellent CI/CD integration, unlimited repos

**Common commands:**
```bash
gh repo create my-app --public
gh pr create --title "New feature"
```

---

### **Hosting / Deployment**
**Vercel** ⭐⭐⭐⭐⭐
- Optimized for Next.js with automatic deployments from GitHub
- Global edge hosting with automatic SSL
- **CLI:** `vercel`
- **Free tier:** Unlimited personal projects
- **Why:** Zero-config Next.js deployments, instant previews, built-in analytics

**Common commands:**
```bash
vercel                    # Deploy
vercel --prod             # Production deploy
vercel env add KEY        # Add environment variable
```

---

### **Backend / Database**
**Firebase** ⭐⭐⭐⭐⭐
- All-in-one backend platform (Google)
- Firestore (NoSQL database), Authentication, Cloud Storage, Serverless Functions
- **CLI:** `firebase-tools`
- **Free tier:** Generous Spark plan
- **Why:** Real-time capabilities, minimal backend code, excellent mobile support

**Installation:**
```bash
npm install -g firebase-tools
```

**What you get:**
- Firestore (NoSQL database)
- Firebase Authentication
- Cloud Storage
- Cloud Functions (serverless)
- Hosting (if needed)

---

### **Authentication**
**Firebase Authentication** ⭐⭐⭐⭐⭐
- Part of Firebase platform
- Email/password and third-party logins (Google, GitHub, etc.)
- **CLI:** Part of `firebase-tools`
- **Why:** Seamless integration with Firebase, handles complex auth flows

---

### **File Storage**
**Firebase Cloud Storage** ⭐⭐⭐⭐⭐
- Part of Firebase platform
- Securely store and serve files and media assets
- **CLI:** Part of `firebase-tools`
- **Why:** Integrated with Firebase Auth, automatic security rules

---

### **Payments**
**Stripe** ⭐⭐⭐⭐⭐
- Industry standard for online payments, subscriptions, and invoicing
- **CLI:** `stripe`
- **Fee:** 2.9% + $0.30 per transaction (no monthly fee)
- **Why:** Best documentation, most trusted, excellent developer experience

**Installation:**
```bash
brew install stripe/stripe-cli/stripe
```

**Common commands:**
```bash
stripe login
stripe listen                    # Test webhooks locally
stripe customers list
```

---

### **Emails**
**Resend** ⭐⭐⭐⭐⭐ (Primary)
- Simple API for transactional emails (confirmations, password resets)
- **CLI:** ❌ (API only)
- **Free tier:** 3,000 emails/month
- **Why:** Built for developers, excellent Next.js integration, React email templates

**SendGrid** ⭐⭐⭐⭐ (Alternative)
- For larger email operations or marketing campaigns
- **CLI:** `sendgrid`
- **Free tier:** 100 emails/day
- **Why:** Marketing features, email templates, better for bulk sending

---

### **Analytics**
**Vercel Analytics** ⭐⭐⭐⭐⭐
- Integrated performance and visitor analytics
- **CLI:** Part of `vercel`
- **Why:** Built into Vercel, privacy-friendly, real user metrics, zero configuration

---

### **Error Monitoring**
**Sentry** ⭐⭐⭐⭐⭐
- Automatically tracks and reports errors and performance issues
- **CLI:** `sentry-cli`
- **Free tier:** 5,000 errors/month
- **Why:** Best error tracking, source maps support, performance monitoring

**Installation:**
```bash
npm install @sentry/nextjs
```

---

### **CI/CD**
**Vercel + GitHub Actions** ⭐⭐⭐⭐⭐
- **Vercel:** Auto-deploys on Git push (included with Vercel)
- **GitHub Actions:** Run tests and custom workflows
- **Free tier:** GitHub Actions includes 2,000 minutes/month
- **Why:** Vercel handles deployment, GitHub Actions for testing and automation

---

### **CMS (Optional)**
**Sanity** ⭐⭐⭐⭐⭐
- Headless content management system for dynamic websites
- **CLI:** `sanity`
- **Free tier:** Unlimited admin users
- **Why:** Flexible content modeling, real-time collaboration, great developer experience

**Installation:**
```bash
npm install -g @sanity/cli
```

---

### **Package Management**
**npm** ⭐⭐⭐⭐⭐ (Default)
- Default Node.js package manager
- **CLI:** `npm` (pre-installed with Node.js)

**pnpm** ⭐⭐⭐⭐⭐ (Faster Alternative)
- More efficient disk usage, faster installs
- **CLI:** `pnpm`
- **Why:** Better for monorepos, saves disk space

---

## 🔄 SUPPLEMENTARY SERVICES (Alternatives & Specialized Use Cases)

### **Backend / Database Alternatives**

**Supabase** ⭐⭐⭐⭐⭐
- Open-source Firebase alternative with PostgreSQL (SQL-based)
- Includes Auth, Storage, Realtime, Auto-generated REST APIs
- **CLI:** `supabase`
- **Free tier:** 2 projects, 500MB database
- **When to use:** Need SQL database, prefer open-source, row-level security

**PlanetScale** ⭐⭐⭐⭐
- Serverless MySQL with database branching (like Git for databases)
- **CLI:** `pscale`
- **Free tier:** 1 database, 5GB storage
- **When to use:** Need MySQL, want database branching workflow

**MongoDB Atlas** ⭐⭐⭐⭐
- Managed MongoDB (NoSQL) in the cloud
- **CLI:** `mongosh` + `atlas`
- **Free tier:** 512MB storage
- **When to use:** Complex document structures, aggregation pipelines

**Neon** ⭐⭐⭐⭐
- Serverless PostgreSQL with branching
- **CLI:** `neonctl`
- **Free tier:** Generous
- **When to use:** PostgreSQL without server management

---

### **Authentication Alternatives**

**Clerk** ⭐⭐⭐⭐⭐
- Modern auth with beautiful pre-built UI components
- **CLI:** `clerk`
- **Free tier:** 10,000 monthly active users
- **When to use:** Want polished UI out-of-box, Next.js projects, need user management

**NextAuth.js** ⭐⭐⭐⭐⭐
- Open-source authentication for Next.js
- **CLI:** ❌ (configuration-based)
- **Free tier:** Completely free (self-hosted)
- **When to use:** Want full control, no vendor lock-in, cost-conscious

**Auth0** ⭐⭐⭐⭐
- Enterprise-grade auth platform
- **CLI:** `auth0`
- **Free tier:** 7,500 active users
- **When to use:** Enterprise apps, complex auth requirements

---

### **Hosting Alternatives**

**Netlify** ⭐⭐⭐⭐
- Great for static sites and Jamstack
- **CLI:** `netlify-cli`
- **Free tier:** 100GB bandwidth/month
- **When to use:** Form handling, split testing, serverless functions

**Cloudflare Pages** ⭐⭐⭐⭐
- Fast hosting on Cloudflare's edge network
- **CLI:** `wrangler`
- **Free tier:** Unlimited bandwidth
- **When to use:** Edge computing, Workers integration

**Railway** ⭐⭐⭐⭐
- Full-stack hosting (frontend + backend)
- **CLI:** `railway`
- **Free tier:** $5/month credit
- **When to use:** Need backend + database together, Docker support

---

### **Analytics Alternatives**

**Plausible** ⭐⭐⭐⭐⭐
- Privacy-focused analytics (GDPR compliant, no cookies)
- **CLI:** ❌
- **Pricing:** $9/month (no free tier)
- **When to use:** Privacy-conscious, European users, want ethical analytics

**Google Analytics 4** ⭐⭐⭐⭐
- Comprehensive analytics platform
- **CLI:** ❌
- **Free tier:** Completely free
- **When to use:** Need detailed traffic analysis, conversion tracking

**PostHog** ⭐⭐⭐⭐
- Product analytics + session recording + feature flags
- **CLI:** ❌
- **Free tier:** 1M events/month
- **When to use:** Product teams, need session replays, A/B testing

---

### **CMS Alternatives**

**Contentful** ⭐⭐⭐⭐
- Headless CMS for enterprise
- **CLI:** `contentful-cli`
- **Free tier:** 25,000 records
- **When to use:** Enterprise content needs, complex content modeling

**Payload CMS** ⭐⭐⭐⭐
- Self-hosted headless CMS
- **CLI:** ✅
- **Free tier:** Completely free (self-hosted)
- **When to use:** Want full control, complex admin needs

---

### **File Storage / Media Alternatives**

**Cloudinary** ⭐⭐⭐⭐⭐
- Image/video hosting with automatic transformations
- Auto-resize, format optimization (WebP, AVIF), CDN delivery
- **CLI:** `cloudinary`
- **Free tier:** 25GB storage, 25GB bandwidth
- **When to use:** Image-heavy sites, need transformations, optimize performance

**Uploadthing** ⭐⭐⭐⭐⭐
- File uploads specifically for Next.js (extremely easy)
- **CLI:** ❌
- **Free tier:** 2GB storage
- **When to use:** Next.js projects, need simple file uploads

**AWS S3** ⭐⭐⭐⭐
- Industry-standard object storage
- **CLI:** `aws` (AWS CLI)
- **Free tier:** 5GB storage, 20,000 requests
- **When to use:** Large-scale apps, need AWS ecosystem integration

---

### **Email Alternatives**

**Mailgun** ⭐⭐⭐⭐
- Email API for high-volume sending
- **CLI:** ❌ (API only)
- **Free tier:** Limited
- **When to use:** High-volume transactional emails

**Postmark** ⭐⭐⭐⭐
- Transactional email delivery (reliable)
- **CLI:** ❌
- **Free tier:** 100 emails/month
- **When to use:** Mission-critical emails (receipts, password resets)

---

### **Notifications**

**Novu** ⭐⭐⭐⭐
- Open-source notification infrastructure
- **CLI:** `novu`
- **Free tier:** Self-hosted (free) or cloud
- **When to use:** Multi-channel notifications (email, SMS, push, in-app)

**Knock** ⭐⭐⭐⭐
- Notification infrastructure as a service
- **CLI:** ❌
- **Free tier:** 10,000 notifications/month
- **When to use:** In-app + email + SMS notifications together

---

### **Real-Time / Chat**

**Pusher** ⭐⭐⭐⭐
- Real-time WebSockets
- **CLI:** ❌
- **Free tier:** 100 concurrent connections
- **When to use:** Live chat, real-time notifications, presence

**Stream** ⭐⭐⭐⭐
- Chat and activity feeds as a service
- **CLI:** ❌
- **Free tier:** Limited
- **When to use:** Building Slack-like chat, social feeds

---

### **Payments Alternative**

**Paddle** ⭐⭐⭐
- Merchant of record (handles taxes and invoices globally)
- **CLI:** ❌
- **When to use:** Selling software globally, want simplified tax compliance

---

### **Error Monitoring Alternatives**

**LogRocket** ⭐⭐⭐⭐
- Session replay + error tracking
- **CLI:** ❌
- **Free tier:** 1,000 sessions/month
- **When to use:** Need to see user sessions, debug complex UI issues

---

## 📋 QUICK START CHECKLIST

### **For Every Project:**
1. ✅ Initialize Git and push to GitHub
2. ✅ Deploy to Vercel (auto-connects to GitHub)
3. ✅ Set up Firebase project (if backend needed)
4. ✅ Configure environment variables in Vercel

### **Install CLIs (One-Time Setup):**
```bash
# Already installed
gh --version              # GitHub CLI
vercel --version          # Vercel CLI

# Install for Firebase projects
npm install -g firebase-tools

# Install for payments
brew install stripe/stripe-cli/stripe

# Install for CMS
npm install -g @sanity/cli

# Install for error monitoring
npm install @sentry/nextjs
```

---

## 💡 USAGE PHILOSOPHY

**Start Simple, Scale When Needed:**

1. **MVP/Prototype:** GitHub + Vercel + Resend
2. **Add Database:** + Firebase (or Supabase)
3. **Add Users:** + Firebase Auth (or Clerk)
4. **Add Payments:** + Stripe
5. **Add Content Management:** + Sanity
6. **Add Monitoring:** + Sentry
7. **Add Analytics:** Vercel Analytics (already included)

**Don't install everything at once.** Add services as requirements emerge.

---

## 🎓 TYPICAL PROJECT SETUP

```bash
# 1. Create Next.js app
npx create-next-app@latest my-app
cd my-app

# 2. Initialize Git and GitHub
git init
gh repo create my-app --public --source=. --remote=origin --push

# 3. Deploy to Vercel
vercel

# 4. Add Firebase (if needed)
npm install firebase
firebase login
firebase init

# 5. Add Stripe (if needed)
npm install stripe
stripe login

# 6. Configure environment variables
vercel env add FIREBASE_API_KEY
vercel env add STRIPE_SECRET_KEY
vercel env add RESEND_API_KEY
```

---

**Last Updated:** October 2025  
**Note:** This stack emphasizes Firebase for backend simplicity. For SQL needs, consider Supabase or PlanetScale.

