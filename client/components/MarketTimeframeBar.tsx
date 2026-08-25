'use client';

import { useState } from 'react';
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

interface MarketTimeframeBarProps {
  symbol: MarketSymbol;
  onSelectSymbol: (symbol: MarketSymbol) => void;
  timeframe: Timeframe;
  onSelectTimeframe: (tf: Timeframe) => void;
  metadata: MarketMetadata | null;
  secondsRemaining?: number;
}

const SUPPORTED_SYMBOLS: { symbol: MarketSymbol; name: string; icon: string }[] = [
  { symbol: 'BTCUSDT', name: 'Bitcoin', icon: 'BTC' },
  { symbol: 'ETHUSDT', name: 'Ethereum', icon: 'ETH' },
  { symbol: 'SOLUSDT', name: 'Solana', icon: 'SOL' },
  { symbol: 'BNBUSDT', name: 'BNB Chain', icon: 'BNB' },
  { symbol: 'XRPUSDT', name: 'Ripple', icon: 'XRP' },
  { symbol: 'ADAUSDT', name: 'Cardano', icon: 'ADA' },
  { symbol: 'DOGEUSDT', name: 'Dogecoin', icon: 'DOGE' },
];

const TIMEFRAMES: { id: Timeframe; label: string }[] = [
  { id: '5s', label: '5s' },
  { id: '10s', label: '10s' },
  { id: '15s', label: '15s' },
  { id: '30s', label: '30s' },
  { id: '1m', label: '1m' },
  { id: '2m', label: '2m' },
  { id: '5m', label: '5m' },
  { id: '1h', label: '1h' },
  { id: '2h', label: '2h' },
  { id: '3h', label: '3h' },
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
  const [otcNotice, setOtcNotice] = useState('');
  const [otcFilter, setOtcFilter] = useState<OtcMarketFilter>('All');

  const isPositive = (metadata?.priceChangePercent24h || 0) >= 0;
  const currentAsset = SUPPORTED_SYMBOLS.find((s) => s.symbol === symbol) || SUPPORTED_SYMBOLS[0];
  const normalizedSearch = searchQuery.trim().toLowerCase();

  const filteredSymbols = SUPPORTED_SYMBOLS.filter(
    (s) =>
      s.symbol.toLowerCase().includes(normalizedSearch) ||
      s.name.toLowerCase().includes(normalizedSearch)
  );

  const filteredOtcMarkets = OTC_MARKETS.filter(
    (market) =>
      (otcFilter === 'All' || market.category === otcFilter) &&
      (market.symbol.toLowerCase().includes(normalizedSearch) ||
        market.displaySymbol.toLowerCase().includes(normalizedSearch) ||
        market.label.toLowerCase().includes(normalizedSearch) ||
        market.category.toLowerCase().includes(normalizedSearch))
  );

  return (
    <div className="w-full bg-[#0C1017] border border-slate-800 rounded-2xl p-3 sm:p-4 space-y-3 shadow-xl">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="relative">
          <button
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            className="px-3.5 py-2 rounded-xl bg-slate-900/90 hover:bg-slate-850 border border-slate-750 text-white font-mono flex items-center space-x-3 shadow-md transition-all"
          >
            <div className="min-w-8 h-6 px-1.5 rounded-full bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-300 font-bold text-[10px]">
              {currentAsset.icon}
            </div>
            <div className="text-left">
              <div className="font-black text-sm leading-tight">{symbol.replace('USDT', '')}/USDT</div>
              <div className="text-[10px] text-slate-400">{currentAsset.name} Spot</div>
            </div>
            <ChevronDown className="w-4 h-4 text-slate-400" />
          </button>

          {isDropdownOpen && (
            <div className="fixed left-3 right-3 top-24 sm:absolute sm:top-full sm:left-0 sm:right-auto sm:mt-2 sm:w-[min(92vw,460px)] bg-[#0E131F] border border-slate-800 rounded-2xl shadow-2xl z-50 overflow-hidden font-mono text-xs animate-in fade-in duration-150">
              <div className="p-2.5 border-b border-slate-800 bg-slate-950/60">
                <div className="flex items-center space-x-2 bg-slate-900 px-2.5 py-1.5 rounded-lg border border-slate-800">
                  <Search className="w-3.5 h-3.5 text-slate-400" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => {
                      setSearchQuery(e.target.value);
                      setOtcNotice('');
                    }}
                    placeholder="Search asset or OTC market..."
                    className="w-full bg-transparent text-white placeholder-slate-500 focus:outline-none text-xs"
                    autoFocus
                  />
                </div>

                {otcNotice && (
                  <div className="mt-2 rounded-lg border border-amber-500/30 bg-amber-500/10 px-2.5 py-2 text-[10px] leading-4 text-amber-200">
                    {otcNotice}
                  </div>
                )}
              </div>

              <div className="max-h-96 overflow-y-auto p-1.5 space-y-2">
                <div className="px-1.5 pt-1 text-[10px] font-bold uppercase tracking-wider text-cyan-300">
                  Live Binance Spot
                </div>
                {filteredSymbols.map((item) => (
                  <button
                    key={item.symbol}
                    onClick={() => {
                      onSelectSymbol(item.symbol);
                      setOtcNotice('');
                      setIsDropdownOpen(false);
                    }}
                    className={`w-full p-2 rounded-xl flex items-center space-x-2.5 transition-all ${
                      symbol === item.symbol
                        ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                        : 'text-slate-300 hover:bg-slate-900 hover:text-white'
                    }`}
                  >
                    <div className="min-w-8 h-6 px-1.5 rounded-full bg-slate-800 flex items-center justify-center text-slate-200 font-bold text-[10px]">
                      {item.icon}
                    </div>
                    <div className="text-left">
                      <div className="font-bold">{item.symbol.replace('USDT', '')}/USDT</div>
                      <div className="text-[10px] text-slate-400">{item.name}</div>
                    </div>
                  </button>
                ))}

                <div className="border-t border-slate-800 pt-2">
                  <div className="flex items-center justify-between px-1.5 pb-1.5">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-amber-300">
                      Quotex OTC Catalog
                    </span>
                    <span className="rounded-full border border-amber-500/30 px-2 py-0.5 text-[10px] text-amber-200">
                      {filteredOtcMarkets.length}/{OTC_MARKETS.length}
                    </span>
                  </div>
                  <div className="flex gap-1.5 overflow-x-auto px-1.5 pb-2">
                    {OTC_MARKET_FILTERS.map((filter) => (
                      <button
                        key={filter}
                        type="button"
                        onClick={() => {
                          setOtcFilter(filter);
                          setOtcNotice('');
                        }}
                        className={`shrink-0 rounded-full border px-3 py-1 text-[10px] font-bold transition-all ${
                          otcFilter === filter
                            ? 'border-cyan-400 bg-cyan-400 text-slate-950'
                            : 'border-slate-700 bg-slate-900 text-slate-400 hover:text-slate-200'
                        }`}
                      >
                        {filter}
                      </button>
                    ))}
                  </div>

                  {OTC_MARKET_CATEGORIES.map((category) => {
                    const markets = filteredOtcMarkets.filter((market) => market.category === category);
                    if (!markets.length) return null;

                    return (
                      <div key={category} className="space-y-1 pb-2">
                        <div className="px-1.5 text-[10px] font-semibold uppercase tracking-wider text-slate-500">
                          {category}
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-1">
                          {markets.map((market) => (
                            <button
                              key={market.symbol}
                              type="button"
                              onClick={() =>
                                setOtcNotice(
                                  `${market.displaySymbol} is visible as an OTC catalog market only. Live OTC candles require an approved Quotex/OTC data provider before this can be selected.`
                                )
                              }
                              className="w-full p-2 rounded-xl flex items-center space-x-2.5 text-left text-slate-400 hover:text-amber-200 hover:bg-amber-500/10 border border-transparent hover:border-amber-500/20 transition-all"
                            >
                              <div className="w-6 h-6 shrink-0 rounded-full bg-amber-500/10 border border-amber-500/25 flex items-center justify-center text-amber-300">
                                <Lock className="w-3.5 h-3.5" />
                              </div>
                              <div className="min-w-0">
                                <div className="flex items-center gap-1.5">
                                  <span className="truncate font-bold text-slate-100">{market.displaySymbol}</span>
                                  <span className="rounded bg-indigo-500/20 px-1.5 py-0.5 text-[9px] font-bold text-indigo-200">
                                    OTC
                                  </span>
                                </div>
                                <div className="truncate text-[10px] text-slate-500">{market.label.replace(' OTC', '')}</div>
                              </div>
                            </button>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}
        </div>

        {metadata && (
          <div className="flex items-center space-x-4 sm:space-x-6 text-xs font-mono">
            <div>
              <span className="text-slate-400 block text-[10px]">Live Spot Price</span>
              <span className="font-black text-white text-sm sm:text-base">
                $
                {metadata.lastPrice > 0
                  ? metadata.lastPrice.toLocaleString(undefined, {
                      minimumFractionDigits: metadata.priceDecimals,
                      maximumFractionDigits: metadata.priceDecimals,
                    })
                  : '---'}
              </span>
            </div>

            <div>
              <span className="text-slate-400 block text-[10px]">24h Delta</span>
              <span
                className={`font-bold flex items-center text-xs sm:text-sm ${
                  isPositive ? 'text-emerald-400' : 'text-rose-400'
                }`}
              >
                {isPositive ? (
                  <ArrowUpRight className="w-3.5 h-3.5 mr-0.5" />
                ) : (
                  <ArrowDownRight className="w-3.5 h-3.5 mr-0.5" />
                )}
                {isPositive ? '+' : ''}
                {metadata.priceChangePercent24h.toFixed(2)}%
              </span>
            </div>

            <div className="hidden lg:block">
              <span className="text-slate-400 block text-[10px]">24h Range (H/L)</span>
              <span className="text-slate-300">
                ${metadata.high24h.toFixed(1)} / ${metadata.low24h.toFixed(1)}
              </span>
            </div>
          </div>
        )}
      </div>

      <div className="flex flex-wrap items-center justify-between pt-2 border-t border-slate-800/80 gap-2">
        <div className="flex items-center space-x-2 text-xs text-slate-400 font-mono">
          <Clock className="w-3.5 h-3.5 text-cyan-400" />
          <span className="hidden sm:inline">Timeframe:</span>
        </div>

        <div className="flex flex-wrap items-center gap-1">
          {TIMEFRAMES.map((tf) => (
            <button
              key={tf.id}
              id={`timeframe-btn-${tf.id}`}
              onClick={() => onSelectTimeframe(tf.id)}
              className={`px-2.5 py-1 rounded-lg text-xs font-mono font-bold transition-all ${
                timeframe === tf.id
                  ? 'bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/20'
                  : 'bg-slate-900/80 text-slate-400 hover:text-slate-200 hover:bg-slate-800 border border-slate-800'
              }`}
            >
              {tf.label}
            </button>
          ))}
        </div>

        <div className="flex items-center space-x-1.5 text-xs font-mono bg-slate-900/90 border border-cyan-500/30 px-2.5 py-1 rounded-lg text-cyan-300">
          <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
          <span>Bar Close:</span>
          <span className="font-bold text-white">
            {secondsRemaining > 0 ? `${secondsRemaining}s` : 'Sealing...'}
          </span>
        </div>
      </div>
    </div>
  );
};
