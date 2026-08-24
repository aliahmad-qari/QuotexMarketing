import { Candle, IndicatorSnapshot } from '../types/market.types';

export class IndicatorService {
  /**
   * Calculate Exponential Moving Average (EMA)
   */
  public static calculateEMA(prices: number[], period: number): number[] {
    if (prices.length < period) return [];
    const k = 2 / (period + 1);
    const emaArray: number[] = [];

    // Simple moving average as first EMA value
    let sum = 0;
    for (let i = 0; i < period; i++) {
      sum += prices[i];
    }
    let ema = sum / period;
    emaArray.push(ema);

    // Calculate subsequent EMA values
    for (let i = period; i < prices.length; i++) {
      ema = prices[i] * k + ema * (1 - k);
      emaArray.push(ema);
    }

    return emaArray;
  }

  /**
   * Calculate Relative Strength Index (RSI)
   */
  public static calculateRSI(prices: number[], period = 14): number {
    if (prices.length <= period) return 50;

    let gains = 0;
    let losses = 0;

    for (let i = 1; i <= period; i++) {
      const diff = prices[i] - prices[i - 1];
      if (diff >= 0) gains += diff;
      else losses += Math.abs(diff);
    }

    let avgGain = gains / period;
    let avgLoss = losses / period;

    for (let i = period + 1; i < prices.length; i++) {
      const diff = prices[i] - prices[i - 1];
      if (diff >= 0) {
        avgGain = (avgGain * (period - 1) + diff) / period;
        avgLoss = (avgLoss * (period - 1)) / period;
      } else {
        avgGain = (avgGain * (period - 1)) / period;
        avgLoss = (avgLoss * (period - 1) + Math.abs(diff)) / period;
      }
    }

    if (avgLoss === 0) return 100;
    const rs = avgGain / avgLoss;
    return Math.min(100, Math.max(0, 100 - 100 / (1 + rs)));
  }

  /**
   * Calculate Moving Average Convergence Divergence (MACD)
   */
  public static calculateMACD(
    prices: number[],
    fastPeriod = 12,
    slowPeriod = 26,
    signalPeriod = 9
  ): { macdLine: number; signalLine: number; histogram: number } {
    if (prices.length < slowPeriod + signalPeriod) {
      return { macdLine: 0, signalLine: 0, histogram: 0 };
    }

    const fastEMA = this.calculateEMA(prices, fastPeriod);
    const slowEMA = this.calculateEMA(prices, slowPeriod);

    // Align fast and slow EMA series
    const macdSeries: number[] = [];
    const offset = slowPeriod - fastPeriod;

    for (let i = 0; i < slowEMA.length; i++) {
      const fastIdx = i + offset;
      if (fastIdx < fastEMA.length) {
        macdSeries.push(fastEMA[fastIdx] - slowEMA[i]);
      }
    }

    const signalEMA = this.calculateEMA(macdSeries, signalPeriod);

    const macdLine = macdSeries[macdSeries.length - 1] || 0;
    const signalLine = signalEMA[signalEMA.length - 1] || 0;
    const histogram = macdLine - signalLine;

    return { macdLine, signalLine, histogram };
  }

  /**
   * Calculate Average True Range (ATR)
   */
  public static calculateATR(candles: Candle[], period = 14): number {
    if (candles.length < 2) return 0;

    const trValues: number[] = [];
    for (let i = 1; i < candles.length; i++) {
      const current = candles[i];
      const prev = candles[i - 1];
      const tr = Math.max(
        current.high - current.low,
        Math.abs(current.high - prev.close),
        Math.abs(current.low - prev.close)
      );
      trValues.push(tr);
    }

    if (trValues.length < period) {
      return trValues.reduce((a, b) => a + b, 0) / (trValues.length || 1);
    }

    const recentTR = trValues.slice(-period);
    return recentTR.reduce((a, b) => a + b, 0) / period;
  }

