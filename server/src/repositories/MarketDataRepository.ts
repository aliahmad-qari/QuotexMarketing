import { isDbConnected } from '../config/db';
import { CandleModel } from '../models/Candle.model';
import { PredictionModel } from '../models/Prediction.model';
import { Candle, MarketSymbol, PerformanceStats, Prediction, Timeframe } from '../types/market.types';

class MarketDataRepository {
  // In-memory collections as high-performance cache and fallback
  private candleCache: Map<string, Candle[]> = new Map(); // key: `${symbol}:${timeframe}`
  private predictionStore: Map<string, Prediction> = new Map(); // key: `${symbol}:${timeframe}:${targetCandleOpenTime}:${horizon}`

  private getCandleKey(symbol: string, timeframe: string): string {
    return `${symbol}:${timeframe}`;
  }

  private getPredictionKey(symbol: string, timeframe: string, targetCandleOpenTime: number, horizon: number): string {
    return `${symbol}:${timeframe}:${targetCandleOpenTime}:${horizon}`;
  }

  // --- CANDLE STORAGE ---

  public async saveCandles(candles: Candle[]): Promise<void> {
    if (!candles.length) return;
    const first = candles[0];
    const key = this.getCandleKey(first.symbol, first.timeframe);

    // Update in-memory cache
    let existing = this.candleCache.get(key) || [];
    const map = new Map<number, Candle>();
    existing.forEach((c) => map.set(c.openTime, c));
    candles.forEach((c) => map.set(c.openTime, c));

    // Keep sorted by openTime ascending, capped at 500
    const sorted = Array.from(map.values())
      .sort((a, b) => a.openTime - b.openTime)
      .slice(-500);
    this.candleCache.set(key, sorted);

    // Persist closed candles to MongoDB if connected
    if (isDbConnected()) {
      try {
        const closedCandles = candles.filter((c) => c.isClosed);
        if (closedCandles.length > 0) {
          const ops: any[] = closedCandles.map((c) => ({
            updateOne: {
              filter: { symbol: c.symbol, timeframe: c.timeframe, openTime: c.openTime },
              update: { $set: c },
              upsert: true,
            },
          }));
          await (CandleModel as any).bulkWrite(ops, { ordered: false });
        }
      } catch (err) {
        console.error('[MarketDataRepository] Error saving candles to MongoDB:', err);
      }
    }
  }

  public async getCandles(symbol: MarketSymbol, timeframe: Timeframe, limit = 100): Promise<Candle[]> {
    const key = this.getCandleKey(symbol, timeframe);
    const cached = this.candleCache.get(key);

    if (cached && cached.length >= limit) {
      return cached.slice(-limit);
    }

    if (isDbConnected()) {
      try {
        const docs = await (CandleModel as any).find({ symbol, timeframe })
          .sort({ openTime: -1 })
          .limit(limit)
          .lean();

        if (docs.length > 0) {
          const candles: Candle[] = docs.reverse().map((d: any) => ({
            symbol: d.symbol,
            timeframe: d.timeframe,
            openTime: d.openTime,
            closeTime: d.closeTime,
            open: d.open,
            high: d.high,
            low: d.low,
            close: d.close,
            volume: d.volume,
            isClosed: d.isClosed,
            source: d.source,
          }));

          // Merge with cached
          if (cached) {
            const map = new Map<number, Candle>();
            candles.forEach((c) => map.set(c.openTime, c));
            cached.forEach((c) => map.set(c.openTime, c));
            const merged = Array.from(map.values()).sort((a, b) => a.openTime - b.openTime);
            this.candleCache.set(key, merged);
            return merged.slice(-limit);
          }

          this.candleCache.set(key, candles);
          return candles;
        }
      } catch (err) {
        console.error('[MarketDataRepository] Error reading candles from MongoDB:', err);
      }
    }

    return cached ? cached.slice(-limit) : [];
  }

  // --- PREDICTION STORAGE ---

  public async savePrediction(prediction: Prediction): Promise<void> {
    const key = this.getPredictionKey(
      prediction.symbol,
      prediction.timeframe,
      prediction.targetCandleOpenTime,
      prediction.horizon
    );

    // If prediction already locked, do NOT overwrite its initial values
    const existing = this.predictionStore.get(key);
    if (!existing) {
      this.predictionStore.set(key, { ...prediction });
    }

    if (isDbConnected()) {
      try {
        await (PredictionModel as any).updateOne(
          {
            symbol: prediction.symbol,
            timeframe: prediction.timeframe,
            targetCandleOpenTime: prediction.targetCandleOpenTime,
            horizon: prediction.horizon,
          },
          { $setOnInsert: prediction },
          { upsert: true }
        );
      } catch (err) {
        console.error('[MarketDataRepository] Error saving prediction to MongoDB:', err);
      }
    }
  }

