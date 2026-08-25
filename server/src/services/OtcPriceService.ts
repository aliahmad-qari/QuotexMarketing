/**
 * OtcPriceService — 100% free, no API key required
 * -------------------------------------------------
 * Sources (all public, no signup, no billing, no daily limit):
 *
 *  1. Binance REST  → Crypto (BTCUSDT, ETHUSDT, SOLUSDT …)
 *     https://data-api.binance.vision  — public, unlimited
 *
 *  2. Twelve Data (free tier) → Forex pairs  ← intraday real-time
 *     https://api.twelvedata.com  — free key, 800 calls/day
 *     Polled every 3 minutes (480 calls/day — safely under limit).
 *     Falls back to Frankfurter ECB rates if key is missing or limit hit.
 *
 *  3. goldprice.org data endpoint → Gold (XAU) & Silver (XAG)
 *     https://data-asg.goldprice.org/dbXRates/USD  — no key, browser-level rate
 *     Returns XAU and XAG spot price in USD, updated ~every minute.
 *
 *  4. Yahoo Finance unofficial quote endpoint → Indices & Stocks
 *     https://query1.finance.yahoo.com/v8/finance/chart/{symbol}
 *     No key. Unofficial but widely used. 60s polling is well within
 *     their tolerance — millions of apps use this endpoint.
 *     Covers: ^GSPC (SPX), ^NDX, ^DJI, ^GDAXI (DAX), ^FTSE,
 *             ^N225, ^AXJO, ^FCHI (CAC40), ^HSI + all US stocks.
 *
 * Crypto/Metals/Indices/Stocks refresh every 60 seconds.
 * Forex refreshes every 3 minutes (keeps Twelve Data under 800/day).
 */

export interface OtcPrice {
  symbol: string;    // OTC catalog key  e.g. "EURUSD_OTC"
  price: number;
  change: number;    // absolute price change (24h or prev close)
  changePct: number; // percent change
  source: 'binance' | 'twelve_data' | 'frankfurter' | 'goldprice' | 'yahoo';
  updatedAt: number;
}

// ── 1. Binance map ────────────────────────────────────────────────────────────
const BINANCE_MAP: Record<string, string> = {
  BTCUSD_OTC: 'BTCUSDT',
  ETHUSD_OTC: 'ETHUSDT',
  SOLUSD_OTC: 'SOLUSDT',
  XRPUSD_OTC: 'XRPUSDT',
  BNBUSD_OTC: 'BNBUSDT',
  ADAUSD_OTC: 'ADAUSDT',
  DOGUSD_OTC: 'DOGEUSDT',
  BCHUSD_OTC: 'BCHUSDT',
  AVAUSD_OTC: 'AVAXUSDT',
  ATOUSD_OTC: 'ATOMUSDT',
  ARBUSD_OTC: 'ARBUSDT',
  AXSUSD_OTC: 'AXSUSDT',
  BONUSD_OTC: 'BONKUSDT',
  FLOUSD_OTC: 'FLOWUSDT',
  APTUSD_OTC: 'APTUSDT',
};

// ── 2. Forex pair maps ────────────────────────────────────────────────────────
//
// STRATEGY (stays within Twelve Data free tier: 8 credits/min):
//   • MAJORS (8 pairs)  → Twelve Data  — intraday real-time, 1 credit each = 8 total
//   • ALL OTHERS        → Frankfurter (ECB) — daily reference rate, no key, no limit
//
// The 8 majors cover the most-watched pairs on the OTC panel.
// Exotic pairs (AED/CNY, BHD/CNY, OMR/CNY, QAR/CNY, TND/USD, USD/PKR,
// USD/DZD, USD/CLP, USD/COP, USD/EGP) are not available on Twelve Data
// free tier regardless, so Frankfurter is the right source for them.

