/**
 * Symbol Sync Script
 * 
 * Fetches ALL crypto symbols from Polygon.io and syncs them to the database
 * Calculates 24h USD volume and ranks symbols
 * 
 * Usage: tsx scripts/sync-symbols.ts
 * 
 * Run: 
 * - Once initially to populate the database
 * - Daily/weekly to keep symbols current
 */

import { getAllCryptoSymbols, getDailyBar } from '../lib/polygon/rest-client'
import { upsertSymbol } from '../lib/db/queries'
import { db } from '../lib/db/index'
import { symbols } from '../lib/db/schema'
import { sql } from 'drizzle-orm'

async function syncSymbols() {
  console.log('🔄 Starting symbol sync...\n')

  try {
    // Step 1: Fetch ALL crypto symbols from Polygon.io
    console.log('📡 Fetching crypto symbols from Polygon.io...')
    const polygonSymbols = await getAllCryptoSymbols()
    console.log(`✅ Found ${polygonSymbols.length} symbols\n`)

    // Step 2: Upsert symbols into database
    console.log('💾 Syncing symbols to database...')
    let insertedCount = 0
    let updatedCount = 0

    for (const symbol of polygonSymbols) {
      try {
        const existing = await db
          .select()
          .from(symbols)
          .where(sql`${symbols.ticker} = ${symbol.ticker}`)
          .limit(1)

        const isNew = existing.length === 0

        await upsertSymbol({
          ticker: symbol.ticker,
          name: symbol.name,
          baseCurrency: symbol.base_currency_symbol,
          quoteCurrency: 'USD', // All crypto pairs are against USD in Polygon
          isActive: symbol.active,
          lastUpdated: new Date(),
        })

        if (isNew) {
          insertedCount++
        } else {
          updatedCount++
        }

        // Progress indicator every 100 symbols
        if ((insertedCount + updatedCount) % 100 === 0) {
          console.log(`   Processed ${insertedCount + updatedCount}/${polygonSymbols.length} symbols...`)
        }
      } catch (error) {
        console.error(`   ❌ Failed to sync ${symbol.ticker}:`, error)
      }
    }

    console.log(`✅ Synced ${insertedCount} new + ${updatedCount} updated = ${insertedCount + updatedCount} symbols\n`)

    // Step 3: Mark missing symbols as inactive
    console.log('🔍 Checking for removed symbols...')
    const activeTickers = polygonSymbols.map((s) => s.ticker)
    
    const result = await db
      .update(symbols)
      .set({ isActive: false, lastUpdated: new Date() })
      .where(sql`${symbols.ticker} NOT IN (${sql.join(activeTickers.map((t) => sql`${t}`), sql`, `)}) AND ${symbols.isActive} = true`)

    console.log(`✅ Marked ${result.rowCount || 0} symbols as inactive\n`)

    // Step 4: Calculate 24h USD volume for ranking
    console.log('📊 Calculating 24h USD volume for volume ranking...')
    console.log('   (This may take a while - fetching daily bars for all symbols)')

    const allSymbols = await db.select().from(symbols).where(sql`${symbols.isActive} = true`)
    let volumeCalculated = 0
    let volumeFailed = 0

    for (const symbol of allSymbols) {
      try {
        const dailyBar = await getDailyBar(symbol.ticker)

        if (dailyBar && dailyBar.volume && dailyBar.vwap) {
          // USD Volume = Token Volume × VWAP
          const usdVolume = dailyBar.volume * dailyBar.vwap

          await db
            .update(symbols)
            .set({
              volume24hUsd: usdVolume.toFixed(2),
              lastUpdated: new Date(),
            })
            .where(sql`${symbols.ticker} = ${symbol.ticker}`)

          volumeCalculated++
        } else {
          volumeFailed++
        }

        // Progress indicator every 50 symbols
        if ((volumeCalculated + volumeFailed) % 50 === 0) {
          console.log(
            `   Processed ${volumeCalculated + volumeFailed}/${allSymbols.length} (${volumeCalculated} success, ${volumeFailed} failed)`
          )
        }

        // Rate limiting: small delay between requests
        await new Promise((resolve) => setTimeout(resolve, 50))
      } catch (error) {
        volumeFailed++
        console.error(`   ❌ Failed to calculate volume for ${symbol.ticker}:`, error)
      }
    }

    console.log(
      `✅ Calculated volume for ${volumeCalculated}/${allSymbols.length} symbols (${volumeFailed} failed)\n`
    )

    // Step 5: Rank symbols by USD volume
    console.log('🏆 Ranking symbols by 24h USD volume...')

    await db.execute(sql`
      UPDATE ${symbols}
      SET volume_rank = subquery.rank
      FROM (
        SELECT ${symbols.id}, 
               ROW_NUMBER() OVER (ORDER BY CAST(${symbols.volume24hUsd} AS NUMERIC) DESC NULLS LAST) as rank
        FROM ${symbols}
        WHERE ${symbols.isActive} = true
      ) AS subquery
      WHERE ${symbols.id} = subquery.id
    `)

    console.log('✅ Volume ranking complete\n')

    // Step 6: Show top 10 symbols
    console.log('🔝 Top 10 symbols by 24h USD volume:')
    const top10 = await db
      .select()
      .from(symbols)
      .where(sql`${symbols.isActive} = true AND ${symbols.volumeRank} IS NOT NULL`)
      .orderBy(sql`${symbols.volumeRank} ASC`)
      .limit(10)

    top10.forEach((symbol, index) => {
      const volume = parseFloat(symbol.volume24hUsd || '0')
      const volumeFormatted = volume.toLocaleString('en-US', {
        style: 'currency',
        currency: 'USD',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
      })
      console.log(`   ${index + 1}. ${symbol.ticker.padEnd(15)} ${symbol.name.padEnd(20)} ${volumeFormatted}`)
    })

    console.log('\n✅ Symbol sync complete!')
  } catch (error) {
    console.error('❌ Symbol sync failed:', error)
    process.exit(1)
  }
}

// Run the script
syncSymbols()
  .then(() => {
    console.log('\n👋 Done!')
    process.exit(0)
  })
  .catch((error) => {
    console.error('\n❌ Fatal error:', error)
    process.exit(1)
  })

