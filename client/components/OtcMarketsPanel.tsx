'use client';

import React, { useState } from 'react';
import { Search, TrendingUp, TrendingDown, Lock, Star } from 'lucide-react';
import { OTC_MARKETS, OTC_MARKET_CATEGORIES, OTC_MARKET_FILTERS, OtcMarketFilter, OtcMarket } from '../constants/otcMarkets';

// Static simulated OTC price data for display purposes
// In production these would come from a Quotex OTC data feed
const OTC_MOCK_DATA: Record<string, { price: string; change: number; payout: number }> = {
  BTCUSD_OTC:  { price: '95,234.50', change:  1.24, payout: 87 },
  ETHUSD_OTC:  { price: '3,421.80',  change: -0.38, payout: 85 },
  SOLUSD_OTC:  { price: '182.44',    change:  2.11, payout: 86 },
  XRPUSD_OTC:  { price: '0.5821',    change:  0.74, payout: 84 },
  EURUSD_OTC:  { price: '1.0843',    change: -0.12, payout: 88 },
  GBPUSD_OTC:  { price: '1.2712',    change:  0.08, payout: 88 },
  USDJPY_OTC:  { price: '149.72',    change: -0.22, payout: 87 },
  XAUUSD_OTC:  { price: '2,641.30',  change:  0.31, payout: 85 },
  XAGUSD_OTC:  { price: '31.22',     change: -0.15, payout: 84 },
  USCRUDE_OTC: { price: '78.54',     change:  1.03, payout: 83 },
  UKBRENT_OTC: { price: '82.10',     change:  0.91, payout: 83 },
  NDXUSDI:     { price: '19,842.00', change:  0.64, payout: 82 },
  SPXUSDI:     { price: '5,621.40',  change:  0.42, payout: 82 },
  DJIUSDI:     { price: '41,230.00', change:  0.19, payout: 81 },
  GEREURI:     { price: '18,941.00', change: -0.28, payout: 82 },
  AUDUSD_OTC:  { price: '0.6523',    change: -0.09, payout: 87 },
  USDCAD_OTC:  { price: '1.3641',    change:  0.15, payout: 86 },
  EURJPY_OTC:  { price: '162.38',    change:  0.04, payout: 87 },
  GBPJPY_OTC:  { price: '190.21',    change:  0.23, payout: 86 },
  MSFT_OTC:    { price: '422.15',    change:  0.87, payout: 80 },
  FB_OTC:      { price: '561.30',    change:  1.32, payout: 80 },
  BNBUSD_OTC:  { price: '412.77',    change:  0.55, payout: 84 },
  ADAUSD_OTC:  { price: '0.4812',    change: -0.41, payout: 83 },
  DOGUSD_OTC:  { price: '0.3621',    change:  1.77, payout: 84 },
};

// Featured / popular OTC markets shown as quick-access tiles
const FEATURED_OTC: string[] = [
  'BTCUSD_OTC', 'ETHUSD_OTC', 'EURUSD_OTC', 'XAUUSD_OTC',
  'GBPUSD_OTC', 'USDJPY_OTC', 'SOLUSD_OTC', 'NDXUSDI',
];

interface OtcMarketsPanelProps {
  /** Called when user clicks a live-tradeable OTC market tile */
  onSelectOtc?: (market: OtcMarket) => void;
}

export const OtcMarketsPanel: React.FC<OtcMarketsPanelProps> = ({ onSelectOtc }) => {
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<OtcMarketFilter>('All');
  const [activeTab, setActiveTab] = useState<'featured' | 'all'>('featured');

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

  const getMock = (symbol: string) =>
    OTC_MOCK_DATA[symbol] || { price: '---', change: 0, payout: 82 };

  return (
    <div className="w-full bg-[#0C1017] border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
      {/* Panel Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-slate-800 bg-slate-950/60">
        <div className="flex items-center space-x-2">
          <div className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
          <span className="font-mono font-bold text-slate-100 text-sm uppercase tracking-wider">
            Quotex OTC Markets
          </span>
          <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30">
            {OTC_MARKETS.length} Instruments
          </span>
        </div>
        <div className="flex items-center space-x-1.5 text-[10px] font-mono text-slate-400">
          <Lock className="w-3 h-3 text-amber-400" />
          <span>OTC Catalog</span>
        </div>
      </div>

      {/* Tabs + Search Row */}
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
              placeholder="Search OTC..."
              className="w-full bg-transparent text-white placeholder-slate-500 focus:outline-none text-xs font-mono"
            />
          </div>
        )}
      </div>

      {/* Category Filter (all tab only) */}
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

      {/* Market Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-0 divide-x divide-y divide-slate-800/60">
        {displayList.map((market) => {
          const mock = getMock(market.symbol);
          const isUp = mock.change >= 0;
          const hasData = OTC_MOCK_DATA[market.symbol] !== undefined;

          return (
            <button
              key={market.symbol}
              type="button"
              onClick={() => onSelectOtc?.(market)}
              className="group p-3 text-left hover:bg-slate-800/50 transition-colors relative"
            >
              {/* OTC Badge */}
              <div className="absolute top-2 right-2">
                <span className="text-[8px] font-bold font-mono px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30">
                  OTC
                </span>
              </div>

              {/* Symbol + Category */}
              <div className="pr-8">
                <div className="font-mono font-bold text-white text-xs leading-tight truncate">
                  {market.displaySymbol}
                </div>
                <div className="text-[9px] text-slate-500 font-mono truncate mt-0.5">
                  {market.category}
                </div>
              </div>

              {/* Price */}
              <div className="mt-2">
                <div className="font-mono font-semibold text-slate-200 text-[11px] tabular-nums">
                  {hasData ? mock.price : '---'}
                </div>
                <div
                  className={`flex items-center space-x-1 text-[10px] font-mono font-bold mt-0.5 ${
                    isUp ? 'text-emerald-400' : 'text-rose-400'
                  }`}
                >
                  {isUp ? (
                    <TrendingUp className="w-3 h-3" />
                  ) : (
                    <TrendingDown className="w-3 h-3" />
                  )}
                  <span>
                    {isUp ? '+' : ''}
                    {hasData ? `${mock.change.toFixed(2)}%` : '---'}
                  </span>
                </div>
              </div>

              {/* Payout */}
              <div className="mt-2 flex items-center justify-between">
                <span className="text-[9px] text-slate-500 font-mono">Payout</span>
                <span className="text-[10px] font-bold font-mono text-emerald-300">
                  {hasData ? `+${mock.payout}%` : '---'}
                </span>
              </div>

              {/* Hover glow */}
              <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none bg-gradient-to-br from-cyan-500/5 to-transparent" />
            </button>
          );
        })}
      </div>

      {/* Footer Note */}
      <div className="px-4 py-2.5 border-t border-slate-800/60 bg-slate-950/40 flex items-center justify-between">
        <p className="text-[9px] font-mono text-slate-500">
          OTC instruments are available on the Quotex platform. Prices shown are indicative only.
        </p>
        <span className="text-[9px] font-mono text-slate-600">{displayList.length} shown</span>
      </div>
    </div>
  );
};
