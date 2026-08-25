import { Candle, ConnectionStatus, MarketMetadata, MarketSymbol, Prediction, Timeframe } from '../types/market';

export interface MarketSnapshotPayload {
  symbol: MarketSymbol;
  timeframe: Timeframe;
  metadata: MarketMetadata | null;
  candles: Candle[];
  predictions: {
    prediction1: Prediction;
    prediction2: Prediction;
  } | null;
  recentEvaluations: Prediction[];
}

export type SnapshotCallback = (snapshot: MarketSnapshotPayload) => void;
export type CandleUpdateCallback = (candle: Candle) => void;
export type CandleClosedCallback = (candle: Candle) => void;
export type PredictionNewCallback = (data: { prediction1: Prediction; prediction2: Prediction }) => void;
export type PredictionEvaluatedCallback = (prediction: Prediction) => void;
export type StatusCallback = (status: ConnectionStatus) => void;

export class WebSocketClient {
  private static instance: WebSocketClient;
  private ws: WebSocket | null = null;
  private status: ConnectionStatus = 'disconnected';
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 50; // effectively unlimited with the cap on delay
  private pingInterval: NodeJS.Timeout | null = null;
  private staleCheckInterval: NodeJS.Timeout | null = null;
  private lastMessageAt = 0;
  private currentSymbol: MarketSymbol | null = null;
  private currentTimeframe: Timeframe | null = null;

  private snapshotListeners = new Set<SnapshotCallback>();
  private candleUpdateListeners = new Set<CandleUpdateCallback>();
  private candleClosedListeners = new Set<CandleClosedCallback>();
  private predictionNewListeners = new Set<PredictionNewCallback>();
  private predictionEvaluatedListeners = new Set<PredictionEvaluatedCallback>();
  private statusListeners = new Set<StatusCallback>();

  private constructor() {}

  public static getInstance(): WebSocketClient {
    if (!WebSocketClient.instance) {
      WebSocketClient.instance = new WebSocketClient();
    }
    return WebSocketClient.instance;
  }

  public connect() {
    if (this.ws && (this.ws.readyState === WebSocket.OPEN || this.ws.readyState === WebSocket.CONNECTING)) {
      return;
    }

    this.setStatus('connecting');

    const wsUrl = process.env.NEXT_PUBLIC_WS_URL;

    if (!wsUrl) {
      console.error('[WS Client] NEXT_PUBLIC_WS_URL is not set.');
      this.setStatus('disconnected');
      setTimeout(() => this.connect(), 5000);
      return;
    }

    try {
      this.ws = new WebSocket(wsUrl);

      this.ws.onopen = () => {
        this.setStatus('connected');
        this.reconnectAttempts = 0;
        this.lastMessageAt = Date.now();
        this.startHeartbeat();
        this.startStaleCheck();

        // Resubscribe if active pair was selected
        if (this.currentSymbol && this.currentTimeframe) {
          this.subscribe(this.currentSymbol, this.currentTimeframe);
        }
      };

      this.ws.onmessage = (event) => {
        this.lastMessageAt = Date.now();
        try {
          const msg = JSON.parse(event.data);
          this.handleMessage(msg);
        } catch (e) {
          console.warn('[WS Client] Error parsing incoming message:', e);
        }
      };

      this.ws.onerror = (err) => {
        console.warn('[WS Client] WebSocket connection error:', err);
      };

      this.ws.onclose = () => {
        this.stopHeartbeat();
        this.stopStaleCheck();
        this.setStatus('disconnected');
        this.scheduleReconnect();
      };
    } catch (err) {
      console.error('[WS Client] Connect failed:', err);
      this.scheduleReconnect();
    }
  }

  private scheduleReconnect() {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      // Reset counter so we keep trying indefinitely (server may be starting up)
      this.reconnectAttempts = 0;
    }

