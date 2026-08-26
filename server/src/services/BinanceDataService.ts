import WebSocket from 'ws';
import { Candle, MarketMetadata, MarketSymbol, Timeframe } from '../types/market.types';
import { CandleAggregatorService } from './CandleAggregatorService';

export type CandleListener = (candle: Candle, wasClosed: boolean) => void;
export type TickerListener = (meta: MarketMetadata) => void;

export class BinanceDataService {
  private restUrl: string;
  private wsUrl: string;
  private wsClient: WebSocket | null = null;
  private isConnecting = false;
  private reconnectAttempts = 0;
  private maxReconnectDelay = 30000;
  private heartbeatTimer: NodeJS.Timeout | null = null;
  private lastMessageTimestamp = 0;
  private receivedMessageOnCurrentSocket = false;
  private activeSubscriptions = new Set<string>(); // e.g. "btcusdt@kline_1m", "btcusdt@trade"

  private candleListeners: Map<string, Set<CandleListener>> = new Map(); // key: `${symbol}:${timeframe}`
  private tickerListeners: Map<string, Set<TickerListener>> = new Map(); // key: `${symbol}`
  private marketMetadataMap: Map<MarketSymbol, MarketMetadata> = new Map();

  constructor() {
    this.restUrl = process.env.BINANCE_REST_URL || 'https://data-api.binance.vision';
    this.wsUrl = process.env.BINANCE_WS_URL || 'wss://data-stream.binance.vision:443';
    this.initDefaultMetadata();
  }

  private getRestUrls(): string[] {
    return Array.from(new Set([this.restUrl, 'https://data-api.binance.vision']));
  }

  private getWsUrls(): string[] {
    return Array.from(new Set([this.wsUrl, 'wss://data-stream.binance.vision:443']));
  }

  private initDefaultMetadata() {
    const symbols: MarketSymbol[] = [
      'BTCUSDT', 'ETHUSDT', 'BNBUSDT', 'SOLUSDT', 'XRPUSDT',
      'ADAUSDT', 'DOGEUSDT', 'AVAXUSDT', 'DOTUSDT', 'LTCUSDT',
      'LINKUSDT', 'ATOMUSDT', 'UNIUSDT', 'NEARUSDT', 'AAVEUSDT', 'MATICUSDT',
      'SHIBUSDT', 'FTMUSDT', 'OPUSDT', 'ARBUSDT', 'INJUSDT', 'SUIUSDT',
    ];

    symbols.forEach((symbol) => {
      const base = symbol.replace('USDT', '');
      const lowPriceSyms = ['DOGE', 'ADA', 'XRP', 'MATIC', 'UNI', 'NEAR', 'LINK', 'SHIB', 'FTM', 'OP', 'ARB', 'INJ', 'SUI'];
      const priceDecimals = lowPriceSyms.some(s => base.startsWith(s)) ? 4 : 2;
      this.marketMetadataMap.set(symbol, {
        symbol,
        baseAsset: base,
        quoteAsset: 'USDT',
        priceDecimals,
        quantityDecimals: 4,
        lastPrice: 0,
        priceChange24h: 0,
        priceChangePercent24h: 0,
        high24h: 0,
        low24h: 0,
        volume24h: 0,
        quoteVolume24h: 0,
        lastUpdated: Date.now(),
      });
    });
  }

  /**
   * Fetch 24h ticker metadata for all supported assets
   */
  public async fetch24hTickers(): Promise<MarketMetadata[]> {
    for (const baseUrl of this.getRestUrls()) {
      try {
        const res = await fetch(`${baseUrl}/api/v3/ticker/24hr`);
        if (!res.ok) {
          const body = await res.text().catch(() => '');
          throw new Error(`HTTP ${res.status} ${res.statusText}${body ? `: ${body.slice(0, 160)}` : ''}`);
        }
        const data = await res.json();
        if (Array.isArray(data)) {
          for (const item of data) {
            const sym = item.symbol as MarketSymbol;
            if (this.marketMetadataMap.has(sym)) {
              const existing = this.marketMetadataMap.get(sym)!;
              const updated: MarketMetadata = {
                ...existing,
                lastPrice: parseFloat(item.lastPrice) || 0,
                priceChange24h: parseFloat(item.priceChange) || 0,
                priceChangePercent24h: parseFloat(item.priceChangePercent) || 0,
                high24h: parseFloat(item.highPrice) || 0,
                low24h: parseFloat(item.lowPrice) || 0,
                volume24h: parseFloat(item.volume) || 0,
                quoteVolume24h: parseFloat(item.quoteVolume) || 0,
                lastUpdated: Date.now(),
              };
              this.marketMetadataMap.set(sym, updated);
              this.notifyTickerListeners(sym, updated);
            }
          }
        }
        this.restUrl = baseUrl;
        return Array.from(this.marketMetadataMap.values());
      } catch (err) {
        console.warn(`[BinanceDataService] Failed to fetch 24h tickers from ${baseUrl}:`, (err as Error).message);
      }
    }
    return Array.from(this.marketMetadataMap.values());
  }

