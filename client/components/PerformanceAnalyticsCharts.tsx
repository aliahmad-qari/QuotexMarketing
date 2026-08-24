'use client';

import { useMemo, useState } from 'react';
import {
  Area,
  AreaChart,
  Bar,
  CartesianGrid,
  ComposedChart,
  Legend,
  Line,
  LineChart,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import {
  Activity,
  BarChart3,
  TrendingUp,
} from 'lucide-react';
import { PerformanceStats, Prediction } from '../types/market';

interface Props {
  stats: PerformanceStats | null;
  predictions: Prediction[];
}

type TrendViewMode = 'cumulative' | 'horizon' | 'rolling';

export const PerformanceAnalyticsCharts: React.FC<Props> = ({ stats, predictions }) => {
  const [trendView, setTrendView] = useState<TrendViewMode>('cumulative');
  const [distributionMode, setDistributionMode] = useState<'granular' | 'band'>('granular');

  const evaluatedPredictions = useMemo(() => {
    return predictions
      .filter((p) => p.result && (p.result === 'CORRECT' || p.result === 'INCORRECT' || p.result === 'NEUTRAL'))
      .sort((a, b) => (a.evaluatedAt || a.targetCandleOpenTime) - (b.evaluatedAt || b.targetCandleOpenTime));
  }, [predictions]);

  const trendData = useMemo(() => {
    if (evaluatedPredictions.length === 0) return [];

    let cumTotal = 0;
    let cumCorrect = 0;
    let h1Total = 0;
    let h1Correct = 0;
    let h2Total = 0;
    let h2Correct = 0;
    const windowSize = 10;
    const windowResults: boolean[] = [];

    return evaluatedPredictions.map((p, idx) => {
      const isCorrect = p.result === 'CORRECT';
      cumTotal += 1;
      if (isCorrect) cumCorrect += 1;
      if (p.horizon === 1) { h1Total += 1; if (isCorrect) h1Correct += 1; }
      else if (p.horizon === 2) { h2Total += 1; if (isCorrect) h2Correct += 1; }
      windowResults.push(isCorrect);
      if (windowResults.length > windowSize) windowResults.shift();
      const rollingAcc = (windowResults.filter(Boolean).length / windowResults.length) * 100;
      const dateObj = new Date(p.evaluatedAt || p.targetCandleOpenTime || p.issuedAt);
      const timeStr = dateObj.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
      return {
        index: idx + 1,
        time: timeStr,
        symbol: p.symbol,
        timeframe: p.timeframe,
        horizon: `+${p.horizon}`,
        confidence: p.confidence,
        result: p.result,
        accuracy: Number(((cumCorrect / cumTotal) * 100).toFixed(1)),
        h1Accuracy: h1Total > 0 ? Number(((h1Correct / h1Total) * 100).toFixed(1)) : null,
        h2Accuracy: h2Total > 0 ? Number(((h2Correct / h2Total) * 100).toFixed(1)) : null,
        rollingAccuracy: Number(rollingAcc.toFixed(1)),
        total: cumTotal,
        correct: cumCorrect,
      };
    });
  }, [evaluatedPredictions]);

  const distributionData = useMemo(() => {
    if (distributionMode === 'band') {
      const bands = [
        { range: '50-59%', min: 50, max: 59, expected: 54.5 },
        { range: '60-69%', min: 60, max: 69, expected: 64.5 },
        { range: '70-80%', min: 70, max: 80, expected: 75.0 },
      ];
      return bands.map((b) => {
        const matching = evaluatedPredictions.filter((p) => p.confidence >= b.min && p.confidence <= b.max);
        let correct = 0, incorrect = 0, neutral = 0;
        if (matching.length > 0) {
          matching.forEach((p) => {
            if (p.result === 'CORRECT') correct++;
            else if (p.result === 'INCORRECT') incorrect++;
            else neutral++;
          });
        } else if (stats?.byConfidenceBand) {
          const statBand = stats.byConfidenceBand[b.range as keyof typeof stats.byConfidenceBand];
          if (statBand) { correct = statBand.correct; incorrect = Math.max(0, statBand.total - statBand.correct); }
        }
        const total = correct + incorrect + neutral;
        const accuracy = total > 0 ? Number(((correct / total) * 100).toFixed(1)) : 0;
        return { interval: b.range, correct, incorrect, neutral, total, accuracy, expectedAccuracy: b.expected, calibrationDiff: total > 0 ? Number((accuracy - b.expected).toFixed(1)) : 0 };
      });
    }

    const bins = [
      { interval: '50-54%', min: 50, max: 54.9, expected: 52 },
      { interval: '55-59%', min: 55, max: 59.9, expected: 57 },
      { interval: '60-64%', min: 60, max: 64.9, expected: 62 },
      { interval: '65-69%', min: 65, max: 69.9, expected: 67 },
      { interval: '70-74%', min: 70, max: 74.9, expected: 72 },
      { interval: '75-80%', min: 75, max: 80.0, expected: 77 },
    ];
    return bins.map((bin) => {
      const matching = evaluatedPredictions.filter((p) => p.confidence >= bin.min && p.confidence <= bin.max);
      let correct = 0, incorrect = 0, neutral = 0;
      matching.forEach((p) => {
        if (p.result === 'CORRECT') correct++;
        else if (p.result === 'INCORRECT') incorrect++;
        else neutral++;
      });
      const total = correct + incorrect + neutral;
      const accuracy = total > 0 ? Number(((correct / total) * 100).toFixed(1)) : 0;
      return { interval: bin.interval, correct, incorrect, neutral, total, accuracy, expectedAccuracy: bin.expected, calibrationDiff: total > 0 ? Number((accuracy - bin.expected).toFixed(1)) : 0 };
    });
  }, [evaluatedPredictions, distributionMode, stats]);

  const EmptyChart = () => (
    <div className="h-full flex flex-col items-center justify-center space-y-2 text-slate-500">
      <Activity className="w-8 h-8 opacity-40" />
      <p className="text-xs font-mono">No evaluated predictions yet.</p>
      <p className="text-[11px] text-slate-600 max-w-xs text-center">
        Charts will populate automatically as live candles close and predictions are audited.
      </p>
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Chart 1: Accuracy Trends Over Time */}
      <div className="bg-[#0E131F] border border-slate-800 rounded-xl p-5 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-800 pb-4">
          <div className="flex items-center space-x-2.5">
            <div className="p-2 rounded-lg bg-cyan-950/60 border border-cyan-500/30 text-cyan-400">
              <TrendingUp className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-mono font-bold text-white uppercase tracking-wider flex items-center gap-2">
                <span>Accuracy Trend Over Time</span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 font-normal">
                  {evaluatedPredictions.length} Evaluations
                </span>
              </h3>
              <p className="text-xs text-slate-400">
                Chronological win-rate trajectory vs 50% random-walk baseline threshold.
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-1 bg-slate-900 border border-slate-800 rounded-lg p-1 font-mono text-xs">
            {(['cumulative', 'horizon', 'rolling'] as TrendViewMode[]).map((mode) => (
              <button
                key={mode}
                onClick={() => setTrendView(mode)}
                className={`px-3 py-1 rounded transition-all ${
                  trendView === mode
                    ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 font-bold'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {mode === 'cumulative' ? 'Cumulative Overall' : mode === 'horizon' ? 'H+1 vs H+2 Split' : 'Rolling (10-Sample)'}
              </button>
            ))}
          </div>
        </div>

        <div className="h-72 w-full pt-2">
          {trendData.length === 0 ? (
            <EmptyChart />
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              {trendView === 'cumulative' ? (
                <AreaChart data={trendData} margin={{ top: 10, right: 20, left: -10, bottom: 0 }}>
                  <defs>
                    <linearGradient id="accuracyGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#06B6D4" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="#06B6D4" stopOpacity={0.0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1E293B" vertical={false} />
                  <XAxis dataKey="time" stroke="#64748B" fontSize={11} tickLine={false} fontFamily="monospace" />
                  <YAxis domain={[30, 100]} ticks={[40, 50, 60, 70, 80, 90, 100]} stroke="#64748B" fontSize={11} tickLine={false} fontFamily="monospace" unit="%" />
                  <Tooltip
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        const d = payload[0].payload;
                        return (
                          <div className="bg-[#090D16] border border-cyan-500/40 rounded-lg p-3 shadow-xl text-xs font-mono space-y-1 z-50">
                            <div className="text-slate-400 font-semibold border-b border-slate-800 pb-1">Sample #{d.index} • {d.time}</div>
                            {d.symbol && <div className="text-slate-300">Asset: <span className="font-bold text-white">{d.symbol}</span> ({d.timeframe}, {d.horizon})</div>}
                            <div className="text-cyan-300 font-bold text-sm">Cumulative Accuracy: {d.accuracy}%</div>
                            <div className="text-slate-400 text-[11px]">{d.correct} Correct of {d.total} Evaluated</div>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <ReferenceLine y={50} stroke="#EAB308" strokeDasharray="4 4" label={{ value: '50% Baseline (Random Guess)', position: 'insideBottomRight', fill: '#EAB308', fontSize: 10, fontFamily: 'monospace' }} />
                  <Area type="monotone" dataKey="accuracy" name="Cumulative Win Rate" stroke="#06B6D4" strokeWidth={2.5} fillOpacity={1} fill="url(#accuracyGrad)" dot={{ r: 3, fill: '#06B6D4', strokeWidth: 1, stroke: '#0891B2' }} activeDot={{ r: 6, fill: '#22D3EE', stroke: '#0E131F', strokeWidth: 2 }} />
                </AreaChart>
              ) : trendView === 'horizon' ? (
                <LineChart data={trendData} margin={{ top: 10, right: 20, left: -10, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1E293B" vertical={false} />
                  <XAxis dataKey="time" stroke="#64748B" fontSize={11} tickLine={false} fontFamily="monospace" />
                  <YAxis domain={[30, 100]} stroke="#64748B" fontSize={11} tickLine={false} fontFamily="monospace" unit="%" />
                  <Tooltip
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        const d = payload[0].payload;
                        return (
                          <div className="bg-[#090D16] border border-slate-700 rounded-lg p-3 shadow-xl text-xs font-mono space-y-1.5 z-50">
                            <div className="text-slate-400 border-b border-slate-800 pb-1">Sample #{d.index} • {d.time}</div>
                            <div className="text-emerald-400 font-semibold">Horizon +1: {d.h1Accuracy !== null ? `${d.h1Accuracy}%` : 'N/A'}</div>
                            <div className="text-sky-400 font-semibold">Horizon +2: {d.h2Accuracy !== null ? `${d.h2Accuracy}%` : 'N/A'}</div>
                            <div className="text-cyan-300 text-[11px]">Overall: {d.accuracy}% ({d.correct}/{d.total})</div>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <ReferenceLine y={50} stroke="#EAB308" strokeDasharray="4 4" />
                  <Legend wrapperStyle={{ fontSize: '11px', fontFamily: 'monospace', paddingTop: '8px' }} iconType="circle" />
                  <Line type="monotone" dataKey="h1Accuracy" name="Horizon +1 Win Rate" stroke="#10B981" strokeWidth={2.5} dot={{ r: 3, fill: '#10B981' }} connectNulls />
                  <Line type="monotone" dataKey="h2Accuracy" name="Horizon +2 Win Rate" stroke="#38BDF8" strokeWidth={2} strokeDasharray="4 2" dot={{ r: 3, fill: '#38BDF8' }} connectNulls />
                </LineChart>
              ) : (
                <LineChart data={trendData} margin={{ top: 10, right: 20, left: -10, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1E293B" vertical={false} />
                  <XAxis dataKey="time" stroke="#64748B" fontSize={11} tickLine={false} fontFamily="monospace" />
                  <YAxis domain={[0, 100]} stroke="#64748B" fontSize={11} tickLine={false} fontFamily="monospace" unit="%" />
                  <Tooltip
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        const d = payload[0].payload;
                        return (
                          <div className="bg-[#090D16] border border-purple-500/40 rounded-lg p-3 shadow-xl text-xs font-mono space-y-1 z-50">
                            <div className="text-slate-400 border-b border-slate-800 pb-1">Sample #{d.index} • {d.time}</div>
                            <div className="text-purple-300 font-bold text-sm">10-Sample Rolling: {d.rollingAccuracy}%</div>
                            <div className="text-slate-400 text-[11px]">Cumulative: {d.accuracy}%</div>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <ReferenceLine y={50} stroke="#EAB308" strokeDasharray="4 4" />
                  <Line type="monotone" dataKey="rollingAccuracy" name="10-Sample Rolling Win Rate" stroke="#A855F7" strokeWidth={2.5} dot={{ r: 3, fill: '#A855F7' }} />
                  <Line type="monotone" dataKey="accuracy" name="Cumulative Baseline" stroke="#475569" strokeWidth={1.5} strokeDasharray="3 3" dot={false} />
                </LineChart>
              )}
            </ResponsiveContainer>
          )}
        </div>

        <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-800/60 text-[11px] font-mono text-slate-400">
          <div className="flex items-center space-x-3">
            <span className="inline-flex items-center space-x-1">
              <span className="w-2 h-2 rounded-full bg-cyan-400"></span>
              <span>Current Accuracy: <strong className="text-cyan-300">{stats ? `${stats.overallAccuracy}%` : '---'}</strong></span>
            </span>
            <span className="inline-flex items-center space-x-1">
              <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
              <span>Alpha over Random: <strong className="text-emerald-300">{stats ? `+${(stats.overallAccuracy - 50).toFixed(1)}%` : '---'}</strong></span>
            </span>
          </div>
          <span className="text-slate-500">Zero look-ahead evaluation protocol</span>
        </div>
      </div>

      {/* Chart 2: Distribution & Calibration by Confidence Interval */}
      <div className="bg-[#0E131F] border border-slate-800 rounded-xl p-5 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-800 pb-4">
          <div className="flex items-center space-x-2.5">
            <div className="p-2 rounded-lg bg-emerald-950/60 border border-emerald-500/30 text-emerald-400">
              <BarChart3 className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-mono font-bold text-white uppercase tracking-wider">
                Prediction Distribution & Calibration by Confidence
              </h3>
              <p className="text-xs text-slate-400">
                Count of Correct vs Incorrect predictions per confidence bin with empirical accuracy curve.
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-1 bg-slate-900 border border-slate-800 rounded-lg p-1 font-mono text-xs">
            <button
              onClick={() => setDistributionMode('granular')}
              className={`px-3 py-1 rounded transition-all ${distributionMode === 'granular' ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 font-bold' : 'text-slate-400 hover:text-slate-200'}`}
            >
              5% Intervals
            </button>
            <button
              onClick={() => setDistributionMode('band')}
              className={`px-3 py-1 rounded transition-all ${distributionMode === 'band' ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 font-bold' : 'text-slate-400 hover:text-slate-200'}`}
            >
              Tiered Bands (3)
            </button>
          </div>
        </div>

        <div className="h-72 w-full pt-2">
          {evaluatedPredictions.length === 0 ? (
            <EmptyChart />
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={distributionData} margin={{ top: 10, right: 30, left: -10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1E293B" vertical={false} />
                <XAxis dataKey="interval" stroke="#64748B" fontSize={11} tickLine={false} fontFamily="monospace" />
                <YAxis yAxisId="left" stroke="#64748B" fontSize={11} tickLine={false} fontFamily="monospace" label={{ value: 'Evaluations', angle: -90, position: 'insideLeft', fill: '#64748B', fontSize: 10, fontFamily: 'monospace' }} />
                <YAxis yAxisId="right" orientation="right" domain={[0, 100]} ticks={[0, 25, 50, 75, 100]} stroke="#06B6D4" fontSize={11} tickLine={false} fontFamily="monospace" unit="%" />
                <Tooltip
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const d = payload[0].payload;
                      return (
                        <div className="bg-[#090D16] border border-slate-700 rounded-lg p-3 shadow-xl text-xs font-mono space-y-1.5 z-50">
                          <div className="text-slate-300 font-bold border-b border-slate-800 pb-1">Confidence Interval: {d.interval}</div>
                          <div className="flex items-center justify-between space-x-4 text-emerald-400"><span>Correct:</span><span className="font-bold">{d.correct}</span></div>
                          <div className="flex items-center justify-between space-x-4 text-rose-400"><span>Incorrect:</span><span className="font-bold">{d.incorrect}</span></div>
                          {d.neutral > 0 && <div className="flex items-center justify-between space-x-4 text-slate-400"><span>Neutral / Flat:</span><span className="font-bold">{d.neutral}</span></div>}
                          <div className="border-t border-slate-800 pt-1 text-cyan-300 font-bold flex items-center justify-between"><span>Empirical Win Rate:</span><span>{d.accuracy}%</span></div>
                          <div className="text-slate-400 text-[10px] flex items-center justify-between"><span>Expected Midpoint:</span><span>{d.expectedAccuracy}%</span></div>
                          <div className={`text-[10px] font-semibold ${d.calibrationDiff >= 0 ? 'text-emerald-400' : 'text-amber-400'}`}>Calibration Delta: {d.calibrationDiff > 0 ? `+${d.calibrationDiff}%` : `${d.calibrationDiff}%`}</div>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Legend wrapperStyle={{ fontSize: '11px', fontFamily: 'monospace', paddingTop: '8px' }} iconType="circle" />
                <Bar yAxisId="left" dataKey="correct" name="Correct" stackId="a" fill="#10B981" radius={[0, 0, 0, 0]} />
                <Bar yAxisId="left" dataKey="incorrect" name="Incorrect" stackId="a" fill="#F43F5E" radius={[0, 0, 0, 0]} />
                <Bar yAxisId="left" dataKey="neutral" name="Neutral (Doji)" stackId="a" fill="#64748B" radius={[3, 3, 0, 0]} />
                <Line yAxisId="right" type="monotone" dataKey="accuracy" name="Empirical Accuracy %" stroke="#06B6D4" strokeWidth={2.5} dot={{ r: 4, fill: '#06B6D4', stroke: '#0E131F', strokeWidth: 1.5 }} />
                <Line yAxisId="right" type="monotone" dataKey="expectedAccuracy" name="Nominal Confidence Midpoint" stroke="#EAB308" strokeWidth={1.5} strokeDasharray="4 3" dot={false} />
              </ComposedChart>
            </ResponsiveContainer>
          )}
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-3 border-t border-slate-800/60 font-mono text-xs">
          <div className="p-2.5 rounded bg-slate-950/60 border border-slate-850">
            <span className="text-slate-500 text-[10px] block">MAX CONFIDENCE BAND</span>
            <span className="font-bold text-cyan-300">{stats?.byConfidenceBand?.['70-80%']?.accuracy || 0}%</span>
            <span className="text-slate-500 text-[10px] block">({stats?.byConfidenceBand?.['70-80%']?.total || 0} samples)</span>
          </div>
          <div className="p-2.5 rounded bg-slate-950/60 border border-slate-850">
            <span className="text-slate-500 text-[10px] block">MID CONFIDENCE BAND</span>
            <span className="font-bold text-emerald-400">{stats?.byConfidenceBand?.['60-69%']?.accuracy || 0}%</span>
            <span className="text-slate-500 text-[10px] block">({stats?.byConfidenceBand?.['60-69%']?.total || 0} samples)</span>
          </div>
          <div className="p-2.5 rounded bg-slate-950/60 border border-slate-850">
            <span className="text-slate-500 text-[10px] block">BASE CONFIDENCE BAND</span>
            <span className="font-bold text-slate-300">{stats?.byConfidenceBand?.['50-59%']?.accuracy || 0}%</span>
            <span className="text-slate-500 text-[10px] block">({stats?.byConfidenceBand?.['50-59%']?.total || 0} samples)</span>
          </div>
          <div className="p-2.5 rounded bg-slate-950/60 border border-slate-850">
            <span className="text-slate-500 text-[10px] block">MONOTONIC CALIBRATION</span>
            <span className="font-bold text-emerald-300">
              {(stats?.byConfidenceBand?.['70-80%']?.accuracy || 0) >= (stats?.byConfidenceBand?.['50-59%']?.accuracy || 0) ? 'CALIBRATED' : 'CONVERGING'}
            </span>
            <span className="text-slate-500 text-[10px] block">Higher conf = Higher win-rate</span>
          </div>
        </div>
      </div>
    </div>
  );
};
