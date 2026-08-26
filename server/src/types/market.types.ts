export type MarketSymbol =
  // ── Binance Spot Crypto ──────────────────────────────────────────────────
  | 'BTCUSDT'
  | 'ETHUSDT'
  | 'BNBUSDT'
  | 'SOLUSDT'
  | 'XRPUSDT'
  | 'ADAUSDT'
  | 'DOGEUSDT'
  | 'AVAXUSDT'
  | 'DOTUSDT'
  | 'LTCUSDT'
  | 'LINKUSDT'
  | 'ATOMUSDT'
  | 'UNIUSDT'
  | 'NEARUSDT'
  | 'AAVEUSDT'
  | 'MATICUSDT'
  | 'SHIBUSDT'
  | 'FTMUSDT'
  | 'OPUSDT'
  | 'ARBUSDT'
  | 'INJUSDT'
  | 'SUIUSDT'
  // ── Forex (Twelve Data live ticks → candles) ─────────────────────────────
  | 'EURUSD'
  | 'GBPUSD'
  | 'USDJPY'
  | 'AUDUSD'
  | 'USDCAD'
  | 'USDCHF';

export type Timeframe =
  | '5s'
  | '10s'
  | '15s'
  | '30s'
  | '1m'
  | '2m'
  | '5m'
  | '1h'
  | '2h'
  | '3h';

export interface Candle {
  symbol: MarketSymbol;
  timeframe: Timeframe;
  openTime: number; // UTC timestamp ms
  closeTime: number; // UTC timestamp ms
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
  isClosed: boolean;
  source: 'binance_rest' | 'binance_ws' | 'aggregated' | 'forex_ws' | 'forex_rest';
}

export type Direction = 'UP' | 'DOWN';
export type EvaluationResult = 'CORRECT' | 'INCORRECT' | 'NEUTRAL';

export interface IndicatorSnapshot {
  ema9: number;
  ema21: number;
  rsi14: number;
  macd: {
    macdLine: number;
    signalLine: number;
    histogram: number;
  };
  atr14: number;
  momentum: number; // percentage
  candleBodyPressure: number; // -1 (strong sell) to +1 (strong buy)
  upperWickRatio: number;
  lowerWickRatio: number;
  greenRedRatio: number; // ratio of green candles in last 10
  volatility: number;
  volumeChange: number; // % change vs 20 SMA
  trendStrength: number; // 0 to 100
}

export interface IndicatorContribution {
  indicator: string;
  bias: Direction | 'NEUTRAL';
  weight: number;
  description: string;
}

export interface Prediction {
  id?: string;
  symbol: MarketSymbol;
  timeframe: Timeframe;
  targetCandleOpenTime: number; // UTC timestamp ms
  horizon: 1 | 2; // +1 or +2 candle
  predictedDirection: Direction;
  confidence: number; // 50 - 80% for +1, 50 - 75% for +2
  indicatorSnapshot: IndicatorSnapshot;
  topContributors: IndicatorContribution[];
  explanation: string;
  modelVersion: string;
  issuedAt: number; // UTC timestamp ms
  currentPriceAtIssue: number;
  actualDirection?: Direction | 'NEUTRAL';
  actualCandleOpen?: number;
  actualCandleClose?: number;
  result?: EvaluationResult;
  evaluatedAt?: number;
}

export interface MarketMetadata {
  symbol: MarketSymbol;
  baseAsset: string;
  quoteAsset: string;
  priceDecimals: number;
  quantityDecimals: number;
  lastPrice: number;
  priceChange24h: number;
  priceChangePercent24h: number;
  high24h: number;
  low24h: number;
  volume24h: number;
  quoteVolume24h: number;
  lastUpdated: number;
}

export interface PerformanceStats {
  totalEvaluated: number;
  correctCount: number;
  incorrectCount: number;
  neutralCount: number;
  overallAccuracy: number;
  horizon1Accuracy: number;
  horizon1Count: number;
  horizon2Accuracy: number;
  horizon2Count: number;
  byAsset: Record<string, { total: number; correct: number; accuracy: number }>;
  byTimeframe: Record<string, { total: number; correct: number; accuracy: number }>;
  byConfidenceBand: {
    '50-59%': { total: number; correct: number; accuracy: number };
    '60-69%': { total: number; correct: number; accuracy: number };
    '70-80%': { total: number; correct: number; accuracy: number };
  };
}

export interface ApiResponse<T = any> {
  success: boolean;
  data: T | null;
  meta?: Record<string, any>;
  error?: string | null;
}
