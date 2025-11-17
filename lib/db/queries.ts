import { and, asc, desc, eq, sql } from 'drizzle-orm'
import type {
  Model,
  Prediction,
  PredictionInsert,
  PredictionStepInsert,
  PredictionWithSteps,
  Symbol,
  SymbolInsert,
} from '@/types/database'
import type { Timeframe } from '@/types/shared'

import { db, models, predictions, predictionSteps, symbols } from './index'

/**
 * SYMBOLS QUERIES
 */

/**
 * Get a symbol by its ticker
 */
export async function getSymbolByTicker(ticker: string): Promise<Symbol | undefined> {
  const result = await db.select().from(symbols).where(eq(symbols.ticker, ticker)).limit(1)
  return result[0]
}

/**
 * Get top N symbols by USD volume rank
 */
export async function getTopSymbolsByVolume(limit: number = 500): Promise<Symbol[]> {
  return db
    .select()
    .from(symbols)
    .where(and(eq(symbols.isActive, true), sql`${symbols.volumeRank} IS NOT NULL`))
    .orderBy(asc(symbols.volumeRank))
    .limit(limit)
}

/**
 * Search symbols by ticker or name (for typeahead)
 */
export async function searchSymbols(query: string, limit: number = 20): Promise<Symbol[]> {
  const searchPattern = `%${query}%`
  return db
    .select()
    .from(symbols)
    .where(
      and(
        eq(symbols.isActive, true),
        sql`(${symbols.ticker} ILIKE ${searchPattern} OR ${symbols.name} ILIKE ${searchPattern})`
      )
    )
    .orderBy(asc(symbols.volumeRank))
    .limit(limit)
}

/**
 * Create or update a symbol
 */
export async function upsertSymbol(data: SymbolInsert): Promise<Symbol> {
  const result = await db
    .insert(symbols)
    .values(data)
    .onConflictDoUpdate({
      target: symbols.ticker,
      set: {
        name: data.name,
        baseCurrency: data.baseCurrency,
        quoteCurrency: data.quoteCurrency,
        isActive: data.isActive,
        volume24hUsd: data.volume24hUsd,
        volumeRank: data.volumeRank,
        lastUpdated: data.lastUpdated,
      },
    })
    .returning()
  return result[0]!
}

/**
 * MODELS QUERIES
 */

/**
 * Get active model for a specific timeframe
 */
export async function getActiveModelByTimeframe(timeframe: Timeframe): Promise<Model | undefined> {
  const result = await db
    .select()
    .from(models)
    .where(and(eq(models.timeframe, timeframe), eq(models.isActive, true)))
    .limit(1)
  return result[0]
}

/**
 * Get all active models
 */
export async function getAllActiveModels(): Promise<Model[]> {
  return db.select().from(models).where(eq(models.isActive, true)).orderBy(asc(models.timeframe))
}

/**
 * PREDICTIONS QUERIES
 */

/**
 * Create a new prediction with steps
 */
export async function createPrediction(
  predictionData: PredictionInsert,
  stepsData: PredictionStepInsert[]
): Promise<PredictionWithSteps> {
  // Insert prediction
  const [prediction] = await db.insert(predictions).values(predictionData).returning()

  if (!prediction) {
    throw new Error('Failed to create prediction')
  }

  // Insert prediction steps
  const stepsWithPredictionId = stepsData.map((step) => ({
    ...step,
    predictionId: prediction.id,
  }))

  const steps = await db.insert(predictionSteps).values(stepsWithPredictionId).returning()

  // Fetch related symbol and model
  const [symbol] = await db.select().from(symbols).where(eq(symbols.id, prediction.symbolId))
  const [model] = await db.select().from(models).where(eq(models.id, prediction.modelId))

  if (!symbol || !model) {
    throw new Error('Failed to fetch related symbol or model')
  }

  return {
    ...prediction,
    steps,
    symbol,
    model,
  }
}

/**
 * Get a prediction by ID with all steps
 */
export async function getPredictionById(id: string): Promise<PredictionWithSteps | undefined> {
  // Fetch prediction
  const [prediction] = await db.select().from(predictions).where(eq(predictions.id, id))

  if (!prediction) {
    return undefined
  }

  // Fetch steps
  const steps = await db
    .select()
    .from(predictionSteps)
    .where(eq(predictionSteps.predictionId, id))
    .orderBy(asc(predictionSteps.stepNumber))

  // Fetch related symbol and model
  const [symbol] = await db.select().from(symbols).where(eq(symbols.id, prediction.symbolId))
  const [model] = await db.select().from(models).where(eq(models.id, prediction.modelId))

  if (!symbol || !model) {
    return undefined
  }

  return {
    ...prediction,
    steps,
    symbol,
    model,
  }
}

/**
 * Get recent predictions for a symbol
 */
export async function getRecentPredictionsBySymbol(symbolId: string, limit: number = 10): Promise<Prediction[]> {
  return db
    .select()
    .from(predictions)
    .where(eq(predictions.symbolId, symbolId))
    .orderBy(desc(predictions.createdAt))
    .limit(limit)
}

/**
 * Get recent predictions by user (for Phase II+)
 */
export async function getRecentPredictionsByUser(userId: string, limit: number = 10): Promise<Prediction[]> {
  return db
    .select()
    .from(predictions)
    .where(eq(predictions.userId, userId))
    .orderBy(desc(predictions.createdAt))
    .limit(limit)
}

/**
 * UTILITY QUERIES
 */

/**
 * Get database statistics
 */
export async function getDatabaseStats() {
  const [symbolCount] = await db.select({ count: sql<number>`count(*)` }).from(symbols)
  const [modelCount] = await db.select({ count: sql<number>`count(*)` }).from(models)
  const [predictionCount] = await db.select({ count: sql<number>`count(*)` }).from(predictions)
  const [stepCount] = await db.select({ count: sql<number>`count(*)` }).from(predictionSteps)

  return {
    symbols: symbolCount?.count ?? 0,
    models: modelCount?.count ?? 0,
    predictions: predictionCount?.count ?? 0,
    predictionSteps: stepCount?.count ?? 0,
  }
}

