import React from 'react';
import { Activity, BarChart2, Compass, Gauge, Layers, MoveDown, MoveUp, Sliders, Zap } from 'lucide-react';
import { IndicatorSnapshot } from '../types/market';

interface IndicatorDeckProps {
  snapshot: IndicatorSnapshot | null;
}

export const IndicatorDeck: React.FC<IndicatorDeckProps> = ({ snapshot }) => {
  if (!snapshot) {
    return (
      <div className="bg-[#0E131F] border border-slate-800/80 rounded-xl p-5 text-center text-slate-500 text-xs font-mono">
        Calculating indicators snapshot from historical series...
      </div>
    );
  }

  const isEmaBullish = snapshot.ema9 >= snapshot.ema21;
  const isMacdBullish = snapshot.macd.histogram >= 0;

  return (
    <div className="bg-[#0E131F] border border-slate-800/80 rounded-xl p-4 sm:p-5 space-y-4">
      {/* Title */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-3">
        <div className="flex items-center space-x-2">
          <Sliders className="w-4 h-4 text-cyan-400" />
          <h3 className="font-mono font-bold text-slate-100 text-xs sm:text-sm uppercase tracking-wider">
            Technical Indicator Agreement Matrix
          </h3>
        </div>
        <span className="text-[10px] font-mono text-slate-400 bg-slate-850 px-2 py-0.5 rounded border border-slate-800">
          REAL-TIME COMPUTATION
        </span>
      </div>

      {/* Grid of 6 Quantitative Gauges */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {/* 1. EMA Cross Trend */}
        <div className="bg-slate-950/70 border border-slate-800/80 rounded-lg p-3 space-y-1.5 font-mono">
          <div className="flex items-center justify-between text-[11px] text-slate-400">
            <span>EMA (9 / 21)</span>
            <Activity className="w-3.5 h-3.5 text-cyan-400" />
          </div>
          <div className="text-sm font-bold text-white flex items-center space-x-1">
            <span className={isEmaBullish ? 'text-emerald-400' : 'text-rose-400'}>
              {isEmaBullish ? 'BULLISH' : 'BEARISH'}
            </span>
          </div>
          <div className="text-[10px] text-slate-400 truncate">
            9: ${snapshot.ema9} | 21: ${snapshot.ema21}
          </div>
        </div>

        {/* 2. RSI 14 Oscillator */}
        <div className="bg-slate-950/70 border border-slate-800/80 rounded-lg p-3 space-y-1.5 font-mono">
          <div className="flex items-center justify-between text-[11px] text-slate-400">
            <span>RSI (14)</span>
            <Gauge className="w-3.5 h-3.5 text-cyan-400" />
          </div>
          <div className="text-sm font-bold text-white flex items-center space-x-1">
            <span
              className={
                snapshot.rsi14 >= 70
                  ? 'text-rose-400'
                  : snapshot.rsi14 <= 30
                  ? 'text-emerald-400'
                  : snapshot.rsi14 > 50
                  ? 'text-cyan-300'
                  : 'text-slate-300'
              }
            >
              {snapshot.rsi14}
            </span>
            <span className="text-[10px] text-slate-500 font-normal">
              {snapshot.rsi14 > 50 ? 'BUY ZONE' : 'SELL ZONE'}
            </span>
          </div>
          <div className="w-full bg-slate-900 h-1.5 rounded-full overflow-hidden">
            <div
              className="h-full bg-cyan-400 rounded-full"
              style={{ width: `${Math.min(100, Math.max(0, snapshot.rsi14))}%` }}
            />
          </div>
        </div>

        {/* 3. MACD Histogram */}
        <div className="bg-slate-950/70 border border-slate-800/80 rounded-lg p-3 space-y-1.5 font-mono">
          <div className="flex items-center justify-between text-[11px] text-slate-400">
            <span>MACD Hist</span>
            <BarChart2 className="w-3.5 h-3.5 text-cyan-400" />
          </div>
          <div className="text-sm font-bold text-white">
            <span className={isMacdBullish ? 'text-emerald-400' : 'text-rose-400'}>
              {snapshot.macd.histogram > 0 ? `+${snapshot.macd.histogram}` : snapshot.macd.histogram}
            </span>
          </div>
          <div className="text-[10px] text-slate-400 truncate">
            Sig: {snapshot.macd.signalLine}
          </div>
        </div>

        {/* 4. Candle Body Pressure */}
        <div className="bg-slate-950/70 border border-slate-800/80 rounded-lg p-3 space-y-1.5 font-mono">
          <div className="flex items-center justify-between text-[11px] text-slate-400">
            <span>Body Pressure</span>
            <Layers className="w-3.5 h-3.5 text-cyan-400" />
          </div>
          <div className="text-sm font-bold text-white flex items-center space-x-1">
            <span
              className={snapshot.candleBodyPressure >= 0 ? 'text-emerald-400' : 'text-rose-400'}
            >
              {Math.round(snapshot.candleBodyPressure * 100)}%
            </span>
            <span className="text-[10px] text-slate-500 font-normal">
              {snapshot.candleBodyPressure >= 0 ? 'BULL' : 'BEAR'}
            </span>
          </div>
          <div className="text-[10px] text-slate-400 truncate">
            Wicks: {Math.round(snapshot.lowerWickRatio * 100)}% / {Math.round(snapshot.upperWickRatio * 100)}%
          </div>
        </div>

        {/* 5. 5-Candle Momentum */}
        <div className="bg-slate-950/70 border border-slate-800/80 rounded-lg p-3 space-y-1.5 font-mono">
          <div className="flex items-center justify-between text-[11px] text-slate-400">
            <span>Momentum</span>
            <Zap className="w-3.5 h-3.5 text-cyan-400" />
          </div>
          <div className="text-sm font-bold text-white">
            <span className={snapshot.momentum >= 0 ? 'text-emerald-400' : 'text-rose-400'}>
              {snapshot.momentum >= 0 ? `+${snapshot.momentum}%` : `${snapshot.momentum}%`}
            </span>
          </div>
          <div className="text-[10px] text-slate-400 truncate">
            Vol Change: {snapshot.volumeChange > 0 ? `+${snapshot.volumeChange}%` : `${snapshot.volumeChange}%`}
          </div>
        </div>

        {/* 6. Volatility / ATR */}
        <div className="bg-slate-950/70 border border-slate-800/80 rounded-lg p-3 space-y-1.5 font-mono">
          <div className="flex items-center justify-between text-[11px] text-slate-400">
            <span>ATR Volatility</span>
            <Compass className="w-3.5 h-3.5 text-cyan-400" />
          </div>
          <div className="text-sm font-bold text-white">
            <span>{snapshot.volatility}%</span>
          </div>
          <div className="text-[10px] text-slate-400 truncate">
            ATR: ${snapshot.atr14}
          </div>
        </div>
      </div>
    </div>
  );
};
