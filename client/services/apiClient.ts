import { Candle, MarketMetadata, MarketSymbol, PerformanceStats, Prediction, Timeframe } from '../types/market';

const API_BASE = '/api';

export async function fetchMarkets(): Promise<MarketMetadata[]> {
  try {
    const res = await fetch(`${API_BASE}/markets`);
    const json = await res.json();
    return json.success ? json.data : [];
  } catch (err) {
    console.error('Failed to fetch markets:', err);
    return [];
  }
}

export async function fetchCandles(symbol: MarketSymbol, timeframe: Timeframe, limit = 100): Promise<Candle[]> {
  try {
    const res = await fetch(`${API_BASE}/candles/${symbol}?timeframe=${timeframe}&limit=${limit}`);
    const json = await res.json();
    return json.success ? json.data : [];
  } catch (err) {
    console.error('Failed to fetch candles:', err);
    return [];
  }
}

export async function fetchPredictions(params?: {
  symbol?: MarketSymbol;
  timeframe?: Timeframe;
  horizon?: number;
  result?: string;
  limit?: number;
}): Promise<Prediction[]> {
  try {
    const query = new URLSearchParams();
    if (params?.symbol) query.set('symbol', params.symbol);
    if (params?.timeframe) query.set('timeframe', params.timeframe);
    if (params?.horizon) query.set('horizon', params.horizon.toString());
    if (params?.result) query.set('result', params.result);
    if (params?.limit) query.set('limit', params.limit.toString());

    const url = `${API_BASE}/predictions${params?.symbol ? `/${params.symbol}` : ''}?${query.toString()}`;
    const res = await fetch(url);
    const json = await res.json();
    return json.success ? json.data : [];
  } catch (err) {
    console.error('Failed to fetch predictions:', err);
    return [];
  }
}

export async function fetchPerformance(symbol?: MarketSymbol): Promise<PerformanceStats | null> {
  try {
    const url = symbol ? `${API_BASE}/performance/${symbol}` : `${API_BASE}/performance`;
    const res = await fetch(url);
    const json = await res.json();
    return json.success ? json.data : null;
  } catch (err) {
    console.error('Failed to fetch performance:', err);
    return null;
  }
}
