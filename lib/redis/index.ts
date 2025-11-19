import Redis from 'ioredis'

/**
 * Redis Client Configuration
 * Singleton instance for connection pooling
 * Only connects at runtime, not during build
 */
let redisInstance: Redis | null = null

function getRedisClient(): Redis {
  // Skip Redis connection during build
  if (process.env.NEXT_PHASE === 'phase-production-build') {
    throw new Error('Redis not available during build')
  }

  // Prefer REDIS_PUBLIC_URL (for Vercel), fallback to REDIS_URL (for Railway)
  const redisUrl = process.env.REDIS_PUBLIC_URL || process.env.REDIS_URL

  if (!redisUrl) {
    throw new Error('REDIS_URL or REDIS_PUBLIC_URL environment variable must be set')
  }

  if (!redisInstance) {
    redisInstance = new Redis(redisUrl, {
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
    })

    // Redis event handlers
    redisInstance.on('connect', () => {
      console.log('✅ Redis: Connected')
    })

    redisInstance.on('ready', () => {
      console.log('✅ Redis: Ready to accept commands')
    })

    redisInstance.on('error', (err) => {
      console.error('❌ Redis: Error -', err.message)
    })

    redisInstance.on('close', () => {
      console.log('⚠️ Redis: Connection closed')
    })

    redisInstance.on('reconnecting', () => {
      console.log('🔄 Redis: Reconnecting...')
    })
  }

  return redisInstance
}

/**
 * Export the Redis client getter
 */
export const redis = new Proxy({} as Redis, {
  get(_target, prop) {
    return getRedisClient()[prop as keyof Redis]
  },
})

/**
 * Test Redis connection
 */
export async function testRedisConnection(): Promise<boolean> {
  try {
    const result = await getRedisClient().ping()
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
  if (redisInstance) {
    await getRedisClient().quit()
  }
}

/**
 * Graceful shutdown handler
 */
export async function gracefulShutdown(): Promise<void> {
  console.log('Closing Redis connection...')
  await closeRedisConnection()
  console.log('Redis connection closed')
}

