import React from 'react';
import { Award, CheckCircle, Code2, Globe, HeartHandshake, Shield, Sparkles, Terminal } from 'lucide-react';

export const AboutPage: React.FC = () => {
  return (
    <div className="max-w-4xl mx-auto space-y-12 pb-16">
      {/* Header */}
      <div className="border-b border-slate-800 pb-6 space-y-2">
        <div className="flex items-center space-x-2 text-xs font-mono text-cyan-400 font-semibold uppercase tracking-wider">
          <Shield className="w-4 h-4" />
          <span>Research Platform Mission</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-black text-white tracking-tight">
          About Candle Probability Lab
        </h1>
        <p className="text-sm text-slate-300 leading-relaxed">
          Pioneering radical transparency in market-data visualization and deterministic indicator-based modeling.
        </p>
      </div>

      {/* Mission Statement */}
      <div className="bg-[#0E131F] border border-slate-800 rounded-2xl p-6 sm:p-8 space-y-4">
        <h2 className="text-xl font-bold text-white font-mono">Our Core Mission</h2>
        <p className="text-sm text-slate-300 leading-relaxed">
          The retail trading space is saturated with deceptive "AI black-box" claims, fake 99% win-rate promises, and casino-like binary betting interfaces designed to mislead users.
        </p>
        <p className="text-sm text-slate-300 leading-relaxed">
          <strong>Candle Probability Lab</strong> was founded as a counter-movement: a quantitative laboratory built on absolute mathematical transparency, verifiable live market feeds from Binance Spot, and honest probability bounds.
        </p>
      </div>

      {/* Key Architectural Pillars */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-slate-950/70 border border-slate-800 p-5 rounded-xl space-y-3">
          <div className="w-9 h-9 rounded-lg bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
            <Code2 className="w-5 h-5" />
          </div>
          <h3 className="font-bold text-white text-base">Open, Deterministic Algorithms</h3>
          <p className="text-xs text-slate-400 leading-relaxed">
            Every predicted candle is calculated from documented indicator formulas (EMA, RSI, MACD, ATR, Wick Pressure). If the math doesn't agree, the model tells you.
          </p>
        </div>

        <div className="bg-slate-950/70 border border-slate-800 p-5 rounded-xl space-y-3">
          <div className="w-9 h-9 rounded-lg bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
            <CheckCircle className="w-5 h-5" />
          </div>
          <h3 className="font-bold text-white text-base">Zero Look-Ahead Bias</h3>
          <p className="text-xs text-slate-400 leading-relaxed">
            Predictions are sealed at the moment a live candle opens. Historical track records compare immutable timestamps against true market closures without hindsight bias.
          </p>
        </div>

        <div className="bg-slate-950/70 border border-slate-800 p-5 rounded-xl space-y-3">
          <div className="w-9 h-9 rounded-lg bg-blue-500/10 border border-blue-500/30 flex items-center justify-center text-blue-400">
            <Globe className="w-5 h-5" />
          </div>
          <h3 className="font-bold text-white text-base">Real Public Market Data</h3>
          <p className="text-xs text-slate-400 leading-relaxed">
            Directly connected to official Binance Spot REST & WebSocket streams. No fabricated price feeds or simulated OTC ticks.
          </p>
        </div>

        <div className="bg-slate-950/70 border border-slate-800 p-5 rounded-xl space-y-3">
          <div className="w-9 h-9 rounded-lg bg-rose-500/10 border border-rose-500/30 flex items-center justify-center text-rose-400">
            <Shield className="w-5 h-5" />
          </div>
          <h3 className="font-bold text-white text-base">Strict Ethical Stance</h3>
          <p className="text-xs text-slate-400 leading-relaxed">
            We do not partner with unregulated binary brokers, do not sell "signals", do not take deposits, and do not encourage reckless trading.
          </p>
        </div>
      </div>
    </div>
  );
};