  public async getPendingPredictions(symbol: MarketSymbol, timeframe: Timeframe, currentTime: number): Promise<Prediction[]> {
    const results: Prediction[] = [];
    for (const p of this.predictionStore.values()) {
      if (p.symbol === symbol && p.timeframe === timeframe && !p.result) {
        results.push(p);
      }
    }
    return results;
  }

  public async updatePredictionEvaluation(
    symbol: MarketSymbol,
    timeframe: Timeframe,
    targetCandleOpenTime: number,
    horizon: 1 | 2,
    evaluation: {
      actualDirection: 'UP' | 'DOWN' | 'NEUTRAL';
      actualCandleOpen: number;
      actualCandleClose: number;
      result: 'CORRECT' | 'INCORRECT' | 'NEUTRAL';
      evaluatedAt: number;
    }
  ): Promise<Prediction | null> {
    const key = this.getPredictionKey(symbol, timeframe, targetCandleOpenTime, horizon);
    const existing = this.predictionStore.get(key);

    if (existing) {
      existing.actualDirection = evaluation.actualDirection;
      existing.actualCandleOpen = evaluation.actualCandleOpen;
      existing.actualCandleClose = evaluation.actualCandleClose;
      existing.result = evaluation.result;
      existing.evaluatedAt = evaluation.evaluatedAt;
      this.predictionStore.set(key, existing);
    }

    if (isDbConnected()) {
      try {
        await (PredictionModel as any).updateOne(
          { symbol, timeframe, targetCandleOpenTime, horizon },
          { $set: evaluation }
        );
      } catch (err) {
        console.error('[MarketDataRepository] Error updating prediction evaluation:', err);
      }
    }

    return existing || null;
  }

  public async getPredictions(filter: {
    symbol?: MarketSymbol;
    timeframe?: Timeframe;
    horizon?: number;
    result?: string;
    limit?: number;
  }): Promise<Prediction[]> {
    const limit = filter.limit || 50;

    if (isDbConnected()) {
      try {
        const query: any = {};
        if (filter.symbol) query.symbol = filter.symbol;
        if (filter.timeframe) query.timeframe = filter.timeframe;
        if (filter.horizon) query.horizon = filter.horizon;
        if (filter.result && filter.result !== 'ALL') query.result = filter.result;

        const docs = await PredictionModel.find(query)
          .sort({ issuedAt: -1 })
          .limit(limit)
          .lean();

        if (docs.length > 0) {
          return docs.map((d: any) => ({
            id: d._id?.toString(),
            symbol: d.symbol,
            timeframe: d.timeframe,
            targetCandleOpenTime: d.targetCandleOpenTime,
            horizon: d.horizon,
            predictedDirection: d.predictedDirection,
            confidence: d.confidence,
            indicatorSnapshot: d.indicatorSnapshot,
            topContributors: d.topContributors,
            explanation: d.explanation,
            modelVersion: d.modelVersion,
            issuedAt: d.issuedAt,
            currentPriceAtIssue: d.currentPriceAtIssue,
            actualDirection: d.actualDirection,
            actualCandleOpen: d.actualCandleOpen,
            actualCandleClose: d.actualCandleClose,
            result: d.result,
            evaluatedAt: d.evaluatedAt,
          }));
        }
      } catch (err) {
        console.error('[MarketDataRepository] Error fetching predictions from MongoDB:', err);
      }
    }

    // In-memory filter
    let list = Array.from(this.predictionStore.values());
    if (filter.symbol) list = list.filter((p) => p.symbol === filter.symbol);
    if (filter.timeframe) list = list.filter((p) => p.timeframe === filter.timeframe);
    if (filter.horizon) list = list.filter((p) => p.horizon === filter.horizon);
    if (filter.result && filter.result !== 'ALL') list = list.filter((p) => p.result === filter.result);

    return list.sort((a, b) => b.issuedAt - a.issuedAt).slice(0, limit);
  }

