'use client';

import {
  CandlestickSeries,
  ColorType,
  createChart,
  HistogramSeries,
  IChartApi,
  ISeriesApi,
  UTCTimestamp,
} from 'lightweight-charts';
import React, { useEffect, useRef, useState } from 'react';
import { ArrowDown, ArrowUp, Sparkles, TrendingUp } from 'lucide-react';
import { Candle, Prediction, Timeframe } from '../types/market';

interface TradingChartProps {
  candles: Candle[];
  prediction1: Prediction | null;
  prediction2: Prediction | null;
  timeframe: Timeframe;
  symbol: string;
  secondsRemaining: number;
}

export const TradingChart: React.FC<TradingChartProps> = ({
  candles,
  prediction1,
  prediction2,
  timeframe,
  symbol,
  secondsRemaining,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const candleSeriesRef = useRef<ISeriesApi<'Candlestick'> | null>(null);
  const volumeSeriesRef = useRef<ISeriesApi<'Histogram'> | null>(null);
  const [activePrice, setActivePrice] = useState<{ price: number; open: number; high: number; low: number } | null>(
    null
  );

  useEffect(() => {
    if (!containerRef.current) return;

    // Create Lightweight Chart
    const chart = createChart(containerRef.current, {
      layout: {
        background: { type: ColorType.Solid, color: '#0B0E14' },
        textColor: '#94A3B8',
        fontSize: 12,
        fontFamily: 'Inter, system-ui, -apple-system, sans-serif',
      },
      grid: {
        vertLines: { color: 'rgba(30, 41, 59, 0.4)' },
        horzLines: { color: 'rgba(30, 41, 59, 0.4)' },
      },
      crosshair: {
        mode: 1,
        vertLine: {
          color: '#38BDF8',
          width: 1,
          style: 3,
          labelBackgroundColor: '#0F172A',
        },
        horzLine: {
          color: '#38BDF8',
          width: 1,
          style: 3,
          labelBackgroundColor: '#0F172A',
        },
      },
      timeScale: {
        borderColor: '#1E293B',
        timeVisible: true,
        secondsVisible: ['5s', '10s', '15s', '30s'].includes(timeframe),
        rightOffset: 12, // Space for projected candles visualizer
      },
      rightPriceScale: {
        borderColor: '#1E293B',
        scaleMargins: {
          top: 0.15,
          bottom: 0.25,
        },
      },
      handleScale: {
        axisPressedMouseMove: true,
        mouseWheel: true,
        pinch: true,
      },
    });

    // Add Candlestick Series
    const candleSeries = chart.addSeries(CandlestickSeries, {
      upColor: '#10B981',
      downColor: '#F43F5E',
      borderVisible: true,
      borderUpColor: '#10B981',
      borderDownColor: '#F43F5E',
      wickUpColor: '#10B981',
      wickDownColor: '#F43F5E',
    });

    // Add Volume Histogram Series
    const volumeSeries = chart.addSeries(HistogramSeries, {
      priceFormat: {
        type: 'volume',
      },
      priceScaleId: '', // Separate scale
    });

    volumeSeries.priceScale().applyOptions({
      scaleMargins: {
        top: 0.82,
        bottom: 0,
      },
    });

    chartRef.current = chart;
    candleSeriesRef.current = candleSeries;
    volumeSeriesRef.current = volumeSeries;

    // Handle crosshair move for tooltip / active values
    chart.subscribeCrosshairMove((param) => {
      if (!param || !param.time || !param.seriesData) {
        return;
      }
      const data = param.seriesData.get(candleSeries) as
        | { close?: number; open?: number; high?: number; low?: number }
        | undefined;
      if (
        data &&
        data.close !== undefined &&
        data.open !== undefined &&
        data.high !== undefined &&
        data.low !== undefined
      ) {
        setActivePrice({
          price: data.close,
          open: data.open,
          high: data.high,
          low: data.low,
        });
      }
    });

    // ResizeObserver for responsive chart dimensions
    const resizeObserver = new ResizeObserver((entries) => {
      if (entries.length > 0 && chartRef.current && containerRef.current) {
        const { width, height } = entries[0].contentRect;
        chartRef.current.applyOptions({ width, height });
      }
    });

    resizeObserver.observe(containerRef.current);

    return () => {
      resizeObserver.disconnect();
      chart.remove();
      chartRef.current = null;
    };
  }, [timeframe]);

  // Update candle data in chart
  useEffect(() => {
    if (!candleSeriesRef.current || !volumeSeriesRef.current || !candles.length) return;

    try {
      // Format candles for lightweight-charts
      const sorted = [...candles].sort((a, b) => a.openTime - b.openTime);

      // Deduplicate timestamps
      const uniqueCandles: Candle[] = [];
      const seen = new Set<number>();
      for (const c of sorted) {
        const sec = Math.floor(c.openTime / 1000);
        if (!seen.has(sec)) {
          seen.add(sec);
          uniqueCandles.push(c);
        }
      }

      const formattedCandles = uniqueCandles.map((c) => ({
        time: Math.floor(c.openTime / 1000) as UTCTimestamp,
        open: c.open,
        high: c.high,
        low: c.low,
        close: c.close,
      }));

      const formattedVolumes = uniqueCandles.map((c) => ({
        time: Math.floor(c.openTime / 1000) as UTCTimestamp,
        value: c.volume,
        color: c.close >= c.open ? 'rgba(16, 185, 129, 0.35)' : 'rgba(244, 63, 94, 0.35)',
      }));

      candleSeriesRef.current.setData(formattedCandles);
      volumeSeriesRef.current.setData(formattedVolumes);

      if (sorted.length > 0) {
        const last = sorted[sorted.length - 1];
        setActivePrice({
          price: last.close,
          open: last.open,
          high: last.high,
          low: last.low,
        });
      }
    } catch (err) {
      console.warn('[TradingChart] Error updating series data:', err);
    }
  }, [candles]);

  const lastCandle = candles[candles.length - 1];
  const lastPrice = lastCandle ? lastCandle.close : 0;
  const isUp = lastCandle ? lastCandle.close >= lastCandle.open : true;

  return (
    <div className="relative w-full h-[520px] bg-[#0B0E14] border border-slate-800/80 rounded-xl overflow-hidden shadow-2xl flex flex-col">
      {/* Chart Header Bar */}
      <div className="flex flex-wrap items-center justify-between px-4 py-2.5 bg-slate-900/90 border-b border-slate-800/80 gap-3 z-10">
        <div className="flex items-center space-x-3">
          <div className="flex items-center space-x-2">
            <span className="font-mono font-bold text-white text-base tracking-tight">{symbol}</span>
            <span className="text-xs px-2 py-0.5 rounded font-mono bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
              {timeframe}
            </span>
          </div>

          <div className="h-4 w-[1px] bg-slate-700 hidden sm:block" />

          {/* Real-time OHLC */}
          {activePrice && (
            <div className="hidden lg:flex items-center space-x-3 font-mono text-xs text-slate-400">
              <span>
                O: <strong className="text-slate-200">${activePrice.open.toFixed(2)}</strong>
              </span>
              <span>
                H: <strong className="text-slate-200">${activePrice.high.toFixed(2)}</strong>
              </span>
              <span>
                L: <strong className="text-slate-200">${activePrice.low.toFixed(2)}</strong>
              </span>
              <span>
                C:{' '}
                <strong className={isUp ? 'text-emerald-400' : 'text-rose-400'}>
                  ${activePrice.price.toFixed(2)}
                </strong>
              </span>
            </div>
          )}
        </div>

        {/* Live Candle Countdown & Signal Status */}
        <div className="flex items-center space-x-3">
          <div className="flex items-center space-x-1.5 px-2.5 py-1 rounded bg-slate-800/80 border border-slate-700/60 text-xs font-mono text-slate-300">
            <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
            <span>Candle Closes:</span>
            <span className="font-bold text-cyan-300">{secondsRemaining}s</span>
          </div>

          <div className="flex items-center space-x-1 text-[11px] font-mono text-slate-400 px-2 py-1 bg-slate-950/60 rounded border border-slate-800">
            <TrendingUp className="w-3.5 h-3.5 text-emerald-400" />
            <span>Binance Spot Real-time</span>
          </div>
        </div>
      </div>

      {/* Main Chart Area */}
      <div className="relative flex-1 w-full h-full">
        <div ref={containerRef} className="w-full h-full" />

        {/* Projected Predicted Candles Visualizer Overlay (Dashed / Transparent / Clear demarcation) */}
        <div className="absolute top-4 right-20 pointer-events-none flex flex-col space-y-2 z-10 max-w-[280px]">
          {/* Vertical Actual vs Predicted Demarcation Notice */}
          <div className="bg-slate-900/90 backdrop-blur border border-cyan-500/30 rounded-lg p-2.5 shadow-xl text-xs font-mono">
            <div className="flex items-center justify-between border-b border-slate-800 pb-1.5 mb-2">
              <div className="flex items-center space-x-1.5 text-cyan-400 font-semibold text-[11px] uppercase tracking-wider">
                <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
                <span>Probability Horizon</span>
              </div>
              <span className="text-[10px] text-slate-400 bg-slate-800 px-1.5 py-0.5 rounded">
                DETERMINISTIC MODEL
              </span>
            </div>

            {/* PREDICTED +1 Candle */}
            {prediction1 && (
              <div className="mb-2 p-2 rounded bg-slate-950/80 border border-dashed border-cyan-500/40 relative">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-slate-300">PREDICTED +1</span>
                  <span
                    className={`inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold ${
                      prediction1.predictedDirection === 'UP'
                        ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                        : 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                    }`}
                  >
                    {prediction1.predictedDirection === 'UP' ? (
                      <ArrowUp className="w-3 h-3 mr-0.5" />
                    ) : (
                      <ArrowDown className="w-3 h-3 mr-0.5" />
                    )}
                    {prediction1.predictedDirection}
                  </span>
                </div>
                <div className="mt-1.5 flex items-center justify-between text-[11px]">
                  <span className="text-slate-400">Confidence:</span>
                  <span className="font-bold text-cyan-300">{prediction1.confidence}%</span>
                </div>
                {/* Visual Confidence Bar */}
                <div className="w-full bg-slate-800 h-1.5 rounded-full mt-1 overflow-hidden">
                  <div
                    className={`h-full rounded-full ${
                      prediction1.predictedDirection === 'UP' ? 'bg-emerald-400' : 'bg-rose-400'
                    }`}
                    style={{ width: `${((prediction1.confidence - 50) / 30) * 100}%` }}
                  />
                </div>
              </div>
            )}

            {/* PREDICTED +2 Candle */}
            {prediction2 && (
              <div className="p-2 rounded bg-slate-950/60 border border-dashed border-slate-700/60 relative">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-slate-400">PREDICTED +2</span>
                  <span
                    className={`inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold opacity-85 ${
                      prediction2.predictedDirection === 'UP'
                        ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30'
                        : 'bg-rose-500/15 text-rose-300 border border-rose-500/30'
                    }`}
                  >
                    {prediction2.predictedDirection === 'UP' ? (
                      <ArrowUp className="w-3 h-3 mr-0.5" />
                    ) : (
                      <ArrowDown className="w-3 h-3 mr-0.5" />
                    )}
                    {prediction2.predictedDirection}
                  </span>
                </div>
                <div className="mt-1.5 flex items-center justify-between text-[11px]">
                  <span className="text-slate-400">Confidence:</span>
                  <span className="font-bold text-cyan-400/80">{prediction2.confidence}%</span>
                </div>
                {/* Visual Confidence Bar */}
                <div className="w-full bg-slate-800 h-1.5 rounded-full mt-1 overflow-hidden">
                  <div
                    className={`h-full rounded-full opacity-75 ${
                      prediction2.predictedDirection === 'UP' ? 'bg-emerald-400' : 'bg-rose-400'
                    }`}
                    style={{ width: `${((prediction2.confidence - 50) / 25) * 100}%` }}
                  />
                </div>
              </div>
            )}

            <p className="text-[9px] text-slate-400 mt-2 italic leading-tight text-center">
              *Dashed boxes indicate mathematical projection range, not future price guarantees.
            </p>
          </div>
        </div>

        {/* Watermark Branding */}
        <div className="absolute bottom-4 left-4 pointer-events-none select-none opacity-20 text-xs font-mono tracking-widest text-slate-500">
          CANDLE PROBABILITY LAB &bull; BINANCE SPOT
        </div>
      </div>
    </div>
  );
};
