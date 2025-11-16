import { drizzle } from 'drizzle-orm/node-postgres'
import { Pool } from 'pg'
import * as schema from './schema'

// Validate DATABASE_URL is present (skip during build time)
if (!process.env.DATABASE_URL && process.env.NODE_ENV !== 'production') {
  console.warn('⚠️  DATABASE_URL not set - database features will be unavailable')
}

// Create PostgreSQL connection pool (lazy initialization)
const pool = process.env.DATABASE_URL
  ? new Pool({
      connectionString: process.env.DATABASE_URL,
      max: 20, // Maximum number of clients in the pool
      idleTimeoutMillis: 30000, // Close idle clients after 30 seconds
      connectionTimeoutMillis: 2000, // Return an error after 2 seconds if connection cannot be established
    })
  : null

// Initialize Drizzle ORM with the connection pool
export const db = pool ? drizzle(pool, { schema }) : null as any

// Export the pool for direct access if needed
export { pool }

// Export all schema tables for type-safe queries
export { symbols, models, predictions, predictionSteps } from './schema'

/**
 * Test database connection
 * Returns true if connection is successful, throws error otherwise
 */
export async function testConnection(): Promise<boolean> {
  try {
    const client = await pool.connect()
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
  await pool.end()
}

