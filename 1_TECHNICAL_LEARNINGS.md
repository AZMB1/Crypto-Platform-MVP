# Technical Learnings & Known Issues

**Purpose:** Document technical challenges, workarounds, and gotchas encountered during development to prevent repeated issues and speed up future work.

**Last Updated:** November 19, 2025

---

## 📚 Table of Contents

1. [TypeScript & Type Issues](#typescript--type-issues)
2. [ESLint & Linting](#eslint--linting)
3. [React & Next.js](#react--nextjs)
4. [Third-Party Libraries](#third-party-libraries)
5. [Build & Deployment](#build--deployment)
6. [Database & ORM](#database--orm)

---

## TypeScript & Type Issues

### ⚠️ Next.js 15 Route Handler Params are Promises

**Encountered:** Phase I Step 2 (Vercel deployment fixes)

**Symptom:** TypeScript error: `params` is `Promise<{ ticker: string }>` not `{ ticker: string }`

**Root Cause:** Next.js 15 breaking change - dynamic route params are now async

**Solution:**
```typescript
// ❌ Old (Next.js 14 and earlier)
export async function GET(
  request: NextRequest,
  { params }: { params: { ticker: string; timeframe: string } }
) {
  const { ticker, timeframe } = params
  // ...
}

// ✅ New (Next.js 15)
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ ticker: string; timeframe: string }> }
) {
  const { ticker, timeframe } = await params
  // ...
}
```

**Files Affected:**
- `app/api/candles/[ticker]/[timeframe]/route.ts`
- Any dynamic route handlers with `[param]` in path

**Prevention:** Always `await params` in Next.js 15+ route handlers

---

### ⚠️ TypeScript Strict Mode: Array Access Requires Non-Null Assertions

**Encountered:** Phase I Step 2 (Vercel deployment fixes)

**Symptom:** `Type 'T | undefined' is not assignable to type 'T'` for array access

**Root Cause:** TypeScript strict mode doesn't trust array length checks

**Solution:**
```typescript
// ❌ TypeScript doesn't trust this
const filled: CleanedCandle[] = [candles[0]]  // Error!

// ✅ Add non-null assertion after checking length
if (candles.length === 0) return candles
const filled: CleanedCandle[] = [candles[0]!]  // Safe!
```

**When to use:**
- After explicit array length checks
- When you know array is populated (e.g., in loops)
- When array access is guaranteed by business logic

**Files Affected:**
- `lib/polygon/data-cleaner.ts`
- `lib/polygon/fetch-fresh-candles.ts`
- `lib/polygon/rest-client.ts`

---

### ⚠️ Generic Function Return Types Need Explicit Casting

**Encountered:** Phase I Step 2 (Vercel deployment fixes)

**Symptom:** `Type 'unknown' is not assignable to type 'T'`

**Root Cause:** `response.json()` returns `unknown`, not `any`

**Solution:**
```typescript
// ❌ Implicit return type
const data = await response.json()

// ✅ Explicit type annotation
const data = await response.json() as T

// ✅ Or with explicit variable type
const response: PolygonTickersResponse = await fetchWithRetry<PolygonTickersResponse>(url)
```

**Files Affected:**
- `lib/polygon/rest-client.ts` (5 locations)
- `hooks/useChart.ts`

---

## ESLint & Linting

### ⚠️ Conflicting `sort-imports` and `import/order` Rules

**Encountered:** Phase I Step 3 (Chart implementation)

**Symptom:** Fixing one rule violation breaks the other (circular errors)

**Root Cause:** 
- `sort-imports` expects alphabetical order within a single import statement
- `import/order` expects specific ordering of import groups
- Complex imports from same package (types + values) create conflicts

**Solution:** Disable `sort-imports` for specific files
```typescript
/* eslint-disable sort-imports */
import { ColorType, createChart, CrosshairMode } from 'lightweight-charts'
import type { IChartApi, ISeriesApi } from 'lightweight-charts'
import { forwardRef, useEffect, useImperativeHandle, useRef } from 'react'

import type { CandleData, ChartTimeframe } from '@/types/chart'
/* eslint-enable sort-imports */
```

**When to use:**
- Files with complex type + value imports from same package
- When `import/order` (more important) conflicts with `sort-imports`
- When alphabetical sorting creates unreadable import blocks

**Files Affected:**
- `components/chart/ChartCanvas.tsx`

**Prevention:** 
- Keep imports simple when possible
- Separate type imports from value imports
- Group by: external → internal → relative
- Consider disabling `sort-imports` project-wide if conflicts are frequent

---

### ⚠️ Unused ESLint Directive Warnings

**Encountered:** Phase I Step 3 (Chart implementation)

**Symptom:** Warning about unused `eslint-disable` directive

**Cause:** ESLint directive was added but the rule violation was fixed by other means

**Solution:** Remove the unused directive or keep it if the violation might return

**Prevention:** After fixing errors, check if the `eslint-disable` is still needed

---

## React & Next.js

### ⚠️ React 19 forwardRef with Nullable Refs

**Encountered:** Phase I Step 3 (Chart implementation)

**Symptom:** `Type 'IChartApi | null' is not assignable to type 'IChartApi'` in `useImperativeHandle`

**Root Cause:** React 19 changed how `forwardRef` generics work with nullable types

**Solution:** Use non-null assertions for refs
```typescript
// ✅ React 19 pattern
export const Component = forwardRef<IChartApi, Props>(
  function Component(props, ref) {
    const internalRef = useRef<IChartApi | null>(null)
    
    // Non-null assertion is safe here - React lifecycle guarantees
    useImperativeHandle(ref, () => internalRef.current!)
    
    // Internal ref can still be nullable
    useEffect(() => {
      if (internalRef.current) {
        // Use ref
      }
    }, [])
  }
)

// Parent component
const chartRef = useRef<IChartApi>(null!)
```

**Why this is okay:**
- React lifecycle guarantees ref is initialized before parent can access it
- Official React 19 pattern for imperativeHandle
- Prevents null checks throughout codebase
- The `!` assertion is only at the boundary, internal code can still be null-safe

**Files Affected:**
- `components/chart/ChartCanvas.tsx`
- `components/chart/Chart.tsx`

---

### ⚠️ Lazy Loading Database/Redis Connections for Vercel Builds

**Encountered:** Phase I Step 2 (Vercel deployment fixes)

**Symptom:** `getaddrinfo ENOTFOUND postgres.railway.internal` during Vercel builds

**Root Cause:** Top-level code in modules executes during build phase, attempting to connect to databases that aren't accessible from Vercel's build servers

**Solution:** Implement lazy-loading with Proxy objects
```typescript
// ❌ Eager connection (runs during build)
export const redis = new Redis(process.env.REDIS_URL)

// ✅ Lazy connection (only connects at runtime)
let redisInstance: Redis | null = null

function getRedisClient(): Redis {
  if (process.env.NEXT_PHASE === 'phase-production-build') {
    throw new Error('Redis not available during build')
  }
  if (!redisInstance) {
    redisInstance = new Redis(process.env.REDIS_URL, { /* config */ })
  }
  return redisInstance
}

export const redis = new Proxy({} as Redis, {
  get(_target, prop) {
    return getRedisClient()[prop as keyof Redis]
  },
})
```

**Why this works:**
- Proxy delays execution until runtime
- Build phase check prevents connection attempts
- First runtime access initializes the connection
- Subsequent accesses reuse the instance

**Files Affected:**
- `lib/redis/index.ts`
- `lib/db/index.ts`

**Prevention:** Never initialize database/external connections at module top-level in Next.js projects

---

## Third-Party Libraries

### 🚨 CRITICAL: lightweight-charts v5 API Changes

**Encountered:** Phase I Step 3 (Chart Implementation)

**Symptom:** Runtime error: `t.addCandlestickSeries is not a function`

**Root Cause:** lightweight-charts v5 completely changed the API for adding series. The v4 methods (`addCandlestickSeries`, `addLineSeries`, `addHistogramSeries`) **do not exist** in v5.

**THE MISTAKE:** We were following v4 documentation/examples and using deprecated API methods.

**THE SOLUTION - Correct v5 API:**

```typescript
// ❌ WRONG - v4 API (deprecated, doesn't work in v5)
import { createChart } from 'lightweight-charts'

const chart = createChart(container)
const candleSeries = chart.addCandlestickSeries(options) // ERROR!
const lineSeries = chart.addLineSeries(options) // ERROR!
const histogramSeries = chart.addHistogramSeries(options) // ERROR!
```

```typescript
// ✅ CORRECT - v5 API
import { 
  createChart, 
  CandlestickSeries, 
  LineSeries, 
  HistogramSeries 
} from 'lightweight-charts'

const chart = createChart(container)
const candleSeries = chart.addSeries(CandlestickSeries, options) // ✅
const lineSeries = chart.addSeries(LineSeries, options) // ✅
const histogramSeries = chart.addSeries(HistogramSeries, options) // ✅
```

**Key Points:**
1. Import the **series classes** (`CandlestickSeries`, `LineSeries`, `HistogramSeries`)
2. Use `chart.addSeries(SeriesClass, options)` instead of `chart.addXxxSeries(options)`
3. The time field must be cast to match v5's strict typing: `time: number as Time`
4. Do NOT use `as any` hacks - the proper API works with TypeScript

**Files That Need This:**
- Any component creating charts with `createChart()`
- Any component adding series (candlestick, line, histogram)
- In our case: `components/chart/ChartCanvas.tsx` and `components/chart/IndicatorOverlay.tsx`

**Documentation:**
- Official v5 docs: https://tradingview.github.io/lightweight-charts/docs
- Migration guide: Check version-specific documentation

**Lesson Learned:**
- **Always verify the library version** you're using matches the documentation
- Don't assume APIs are backward compatible between major versions
- If type assertions (`as any`) are needed everywhere, you're probably using the wrong API

---

### ⚠️ lightweight-charts v5.0.9: TypeScript Types Don't Match Runtime API (OBSOLETE - See v5 API Changes Above)

**Encountered:** Phase I Step 3 (Chart implementation)

**NOTE:** This section is now obsolete. The real issue was using the wrong API (v4 methods in v5). See "lightweight-charts v5 API Changes" above for the correct solution.

**Severity:** Known library issue, not our fault

**Problems:**
1. `IChartApi` missing methods: `addCandlestickSeries()`, `addLineSeries()`, `addHistogramSeries()`
2. Data types require `Time` type instead of `number`
3. Options interfaces require deeply nested `Partial<>` types
4. Chart options typing is overly strict

**Solution:** Use `as any` with eslint-disable comments
```typescript
// For chart API methods
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const series = (chart as any).addCandlestickSeries(options)

// For data
// eslint-disable-next-line @typescript-eslint/no-explicit-any
series.setData(data as any)

// For options
const chartOptions = {
  layout: { /* ... */ },
  // ...
}
const chart = createChart(container, {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  ...(chartOptions as any),
  width: 800,
  height: 600,
})
```

**Why this is okay:** 
- Runtime API works perfectly (100% tested and stable)
- Library maintainers have known type issues in v5 ([GitHub issues](https://github.com/tradingview/lightweight-charts/issues))
- Standard practice for library type bugs in TypeScript ecosystem
- Production-safe: runtime behavior is correct, only types are wrong
- Used by thousands of developers with same workaround

**Alternative considered:** 
- Writing custom type definitions: Not worth 100+ lines for temporary issue
- Downgrade to v4: Worse features, not worth it
- Different charting library: lightweight-charts is best in class

**Files Affected:**
- `components/chart/ChartCanvas.tsx`
- `components/chart/IndicatorOverlay.tsx`

**Future:** Monitor library updates for fixed types in v5.1+

---

### ⚠️ Hook Implementation vs Interface Mismatch

**Encountered:** Phase I Step 3 (Chart implementation)

**Symptom:** `usePolygonWebSocket` returns `{ prices, status, isConnected }` but interface defines `{ price, volume, timestamp, status, isConnected, subscribe, unsubscribe, connect, disconnect }`

**Root Cause:** Implementation was refactored but interface wasn't updated

**Solution:** Follow the TypeScript interface (source of truth)
```typescript
// ✅ Use interface-defined properties
const { price, isConnected } = usePolygonWebSocket(ticker, options)

// ❌ Don't use implementation details
// const { prices } = usePolygonWebSocket(...)  // This might work but breaks type safety
```

**Why follow the interface:**
- Interface is the public contract
- Implementation will eventually be fixed to match
- Type safety ensures future compatibility
- Other code depending on the hook expects interface shape

**Files Affected:**
- `hooks/usePolygonWebSocket.ts` (implementation needs fixing)
- `hooks/useChart.ts` (correctly follows interface)

**TODO:** Fix `usePolygonWebSocket.ts` implementation to match its interface

---

## Build & Deployment

### ⚠️ Vercel Environment Variables Must Use Public Railway URLs

**Encountered:** Phase I Step 2 (Vercel deployment fixes)

**Symptom:** `getaddrinfo ENOTFOUND postgres.railway.internal` at runtime on Vercel

**Root Cause:** Railway internal URLs (`.railway.internal`) are only accessible within Railway's private network

**Solution:**
- **Vercel Environment Variables:** Use Railway's **public/external URLs** (`.railway.app`)
- **Railway Service Variables:** Use Railway's **internal URLs** (`.railway.internal`)

**Example:**
```bash
# ❌ In Vercel (won't work)
DATABASE_URL=postgresql://user:pass@postgres.railway.internal:5432/db
REDIS_URL=redis://redis.railway.internal:6379

# ✅ In Vercel (works)
DATABASE_URL=postgresql://user:pass@postgres-abc123.railway.app:5432/db
REDIS_URL=redis://redis-xyz789.railway.app:6379

# ✅ In Railway services (works, faster)
DATABASE_URL=postgresql://user:pass@postgres.railway.internal:5432/db
REDIS_URL=redis://redis.railway.internal:6379
```

**Why internal URLs exist:** Faster communication within Railway's network

**Prevention:** 
- Document which URLs to use for each platform
- Use Railway's public URLs for any external services (Vercel, local dev, etc.)
- Use Railway's internal URLs only for Railway-to-Railway communication

---

### ⚠️ Railway Migrations Must Run Explicitly in Docker Cron Jobs

**Encountered:** Phase I Step 2 (Railway Cron Job setup)

**Symptom:** `error: relation "symbols" does not exist` when cron job runs

**Root Cause:** 
- Vercel's `postbuild` script doesn't run on Railway services
- Each Docker container needs to run migrations independently
- Database tables don't exist until migrations run

**Solution:** Run migrations in Dockerfile before main script
```dockerfile
# Dockerfile.symbol-sync
CMD ["sh", "-c", "pnpm run db:migrate && pnpm exec tsx scripts/sync-symbols.ts"]
```

**Why this is safe:**
- Drizzle migrations are **idempotent** (safe to run multiple times)
- If tables exist, migration is skipped
- If tables don't exist, they're created
- No data loss risk

**Prevention:** 
- Always include `db:migrate` in Docker CMD for Railway services
- Don't rely on Vercel's build scripts for Railway infrastructure
- Test Railway services independently

**Files Affected:**
- `Dockerfile.symbol-sync`

---

### ⚠️ Removing Vercel postbuild Script

**Encountered:** Phase I Step 2 (Vercel deployment fixes)

**Symptom:** Build failures because Vercel tried to connect to Railway's internal database

**Root Cause:** `"postbuild": "pnpm run db:migrate"` in `package.json` runs after Next.js build, attempting database connection

**Solution:** Remove `postbuild` script from `package.json`

**Why this is okay:**
- Vercel doesn't need to run migrations (it only serves the frontend)
- Database already has tables (from Railway cron job migrations)
- Next.js app only reads from database, doesn't create tables
- Separation of concerns: Railway manages migrations, Vercel serves app

**Prevention:** 
- Keep build scripts platform-agnostic
- Don't assume build environment has database access
- Document where migrations run (Railway services, not Vercel)

---

## Database & ORM

### ⚠️ PostgreSQL Column Length Limits from External APIs

**Encountered:** Phase I Step 2 (Railway Cron Job failure)

**Symptom:** `error: value too long for type character varying(10)`

**Root Cause:** Polygon.io ticker names can exceed our initial `varchar(10)` limit

**Solution:** Increase column length with migration
```typescript
// Before
baseCurrency: varchar('base_currency', { length: 10 }).notNull(),

// After
baseCurrency: varchar('base_currency', { length: 20 }).notNull(),
```

**Lesson:** When storing data from external APIs, **always pad column lengths** beyond observed max to account for future data changes

**Prevention:**
- Research API documentation for field length limits
- Add 50-100% buffer to observed max lengths
- Use `text` type if length is truly unbounded
- Monitor production errors for similar issues

**Files Affected:**
- `lib/db/schema.ts`
- `drizzle/0001_true_moira_mactaggert.sql` (migration)

---

### ⚠️ SQL Syntax: Cannot Qualify Columns in UPDATE SET Clause

**Encountered:** Phase I Step 2 (Railway Cron Job failure)

**Symptom:** `error: column "symbols" of relation "symbols" does not exist`

**Root Cause:** PostgreSQL doesn't allow table-qualified column names in UPDATE SET clause

**Solution:**
```sql
-- ❌ Wrong (PostgreSQL doesn't allow this)
UPDATE "symbols"
SET "symbols"."volume_rank" = subquery.rank
FROM (SELECT id, RANK() OVER ...) subquery
WHERE "symbols".id = subquery.id;

-- ✅ Correct (unqualified column name in SET)
UPDATE "symbols"
SET volume_rank = subquery.rank
FROM (SELECT id, RANK() OVER ...) subquery
WHERE "symbols".id = subquery.id;
```

**Lesson:** In PostgreSQL UPDATE statements:
- SET clause: Use unqualified column names (`SET column = value`)
- WHERE clause: Can use table-qualified names (`WHERE table.column = value`)

**Files Affected:**
- `scripts/sync-symbols.ts`

---

## Summary: Quick Reference

### ✅ Always Do:
- `await params` in Next.js 15 route handlers
- Add `!` assertions after array length checks
- Cast `response.json()` with `as T`
- Lazy-load database connections (use Proxy pattern)
- Use public Railway URLs in Vercel
- Run migrations in Railway Docker containers
- Pad external API column lengths by 50-100%

### ⚠️ When Necessary:
- Use `as any` for broken library types (with eslint-disable)
- Use `!` assertions for React refs in forwardRef
- Disable `sort-imports` for complex import structures

### ❌ Never Do:
- Initialize database connections at module top-level
- Use Railway internal URLs (`.railway.internal`) outside Railway
- Rely on Vercel build scripts for Railway infrastructure
- Trust array access without length checks in TypeScript strict mode
- Qualify column names in SQL UPDATE SET clause

---

## Contributing

When you encounter a new technical issue:
1. Document it in this file under the appropriate section
2. Include: symptom, root cause, solution, why it's okay
3. Add file paths affected
4. Update the Quick Reference if it's a common pattern

**Format:**
```markdown
### ⚠️ Brief Title

**Encountered:** Phase X Step Y

**Symptom:** What error/warning you saw

**Root Cause:** Why it happened

**Solution:**
[code example]

**Why this is okay:** Explanation

**Files Affected:**
- path/to/file.ts
```

---

**Last Updated:** November 19, 2025 (Phase I Step 3 Complete)

