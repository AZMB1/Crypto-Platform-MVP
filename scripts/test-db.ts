/**
 * Test Database and Redis Connections
 * Run with: tsx scripts/test-db.ts
 */

import { testConnection, closeConnections, getDatabaseStats } from '../lib/db/queries'
import { testRedisConnection, closeRedisConnection } from '../lib/redis'

async function main() {
  console.log('🔍 Testing database and Redis connections...\n')

  // Test Database
  try {
    console.log('Testing PostgreSQL connection...')
    await testConnection()
    console.log('✅ PostgreSQL: Connected successfully')

    // Get database stats
    const stats = await getDatabaseStats()
    console.log('📊 Database Statistics:')
    console.log(`   - Symbols: ${stats.symbols}`)
    console.log(`   - Models: ${stats.models}`)
    console.log(`   - Predictions: ${stats.predictions}`)
    console.log(`   - Prediction Steps: ${stats.predictionSteps}`)
  } catch (error) {
    console.error('❌ PostgreSQL: Connection failed')
    console.error(error)
  }

  console.log()

  // Test Redis
  try {
    console.log('Testing Redis connection...')
    await testRedisConnection()
    console.log('✅ Redis: Connected successfully')
  } catch (error) {
    console.error('❌ Redis: Connection failed')
    console.error(error)
  }

  // Cleanup
  console.log('\n🧹 Closing connections...')
  await closeConnections()
  await closeRedisConnection()
  console.log('✅ All connections closed')
}

main().catch(console.error)

