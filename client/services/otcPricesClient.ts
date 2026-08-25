/**
 * OTC Prices Client
 * Polls the server's /api/otc-prices endpoint every 60s and
 * notifies subscribers with the latest price map.
 */

export interface OtcPrice {
  symbol: string;
  price: number;
  change: number;
  changePct: number;
  source: 'binance' | 'twelve_data' | 'frankfurter' | 'goldprice' | 'yahoo';
  updatedAt: number;
}

export type OtcPricesMap = Record<string, OtcPrice>;
export type OtcPricesListener = (prices: OtcPricesMap) => void;

class OtcPricesClient {
  private static instance: OtcPricesClient;
  private cache: OtcPricesMap = {};
  private listeners = new Set<OtcPricesListener>();
  private timer: ReturnType<typeof setInterval> | null = null;
  private isFetching = false;
  private readonly POLL_MS = 60_000;

  private constructor() {}

  public static getInstance(): OtcPricesClient {
    if (!OtcPricesClient.instance) {
      OtcPricesClient.instance = new OtcPricesClient();
    }
    return OtcPricesClient.instance;
  }

  /** Subscribe to price updates. Returns an unsubscribe function. */
  public subscribe(fn: OtcPricesListener): () => void {
    this.listeners.add(fn);
    // Deliver cached data immediately if available
    if (Object.keys(this.cache).length > 0) {
      fn(this.cache);
    }
    // Start polling if this is the first subscriber
    if (this.listeners.size === 1) {
      this.startPolling();
    }
    return () => {
      this.listeners.delete(fn);
      if (this.listeners.size === 0) {
        this.stopPolling();
      }
    };
  }

  public getCache(): OtcPricesMap {
    return this.cache;
  }

  private startPolling() {
    this.fetch();
    this.timer = setInterval(() => this.fetch(), this.POLL_MS);
  }

  private stopPolling() {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
  }

  private async fetch() {
    if (this.isFetching) return;
    this.isFetching = true;

    const apiUrl = process.env.NEXT_PUBLIC_API_URL;
    if (!apiUrl) {
      this.isFetching = false;
      return;
    }

    try {
      const res = await fetch(`${apiUrl}/otc-prices`, {
        next: { revalidate: 0 }, // always fresh
      } as RequestInit);

      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json();

      if (json.success && json.data) {
        this.cache = json.data as OtcPricesMap;
        this.listeners.forEach((fn) => fn(this.cache));
      }
    } catch (err) {
      console.warn('[OtcPricesClient] Fetch failed:', (err as Error).message);
    } finally {
      this.isFetching = false;
    }
  }
}

export const otcPricesClient = OtcPricesClient.getInstance();
