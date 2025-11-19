/**
 * Database Migration Script
 * Runs migrations on deployment
 * Usage: tsx scripts/migrate.ts
 */

import { drizzle } from 'drizzle-orm/node-postgres'
import { migrate } from 'drizzle-orm/node-postgres/migrator'
import { Pool } from 'pg'

async function runMigrations() {
  console.log('🔄 Starting database migrations...')

  // Prefer DATABASE_PUBLIC_URL (for Vercel), fallback to DATABASE_URL (for Railway)
  const databaseUrl = process.env.DATABASE_PUBLIC_URL || process.env.DATABASE_URL

  if (!databaseUrl) {
    console.error('❌ DATABASE_URL or DATABASE_PUBLIC_URL environment variable is not set')
    process.exit(1)
  }

  const pool = new Pool({
    connectionString: databaseUrl,
    max: 1, // Use single connection for migrations
  })

  const db = drizzle(pool)

  try {
    console.log('📦 Running migrations from ./drizzle folder...')
    await migrate(db, { migrationsFolder: './drizzle' })
    console.log('✅ Migrations completed successfully')
  } catch (error) {
    console.error('❌ Migration failed:', error)
    process.exit(1)
  } finally {
    await pool.end()
    console.log('🔌 Database connection closed')
  }
}

runMigrations()

