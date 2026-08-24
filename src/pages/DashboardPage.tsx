import React from 'react';
import { IndicatorDeck } from '../components/IndicatorDeck';
import { MarketTimeframeBar } from '../components/MarketTimeframeBar';
import { OrderTerminalPanel } from '../components/OrderTerminalPanel';
import { PredictionDeck } from '../components/PredictionDeck';
import { QuotexSocialTicker } from '../components/QuotexSocialTicker';
import { RecentEvaluationsTable } from '../components/RecentEvaluationsTable';
import { TradeResultModal } from '../components/TradeResultModal';
import { TradingChart } from '../components/TradingChart';
import { useMarketStream } from '../hooks/useMarketStream';

export const DashboardPage: React.FC = () => {
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
    isLoading,
  } = useMarketStream('BTCUSDT', '1m');

  const latestSnapshot = prediction1?.indicatorSnapshot || null;
  const currentPrice = metadata?.lastPrice || (candles.length > 0 ? candles[candles.length - 1].close : 50000);

  return (
    <div className="space-y-6 pb-16">
      {/* 1. Quotex Market & Timeframe Navigation Bar */}
      <MarketTimeframeBar
        symbol={symbol}
        onSelectSymbol={setSymbol}
        timeframe={timeframe}
        onSelectTimeframe={setTimeframe}
        metadata={metadata}
        secondsRemaining={secondsRemaining}
      />

      {/* 2. Main High-Performance Viewport: TradingView Chart + Quotex Order Execution Sidebar */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Lightweight Chart */}
        <div className="lg:col-span-8 xl:col-span-9 space-y-4">
          <TradingChart
            candles={candles}
            prediction1={prediction1}
            prediction2={prediction2}
            timeframe={timeframe}
            symbol={symbol}
            secondsRemaining={secondsRemaining}
          />
        </div>

        {/* Right Column: Quotex Order & Probability Execution Terminal */}
        <div className="lg:col-span-4 xl:col-span-3">
          <OrderTerminalPanel
            symbol={symbol}
            currentPrice={currentPrice}
            timeframe={timeframe}
            prediction1={prediction1}
            metadata={metadata}
          />
        </div>
      </div>

      {/* 3. Prediction Deck: Horizon +1 & +2 Probability Cards */}
      <PredictionDeck
        prediction1={prediction1}
        prediction2={prediction2}
      />

      {/* 4. Indicator Agreement Radar */}
      <IndicatorDeck snapshot={latestSnapshot} />

      {/* 5. Live Evaluated Predictions Feed */}
      <RecentEvaluationsTable evaluations={recentEvaluations} />

      {/* Floating Quotex Social Deals Stream */}
      <QuotexSocialTicker />

      {/* Animated Trade Result Modal */}
      <TradeResultModal />
    </div>
  );
};
