import React, { useEffect, useState } from 'react';
import { Award, CheckCircle2, TrendingDown, TrendingUp, X, XCircle } from 'lucide-react';
import { useDemoTrading } from '../context/DemoTradingContext';

export const TradeResultModal: React.FC = () => {
  const { lastSettledTrade, clearLastSettledTrade } = useDemoTrading();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (lastSettledTrade) {
      setVisible(true);
      const timer = setTimeout(() => {
        setVisible(false);
        clearLastSettledTrade();
      }, 4000);
      return () => clearTimeout(timer);
    }
  }, [lastSettledTrade]);

  if (!visible || !lastSettledTrade) return null;

  const isWon = lastSettledTrade.status === 'WON';
  const isTie = lastSettledTrade.status === 'TIE';

  return (
    <div className="fixed top-20 right-6 z-50 animate-in slide-in-from-top-4 duration-300">
      <div
        className={`p-4 rounded-2xl border shadow-2xl backdrop-blur-md flex items-center space-x-3.5 max-w-sm ${
          isWon
            ? 'bg-[#062016]/95 border-emerald-500/50 shadow-emerald-500/20 text-emerald-100'
            : isTie
            ? 'bg-[#1C1808]/95 border-amber-500/50 shadow-amber-500/20 text-amber-100'
            : 'bg-[#220B11]/95 border-rose-500/50 shadow-rose-500/20 text-rose-100'
        }`}
      >
        <div
          className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold flex-shrink-0 ${
            isWon
              ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
              : isTie
              ? 'bg-amber-500/20 text-amber-400 border border-amber-500/40'
              : 'bg-rose-500/20 text-rose-400 border border-rose-500/40'
          }`}
        >
          {isWon ? <CheckCircle2 className="w-6 h-6 text-emerald-400" /> : isTie ? <Award className="w-6 h-6 text-amber-400" /> : <XCircle className="w-6 h-6 text-rose-400" />}
        </div>

        <div className="flex-1 font-mono">
          <div className="flex items-center justify-between">
            <span className="text-xs font-extrabold uppercase tracking-wider">
              {isWon ? '🎉 Deal Successful' : isTie ? '🤝 Deal Tied' : '❌ Deal Expired'}
            </span>
            <button
              onClick={() => {
                setVisible(false);
                clearLastSettledTrade();
              }}
              className="text-slate-400 hover:text-white p-0.5"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="text-sm font-black pt-0.5">
            {isWon ? (
              <span className="text-emerald-400 text-base">
                +${lastSettledTrade.actualProfit?.toFixed(2)} Profit
              </span>
            ) : isTie ? (
              <span className="text-amber-400">+$0.00 (Refunded)</span>
            ) : (
              <span className="text-rose-400">-${lastSettledTrade.amount.toFixed(2)}</span>
            )}
          </div>

          <div className="text-[10px] text-slate-300/80 flex items-center space-x-2 pt-0.5">
            <span>{lastSettledTrade.symbol}</span>
            <span>•</span>
            <span>{lastSettledTrade.direction === 'UP' ? 'HIGHER ▲' : 'LOWER ▼'}</span>
            <span>•</span>
            <span>{lastSettledTrade.durationSeconds}s Expiry</span>
          </div>
        </div>
      </div>
    </div>
  );
};