  public getMarketMetadata(symbol: MarketSymbol): MarketMetadata | undefined {
    return this.marketMetadataMap.get(symbol);
  }

  public getAllMarketMetadata(): MarketMetadata[] {
    return Array.from(this.marketMetadataMap.values());
  }

  /**
   * Fetch historical candles via Binance REST API
   */
  public async fetchHistoricalCandles(
    symbol: MarketSymbol,
    timeframe: Timeframe,
    limit = 100
  ): Promise<Candle[]> {
    try {
      const isNative = CandleAggregatorService.isNativeBinanceInterval(timeframe);
      const { interval, multiplier } = CandleAggregatorService.getBaseFetchInterval(timeframe);

      // Fetch enough base candles to construct aggregated ones if needed
      const fetchLimit = isNative ? Math.min(limit, 500) : Math.min(limit * multiplier * 2, 500);
      let raw: unknown = [];
      let successfulBaseUrl = this.restUrl;
      for (const baseUrl of this.getRestUrls()) {
        const url = `${baseUrl}/api/v3/klines?symbol=${symbol}&interval=${interval}&limit=${fetchLimit}`;
        const res = await fetch(url);
        if (!res.ok) {
          const body = await res.text().catch(() => '');
          console.warn(
            `[BinanceDataService] Klines failed from ${baseUrl} for ${symbol} ${timeframe}: HTTP ${res.status} ${res.statusText}${body ? `: ${body.slice(0, 160)}` : ''}`
          );
          continue;
        }
        raw = await res.json();
        successfulBaseUrl = baseUrl;
        break;
      }
      this.restUrl = successfulBaseUrl;
      if (!Array.isArray(raw)) {
        return [];
      }

      const baseCandles: Candle[] = raw.map((item: any[]) => ({
        symbol,
        timeframe: (isNative ? timeframe : (interval as Timeframe)),
        openTime: Number(item[0]),
        open: parseFloat(item[1]),
        high: parseFloat(item[2]),
        low: parseFloat(item[3]),
        close: parseFloat(item[4]),
        volume: parseFloat(item[5]),
        closeTime: Number(item[6]),
        isClosed: Date.now() > Number(item[6]),
        source: 'binance_rest',
      }));

      if (isNative) {
        return baseCandles.slice(-limit);
      }

      // For sub-minute timeframes (5s/10s/15s/30s): the 1s endpoint is not public.
      // We use 1m candles as a historical seed so the chart isn't blank on load.
      // Live trade-stream ticks will build the real sub-minute candles on top.
      const isSubMinute = ['5s', '10s', '15s', '30s'].includes(timeframe);
      if (isSubMinute) {
        // Re-tag candles with the requested sub-minute timeframe so the client
        // matches them to the correct stream key.
        return baseCandles.slice(-limit).map((c) => ({ ...c, timeframe }));
      }

      // Aggregate into requested custom timeframe (2m, 3h)
      const aggregated = CandleAggregatorService.aggregateCandles(baseCandles, timeframe, symbol);
      return aggregated.slice(-limit);
    } catch (err) {
      console.error(`[BinanceDataService] Failed to fetch klines for ${symbol} ${timeframe}:`, (err as Error).message);
      return [];
    }
  }

