import mongoose, { Schema, Document } from 'mongoose';
import { Direction, EvaluationResult, MarketSymbol, Timeframe } from '../types/market.types';

export interface IPredictionDocument extends Document {
  symbol: MarketSymbol;
  timeframe: Timeframe;
  targetCandleOpenTime: number;
  horizon: 1 | 2;
  predictedDirection: Direction;
  confidence: number;
  indicatorSnapshot: Record<string, any>;
  topContributors: Array<{
    indicator: string;
    bias: string;
    weight: number;
    description: string;
  }>;
  explanation: string;
  modelVersion: string;
  issuedAt: number;
  currentPriceAtIssue: number;
  actualDirection?: Direction | 'NEUTRAL';
  actualCandleOpen?: number;
  actualCandleClose?: number;
  result?: EvaluationResult;
  evaluatedAt?: number;
  createdAt: Date;
  updatedAt: Date;
}

const PredictionSchema: Schema = new Schema(
  {
    symbol: {
      type: String,
      required: true,
      index: true,
    },
    timeframe: {
      type: String,
      required: true,
      index: true,
    },
    targetCandleOpenTime: {
      type: Number,
      required: true,
      index: true,
    },
    horizon: {
      type: Number,
      enum: [1, 2],
      required: true,
      index: true,
    },
    predictedDirection: {
      type: String,
      enum: ['UP', 'DOWN'],
      required: true,
    },
    confidence: {
      type: Number,
      required: true,
      min: 50,
      max: 80,
    },
    indicatorSnapshot: {
      type: Schema.Types.Mixed,
      required: true,
    },
    topContributors: [
      {
        indicator: String,
        bias: String,
        weight: Number,
        description: String,
      },
    ],
    explanation: {
      type: String,
      required: true,
    },
    modelVersion: {
      type: String,
      required: true,
      default: 'indicator-v1',
    },
    issuedAt: {
      type: Number,
      required: true,
    },
    currentPriceAtIssue: {
      type: Number,
      required: true,
    },
    actualDirection: {
      type: String,
      enum: ['UP', 'DOWN', 'NEUTRAL'],
    },
    actualCandleOpen: Number,
    actualCandleClose: Number,
    result: {
      type: String,
      enum: ['CORRECT', 'INCORRECT', 'NEUTRAL'],
      index: true,
    },
    evaluatedAt: Number,
  },
  {
    timestamps: true,
  }
);

// Compound index for locking and evaluation lookups
PredictionSchema.index({ symbol: 1, timeframe: 1, targetCandleOpenTime: 1, horizon: 1 }, { unique: true });
PredictionSchema.index({ result: 1, evaluatedAt: -1 });

export const PredictionModel =
  mongoose.models.Prediction || mongoose.model<IPredictionDocument>('Prediction', PredictionSchema);
