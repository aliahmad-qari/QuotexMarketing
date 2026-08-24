import React, { useState } from 'react';
import {
  ArrowDownRight,
  ArrowUpRight,
  ChevronDown,
  Clock,
  Coins,
  DollarSign,
  Plus,
  RefreshCw,
  Search,
  Sparkles,
  Zap,
} from 'lucide-react';
import { useDemoTrading } from '../context/DemoTradingContext';
import { MarketMetadata, MarketSymbol, Timeframe } from '../types/market';

interface MarketTimeframeBarProps {
  symbol: MarketSymbol;
  onSelectSymbol: (symbol: MarketSymbol) => void;
  timeframe: Timeframe;
  onSelectTimeframe: (tf: Timeframe) => void;
  metadata: MarketMetadata | null;
  secondsRemaining?: number;
}

const SUPPORTED_SYMBOLS: { symbol: MarketSymbol; name: string; payout: number; icon: string }[] = [
  { symbol: 'BTCUSDT', name: 'Bitcoin', payout: 87, icon: '₿' },
  { symbol: 'ETHUSDT', name: 'Ethereum', payout: 87, icon: 'Ξ' },
  { symbol: 'SOLUSDT', name: 'Solana', payout: 88, icon: '◎' },
  { symbol: 'BNBUSDT', name: 'BNB Chain', payout: 85, icon: 'BNB' },
  { symbol: 'XRPUSDT', name: 'Ripple', payout: 85, icon: '✕' },
  { symbol: 'ADAUSDT', name: 'Cardano', payout: 83, icon: '₳' },
  { symbol: 'DOGEUSDT', name: 'Dogecoin', payout: 82, icon: 'Ð' },
];

const TIMEFRAMES: { id: Timeframe; label: string; isSubMinute?: boolean }[] = [
  { id: '5s', label: '5s', isSubMinute: true },
  { id: '10s', label: '10s', isSubMinute: true },
  { id: '15s', label: '15s', isSubMinute: true },
  { id: '30s', label: '30s', isSubMinute: true },
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
  const { demoBalance, resetBalance } = useDemoTrading();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const isPositive = (metadata?.priceChangePercent24h || 0) >= 0;
  const currentAsset = SUPPORTED_SYMBOLS.find((s) => s.symbol === symbol) || SUPPORTED_SYMBOLS[0];

  const filteredSymbols = SUPPORTED_SYMBOLS.filter(
    (s) =>
      s.symbol.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="w-full bg-[#0C1017] border border-slate-800 rounded-2xl p-3 sm:p-4 space-y-3 shadow-xl">
      {/* Top Row: Quotex Asset Dropdown + 24h Ticker + Demo Balance */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        {/* Left: Asset Selector Pill */}
        <div className="relative">
          <button
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            className="px-3.5 py-2 rounded-xl bg-slate-900/90 hover:bg-slate-850 border border-slate-750 text-white font-mono flex items-center space-x-3 shadow-md transition-all"
          >
            <div className="w-6 h-6 rounded-full bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-300 font-bold text-xs">
              {currentAsset.icon}
            </div>
            <div className="text-left">
              <div className="flex items-center space-x-1.5 leading-tight">
                <span className="font-black text-sm">{symbol.replace('USDT', '')}/USDT</span>
                <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                  +{currentAsset.payout}%
                </span>
              </div>
              <div className="text-[10px] text-slate-400">{currentAsset.name} Spot</div>
            </div>
            <ChevronDown className="w-4 h-4 text-slate-400" />
          </button>

          {/* Dropdown Menu */}
          {isDropdownOpen && (
            <div className="absolute top-full left-0 mt-2 w-72 bg-[#0E131F] border border-slate-800 rounded-2xl shadow-2xl z-50 overflow-hidden font-mono text-xs animate-in fade-in duration-150">
              <div className="p-2.5 border-b border-slate-800 bg-slate-950/60">
                <div className="flex items-center space-x-2 bg-slate-900 px-2.5 py-1.5 rounded-lg border border-slate-800">
                  <Search className="w-3.5 h-3.5 text-slate-400" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search asset..."
                    className="w-full bg-transparent text-white placeholder-slate-500 focus:outline-none text-xs"
                    autoFocus
                  />
                </div>
              </div>

              <div className="max-h-64 overflow-y-auto p-1 space-y-1">
                {filteredSymbols.map((item) => (
                  <button
                    key={item.symbol}
                    onClick={() => {
                      onSelectSymbol(item.symbol);
                      setIsDropdownOpen(false);
                    }}
                    className={`w-full p-2 rounded-xl flex items-center justify-between transition-all ${
                      symbol === item.symbol
                        ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                        : 'text-slate-300 hover:bg-slate-900 hover:text-white'
                    }`}
                  >
                    <div className="flex items-center space-x-2.5">
                      <div className="w-6 h-6 rounded-full bg-slate-800 flex items-center justify-center text-slate-200 font-bold text-xs">
                        {item.icon}
                      </div>
                      <div className="text-left">
                        <div className="font-bold">{item.symbol.replace('USDT', '')}/USDT</div>
                        <div className="text-[10px] text-slate-400">{item.name}</div>
                      </div>
                    </div>

                    <div className="text-right">
                      <span className="font-extrabold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                        +{item.payout}%
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Center: Live 24h Price & Stats */}
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

        {/* Right: Quick Demo Balance Widget */}
        <div className="flex items-center space-x-2 bg-slate-950/80 border border-slate-800 rounded-xl px-3 py-1.5 font-mono">
          <div>
            <div className="text-[10px] text-slate-400 uppercase tracking-wider flex items-center space-x-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
              <span>Demo Balance</span>
            </div>
            <div className="text-xs sm:text-sm font-black text-emerald-400">
              ${demoBalance.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
          </div>
          <button
            onClick={() => resetBalance(10000)}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            title="Reset to $10,000"
          >
            <RefreshCw className="w-3.5 h-3.5 text-cyan-400" />
          </button>
        </div>
      </div>

      {/* Bottom Row: Timeframe intervals + Candle Countdown Timer */}
      <div className="flex flex-wrap items-center justify-between pt-2 border-t border-slate-800/80 gap-2">
        <div className="flex items-center space-x-2 text-xs text-slate-400 font-mono">
          <Clock className="w-3.5 h-3.5 text-cyan-400" />
          <span className="hidden sm:inline">Timeframe:</span>
        </div>

        {/* Timeframe Buttons */}
        <div className="flex flex-wrap items-center gap-1">
          {TIMEFRAMES.map((tf) => {
            const isSelected = timeframe === tf.id;
            return (
              <button
                key={tf.id}
                id={`timeframe-btn-${tf.id}`}
                onClick={() => onSelectTimeframe(tf.id)}
                className={`px-2.5 py-1 rounded-lg text-xs font-mono font-bold transition-all ${
                  isSelected
                    ? 'bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/20'
                    : 'bg-slate-900/80 text-slate-400 hover:text-slate-200 hover:bg-slate-800 border border-slate-800'
                }`}
              >
                {tf.label}
              </button>
            );
          })}
        </div>

        {/* Candle Seal Countdown */}
        <div className="flex items-center space-x-1.5 text-xs font-mono bg-slate-900/90 border border-cyan-500/30 px-2.5 py-1 rounded-lg text-cyan-300">
          <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping"></span>
          <span>Bar Close:</span>
          <span className="font-bold text-white">
            {secondsRemaining > 0 ? `${secondsRemaining}s` : 'Sealing...'}
          </span>
        </div>
      </div>
    </div>
  );
};
