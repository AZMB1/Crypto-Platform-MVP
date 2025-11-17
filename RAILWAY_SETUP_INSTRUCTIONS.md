# Railway Cron Job Setup Instructions

## Step-by-Step Guide to Set Up Symbol Sync on Railway

### 1. Create New Cron Job Service

1. Go to your Railway dashboard: https://railway.app/dashboard
2. Select your project (the one with PostgreSQL and Redis)
3. Click **"+ New"** button
4. Select **"Empty Service"** (or "Cron Job" if available)
5. Name it: `symbol-sync-cron`

### 2. Connect to GitHub Repository

1. In the new service settings, click **"Settings"** tab
2. Under **"Source"**, click **"Connect Repo"**
3. Select your repository: `AZMB1/Crypto-Platform-MVP`
4. Branch: `main`
5. Click **"Connect"**

### 3. Configure the Service

Go to **"Settings"** tab and configure:

#### Root Directory
- Leave as default: `/` (root of project)

#### Build Command
- Leave empty (Railway will auto-detect Node.js)

#### Start Command
Set this to:
```
pnpm install && pnpm exec tsx scripts/sync-symbols.ts
```

Or if that doesn't work, try:
```
npm install && npx tsx scripts/sync-symbols.ts
```

#### Watch Paths
- Leave as default or set to: `scripts/sync-symbols.ts`

### 4. Add Environment Variables

In the **"Variables"** tab, add these three variables by clicking **"+ New Variable"**:

1. **DATABASE_URL**
   - Click "Add Reference"
   - Select your PostgreSQL service
   - Choose `DATABASE_URL`

2. **REDIS_URL**
   - Click "Add Reference"  
   - Select your Redis service
   - Choose `REDIS_URL`

3. **POLYGON_API_KEY**
   - Click "Raw Editor"
   - Paste: `[YOUR_POLYGON_API_KEY_FROM_CREDENTIALS.MD]`

### 5. Set Up Cron Schedule

In the **"Settings"** tab:

1. Find **"Cron Schedule"** section
2. Enable cron job
3. Set schedule expression: `0 3 * * 0`
   - This means: Every Sunday at 3:00 AM UTC
   - Or use `0 3 * * *` for daily at 3:00 AM UTC

**Common Cron Schedule Examples:**
- `0 3 * * 0` - Weekly (Sunday at 3 AM)
- `0 3 * * 1` - Weekly (Monday at 3 AM)  
- `0 3 * * *` - Daily at 3 AM
- `0 */6 * * *` - Every 6 hours

### 6. Deploy and Test

1. Click **"Deploy"** button (or it may auto-deploy)
2. Watch the **"Deployments"** tab for progress
3. Check the **"Logs"** tab to see if there are any errors

### 7. Run Manually (First Time)

To populate the database initially:

1. Go to the **"Deployments"** tab
2. Find the latest deployment
3. Click **"..."** (three dots menu)
4. Select **"Run Deployment"** or **"Redeploy"**
5. Watch logs for success message

OR

In the service settings:
1. Temporarily change the start command to run immediately
2. Click "Deploy"
3. Check logs
4. Change back to cron schedule

### 8. Verify Success

Check the logs for these messages:
- ✅ Fetched X crypto symbols from Polygon.io
- ✅ Synced X new + X updated symbols
- ✅ Volume ranking complete
- 🔝 Top 10 symbols by 24h USD volume

The script should take 5-15 minutes to complete depending on number of symbols.

---

## Troubleshooting

**If you see "DATABASE_URL not set":**
- Make sure the variable reference is correct
- Try using the full database URL instead of reference

**If you see "Module not found":**
- Check that the start command includes `pnpm install` or `npm install`
- Verify the repository is connected correctly

**If the script times out:**
- Railway has generous timeouts for cron jobs, but if needed:
- Consider splitting into smaller batches
- Or run less frequently (weekly instead of daily)

**If you need help:**
- Check Railway logs for specific error messages
- Verify all three environment variables are set
- Make sure your Polygon.io API key is valid

