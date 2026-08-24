import React, { useEffect, useState } from 'react';
import {
  Activity,
  ArrowDown,
  ArrowUp,
  Award,
  BarChart2,
  CheckCircle2,
  Clock,
  Filter,
  Layers,
  MinusCircle,
  RefreshCw,
  Sparkles,
  TrendingUp,
  XCircle,
} from 'lucide-react';
import { fetchPerformance, fetchPredictions } from '../services/apiClient';
import { MarketSymbol, PerformanceStats, Prediction, Timeframe } from '../types/market';
import { PerformanceAnalyticsCharts } from '../components/PerformanceAnalyticsCharts';

export const PerformancePage: React.FC = () => {
  const [stats, setStats] = useState<PerformanceStats | null>(null);
  const [predictions, setPredictions] = useState<Prediction[]>([]);
  const [selectedSymbol, setSelectedSymbol] = useState<string>('ALL');
  const [selectedTimeframe, setSelectedTimeframe] = useState<string>('ALL');
  const [selectedHorizon, setSelectedHorizon] = useState<string>('ALL');
  const [selectedResult, setSelectedResult] = useState<string>('ALL');
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const sym = selectedSymbol !== 'ALL' ? (selectedSymbol as MarketSymbol) : undefined;
      const tf = selectedTimeframe !== 'ALL' ? (selectedTimeframe as Timeframe) : undefined;
      const hor = selectedHorizon !== 'ALL' ? parseInt(selectedHorizon, 10) : undefined;
      const res = selectedResult !== 'ALL' ? selectedResult : undefined;

      const [perfData, predList] = await Promise.all([
        fetchPerformance(sym),
        fetchPredictions({ symbol: sym, timeframe: tf, horizon: hor, result: res, limit: 100 }),
      ]);

      setStats(perfData);
      setPredictions(predList);
    } catch (e) {
      console.error('Error loading performance data:', e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [selectedSymbol, selectedTimeframe, selectedHorizon, selectedResult]);

  return (
    <div className="space-y-8 pb-16">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-800 pb-6">
        <div>
          <div className="flex items-center space-x-2 text-xs font-mono text-cyan-400 font-semibold uppercase tracking-wider mb-1">
            <Award className="w-4 h-4" />
            <span>Audited Metric Engine</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
            Performance & Track Record
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Verifiable prediction evaluation based on immutable target candle close comparison.
          </p>
        </div>

        <button
          onClick={loadData}
          disabled={isLoading}
          className="px-3.5 py-2 rounded-lg bg-slate-900 hover:bg-slate-850 border border-slate-800 text-slate-300 hover:text-white text-xs font-mono flex items-center space-x-2 transition-all"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
          <span>Refresh Metrics</span>
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* 1. Overall Accuracy */}
        <div className="bg-[#0E131F] border border-cyan-500/30 rounded-xl p-4 sm:p-5 space-y-2">
          <span className="text-[11px] font-mono text-slate-400 uppercase block">Overall Accuracy</span>
          <div className="text-2xl sm:text-3xl font-black font-mono text-cyan-300">
            {stats && stats.totalEvaluated > 0 ? `${stats.overallAccuracy}%` : '---'}
          </div>
          <span className="text-[10px] font-mono text-slate-400 block">
            {stats?.correctCount || 0} Correct / {stats?.totalEvaluated || 0} Total
          </span>
        </div>

        {/* 2. Horizon +1 Accuracy */}
        <div className="bg-[#0E131F] border border-slate-800 rounded-xl p-4 sm:p-5 space-y-2">
          <span className="text-[11px] font-mono text-slate-400 uppercase block">Horizon +1 Accuracy</span>
          <div className="text-2xl sm:text-3xl font-black font-mono text-emerald-400">
            {stats && stats.horizon1Count > 0 ? `${stats.horizon1Accuracy}%` : '---'}
          </div>
          <span className="text-[10px] font-mono text-slate-400 block">
            {stats?.horizon1Count || 0} Evaluated Candles
          </span>
        </div>

        {/* 3. Horizon +2 Accuracy */}
        <div className="bg-[#0E131F] border border-slate-800 rounded-xl p-4 sm:p-5 space-y-2">
          <span className="text-[11px] font-mono text-slate-400 uppercase block">Horizon +2 Accuracy</span>
          <div className="text-2xl sm:text-3xl font-black font-mono text-sky-400">
            {stats && stats.horizon2Count > 0 ? `${stats.horizon2Accuracy}%` : '---'}
          </div>
          <span className="text-[10px] font-mono text-slate-400 block">
            {stats?.horizon2Count || 0} Evaluated Candles
          </span>
        </div>

        {/* 4. Total Evaluated */}
        <div className="bg-[#0E131F] border border-slate-800 rounded-xl p-4 sm:p-5 space-y-2">
          <span className="text-[11px] font-mono text-slate-400 uppercase block">Total Evaluations</span>
          <div className="text-2xl sm:text-3xl font-black font-mono text-white">
            {stats?.totalEvaluated || 0}
          </div>
          <span className="text-[10px] font-mono text-slate-400 block">
            {stats?.incorrectCount || 0} Inc / {stats?.neutralCount || 0} Neutral
          </span>
        </div>
      </div>

      {/* Visual Performance Charts (Recharts Analytics) */}
      <PerformanceAnalyticsCharts stats={stats} predictions={predictions} />

      {/* Breakdown Grids */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Breakdown by Confidence Band */}
        <div className="bg-[#0E131F] border border-slate-800 rounded-xl p-5 space-y-4">
          <h3 className="text-xs font-mono font-bold text-slate-200 uppercase tracking-wider">
            Accuracy by Confidence Band
          </h3>
          <div className="space-y-3 font-mono text-xs">
            {['70-80%', '60-69%', '50-59%'].map((band) => {
              const b = stats?.byConfidenceBand[band as keyof typeof stats.byConfidenceBand];
              const acc = b && b.total > 0 ? b.accuracy : 0;
              return (
                <div key={band} className="space-y-1">
                  <div className="flex justify-between text-slate-300">
                    <span>{band}</span>
                    <span className="font-bold text-cyan-300">{acc}% ({b?.total || 0} total)</span>
                  </div>
                  <div className="w-full h-2 bg-slate-900 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-cyan-400 rounded-full"
                      style={{ width: `${acc}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Breakdown by Asset */}
        <div className="bg-[#0E131F] border border-slate-800 rounded-xl p-5 space-y-4">
          <h3 className="text-xs font-mono font-bold text-slate-200 uppercase tracking-wider">
            Accuracy by Asset
          </h3>
          <div className="space-y-2 font-mono text-xs max-h-48 overflow-y-auto pr-1">
            {stats && Object.keys(stats.byAsset).length > 0 ? (
              Object.entries(stats.byAsset).map(([sym, data]) => {
                const item = data as { accuracy: number; total: number };
                return (
                  <div key={sym} className="flex items-center justify-between p-2 rounded bg-slate-950/60 border border-slate-850">
                    <span className="text-slate-200 font-bold">{sym}</span>
                    <span className="text-emerald-400 font-semibold">{item.accuracy.toFixed(1)}%</span>
                    <span className="text-slate-500 text-[11px]">({item.total})</span>
                  </div>
                );
              })
            ) : (
              <p className="text-slate-500 text-xs py-4 text-center">No evaluations yet.</p>
            )}
          </div>
        </div>

        {/* Breakdown by Timeframe */}
        <div className="bg-[#0E131F] border border-slate-800 rounded-xl p-5 space-y-4">
          <h3 className="text-xs font-mono font-bold text-slate-200 uppercase tracking-wider">
            Accuracy by Timeframe
          </h3>
          <div className="space-y-2 font-mono text-xs max-h-48 overflow-y-auto pr-1">
            {stats && Object.keys(stats.byTimeframe).length > 0 ? (
              Object.entries(stats.byTimeframe).map(([tf, data]) => {
                const item = data as { accuracy: number; total: number };
                return (
                  <div key={tf} className="flex items-center justify-between p-2 rounded bg-slate-950/60 border border-slate-850">
                    <span className="text-cyan-400 font-bold">{tf}</span>
                    <span className="text-emerald-400 font-semibold">{item.accuracy.toFixed(1)}%</span>
                    <span className="text-slate-500 text-[11px]">({item.total})</span>
                  </div>
                );
              })
            ) : (
              <p className="text-slate-500 text-xs py-4 text-center">No evaluations yet.</p>
            )}
          </div>
        </div>
      </div>

      {/* Historical Evaluations Table with Filters */}
      <div className="bg-[#0E131F] border border-slate-800 rounded-xl p-5 space-y-5">
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-800 pb-4">
          <div className="flex items-center space-x-2">
            <Filter className="w-4 h-4 text-cyan-400" />
            <h3 className="text-sm font-mono font-bold text-slate-100 uppercase tracking-wider">
              Evaluated Prediction History Logs
            </h3>
          </div>

          {/* Filters Bar */}
          <div className="flex flex-wrap items-center gap-2 font-mono text-xs">
            {/* Symbol Filter */}
            <select
              value={selectedSymbol}
              onChange={(e) => setSelectedSymbol(e.target.value)}
              className="bg-slate-900 border border-slate-800 text-slate-300 rounded px-2.5 py-1"
            >
              <option value="ALL">All Assets</option>
              <option value="BTCUSDT">BTCUSDT</option>
              <option value="ETHUSDT">ETHUSDT</option>
              <option value="BNBUSDT">BNBUSDT</option>
              <option value="SOLUSDT">SOLUSDT</option>
              <option value="XRPUSDT">XRPUSDT</option>
              <option value="ADAUSDT">ADAUSDT</option>
              <option value="DOGEUSDT">DOGEUSDT</option>
            </select>

            {/* Timeframe Filter */}
            <select
              value={selectedTimeframe}
              onChange={(e) => setSelectedTimeframe(e.target.value)}
              className="bg-slate-900 border border-slate-800 text-slate-300 rounded px-2.5 py-1"
            >
              <option value="ALL">All Timeframes</option>
              <option value="5s">5s</option>
              <option value="10s">10s</option>
              <option value="15s">15s</option>
              <option value="30s">30s</option>
              <option value="1m">1m</option>
              <option value="2m">2m</option>
              <option value="5m">5m</option>
              <option value="1h">1h</option>
              <option value="2h">2h</option>
              <option value="3h">3h</option>
            </select>

            {/* Horizon Filter */}
            <select
              value={selectedHorizon}
              onChange={(e) => setSelectedHorizon(e.target.value)}
              className="bg-slate-900 border border-slate-800 text-slate-300 rounded px-2.5 py-1"
            >
              <option value="ALL">All Horizons</option>
              <option value="1">Horizon +1</option>
              <option value="2">Horizon +2</option>
            </select>

            {/* Result Filter */}
            <select
              value={selectedResult}
              onChange={(e) => setSelectedResult(e.target.value)}
              className="bg-slate-900 border border-slate-800 text-slate-300 rounded px-2.5 py-1"
            >
              <option value="ALL">All Results</option>
              <option value="CORRECT">CORRECT</option>
              <option value="INCORRECT">INCORRECT</option>
              <option value="NEUTRAL">NEUTRAL</option>
            </select>
          </div>
        </div>

        {/* Predictions List */}
        {predictions.length === 0 ? (
          <div className="py-16 text-center space-y-3">
            <Clock className="w-10 h-10 text-slate-600 mx-auto" />
            <h4 className="font-mono text-sm font-bold text-slate-300">
              No Evaluation Records Matching Filters
            </h4>
            <p className="text-xs text-slate-400 max-w-md mx-auto">
              Predictions are automatically generated when live candles begin and audited as soon as target candles seal.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left font-mono text-xs">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400 text-[11px]">
                  <th className="pb-2 font-medium">ISSUED TIME</th>
                  <th className="pb-2 font-medium">TARGET OPEN TIME</th>
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
                {predictions.map((p, idx) => {
                  const isCorrect = p.result === 'CORRECT';
                  const isNeutral = p.result === 'NEUTRAL';
                  const issuedTime = new Date(p.issuedAt).toISOString().slice(11, 19);
                  const targetTime = new Date(p.targetCandleOpenTime).toISOString().slice(11, 19);

                  return (
                    <tr key={idx} className="hover:bg-slate-900/40 transition-colors">
                      <td className="py-2.5 text-slate-400">{issuedTime}</td>
                      <td className="py-2.5 text-slate-300">{targetTime}</td>
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
                          className={
                            p.actualDirection === 'UP'
                              ? 'text-emerald-400'
                              : p.actualDirection === 'DOWN'
                              ? 'text-rose-400'
                              : 'text-slate-400'
                          }
                        >
                          {p.actualDirection || 'PENDING'}
                        </span>
                      </td>
                      <td className="py-2.5 text-right">
                        {p.result ? (
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
                              <CheckCircle2 className="w-3 h-3" />
                            ) : isNeutral ? (
                              <MinusCircle className="w-3 h-3" />
                            ) : (
                              <XCircle className="w-3 h-3" />
                            )}
                            <span>{p.result}</span>
                          </span>
                        ) : (
                          <span className="text-[11px] text-amber-400 font-mono">LOCKED / OPEN</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
