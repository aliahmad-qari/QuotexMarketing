import { Request, Response } from 'express';
import { marketDataRepository } from '../repositories/MarketDataRepository';
import { ApiResponse, MarketSymbol, Timeframe } from '../types/market.types';

export class PredictionController {
  public static async getPredictions(req: Request, res: Response): Promise<void> {
    try {
      const symbol = (req.params.symbol ? req.params.symbol.toUpperCase() : undefined) as MarketSymbol | undefined;
      const timeframe = req.query.timeframe as Timeframe | undefined;
      const horizon = req.query.horizon ? parseInt(req.query.horizon as string, 10) : undefined;
      const result = req.query.result as string | undefined;
      const limit = parseInt(req.query.limit as string, 10) || 50;

      const predictions = await marketDataRepository.getPredictions({
        symbol,
        timeframe,
        horizon,
        result,
        limit,
      });

      const response: ApiResponse = {
        success: true,
        data: predictions,
        meta: { count: predictions.length, filters: { symbol, timeframe, horizon, result } },
        error: null,
      };
      res.json(response);
    } catch (error) {
      res.status(500).json({
        success: false,
        data: null,
        error: (error as Error).message || 'Failed to fetch predictions',
      });
    }
  }
}
