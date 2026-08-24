export type MarketSymbol =
  | 'BTCUSDT'
  | 'ETHUSDT'
  | 'BNBUSDT'
  | 'SOLUSDT'
  | 'XRPUSDT'
  | 'ADAUSDT'
  | 'DOGEUSDT';

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
  openTime: number;
  closeTime: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
  isClosed: boolean;
  source: 'binance_rest' | 'binance_ws' | 'aggregated';
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
  momentum: number;
  candleBodyPressure: number;
  upperWickRatio: number;
  lowerWickRatio: number;
  greenRedRatio: number;
  volatility: number;
  volumeChange: number;
  trendStrength: number;
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
  targetCandleOpenTime: number;
  horizon: 1 | 2;
  predictedDirection: Direction;
  confidence: number;
  indicatorSnapshot: IndicatorSnapshot;
  topContributors: IndicatorContribution[];
  explanation: string;
  modelVersion: string;
  issuedAt: number;
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

export type ConnectionStatus = 'connected' | 'connecting' | 'reconnecting' | 'disconnected' | 'stale';

export type PageRoute = 'landing' | 'dashboard' | 'performance' | 'methodology' | 'risk-disclosure' | 'about';

export interface IndicatorWeightsConfig {
  emaWeight: number;
  rsiWeight: number;
  macdWeight: number;
  candlePressureWeight: number;
  wickRejectionWeight: number;
  volumeSurgeWeight: number;
  maxConfidenceH1: number;
  maxConfidenceH2: number;
  decayRatePercent: number;
}

export type ChartType = 'candles' | 'area' | 'line' | 'bars';
