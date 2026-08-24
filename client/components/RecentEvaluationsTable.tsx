import React from 'react';
import { ArrowDown, ArrowUp, CheckCircle, Clock, MinusCircle, ShieldCheck, XCircle } from 'lucide-react';
import { Prediction } from '../types/market';

interface RecentEvaluationsTableProps {
  evaluations: Prediction[];
}

export const RecentEvaluationsTable: React.FC<RecentEvaluationsTableProps> = ({ evaluations }) => {
  const evaluatedList = evaluations.filter((e) => e.result !== undefined);

  return (
    <div className="bg-[#0E131F] border border-slate-800/80 rounded-xl p-4 sm:p-5 space-y-4">
      <div className="flex items-center justify-between border-b border-slate-800 pb-3">
        <div className="flex items-center space-x-2">
          <ShieldCheck className="w-4 h-4 text-cyan-400" />
          <h3 className="font-mono font-bold text-slate-100 text-xs sm:text-sm uppercase tracking-wider">
            Live Evaluated Prediction Feed
          </h3>
        </div>
        <span className="text-[10px] font-mono text-slate-400">
          AUTOMATIC TARGET CANDLE CLOSE COMPARISON
        </span>
      </div>

      {evaluatedList.length === 0 ? (
        <div className="py-10 text-center space-y-2">
          <Clock className="w-8 h-8 text-slate-600 mx-auto" />
          <p className="font-mono text-xs text-slate-400">
            Awaiting live candle closures to evaluate pending predictions.
          </p>
          <p className="text-[11px] text-slate-400 max-w-md mx-auto">
            Predictions are locked at candle open and compared against actual close prices with zero look-ahead bias once the target candle seals.
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left font-mono text-xs">
            <thead>
              <tr className="border-b border-slate-800 text-slate-400 text-[11px]">
                <th className="pb-2 font-medium">TARGET TIME (UTC)</th>
                <th className="pb-2 font-medium">PAIR</th>
                <th className="pb-2 font-medium">TF</th>
                <th className="pb-2 font-medium">HORIZON</th>
                <th className="pb-2 font-medium">PREDICTED</th>
                <th className="pb-2 font-medium">CONFIDENCE</th>
                <th className="pb-2 font-medium">ACTUAL</th>
                <th className="pb-2 font-medium text-right">RESULT</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/50">
              {evaluatedList.map((p, idx) => {
                const isCorrect = p.result === 'CORRECT';
                const isNeutral = p.result === 'NEUTRAL';
                const formattedTime = new Date(p.targetCandleOpenTime).toISOString().slice(11, 19);

                return (
                  <tr key={idx} className="hover:bg-slate-900/40 transition-colors">
                    <td className="py-2.5 text-slate-300">{formattedTime}</td>
                    <td className="py-2.5 font-bold text-white">{p.symbol}</td>
                    <td className="py-2.5 text-cyan-400">{p.timeframe}</td>
                    <td className="py-2.5">
                      <span className="px-1.5 py-0.5 rounded text-[10px] bg-slate-800 text-slate-300">
                        +{p.horizon}
                      </span>
                    </td>
                    <td className="py-2.5">
                      <span
                        className={`inline-flex items-center space-x-1 px-2 py-0.5 rounded text-[11px] font-bold ${
                          p.predictedDirection === 'UP'
                            ? 'bg-emerald-500/20 text-emerald-400'
                            : 'bg-rose-500/20 text-rose-400'
                        }`}
                      >
                        {p.predictedDirection === 'UP' ? (
                          <ArrowUp className="w-3 h-3" />
                        ) : (
                          <ArrowDown className="w-3 h-3" />
                        )}
                        <span>{p.predictedDirection}</span>
                      </span>
                    </td>
                    <td className="py-2.5 font-semibold text-slate-200">{p.confidence}%</td>
                    <td className="py-2.5">
                      <span
                        className={`inline-flex items-center space-x-1 ${
                          p.actualDirection === 'UP'
                            ? 'text-emerald-400'
                            : p.actualDirection === 'DOWN'
                            ? 'text-rose-400'
                            : 'text-slate-400'
                        }`}
                      >
                        {p.actualDirection}
                      </span>
                    </td>
                    <td className="py-2.5 text-right">
                      <span
                        className={`inline-flex items-center space-x-1 px-2 py-0.5 rounded text-[11px] font-bold ${
                          isCorrect
                            ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                            : isNeutral
                            ? 'bg-slate-700/40 text-slate-300 border border-slate-600/30'
                            : 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                        }`}
                      >
                        {isCorrect ? (
                          <CheckCircle className="w-3 h-3" />
                        ) : isNeutral ? (
                          <MinusCircle className="w-3 h-3" />
                        ) : (
                          <XCircle className="w-3 h-3" />
                        )}
                        <span>{p.result}</span>
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};
