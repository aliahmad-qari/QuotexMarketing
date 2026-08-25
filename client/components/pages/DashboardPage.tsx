'use client';

import { IndicatorDeck } from '../IndicatorDeck';
import { LiveStatusBar } from '../LiveStatusBar';
import { MarketTimeframeBar } from '../MarketTimeframeBar';
import { OtcMarketsPanel } from '../OtcMarketsPanel';
import { PredictionDeck } from '../PredictionDeck';
import { RecentEvaluationsTable } from '../RecentEvaluationsTable';
import { TradingChart } from '../TradingChart';
import { useMarketStream } from '../../hooks/useMarketStream';

export function DashboardPage() {
  const {
    symbol,
    setSymbol,
    timeframe,
    setTimeframe,
    candles,
    prediction1,
    prediction2,
    metadata,
    recentEvaluations,
    status,
    secondsRemaining,
  } = useMarketStream('BTCUSDT', '1m');

  const latestSnapshot = prediction1?.indicatorSnapshot || null;

  return (
    <div className="space-y-4 pb-16">
      {/* Live connection status bar — always visible */}
      <LiveStatusBar
        status={status}
        symbol={symbol}
        lastPrice={metadata?.lastPrice ?? null}
        priceDecimals={metadata?.priceDecimals ?? 2}
        priceChangePercent={metadata?.priceChangePercent24h ?? 0}
      />

      {/* Market selector + timeframe bar */}
      <MarketTimeframeBar
        symbol={symbol}
        onSelectSymbol={setSymbol}
        timeframe={timeframe}
        onSelectTimeframe={setTimeframe}
        metadata={metadata}
        secondsRemaining={secondsRemaining}
      />

      {/* Live trading chart */}
      <TradingChart
        candles={candles}
        prediction1={prediction1}
        prediction2={prediction2}
        timeframe={timeframe}
        symbol={symbol}
        secondsRemaining={secondsRemaining}
      />

      {/* Prediction signals */}
      <PredictionDeck
        prediction1={prediction1}
        prediction2={prediction2}
      />

      {/* OTC Markets catalog */}
      <OtcMarketsPanel />

      {/* Technical indicators */}
      <IndicatorDeck snapshot={latestSnapshot} />

      {/* Recent prediction history */}
      <RecentEvaluationsTable evaluations={recentEvaluations} />
    </div>
  );
}
