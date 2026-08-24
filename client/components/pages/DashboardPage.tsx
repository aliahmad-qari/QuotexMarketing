'use client';

import { IndicatorDeck } from '../IndicatorDeck';
import { MarketTimeframeBar } from '../MarketTimeframeBar';
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
    secondsRemaining,
  } = useMarketStream('BTCUSDT', '1m');

  const latestSnapshot = prediction1?.indicatorSnapshot || null;

  return (
    <div className="space-y-6 pb-16">
      <MarketTimeframeBar
        symbol={symbol}
        onSelectSymbol={setSymbol}
        timeframe={timeframe}
        onSelectTimeframe={setTimeframe}
        metadata={metadata}
        secondsRemaining={secondsRemaining}
      />

      <TradingChart
        candles={candles}
        prediction1={prediction1}
        prediction2={prediction2}
        timeframe={timeframe}
        symbol={symbol}
        secondsRemaining={secondsRemaining}
      />

      <PredictionDeck
        prediction1={prediction1}
        prediction2={prediction2}
      />

      <IndicatorDeck snapshot={latestSnapshot} />

      <RecentEvaluationsTable evaluations={recentEvaluations} />
    </div>
  );
}
