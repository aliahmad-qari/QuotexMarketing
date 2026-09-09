import { describe, expect, it } from 'vitest';
import { PredictionEngineService } from './PredictionEngineService';
import { Candle } from '../types/market.types';

const startTime = 1_700_000_000_000;
const durationMs = 60_000;

function candle(
  index: number,
  open: number,
  close: number,
  isClosed = true,
  timeframe: Candle['timeframe'] = '1m',
  source: Candle['source'] = 'binance_ws'
): Candle {
  return {
    symbol: 'BTCUSDT',
    timeframe,
    openTime: startTime + index * durationMs,
    closeTime: startTime + (index + 1) * durationMs - 1,
    open,
    high: Math.max(open, close) + 1,
    low: Math.min(open, close) - 1,
    close,
    volume: 100,
    isClosed,
    source,
  };
}

describe('PredictionEngineService', () => {
  it('uses only closed candles when calculating indicators from a closed anchor candle', () => {
    const closedCandles = Array.from({ length: 20 }, (_, index) => candle(index, 101, 100));
    const activeCandle = candle(20, 100, 130, false);
    const closedAnchor = closedCandles[closedCandles.length - 1];

    const predictions = PredictionEngineService.generatePredictions(
      [...closedCandles, activeCandle],
      'BTCUSDT',
      '1m',
      closedAnchor
    );

    expect(predictions).not.toBeNull();
    expect(predictions!.prediction1.targetCandleOpenTime).toBe(activeCandle.openTime);
    expect(predictions!.prediction1.issuedAt).toBe(activeCandle.openTime);
    expect(predictions!.prediction1.currentPriceAtIssue).toBe(closedAnchor.close);
    expect(predictions!.prediction1.indicatorSnapshot.candleBodyPressure).toBeLessThan(0);
  });

  it('does not backfill a prediction from an already active incomplete candle', () => {
    const closedCandles = Array.from({ length: 20 }, (_, index) => candle(index, 100, 101));
    const activeCandle = candle(20, 101, 120, false);

    const predictions = PredictionEngineService.generatePredictions(
      [...closedCandles, activeCandle],
      'BTCUSDT',
      '1m',
      activeCandle
    );

    expect(predictions).toBeNull();
  });

  it('locks the next candle prediction at the next candle open after a candle closes', () => {
    const history = Array.from({ length: 20 }, (_, index) => candle(index, 100 + index, 101 + index));
    const closedCandle = history[history.length - 1];

    const predictions = PredictionEngineService.generatePredictions(
      history,
      'BTCUSDT',
      '1m',
      closedCandle
    );

    expect(predictions).not.toBeNull();
    expect(predictions!.prediction1.targetCandleOpenTime).toBe(closedCandle.openTime + durationMs);
    expect(predictions!.prediction1.issuedAt).toBe(closedCandle.openTime + durationMs);
    expect(predictions!.prediction1.currentPriceAtIssue).toBe(closedCandle.close);
    expect(predictions!.prediction2.targetCandleOpenTime).toBe(closedCandle.openTime + durationMs * 2);
  });

  it('does not generate a prediction before enough closed candles exist', () => {
    const closedCandles = Array.from({ length: 19 }, (_, index) => candle(index, 100, 101));
    const activeCandle = candle(19, 101, 102, false);

    const predictions = PredictionEngineService.generatePredictions(
      [...closedCandles, activeCandle],
      'BTCUSDT',
      '1m',
      activeCandle
    );

    expect(predictions).toBeNull();
  });

  it('does not generate sub-minute predictions from retagged 1m REST placeholders', () => {
    const placeholderCandles = Array.from({ length: 20 }, (_, index) =>
      candle(index, 100, 101, true, '30s', 'binance_rest')
    );

    const predictions = PredictionEngineService.generatePredictions(
      placeholderCandles,
      'BTCUSDT',
      '30s',
      placeholderCandles[placeholderCandles.length - 1]
    );

    expect(predictions).toBeNull();
  });
});
