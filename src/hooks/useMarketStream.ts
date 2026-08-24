import { useEffect, useRef, useState } from 'react';
import { MarketSnapshotPayload, wsClient } from '../services/wsClient';
import { Candle, ConnectionStatus, MarketMetadata, MarketSymbol, Prediction, Timeframe } from '../types/market';

export function useMarketStream(initialSymbol: MarketSymbol = 'BTCUSDT', initialTimeframe: Timeframe = '1m') {
  const [symbol, setSymbol] = useState<MarketSymbol>(initialSymbol);
  const [timeframe, setTimeframe] = useState<Timeframe>(initialTimeframe);
  const [candles, setCandles] = useState<Candle[]>([]);
  const [prediction1, setPrediction1] = useState<Prediction | null>(null);
  const [prediction2, setPrediction2] = useState<Prediction | null>(null);
  const [metadata, setMetadata] = useState<MarketMetadata | null>(null);
  const [recentEvaluations, setRecentEvaluations] = useState<Prediction[]>([]);
  const [status, setStatus] = useState<ConnectionStatus>('connecting');
  const [secondsRemaining, setSecondsRemaining] = useState<number>(0);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const activeCandleRef = useRef<Candle | null>(null);

  // Initialize socket and subscriptions
  useEffect(() => {
    wsClient.connect();

    const unsubStatus = wsClient.onStatus((s) => {
      setStatus(s);
    });

    const unsubSnapshot = wsClient.onSnapshot((data: MarketSnapshotPayload) => {
      if (data.symbol === symbol && data.timeframe === timeframe) {
        setCandles(data.candles);
        if (data.candles.length > 0) {
          activeCandleRef.current = data.candles[data.candles.length - 1];
        }
        if (data.metadata) setMetadata(data.metadata);
        if (data.predictions) {
          setPrediction1(data.predictions.prediction1);
          setPrediction2(data.predictions.prediction2);
        }
        if (data.recentEvaluations) {
          setRecentEvaluations(data.recentEvaluations);
        }
        setIsLoading(false);
      }
    });

    const unsubUpdate = wsClient.onCandleUpdate((candle: Candle) => {
      if (candle.symbol === symbol && candle.timeframe === timeframe) {
        activeCandleRef.current = candle;
        setCandles((prev) => {
          if (!prev.length) return [candle];
          const last = prev[prev.length - 1];
          if (last.openTime === candle.openTime) {
            // Update last candle in-place
            const copy = [...prev];
            copy[copy.length - 1] = candle;
            return copy;
          } else if (candle.openTime > last.openTime) {
            // New candle started
            return [...prev.slice(-99), candle];
          }
          return prev;
        });

        setMetadata((prev) => {
          if (!prev) return null;
          return {
            ...prev,
            lastPrice: candle.close,
            lastUpdated: Date.now(),
          };
        });
      }
    });

    const unsubClosed = wsClient.onCandleClosed((candle: Candle) => {
      if (candle.symbol === symbol && candle.timeframe === timeframe) {
        setCandles((prev) => {
          const filtered = prev.filter((c) => c.openTime !== candle.openTime);
          return [...filtered.slice(-99), candle];
        });
      }
    });

    const unsubPredNew = wsClient.onPredictionNew((data) => {
      if (data.prediction1.symbol === symbol && data.prediction1.timeframe === timeframe) {
        setPrediction1(data.prediction1);
        setPrediction2(data.prediction2);
      }
    });

    const unsubPredEval = wsClient.onPredictionEvaluated((evaluation: Prediction) => {
      if (evaluation.symbol === symbol) {
        setRecentEvaluations((prev) => {
          const filtered = prev.filter(
            (p) => !(p.targetCandleOpenTime === evaluation.targetCandleOpenTime && p.horizon === evaluation.horizon)
          );
          return [evaluation, ...filtered].slice(0, 30);
        });
      }
    });

    return () => {
      unsubStatus();
      unsubSnapshot();
      unsubUpdate();
      unsubClosed();
      unsubPredNew();
      unsubPredEval();
    };
  }, [symbol, timeframe]);

  // Handle symbol / timeframe changes
  useEffect(() => {
    setIsLoading(true);
    wsClient.subscribe(symbol, timeframe);

    return () => {
      wsClient.unsubscribe(symbol, timeframe);
    };
  }, [symbol, timeframe]);

  // Candle countdown timer interval (runs every 100ms for smooth display)
  useEffect(() => {
    const timer = setInterval(() => {
      const current = activeCandleRef.current;
      if (current && current.closeTime) {
        const remainingMs = Math.max(0, current.closeTime - Date.now());
        setSecondsRemaining(Math.ceil(remainingMs / 1000));
      }
    }, 100);

    return () => clearInterval(timer);
  }, []);

  return {
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
  };
}
