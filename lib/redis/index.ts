import Redis from 'ioredis'

// Validate REDIS_URL is present (skip during build time)
if (!process.env.REDIS_URL && process.env.NODE_ENV !== 'production') {
  console.warn('⚠️  REDIS_URL not set - caching features will be unavailable')
}

/**
 * Redis Client Configuration
 * Singleton instance for connection pooling
 */
const redis = process.env.REDIS_URL ? new Redis(process.env.REDIS_URL, {
  maxRetriesPerRequest: 3,
  enableReadyCheck: true,
  enableOfflineQueue: true,
  connectTimeout: 10000,
  retryStrategy(times) {
    const delay = Math.min(times * 50, 2000)
    return delay
  },
  reconnectOnError(err) {
    const targetError = 'READONLY'
    if (err.message.includes(targetError)) {
      // Only reconnect when the error contains "READONLY"
      return true
    }
    return false
  },
}) : null as any

// Redis event handlers
if (redis) {
  redis.on('connect', () => {
    console.log('✅ Redis: Connected')
  })

  redis.on('ready', () => {
    console.log('✅ Redis: Ready to accept commands')
  })

  redis.on('error', (err) => {
    console.error('❌ Redis: Error -', err.message)
  })

  redis.on('close', () => {
    console.log('⚠️ Redis: Connection closed')
  })

  redis.on('reconnecting', () => {
    console.log('🔄 Redis: Reconnecting...')
  })
}

/**
 * Export the Redis client
 */
export { redis }

/**
 * Test Redis connection
 */
export async function testRedisConnection(): Promise<boolean> {
  try {
    const result = await redis.ping()
    return result === 'PONG'
  } catch (error) {
    console.error('Redis connection test failed:', error)
    throw error
  }
}

/**
 * Close Redis connection
 * Should be called when shutting down the application
 */
export async function closeRedisConnection(): Promise<void> {
  await redis.quit()
}

/**
 * Graceful shutdown handler
 */
export async function gracefulShutdown(): Promise<void> {
  console.log('Closing Redis connection...')
  await closeRedisConnection()
  console.log('Redis connection closed')
}