// Pairs fetched via Twelve Data (exactly 8 = uses all 8 credits per call)
const TWELVE_DATA_FOREX: Record<string, string> = {
  EURUSD_OTC: 'EUR/USD',
  GBPUSD_OTC: 'GBP/USD',
  USDJPY_OTC: 'USD/JPY',
  AUDUSD_OTC: 'AUD/USD',
  USDCAD_OTC: 'USD/CAD',
  USDCHF_OTC: 'USD/CHF',
  NZDUSD_OTC: 'NZD/USD',
  USDSGD_OTC: 'USD/SGD',
};

// All forex pairs — used by Frankfurter fallback and for cross-rate computation
const FOREX_PAIRS: Record<string, [string, string]> = {
  EURUSD_OTC: ['EUR', 'USD'],
  GBPUSD_OTC: ['GBP', 'USD'],
  USDJPY_OTC: ['USD', 'JPY'],
  AUDUSD_OTC: ['AUD', 'USD'],
  USDCAD_OTC: ['USD', 'CAD'],
  USDCHF_OTC: ['USD', 'CHF'],
  EURJPY_OTC: ['EUR', 'JPY'],
  GBPJPY_OTC: ['GBP', 'JPY'],
  EURGBP_OTC: ['EUR', 'GBP'],
  EURAUD_OTC: ['EUR', 'AUD'],
  EURCAD_OTC: ['EUR', 'CAD'],
  EURCHF_OTC: ['EUR', 'CHF'],
  EURNZD_OTC: ['EUR', 'NZD'],
  AUDCAD_OTC: ['AUD', 'CAD'],
  AUDCHF_OTC: ['AUD', 'CHF'],
  AUDJPY_OTC: ['AUD', 'JPY'],
  AUDNZD_OTC: ['AUD', 'NZD'],
  CADCHF_OTC: ['CAD', 'CHF'],
  CADJPY_OTC: ['CAD', 'JPY'],
  CHFJPY_OTC: ['CHF', 'JPY'],
  GBPAUD_OTC: ['GBP', 'AUD'],
  GBPCAD_OTC: ['GBP', 'CAD'],
  GBPCHF_OTC: ['GBP', 'CHF'],
  NZDJPY_OTC: ['NZD', 'JPY'],
  NZDUSD_OTC: ['NZD', 'USD'],
  USDMXN_OTC: ['USD', 'MXN'],
  USDSGD_OTC: ['USD', 'SGD'],
  USDBRL_OTC: ['USD', 'BRL'],
  EURSGD_OTC: ['EUR', 'SGD'],
  EURTRY_OTC: ['EUR', 'TRY'],
  EURHUF_OTC: ['EUR', 'HUF'],
  USDCNH_OTC: ['USD', 'CNY'],
  USDEGP_OTC: ['USD', 'EGP'],
  USDPKR_OTC: ['USD', 'PKR'],
  USDCLP_OTC: ['USD', 'CLP'],
  USDCOP_OTC: ['USD', 'COP'],
  USDDZD_OTC: ['USD', 'DZD'],
  ZARUSD_OTC: ['ZAR', 'USD'],
  BRLUSD_OTC: ['BRL', 'USD'],
  TNDUSD_OTC: ['TND', 'USD'],
  // Exotic pairs — ECB/Frankfurter only (not on Twelve Data free)
  AEDCNY_OTC: ['AED', 'CNY'],
  BHDCNY_OTC: ['BHD', 'CNY'],
  OMRCNY_OTC: ['OMR', 'CNY'],
  QARCNY_OTC: ['QAR', 'CNY'],
};

