import { Request, Response } from 'express';
import { otcPriceService } from '../services/OtcPriceService';

export class OtcPriceController {
  /**
   * GET /api/otc-prices
   * Returns all cached OTC underlying prices in one shot.
   * Client polls this every 60s.
   */
  static async getPrices(req: Request, res: Response) {
    try {
      const prices = await otcPriceService.refreshAndGet();
      res.json({
        success: true,
        data: prices,
        updatedAt: Date.now(),
        error: null,
      });
    } catch (err) {
      res.status(500).json({
        success: false,
        data: null,
        error: (err as Error).message,
      });
    }
  }
}