  /**
   * Extract comprehensive Indicator Snapshot from historical candles
   */
  public static computeSnapshot(candles: Candle[]): IndicatorSnapshot {
    if (!candles || candles.length === 0) {
      return {
        ema9: 0,
        ema21: 0,
        rsi14: 50,
        macd: { macdLine: 0, signalLine: 0, histogram: 0 },
        atr14: 0,
        momentum: 0,
        candleBodyPressure: 0,
        upperWickRatio: 0,
        lowerWickRatio: 0,
        greenRedRatio: 0.5,
        volatility: 0,
        volumeChange: 0,
        trendStrength: 50,
      };
    }

    const closePrices = candles.map((c) => c.close);
    const lastCandle = candles[candles.length - 1];

    // EMA 9 & EMA 21
    const ema9List = this.calculateEMA(closePrices, 9);
    const ema21List = this.calculateEMA(closePrices, 21);
    const ema9 = ema9List.length > 0 ? ema9List[ema9List.length - 1] : lastCandle.close;
    const ema21 = ema21List.length > 0 ? ema21List[ema21List.length - 1] : lastCandle.close;

    // RSI 14
    const rsi14 = this.calculateRSI(closePrices, 14);

    // MACD
    const macd = this.calculateMACD(closePrices, 12, 26, 9);

    // ATR 14
    const atr14 = this.calculateATR(candles, 14);

    // Momentum (5-period rate of change)
    let momentum = 0;
    if (candles.length >= 6) {
      const pastClose = candles[candles.length - 6].close;
      momentum = pastClose > 0 ? ((lastCandle.close - pastClose) / pastClose) * 100 : 0;
    }

    // Candle anatomy & body pressure
    const range = Math.max(0.000001, lastCandle.high - lastCandle.low);
    const body = Math.abs(lastCandle.close - lastCandle.open);
    const bodyRatio = body / range;
    const isBullish = lastCandle.close >= lastCandle.open;
    const candleBodyPressure = (isBullish ? 1 : -1) * bodyRatio;

    const upperWick = isBullish ? lastCandle.high - lastCandle.close : lastCandle.high - lastCandle.open;
    const lowerWick = isBullish ? lastCandle.open - lastCandle.low : lastCandle.close - lastCandle.low;
    const upperWickRatio = Math.max(0, upperWick / range);
    const lowerWickRatio = Math.max(0, lowerWick / range);

    // Green/Red ratio in last 10 candles
    const recent = candles.slice(-10);
    const greenCount = recent.filter((c) => c.close >= c.open).length;
    const greenRedRatio = recent.length > 0 ? greenCount / recent.length : 0.5;

    // Volatility (ATR relative to price in %)
    const volatility = lastCandle.close > 0 ? (atr14 / lastCandle.close) * 100 : 0;

    // Volume Change vs 20-period Volume SMA
    let volumeChange = 0;
    if (candles.length >= 5) {
      const volSlice = candles.slice(-20);
      const avgVol = volSlice.reduce((sum, c) => sum + c.volume, 0) / volSlice.length;
      if (avgVol > 0) {
        volumeChange = ((lastCandle.volume - avgVol) / avgVol) * 100;
      }
    }

    // Trend strength (0 to 100) based on EMA separation and slope
    let trendStrength = 50;
    if (ema21 > 0) {
      const diffPct = Math.abs((ema9 - ema21) / ema21) * 100;
      trendStrength = Math.min(100, Math.max(10, Math.round(diffPct * 25 + 40)));
    }

    return {
      ema9: Number(ema9.toFixed(4)),
      ema21: Number(ema21.toFixed(4)),
      rsi14: Number(rsi14.toFixed(2)),
      macd: {
        macdLine: Number(macd.macdLine.toFixed(4)),
        signalLine: Number(macd.signalLine.toFixed(4)),
        histogram: Number(macd.histogram.toFixed(4)),
      },
      atr14: Number(atr14.toFixed(4)),
      momentum: Number(momentum.toFixed(2)),
      candleBodyPressure: Number(candleBodyPressure.toFixed(2)),
      upperWickRatio: Number(upperWickRatio.toFixed(2)),
      lowerWickRatio: Number(lowerWickRatio.toFixed(2)),
      greenRedRatio: Number(greenRedRatio.toFixed(2)),
      volatility: Number(volatility.toFixed(3)),
      volumeChange: Number(volumeChange.toFixed(1)),
      trendStrength,
    };
  }
}