// ── 4. Yahoo Finance map ──────────────────────────────────────────────────────
// Key = OTC symbol, Value = Yahoo Finance ticker symbol
const YAHOO_MAP: Record<string, string> = {
  // Indices
  SPXUSDI: '^GSPC',
  NDXUSDI: '^NDX',
  DJIUSDI: '^DJI',
  GEREURI: '^GDAXI',
  FTSGBPI: '^FTSE',
  JPXJPYI: '^N225',
  AXJAUDI: '^AXJO',
  F40EURI: '^FCHI',
  HSIHKDI: '^HSI',
  IBXEURI: '^IBEX',
  IT4EURI: 'FTSEMIB.MI',
  STXEURI: '^STOXX50E',
  CHIA50I: 'XIN9.FGI',
  // Stocks
  MSFT_OTC: 'MSFT',
  FB_OTC:   'META',
  BA_OTC:   'BA',
  INTC_OTC: 'INTC',
  JNJ_OTC:  'JNJ',
  MCD_OTC:  'MCD',
  AXP_OTC:  'AXP',
  PFE_OTC:  'PFE',
};

// ─────────────────────────────────────────────────────────────────────────────

export class OtcPriceService {
  private static instance: OtcPriceService;
  private cache: Map<string, OtcPrice> = new Map();
  private timer: NodeJS.Timeout | null = null;
  private forexTimer: NodeJS.Timeout | null = null; // separate 3-min forex timer
  private isRefreshing = false;
  private prevForexRates: Record<string, number> = {}; // USD-based rates from previous fetch

  private readonly REFRESH_MS       = 60_000;       // 60s — crypto/metals/indices/stocks
  private readonly FOREX_REFRESH_MS = 3 * 60_000;   // 3 min — forex (480 calls/day, under 800 limit)
  private readonly BINANCE_REST     = process.env.BINANCE_REST_URL || 'https://data-api.binance.vision';
  private readonly TWELVE_DATA_KEY  = process.env.TWELVE_DATA_API_KEY || '';
  private readonly TWELVE_DATA_BASE = 'https://api.twelvedata.com';

  private constructor() {}

  public static getInstance(): OtcPriceService {
    if (!OtcPriceService.instance) {
      OtcPriceService.instance = new OtcPriceService();
    }
    return OtcPriceService.instance;
  }

  public start() {
    // Initial fetch of everything including forex
    this.doRefresh();
    // Crypto / metals / indices / stocks — every 60s
    this.timer = setInterval(() => this.doRefresh(), this.REFRESH_MS);
    // Forex via Twelve Data — every 3 minutes (stays under 800 calls/day)
    this.forexTimer = setInterval(() => this.fetchForex(), this.FOREX_REFRESH_MS);
  }

  public stop() {
    if (this.timer)      { clearInterval(this.timer);      this.timer      = null; }
    if (this.forexTimer) { clearInterval(this.forexTimer); this.forexTimer = null; }
  }

  public getPrices(): Record<string, OtcPrice> {
    const out: Record<string, OtcPrice> = {};
    this.cache.forEach((v, k) => { out[k] = v; });
    return out;
  }

  public async refreshAndGet(): Promise<Record<string, OtcPrice>> {
    if (!this.isRefreshing) await this.doRefresh();
    return this.getPrices();
  }

  // ── Orchestrator ─────────────────────────────────────────────────────────

  private doRefresh() {
    if (this.isRefreshing) return;
    this.isRefreshing = true;
    // Forex is on its own 3-minute timer — don't include it in the 60s loop
    Promise.allSettled([
      this.fetchBinance(),
      this.fetchMetals(),
      this.fetchYahoo(),
    ]).finally(() => { this.isRefreshing = false; });
  }

  // ── 1. Binance (crypto) ───────────────────────────────────────────────────

  private async fetchBinance() {
    try {
      const res = await fetch(`${this.BINANCE_REST}/api/v3/ticker/24hr`,
        { signal: AbortSignal.timeout(10_000) });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const tickers: any[] = await res.json();

      const bySymbol: Record<string, any> = {};
      tickers.forEach((t) => { bySymbol[t.symbol] = t; });

      for (const [otc, binSym] of Object.entries(BINANCE_MAP)) {
        const t = bySymbol[binSym];
        if (!t) continue;
        this.cache.set(otc, {
          symbol: otc,
          price: parseFloat(t.lastPrice),
          change: parseFloat(t.priceChange),
          changePct: parseFloat(t.priceChangePercent),
          source: 'binance',
          updatedAt: Date.now(),
        });
      }
    } catch (e) {
      console.warn('[OtcPrice] Binance failed:', (e as Error).message);
    }
  }

