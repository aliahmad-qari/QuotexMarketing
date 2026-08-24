import React from 'react';
import { AlertCircle } from 'lucide-react';
import { PageRoute } from '../types/market';

interface FooterProps {
  onNavigate: (page: PageRoute) => void;
}

export const Footer: React.FC<FooterProps> = ({ onNavigate }) => {
  return (
    <footer className="w-full bg-[#080B10] border-t border-slate-800/80 text-slate-400 text-xs py-10 mt-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        {/* Risk Disclaimer */}
        <div className="bg-slate-900/80 border border-amber-500/20 rounded-xl p-4 sm:p-5 flex items-start space-x-3.5">
          <AlertCircle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
          <div className="space-y-1 text-slate-300">
            <h4 className="font-semibold text-amber-300 text-xs tracking-wide uppercase">
              Important Regulatory & Research Disclosure
            </h4>
            <p className="text-[11px] leading-relaxed text-slate-400">
              <strong>Candle Probability Lab</strong> is strictly a quantitative research and educational platform. It is <strong>NOT a broker</strong>, does not execute trades, does not hold funds, and does not provide financial or investment advice. The predicted +1 and +2 candles are generated through a transparent mathematical indicator-agreement model and must never be construed as guaranteed future price reality. All trading carries severe financial risk.
            </p>
          </div>
        </div>

        {/* Main Footer Links */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 pt-4">
          <div className="space-y-3">
            <div className="flex items-center space-x-2">
              <div className="w-6 h-6 rounded bg-cyan-500 flex items-center justify-center text-slate-950 font-bold text-xs">
                C
              </div>
              <span className="font-bold text-white text-sm">Candle Probability Lab</span>
            </div>
            <p className="text-[11px] text-slate-400 leading-relaxed">
              Transparent, deterministic market-analysis platform delivering real live Binance spot feeds and verifiable indicator probability modeling.
            </p>
          </div>

          <div>
            <h5 className="font-semibold text-slate-200 text-xs uppercase tracking-wider mb-3">
              Platform Modules
            </h5>
            <ul className="space-y-2 text-[11px]">
              <li>
                <button onClick={() => onNavigate('dashboard')} className="hover:text-cyan-400 transition-colors">
                  Live Probability Dashboard
                </button>
              </li>
              <li>
                <button onClick={() => onNavigate('performance')} className="hover:text-cyan-400 transition-colors">
                  Verifiable Track Record & Stats
                </button>
              </li>
              <li>
                <button onClick={() => onNavigate('methodology')} className="hover:text-cyan-400 transition-colors">
                  Mathematical Formulae & Indicators
                </button>
              </li>
            </ul>
          </div>

          <div>
            <h5 className="font-semibold text-slate-200 text-xs uppercase tracking-wider mb-3">
              Compliance & Ethics
            </h5>
            <ul className="space-y-2 text-[11px]">
              <li>
                <button onClick={() => onNavigate('risk-disclosure')} className="hover:text-cyan-400 transition-colors">
                  Full Risk Disclosure
                </button>
              </li>
              <li>
                <button onClick={() => onNavigate('about')} className="hover:text-cyan-400 transition-colors">
                  No Black-Box Philosophy
                </button>
              </li>
            </ul>
          </div>

          <div>
            <h5 className="font-semibold text-slate-200 text-xs uppercase tracking-wider mb-3">
              Data Pipeline
            </h5>
            <p className="text-[11px] text-slate-400 leading-relaxed">
              Real-time ingestion powered by official Binance Spot REST & WebSocket APIs with deterministic sub-minute aggregation and zero look-ahead bias.
            </p>
            <div className="mt-3 flex items-center space-x-2 text-[10px] text-cyan-400 font-mono">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>BINANCE SPOT PUBLIC STREAM</span>
            </div>
          </div>
        </div>

        <div className="pt-6 border-t border-slate-800/80 flex flex-col sm:flex-row items-center justify-between text-[11px] text-slate-500 space-y-2 sm:space-y-0">
          <p>&copy; {new Date().getFullYear()} Candle Probability Lab. Open Research & Quantitative Engineering.</p>
          <div className="flex items-center space-x-4">
            <button onClick={() => onNavigate('methodology')} className="hover:text-slate-400">Methodology</button>
            <button onClick={() => onNavigate('risk-disclosure')} className="hover:text-slate-400">Risk Disclosure</button>
            <button onClick={() => onNavigate('about')} className="hover:text-slate-400">About</button>
          </div>
        </div>
      </div>
    </footer>
  );
};
