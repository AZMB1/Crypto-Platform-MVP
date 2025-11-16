/**
 * Shared Types and Constants
 * Used across the application for consistency
 */

/**
 * Supported Timeframes
 * Must match database enum constraint
 */
export type Timeframe = '1h' | '4h' | '1d' | '1w' | '1m'

/**
 * All supported timeframes as array
 */
export const SUPPORTED_TIMEFRAMES: readonly Timeframe[] = ['1h', '4h', '1d', '1w', '1m'] as const

/**
 * Timeframe Display Names
 */
export const TIMEFRAME_LABELS: Record<Timeframe, string> = {
  '1h': '1 Hour',
  '4h': '4 Hours',
  '1d': '1 Day',
  '1w': '1 Week',
  '1m': '1 Month',
}

/**
 * Cache TTL (Time To Live) in seconds
 */
export const CACHE_TTL = {
  FRESH_CANDLES: 3600, // 1 hour
  PREDICTION: 900, // 15 minutes
  SYMBOL_METADATA: 86400, // 24 hours
  TOP_SYMBOLS: 3600, // 1 hour
} as const

/**
 * Prediction Configuration
 */
export const PREDICTION_CONFIG = {
  MAX_STEPS: 30, // Maximum forecast steps
  MIN_CONFIDENCE: 0.0, // Minimum confidence score
  MAX_CONFIDENCE: 1.0, // Maximum confidence score
  REQUIRED_CANDLES: 200, // Number of historical candles needed for prediction
} as const

/**
 * Training Configuration
 */
export const TRAINING_CONFIG = {
  TOP_N_SYMBOLS: 500, // Top N symbols by USD volume for training
  UPDATE_FREQUENCY: 'weekly', // How often to retrain models
} as const

/**
 * Direction Type
 */
export type Direction = 'bullish' | 'bearish' | 'neutral'