  // ── 2. Twelve Data (forex) — intraday real-time ──────────────────────────
  // One batch /price request fetches all forex pairs in a single API call
  // (counts as 1 credit, not 1 per symbol for the /price endpoint).
  // Falls back to Frankfurter ECB rates if key missing or 429 returned.

  private async fetchForex() {
    // Run both in parallel:
    // • Twelve Data  → 8 major pairs (real-time, 8 credits = exactly the per-minute limit)
    // • Frankfurter  → all remaining pairs (ECB daily rate, no limit, fills the gaps)
    await Promise.allSettled([
      this.fetchForexTwelveData(),
      this.fetchForexFrankfurter(),
    ]);
  }

  private async fetchForexTwelveData(): Promise<boolean> {
    if (!this.TWELVE_DATA_KEY) return false;

    try {
      // Only the 8 major pairs — exactly 8 credits, fits the 8/min free limit
      const symbolList = Object.values(TWELVE_DATA_FOREX).join(',');
      const url = `${this.TWELVE_DATA_BASE}/price?symbol=${encodeURIComponent(symbolList)}&apikey=${this.TWELVE_DATA_KEY}`;
      const res = await fetch(url, { signal: AbortSignal.timeout(15_000) });

      if (res.status === 429) {
        console.warn('[OtcPrice] Twelve Data rate limited (429) — majors will use Frankfurter this cycle');
        return false;
      }
      if (!res.ok) throw new Error(`HTTP ${res.status}`);

      const data: Record<string, { price?: string; status?: string }> = await res.json();
      const now = Date.now();

      for (const [otcSymbol, tdSymbol] of Object.entries(TWELVE_DATA_FOREX)) {
        const entry = data[tdSymbol];
        if (!entry || entry.status === 'error' || !entry.price) continue;

        const price = parseFloat(entry.price);
        if (isNaN(price) || price <= 0) continue;

        const prev = this.cache.get(otcSymbol);
        const prevPrice = prev?.price ?? price;
        const change    = price - prevPrice;
        const changePct = prevPrice > 0 ? (change / prevPrice) * 100 : 0;

        this.cache.set(otcSymbol, {
          symbol: otcSymbol,
          price,
          change,
          changePct,
          source: 'twelve_data',
          updatedAt: now,
        });
      }

      console.log('[OtcPrice] Twelve Data: 8 major forex pairs updated');
      return true;
    } catch (e) {
      console.warn('[OtcPrice] Twelve Data forex error:', (e as Error).message);
      return false;
    }
  }

  // Frankfurter fallback — ECB rates, once per day, no key needed
  private async fetchForexFrankfurter() {
    try {
      const res = await fetch('https://api.frankfurter.dev/v1/latest?base=USD',
        { signal: AbortSignal.timeout(10_000) });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data: { rates: Record<string, number> } = await res.json();
      const rates: Record<string, number> = { USD: 1, ...data.rates };

      const crossRate = (base: string, quote: string): number | null => {
        const rBase = rates[base]; const rQuote = rates[quote];
        if (!rBase || !rQuote) return null;
        return rQuote / rBase;
      };

      const now = Date.now();
      for (const [otc, [base, quote]] of Object.entries(FOREX_PAIRS)) {
        const price = crossRate(base, quote);
        if (!price || price <= 0) continue;
        const prev = this.cache.get(otc);
        const prevPrice = prev?.price ?? price;
        const change    = price - prevPrice;
        const changePct = prevPrice > 0 ? (change / prevPrice) * 100 : 0;
        this.cache.set(otc, { symbol: otc, price, change, changePct, source: 'frankfurter', updatedAt: now });
      }
    } catch (e) {
      console.warn('[OtcPrice] Frankfurter fallback failed:', (e as Error).message);
    }
  }

