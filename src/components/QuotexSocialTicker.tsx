import React, { useState } from 'react';
import { ArrowDown, ArrowUp, ChevronDown, ChevronUp, Globe, Sparkles, TrendingUp, Users } from 'lucide-react';
import { useDemoTrading } from '../context/DemoTradingContext';

export const QuotexSocialTicker: React.FC = () => {
  const { socialFeed } = useDemoTrading();
  const [isOpen, setIsOpen] = useState(true);

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-4 left-4 z-40 px-3 py-1.5 rounded-xl bg-[#0c1017] hover:bg-slate-900 border border-slate-800 text-xs font-mono text-cyan-400 flex items-center space-x-2 shadow-xl"
      >
        <Users className="w-3.5 h-3.5" />
        <span>Live Deals Stream</span>
        <ChevronUp className="w-3.5 h-3.5" />
      </button>
    );
  }

  return (
    <div className="fixed bottom-4 left-4 z-40 hidden xl:flex flex-col w-72 bg-[#0C1017]/95 border border-slate-800 rounded-2xl shadow-2xl backdrop-blur-md overflow-hidden font-mono text-xs">
      <div className="flex items-center justify-between px-3.5 py-2 border-b border-slate-800/80 bg-slate-950/60">
        <div className="flex items-center space-x-2 text-slate-300 font-bold">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
          <span className="text-[11px] uppercase tracking-wider text-cyan-400">Global Deals Stream</span>
        </div>
        <button
          onClick={() => setIsOpen(false)}
          className="text-slate-400 hover:text-white p-0.5 rounded"
        >
          <ChevronDown className="w-3.5 h-3.5" />
        </button>
      </div>

      <div className="p-2 space-y-1.5 max-h-48 overflow-y-auto no-scrollbar">
        {socialFeed.slice(0, 5).map((deal) => (
          <div
            key={deal.id}
            className="p-2 rounded-lg bg-slate-950/70 border border-slate-850 flex items-center justify-between animate-in fade-in"
          >
            <div className="flex items-center space-x-2">
              <span className="text-sm">{deal.flag}</span>
              <div>
                <div className="font-bold text-white text-[11px]">{deal.traderName}</div>
                <div className="text-[10px] text-slate-400 flex items-center space-x-1">
                  <span>{deal.symbol}</span>
                  <span className={deal.direction === 'UP' ? 'text-emerald-400' : 'text-rose-400'}>
                    {deal.direction === 'UP' ? '▲ HIGHER' : '▼ LOWER'}
                  </span>
                </div>
              </div>
            </div>

            <div className="text-right">
              <div
                className={`font-bold text-[11px] ${
                  deal.status === 'WON' ? 'text-emerald-400' : 'text-rose-400'
                }`}
              >
                {deal.status === 'WON' ? `+$${deal.profit.toFixed(1)}` : `-$${deal.amount}`}
              </div>
              <div className="text-[9px] text-slate-500">{deal.time}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
