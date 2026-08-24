import { Candle, MarketSymbol, Timeframe } from '../types/market.types';

export class CandleAggregatorService {
  // Rolling partial candle state for custom sub-minute and multi-minute aggregation
  private static activeBuckets: Map<string, Candle> = new Map();

  /**
   * Convert timeframe string into millisecond duration
   */
  public static getDurationMs(timeframe: Timeframe): number {
    switch (timeframe) {
      case '5s':
        return 5 * 1000;
      case '10s':
        return 10 * 1000;
      case '15s':
        return 15 * 1000;
      case '30s':
        return 30 * 1000;
      case '1m':
        return 60 * 1000;
      case '2m':
        return 2 * 60 * 1000;
      case '5m':
        return 5 * 60 * 1000;
      case '1h':
        return 60 * 60 * 1000;
      case '2h':
        return 2 * 60 * 60 * 1000;
      case '3h':
        return 3 * 60 * 60 * 1000;
      default:
        return 60 * 1000;
    }
  }

  /**
   * Determine if the timeframe is natively supported by Binance kline endpoint
   */
  public static isNativeBinanceInterval(timeframe: Timeframe): boolean {
    return ['1m', '5m', '1h', '2h'].includes(timeframe);
  }

  /**
   * Get the underlying base interval to fetch for custom timeframe aggregation
   */
  public static getBaseFetchInterval(timeframe: Timeframe): { interval: string; multiplier: number } {
    switch (timeframe) {
      case '5s':
      case '10s':
      case '15s':
      case '30s':
        return { interval: '1s', multiplier: 1 };
      case '2m':
        return { interval: '1m', multiplier: 2 };
      case '3h':
        return { interval: '1h', multiplier: 3 };
      default:
        return { interval: timeframe, multiplier: 1 };
    }
  }

  /**
   * Calculate exact UTC bucket start time
   */
  public static getBucketStartTime(timestamp: number, durationMs: number): number {
    return Math.floor(timestamp / durationMs) * durationMs;
  }

  /**
   * Process a price tick / trade into a sub-minute aggregated candle
   */
  public static processTick(
    symbol: MarketSymbol,
    timeframe: Timeframe,
    price: number,
    volume: number,
    timestamp: number
  ): { candle: Candle; wasClosed: boolean; closedCandle?: Candle } {
    const durationMs = this.getDurationMs(timeframe);
    const bucketOpenTime = this.getBucketStartTime(timestamp, durationMs);
    const bucketCloseTime = bucketOpenTime + durationMs - 1;
    const bucketKey = `${symbol}:${timeframe}`;

    let current = this.activeBuckets.get(bucketKey);
    let closedCandle: Candle | undefined;
    let wasClosed = false;

    if (!current || current.openTime !== bucketOpenTime) {
      // Previous bucket closed
      if (current && current.openTime < bucketOpenTime) {
        current.isClosed = true;
        closedCandle = { ...current };
        wasClosed = true;
      }

      // Start new bucket
      current = {
        symbol,
        timeframe,
        openTime: bucketOpenTime,
        closeTime: bucketCloseTime,
        open: price,
        high: price,
        low: price,
        close: price,
        volume: volume,
        isClosed: false,
        source: 'aggregated',
      };
      this.activeBuckets.set(bucketKey, current);
    } else {
      // Update existing bucket
      current.high = Math.max(current.high, price);
      current.low = Math.min(current.low, price);
      current.close = price;
      current.volume += volume;
      this.activeBuckets.set(bucketKey, current);
    }

    return {
      candle: { ...current },
      wasClosed,
      closedCandle,
    };
  }

  /**
   * Aggregate a list of base candles (e.g. 1m to 2m, or 1h to 3h)
   */
  public static aggregateCandles(
    baseCandles: Candle[],
    targetTimeframe: Timeframe,
    targetSymbol: MarketSymbol
  ): Candle[] {
    if (!baseCandles.length) return [];

    const durationMs = this.getDurationMs(targetTimeframe);
    const buckets: Map<number, Candle> = new Map();

    for (const c of baseCandles) {
      const bucketOpenTime = this.getBucketStartTime(c.openTime, durationMs);
      const bucketCloseTime = bucketOpenTime + durationMs - 1;

      let b = buckets.get(bucketOpenTime);
      if (!b) {
        b = {
          symbol: targetSymbol,
          timeframe: targetTimeframe,
          openTime: bucketOpenTime,
          closeTime: bucketCloseTime,
          open: c.open,
          high: c.high,
          low: c.low,
          close: c.close,
          volume: c.volume,
          isClosed: c.isClosed && Date.now() > bucketCloseTime,
          source: 'aggregated',
        };
        buckets.set(bucketOpenTime, b);
      } else {
        b.high = Math.max(b.high, c.high);
        b.low = Math.min(b.low, c.low);
        b.close = c.close; // latest close
        b.volume += c.volume;
        b.isClosed = c.isClosed && Date.now() > bucketCloseTime;
      }
    }

    return Array.from(buckets.values()).sort((a, b) => a.openTime - b.openTime);
  }
}
