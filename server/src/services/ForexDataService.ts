/**
 * ForexDataService
 * ────────────────
 * Delivers live candlestick data for forex pairs using two sources:
 *
 *  1. Historical seed  — Twelve Data REST  /time_series  (free, 800 calls/day)
 *     Called once per symbol on first subscription to fill the chart with ~80
 *     candles before the live stream takes over.
 *
 *  2. Live ticks       — Twelve Data WebSocket  wss://ws.twelvedata.com/v1/quotes/price
 *     One persistent multiplexed connection for ALL forex symbols.
 *     Each price tick is fed into CandleAggregatorService.processTick() which
 *     builds 5s / 10s / 15s / 30s / 1m / 2m / 5m / 1h / 2h / 3h candles from
 *     the raw tick stream — exactly the same as Binance @trade does for crypto.
 *
 * Required env vars:
 *   TWELVE_DATA_API_KEY  — free at twelvedata.com (800 REST calls/day, WS included)
 *
 * If TWELVE_DATA_API_KEY is missing the service logs a warning and no forex
 * symbol will be added to VALID_SYMBOLS, so the server degrades gracefully.
 */

import WebSocket from 'ws';
import { Candle, MarketMetadata, MarketSymbol, Timeframe } from '../types/market.types';
import { CandleAggregatorService } from './CandleAggregatorService';

export type ForexCandleListener = (candle: Candle, wasClosed: boolean) => void;

// Mapping from our internal MarketSymbol → Twelve Data symbol string
export const FOREX_SYMBOL_MAP: Record<string, string> = {
  EURUSD: 'EUR/USD',
  GBPUSD: 'GBP/USD',
  USDJPY: 'USD/JPY',
  AUDUSD: 'AUD/USD',
  USDCAD: 'USD/CAD',
  USDCHF: 'USD/CHF',
};

// Reverse map: Twelve Data symbol → our MarketSymbol
const TD_TO_INTERNAL: Record<string, MarketSymbol> = Object.fromEntries(
  Object.entries(FOREX_SYMBOL_MAP).map(([k, v]) => [v, k as MarketSymbol])
);

// Price decimal places per pair
const FOREX_DECIMALS: Record<string, number> = {
  EURUSD: 5, GBPUSD: 5, AUDUSD: 5, USDCAD: 5, USDCHF: 5,
  USDJPY: 3,
};

export class ForexDataService {
  private static instance: ForexDataService;
  private wsClient: WebSocket | null = null;
  private reconnectTimer: NodeJS.Timeout | null = null;
  private reconnectAttempts = 0;
  private heartbeatTimer: NodeJS.Timeout | null = null;
  private lastMessageAt = 0;
  private isConnecting = false;
  private subscribedSymbols = new Set<string>(); // Twelve Data symbols e.g. "EUR/USD"

  private candleListeners = new Map<string, Set<ForexCandleListener>>(); // key: `${symbol}:${timeframe}`
  private metadataMap = new Map<MarketSymbol, MarketMetadata>();
  private prevPrices = new Map<MarketSymbol, number>(); // for 24h change placeholder

  private readonly TD_WS = 'wss://ws.twelvedata.com/v1/quotes/price';
  private readonly TD_REST = 'https://api.twelvedata.com';
  private readonly apiKey: string;

  private constructor() {
    this.apiKey = process.env.TWELVE_DATA_API_KEY || '';
    this.initMetadata();
  }

  public static getInstance(): ForexDataService {
    if (!ForexDataService.instance) {
      ForexDataService.instance = new ForexDataService();
    }
    return ForexDataService.instance;
  }

  public isAvailable(): boolean {
    return this.apiKey.length > 0;
  }

  private initMetadata() {
    for (const [sym] of Object.entries(FOREX_SYMBOL_MAP)) {
      const symbol = sym as MarketSymbol;
      const base = sym.slice(0, 3);
      const quote = sym.slice(3);
      this.metadataMap.set(symbol, {
        symbol,
        baseAsset: base,
        quoteAsset: quote,
        priceDecimals: FOREX_DECIMALS[sym] ?? 5,
        quantityDecimals: 0,
        lastPrice: 0,
        priceChange24h: 0,
        priceChangePercent24h: 0,
        high24h: 0,
        low24h: 0,
        volume24h: 0,
        quoteVolume24h: 0,
        lastUpdated: Date.now(),
      });
    }
  }

  public getMetadata(symbol: MarketSymbol): MarketMetadata | undefined {
    return this.metadataMap.get(symbol);
  }

  // ── Subscribe ─────────────────────────────────────────────────────────────

