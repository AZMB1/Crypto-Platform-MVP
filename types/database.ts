import { InferInsertModel, InferSelectModel } from 'drizzle-orm'
import { symbols, models, predictions, predictionSteps } from '@/lib/db/schema'

/**
 * Database Types
 * Auto-generated from Drizzle schema for type-safe database operations
 */

// Symbol Types
export type Symbol = InferSelectModel<typeof symbols>
export type SymbolInsert = InferInsertModel<typeof symbols>
export type SymbolUpdate = Partial<SymbolInsert>

// Model Types
export type Model = InferSelectModel<typeof models>
export type ModelInsert = InferInsertModel<typeof models>
export type ModelUpdate = Partial<ModelInsert>

// Prediction Types
export type Prediction = InferSelectModel<typeof predictions>
export type PredictionInsert = InferInsertModel<typeof predictions>
export type PredictionUpdate = Partial<PredictionInsert>

// Prediction Step Types
export type PredictionStep = InferSelectModel<typeof predictionSteps>
export type PredictionStepInsert = InferInsertModel<typeof predictionSteps>
export type PredictionStepUpdate = Partial<PredictionStepInsert>

/**
 * Full Prediction with Steps
 * Represents a complete prediction including all forecast candles
 */
export interface PredictionWithSteps extends Prediction {
  steps: PredictionStep[]
  symbol: Symbol
  model: Model
}

/**
 * Symbol with Ranking
 * Includes volume rank for display purposes
 */
export interface SymbolWithRank extends Symbol {
  rank?: number
}

