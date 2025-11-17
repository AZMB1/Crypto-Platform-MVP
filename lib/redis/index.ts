import Redis from 'ioredis'

/**
 * Redis Client Configuration
 * Singleton instance for connection pooling
 * Only connects at runtime, not during build
 */
let redis: Redis | null = null

function getRedisClient(): Redis {
  // Skip Redis connection during build
  if (process.env.NEXT_PHASE === 'phase-production-build') {
    throw new Error('Redis not available during build')
  }

  if (!process.env.REDIS_URL) {
    throw new Error('REDIS_URL environment variable is not set')
  }

  if (!redis) {
    redis = new Redis(process.env.REDIS_URL, {
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

  return redis
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
  if (redis) {
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

