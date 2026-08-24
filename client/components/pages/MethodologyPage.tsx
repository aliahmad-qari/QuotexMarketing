import React from 'react';
import {
  AlertTriangle,
  BookOpen,
  Database,
  Layers,
  Lock,
  Percent,
  Sliders,
} from 'lucide-react';

export const MethodologyPage: React.FC = () => {
  return (
    <div className="max-w-5xl mx-auto space-y-12 pb-16">
      {/* Page Header */}
      <div className="border-b border-slate-800 pb-6 space-y-2">
        <div className="flex items-center space-x-2 text-xs font-mono text-cyan-400 font-semibold uppercase tracking-wider">
          <BookOpen className="w-4 h-4" />
          <span>Transparent Mathematical Specification</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-black text-white tracking-tight">
          System Architecture & Methodology
        </h1>
        <p className="text-sm text-slate-300 max-w-3xl leading-relaxed">
          Candle Probability Lab rejects opaque black-box systems and fake prediction claims. Every algorithm, data stream, and probability formula is documented here.
        </p>
      </div>

      {/* 1. DATA INGESTION & PIPELINE */}
      <section className="space-y-4">
        <div className="flex items-center space-x-2 text-base font-bold text-white font-mono">
          <Database className="w-5 h-5 text-cyan-400" />
          <h2>1. Live Market Data Ingestion</h2>
        </div>
        <div className="bg-[#0E131F] border border-slate-800 rounded-xl p-6 space-y-4 text-xs sm:text-sm text-slate-300 leading-relaxed">
          <p>
            All market data originates from official, public <strong>Binance Spot API</strong> endpoints.
          </p>
          <ul className="space-y-2 list-disc list-inside text-slate-400 text-xs font-mono">
            <li>
              <strong>REST Endpoint:</strong> <code className="text-cyan-300">https://api.binance.com/api/v3/klines</code> used for historical bootstrap series.
            </li>
            <li>
              <strong>WebSocket Multiplex Stream:</strong> <code className="text-cyan-300">wss://stream.binance.com:9443/stream</code> used for live low-latency kline and tick updates.
            </li>
            <li>
              <strong>Integrity & Validation:</strong> Messages undergo schema validation, deduplication by timestamp, and automatic exponential backoff reconnection.
            </li>
          </ul>
        </div>
      </section>

      {/* 2. SUB-MINUTE & TIME-BUCKET AGGREGATION */}
      <section className="space-y-4">
        <div className="flex items-center space-x-2 text-base font-bold text-white font-mono">
          <Layers className="w-5 h-5 text-cyan-400" />
          <h2>2. Deterministic Candle Aggregator</h2>
        </div>
        <div className="bg-[#0E131F] border border-slate-800 rounded-xl p-6 space-y-4 text-xs sm:text-sm text-slate-300 leading-relaxed">
          <p>
            Binance does not provide sub-minute intervals directly. The <code className="text-cyan-300">CandleAggregatorService</code> consumes tick-level trades and builds mathematically consistent OHLCV buckets using exact UTC timestamps:
          </p>
          <div className="p-4 rounded-lg bg-slate-950 font-mono text-xs text-cyan-300 overflow-x-auto border border-slate-800">
            bucketOpenTime = Math.floor(timestamp / durationMs) * durationMs;<br />
            bucketCloseTime = bucketOpenTime + durationMs - 1;
          </div>
          <p className="text-xs text-slate-400">
            Supported intervals include: 5s, 10s, 15s, 30s, 1m (native), 2m (aggregated from 1m), 5m (native), 1h (native), 2h (native), and 3h (aggregated from 1h).
          </p>
        </div>
      </section>

      {/* 3. TECHNICAL INDICATORS & FEATURES */}
      <section className="space-y-4">
        <div className="flex items-center space-x-2 text-base font-bold text-white font-mono">
          <Sliders className="w-5 h-5 text-cyan-400" />
          <h2>3. Indicator Mathematical Features</h2>
        </div>
        <div className="bg-[#0E131F] border border-slate-800 rounded-xl p-6 space-y-4 text-xs sm:text-sm text-slate-300 leading-relaxed">
          <p>
            The feature extractor derives 12 discrete technical indicators from historical candles without look-ahead bias:
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-mono">
            <div className="p-3.5 rounded-lg bg-slate-950/70 border border-slate-800 space-y-1">
              <span className="text-cyan-300 font-bold">1. EMA 9 & EMA 21</span>
              <p className="text-slate-400 text-[11px]">Trend filter measuring directional alignment and slope divergence.</p>
            </div>
            <div className="p-3.5 rounded-lg bg-slate-950/70 border border-slate-800 space-y-1">
              <span className="text-cyan-300 font-bold">2. RSI (14)</span>
              <p className="text-slate-400 text-[11px]">Relative Strength Index with bullish expansion (&gt;50) and overbought/oversold boundaries.</p>
            </div>
            <div className="p-3.5 rounded-lg bg-slate-950/70 border border-slate-800 space-y-1">
              <span className="text-cyan-300 font-bold">3. MACD (12, 26, 9)</span>
              <p className="text-slate-400 text-[11px]">Moving average convergence divergence histogram for momentum impulse.</p>
            </div>
            <div className="p-3.5 rounded-lg bg-slate-950/70 border border-slate-800 space-y-1">
              <span className="text-cyan-300 font-bold">4. ATR (14) & Volatility</span>
              <p className="text-slate-400 text-[11px]">Average True Range normalized to price for dynamic variance boundaries.</p>
            </div>
            <div className="p-3.5 rounded-lg bg-slate-950/70 border border-slate-800 space-y-1">
              <span className="text-cyan-300 font-bold">5. Candle Body Pressure</span>
              <p className="text-slate-400 text-[11px]">Calculates buyer vs seller dominance: (Close - Open) / (High - Low).</p>
            </div>
            <div className="p-3.5 rounded-lg bg-slate-950/70 border border-slate-800 space-y-1">
              <span className="text-cyan-300 font-bold">6. Wick Rejection Ratios</span>
              <p className="text-slate-400 text-[11px]">Upper selling supply absorption vs lower buyer defense wicks.</p>
            </div>
          </div>
        </div>
      </section>

      {/* 4. DETERMINISTIC PROBABILITY & CONFIDENCE BOUNDS */}
      <section className="space-y-4">
        <div className="flex items-center space-x-2 text-base font-bold text-white font-mono">
          <Percent className="w-5 h-5 text-cyan-400" />
          <h2>4. Confidence Scoring & Horizon Capping</h2>
        </div>
        <div className="bg-[#0E131F] border border-slate-800 rounded-xl p-6 space-y-4 text-xs sm:text-sm text-slate-300 leading-relaxed">
          <p>
            Confidence is <strong>NOT random</strong> and is <strong>NOT arbitrary AI generation</strong>. It is a deterministic aggregation of weighted indicator agreement:
          </p>
          <div className="p-4 rounded-lg bg-slate-950 font-mono text-xs text-slate-200 border border-slate-800 space-y-2">
            <div>Agreement Ratio = DominantScore / TotalWeightedScore (Range: 0.5 to 1.0)</div>
            <div className="text-cyan-300">
              Confidence (+1) = Math.min(80, Math.max(50, 50 + (AgreementRatio - 0.5) * 60))
            </div>
            <div className="text-sky-400">
              Confidence (+2) = Math.min(75, Math.max(50, 50 + (AgreementRatio - 0.5) * 50))
            </div>
          </div>
          <p className="text-xs text-slate-400">
            Confidence is strictly capped at 80% for Horizon +1 and 75% for Horizon +2 because markets possess inherent stochastic noise and unexpected order flow.
          </p>
        </div>
      </section>

      {/* 5. PREDICTION LIFECYCLE & ZERO LOOK-AHEAD BIAS */}
      <section className="space-y-4">
        <div className="flex items-center space-x-2 text-base font-bold text-white font-mono">
          <Lock className="w-5 h-5 text-cyan-400" />
          <h2>5. Prediction Lifecycle & Audit Protocol</h2>
        </div>
        <div className="bg-[#0E131F] border border-slate-800 rounded-xl p-6 space-y-4 text-xs sm:text-sm text-slate-300 leading-relaxed">
          <div className="space-y-3">
            <div className="flex items-start space-x-3">
              <span className="w-6 h-6 rounded bg-cyan-500/20 text-cyan-300 font-mono font-bold flex items-center justify-center text-xs shrink-0 mt-0.5">
                1
              </span>
              <div>
                <strong className="text-white">Locking at Candle Open:</strong>
                <p className="text-xs text-slate-400 mt-0.5">
                  When a candle starts, predictions for target +1 and +2 horizons are computed using only data available up to that millisecond, locked, and stored with an immutable timestamp.
                </p>
              </div>
            </div>

            <div className="flex items-start space-x-3">
              <span className="w-6 h-6 rounded bg-cyan-500/20 text-cyan-300 font-mono font-bold flex items-center justify-center text-xs shrink-0 mt-0.5">
                2
              </span>
              <div>
                <strong className="text-white">Zero Post-Facto Editing:</strong>
                <p className="text-xs text-slate-400 mt-0.5">
                  Once locked, predictions can never be retroactively altered or recalculated.
                </p>
              </div>
            </div>

            <div className="flex items-start space-x-3">
              <span className="w-6 h-6 rounded bg-cyan-500/20 text-cyan-300 font-mono font-bold flex items-center justify-center text-xs shrink-0 mt-0.5">
                3
              </span>
              <div>
                <strong className="text-white">Target Candle Close Comparison:</strong>
                <p className="text-xs text-slate-400 mt-0.5">
                  When the target candle closes, the engine compares actual close vs open price. If the actual direction matches the predicted direction, it is marked CORRECT; otherwise INCORRECT (or NEUTRAL if close == open).
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 6. ETHICAL DISCLOSURE */}
      <section className="bg-slate-900/90 border border-amber-500/30 rounded-xl p-6 space-y-3">
        <div className="flex items-center space-x-2 text-amber-300 font-bold font-mono text-sm">
          <AlertTriangle className="w-5 h-5 text-amber-400" />
          <span>Limitations of Technical Indicator Models</span>
        </div>
        <p className="text-xs text-slate-300 leading-relaxed">
          Technical analysis indicators analyze past price action. In financial markets, sudden liquidity shifts, macroeconomic news, order flow imbalances, and black swan events can override indicator patterns instantly. This platform is strictly designed for quantitative research and educational analysis.
        </p>
      </section>
    </div>
  );
};
