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
  private maxReconnectAttempts = 20;
  private pingInterval: NodeJS.Timeout | null = null;
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

    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${protocol}//${window.location.host}/ws`;

    try {
      this.ws = new WebSocket(wsUrl);

      this.ws.onopen = () => {
        this.setStatus('connected');
        this.reconnectAttempts = 0;
        this.startHeartbeat();

        // Resubscribe if active pair was selected
        if (this.currentSymbol && this.currentTimeframe) {
          this.subscribe(this.currentSymbol, this.currentTimeframe);
        }
      };

      this.ws.onmessage = (event) => {
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
      this.setStatus('disconnected');
      return;
    }

    this.setStatus('reconnecting');
    this.reconnectAttempts++;
    const delay = Math.min(1000 * Math.pow(1.5, this.reconnectAttempts), 15000);
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

  private handleMessage(msg: { event: string; data: any }) {
    switch (msg.event) {
      case 'market:snapshot':
        this.snapshotListeners.forEach((fn) => fn(msg.data));
        break;
      case 'candle:update':
        if (msg.data?.candle) {
          this.candleUpdateListeners.forEach((fn) => fn(msg.data.candle));
        }
        break;
      case 'candle:closed':
        if (msg.data?.candle) {
          this.candleClosedListeners.forEach((fn) => fn(msg.data.candle));
        }
        break;
      case 'prediction:new':
        this.predictionNewListeners.forEach((fn) => fn(msg.data));
        break;
      case 'prediction:evaluated':
        if (msg.data?.evaluation) {
          this.predictionEvaluatedListeners.forEach((fn) => fn(msg.data.evaluation));
        }
        break;
      case 'connection:status':
        if (msg.data?.status) {
          this.setStatus(msg.data.status);
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
