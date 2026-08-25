'use client';

import React, { useEffect, useState } from 'react';
import { Search, TrendingUp, TrendingDown, Star, RefreshCw, Wifi } from 'lucide-react';
import {
  OTC_MARKETS,
  OTC_MARKET_CATEGORIES,
  OTC_MARKET_FILTERS,
  OtcMarketFilter,
  OtcMarket,
} from '../constants/otcMarkets';
import { otcPricesClient, OtcPricesMap } from '../services/otcPricesClient';

type PriceSource = 'binance' | 'twelve_data' | 'frankfurter' | 'goldprice' | 'yahoo';

const SOURCE_LABEL: Record<PriceSource, string> = {
  binance:     'Binance',
  frankfurter: 'ECB / Frankfurter',
  twelve_data: 'Twelve Data',
  goldprice:   'goldprice.org',
  yahoo:       'Yahoo Finance',
};

const SOURCE_DOT: Record<PriceSource, string> = {
  binance:     'bg-emerald-400',
  frankfurter: 'bg-slate-400',
  twelve_data: 'bg-cyan-400',
  goldprice:   'bg-amber-400',
  yahoo:       'bg-violet-400',
};

// Featured instruments shown on the default tab
const FEATURED_OTC: string[] = [
  'BTCUSD_OTC', 'ETHUSD_OTC', 'EURUSD_OTC', 'XAUUSD_OTC',
  'GBPUSD_OTC', 'USDJPY_OTC', 'SOLUSD_OTC', 'NDXUSDI',
  'SPXUSDI',   'XAGUSD_OTC',  'MSFT_OTC',   'DJIUSDI',
];

// Decimal places per instrument for display
const PRICE_DECIMALS: Record<string, number> = {
  BTCUSD_OTC: 2, ETHUSD_OTC: 2, BNBUSD_OTC: 2, SOLUSD_OTC: 2,
  AVAUSD_OTC: 2, BCHUSD_OTC: 2, ATOUSD_OTC: 3,
  XRPUSD_OTC: 4, ADAUSD_OTC: 4, DOGUSD_OTC: 4,
  BONUSD_OTC: 6, FLOUSD_OTC: 3, ARBUSD_OTC: 3, AXSUSD_OTC: 3, APTUSD_OTC: 2,
  XAUUSD_OTC: 2, XAGUSD_OTC: 3, USCRUDE_OTC: 2, UKBRENT_OTC: 2,
  EURUSD_OTC: 5, GBPUSD_OTC: 5, USDJPY_OTC: 3, AUDUSD_OTC: 5,
  USDCAD_OTC: 5, USDCHF_OTC: 5, EURJPY_OTC: 3, GBPJPY_OTC: 3,
  EURGBP_OTC: 5, EURAUD_OTC: 5, EURCAD_OTC: 5, EURCHF_OTC: 5,
  EURNZD_OTC: 5, AUDCAD_OTC: 5, AUDCHF_OTC: 5, AUDJPY_OTC: 3,
  AUDNZD_OTC: 5, CADCHF_OTC: 5, CADJPY_OTC: 3, CHFJPY_OTC: 3,
  GBPAUD_OTC: 5, GBPCAD_OTC: 5, GBPCHF_OTC: 5, NZDJPY_OTC: 3,
  NZDUSD_OTC: 5, USDMXN_OTC: 3, USDSGD_OTC: 5, USDBRL_OTC: 3,
  EURSGD_OTC: 5, EURTRY_OTC: 3, EURHUF_OTC: 0,
};

function formatPrice(symbol: string, price: number): string {
  const dec = PRICE_DECIMALS[symbol] ?? 2;
  return price.toLocaleString('en-US', {
    minimumFractionDigits: dec,
    maximumFractionDigits: dec,
  });
}

interface OtcMarketsPanelProps {
  onSelectOtc?: (market: OtcMarket) => void;
}

