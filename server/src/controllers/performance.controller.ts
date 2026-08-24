import { Request, Response } from 'express';
import { marketDataRepository } from '../repositories/MarketDataRepository';
import { ApiResponse, MarketSymbol } from '../types/market.types';

export class PerformanceController {
  public static async getPerformance(req: Request, res: Response): Promise<void> {
    try {
      const stats = await marketDataRepository.getPerformanceStats();
      const response: ApiResponse = {
        success: true,
        data: stats,
        meta: { timestamp: Date.now() },
        error: null,
      };
      res.json(response);
    } catch (error) {
      res.status(500).json({
        success: false,
        data: null,
        error: (error as Error).message || 'Failed to fetch performance stats',
      });
    }
  }

  public static async getPerformanceBySymbol(req: Request, res: Response): Promise<void> {
    try {
      const symbol = req.params.symbol.toUpperCase() as MarketSymbol;
      const stats = await marketDataRepository.getPerformanceStats(symbol);
      const response: ApiResponse = {
        success: true,
        data: stats,
        meta: { symbol, timestamp: Date.now() },
        error: null,
      };
      res.json(response);
    } catch (error) {
      res.status(500).json({
        success: false,
        data: null,
        error: (error as Error).message || 'Failed to fetch symbol performance stats',
      });
    }
  }
}
