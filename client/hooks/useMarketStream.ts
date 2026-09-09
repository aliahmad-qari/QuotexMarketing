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
  // Track the current symbol+timeframe inside refs so callbacks always see
  // the latest values without needing to be recreated.
  const symbolRef = useRef(symbol);
  const timeframeRef = useRef(timeframe);

  useEffect(() => { symbolRef.current = symbol; }, [symbol]);
  useEffect(() => { timeframeRef.current = timeframe; }, [timeframe]);

  // ── Step 1: Wire all WS listeners once on mount ──────────────────────────
  // All callbacks read symbolRef/timeframeRef so they always filter correctly
  // regardless of how many times symbol/timeframe changes.
  useEffect(() => {
    const unsubStatus = wsClient.onStatus((s) => {
      setStatus(s);
    });

    const unsubSnapshot = wsClient.onSnapshot((data: MarketSnapshotPayload) => {
      if (data.symbol !== symbolRef.current || data.timeframe !== timeframeRef.current) return;

      setCandles(data.candles);
      if (data.candles.length > 0) {
        activeCandleRef.current = data.candles[data.candles.length - 1];
      }
      if (data.metadata) setMetadata(data.metadata);
      if (data.predictions) {
        setPrediction1(data.predictions.prediction1);
        setPrediction2(data.predictions.prediction2);
      } else {
        setPrediction1(null);
        setPrediction2(null);
      }
      if (data.recentEvaluations) {
        setRecentEvaluations(data.recentEvaluations);
      }
      setIsLoading(false);
    });

    const unsubUpdate = wsClient.onCandleUpdate((candle: Candle) => {
      if (candle.symbol !== symbolRef.current || candle.timeframe !== timeframeRef.current) return;

      activeCandleRef.current = candle;

      setCandles((prev) => {
        if (!prev.length) return [candle];
        const last = prev[prev.length - 1];
        if (last.openTime === candle.openTime) {
          const copy = [...prev];
          copy[copy.length - 1] = candle;
          return copy;
        }
        if (candle.openTime > last.openTime) {
          return [...prev.slice(-99), candle];
        }
        return prev;
      });

      setMetadata((prev) => {
        if (!prev) return null;
        return { ...prev, lastPrice: candle.close, lastUpdated: Date.now() };
      });
    });

    const unsubClosed = wsClient.onCandleClosed((candle: Candle) => {
      if (candle.symbol !== symbolRef.current || candle.timeframe !== timeframeRef.current) return;

      // Update ref so the countdown timer stays alive after close
      activeCandleRef.current = candle;

      setCandles((prev) => {
        const filtered = prev.filter((c) => c.openTime !== candle.openTime);
        return [...filtered.slice(-99), candle];
      });
    });

    const unsubPredNew = wsClient.onPredictionNew((data) => {
      if (
        data.prediction1.symbol !== symbolRef.current ||
        data.prediction1.timeframe !== timeframeRef.current
      ) return;
      setPrediction1(data.prediction1);
      setPrediction2(data.prediction2);
    });

    const unsubPredEval = wsClient.onPredictionEvaluated((evaluation: Prediction) => {
      if (evaluation.symbol !== symbolRef.current || evaluation.timeframe !== timeframeRef.current) return;
      setRecentEvaluations((prev) => {
        const filtered = prev.filter(
          (p) => !(
            p.targetCandleOpenTime === evaluation.targetCandleOpenTime &&
            p.horizon === evaluation.horizon
          )
        );
        return [evaluation, ...filtered].slice(0, 30);
      });
    });

    return () => {
      unsubStatus();
      unsubSnapshot();
      unsubUpdate();
      unsubClosed();
      unsubPredNew();
      unsubPredEval();
    };
  }, []); // intentionally empty — listeners are wired once, refs handle currency

  // ── Step 2: Connect + subscribe whenever symbol/timeframe changes ────────
  // Clear stale candles immediately so the chart doesn't show the wrong pair.
  useEffect(() => {
    setIsLoading(true);
    setCandles([]);
    setPrediction1(null);
    setPrediction2(null);
    activeCandleRef.current = null;

    // connect() is idempotent — safe to call on every change.
    // If the socket is already open it sends the subscribe message immediately;
    // if it's still connecting the onopen handler will resubscribe automatically.
    wsClient.connect();
    wsClient.subscribe(symbol, timeframe);

    return () => {
      wsClient.unsubscribe(symbol, timeframe);
    };
  }, [symbol, timeframe]);

  // ── Step 3: Candle countdown — smooth 100 ms tick ────────────────────────
  useEffect(() => {
    const timer = setInterval(() => {
      const current = activeCandleRef.current;
      if (current?.closeTime) {
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