  public subscribe(symbol: MarketSymbol, timeframe: Timeframe, listener: ForexCandleListener): () => void {
    const key = `${symbol}:${timeframe}`;
    if (!this.candleListeners.has(key)) {
      this.candleListeners.set(key, new Set());
    }
    this.candleListeners.get(key)!.add(listener);

    const tdSymbol = FOREX_SYMBOL_MAP[symbol];
    if (tdSymbol && !this.subscribedSymbols.has(tdSymbol)) {
      this.subscribedSymbols.add(tdSymbol);
      // If WS already open, send subscribe message now
      if (this.wsClient?.readyState === WebSocket.OPEN) {
        this.sendSubscribe([tdSymbol]);
      } else if (!this.isConnecting) {
        this.connect();
      }
    }

    return () => {
      const listeners = this.candleListeners.get(key);
      if (listeners) {
        listeners.delete(listener);
        if (listeners.size === 0) {
          this.candleListeners.delete(key);
        }
      }
    };
  }

  // ── Historical candles via REST ───────────────────────────────────────────

  public async fetchHistoricalCandles(
    symbol: MarketSymbol,
    timeframe: Timeframe,
    limit = 100
  ): Promise<Candle[]> {
    if (!this.apiKey) return [];

    // Map our timeframe to Twelve Data interval
    const intervalMap: Partial<Record<Timeframe, string>> = {
      '1m': '1min', '5m': '5min', '1h': '1h', '2h': '2h',
    };

    // For sub-minute (5s/10s/15s/30s) and custom (2m/3h), seed with 1min candles
    // The trade stream will build the correct-timeframe candles live on top.
    const tdInterval = intervalMap[timeframe] || '1min';
    const fetchLimit = Math.min(limit, 500);

    const tdSymbol = FOREX_SYMBOL_MAP[symbol];
    if (!tdSymbol) return [];

    try {
      const url = `${this.TD_REST}/time_series?symbol=${encodeURIComponent(tdSymbol)}&interval=${tdInterval}&outputsize=${fetchLimit}&apikey=${this.apiKey}&format=JSON`;
      const res = await fetch(url, { signal: AbortSignal.timeout(15_000) });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);

      const json = await res.json();
      if (json.status === 'error' || !Array.isArray(json.values)) {
        console.warn(`[ForexData] REST error for ${symbol}:`, json.message || 'no values');
        return [];
      }

      // Twelve Data returns newest-first, reverse to get oldest-first
      const rows: Array<{ datetime: string; open: string; high: string; low: string; close: string }> =
        (json.values as any[]).reverse();

      const durationMs = CandleAggregatorService.getDurationMs(timeframe === '1m' ? '1m' : '1m');
      const candles: Candle[] = rows.map((r) => {
        const openTime = new Date(r.datetime.replace(' ', 'T') + 'Z').getTime();
        const closeTime = openTime + durationMs - 1;
        return {
          symbol,
          timeframe: timeframe === '1m' || !intervalMap[timeframe] ? '1m' : timeframe,
          openTime,
          closeTime,
          open: parseFloat(r.open),
          high: parseFloat(r.high),
          low: parseFloat(r.low),
          close: parseFloat(r.close),
          volume: 0, // Forex has no volume
          isClosed: Date.now() > closeTime,
          source: 'forex_rest',
        } as Candle;
      });

      // For sub-minute or non-1m timeframes, re-tag so the client can match them
      const isSubMinute = ['5s', '10s', '15s', '30s'].includes(timeframe);
      if (isSubMinute) {
        return candles.slice(-limit).map((c) => ({ ...c, timeframe }));
      }

      // Aggregate 1m → target if needed (2m, 3h, etc.)
      if (!intervalMap[timeframe]) {
        const aggregated = CandleAggregatorService.aggregateCandles(
          candles.map((c) => ({ ...c, timeframe: '1m' })),
          timeframe,
          symbol
        );
        return aggregated.slice(-limit);
      }

      return candles.slice(-limit);
    } catch (err) {
      console.warn(`[ForexData] fetchHistoricalCandles failed for ${symbol}:`, (err as Error).message);
      return [];
    }
  }

  // ── WebSocket connection ──────────────────────────────────────────────────

  private connect() {
    if (this.isConnecting || this.wsClient?.readyState === WebSocket.OPEN) return;
    if (!this.apiKey) {
      console.warn('[ForexData] No TWELVE_DATA_API_KEY — forex WebSocket disabled');
      return;
    }

    this.isConnecting = true;
    console.log('[ForexData] Connecting to Twelve Data WebSocket…');

    try {
      this.wsClient = new WebSocket(`${this.TD_WS}?apikey=${this.apiKey}`);

      this.wsClient.on('open', () => {
        console.log('[ForexData] Twelve Data WS connected');
        this.isConnecting = false;
        this.reconnectAttempts = 0;
        this.lastMessageAt = Date.now();
        this.startHeartbeat();
        // Subscribe to all symbols that have active listeners
        if (this.subscribedSymbols.size > 0) {
          this.sendSubscribe(Array.from(this.subscribedSymbols));
        }
      });

      this.wsClient.on('message', (raw: WebSocket.Data) => {
        this.lastMessageAt = Date.now();
        this.handleMessage(raw.toString());
      });

      this.wsClient.on('error', (err) => {
        console.warn('[ForexData] WS error:', err.message);
      });

      this.wsClient.on('close', (code) => {
        console.warn(`[ForexData] WS closed (code: ${code}) — scheduling reconnect`);
        this.stopHeartbeat();
        this.isConnecting = false;
        this.scheduleReconnect();
      });
    } catch (err) {
      console.error('[ForexData] WS init failed:', err);
      this.isConnecting = false;
      this.scheduleReconnect();
    }
  }

  private scheduleReconnect() {
    if (this.reconnectTimer) return;
    this.reconnectAttempts++;
    const delay = Math.min(1000 * Math.pow(1.5, this.reconnectAttempts), 30_000);
    console.log(`[ForexData] Reconnecting in ${Math.round(delay)}ms (attempt ${this.reconnectAttempts})`);
    this.reconnectTimer = setTimeout(() => {
      this.reconnectTimer = null;
      this.connect();
    }, delay);
  }

  private startHeartbeat() {
    this.stopHeartbeat();
    this.heartbeatTimer = setInterval(() => {
      if (Date.now() - this.lastMessageAt > 45_000) {
        console.warn('[ForexData] Stale WS connection — reconnecting');
        this.wsClient?.terminate();
      }
    }, 15_000);
  }

  private stopHeartbeat() {
    if (this.heartbeatTimer) {
      clearInterval(this.heartbeatTimer);
      this.heartbeatTimer = null;
    }
  }

  private sendSubscribe(tdSymbols: string[]) {
    if (!this.wsClient || this.wsClient.readyState !== WebSocket.OPEN) return;
    this.wsClient.send(
      JSON.stringify({ action: 'subscribe', params: { symbols: tdSymbols.join(',') } })
    );
  }

  // ── Message handling ──────────────────────────────────────────────────────

  private handleMessage(raw: string) {
    try {
      const msg = JSON.parse(raw);

      // Twelve Data sends event type in `event` field
      if (msg.event === 'price') {
        const tdSym: string = msg.symbol;
        const price: number = parseFloat(msg.price);
        const tradeTime: number = msg.timestamp ? msg.timestamp * 1000 : Date.now();

        const symbol = TD_TO_INTERNAL[tdSym];
        if (!symbol || isNaN(price) || price <= 0) return;

        // Update metadata
        const meta = this.metadataMap.get(symbol);
        if (meta) {
          const prev = this.prevPrices.get(symbol);
          if (prev && prev > 0) {
            meta.priceChange24h = price - prev;
            meta.priceChangePercent24h = ((price - prev) / prev) * 100;
          }
          if (!this.prevPrices.has(symbol)) {
            this.prevPrices.set(symbol, price);
          }
          meta.lastPrice = price;
          meta.high24h = meta.high24h > 0 ? Math.max(meta.high24h, price) : price;
          meta.low24h = meta.low24h > 0 ? Math.min(meta.low24h, price) : price;
          meta.lastUpdated = tradeTime;
        }

        // Feed all active timeframe aggregators for this symbol
        const ALL_TIMEFRAMES: Timeframe[] = [
          '5s', '10s', '15s', '30s', '1m', '2m', '5m', '1h', '2h', '3h',
        ];
        for (const tf of ALL_TIMEFRAMES) {
          const key = `${symbol}:${tf}`;
          if (!this.candleListeners.has(key)) continue;

          const { candle, wasClosed, closedCandle } = CandleAggregatorService.processTick(
            symbol,
            tf,
            price,
            0, // no volume in forex
            tradeTime
          );

          if (wasClosed && closedCandle) {
            this.notifyListeners(symbol, tf, closedCandle, true);
          }
          this.notifyListeners(symbol, tf, candle, false);
        }
      } else if (msg.event === 'subscribe-status') {
        console.log('[ForexData] Subscribe status:', JSON.stringify(msg));
      } else if (msg.event === 'heartbeat') {
        // Twelve Data sends heartbeats — just update timestamp (already done above)
      }
    } catch (err) {
      console.warn('[ForexData] Message parse error:', (err as Error).message);
    }
  }

  private notifyListeners(symbol: MarketSymbol, timeframe: Timeframe, candle: Candle, wasClosed: boolean) {
    const key = `${symbol}:${timeframe}`;
    const listeners = this.candleListeners.get(key);
    if (!listeners) return;
    listeners.forEach((fn) => {
      try { fn(candle, wasClosed); }
      catch (e) { console.error('[ForexData] Listener error:', e); }
    });
  }
}

export const forexDataService = ForexDataService.getInstance();