  /**
   * Connect to Binance Public Multiplex WebSocket Stream
   */
  public connectWebSocket(): void {
    if (this.wsClient && (this.wsClient.readyState === WebSocket.OPEN || this.wsClient.readyState === WebSocket.CONNECTING)) {
      return;
    }

    this.isConnecting = true;
    const streamEndpoint = `${this.wsUrl}/stream`;
    this.receivedMessageOnCurrentSocket = false;

    try {
      this.wsClient = new WebSocket(streamEndpoint);

      this.wsClient.on('open', () => {
        console.log(`[Binance WebSocket] Connected to Binance Public Stream: ${streamEndpoint}`);
        this.isConnecting = false;
        this.reconnectAttempts = 0;
        this.lastMessageTimestamp = Date.now();
        this.startHeartbeat();

        // Resubscribe active streams if any
        if (this.activeSubscriptions.size > 0) {
          this.sendWsSubscription(Array.from(this.activeSubscriptions), 'SUBSCRIBE');
        }
      });

      this.wsClient.on('message', (data: WebSocket.Data) => {
        this.lastMessageTimestamp = Date.now();
        this.receivedMessageOnCurrentSocket = true;
        this.handleStreamMessage(data.toString());
      });

      this.wsClient.on('error', (err) => {
        console.warn('[Binance WebSocket] Connection error:', err.message);
      });

      this.wsClient.on('close', (code, reason) => {
        console.warn(`[Binance WebSocket] Closed (code: ${code}, reason: ${reason}). Scheduling reconnect...`);
        this.stopHeartbeat();
        const fallback = this.getWsUrls().find((url) => url !== this.wsUrl);
        if (fallback && !this.receivedMessageOnCurrentSocket) {
          console.warn(`[Binance WebSocket] No stream data received. Retrying with fallback endpoint: ${fallback}`);
          this.wsUrl = fallback;
        }
        this.scheduleReconnect();
      });
    } catch (err) {
      console.error('[Binance WebSocket] Initialization error:', err);
      this.scheduleReconnect();
    }
  }

  private scheduleReconnect() {
    this.wsClient = null;
    this.isConnecting = false;
    this.reconnectAttempts++;
    const delay = Math.min(1000 * Math.pow(1.5, this.reconnectAttempts), this.maxReconnectDelay);
    console.log(`[Binance WebSocket] Reconnecting in ${Math.round(delay)}ms (Attempt #${this.reconnectAttempts})...`);
    setTimeout(() => {
      this.connectWebSocket();
    }, delay);
  }

  private startHeartbeat() {
    this.stopHeartbeat();
    this.heartbeatTimer = setInterval(() => {
      // If no message received for over 45s, connection is stale
      if (Date.now() - this.lastMessageTimestamp > 45000) {
        console.warn('[Binance WebSocket] Stale connection detected. Terminating and reconnecting.');
        if (this.wsClient) {
          this.wsClient.terminate();
        }
      }
    }, 15000);
  }

  private stopHeartbeat() {
    if (this.heartbeatTimer) {
      clearInterval(this.heartbeatTimer);
      this.heartbeatTimer = null;
    }
  }

  private sendWsSubscription(streams: string[], method: 'SUBSCRIBE' | 'UNSUBSCRIBE') {
    if (this.wsClient && this.wsClient.readyState === WebSocket.OPEN && streams.length > 0) {
      const payload = {
        method,
        params: streams,
        id: Date.now(),
      };
      this.wsClient.send(JSON.stringify(payload));
    }
  }

