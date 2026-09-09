import { beforeEach, describe, expect, it } from 'vitest';
import { CandleAggregatorService } from './CandleAggregatorService';
import { Candle } from '../types/market.types';

const minuteMs = 60_000;
const startTime = Math.floor(1_700_000_000_000 / (2 * minuteMs)) * 2 * minuteMs;

function baseMinute(index: number, close: number, volume: number, isClosed: boolean): Candle {
  const open = close - 1;
  return {
    symbol: 'BTCUSDT',
    timeframe: '1m',
    openTime: startTime + index * minuteMs,
    closeTime: startTime + (index + 1) * minuteMs - 1,
    open,
    high: close + 2,
    low: open - 2,
    close,
    volume,
    isClosed,
    source: 'binance_ws',
  };
}

describe('CandleAggregatorService', () => {
  beforeEach(() => {
    CandleAggregatorService.resetStateForTests();
  });

  it('does not close a 2m bucket until the final base candle is closed', () => {
    const firstMinute = baseMinute(0, 101, 10, true);
    const secondMinuteLive = baseMinute(1, 102, 20, false);
    const secondMinuteClosed = baseMinute(1, 103, 25, true);

    const first = CandleAggregatorService.processKline('BTCUSDT', '2m', firstMinute);
    const live = CandleAggregatorService.processKline('BTCUSDT', '2m', secondMinuteLive);
    const closed = CandleAggregatorService.processKline('BTCUSDT', '2m', secondMinuteClosed);

    expect(first.wasClosed).toBe(false);
    expect(live.wasClosed).toBe(false);
    expect(live.candle.isClosed).toBe(false);
    expect(closed.wasClosed).toBe(true);
    expect(closed.closedCandle?.isClosed).toBe(true);
  });

  it('replaces repeated base-kline updates instead of double-counting cumulative volume', () => {
    const firstMinuteUpdate = baseMinute(0, 101, 10, false);
    const firstMinuteClosed = baseMinute(0, 102, 15, true);
    const secondMinuteClosed = baseMinute(1, 103, 25, true);

    CandleAggregatorService.processKline('BTCUSDT', '2m', firstMinuteUpdate);
    CandleAggregatorService.processKline('BTCUSDT', '2m', firstMinuteClosed);
    const result = CandleAggregatorService.processKline('BTCUSDT', '2m', secondMinuteClosed);

    expect(result.candle.volume).toBe(40);
    expect(result.closedCandle?.volume).toBe(40);
  });

  it('does not emit a duplicate close when the next bucket opens after a closed bucket', () => {
    CandleAggregatorService.processKline('BTCUSDT', '2m', baseMinute(0, 101, 10, true));
    const closed = CandleAggregatorService.processKline('BTCUSDT', '2m', baseMinute(1, 102, 20, true));
    const next = CandleAggregatorService.processKline('BTCUSDT', '2m', baseMinute(2, 103, 30, false));

    expect(closed.wasClosed).toBe(true);
    expect(next.wasClosed).toBe(false);
    expect(next.closedCandle).toBeUndefined();
  });
});
