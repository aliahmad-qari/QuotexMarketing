'use client';

import Link from 'next/link';
import {
  Activity,
  AlertTriangle,
  ArrowRight,
  BarChart3,
  CheckCircle,
  Clock,
  Lock,
  Sparkles,
} from 'lucide-react';
import { TradingChart } from '../TradingChart';
import { useMarketStream } from '../../hooks/useMarketStream';

export function LandingPage() {
  const {
    symbol,
    timeframe,
    candles,
    prediction1,
    prediction2,
    secondsRemaining,
  } = useMarketStream('BTCUSDT', '1m');

  return (
    <div className="space-y-20 pb-16">
      {/* 1. HERO SECTION */}
      <section className="relative pt-8 sm:pt-14 pb-8 overflow-hidden">
        <div className="max-w-5xl mx-auto text-center space-y-6 px-4">
          {/* Badge */}
          <div className="inline-flex items-center space-x-2 px-3 py-1.5 rounded-full bg-slate-900/90 border border-cyan-500/30 text-cyan-300 text-xs font-mono shadow-sm">
            <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
            <span>REAL LIVE BINANCE CANDLES + PROBABILITY MODEL</span>
          </div>

          {/* Headline */}
          <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black text-white tracking-tight leading-[1.15]">
            Quantitative Probability Lab for <br className="hidden sm:inline" />
            <span className="bg-gradient-to-r from-cyan-400 via-sky-300 to-blue-500 bg-clip-text text-transparent">
              Live Market Candles
            </span>
          </h1>

          {/* Subtitle */}
          <p className="text-base sm:text-lg text-slate-300 max-w-3xl mx-auto leading-relaxed">
            Real live market candles followed by two clearly labelled, deterministic probability-based predicted candles. Built on mathematical indicator agreement with zero look-ahead bias.
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
            <Link
              id="hero-btn-dashboard"
              href="/dashboard"
              className="px-6 py-3 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-sm sm:text-base flex items-center space-x-2 shadow-lg shadow-cyan-500/25 transition-all transform hover:-translate-y-0.5"
            >
              <span>Launch Live Dashboard</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              id="hero-btn-methodology"
              href="/methodology"
              className="px-6 py-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-700 font-semibold text-sm sm:text-base transition-all"
            >
              <span>View Methodology</span>
            </Link>
          </div>

          {/* Key Platform Axioms */}
          <div className="pt-4 flex flex-wrap items-center justify-center gap-6 text-xs font-mono text-slate-400">
            <span className="flex items-center space-x-1.5">
              <CheckCircle className="w-4 h-4 text-emerald-400" />
              <span>Real Binance Spot Feed</span>
            </span>
            <span className="flex items-center space-x-1.5">
              <CheckCircle className="w-4 h-4 text-emerald-400" />
              <span>Deterministic Probability (50-80%)</span>
            </span>
            <span className="flex items-center space-x-1.5">
              <CheckCircle className="w-4 h-4 text-emerald-400" />
              <span>Not a Broker &bull; No Trade Execution</span>
            </span>
          </div>
        </div>
      </section>

      {/* 2. INTERACTIVE LIVE DASHBOARD PREVIEW */}
      <section className="max-w-7xl mx-auto px-4">
        <div className="space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <h2 className="text-lg sm:text-xl font-bold text-white font-mono flex items-center space-x-2">
                <Activity className="w-5 h-5 text-cyan-400" />
                <span>Live Interactive Stream: BTCUSDT (1m)</span>
              </h2>
              <p className="text-xs text-slate-400">
                Observing real-time sequence and projected +1 / +2 candles
              </p>
            </div>
            <Link
              href="/dashboard"
              className="text-xs text-cyan-400 hover:text-cyan-300 font-mono flex items-center space-x-1"
            >
              <span>Open Full Workstation</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {/* Interactive Chart Component */}
          <TradingChart
            candles={candles}
            prediction1={prediction1}
            prediction2={prediction2}
            timeframe={timeframe}
            symbol={symbol}
            secondsRemaining={secondsRemaining}
          />
        </div>
      </section>

      {/* 3. ACTUAL VS PREDICTED CANDLE ANATOMY */}
      <section className="max-w-7xl mx-auto px-4">
        <div className="bg-[#0E131F] border border-slate-800 rounded-2xl p-6 sm:p-10 space-y-8">
          <div className="max-w-3xl space-y-2">
            <div className="text-xs font-mono text-cyan-400 uppercase tracking-widest font-semibold">
              Transparent Framework
            </div>
            <h2 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
              Actual vs Predicted Candle Anatomy
            </h2>
            <p className="text-slate-300 text-sm leading-relaxed">
              We strictly delineate between verified historical market reality and experimental probability forecasts.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* 1. Five Actual Candles */}
            <div className="bg-slate-950/80 border border-slate-800 p-5 rounded-xl space-y-3">
              <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 font-bold text-sm">
                1
              </div>
              <h3 className="font-bold text-white text-base">Actual Market Candles</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Streamed directly from official Binance Spot endpoints. Confirmed Open, High, Low, Close, and Volume representing real historical transactions.
              </p>
              <div className="text-[11px] font-mono text-emerald-400 pt-2 border-t border-slate-800/80">
                &bull; Solid Candle Bodies &bull; Real Volume
              </div>
            </div>

            {/* 2. Predicted Candle +1 */}
            <div className="bg-slate-950/80 border border-cyan-500/40 p-5 rounded-xl space-y-3 relative">
              <div className="w-8 h-8 rounded-lg bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400 font-bold text-sm">
                2
              </div>
              <h3 className="font-bold text-cyan-300 text-base">Predicted Candle +1</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Immediately follows the active candle. Direction (UP/DOWN) and confidence (50% to 80%) deterministically calculated from EMA, RSI, MACD, and Wick pressure agreement.
              </p>
              <div className="text-[11px] font-mono text-cyan-400 pt-2 border-t border-slate-800/80">
                &bull; Dashed Outlines &bull; Capped 80% Max
              </div>
            </div>

            {/* 3. Predicted Candle +2 */}
            <div className="bg-slate-950/80 border border-slate-800 p-5 rounded-xl space-y-3">
              <div className="w-8 h-8 rounded-lg bg-blue-500/10 border border-blue-500/30 flex items-center justify-center text-blue-400 font-bold text-sm">
                3
              </div>
              <h3 className="font-bold text-slate-200 text-base">Predicted Candle +2</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Compound sequence projection incorporating trend persistence and standard horizon decay (capped at 75% confidence).
              </p>
              <div className="text-[11px] font-mono text-slate-400 pt-2 border-t border-slate-800/80">
                &bull; Horizon Decay &bull; Reduced Opacity
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 4. SUPPORTED ASSETS & TIMEFRAMES */}
      <section className="max-w-7xl mx-auto px-4">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
          <div className="space-y-5">
            <span className="text-xs font-mono text-cyan-400 uppercase tracking-widest font-semibold">
              Live Coverage
            </span>
            <h2 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
              Supported Spot Markets & High-Frequency Intervals
            </h2>
            <p className="text-sm text-slate-300 leading-relaxed">
              From sub-minute 5-second scalping frames to multi-hour macro intervals, our CandleAggregator produces valid OHLCV buckets in real time.
            </p>

            <div className="space-y-3">
              <div className="p-3.5 rounded-xl bg-[#0E131F] border border-slate-800 flex items-center space-x-3">
                <BarChart3 className="w-5 h-5 text-cyan-400 shrink-0" />
                <div>
                  <h4 className="text-xs font-bold text-white font-mono">7 Liquid Spot Assets</h4>
                  <p className="text-[11px] text-slate-400">
                    BTCUSDT, ETHUSDT, BNBUSDT, SOLUSDT, XRPUSDT, ADAUSDT, DOGEUSDT
                  </p>
                </div>
              </div>

              <div className="p-3.5 rounded-xl bg-[#0E131F] border border-slate-800 flex items-center space-x-3">
                <Clock className="w-5 h-5 text-cyan-400 shrink-0" />
                <div>
                  <h4 className="text-xs font-bold text-white font-mono">10 Timeframes</h4>
                  <p className="text-[11px] text-slate-400">
                    5s, 10s, 15s, 30s, 1m, 2m, 5m, 1h, 2h, 3h
                  </p>
                </div>
              </div>

              <div className="p-3.5 rounded-xl bg-[#0E131F] border border-slate-800 flex items-center space-x-3">
                <Lock className="w-5 h-5 text-cyan-400 shrink-0" />
                <div>
                  <h4 className="text-xs font-bold text-white font-mono">Immutable Prediction Locks</h4>
                  <p className="text-[11px] text-slate-400">
                    Predictions locked at candle open are stored and cannot be modified post-facto.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Visual Architecture Box */}
          <div className="bg-[#0B0E14] border border-slate-800 rounded-2xl p-6 space-y-4 font-mono text-xs shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <span className="text-slate-400">PIPELINE ARCHITECTURE</span>
              <span className="text-cyan-400">BINANCE &rarr; AGGREGATOR &rarr; ENGINE</span>
            </div>

            <div className="space-y-2">
              <div className="p-3 rounded bg-slate-900/80 border border-slate-800 flex items-center justify-between">
                <span className="text-slate-300">1. Binance Public Stream</span>
                <span className="text-emerald-400 text-[11px]">WSS / REST Ingestion</span>
              </div>
              <div className="p-3 rounded bg-slate-900/80 border border-slate-800 flex items-center justify-between">
                <span className="text-slate-300">2. CandleAggregatorService</span>
                <span className="text-cyan-400 text-[11px]">Sub-minute Bucketing</span>
              </div>
              <div className="p-3 rounded bg-slate-900/80 border border-slate-800 flex items-center justify-between">
                <span className="text-slate-300">3. IndicatorService (12 inputs)</span>
                <span className="text-cyan-400 text-[11px]">EMA, RSI, MACD, ATR</span>
              </div>
              <div className="p-3 rounded bg-slate-900/80 border border-cyan-500/40 flex items-center justify-between bg-cyan-950/20">
                <span className="text-cyan-300 font-bold">4. PredictionEngineService</span>
                <span className="text-cyan-300 text-[11px]">Deterministic Bounds</span>
              </div>
              <div className="p-3 rounded bg-slate-900/80 border border-slate-800 flex items-center justify-between">
                <span className="text-slate-300">5. PredictionEvaluationService</span>
                <span className="text-emerald-400 text-[11px]">Target Close Audit</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 5. CALL TO ACTION & RISK WARNING */}

      <section className="max-w-5xl mx-auto px-4 text-center space-y-6">
        <div className="bg-gradient-to-b from-slate-900 to-[#0B0E14] border border-cyan-500/30 rounded-2xl p-8 sm:p-12 space-y-6 shadow-2xl">
          <div className="w-12 h-12 rounded-xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center mx-auto text-cyan-400">
            <Sparkles className="w-6 h-6" />
          </div>

          <h2 className="text-2xl sm:text-4xl font-bold text-white tracking-tight">
            Ready to Analyze Real Market Probabilities?
          </h2>

          <p className="text-sm sm:text-base text-slate-300 max-w-2xl mx-auto leading-relaxed">
            Open the live research workstation to inspect real-time candle sequences, indicator agreement meters, and verifiable prediction evaluations.
          </p>

          <div>
            <Link
              href="/dashboard"
              className="px-8 py-3.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-base inline-flex items-center space-x-2 shadow-xl shadow-cyan-500/25 transition-all transform hover:-translate-y-0.5"
            >
              <span>Launch Live Dashboard Now</span>
              <ArrowRight className="w-5 h-5" />
            </Link>
          </div>

          <div className="pt-4 border-t border-slate-800 flex items-center justify-center space-x-2 text-xs text-amber-400 font-mono">
            <AlertTriangle className="w-4 h-4" />
            <span>Research & educational platform. Not investment advice.</span>
          </div>
        </div>
      </section>
    </div>
  );
}
