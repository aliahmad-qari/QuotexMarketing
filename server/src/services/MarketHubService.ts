import { binanceDataService } from './BinanceDataService';
import { forexDataService, FOREX_SYMBOL_MAP } from './ForexDataService';
import { PredictionEngineService } from './PredictionEngineService';
import { marketDataRepository } from '../repositories/MarketDataRepository';
import {
  Candle,
  EvaluationResult,
  MarketMetadata,
  MarketSymbol,
  Prediction,
  Timeframe,
} from '../types/market.types';

export type EventBroadcaster = (event: string, payload: any, room?: string) => void;

// Helper — is this symbol a forex pair (routed to ForexDataService)?
function isForexSymbol(symbol: MarketSymbol): boolean {
  return symbol in FOREX_SYMBOL_MAP;
}

export class MarketHubService {
  private static instance: MarketHubService;
  private broadcaster: EventBroadcaster | null = null;
  private activeStreams: Map<string, () => void> = new Map(); // key: `${symbol}:${timeframe}`
  private activePredictions: Map<string, { prediction1: Prediction; prediction2: Prediction }> = new Map();

  private constructor() {}

  public static getInstance(): MarketHubService {
    if (!MarketHubService.instance) {
      MarketHubService.instance = new MarketHubService();
    }
    return MarketHubService.instance;
  }

  public setBroadcaster(fn: EventBroadcaster) {
    this.broadcaster = fn;
  }

  /**
   * Initialize market hub and pre-warm data
   */
  public async initialize() {
    console.log('[MarketHub] Initializing market hub and ticker monitors...');
    await binanceDataService.fetch24hTickers();
    setInterval(() => {
      binanceDataService.fetch24hTickers();
    }, 10000); // 10s ticker refresh

    // Forex data service connects lazily when first subscribed — no init needed
    if (forexDataService.isAvailable()) {
      console.log('[MarketHub] Forex data service (Twelve Data) is available');
    } else {
      console.warn('[MarketHub] TWELVE_DATA_API_KEY not set — forex symbols disabled');
    }
  }

  /**
   * Get or load market snapshot: historical candles + current predictions + ticker metadata
   */
  public async getMarketSnapshot(symbol: MarketSymbol, timeframe: Timeframe) {
    let candles = await marketDataRepository.getCandles(symbol, timeframe, 80);

    if (candles.length < 30) {
      // Fetch historical — route to correct data source
      let fetched: Candle[] = [];
      if (isForexSymbol(symbol)) {
        fetched = await forexDataService.fetchHistoricalCandles(symbol, timeframe, 100);
      } else {
        fetched = await binanceDataService.fetchHistoricalCandles(symbol, timeframe, 100);
      }
      if (fetched.length > 0) {
        await marketDataRepository.saveCandles(fetched);
        candles = fetched;
      }
    }

    // Ensure active live stream is running
    this.ensureStreamActive(symbol, timeframe);

    // Calculate / retrieve current prediction
    const currentCandle = candles[candles.length - 1];
    let predictions = this.activePredictions.get(`${symbol}:${timeframe}`);
    if (predictions && currentCandle) {
      const candleDuration = currentCandle.closeTime - currentCandle.openTime + 1;
      const expectedHorizon1Open = currentCandle.isClosed
        ? currentCandle.openTime + candleDuration
        : currentCandle.openTime;

      if (predictions.prediction1.targetCandleOpenTime < expectedHorizon1Open) {
        this.activePredictions.delete(`${symbol}:${timeframe}`);
        predictions = undefined;
      }
    }

    if (!predictions && currentCandle) {
      const generated = PredictionEngineService.generatePredictions(
        candles,
        symbol,
        timeframe,
        currentCandle
      );
      if (generated) {
        predictions = generated;
        this.activePredictions.set(`${symbol}:${timeframe}`, predictions);

        // Lock predictions in storage
        await marketDataRepository.savePrediction(generated.prediction1);
        await marketDataRepository.savePrediction(generated.prediction2);
      }
    }

    // Get metadata from the appropriate data source
    const metadata = isForexSymbol(symbol)
      ? forexDataService.getMetadata(symbol) ?? null
      : binanceDataService.getMarketMetadata(symbol) ?? null;

    const recentEvaluations = await marketDataRepository.getPredictions({
      symbol,
      timeframe,
      limit: 15,
    });

    return {
      symbol,
      timeframe,
      metadata: metadata || null,
      candles: candles.slice(-60), // Return last 60 actual candles for pristine chart rendering
      predictions: predictions || null,
      recentEvaluations,
    };
  }

