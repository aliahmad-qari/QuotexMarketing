'use client';

import { useEffect, useState } from 'react';
import {
  ArrowDownRight,
  ArrowUpRight,
  ChevronDown,
  Clock,
  Lock,
  Search,
} from 'lucide-react';
import { OTC_MARKET_CATEGORIES, OTC_MARKET_FILTERS, OTC_MARKETS, OtcMarketFilter } from '../constants/otcMarkets';
import { MarketMetadata, MarketSymbol, Timeframe } from '../types/market';
import { otcPricesClient, OtcPricesMap } from '../services/otcPricesClient';

// Decimal places for price display in the dropdown
const FOREX_DECIMALS: Record<string, number> = {
  USDJPY_OTC: 3, EURJPY_OTC: 3, GBPJPY_OTC: 3, AUDJPY_OTC: 3,
  CADJPY_OTC: 3, CHFJPY_OTC: 3, NZDJPY_OTC: 3, USDMXN_OTC: 3,
  USDBRL_OTC: 3, EURTRY_OTC: 3, EURHUF_OTC: 0, USDEGP_OTC: 3,
  USDPKR_OTC: 3,
};
function fmtOtcPrice(sym: string, price: number): string {
  const dec = FOREX_DECIMALS[sym] ?? (price > 100 ? 2 : 5);
  return price.toLocaleString('en-US', { minimumFractionDigits: dec, maximumFractionDigits: dec });
}

interface MarketTimeframeBarProps {
  symbol: MarketSymbol;
  onSelectSymbol: (symbol: MarketSymbol) => void;
  timeframe: Timeframe;
  onSelectTimeframe: (tf: Timeframe) => void;
  metadata: MarketMetadata | null;
  secondsRemaining?: number;
}

const SUPPORTED_SYMBOLS: { symbol: MarketSymbol; name: string; icon: string; category: 'crypto' | 'forex' }[] = [
  // ── Crypto (Binance Spot — always live) ──────────────────────────────────
  { symbol: 'BTCUSDT',   name: 'Bitcoin',       icon: 'BTC',   category: 'crypto' },
  { symbol: 'ETHUSDT',   name: 'Ethereum',      icon: 'ETH',   category: 'crypto' },
  { symbol: 'SOLUSDT',   name: 'Solana',        icon: 'SOL',   category: 'crypto' },
  { symbol: 'BNBUSDT',   name: 'BNB Chain',     icon: 'BNB',   category: 'crypto' },
  { symbol: 'XRPUSDT',   name: 'Ripple',        icon: 'XRP',   category: 'crypto' },
  { symbol: 'ADAUSDT',   name: 'Cardano',       icon: 'ADA',   category: 'crypto' },
  { symbol: 'DOGEUSDT',  name: 'Dogecoin',      icon: 'DOGE',  category: 'crypto' },
  { symbol: 'AVAXUSDT',  name: 'Avalanche',     icon: 'AVAX',  category: 'crypto' },
  { symbol: 'DOTUSDT',   name: 'Polkadot',      icon: 'DOT',   category: 'crypto' },
  { symbol: 'LTCUSDT',   name: 'Litecoin',      icon: 'LTC',   category: 'crypto' },
  { symbol: 'LINKUSDT',  name: 'Chainlink',     icon: 'LINK',  category: 'crypto' },
  { symbol: 'ATOMUSDT',  name: 'Cosmos',        icon: 'ATOM',  category: 'crypto' },
  { symbol: 'UNIUSDT',   name: 'Uniswap',       icon: 'UNI',   category: 'crypto' },
  { symbol: 'NEARUSDT',  name: 'NEAR',          icon: 'NEAR',  category: 'crypto' },
  { symbol: 'AAVEUSDT',  name: 'Aave',          icon: 'AAVE',  category: 'crypto' },
  { symbol: 'MATICUSDT', name: 'Polygon',       icon: 'MATIC', category: 'crypto' },
  { symbol: 'SHIBUSDT',  name: 'Shiba Inu',     icon: 'SHIB',  category: 'crypto' },
  { symbol: 'FTMUSDT',   name: 'Fantom',        icon: 'FTM',   category: 'crypto' },
  { symbol: 'OPUSDT',    name: 'Optimism',      icon: 'OP',    category: 'crypto' },
  { symbol: 'ARBUSDT',   name: 'Arbitrum',      icon: 'ARB',   category: 'crypto' },
  { symbol: 'INJUSDT',   name: 'Injective',     icon: 'INJ',   category: 'crypto' },
  { symbol: 'SUIUSDT',   name: 'Sui',           icon: 'SUI',   category: 'crypto' },
  // ── Forex (Twelve Data live candles — requires TWELVE_DATA_API_KEY) ─────
  { symbol: 'EURUSD',    name: 'Euro / US Dollar',      icon: 'EUR', category: 'forex' },
  { symbol: 'GBPUSD',    name: 'Pound / US Dollar',     icon: 'GBP', category: 'forex' },
  { symbol: 'USDJPY',    name: 'US Dollar / Yen',       icon: 'JPY', category: 'forex' },
  { symbol: 'AUDUSD',    name: 'Aussie / US Dollar',    icon: 'AUD', category: 'forex' },
  { symbol: 'USDCAD',    name: 'US Dollar / CAD',       icon: 'CAD', category: 'forex' },
  { symbol: 'USDCHF',    name: 'US Dollar / Franc',     icon: 'CHF', category: 'forex' },
];