    this.setStatus('reconnecting');
    this.reconnectAttempts++;
    // Back off: 1s → 1.5s → 2.25s → ... capped at 15s
    const delay = Math.min(1000 * Math.pow(1.5, this.reconnectAttempts), 15000);
    console.log(`[WS Client] Reconnecting in ${Math.round(delay)}ms (attempt ${this.reconnectAttempts})…`);
    setTimeout(() => {
      this.connect();
    }, delay);
  }

  private startHeartbeat() {
    this.stopHeartbeat();
    this.pingInterval = setInterval(() => {
      if (this.ws && this.ws.readyState === WebSocket.OPEN) {
        this.ws.send(JSON.stringify({ event: 'ping', data: { time: Date.now() } }));
      }
    }, 20000);
  }

  private stopHeartbeat() {
    if (this.pingInterval) {
      clearInterval(this.pingInterval);
      this.pingInterval = null;
    }
  }

  /** Detect stale connections: if no message in 45s, force reconnect */
  private startStaleCheck() {
    this.stopStaleCheck();
    this.staleCheckInterval = setInterval(() => {
      if (this.lastMessageAt > 0 && Date.now() - this.lastMessageAt > 45000) {
        console.warn('[WS Client] Stale connection detected — forcing reconnect');
        this.setStatus('stale');
        this.ws?.close();
      }
    }, 15000);
  }

  private stopStaleCheck() {
    if (this.staleCheckInterval) {
      clearInterval(this.staleCheckInterval);
      this.staleCheckInterval = null;
    }
  }

  private setStatus(status: ConnectionStatus) {
    this.status = status;
    this.statusListeners.forEach((fn) => fn(status));
  }

  public getStatus(): ConnectionStatus {
    return this.status;
  }

  public subscribe(symbol: MarketSymbol, timeframe: Timeframe) {
    this.currentSymbol = symbol;
    this.currentTimeframe = timeframe;

    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(
        JSON.stringify({
          event: 'market:subscribe',
          data: { symbol, timeframe },
        })
      );
    }
  }

  public unsubscribe(symbol: MarketSymbol, timeframe: Timeframe) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(
        JSON.stringify({
          event: 'market:unsubscribe',
          data: { symbol, timeframe },
        })
      );
    }
  }

  private handleMessage(msg: { event: string; data: unknown }) {
    const data = msg.data as Record<string, unknown> | undefined;
    switch (msg.event) {
      case 'market:snapshot':
        this.snapshotListeners.forEach((fn) => fn(msg.data as MarketSnapshotPayload));
        break;
      case 'candle:update':
        if (data?.candle) {
          this.candleUpdateListeners.forEach((fn) => fn(data.candle as Candle));
        }
        break;
      case 'candle:closed':
        if (data?.candle) {
          this.candleClosedListeners.forEach((fn) => fn(data.candle as Candle));
        }
        break;
      case 'prediction:new':
        this.predictionNewListeners.forEach((fn) => fn(msg.data as { prediction1: Prediction; prediction2: Prediction }));
        break;
      case 'prediction:evaluated':
        if (data?.evaluation) {
          this.predictionEvaluatedListeners.forEach((fn) => fn(data.evaluation as Prediction));
        }
        break;
      case 'connection:status':
        if (data?.status) {
          this.setStatus(data.status as ConnectionStatus);
        }
        break;
    }
  }

  // Listener subscriptions
  public onSnapshot(fn: SnapshotCallback) {
    this.snapshotListeners.add(fn);
    return () => this.snapshotListeners.delete(fn);
  }

  public onCandleUpdate(fn: CandleUpdateCallback) {
    this.candleUpdateListeners.add(fn);
    return () => this.candleUpdateListeners.delete(fn);
  }

  public onCandleClosed(fn: CandleClosedCallback) {
    this.candleClosedListeners.add(fn);
    return () => this.candleClosedListeners.delete(fn);
  }

  public onPredictionNew(fn: PredictionNewCallback) {
    this.predictionNewListeners.add(fn);
    return () => this.predictionNewListeners.delete(fn);
  }

  public onPredictionEvaluated(fn: PredictionEvaluatedCallback) {
    this.predictionEvaluatedListeners.add(fn);
    return () => this.predictionEvaluatedListeners.delete(fn);
  }

  public onStatus(fn: StatusCallback) {
    this.statusListeners.add(fn);
    return () => this.statusListeners.delete(fn);
  }
}

export const wsClient = WebSocketClient.getInstance();
