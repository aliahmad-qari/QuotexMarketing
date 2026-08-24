import { Request, Response } from 'express';
import { binanceDataService } from '../services/BinanceDataService';
import { marketHubService } from '../services/MarketHubService';
import { marketDataRepository } from '../repositories/MarketDataRepository';
import { ApiResponse, MarketSymbol, Timeframe } from '../types/market.types';

export class MarketController {
  public static async getMarkets(req: Request, res: Response): Promise<void> {
    try {
      const markets = binanceDataService.getAllMarketMetadata();
      const response: ApiResponse = {
        success: true,
        data: markets,
        meta: { count: markets.length, timestamp: Date.now() },
        error: null,
      };
      res.json(response);
    } catch (error) {
      res.status(500).json({
        success: false,
        data: null,
        error: (error as Error).message || 'Failed to fetch markets',
      });
    }
  }

  public static async getCandles(req: Request, res: Response): Promise<void> {
    try {
      const symbol = (req.params.symbol || 'BTCUSDT').toUpperCase() as MarketSymbol;
      const timeframe = (req.query.timeframe || '1m') as Timeframe;
      const limit = parseInt(req.query.limit as string, 10) || 100;

      let candles = await marketDataRepository.getCandles(symbol, timeframe, limit);

      if (candles.length < 20) {
        const fetched = await binanceDataService.fetchHistoricalCandles(symbol, timeframe, limit);
        if (fetched.length > 0) {
          await marketDataRepository.saveCandles(fetched);
          candles = fetched;
        }
      }

      marketHubService.ensureStreamActive(symbol, timeframe);

      const response: ApiResponse = {
        success: true,
        data: candles,
        meta: { symbol, timeframe, count: candles.length },
        error: null,
      };
      res.json(response);
    } catch (error) {
      res.status(500).json({
        success: false,
        data: null,
        error: (error as Error).message || 'Failed to fetch candles',
      });
    }
  }
}