const TIMEFRAMES: { id: Timeframe; label: string }[] = [
  { id: '5s',  label: '5s'  },
  { id: '10s', label: '10s' },
  { id: '15s', label: '15s' },
  { id: '30s', label: '30s' },
  { id: '1m',  label: '1m'  },
  { id: '2m',  label: '2m'  },
  { id: '5m',  label: '5m'  },
  { id: '1h',  label: '1h'  },
  { id: '2h',  label: '2h'  },
  { id: '3h',  label: '3h'  },
];

export const MarketTimeframeBar: React.FC<MarketTimeframeBarProps> = ({
  symbol,
  onSelectSymbol,
  timeframe,
  onSelectTimeframe,
  metadata,
  secondsRemaining = 0,
}) => {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [otcFilter, setOtcFilter] = useState<OtcMarketFilter>('All');
  const [otcPrices, setOtcPrices] = useState<OtcPricesMap>({});

  // Subscribe to live OTC prices for the dropdown
  useEffect(() => {
    const unsub = otcPricesClient.subscribe((map) => setOtcPrices(map));
    return unsub;
  }, []);

  const isPositive = (metadata?.priceChangePercent24h || 0) >= 0;
  const currentAsset = SUPPORTED_SYMBOLS.find((s) => s.symbol === symbol) || SUPPORTED_SYMBOLS[0];
  const isForex = currentAsset.category === 'forex';
  const normalizedSearch = searchQuery.trim().toLowerCase();

  const filteredSymbols = SUPPORTED_SYMBOLS.filter(
    (s) =>
      s.symbol.toLowerCase().includes(normalizedSearch) ||
      s.name.toLowerCase().includes(normalizedSearch)
  );
  const filteredCrypto = filteredSymbols.filter((s) => s.category === 'crypto');
  const filteredForex  = filteredSymbols.filter((s) => s.category === 'forex');

  const filteredOtcMarkets = OTC_MARKETS.filter(
    (market) =>
      (otcFilter === 'All' || market.category === otcFilter) &&
      (market.symbol.toLowerCase().includes(normalizedSearch) ||
        market.displaySymbol.toLowerCase().includes(normalizedSearch) ||
        market.label.toLowerCase().includes(normalizedSearch) ||
        market.category.toLowerCase().includes(normalizedSearch))
  );

  return (
    <div className="w-full bg-[#0C1017] border border-slate-800 rounded-2xl shadow-xl">
      {/* ── Top row: market selector + metadata ── */}
      <div className="flex flex-wrap items-center justify-between gap-3 px-3 sm:px-4 pt-3 sm:pt-4 pb-3">
        {/* Market selector button */}
        <div className="relative shrink-0">
          <button
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            className="px-3.5 py-2 rounded-xl bg-slate-900/90 hover:bg-slate-800 border border-slate-700 text-white font-mono flex items-center gap-2.5 shadow-md transition-all"
          >
            <div className={`min-w-8 h-6 px-1.5 rounded-full flex items-center justify-center font-bold text-[10px] shrink-0 ${
              isForex
                ? 'bg-violet-500/20 border border-violet-500/40 text-violet-300'
                : 'bg-amber-500/20 border border-amber-500/40 text-amber-300'
            }`}>
              {currentAsset.icon}
            </div>
            <div className="text-left min-w-0">
              <div className="font-black text-sm leading-tight whitespace-nowrap">
                {isForex ? symbol.slice(0, 3) + '/' + symbol.slice(3) : symbol.replace('USDT', '') + '/USDT'}
              </div>
              <div className="text-[10px] text-slate-400 leading-tight">
                {isForex ? 'Forex · Twelve Data' : currentAsset.name + ' · Binance Spot'}
              </div>
            </div>
            <ChevronDown
              className={`w-4 h-4 text-slate-400 shrink-0 transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`}
            />
          </button>

          {/* ── Dropdown ── */}
          {isDropdownOpen && (
            <>
              {/* Backdrop to close on outside click */}
              <div
                className="fixed inset-0 z-40"
                onClick={() => {
                  setIsDropdownOpen(false);
                  setSearchQuery('');
                }}
              />
              <div className="fixed left-3 right-3 top-24 sm:absolute sm:top-full sm:left-0 sm:right-auto sm:mt-2 sm:w-[min(92vw,480px)] bg-[#0E131F] border border-slate-700 rounded-2xl shadow-2xl z-50 overflow-hidden font-mono text-xs animate-in fade-in duration-150">
                {/* Search */}
                <div className="p-2.5 border-b border-slate-800 bg-slate-950/80 sticky top-0">
                  <div className="flex items-center gap-2 bg-slate-900 px-2.5 py-1.5 rounded-lg border border-slate-700">
                    <Search className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Search Binance Spot or OTC reference…"
                      className="w-full bg-transparent text-white placeholder-slate-500 focus:outline-none text-xs"
                      autoFocus
                    />
                  </div>
                </div>

                <div className="max-h-[70vh] sm:max-h-[440px] overflow-y-auto p-1.5 space-y-3">

                  {/* ── Section 1: Binance Spot Crypto (selectable, fully live) ── */}
                  <div>
                    <div className="flex items-center justify-between px-1.5 pt-1 pb-1">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-cyan-300">
                        Crypto · Binance Spot
                      </span>
                      <span className="text-[9px] bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 px-2 py-0.5 rounded-full font-bold">
                        ✓ Live Candles + All Timeframes
                      </span>
                    </div>
                    <div className="grid grid-cols-2 gap-1">
                      {filteredCrypto.map((item) => (
                        <button
                          key={item.symbol}
                          onClick={() => {
                            onSelectSymbol(item.symbol);
                            setIsDropdownOpen(false);
                            setSearchQuery('');
                          }}
                          className={`p-2 rounded-xl flex items-center gap-2 transition-all text-left ${
                            symbol === item.symbol
                              ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                              : 'text-slate-300 hover:bg-slate-800 hover:text-white border border-transparent'
                          }`}
                        >
                          <div className="min-w-7 h-6 px-1 rounded-full bg-slate-800 flex items-center justify-center text-slate-200 font-bold text-[9px] shrink-0">
                            {item.icon}
                          </div>
                          <div className="min-w-0">
                            <div className="font-bold text-[11px] truncate">{item.symbol.replace('USDT', '')}/USDT</div>
                            <div className="text-[9px] text-slate-400 truncate">{item.name}</div>
                          </div>
                          {symbol === item.symbol && (
                            <div className="ml-auto w-1.5 h-1.5 rounded-full bg-cyan-400 shrink-0" />
                          )}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* ── Section 2: Forex (Twelve Data live candles) ── */}
                  {filteredForex.length > 0 && (
                    <div className="border-t border-slate-800 pt-2">
                      <div className="flex items-center justify-between px-1.5 pb-1">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-violet-300">
                          Forex · Twelve Data
                        </span>
                        <span className="text-[9px] bg-violet-500/15 text-violet-400 border border-violet-500/30 px-2 py-0.5 rounded-full font-bold">
                          ✓ Live Candles + All Timeframes
                        </span>
                      </div>
                      <p className="px-1.5 pb-1.5 text-[9px] text-slate-500 leading-relaxed">
                        Real-time forex tick stream via Twelve Data WebSocket. Requires <code className="text-violet-400">TWELVE_DATA_API_KEY</code> on the server.
                      </p>
                      <div className="grid grid-cols-2 gap-1">
                        {filteredForex.map((item) => (
                          <button
                            key={item.symbol}
                            onClick={() => {
                              onSelectSymbol(item.symbol);
                              setIsDropdownOpen(false);
                              setSearchQuery('');
                            }}
                            className={`p-2 rounded-xl flex items-center gap-2 transition-all text-left ${
                              symbol === item.symbol
                                ? 'bg-violet-500/20 text-violet-300 border border-violet-500/40'
                                : 'text-slate-300 hover:bg-slate-800 hover:text-white border border-transparent'
                            }`}
                          >
                            <div className="min-w-7 h-6 px-1 rounded-full bg-violet-900/40 flex items-center justify-center text-violet-200 font-bold text-[9px] shrink-0">
                              {item.icon}
                            </div>
                            <div className="min-w-0">
                              <div className="font-bold text-[11px] truncate">
                                {item.symbol.slice(0, 3)}/{item.symbol.slice(3)}
                              </div>
                              <div className="text-[9px] text-slate-400 truncate">{item.name}</div>
                            </div>
                            {symbol === item.symbol && (
                              <div className="ml-auto w-1.5 h-1.5 rounded-full bg-violet-400 shrink-0" />
                            )}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* ── Section 3: OTC Price Reference (read-only, display only) ── */}
                  <div className="border-t border-slate-800 pt-2">
                    <div className="flex items-center justify-between px-1.5 pb-1.5">
                      <div className="flex items-center gap-1.5">
                        <Lock className="w-3 h-3 text-amber-400" />
                        <span className="text-[10px] font-bold uppercase tracking-wider text-amber-300">
                          Quotex OTC — Price Reference
                        </span>
                      </div>
                      <span className="text-[9px] bg-amber-500/10 text-amber-400 border border-amber-500/20 px-2 py-0.5 rounded-full font-bold">
                        Display Only
                      </span>
                    </div>
                    <p className="px-1.5 pb-2 text-[9px] text-slate-500 leading-relaxed">
                      OTC instruments show live prices only — no candles. Select Crypto or Forex above for full chart analysis.
                    </p>

                    {/* OTC category filter tabs */}
                    <div className="flex gap-1 overflow-x-auto px-1 pb-2 scrollbar-none">
                      {OTC_MARKET_FILTERS.map((filter) => (
                        <button
                          key={filter}
                          type="button"
                          onClick={() => setOtcFilter(filter)}
                          className={`shrink-0 rounded-full border px-2.5 py-0.5 text-[9px] font-bold transition-all ${
                            otcFilter === filter
                              ? 'border-amber-400 bg-amber-400/20 text-amber-300'
                              : 'border-slate-700 bg-slate-900 text-slate-500 hover:text-slate-300'
                          }`}
                        >
                          {filter}
                        </button>
                      ))}
                    </div>

                    {/* OTC market rows grouped by category */}
                    {OTC_MARKET_CATEGORIES.map((category) => {
                      const markets = filteredOtcMarkets.filter((m) => m.category === category);
                      if (!markets.length) return null;
                      return (
                        <div key={category} className="mb-2">
                          <div className="px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wider text-slate-500">
                            {category}
                          </div>
                          <div className="grid grid-cols-2 gap-0.5">
                            {markets.map((market) => {
                              const live = otcPrices[market.symbol];
                              const isUp = live ? live.changePct >= 0 : true;
                              return (
                                <div
                                  key={market.symbol}
                                  className="p-1.5 rounded-lg flex items-center gap-2 opacity-80 cursor-default"
                                >
                                  <div className={`w-5 h-5 shrink-0 rounded-full flex items-center justify-center text-[9px] font-bold ${
                                    live
                                      ? isUp ? 'bg-emerald-500/20 text-emerald-300' : 'bg-rose-500/20 text-rose-300'
                                      : 'bg-slate-800 text-slate-500'
                                  }`}>
                                    {live ? (isUp ? '▲' : '▼') : '~'}
                                  </div>
                                  <div className="min-w-0 flex-1">
                                    <div className="flex items-center justify-between gap-1">
                                      <span className="truncate font-bold text-slate-200 text-[10px]">
                                        {market.displaySymbol}
                                      </span>
                                      <span className="shrink-0 text-[7px] font-bold px-1 py-0.5 rounded bg-amber-500/15 text-amber-400 border border-amber-500/20">
                                        OTC
                                      </span>
                                    </div>
                                    {live ? (
                                      <div className="flex items-center justify-between mt-0.5">
                                        <span className="text-[9px] text-slate-300 tabular-nums">
                                          {fmtOtcPrice(market.symbol, live.price)}
                                        </span>
                                        <span className={`text-[8px] font-bold ${isUp ? 'text-emerald-400' : 'text-rose-400'}`}>
                                          {isUp ? '+' : ''}{live.changePct.toFixed(2)}%
                                        </span>
                                      </div>
                                    ) : (
                                      <div className="text-[9px] text-slate-600 mt-0.5 truncate">
                                        {market.label.replace(' OTC', '')}
                                      </div>
                                    )}
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Live market metadata */}
        {metadata && (
          <div className="flex items-center flex-wrap gap-4 sm:gap-6 text-xs font-mono">
            <div className="text-right sm:text-left">
              <span className="text-slate-400 block text-[10px] leading-tight">
                {isForex ? 'Live Rate' : 'Live Spot Price'}
              </span>
              <span className="font-black text-white text-sm sm:text-base leading-tight">
                {!isForex && '$'}
                {metadata.lastPrice > 0
                  ? metadata.lastPrice.toLocaleString(undefined, {
                      minimumFractionDigits: metadata.priceDecimals,
                      maximumFractionDigits: metadata.priceDecimals,
                    })
                  : '---'}
              </span>
            </div>

            <div className="text-right sm:text-left">
              <span className="text-slate-400 block text-[10px] leading-tight">24h Delta</span>
              <span className={`font-bold flex items-center text-xs sm:text-sm ${isPositive ? 'text-emerald-400' : 'text-rose-400'}`}>
                {isPositive ? <ArrowUpRight className="w-3.5 h-3.5 mr-0.5" /> : <ArrowDownRight className="w-3.5 h-3.5 mr-0.5" />}
                {isPositive ? '+' : ''}{metadata.priceChangePercent24h.toFixed(2)}%
              </span>
            </div>

            {!isForex && (
              <div className="hidden lg:block">
                <span className="text-slate-400 block text-[10px] leading-tight">24h Range (H/L)</span>
                <span className="text-slate-300">
                  ${metadata.high24h.toFixed(1)} / ${metadata.low24h.toFixed(1)}
                </span>
              </div>
            )}
          </div>
        )}
      </div>

      {/* ── Bottom row: timeframe selector + bar-close countdown ── */}
      <div className="flex items-center justify-between px-3 sm:px-4 pb-3 pt-2 border-t border-slate-800/80 gap-2 flex-wrap">
        {/* Left label */}
        <div className="flex items-center gap-1.5 text-xs text-slate-400 font-mono shrink-0">
          <Clock className="w-3.5 h-3.5 text-cyan-400" />
          <span className="hidden sm:inline text-[11px]">Timeframe</span>
        </div>

        {/* Timeframe buttons */}
        <div className="flex flex-wrap items-center gap-1 flex-1 justify-center sm:justify-start">
          {TIMEFRAMES.map((tf) => (
            <button
              key={tf.id}
              id={`timeframe-btn-${tf.id}`}
              onClick={() => onSelectTimeframe(tf.id)}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-mono font-bold transition-all ${
                timeframe === tf.id
                  ? 'bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/20'
                  : 'bg-slate-900/80 text-slate-400 hover:text-slate-200 hover:bg-slate-800 border border-slate-800'
              }`}
            >
              {tf.label}
            </button>
          ))}
        </div>

        {/* Bar close countdown */}
        <div className="flex items-center gap-1.5 text-xs font-mono bg-slate-900/90 border border-cyan-500/30 px-2.5 py-1 rounded-lg text-cyan-300 shrink-0">
          <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping shrink-0" />
          <span className="hidden sm:inline text-[10px]">Bar Close:</span>
          <span className="font-bold text-white text-[11px]">
            {secondsRemaining > 0 ? `${secondsRemaining}s` : 'Sealing…'}
          </span>
        </div>
      </div>
    </div>
  );
};