  /**
   * Subscribe to live updates for symbol and timeframe
   */
  public subscribe(symbol: MarketSymbol, timeframe: Timeframe, listener: CandleListener): () => void {
    const key = `${symbol}:${timeframe}`;
    if (!this.candleListeners.has(key)) {
      this.candleListeners.set(key, new Set());
    }
    this.candleListeners.get(key)!.add(listener);

    // Determine streams to subscribe on Binance
    const symLower = symbol.toLowerCase();
    const streamsToSub: string[] = [];

    // Native kline stream or 1m kline + trade stream for sub-minute aggregation
    if (CandleAggregatorService.isNativeBinanceInterval(timeframe)) {
      const streamName = `${symLower}@kline_${timeframe}`;
      streamsToSub.push(streamName);
      this.activeSubscriptions.add(streamName);
    } else {
      // Sub-minute or custom: subscribe to trade stream + 1m kline
      const tradeStream = `${symLower}@trade`;
      const kline1mStream = `${symLower}@kline_1m`;
      streamsToSub.push(tradeStream, kline1mStream);
      this.activeSubscriptions.add(tradeStream);
      this.activeSubscriptions.add(kline1mStream);
    }

    if (this.wsClient && this.wsClient.readyState === WebSocket.OPEN) {
      this.sendWsSubscription(streamsToSub, 'SUBSCRIBE');
    } else {
      this.connectWebSocket();
    }

    // Return unsubscribe function
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

  private notifyCandleListeners(symbol: MarketSymbol, timeframe: Timeframe, candle: Candle, wasClosed: boolean) {
    const key = `${symbol}:${timeframe}`;
    const listeners = this.candleListeners.get(key);
    if (listeners) {
      listeners.forEach((fn) => {
        try {
          fn(candle, wasClosed);
        } catch (e) {
          console.error('[BinanceDataService] Error in candle listener callback:', e);
        }
      });
    }
  }

  private notifyTickerListeners(symbol: MarketSymbol, meta: MarketMetadata) {
    const listeners = this.tickerListeners.get(symbol);
    if (listeners) {
      listeners.forEach((fn) => {
        try {
          fn(meta);
        } catch (e) {
          console.error('[BinanceDataService] Error in ticker listener callback:', e);
        }
      });
    }
  }

  /**
   * Handle incoming raw multiplex message
   */
  private handleStreamMessage(rawMsg: string) {
    try {
      const msg = JSON.parse(rawMsg);
      if (!msg.stream || !msg.data) return;

      const stream: string = msg.stream;
      const data = msg.data;

      // Handle Kline Stream
      if (stream.includes('@kline_')) {
        const k = data.k;
        if (!k) return;
        const sym = k.s as MarketSymbol;
        const interval = k.i as Timeframe;
        const isClosed = k.x;

        const candle: Candle = {
          symbol: sym,
          timeframe: interval,
          openTime: Number(k.t),
          closeTime: Number(k.T),
          open: parseFloat(k.o),
          high: parseFloat(k.h),
          low: parseFloat(k.l),
          close: parseFloat(k.c),
          volume: parseFloat(k.v),
          isClosed,
          source: 'binance_ws',
        };

        // Notify direct listeners for native timeframe
        this.notifyCandleListeners(sym, interval, candle, isClosed);

        // If this is 1m kline, feed stateful rolling aggregation for 2m
        if (interval === '1m') {
          const { candle: agg2m, wasClosed: closed2m, closedCandle: closed2mCandle } =
            CandleAggregatorService.processKline(sym, '2m', candle);
          if (closed2m && closed2mCandle) {
            this.notifyCandleListeners(sym, '2m', closed2mCandle, true);
          }
          this.notifyCandleListeners(sym, '2m', agg2m, false);
        }
        // If this is 1h kline, feed stateful rolling aggregation for 3h
        if (interval === '1h') {
          const { candle: agg3h, wasClosed: closed3h, closedCandle: closed3hCandle } =
            CandleAggregatorService.processKline(sym, '3h', candle);
          if (closed3h && closed3hCandle) {
            this.notifyCandleListeners(sym, '3h', closed3hCandle, true);
          }
          this.notifyCandleListeners(sym, '3h', agg3h, false);
        }
      }

      // Handle Trade Stream (for sub-minute intervals: 5s, 10s, 15s, 30s)
      if (stream.includes('@trade')) {
        const sym = data.s as MarketSymbol;
        const price = parseFloat(data.p);
        const volume = parseFloat(data.q);
        const tradeTime = Number(data.T);

        // Update live price metadata
        const meta = this.marketMetadataMap.get(sym);
        if (meta) {
          meta.lastPrice = price;
          meta.lastUpdated = tradeTime;
          this.notifyTickerListeners(sym, meta);
        }

        // Feed sub-minute aggregators
        const subIntervals: Timeframe[] = ['5s', '10s', '15s', '30s'];
        for (const tf of subIntervals) {
          const key = `${sym}:${tf}`;
          if (this.candleListeners.has(key)) {
            const { candle, wasClosed, closedCandle } = CandleAggregatorService.processTick(
              sym,
              tf,
              price,
              volume,
              tradeTime
            );

            if (wasClosed && closedCandle) {
              this.notifyCandleListeners(sym, tf, closedCandle, true);
            }
            this.notifyCandleListeners(sym, tf, candle, false);
          }
        }
      }
    } catch (err) {
      console.warn('[BinanceDataService] Error parsing stream message:', (err as Error).message);
    }
  }
}

export const binanceDataService = new BinanceDataService();
