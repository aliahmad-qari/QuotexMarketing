import React, { useState } from 'react';
import {
  AlertCircle,
  ArrowDown,
  ArrowUp,
  Award,
  CheckCircle2,
  ChevronDown,
  Clock,
  DollarSign,
  Flame,
  History,
  Minus,
  Percent,
  Plus,
  RefreshCw,
  Sparkles,
  TrendingDown,
  TrendingUp,
  Volume2,
  VolumeX,
  XCircle,
  Zap,
} from 'lucide-react';
import { useDemoTrading } from '../context/DemoTradingContext';
import { Direction, MarketMetadata, MarketSymbol, Prediction, Timeframe } from '../types/market';

interface OrderTerminalPanelProps {
  symbol: MarketSymbol;
  currentPrice: number;
  timeframe: Timeframe;
  prediction1: Prediction | null;
  metadata: MarketMetadata | null;
}

export const OrderTerminalPanel: React.FC<OrderTerminalPanelProps> = ({
  symbol,
  currentPrice,
  timeframe,
  prediction1,
  metadata,
}) => {
  const {
    demoBalance,
    placeTrade,
    activeTrades,
    closedTrades,
    resetBalance,
    depositDemo,
    soundEnabled,
    setSoundEnabled,
    accountMode,
    setAccountMode,
  } = useDemoTrading();

  // Selected trade parameters
  const [durationSeconds, setDurationSeconds] = useState<number>(() => {
    switch (timeframe) {
      case '5s':
        return 5;
      case '10s':
        return 10;
      case '15s':
        return 15;
      case '30s':
        return 30;
      case '1m':
        return 60;
      case '2m':
        return 120;
      case '5m':
        return 300;
      default:
        return 60;
    }
  });

  const [investment, setInvestment] = useState<number>(100);
  const [activeTab, setActiveTab] = useState<'terminal' | 'active' | 'history'>('terminal');
  const [showDepositModal, setShowDepositModal] = useState<boolean>(false);
  const [tradeSuccessMsg, setTradeSuccessMsg] = useState<string | null>(null);

  // Asset Payout Yield (Quotex style: 85% to 92%)
  const payoutPercent = 87;
  const expectedProfit = (investment * payoutPercent) / 100;
  const totalReturn = investment + expectedProfit;

  // Signal suggestion from quantitative prediction engine
  const suggestedDirection = prediction1?.predictedDirection || 'UP';
  const confidence = prediction1?.confidence || 65;

  const handleAdjustAmount = (delta: number) => {
    setInvestment((prev) => {
      const next = prev + delta;
      return Math.max(1, Math.min(demoBalance, next));
    });
  };

  const handleSetExactAmount = (amount: number) => {
    setInvestment(Math.min(demoBalance, amount));
  };

  const handleExecuteTrade = (direction: Direction) => {
    if (investment > demoBalance) {
      setShowDepositModal(true);
      return;
    }

    const success = placeTrade(
      symbol,
      direction,
      investment,
      durationSeconds,
      currentPrice,
      payoutPercent
    );

    if (success) {
      setTradeSuccessMsg(`${direction === 'UP' ? 'HIGHER / CALL' : 'LOWER / PUT'} Deal Created: $${investment}`);
      setTimeout(() => setTradeSuccessMsg(null), 2500);
    }
  };

  const formatTimeRemaining = (expiresAt: number) => {
    const remainingMs = Math.max(0, expiresAt - Date.now());
    const totalSec = Math.ceil(remainingMs / 1000);
    const mins = Math.floor(totalSec / 60);
    const secs = totalSec % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="w-full lg:w-80 bg-[#0c1017] border border-slate-800 rounded-2xl flex flex-col justify-between overflow-hidden shadow-2xl">
      {/* Header Tabs: Terminal / Open Deals / History */}
      <div className="flex items-center justify-between border-b border-slate-800/80 bg-slate-950/60 p-2">
        <div className="flex items-center space-x-1">
          <button
            onClick={() => setActiveTab('terminal')}
            className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold transition-all flex items-center space-x-1.5 ${
              activeTab === 'terminal'
                ? 'bg-slate-800 text-cyan-400 border border-slate-700 shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Zap className="w-3.5 h-3.5 text-cyan-400" />
            <span>Trade</span>
          </button>
          <button
            onClick={() => setActiveTab('active')}
            className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold transition-all flex items-center space-x-1.5 ${
              activeTab === 'active'
                ? 'bg-slate-800 text-cyan-400 border border-slate-700 shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Clock className="w-3.5 h-3.5 text-amber-400" />
            <span>Active ({activeTrades.length})</span>
          </button>
          <button
            onClick={() => setActiveTab('history')}
            className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold transition-all flex items-center space-x-1.5 ${
              activeTab === 'history'
                ? 'bg-slate-800 text-cyan-400 border border-slate-700 shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <History className="w-3.5 h-3.5 text-purple-400" />
            <span>Deals</span>
          </button>
        </div>

        {/* Audio FX Toggle */}
        <button
          onClick={() => setSoundEnabled(!soundEnabled)}
          className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          title={soundEnabled ? 'Disable Sound FX' : 'Enable Sound FX'}
        >
          {soundEnabled ? <Volume2 className="w-3.5 h-3.5 text-cyan-400" /> : <VolumeX className="w-3.5 h-3.5 text-slate-500" />}
        </button>
      </div>

      {/* TAB 1: ORDER EXECUTION TERMINAL */}
      {activeTab === 'terminal' && (
        <div className="p-4 space-y-4 flex-1">
          {/* Demo Balance Strip */}
          <div className="p-3 rounded-xl bg-gradient-to-r from-slate-900 via-slate-900/80 to-[#121927] border border-cyan-500/20 flex items-center justify-between">
            <div>
              <div className="text-[10px] font-mono text-slate-400 uppercase tracking-wider flex items-center space-x-1">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                <span>Demo Account</span>
              </div>
              <div className="text-lg font-mono font-black text-emerald-400 tracking-tight">
                ${demoBalance.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </div>
            </div>
            <button
              onClick={() => resetBalance(10000)}
              className="p-2 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 transition-all text-xs font-mono flex items-center space-x-1"
              title="Reset Virtual Demo Balance to $10,000"
            >
              <RefreshCw className="w-3.5 h-3.5 text-cyan-400" />
              <span className="text-[11px] hidden sm:inline">Top Up</span>
            </button>
          </div>

          {/* Time / Expiry Duration Selector */}
          <div className="space-y-1.5 font-mono">
            <div className="flex justify-between text-xs">
              <span className="text-slate-400 flex items-center space-x-1">
                <Clock className="w-3.5 h-3.5 text-cyan-400" />
                <span>Time / Expiration</span>
              </span>
              <span className="text-cyan-300 font-bold">
                {durationSeconds < 60 ? `${durationSeconds}s` : `${Math.floor(durationSeconds / 60)}m`}
              </span>
            </div>
            <div className="grid grid-cols-4 gap-1.5">
              {[
                { sec: 5, label: '00:05' },
                { sec: 15, label: '00:15' },
                { sec: 30, label: '00:30' },
                { sec: 60, label: '01:00' },
                { sec: 120, label: '02:00' },
                { sec: 300, label: '05:00' },
                { sec: 600, label: '10:00' },
                { sec: 900, label: '15:00' },
              ].map((opt) => (
                <button
                  key={opt.sec}
                  onClick={() => setDurationSeconds(opt.sec)}
                  className={`py-1.5 text-center text-xs font-bold rounded-lg border transition-all ${
                    durationSeconds === opt.sec
                      ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/50 shadow-sm'
                      : 'bg-slate-900/60 text-slate-400 border-slate-800 hover:bg-slate-800 hover:text-slate-200'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Investment Amount Input */}
          <div className="space-y-1.5 font-mono">
            <div className="flex justify-between text-xs">
              <span className="text-slate-400 flex items-center space-x-1">
                <DollarSign className="w-3.5 h-3.5 text-emerald-400" />
                <span>Investment</span>
              </span>
              <span className="text-emerald-400 font-bold">${investment}</span>
            </div>

            <div className="flex items-center space-x-1 bg-slate-900 border border-slate-800 rounded-xl p-1">
              <button
                onClick={() => handleAdjustAmount(-10)}
                className="w-8 h-8 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 flex items-center justify-center transition-colors"
              >
                <Minus className="w-3.5 h-3.5" />
              </button>
              <div className="flex-1 text-center font-black text-white text-base">
                <input
                  type="number"
                  min="1"
                  max={demoBalance}
                  value={investment}
                  onChange={(e) => setInvestment(Math.max(1, Number(e.target.value)))}
                  className="w-full text-center bg-transparent text-white font-mono font-bold focus:outline-none"
                />
              </div>
              <button
                onClick={() => handleAdjustAmount(10)}
                className="w-8 h-8 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 flex items-center justify-center transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Quick Amount Pills */}
            <div className="grid grid-cols-4 gap-1.5 pt-0.5">
              {[10, 25, 50, 100, 250, 500].map((amt) => (
                <button
                  key={amt}
                  onClick={() => handleSetExactAmount(amt)}
                  className={`py-1 text-center text-[11px] font-bold rounded-lg border transition-all ${
                    investment === amt
                      ? 'bg-slate-800 text-white border-slate-600'
                      : 'bg-slate-950 text-slate-400 border-slate-850 hover:bg-slate-900 hover:text-slate-200'
                  }`}
                >
                  +${amt}
                </button>
              ))}
              <button
                onClick={() => setInvestment(1)}
                className="py-1 text-center text-[11px] font-bold rounded-lg bg-slate-950 text-slate-400 border border-slate-850 hover:bg-slate-900 hover:text-slate-200"
              >
                Min
              </button>
              <button
                onClick={() => setInvestment(Math.min(demoBalance, 1000))}
                className="py-1 text-center text-[11px] font-bold rounded-lg bg-slate-950 text-amber-400 border border-slate-850 hover:bg-slate-900 hover:text-amber-300"
              >
                Max
              </button>
            </div>
          </div>

          {/* Payout & Return Summary */}
          <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800 space-y-1.5 font-mono text-xs">
            <div className="flex justify-between text-slate-400">
              <span>Payout Rate:</span>
              <span className="text-emerald-400 font-bold">+{payoutPercent}%</span>
            </div>
            <div className="flex justify-between text-slate-400">
              <span>Expected Profit:</span>
              <span className="text-emerald-400 font-bold">+${expectedProfit.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-slate-200 font-bold border-t border-slate-800 pt-1">
              <span>Total Payout:</span>
              <span className="text-cyan-400 text-sm">${totalReturn.toFixed(2)}</span>
            </div>
          </div>

          {/* Signal Indicator Consensus Pill */}
          <div className="p-2.5 rounded-xl bg-cyan-950/30 border border-cyan-500/20 flex items-center justify-between text-xs font-mono">
            <div className="flex items-center space-x-2">
              <Sparkles className="w-3.5 h-3.5 text-cyan-400 animate-pulse" />
              <span className="text-slate-300">Model Consensus:</span>
            </div>
            <div className="flex items-center space-x-1.5 font-bold">
              <span className={suggestedDirection === 'UP' ? 'text-emerald-400' : 'text-rose-400'}>
                {suggestedDirection === 'UP' ? 'CALL (UP)' : 'PUT (DOWN)'}
              </span>
              <span className="text-cyan-400 bg-cyan-500/10 px-1.5 py-0.5 rounded border border-cyan-500/20">
                {confidence}%
              </span>
            </div>
          </div>

          {/* Success Message Banner */}
          {tradeSuccessMsg && (
            <div className="p-2 rounded-lg bg-emerald-950/60 border border-emerald-500/40 text-emerald-300 text-xs font-mono flex items-center space-x-1.5 animate-in fade-in">
              <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
              <span>{tradeSuccessMsg}</span>
            </div>
          )}

          {/* THE BIG QUOTEX ACTION BUTTONS */}
          <div className="space-y-2.5 pt-1">
            {/* HIGHER / CALL BUTTON */}
            <button
              onClick={() => handleExecuteTrade('UP')}
              className="w-full py-3.5 px-4 rounded-xl bg-[#00E676] hover:bg-[#00C853] active:scale-[0.99] text-slate-950 font-black text-sm font-mono flex items-center justify-between shadow-lg shadow-emerald-500/20 transition-all group"
            >
              <div className="flex items-center space-x-2">
                <div className="w-7 h-7 rounded-lg bg-black/10 flex items-center justify-center group-hover:-translate-y-0.5 transition-transform">
                  <ArrowUp className="w-5 h-5 text-slate-950 stroke-[3]" />
                </div>
                <div className="text-left">
                  <div className="leading-tight font-extrabold uppercase">HIGHER (CALL)</div>
                  <div className="text-[10px] text-slate-900 font-semibold">Yield: +{payoutPercent}%</div>
                </div>
              </div>
              <div className="text-right">
                <div className="text-xs font-extrabold">+${expectedProfit.toFixed(2)}</div>
                <div className="text-[10px] text-slate-900">Total ${totalReturn.toFixed(2)}</div>
              </div>
            </button>

            {/* LOWER / PUT BUTTON */}
            <button
              onClick={() => handleExecuteTrade('DOWN')}
              className="w-full py-3.5 px-4 rounded-xl bg-[#FF3355] hover:bg-[#E62E4D] active:scale-[0.99] text-white font-black text-sm font-mono flex items-center justify-between shadow-lg shadow-rose-500/20 transition-all group"
            >
              <div className="flex items-center space-x-2">
                <div className="w-7 h-7 rounded-lg bg-black/10 flex items-center justify-center group-hover:translate-y-0.5 transition-transform">
                  <ArrowDown className="w-5 h-5 text-white stroke-[3]" />
                </div>
                <div className="text-left">
                  <div className="leading-tight font-extrabold uppercase">LOWER (PUT)</div>
                  <div className="text-[10px] text-rose-100 font-semibold">Yield: +{payoutPercent}%</div>
                </div>
              </div>
              <div className="text-right">
                <div className="text-xs font-extrabold">+${expectedProfit.toFixed(2)}</div>
                <div className="text-[10px] text-rose-100">Total ${totalReturn.toFixed(2)}</div>
              </div>
            </button>
          </div>
        </div>
      )}

      {/* TAB 2: ACTIVE DEALS */}
      {activeTab === 'active' && (
        <div className="p-4 space-y-3 flex-1 overflow-y-auto max-h-[500px] font-mono">
          <div className="flex items-center justify-between text-xs text-slate-400 border-b border-slate-800 pb-2">
            <span>Open Deals ({activeTrades.length})</span>
            <span className="text-[10px] text-cyan-400">Live Settlement</span>
          </div>

          {activeTrades.length === 0 ? (
            <div className="py-12 text-center text-slate-500 text-xs space-y-2">
              <Clock className="w-8 h-8 mx-auto text-slate-600 opacity-50" />
              <p>No active deals in progress.</p>
              <button
                onClick={() => setActiveTab('terminal')}
                className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-cyan-400 text-xs font-bold"
              >
                Place a Demo Deal
              </button>
            </div>
          ) : (
            <div className="space-y-2.5">
              {activeTrades.map((trade) => {
                const isProfitable =
                  trade.direction === 'UP'
                    ? currentPrice > trade.entryPrice
                    : currentPrice < trade.entryPrice;

                return (
                  <div
                    key={trade.id}
                    className="p-3 rounded-xl bg-slate-950/80 border border-slate-800 space-y-2 relative overflow-hidden"
                  >
                    {/* Direction Accent */}
                    <div
                      className={`absolute top-0 left-0 bottom-0 w-1 ${
                        trade.direction === 'UP' ? 'bg-emerald-400' : 'bg-rose-400'
                      }`}
                    />

                    <div className="flex items-center justify-between text-xs">
                      <div className="flex items-center space-x-1.5">
                        <span
                          className={`font-bold px-1.5 py-0.5 rounded text-[10px] ${
                            trade.direction === 'UP'
                              ? 'bg-emerald-500/20 text-emerald-400'
                              : 'bg-rose-500/20 text-rose-400'
                          }`}
                        >
                          {trade.direction === 'UP' ? 'CALL ▲' : 'PUT ▼'}
                        </span>
                        <span className="font-bold text-white">{trade.symbol}</span>
                      </div>
                      <span className="text-cyan-400 font-bold">
                        {formatTimeRemaining(trade.expiresAt)}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-[11px] text-slate-400 pt-1">
                      <div>
                        <div>Entry: ${trade.entryPrice.toFixed(2)}</div>
                        <div>Invested: ${trade.amount}</div>
                      </div>
                      <div className="text-right">
                        <div>Current: ${currentPrice.toFixed(2)}</div>
                        <div
                          className={`font-bold ${
                            isProfitable ? 'text-emerald-400' : 'text-rose-400'
                          }`}
                        >
                          {isProfitable ? `+$${trade.expectedProfit.toFixed(2)}` : `-$${trade.amount}`}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* TAB 3: DEALS HISTORY */}
      {activeTab === 'history' && (
        <div className="p-4 space-y-3 flex-1 overflow-y-auto max-h-[500px] font-mono">
          <div className="flex items-center justify-between text-xs text-slate-400 border-b border-slate-800 pb-2">
            <span>Settled Deals ({closedTrades.length})</span>
            <span className="text-[10px] text-emerald-400 font-bold">
              Win Rate: {closedTrades.length > 0 ? ((closedTrades.filter((t) => t.status === 'WON').length / closedTrades.length) * 100).toFixed(1) : 0}%
            </span>
          </div>

          {closedTrades.length === 0 ? (
            <div className="py-12 text-center text-slate-500 text-xs space-y-2">
              <History className="w-8 h-8 mx-auto text-slate-600 opacity-50" />
              <p>No settled deals yet.</p>
            </div>
          ) : (
            <div className="space-y-2">
              {closedTrades.slice(0, 15).map((trade) => (
                <div
                  key={trade.id}
                  className="p-2.5 rounded-lg bg-slate-950 border border-slate-850 flex items-center justify-between text-xs"
                >
                  <div className="flex items-center space-x-2">
                    <span
                      className={`w-2 h-2 rounded-full ${
                        trade.status === 'WON'
                          ? 'bg-emerald-400'
                          : trade.status === 'TIE'
                          ? 'bg-amber-400'
                          : 'bg-rose-400'
                      }`}
                    />
                    <div>
                      <div className="font-bold text-white flex items-center space-x-1">
                        <span>{trade.symbol}</span>
                        <span
                          className={`text-[10px] ${
                            trade.direction === 'UP' ? 'text-emerald-400' : 'text-rose-400'
                          }`}
                        >
                          {trade.direction === 'UP' ? '▲' : '▼'}
                        </span>
                      </div>
                      <div className="text-[10px] text-slate-500">
                        {new Date(trade.createdAt).toLocaleTimeString()}
                      </div>
                    </div>
                  </div>

                  <div className="text-right">
                    <div
                      className={`font-bold ${
                        trade.status === 'WON'
                          ? 'text-emerald-400'
                          : trade.status === 'TIE'
                          ? 'text-amber-400'
                          : 'text-rose-400'
                      }`}
                    >
                      {trade.status === 'WON'
                        ? `+$${trade.actualProfit?.toFixed(2)}`
                        : trade.status === 'TIE'
                        ? '$0.00'
                        : `-$${trade.amount.toFixed(2)}`}
                    </div>
                    <div className="text-[10px] text-slate-500">
                      {trade.status}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Footer Info */}
      <div className="px-4 py-2.5 border-t border-slate-800/80 bg-slate-950/60 flex items-center justify-between text-[11px] font-mono text-slate-400">
        <span>Payout guaranteed on settlement</span>
        <span className="text-emerald-400 font-bold">100% Sandbox Realtime</span>
      </div>
    </div>
  );
};
