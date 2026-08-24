import React from 'react';
import { ArrowDown, ArrowUp, CheckCircle2, Info, ShieldAlert } from 'lucide-react';
import { Prediction } from '../types/market';

interface PredictionDeckProps {
  prediction1: Prediction | null;
  prediction2: Prediction | null;
}

export const PredictionDeck: React.FC<PredictionDeckProps> = ({
  prediction1,
  prediction2,
}) => {
  return (
    <div className="space-y-4">
      {/* Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* PREDICTED +1 CANDLE CARD */}
        <div
          id="prediction-card-horizon-1"
          className="bg-gradient-to-b from-[#0F172A] to-[#0B0E14] border border-cyan-500/40 rounded-xl p-4 sm:p-5 shadow-xl relative overflow-hidden flex flex-col justify-between"
        >
          <div className="absolute top-0 right-0 transform translate-x-4 -translate-y-4 w-28 h-28 bg-cyan-500/10 rounded-full blur-2xl pointer-events-none" />

          <div>
            {/* Header */}
            <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-3">
              <div className="flex items-center space-x-2">
                <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-pulse" />
                <span className="font-mono font-bold text-slate-100 text-sm tracking-wide">
                  PREDICTED CANDLE +1
                </span>
              </div>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-cyan-950 text-cyan-300 border border-cyan-800/60 font-semibold">
                HORIZON 1
              </span>
            </div>

            {prediction1 ? (
              <div className="space-y-4">
                {/* Direction & Confidence */}
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-[11px] font-mono text-slate-400 block mb-1">
                      PROJECTED DIRECTION
                    </span>
                    <div
                      className={`inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-lg font-mono font-bold text-sm sm:text-base ${
                        prediction1.predictedDirection === 'UP'
                          ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                          : 'bg-rose-500/20 text-rose-400 border border-rose-500/40'
                      }`}
                    >
                      {prediction1.predictedDirection === 'UP' ? (
                        <ArrowUp className="w-5 h-5 stroke-[2.5]" />
                      ) : (
                        <ArrowDown className="w-5 h-5 stroke-[2.5]" />
                      )}
                      <span>UPWARD ({prediction1.predictedDirection})</span>
                    </div>
                  </div>

                  <div className="text-right">
                    <span className="text-[11px] font-mono text-slate-400 block mb-1">
                      CONFIDENCE SCORE
                    </span>
                    <div className="font-mono font-extrabold text-2xl text-cyan-300">
                      {prediction1.confidence}%
                    </div>
                  </div>
                </div>

                {/* Meter Bar */}
                <div className="space-y-1">
                  <div className="flex justify-between text-[10px] font-mono text-slate-400">
                    <span>50% (Equilibrium)</span>
                    <span>80% (Max Model Cap)</span>
                  </div>
                  <div className="w-full h-2.5 bg-slate-900 rounded-full overflow-hidden border border-slate-800">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${
                        prediction1.predictedDirection === 'UP'
                          ? 'bg-gradient-to-r from-emerald-500 to-cyan-400'
                          : 'bg-gradient-to-r from-rose-500 to-amber-400'
                      }`}
                      style={{ width: `${((prediction1.confidence - 50) / 30) * 100}%` }}
                    />
                  </div>
                </div>

                {/* Indicator Contributions */}
                <div>
                  <span className="text-[11px] font-mono text-slate-400 block mb-1.5">
                    KEY CONTRIBUTING INDICATORS
                  </span>
                  <div className="space-y-1.5">
                    {prediction1.topContributors.map((c, idx) => (
                      <div
                        key={idx}
                        className="p-2 rounded bg-slate-900/60 border border-slate-800/80 text-xs font-mono flex items-start space-x-2 text-slate-300"
                      >
                        <CheckCircle2
                          className={`w-3.5 h-3.5 mt-0.5 shrink-0 ${
                            c.bias === 'UP' ? 'text-emerald-400' : 'text-rose-400'
                          }`}
                        />
                        <span className="text-[11px] leading-tight text-slate-300">{c.description}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <div className="py-8 text-center text-slate-500 text-xs font-mono">
                Calculating deterministic indicators from live stream...
              </div>
            )}
          </div>

          <div className="mt-4 pt-3 border-t border-slate-800/60 flex items-center justify-between text-[10px] font-mono text-slate-400">
            <span>Model: {prediction1?.modelVersion || 'indicator-v1'}</span>
            <span>Zero Look-Ahead Bias Locked</span>
          </div>
        </div>

        {/* PREDICTED +2 CANDLE CARD */}
        <div
          id="prediction-card-horizon-2"
          className="bg-gradient-to-b from-[#0F172A] to-[#0B0E14] border border-slate-700/60 rounded-xl p-4 sm:p-5 shadow-xl relative overflow-hidden flex flex-col justify-between"
        >
          <div className="absolute top-0 right-0 transform translate-x-4 -translate-y-4 w-28 h-28 bg-blue-500/5 rounded-full blur-2xl pointer-events-none" />

          <div>
            {/* Header */}
            <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-3">
              <div className="flex items-center space-x-2">
                <span className="w-2.5 h-2.5 rounded-full bg-slate-400" />
                <span className="font-mono font-bold text-slate-300 text-sm tracking-wide">
                  PREDICTED CANDLE +2
                </span>
              </div>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700 font-semibold">
                HORIZON 2 (EXTENDED)
              </span>
            </div>

            {prediction2 ? (
              <div className="space-y-4">
                {/* Direction & Confidence */}
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-[11px] font-mono text-slate-400 block mb-1">
                      PROJECTED DIRECTION
                    </span>
                    <div
                      className={`inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-lg font-mono font-bold text-sm sm:text-base opacity-90 ${
                        prediction2.predictedDirection === 'UP'
                          ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30'
                          : 'bg-rose-500/15 text-rose-300 border border-rose-500/30'
                      }`}
                    >
                      {prediction2.predictedDirection === 'UP' ? (
                        <ArrowUp className="w-5 h-5 stroke-[2.5]" />
                      ) : (
                        <ArrowDown className="w-5 h-5 stroke-[2.5]" />
                      )}
                      <span>UPWARD ({prediction2.predictedDirection})</span>
                    </div>
                  </div>

                  <div className="text-right">
                    <span className="text-[11px] font-mono text-slate-400 block mb-1">
                      CONFIDENCE SCORE
                    </span>
                    <div className="font-mono font-extrabold text-2xl text-cyan-400/90">
                      {prediction2.confidence}%
                    </div>
                  </div>
                </div>

                {/* Meter Bar */}
                <div className="space-y-1">
                  <div className="flex justify-between text-[10px] font-mono text-slate-400">
                    <span>50% (Equilibrium)</span>
                    <span>75% (Horizon 2 Cap)</span>
                  </div>
                  <div className="w-full h-2.5 bg-slate-900 rounded-full overflow-hidden border border-slate-800">
                    <div
                      className={`h-full rounded-full transition-all duration-500 opacity-80 ${
                        prediction2.predictedDirection === 'UP'
                          ? 'bg-gradient-to-r from-emerald-500 to-cyan-400'
                          : 'bg-gradient-to-r from-rose-500 to-amber-400'
                      }`}
                      style={{ width: `${((prediction2.confidence - 50) / 25) * 100}%` }}
                    />
                  </div>
                </div>

                {/* Methodology note */}
                <div className="p-3 rounded-lg bg-slate-900/60 border border-slate-800 text-xs font-mono text-slate-300 space-y-2">
                  <p className="text-[11px] text-slate-300 leading-relaxed">
                    {prediction2.explanation}
                  </p>
                  <div className="flex items-center space-x-1.5 text-[10px] text-slate-400">
                    <Info className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                    <span>Incorporates 15% horizon decay factor for compound variance.</span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="py-8 text-center text-slate-500 text-xs font-mono">
                Awaiting sequence aggregation...
              </div>
            )}
          </div>

          <div className="mt-4 pt-3 border-t border-slate-800/60 flex items-center justify-between text-[10px] font-mono text-slate-400">
            <span>Model: {prediction2?.modelVersion || 'indicator-v1'}</span>
            <span>Deterministic Projection</span>
          </div>
        </div>
      </div>

      {/* Model Disclaimer Bar */}
      <div className="bg-slate-900/60 border border-slate-800 rounded-lg p-3 flex items-start space-x-3 text-xs text-slate-400">
        <ShieldAlert className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
        <p className="text-[11px] leading-relaxed">
          <strong className="text-slate-200">Indicator-Based Probability Model:</strong> Predicted candles +1 and +2 represent mathematical indicator agreement probabilities, not financial guarantees. Confidence percentages are deterministically bounded between 50% and 80%.
        </p>
      </div>
    </div>
  );
};