  // ── 3. goldprice.org (XAU + XAG + Oil + Brent) ───────────────────────────
  // data-asg.goldprice.org returns XAU and XAG spot price in USD/troy oz.
  // Used by goldprice.org itself — no key, browser-accessible.

  private async fetchMetals() {
    try {
      const res = await fetch('https://data-asg.goldprice.org/dbXRates/USD', {
        headers: {
          'User-Agent': 'Mozilla/5.0',
          'Referer': 'https://goldprice.org',
        },
        signal: AbortSignal.timeout(10_000),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data: { items?: Array<{ xauPrice?: number; xagPrice?: number }> } = await res.json();

      const item = data?.items?.[0];
      if (!item) return;

      const now = Date.now();

      if (item.xauPrice && item.xauPrice > 0) {
        const prev = this.cache.get('XAUUSD_OTC');
        const change = prev ? item.xauPrice - prev.price : 0;
        const changePct = prev?.price ? (change / prev.price) * 100 : 0;
        this.cache.set('XAUUSD_OTC', {
          symbol: 'XAUUSD_OTC',
          price: item.xauPrice,
          change,
          changePct,
          source: 'goldprice',
          updatedAt: now,
        });
      }

      if (item.xagPrice && item.xagPrice > 0) {
        const prev = this.cache.get('XAGUSD_OTC');
        const change = prev ? item.xagPrice - prev.price : 0;
        const changePct = prev?.price ? (change / prev.price) * 100 : 0;
        this.cache.set('XAGUSD_OTC', {
          symbol: 'XAGUSD_OTC',
          price: item.xagPrice,
          change,
          changePct,
          source: 'goldprice',
          updatedAt: now,
        });
      }
    } catch (e) {
      console.warn('[OtcPrice] goldprice.org failed:', (e as Error).message);
    }

    // Crude oil & Brent via Yahoo Finance (WTI = CL=F, Brent = BZ=F)
    await this.fetchYahooSingle('USCRUDE_OTC', 'CL=F');
    await this.fetchYahooSingle('UKBRENT_OTC', 'BZ=F');
  }

  // ── 4. Yahoo Finance (indices + stocks) ──────────────────────────────────
  // Batches into groups of 5 with a small delay to avoid rate-limiting.

  private async fetchYahoo() {
    const entries = Object.entries(YAHOO_MAP);
    // Process in batches of 5, sequentially, 200ms apart
    const BATCH = 5;
    for (let i = 0; i < entries.length; i += BATCH) {
      const batch = entries.slice(i, i + BATCH);
      await Promise.allSettled(
        batch.map(([otc, yahoo]) => this.fetchYahooSingle(otc, yahoo))
      );
      if (i + BATCH < entries.length) {
        await new Promise((r) => setTimeout(r, 200));
      }
    }
  }

  private async fetchYahooSingle(otcSymbol: string, yahooSymbol: string) {
    try {
      const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(yahooSymbol)}?interval=1d&range=2d`;
      const res = await fetch(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
          'Accept': 'application/json',
        },
        signal: AbortSignal.timeout(10_000),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json();

      const result = json?.chart?.result?.[0];
      if (!result) return;

      const meta = result.meta;
      const price: number = meta?.regularMarketPrice ?? meta?.previousClose;
      const prevClose: number = meta?.chartPreviousClose ?? meta?.previousClose ?? price;

      if (!price || price <= 0) return;

      const change = price - prevClose;
      const changePct = prevClose > 0 ? (change / prevClose) * 100 : 0;

      this.cache.set(otcSymbol, {
        symbol: otcSymbol,
        price,
        change,
        changePct,
        source: 'yahoo',
        updatedAt: Date.now(),
      });
    } catch (e) {
      // Silently skip — Yahoo may throttle individual symbols occasionally
    }
  }
}

export const otcPriceService = OtcPriceService.getInstance();
