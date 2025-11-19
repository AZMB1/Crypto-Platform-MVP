import { drizzle } from 'drizzle-orm/node-postgres'
import { NodePgDatabase } from 'drizzle-orm/node-postgres'
import { Pool } from 'pg'
import * as schema from './schema'

/**
 * Database connection pool and Drizzle instance
 * Only connects at runtime, not during build
 */
let poolInstance: Pool | null = null
let dbInstance: NodePgDatabase<typeof schema> | null = null

function getPool(): Pool {
  // Skip database connection during build
  if (process.env.NEXT_PHASE === 'phase-production-build') {
    throw new Error('Database not available during build')
  }

  // Prefer DATABASE_PUBLIC_URL (for Vercel), fallback to DATABASE_URL (for Railway)
  const databaseUrl = process.env.DATABASE_PUBLIC_URL || process.env.DATABASE_URL

  if (!databaseUrl) {
    throw new Error('DATABASE_URL or DATABASE_PUBLIC_URL environment variable must be set')
  }

  if (!poolInstance) {
    poolInstance = new Pool({
      connectionString: databaseUrl,
      max: 20, // Maximum number of clients in the pool
      idleTimeoutMillis: 30000, // Close idle clients after 30 seconds
      connectionTimeoutMillis: 2000, // Return an error after 2 seconds if connection cannot be established
    })
  }

  return poolInstance
}

function getDb(): NodePgDatabase<typeof schema> {
  if (!dbInstance) {
    dbInstance = drizzle(getPool(), { schema })
  }
  return dbInstance
}

// Export db as a Proxy to lazy-load the connection
export const db = new Proxy({} as NodePgDatabase<typeof schema>, {
  get(_target, prop) {
    return getDb()[prop as keyof NodePgDatabase<typeof schema>]
  },
})

// Export the pool getter for direct access if needed
export const pool = new Proxy({} as Pool, {
  get(_target, prop) {
    return getPool()[prop as keyof Pool]
  },
})

// Export all schema tables for type-safe queries
export { symbols, models, predictions, predictionSteps } from './schema'

/**
 * Test database connection
 * Returns true if connection is successful, throws error otherwise
 */
export async function testConnection(): Promise<boolean> {
  try {
    const client = await getPool().connect()
    await client.query('SELECT NOW()')
    client.release()
    return true
  } catch (error) {
    console.error('Database connection test failed:', error)
    throw error
  }
}

/**
 * Close all database connections
 * Should be called when shutting down the application
 */
export async function closeConnections(): Promise<void> {
  if (poolInstance) {
    await getPool().end()
  }
}

