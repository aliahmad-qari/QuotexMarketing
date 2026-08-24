import mongoose, { Schema, Document } from 'mongoose';
import { MarketSymbol, Timeframe } from '../types/market.types';

export interface ICandleDocument extends Document {
  symbol: MarketSymbol;
  timeframe: Timeframe;
  openTime: number;
  closeTime: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
  isClosed: boolean;
  source: string;
  createdAt: Date;
  updatedAt: Date;
}

const CandleSchema: Schema = new Schema(
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
    openTime: {
      type: Number,
      required: true,
      index: true,
    },
    closeTime: {
      type: Number,
      required: true,
    },
    open: {
      type: Number,
      required: true,
    },
    high: {
      type: Number,
      required: true,
    },
    low: {
      type: Number,
      required: true,
    },
    close: {
      type: Number,
      required: true,
    },
    volume: {
      type: Number,
      required: true,
      default: 0,
    },
    isClosed: {
      type: Boolean,
      required: true,
      default: true,
    },
    source: {
      type: String,
      default: 'binance_rest',
    },
  },
  {
    timestamps: true,
  }
);

// Compound index for fast queries by symbol, timeframe and time
CandleSchema.index({ symbol: 1, timeframe: 1, openTime: -1 }, { unique: true });

export const CandleModel = mongoose.models.Candle || mongoose.model<ICandleDocument>('Candle', CandleSchema);
