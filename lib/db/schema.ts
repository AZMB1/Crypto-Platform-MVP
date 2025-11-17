import { boolean, index, integer, jsonb, numeric, pgTable, timestamp, uuid, varchar } from 'drizzle-orm/pg-core'
import { sql } from 'drizzle-orm'

/**
 * Symbols Table
 * Stores ALL Polygon.io cryptocurrency symbols (~1000-5000 rows)
 * Used for coin selector and determining top 500 for training
 */
export const symbols = pgTable(
  'symbols',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    ticker: varchar('ticker', { length: 20 }).notNull().unique(),
    name: varchar('name', { length: 255 }).notNull(),
    baseCurrency: varchar('base_currency', { length: 20 }),
    quoteCurrency: varchar('quote_currency', { length: 20 }),
    isActive: boolean('is_active').default(true),

    // Ranking columns (determines top 500 for training)
    volume24hUsd: numeric('volume_24h_usd', { precision: 20, scale: 2 }),
    volumeRank: integer('volume_rank'),

    lastUpdated: timestamp('last_updated'),
    createdAt: timestamp('created_at').defaultNow(),
  },
  (table) => ({
    tickerIdx: index('idx_symbols_ticker').on(table.ticker),
    volumeRankIdx: index('idx_symbols_volume_rank').on(table.volumeRank),
    activeIdx: index('idx_symbols_active').on(table.isActive),
  })
)

/**
 * Models Table
 * ML model metadata - ONE model per timeframe (5 rows total)
 * Each model trained on ALL top 500 coins combined
 */
export const models = pgTable(
  'models',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    timeframe: varchar('timeframe', { length: 10 }).notNull().$type<'1h' | '4h' | '1d' | '1w' | '1m'>(),
    version: varchar('version', { length: 50 }).notNull(),
    trainingStart: timestamp('training_start').notNull(),
    trainingEnd: timestamp('training_end').notNull(),
    numSymbols: integer('num_symbols').notNull(), // Number trained on (500)
    topSymbols: jsonb('top_symbols'), // ["X:BTCUSD", "X:ETHUSD", ...]
    accuracyAvg: numeric('accuracy_avg', { precision: 5, scale: 4 }),
    featureCount: integer('feature_count'), // 150+
    modelPath: varchar('model_path', { length: 255 }).notNull(), // "/models/1d_v1.0.pkl"
    isActive: boolean('is_active').default(false),
    trainedAt: timestamp('trained_at').notNull(),
    createdAt: timestamp('created_at').defaultNow(),
  },
  (table) => ({
    timeframeIdx: index('idx_models_timeframe').on(table.timeframe),
    activeIdx: index('idx_models_active').on(table.isActive),
    timeframeVersionUnique: index('idx_models_timeframe_version').on(table.timeframe, table.version),
  })
)

/**
 * Predictions Table
 * Cached prediction results for ANY symbol
 * user_id nullable in Phase I (no auth), FK added in Phase II
 */
export const predictions = pgTable(
  'predictions',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    symbolId: uuid('symbol_id')
      .notNull()
      .references(() => symbols.id, { onDelete: 'cascade' }),
    userId: uuid('user_id'), // Nullable in Phase I, FK added in Phase II
    timeframe: varchar('timeframe', { length: 10 }).notNull().$type<'1h' | '4h' | '1d' | '1w' | '1m'>(),
    modelId: uuid('model_id')
      .notNull()
      .references(() => models.id),
    predictionDate: timestamp('prediction_date').notNull(),
    predictUntil: timestamp('predict_until').notNull(),
    numSteps: integer('num_steps').notNull(),
    confidenceAvg: numeric('confidence_avg', { precision: 5, scale: 4 }),
    direction: varchar('direction', { length: 10 }),
    keyIndicators: jsonb('key_indicators'),
    createdAt: timestamp('created_at').defaultNow(),
  },
  (table) => ({
    symbolIdIdx: index('idx_predictions_symbol_id').on(table.symbolId),
    userIdIdx: index('idx_predictions_user_id').on(table.userId),
    timeframeIdx: index('idx_predictions_timeframe').on(table.timeframe),
    modelIdIdx: index('idx_predictions_model_id').on(table.modelId),
    createdAtIdx: index('idx_predictions_created_at').on(table.createdAt),
  })
)

/**
 * Prediction Steps Table
 * Individual forecast candles (up to 30 per prediction)
 */
export const predictionSteps = pgTable(
  'prediction_steps',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    predictionId: uuid('prediction_id')
      .notNull()
      .references(() => predictions.id, { onDelete: 'cascade' }),
    stepNumber: integer('step_number').notNull(),
    timestamp: timestamp('timestamp').notNull(),
    open: numeric('open', { precision: 20, scale: 8 }).notNull(),
    high: numeric('high', { precision: 20, scale: 8 }).notNull(),
    low: numeric('low', { precision: 20, scale: 8 }).notNull(),
    close: numeric('close', { precision: 20, scale: 8 }).notNull(),
    confidence: numeric('confidence', { precision: 5, scale: 4 }),
    direction: varchar('direction', { length: 10 }),
    actualClose: numeric('actual_close', { precision: 20, scale: 8 }),
    isAccurate: boolean('is_accurate'),
  },
  (table) => ({
    predictionIdIdx: index('idx_prediction_steps_prediction_id').on(table.predictionId),
    timestampIdx: index('idx_prediction_steps_timestamp').on(table.timestamp),
    uniquePredictionStep: index('idx_prediction_steps_unique').on(table.predictionId, table.stepNumber),
  })
)

