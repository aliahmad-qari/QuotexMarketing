import { Server as HTTPServer } from 'http';
import WebSocket, { WebSocketServer } from 'ws';
import { marketHubService } from '../services/MarketHubService';
import { MarketSymbol, Timeframe } from '../types/market.types';

interface ClientConnection {
  ws: WebSocket;
  isAlive: boolean;
  subscriptions: Set<string>; // room keys e.g. "BTCUSDT:1m"
}

let activeClientCount = 0;

const VALID_SYMBOLS: MarketSymbol[] = [
  'BTCUSDT',
  'ETHUSDT',
  'BNBUSDT',
  'SOLUSDT',
  'XRPUSDT',
  'ADAUSDT',
  'DOGEUSDT',
];

const VALID_TIMEFRAMES: Timeframe[] = [
  '5s',
  '10s',
  '15s',
  '30s',
  '1m',
  '2m',
  '5m',
  '1h',
  '2h',
  '3h',
];

export function setupWebSocketServer(httpServer: HTTPServer) {
  const wss = new WebSocketServer({ server: httpServer, path: '/ws' });
  const clients = new Map<WebSocket, ClientConnection>();

  // Broadcaster function wired to MarketHubService
  marketHubService.setBroadcaster((event: string, payload: any, room?: string) => {
    const message = JSON.stringify({ event, data: payload, timestamp: Date.now() });

    clients.forEach((client, ws) => {
      if (ws.readyState === WebSocket.OPEN) {
        if (!room || client.subscriptions.has(room)) {
          ws.send(message);
        }
      }
    });
  });

  wss.on('connection', (ws: WebSocket) => {
    const client: ClientConnection = {
      ws,
      isAlive: true,
      subscriptions: new Set(),
    };
    clients.set(ws, client);
    activeClientCount = clients.size;

    // Send connection ready
    ws.send(
      JSON.stringify({
        event: 'connection:ready',
        data: {
          status: 'connected',
          serverTime: Date.now(),
          supportedSymbols: VALID_SYMBOLS,
          supportedTimeframes: VALID_TIMEFRAMES,
        },
      })
    );

    ws.on('pong', () => {
      client.isAlive = true;
    });

    ws.on('message', async (raw: WebSocket.Data) => {
      try {
        const parsed = JSON.parse(raw.toString());
        const { event, data } = parsed;

        if (event === 'ping') {
          ws.send(JSON.stringify({ event: 'pong', timestamp: Date.now() }));
          return;
        }

        if (event === 'market:subscribe') {
          const symbol = data?.symbol as MarketSymbol;
          const timeframe = data?.timeframe as Timeframe;

          if (!VALID_SYMBOLS.includes(symbol) || !VALID_TIMEFRAMES.includes(timeframe)) {
            ws.send(
              JSON.stringify({
                event: 'market:error',
                data: { message: `Invalid symbol (${symbol}) or timeframe (${timeframe})` },
              })
            );
            return;
          }

          const room = `${symbol}:${timeframe}`;
          client.subscriptions.add(room);

          // Return full initial market snapshot immediately
          try {
            const snapshot = await marketHubService.getMarketSnapshot(symbol, timeframe);
            ws.send(
              JSON.stringify({
                event: 'market:snapshot',
                data: snapshot,
              })
            );
          } catch (err) {
            ws.send(
              JSON.stringify({
                event: 'market:error',
                data: { message: 'Failed to load initial market snapshot' },
              })
            );
          }
        } else if (event === 'market:unsubscribe') {
          const symbol = data?.symbol as MarketSymbol;
          const timeframe = data?.timeframe as Timeframe;
          if (symbol && timeframe) {
            const room = `${symbol}:${timeframe}`;
            client.subscriptions.delete(room);
          }
        }
      } catch (err) {
        console.warn('[WS Server] Failed to process incoming message:', (err as Error).message);
      }
    });

    ws.on('close', () => {
      clients.delete(ws);
      activeClientCount = clients.size;
    });

    ws.on('error', (err) => {
      console.warn('[WS Server] Socket error:', err.message);
      clients.delete(ws);
      activeClientCount = clients.size;
    });
  });

  // Keep-alive heartbeat interval
  const interval = setInterval(() => {
    clients.forEach((client, ws) => {
      if (!client.isAlive) {
        clients.delete(ws);
        activeClientCount = clients.size;
        return ws.terminate();
      }
      client.isAlive = false;
      ws.ping();
    });
  }, 30000);

  wss.on('close', () => {
    clearInterval(interval);
  });

  return wss;
}

export function getWebSocketStats() {
  return {
    clients: activeClientCount,
  };
}
