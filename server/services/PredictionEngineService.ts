import {
  Candle,
  Direction,
  IndicatorContribution,
  IndicatorSnapshot,
  MarketSymbol,
  Prediction,
  Timeframe,
} from '../types/market.types';
import { IndicatorService } from './IndicatorService';

export class PredictionEngineService {
  private static MODEL_VERSION = process.env.PREDICTION_MODEL_VERSION || 'indicator-v1';

  /**
   * Deterministically generate +1 and +2 candle predictions based on indicator agreement
   */
  public static generatePredictions(
    candles: Candle[],
    symbol: MarketSymbol,
    timeframe: Timeframe,
    currentCandle: Candle
  ): { prediction1: Prediction; prediction2: Prediction } {
    const snapshot = IndicatorService.computeSnapshot(candles);
    const contributors: IndicatorContribution[] = [];
    let bullishScore = 0;
    let bearishScore = 0;

    // 1. Trend Filter: EMA 9 vs EMA 21
    if (snapshot.ema9 > snapshot.ema21) {
      const weight = 2.0;
      bullishScore += weight;
      contributors.push({
        indicator: 'EMA Cross (9 / 21)',
        bias: 'UP',
        weight,
        description: `Bullish alignment: EMA 9 ($${snapshot.ema9}) is above EMA 21 ($${snapshot.ema21}) with ${snapshot.trendStrength}% trend strength.`,
      });
    } else if (snapshot.ema9 < snapshot.ema21) {
      const weight = 2.0;
      bearishScore += weight;
      contributors.push({
        indicator: 'EMA Cross (9 / 21)',
        bias: 'DOWN',
        weight,
        description: `Bearish alignment: EMA 9 ($${snapshot.ema9}) is below EMA 21 ($${snapshot.ema21}) with ${snapshot.trendStrength}% trend strength.`,
      });
    }

    // 2. Momentum Oscillator: RSI 14
    if (snapshot.rsi14 > 50 && snapshot.rsi14 < 70) {
      const weight = 1.5;
      bullishScore += weight;
      contributors.push({
        indicator: 'RSI (14)',
        bias: 'UP',
        weight,
        description: `Bullish momentum territory: RSI 14 at ${snapshot.rsi14} indicates positive buyers expansion.`,
      });
    } else if (snapshot.rsi14 <= 50 && snapshot.rsi14 > 30) {
      const weight = 1.5;
      bearishScore += weight;
      contributors.push({
        indicator: 'RSI (14)',
        bias: 'DOWN',
        weight,
        description: `Bearish momentum territory: RSI 14 at ${snapshot.rsi14} indicates dominant seller control.`,
      });
    } else if (snapshot.rsi14 >= 70) {
      const weight = 1.0;
      bearishScore += weight;
      contributors.push({
        indicator: 'RSI (14) Overbought',
        bias: 'DOWN',
        weight,
        description: `Overbought boundary (${snapshot.rsi14}): potential mean-reversion pullback pressure.`,
      });
    } else if (snapshot.rsi14 <= 30) {
      const weight = 1.0;
      bullishScore += weight;
      contributors.push({
        indicator: 'RSI (14) Oversold',
        bias: 'UP',
        weight,
        description: `Oversold boundary (${snapshot.rsi14}): technical buying support bounce expected.`,
      });
    }

    // 3. MACD Histogram
    if (snapshot.macd.histogram > 0) {
      const weight = 1.5;
      bullishScore += weight;
      contributors.push({
        indicator: 'MACD (12, 26, 9)',
        bias: 'UP',
        weight,
        description: `Positive MACD histogram (+${snapshot.macd.histogram}) confirming bullish divergence.`,
      });
    } else if (snapshot.macd.histogram < 0) {
      const weight = 1.5;
      bearishScore += weight;
      contributors.push({
        indicator: 'MACD (12, 26, 9)',
        bias: 'DOWN',
        weight,
        description: `Negative MACD histogram (${snapshot.macd.histogram}) confirming downward impulse.`,
      });
    }

    // 4. Candle Body Pressure
    if (snapshot.candleBodyPressure > 0.25) {
      const weight = 1.2;
      bullishScore += weight;
      contributors.push({
        indicator: 'Candle Body Pressure',
        bias: 'UP',
        weight,
        description: `Bullish close expansion with ${Math.round(snapshot.candleBodyPressure * 100)}% body pressure.`,
      });
    } else if (snapshot.candleBodyPressure < -0.25) {
      const weight = 1.2;
      bearishScore += weight;
      contributors.push({
        indicator: 'Candle Body Pressure',
        bias: 'DOWN',
        weight,
        description: `Bearish close expansion with ${Math.round(Math.abs(snapshot.candleBodyPressure) * 100)}% selling body pressure.`,
      });
    }

    // 5. Wick Rejections
    if (snapshot.lowerWickRatio > 0.35 && snapshot.lowerWickRatio > snapshot.upperWickRatio) {
      const weight = 1.0;
      bullishScore += weight;
      contributors.push({
        indicator: 'Lower Wick Absorption',
        bias: 'UP',
        weight,
        description: `Lower wick absorption (${Math.round(snapshot.lowerWickRatio * 100)}% of range) demonstrates buyer defense.`,
      });
    } else if (snapshot.upperWickRatio > 0.35 && snapshot.upperWickRatio > snapshot.lowerWickRatio) {
      const weight = 1.0;
      bearishScore += weight;
      contributors.push({
        indicator: 'Upper Wick Rejection',
        bias: 'DOWN',
        weight,
        description: `Upper wick rejection (${Math.round(snapshot.upperWickRatio * 100)}% of range) demonstrates overhead selling supply.`,
      });
    }

    // 6. Recent Momentum (Rate of Change)
    if (snapshot.momentum > 0.05) {
      const weight = 0.8;
      bullishScore += weight;
      contributors.push({
        indicator: '5-Period Momentum',
        bias: 'UP',
        weight,
        description: `5-period velocity is positive (+${snapshot.momentum}%).`,
      });
    } else if (snapshot.momentum < -0.05) {
      const weight = 0.8;
      bearishScore += weight;
      contributors.push({
        indicator: '5-Period Momentum',
        bias: 'DOWN',
        weight,
        description: `5-period velocity is negative (${snapshot.momentum}%).`,
      });
    }

    // 7. Green / Red Sequence Ratio
    if (snapshot.greenRedRatio >= 0.7) {
      const weight = 0.8;
      bullishScore += weight;
      contributors.push({
        indicator: 'Recent Candle Ratio',
        bias: 'UP',
        weight,
        description: `Persistent upward continuation: ${Math.round(snapshot.greenRedRatio * 100)}% green candles in recent window.`,
      });
    } else if (snapshot.greenRedRatio <= 0.3) {
      const weight = 0.8;
      bearishScore += weight;
      contributors.push({
        indicator: 'Recent Candle Ratio',
        bias: 'DOWN',
        weight,
        description: `Persistent downward continuation: ${Math.round((1 - snapshot.greenRedRatio) * 100)}% red candles in recent window.`,
      });
    }

    // 8. Volume Expansion Confirmation
    if (snapshot.volumeChange > 15) {
      const dominantBias = bullishScore >= bearishScore ? 'UP' : 'DOWN';
      const weight = 0.7;
      if (dominantBias === 'UP') bullishScore += weight;
      else bearishScore += weight;

      contributors.push({
        indicator: 'Volume Surge',
        bias: dominantBias,
        weight,
        description: `Volume expanded +${snapshot.volumeChange}% vs 20-period average, validating directional commitment.`,
      });
    }

    // Total maximum possible points ~ 10.0
    const totalScore = bullishScore + bearishScore;
    const isBullish = bullishScore >= bearishScore;
    const direction: Direction = isBullish ? 'UP' : 'DOWN';
    const dominantScore = isBullish ? bullishScore : bearishScore;
    const agreementRatio = totalScore > 0 ? dominantScore / totalScore : 0.5;

    // +1 Candle Confidence: deterministic scaling between 50% and 80% (strictly capped)
    // 50% base + (agreementRatio - 0.5) * 60 => at 1.0 agreement => 50 + 30 = 80%
    const rawConf1 = 50 + (agreementRatio - 0.5) * 60;
    const confidence1 = Math.min(80, Math.max(50, Math.round(rawConf1 * 10) / 10));

    // +2 Candle Confidence: deterministic scaling between 50% and 75% (horizon decay factor of 0.85)
    // Future uncertainty decreases confidence
    const rawConf2 = 50 + (agreementRatio - 0.5) * 50;
    const confidence2 = Math.min(75, Math.max(50, Math.round(rawConf2 * 10) / 10));

    // Top contributors sorted by weight descending
    const topContributors = contributors
      .filter((c) => c.bias === direction)
      .sort((a, b) => b.weight - a.weight)
      .slice(0, 4);

    const explanation =
      topContributors.length > 0
        ? `Deterministic model signals ${direction} with ${confidence1}% confidence based on ${topContributors
            .map((c) => c.indicator)
            .join(', ')} agreement.`
        : `Balanced indicator distribution with slight ${direction} bias.`;

    const candleDuration = currentCandle.closeTime - currentCandle.openTime + 1;
    const target1Time = currentCandle.openTime + candleDuration;
    const target2Time = currentCandle.openTime + candleDuration * 2;
    const issuedAt = currentCandle.openTime;

    const prediction1: Prediction = {
      symbol,
      timeframe,
      targetCandleOpenTime: target1Time,
      horizon: 1,
      predictedDirection: direction,
      confidence: confidence1,
      indicatorSnapshot: snapshot,
      topContributors,
      explanation,
      modelVersion: this.MODEL_VERSION,
      issuedAt,
      currentPriceAtIssue: currentCandle.close,
    };

    const explanation2 = `Horizon +2 model projects ${direction} continuation (${confidence2}% confidence) incorporating standard horizon decay and indicator persistence.`;

    const prediction2: Prediction = {
      symbol,
      timeframe,
      targetCandleOpenTime: target2Time,
      horizon: 2,
      predictedDirection: direction,
      confidence: confidence2,
      indicatorSnapshot: snapshot,
      topContributors,
      explanation: explanation2,
      modelVersion: this.MODEL_VERSION,
      issuedAt,
      currentPriceAtIssue: currentCandle.close,
    };

    return { prediction1, prediction2 };
  }
}