  public async getPerformanceStats(symbol?: MarketSymbol): Promise<PerformanceStats> {
    let all = Array.from(this.predictionStore.values()).filter((p) => p.result !== undefined);

    if (symbol) {
      all = all.filter((p) => p.symbol === symbol);
    }

    if (isDbConnected()) {
      try {
        const query: any = { result: { $in: ['CORRECT', 'INCORRECT', 'NEUTRAL'] } };
        if (symbol) query.symbol = symbol;
        const docs = await PredictionModel.find(query).lean();
        if (docs.length > 0) {
          all = docs.map((d: any) => ({
            symbol: d.symbol,
            timeframe: d.timeframe,
            targetCandleOpenTime: d.targetCandleOpenTime,
            horizon: d.horizon,
            predictedDirection: d.predictedDirection,
            confidence: d.confidence,
            indicatorSnapshot: d.indicatorSnapshot,
            topContributors: d.topContributors,
            explanation: d.explanation,
            modelVersion: d.modelVersion,
            issuedAt: d.issuedAt,
            currentPriceAtIssue: d.currentPriceAtIssue,
            actualDirection: d.actualDirection,
            result: d.result,
            evaluatedAt: d.evaluatedAt,
          }));
        }
      } catch (err) {
        console.error('[MarketDataRepository] Error calculating performance stats from MongoDB:', err);
      }
    }

    const totalEvaluated = all.length;
    const correctCount = all.filter((p) => p.result === 'CORRECT').length;
    const incorrectCount = all.filter((p) => p.result === 'INCORRECT').length;
    const neutralCount = all.filter((p) => p.result === 'NEUTRAL').length;

    const overallAccuracy = totalEvaluated > 0 ? (correctCount / totalEvaluated) * 100 : 0;

    const h1List = all.filter((p) => p.horizon === 1);
    const h1Correct = h1List.filter((p) => p.result === 'CORRECT').length;
    const horizon1Accuracy = h1List.length > 0 ? (h1Correct / h1List.length) * 100 : 0;

    const h2List = all.filter((p) => p.horizon === 2);
    const h2Correct = h2List.filter((p) => p.result === 'CORRECT').length;
    const horizon2Accuracy = h2List.length > 0 ? (h2Correct / h2List.length) * 100 : 0;

    const byAsset: Record<string, { total: number; correct: number; accuracy: number }> = {};
    const byTimeframe: Record<string, { total: number; correct: number; accuracy: number }> = {};
    const byConfidenceBand = {
      '50-59%': { total: 0, correct: 0, accuracy: 0 },
      '60-69%': { total: 0, correct: 0, accuracy: 0 },
      '70-80%': { total: 0, correct: 0, accuracy: 0 },
    };

    for (const p of all) {
      // By Asset
      if (!byAsset[p.symbol]) byAsset[p.symbol] = { total: 0, correct: 0, accuracy: 0 };
      byAsset[p.symbol].total++;
      if (p.result === 'CORRECT') byAsset[p.symbol].correct++;

      // By Timeframe
      if (!byTimeframe[p.timeframe]) byTimeframe[p.timeframe] = { total: 0, correct: 0, accuracy: 0 };
      byTimeframe[p.timeframe].total++;
      if (p.result === 'CORRECT') byTimeframe[p.timeframe].correct++;

      // By Confidence
      const conf = p.confidence;
      if (conf < 60) {
        byConfidenceBand['50-59%'].total++;
        if (p.result === 'CORRECT') byConfidenceBand['50-59%'].correct++;
      } else if (conf < 70) {
        byConfidenceBand['60-69%'].total++;
        if (p.result === 'CORRECT') byConfidenceBand['60-69%'].correct++;
      } else {
        byConfidenceBand['70-80%'].total++;
        if (p.result === 'CORRECT') byConfidenceBand['70-80%'].correct++;
      }
    }

    // Calculate accuracies
    for (const k of Object.keys(byAsset)) {
      byAsset[k].accuracy = (byAsset[k].correct / byAsset[k].total) * 100;
    }
    for (const k of Object.keys(byTimeframe)) {
      byTimeframe[k].accuracy = (byTimeframe[k].correct / byTimeframe[k].total) * 100;
    }
    for (const k of Object.keys(byConfidenceBand) as Array<keyof typeof byConfidenceBand>) {
      const b = byConfidenceBand[k];
      b.accuracy = b.total > 0 ? (b.correct / b.total) * 100 : 0;
    }

    return {
      totalEvaluated,
      correctCount,
      incorrectCount,
      neutralCount,
      overallAccuracy: Number(overallAccuracy.toFixed(2)),
      horizon1Accuracy: Number(horizon1Accuracy.toFixed(2)),
      horizon1Count: h1List.length,
      horizon2Accuracy: Number(horizon2Accuracy.toFixed(2)),
      horizon2Count: h2List.length,
      byAsset,
      byTimeframe,
      byConfidenceBand,
    };
  }
}

export const marketDataRepository = new MarketDataRepository();