export const OtcMarketsPanel: React.FC<OtcMarketsPanelProps> = ({ onSelectOtc }) => {
  const [search, setSearch]       = useState('');
  const [filter, setFilter]       = useState<OtcMarketFilter>('All');
  const [activeTab, setActiveTab] = useState<'featured' | 'all'>('featured');
  const [prices, setPrices]       = useState<OtcPricesMap>({});
  const [lastUpdated, setLastUpdated] = useState<number>(0);
  const [isLoading, setIsLoading] = useState(true);

  // Subscribe to live price updates
  useEffect(() => {
    const unsub = otcPricesClient.subscribe((map) => {
      setPrices(map);
      setLastUpdated(Date.now());
      setIsLoading(false);
    });
    return unsub;
  }, []);

  const norm = search.trim().toLowerCase();

  const filteredAll = OTC_MARKETS.filter(
    (m) =>
      (filter === 'All' || m.category === filter) &&
      (!norm ||
        m.displaySymbol.toLowerCase().includes(norm) ||
        m.label.toLowerCase().includes(norm) ||
        m.category.toLowerCase().includes(norm))
  );

  const featuredMarkets = OTC_MARKETS.filter((m) => FEATURED_OTC.includes(m.symbol));
  const displayList = activeTab === 'featured' ? featuredMarkets : filteredAll;

  const liveCount = Object.keys(prices).length;
  const ageSeconds = lastUpdated ? Math.floor((Date.now() - lastUpdated) / 1000) : null;

  return (
    <div className="w-full bg-[#0C1017] border border-slate-800 rounded-2xl overflow-hidden shadow-xl">

      {/* ── Header ── */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-slate-800 bg-slate-950/60">
        <div className="flex items-center space-x-2">
          <div className={`w-2 h-2 rounded-full ${liveCount > 0 ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400 animate-pulse'}`} />
          <span className="font-mono font-bold text-slate-100 text-sm uppercase tracking-wider">
            Quotex OTC Markets
          </span>
          <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30">
            {OTC_MARKETS.length} Instruments
          </span>
        </div>

        {/* Live data badge */}
        <div className="flex items-center space-x-2">
          {isLoading ? (
            <span className="flex items-center space-x-1 text-[10px] font-mono text-amber-400">
              <RefreshCw className="w-3 h-3 animate-spin" />
              <span>Loading prices…</span>
            </span>
          ) : liveCount > 0 ? (
            <span className="flex items-center space-x-1 text-[10px] font-mono text-emerald-400">
              <Wifi className="w-3 h-3" />
              <span>{liveCount} live</span>
              {ageSeconds !== null && (
                <span className="text-slate-500">· {ageSeconds < 5 ? 'just now' : `${ageSeconds}s ago`}</span>
              )}
            </span>
          ) : (
            <span className="text-[10px] font-mono text-rose-400">No price data</span>
          )}
        </div>
      </div>

      {/* ── Tabs + Search ── */}
      <div className="flex flex-wrap items-center gap-2 px-4 py-2.5 border-b border-slate-800/60 bg-slate-900/30">
        <div className="flex rounded-lg overflow-hidden border border-slate-800 text-xs font-mono">
          <button
            onClick={() => setActiveTab('featured')}
            className={`px-3 py-1.5 transition-colors ${
              activeTab === 'featured'
                ? 'bg-cyan-500 text-slate-950 font-bold'
                : 'bg-slate-900 text-slate-400 hover:text-white'
            }`}
          >
            <Star className="w-3 h-3 inline mr-1" />Featured
          </button>
          <button
            onClick={() => setActiveTab('all')}
            className={`px-3 py-1.5 transition-colors ${
              activeTab === 'all'
                ? 'bg-cyan-500 text-slate-950 font-bold'
                : 'bg-slate-900 text-slate-400 hover:text-white'
            }`}
          >
            All Markets
          </button>
        </div>

        {activeTab === 'all' && (
          <div className="flex items-center space-x-1.5 bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5 flex-1 min-w-[140px] max-w-xs">
            <Search className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search OTC…"
              className="w-full bg-transparent text-white placeholder-slate-500 focus:outline-none text-xs font-mono"
            />
          </div>
        )}
      </div>

      {/* ── Category Filter ── */}
      {activeTab === 'all' && (
        <div className="flex gap-1.5 overflow-x-auto px-4 py-2 border-b border-slate-800/40">
          {OTC_MARKET_FILTERS.map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`shrink-0 rounded-full border px-3 py-1 text-[10px] font-bold font-mono transition-all ${
                filter === f
                  ? 'border-cyan-400 bg-cyan-400/20 text-cyan-300'
                  : 'border-slate-700 bg-slate-900 text-slate-400 hover:text-slate-200'
              }`}
            >
              {f}
            </button>
          ))}
        </div>
      )}

      {/* ── Market Grid ── */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-0 divide-x divide-y divide-slate-800/60">
        {displayList.map((market) => {
          const live = prices[market.symbol];
          const hasLive = !!live;
          const isUp = hasLive ? live.changePct >= 0 : true;

          return (
            <button
              key={market.symbol}
              type="button"
              onClick={() => onSelectOtc?.(market)}
              className="group p-3 text-left hover:bg-slate-800/50 transition-colors relative"
            >
              {/* Source badge */}
              <div className="absolute top-2 right-2 flex items-center space-x-1">
                {hasLive && (
                  <span className={`w-1.5 h-1.5 rounded-full ${SOURCE_DOT[live.source as PriceSource] ?? 'bg-slate-400'}`} />
                )}
                <span className="text-[8px] font-bold font-mono px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30">
                  OTC
                </span>
              </div>

              {/* Symbol + Category */}
              <div className="pr-10">
                <div className="font-mono font-bold text-white text-xs leading-tight truncate">
                  {market.displaySymbol}
                </div>
                <div className="text-[9px] text-slate-500 font-mono truncate mt-0.5">
                  {market.category}
                </div>
              </div>

              {/* Price */}
              <div className="mt-2">
                {hasLive ? (
                  <>
                    <div className="font-mono font-semibold text-slate-100 text-[11px] tabular-nums">
                      {formatPrice(market.symbol, live.price)}
                    </div>
                    <div className={`flex items-center space-x-0.5 text-[10px] font-mono font-bold mt-0.5 ${isUp ? 'text-emerald-400' : 'text-rose-400'}`}>
                      {isUp ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                      <span>{isUp ? '+' : ''}{live.changePct.toFixed(2)}%</span>
                    </div>
                  </>
                ) : (
                  <div className="font-mono text-slate-600 text-[11px]">
                    {isLoading ? (
                      <span className="inline-block w-12 h-3 bg-slate-800 rounded animate-pulse" />
                    ) : '---'}
                  </div>
                )}
              </div>

              {/* Source label */}
              {hasLive && (
                <div className="mt-1.5 text-[8px] font-mono text-slate-600 truncate">
                  via {SOURCE_LABEL[live.source as PriceSource] ?? live.source}
                </div>
              )}

              {/* Hover glow */}
              <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none bg-gradient-to-br from-cyan-500/5 to-transparent" />
            </button>
          );
        })}
      </div>

      {/* ── Footer ── */}
      <div className="px-4 py-2.5 border-t border-slate-800/60 bg-slate-950/40 flex items-center justify-between flex-wrap gap-2">
        <p className="text-[9px] font-mono text-slate-500">
          Prices are real underlying market equivalents — not Quotex synthetic OTC prices. Updates every 60s.
        </p>
        <div className="flex items-center space-x-3 text-[9px] font-mono text-slate-600">
          <span><span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-400 mr-1" />Binance</span>
          <span><span className="inline-block w-1.5 h-1.5 rounded-full bg-cyan-400 mr-1" />Twelve Data</span>
          <span><span className="inline-block w-1.5 h-1.5 rounded-full bg-amber-400 mr-1" />Metals</span>
          <span><span className="inline-block w-1.5 h-1.5 rounded-full bg-violet-400 mr-1" />Yahoo</span>
          <span>{displayList.length} shown</span>
        </div>
      </div>
    </div>
  );
};