  /**
   * Ensure WebSocket stream is actively listening and aggregating
   */
  public ensureStreamActive(symbol: MarketSymbol, timeframe: Timeframe) {
    const key = `${symbol}:${timeframe}`;
    if (this.activeStreams.has(key)) return;

    let unsub: () => void;

    if (isForexSymbol(symbol)) {
      // Forex — route to Twelve Data tick stream
      unsub = forexDataService.subscribe(symbol, timeframe, async (candle, wasClosed) => {
        await this.handleCandleUpdate(symbol, timeframe, candle, wasClosed);
      });
    } else {
      // Crypto — route to Binance stream
      unsub = binanceDataService.subscribe(symbol, timeframe, async (candle, wasClosed) => {
        await this.handleCandleUpdate(symbol, timeframe, candle, wasClosed);
      });
    }

    this.activeStreams.set(key, unsub);
  }

  /**
   * Handle incoming live candle update or candle close
   */
  private async handleCandleUpdate(
    symbol: MarketSymbol,
    timeframe: Timeframe,
    candle: Candle,
    wasClosed: boolean
  ) {
    const key = `${symbol}:${timeframe}`;
    const room = `${symbol}:${timeframe}`;

    // Save candle to cache & DB
    await marketDataRepository.saveCandles([candle]);

    // Broadcast live candle update to room
    if (this.broadcaster) {
      this.broadcaster('candle:update', { symbol, timeframe, candle }, room);
    }

    if (wasClosed) {
      // 1. Evaluate any pending predictions targeting this closed candle
      await this.evaluatePendingPredictions(symbol, timeframe, candle);

      // 2. Broadcast candle closed event
      if (this.broadcaster) {
        this.broadcaster('candle:closed', { symbol, timeframe, candle }, room);
      }

      // 3. Generate new deterministic prediction for the newly commencing candle
      const history = await marketDataRepository.getCandles(symbol, timeframe, 80);
      const generated = PredictionEngineService.generatePredictions(
        history,
        symbol,
        timeframe,
        candle
      );

      if (generated) {
        this.activePredictions.set(key, generated);

        // Lock in storage with zero look-ahead bias
        await marketDataRepository.savePrediction(generated.prediction1);
        await marketDataRepository.savePrediction(generated.prediction2);

        // Broadcast new prediction lock
        if (this.broadcaster) {
          this.broadcaster(
            'prediction:new',
            {
              symbol,
              timeframe,
              prediction1: generated.prediction1,
              prediction2: generated.prediction2,
            },
            room
          );
        }
      }
    }
  }

  /**
   * Evaluate predictions when a target candle closes
   */
  private async evaluatePendingPredictions(symbol: MarketSymbol, timeframe: Timeframe, closedCandle: Candle) {
    const pending = await marketDataRepository.getPendingPredictions(symbol, timeframe, closedCandle.openTime);

    for (const pred of pending) {
      // Check if target candle is this closed candle
      if (pred.targetCandleOpenTime === closedCandle.openTime) {
        let actualDirection: 'UP' | 'DOWN' | 'NEUTRAL' = 'NEUTRAL';
        if (closedCandle.close > closedCandle.open) {
          actualDirection = 'UP';
        } else if (closedCandle.close < closedCandle.open) {
          actualDirection = 'DOWN';
        }

        let result: EvaluationResult = 'NEUTRAL';
        if (actualDirection !== 'NEUTRAL') {
          result = actualDirection === pred.predictedDirection ? 'CORRECT' : 'INCORRECT';
        }

        const evaluated = await marketDataRepository.updatePredictionEvaluation(
          symbol,
          timeframe,
          pred.targetCandleOpenTime,
          pred.horizon,
          {
            actualDirection,
            actualCandleOpen: closedCandle.open,
            actualCandleClose: closedCandle.close,
            result,
            evaluatedAt: Date.now(),
          }
        );

        if (evaluated && this.broadcaster) {
          this.broadcaster(
            'prediction:evaluated',
            {
              symbol,
              timeframe,
              evaluation: evaluated,
            },
            `${symbol}:${timeframe}`
          );
        }
      }
    }
  }
}

export const marketHubService = MarketHubService.getInstance();
