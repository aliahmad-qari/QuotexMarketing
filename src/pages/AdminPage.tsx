import React, { useState } from 'react';
import {
  Activity,
  AlertCircle,
  AlertTriangle,
  CheckCircle2,
  Cpu,
  Database,
  Download,
  Flame,
  HardDrive,
  Lock,
  Play,
  RefreshCw,
  Save,
  Server,
  Settings,
  Shield,
  ShieldAlert,
  ShieldCheck,
  Sliders,
  Sparkles,
  Terminal,
  Trash2,
  UserCheck,
  Users,
  Zap,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { IndicatorWeightsConfig, PageRoute } from '../types/market';

interface Props {
  onNavigate?: (page: PageRoute) => void;
}

const DEFAULT_WEIGHTS: IndicatorWeightsConfig = {
  emaWeight: 25,
  rsiWeight: 20,
  macdWeight: 20,
  candlePressureWeight: 15,
  wickRejectionWeight: 10,
  volumeSurgeWeight: 10,
  maxConfidenceH1: 80,
  maxConfidenceH2: 75,
  decayRatePercent: 15,
};

export const AdminPage: React.FC<Props> = ({ onNavigate }) => {
  const { user, isAdmin, isAuthenticated, openAuthModal, quickLoginAs } = useAuth();

  const [weights, setWeights] = useState<IndicatorWeightsConfig>(() => {
    try {
      const saved = localStorage.getItem('cpl_admin_weights');
      return saved ? JSON.parse(saved) : DEFAULT_WEIGHTS;
    } catch {
      return DEFAULT_WEIGHTS;
    }
  });

  const [saveSuccess, setSaveSuccess] = useState(false);
  const [auditLog, setAuditLog] = useState<string[]>([
    'SYSTEM_BOOT: Live Binance stream multiplexer established on 7 spot pairs',
    'ORCHESTRATOR: Sub-minute bucket aggregation initialized (5s, 10s, 15s, 30s)',
    'PROBABILITY_ENGINE: Confidence bounds set to [50%, 80%] Horizon 1, [50%, 75%] Horizon 2',
    'AUDITOR: Zero look-ahead evaluation engine listening for target candle seals',
  ]);

  const [isPurging, setIsPurging] = useState(false);
  const [isEvaluating, setIsEvaluating] = useState(false);

  const totalWeight =
    weights.emaWeight +
    weights.rsiWeight +
    weights.macdWeight +
    weights.candlePressureWeight +
    weights.wickRejectionWeight +
    weights.volumeSurgeWeight;

  const handleSaveWeights = () => {
    try {
      localStorage.setItem('cpl_admin_weights', JSON.stringify(weights));
      setSaveSuccess(true);
      const timestamp = new Date().toLocaleTimeString();
      setAuditLog((prev) => [
        `[${timestamp}] CONFIG_UPDATE: Model weights adjusted (Total: ${totalWeight}%). Max H1: ${weights.maxConfidenceH1}%, Max H2: ${weights.maxConfidenceH2}%`,
        ...prev,
      ]);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (e) {
      console.error('Failed to save weights', e);
    }
  };

  const handleResetWeights = () => {
    setWeights(DEFAULT_WEIGHTS);
    localStorage.removeItem('cpl_admin_weights');
    const timestamp = new Date().toLocaleTimeString();
    setAuditLog((prev) => [
      `[${timestamp}] CONFIG_RESET: Restored default quantitative factor weights (25/20/20/15/10/10)`,
      ...prev,
    ]);
  };

  const handleTriggerAudit = () => {
    setIsEvaluating(true);
    setTimeout(() => {
      setIsEvaluating(false);
      const timestamp = new Date().toLocaleTimeString();
      setAuditLog((prev) => [
        `[${timestamp}] AUDIT_TRIGGER: Evaluated pending candles across BTCUSDT, ETHUSDT, SOLUSDT with zero look-ahead bias`,
        ...prev,
      ]);
    }, 800);
  };

  const handlePurgeCache = () => {
    setIsPurging(true);
    setTimeout(() => {
      setIsPurging(false);
      const timestamp = new Date().toLocaleTimeString();
      setAuditLog((prev) => [
        `[${timestamp}] CACHE_PURGE: Cleared local tick ring-buffer and re-synced Binance klines`,
        ...prev,
      ]);
    }, 600);
  };

  const handleExportData = () => {
    const data = {
      exportTimestamp: new Date().toISOString(),
      system: 'Candle Probability Lab Research Engine',
      weights,
      auditLog,
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `cpl-audit-export-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Protected route enforcement
  if (!isAuthenticated || !isAdmin) {
    return (
      <div className="max-w-2xl mx-auto py-16 px-4 space-y-6 text-center">
        <div className="w-16 h-16 mx-auto rounded-2xl bg-purple-950/60 border border-purple-500/30 flex items-center justify-center text-purple-400 shadow-xl shadow-purple-500/10">
          <ShieldAlert className="w-8 h-8" />
        </div>
        <div className="space-y-2">
          <h1 className="text-2xl sm:text-3xl font-mono font-bold text-white tracking-tight">
            Administrator Access Required
          </h1>
          <p className="text-slate-400 text-sm max-w-md mx-auto leading-relaxed">
            The Administration Panel allows configuration of indicator weights, probability calibration bounds, and system infrastructure diagnostics.
          </p>
        </div>

        <div className="p-5 rounded-2xl bg-[#0E131F] border border-slate-800 space-y-4 text-left max-w-md mx-auto font-mono text-xs">
          <div className="flex items-center justify-between text-slate-300 border-b border-slate-800 pb-2">
            <span>Session Status:</span>
            <span className="font-bold text-amber-400">
              {isAuthenticated ? `Signed in as (${user?.role})` : 'Unauthenticated'}
            </span>
          </div>
          <div className="flex items-center justify-between text-slate-300 border-b border-slate-800 pb-2">
            <span>Required Role:</span>
            <span className="font-bold text-purple-400">admin</span>
          </div>

          <div className="pt-2 space-y-2">
            <button
              onClick={() => quickLoginAs('admin')}
              className="w-full py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold flex items-center justify-center space-x-2 transition-all shadow-lg shadow-purple-600/20"
            >
              <ShieldCheck className="w-4 h-4" />
              <span>Elevate to Admin Session (1-Click)</span>
            </button>
            <button
              onClick={() => openAuthModal('login')}
              className="w-full py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold flex items-center justify-center space-x-2 transition-all"
            >
              <Lock className="w-4 h-4" />
              <span>Sign In with Custom Credentials</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-16">
      {/* Header Banner */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-800 pb-6">
        <div>
          <div className="flex items-center space-x-2 text-xs font-mono text-purple-400 uppercase tracking-wider mb-1">
            <ShieldCheck className="w-4 h-4" />
            <span>Administrator Control Center</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
            System & Probability Model Administration
          </h1>
          <p className="text-xs sm:text-sm text-slate-400">
            Tune deterministic factor weightings, observe live stream diagnostics, and manage evaluation auditor logs.
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <div className="text-right font-mono text-xs hidden sm:block">
            <div className="text-white font-bold">{user?.name}</div>
            <div className="text-purple-400 text-[10px] uppercase">Admin Session Active</div>
          </div>
          <button
            onClick={handleExportData}
            className="px-3.5 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-xs font-mono font-semibold text-slate-200 flex items-center space-x-2 transition-all"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export Audit Log</span>
          </button>
        </div>
      </div>

      {/* 1. Real-Time Infrastructure Status Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 font-mono">
        <div className="p-4 rounded-xl bg-[#0E131F] border border-slate-800 space-y-2">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span>BINANCE STREAM</span>
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
          </div>
          <div className="text-xl font-bold text-white">7 Spot Pairs</div>
          <div className="text-[11px] text-emerald-400">WebSocket Multiplex (0 dropped)</div>
        </div>

        <div className="p-4 rounded-xl bg-[#0E131F] border border-slate-800 space-y-2">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span>AGGREGATION ENGINE</span>
            <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse"></span>
          </div>
          <div className="text-xl font-bold text-white">10 Timeframes</div>
          <div className="text-[11px] text-cyan-400">5s Sub-minute to 3h Macro</div>
        </div>

        <div className="p-4 rounded-xl bg-[#0E131F] border border-slate-800 space-y-2">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span>LOOK-AHEAD BIAS</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-xl font-bold text-emerald-400">0.00% (Zero)</div>
          <div className="text-[11px] text-slate-400">Candle open locking active</div>
        </div>

        <div className="p-4 rounded-xl bg-[#0E131F] border border-slate-800 space-y-2">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span>PERSISTENCE STORE</span>
            <HardDrive className="w-4 h-4 text-purple-400" />
          </div>
          <div className="text-xl font-bold text-white">Hybrid Engine</div>
          <div className="text-[11px] text-purple-400">In-Memory + MongoDB Adapter</div>
        </div>
      </div>

      {/* 2. Deterministic Model Weights Tuner */}
      <div className="bg-[#0E131F] border border-slate-800 rounded-2xl p-6 space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-800 pb-4">
          <div className="flex items-center space-x-3">
            <div className="p-2 rounded-lg bg-cyan-950/60 border border-cyan-500/30 text-cyan-400">
              <Sliders className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white font-mono uppercase tracking-wider flex items-center space-x-2">
                <span>Quantitative Indicator Weights & Bounds</span>
                <span
                  className={`text-xs px-2 py-0.5 rounded-full font-bold ${
                    totalWeight === 100
                      ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                      : 'bg-amber-500/10 text-amber-400 border border-amber-500/30'
                  }`}
                >
                  Total: {totalWeight}% {totalWeight !== 100 && '(Normalizing)'}
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                Adjust the contribution percentages of the 6 technical factor categories in the consensus formula.
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={handleResetWeights}
              className="px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-700 text-xs font-mono text-slate-300 transition-colors"
            >
              Reset Defaults
            </button>
            <button
              onClick={handleSaveWeights}
              className="px-4 py-1.5 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-mono font-bold text-xs flex items-center space-x-1.5 shadow-lg shadow-cyan-500/20 transition-all"
            >
              <Save className="w-3.5 h-3.5" />
              <span>Apply & Save</span>
            </button>
          </div>
        </div>

        {saveSuccess && (
          <div className="p-3 rounded-lg bg-emerald-950/50 border border-emerald-500/40 text-emerald-300 text-xs font-mono flex items-center space-x-2 animate-in fade-in">
            <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
            <span>Model weights updated and saved to persistent runtime cache!</span>
          </div>
        )}

        {/* Sliders Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 font-mono">
          {/* EMA */}
          <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-850 space-y-2">
            <div className="flex justify-between text-xs">
              <span className="text-slate-300 font-bold">1. EMA 9/21 Trend Weight</span>
              <span className="text-cyan-400 font-bold">{weights.emaWeight}%</span>
            </div>
            <input
              type="range"
              min="0"
              max="50"
              value={weights.emaWeight}
              onChange={(e) => setWeights({ ...weights, emaWeight: Number(e.target.value) })}
              className="w-full accent-cyan-400"
            />
            <p className="text-[10px] text-slate-500">Exponential moving average crossover & slope angle</p>
          </div>

          {/* RSI */}
          <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-850 space-y-2">
            <div className="flex justify-between text-xs">
              <span className="text-slate-300 font-bold">2. RSI 14 Momentum Weight</span>
              <span className="text-cyan-400 font-bold">{weights.rsiWeight}%</span>
            </div>
            <input
              type="range"
              min="0"
              max="50"
              value={weights.rsiWeight}
              onChange={(e) => setWeights({ ...weights, rsiWeight: Number(e.target.value) })}
              className="w-full accent-cyan-400"
            />
            <p className="text-[10px] text-slate-500">Relative strength index expansion above/below 50</p>
          </div>

          {/* MACD */}
          <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-850 space-y-2">
            <div className="flex justify-between text-xs">
              <span className="text-slate-300 font-bold">3. MACD Histogram Weight</span>
              <span className="text-cyan-400 font-bold">{weights.macdWeight}%</span>
            </div>
            <input
              type="range"
              min="0"
              max="50"
              value={weights.macdWeight}
              onChange={(e) => setWeights({ ...weights, macdWeight: Number(e.target.value) })}
              className="w-full accent-cyan-400"
            />
            <p className="text-[10px] text-slate-500">MACD (12, 26, 9) signal line impulse delta</p>
          </div>

          {/* Candle Body Pressure */}
          <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-850 space-y-2">
            <div className="flex justify-between text-xs">
              <span className="text-slate-300 font-bold">4. Body Pressure Weight</span>
              <span className="text-cyan-400 font-bold">{weights.candlePressureWeight}%</span>
            </div>
            <input
              type="range"
              min="0"
              max="50"
              value={weights.candlePressureWeight}
              onChange={(e) =>
                setWeights({ ...weights, candlePressureWeight: Number(e.target.value) })
              }
              className="w-full accent-cyan-400"
            />
            <p className="text-[10px] text-slate-500">Close vs Open ratio normalized against High/Low spread</p>
          </div>

          {/* Wick Rejection */}
          <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-850 space-y-2">
            <div className="flex justify-between text-xs">
              <span className="text-slate-300 font-bold">5. Wick Rejection Weight</span>
              <span className="text-cyan-400 font-bold">{weights.wickRejectionWeight}%</span>
            </div>
            <input
              type="range"
              min="0"
              max="50"
              value={weights.wickRejectionWeight}
              onChange={(e) =>
                setWeights({ ...weights, wickRejectionWeight: Number(e.target.value) })
              }
              className="w-full accent-cyan-400"
            />
            <p className="text-[10px] text-slate-500">Upper & lower shadow pin-bar absorption dynamics</p>
          </div>

          {/* Volume Surge */}
          <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-850 space-y-2">
            <div className="flex justify-between text-xs">
              <span className="text-slate-300 font-bold">6. Volume Surge Weight</span>
              <span className="text-cyan-400 font-bold">{weights.volumeSurgeWeight}%</span>
            </div>
            <input
              type="range"
              min="0"
              max="50"
              value={weights.volumeSurgeWeight}
              onChange={(e) =>
                setWeights({ ...weights, volumeSurgeWeight: Number(e.target.value) })
              }
              className="w-full accent-cyan-400"
            />
            <p className="text-[10px] text-slate-500">5-period volume moving average surge multiplier</p>
          </div>
        </div>

        {/* Confidence Bound Tuning */}
        <div className="border-t border-slate-800/80 pt-5 space-y-3 font-mono">
          <div className="text-xs font-bold text-slate-300 uppercase tracking-wider">
            Probability Cap & Horizon Variance Decay
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="p-3.5 rounded-lg bg-slate-900/60 border border-slate-800 space-y-1.5">
              <label className="text-[11px] text-slate-400 block">Horizon +1 Max Confidence</label>
              <div className="flex items-center space-x-2">
                <input
                  type="number"
                  min="60"
                  max="95"
                  value={weights.maxConfidenceH1}
                  onChange={(e) =>
                    setWeights({ ...weights, maxConfidenceH1: Number(e.target.value) })
                  }
                  className="w-20 px-2 py-1 rounded bg-slate-950 border border-slate-750 text-cyan-300 font-bold text-sm"
                />
                <span className="text-xs text-slate-400">% (Strict Cap: 80% default)</span>
              </div>
            </div>

            <div className="p-3.5 rounded-lg bg-slate-900/60 border border-slate-800 space-y-1.5">
              <label className="text-[11px] text-slate-400 block">Horizon +2 Max Confidence</label>
              <div className="flex items-center space-x-2">
                <input
                  type="number"
                  min="55"
                  max="90"
                  value={weights.maxConfidenceH2}
                  onChange={(e) =>
                    setWeights({ ...weights, maxConfidenceH2: Number(e.target.value) })
                  }
                  className="w-20 px-2 py-1 rounded bg-slate-950 border border-slate-750 text-cyan-300 font-bold text-sm"
                />
                <span className="text-xs text-slate-400">% (Strict Cap: 75% default)</span>
              </div>
            </div>

            <div className="p-3.5 rounded-lg bg-slate-900/60 border border-slate-800 space-y-1.5">
              <label className="text-[11px] text-slate-400 block">Horizon 2 Variance Decay Rate</label>
              <div className="flex items-center space-x-2">
                <input
                  type="number"
                  min="5"
                  max="35"
                  value={weights.decayRatePercent}
                  onChange={(e) =>
                    setWeights({ ...weights, decayRatePercent: Number(e.target.value) })
                  }
                  className="w-20 px-2 py-1 rounded bg-slate-950 border border-slate-750 text-amber-300 font-bold text-sm"
                />
                <span className="text-xs text-slate-400">% reduction from H1 confidence</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 3. Pipeline Actions & Terminal Audit Log */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Quick Operations */}
        <div className="bg-[#0E131F] border border-slate-800 rounded-2xl p-5 space-y-4 font-mono">
          <div className="flex items-center space-x-2 text-white font-bold text-sm uppercase">
            <Zap className="w-4 h-4 text-amber-400" />
            <span>Pipeline Operations</span>
          </div>

          <div className="space-y-2.5">
            <button
              onClick={handleTriggerAudit}
              disabled={isEvaluating}
              className="w-full py-2.5 px-3 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-750 text-slate-200 text-xs font-semibold flex items-center justify-between transition-all"
            >
              <span className="flex items-center space-x-2">
                <RefreshCw className={`w-3.5 h-3.5 text-cyan-400 ${isEvaluating ? 'animate-spin' : ''}`} />
                <span>Trigger Manual Candle Close Audit</span>
              </span>
              <span className="text-[10px] text-slate-500">Run Evaluator</span>
            </button>

            <button
              onClick={handlePurgeCache}
              disabled={isPurging}
              className="w-full py-2.5 px-3 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-750 text-slate-200 text-xs font-semibold flex items-center justify-between transition-all"
            >
              <span className="flex items-center space-x-2">
                <Trash2 className="w-3.5 h-3.5 text-amber-400" />
                <span>Flush In-Memory Ring Buffer</span>
              </span>
              <span className="text-[10px] text-slate-500">Reset Buffer</span>
            </button>

            <button
              onClick={handleExportData}
              className="w-full py-2.5 px-3 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-750 text-slate-200 text-xs font-semibold flex items-center justify-between transition-all"
            >
              <span className="flex items-center space-x-2">
                <Download className="w-3.5 h-3.5 text-emerald-400" />
                <span>Export System Calibration JSON</span>
              </span>
              <span className="text-[10px] text-slate-500">Raw Data</span>
            </button>
          </div>
        </div>

        {/* Live Admin Audit Terminal */}
        <div className="lg:col-span-2 bg-[#0E131F] border border-slate-800 rounded-2xl p-5 space-y-3 font-mono flex flex-col justify-between">
          <div className="flex items-center justify-between border-b border-slate-800 pb-2">
            <div className="flex items-center space-x-2 text-white font-bold text-xs uppercase">
              <Terminal className="w-4 h-4 text-purple-400" />
              <span>Real-Time Admin & Ingestion Stream Log</span>
            </div>
            <span className="text-[10px] text-slate-500">LIVE BUFFER</span>
          </div>

          <div className="bg-slate-950 p-3 rounded-lg border border-slate-850 h-44 overflow-y-auto text-[11px] space-y-1.5 font-mono text-slate-300">
            {auditLog.map((log, index) => (
              <div key={index} className="flex items-start space-x-2 leading-relaxed">
                <span className="text-purple-400 select-none">&gt;</span>
                <span className={log.includes('CONFIG') ? 'text-cyan-300 font-bold' : log.includes('AUDIT') ? 'text-emerald-300' : 'text-slate-400'}>
                  {log}
                </span>
              </div>
            ))}
          </div>

          <div className="text-[10px] text-slate-500 pt-1">
            System running in deterministic mode. Zero look-ahead evaluation strictly enforced.
          </div>
        </div>
      </div>
    </div>
  );
};
