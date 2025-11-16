import { testConnection } from '@/lib/db'
import { testRedisConnection } from '@/lib/redis'

export async function GET() {
  const checks: {
    database: string
    redis: string
    timestamp: string
  } = {
    database: 'unknown',
    redis: 'unknown',
    timestamp: new Date().toISOString(),
  }

  // Test database connection
  try {
    await testConnection()
    checks.database = 'connected'
  } catch (error) {
    checks.database = 'failed'
    console.error('Database health check failed:', error)
  }

  // Test Redis connection
  try {
    await testRedisConnection()
    checks.redis = 'connected'
  } catch (error) {
    checks.redis = 'failed'
    console.error('Redis health check failed:', error)
  }

  const isHealthy = checks.database === 'connected' && checks.redis === 'connected'
  const statusCode = isHealthy ? 200 : 503

  return Response.json(
    {
      status: isHealthy ? 'ok' : 'degraded',
      checks,
    },
    { status: statusCode }
  )
}
