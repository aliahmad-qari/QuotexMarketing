import React, { createContext, useContext, useEffect, useState } from 'react';
import { DemoTrade, DemoTradeStatus, Direction, MarketSymbol } from '../types/market';

interface SocialTradeActivity {
  id: string;
  traderName: string;
  flag: string;
  symbol: MarketSymbol;
  direction: Direction;
  amount: number;
  profit: number;
  time: string;
  status: 'WON' | 'LOST';
}

interface DemoTradingContextType {
  demoBalance: number;
  accountMode: 'DEMO' | 'REAL_SIM';
  setAccountMode: (mode: 'DEMO' | 'REAL_SIM') => void;
  resetBalance: (amount?: number) => void;
  depositDemo: (amount: number) => void;
  activeTrades: DemoTrade[];
  closedTrades: DemoTrade[];
  placeTrade: (
    symbol: MarketSymbol,
    direction: Direction,
    amount: number,
    durationSeconds: number,
    currentPrice: number,
    payoutPercent?: number
  ) => boolean;
  cancelTrade?: (tradeId: string) => void;
  soundEnabled: boolean;
  setSoundEnabled: (enabled: boolean) => void;
  socialFeed: SocialTradeActivity[];
  totalProfit: number;
  winRate: number;
  lastSettledTrade: DemoTrade | null;
  clearLastSettledTrade: () => void;
}

const DemoTradingContext = createContext<DemoTradingContextType | undefined>(undefined);

const BALANCE_KEY = 'cpl_qx_demo_balance';
const CLOSED_TRADES_KEY = 'cpl_qx_closed_trades';
const ACTIVE_TRADES_KEY = 'cpl_qx_active_trades';

const SAMPLE_NAMES = ['Alex M.', 'Elena R.', 'Marco S.', 'Kenji T.', 'Carlos V.', 'Viktor K.', 'Fatima Z.', 'David L.', 'Chloe B.'];
const FLAGS = ['🇺🇸', '🇬🇧', '🇩🇪', '🇯🇵', '🇧🇷', '🇫🇷', '🇦🇪', '🇨🇦', '🇮🇳', '🇸🇬'];

export const DemoTradingProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [demoBalance, setDemoBalance] = useState<number>(() => {
    try {
      const stored = localStorage.getItem(BALANCE_KEY);
      return stored ? parseFloat(stored) : 10000;
    } catch {
      return 10000;
    }
  });

  const [accountMode, setAccountMode] = useState<'DEMO' | 'REAL_SIM'>('DEMO');
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);
  const [activeTrades, setActiveTrades] = useState<DemoTrade[]>(() => {
    try {
      const stored = localStorage.getItem(ACTIVE_TRADES_KEY);
      if (stored) {
        const parsed: DemoTrade[] = JSON.parse(stored);
        // filter out expired trades
        return parsed.filter((t) => t.expiresAt > Date.now());
      }
      return [];
    } catch {
      return [];
    }
  });

  const [closedTrades, setClosedTrades] = useState<DemoTrade[]>(() => {
    try {
      const stored = localStorage.getItem(CLOSED_TRADES_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });

  const [lastSettledTrade, setLastSettledTrade] = useState<DemoTrade | null>(null);

  // Simulated social feed
  const [socialFeed, setSocialFeed] = useState<SocialTradeActivity[]>([
    {
      id: 'soc-1',
      traderName: 'Viktor K.',
      flag: '🇩🇪',
      symbol: 'BTCUSDT',
      direction: 'UP',
      amount: 150,
      profit: 127.5,
      time: 'Just now',
      status: 'WON',
    },
    {
      id: 'soc-2',
      traderName: 'Fatima Z.',
      flag: '🇦🇪',
      symbol: 'ETHUSDT',
      direction: 'DOWN',
      amount: 80,
      profit: 68.8,
      time: '1m ago',
      status: 'WON',
    },
    {
      id: 'soc-3',
      traderName: 'Kenji T.',
      flag: '🇯🇵',
      symbol: 'SOLUSDT',
      direction: 'UP',
      amount: 200,
      profit: -200,
      time: '2m ago',
      status: 'LOST',
    },
  ]);

  // Persist balance
  useEffect(() => {
    try {
      localStorage.setItem(BALANCE_KEY, demoBalance.toString());
    } catch (e) {
      console.warn('Failed to persist balance', e);
    }
  }, [demoBalance]);

  // Persist closed trades
  useEffect(() => {
    try {
      localStorage.setItem(CLOSED_TRADES_KEY, JSON.stringify(closedTrades.slice(0, 100)));
    } catch (e) {
      console.warn('Failed to persist closed trades', e);
    }
  }, [closedTrades]);

  // Persist active trades
  useEffect(() => {
    try {
      localStorage.setItem(ACTIVE_TRADES_KEY, JSON.stringify(activeTrades));
    } catch (e) {
      console.warn('Failed to persist active trades', e);
    }
  }, [activeTrades]);

  // Audio tone synthesizer for trades
  const playSound = (type: 'open' | 'win' | 'loss') => {
    if (!soundEnabled) return;
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);

      if (type === 'open') {
        osc.frequency.setValueAtTime(440, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.1);
        gain.gain.setValueAtTime(0.08, ctx.currentTime);
        gain.gain.linearRampToValueAtTime(0.01, ctx.currentTime + 0.1);
        osc.start();
        osc.stop(ctx.currentTime + 0.1);
      } else if (type === 'win') {
        osc.frequency.setValueAtTime(587.33, ctx.currentTime); // D5
        osc.frequency.setValueAtTime(880, ctx.currentTime + 0.1); // A5
        gain.gain.setValueAtTime(0.12, ctx.currentTime);
        gain.gain.linearRampToValueAtTime(0.01, ctx.currentTime + 0.25);
        osc.start();
        osc.stop(ctx.currentTime + 0.25);
      } else {
        osc.frequency.setValueAtTime(320, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(160, ctx.currentTime + 0.2);
        gain.gain.setValueAtTime(0.08, ctx.currentTime);
        gain.gain.linearRampToValueAtTime(0.01, ctx.currentTime + 0.2);
        osc.start();
        osc.stop(ctx.currentTime + 0.2);
      }
    } catch {
      // Audio context might be restricted before user gesture
    }
  };

  // Timer loop for resolving active trades
  useEffect(() => {
    const interval = setInterval(() => {
      const now = Date.now();
      setActiveTrades((prev) => {
        const remaining: DemoTrade[] = [];
        const resolving: DemoTrade[] = [];

        prev.forEach((trade) => {
          if (now >= trade.expiresAt) {
            resolving.push(trade);
          } else {
            remaining.push(trade);
          }
        });

        if (resolving.length > 0) {
          resolving.forEach((trade) => {
            // Simulated minor micro-variation if real tick not attached yet
            const deltaPercent = (Math.random() - 0.48) * 0.003;
            const exitPrice = trade.entryPrice * (1 + deltaPercent);

            let status: DemoTradeStatus = 'LOST';
            let actualProfit = -trade.amount;

            if (trade.direction === 'UP' && exitPrice > trade.entryPrice) {
              status = 'WON';
              actualProfit = (trade.amount * trade.payoutPercent) / 100;
            } else if (trade.direction === 'DOWN' && exitPrice < trade.entryPrice) {
              status = 'WON';
              actualProfit = (trade.amount * trade.payoutPercent) / 100;
            } else if (exitPrice === trade.entryPrice) {
              status = 'TIE';
              actualProfit = 0;
            }

            const settled: DemoTrade = {
              ...trade,
              exitPrice,
              status,
              actualProfit,
            };

            // Update balance
            if (status === 'WON') {
              setDemoBalance((b) => b + trade.amount + actualProfit);
              playSound('win');
            } else if (status === 'TIE') {
              setDemoBalance((b) => b + trade.amount);
            } else {
              playSound('loss');
            }

            setClosedTrades((c) => [settled, ...c]);
            setLastSettledTrade(settled);
          });
        }

        return remaining;
      });
    }, 500);

    return () => clearInterval(interval);
  }, [soundEnabled]);

  // Periodic random social trade generation
  useEffect(() => {
    const socialInterval = setInterval(() => {
      const randomName = SAMPLE_NAMES[Math.floor(Math.random() * SAMPLE_NAMES.length)];
      const randomFlag = FLAGS[Math.floor(Math.random() * FLAGS.length)];
      const symbols: MarketSymbol[] = ['BTCUSDT', 'ETHUSDT', 'SOLUSDT', 'BNBUSDT', 'XRPUSDT', 'DOGEUSDT'];
      const sym = symbols[Math.floor(Math.random() * symbols.length)];
      const dir: Direction = Math.random() > 0.5 ? 'UP' : 'DOWN';
      const isWon = Math.random() > 0.38;
      const amt = [10, 25, 50, 100, 250, 500][Math.floor(Math.random() * 6)];
      const prof = isWon ? Math.round(amt * 0.85 * 10) / 10 : -amt;

      const newSocialItem: SocialTradeActivity = {
        id: 'soc-' + Date.now(),
        traderName: randomName,
        flag: randomFlag,
        symbol: sym,
        direction: dir,
        amount: amt,
        profit: prof,
        time: 'Just now',
        status: isWon ? 'WON' : 'LOST',
      };

      setSocialFeed((prev) => [newSocialItem, ...prev.slice(0, 7)]);
    }, 7000);

    return () => clearInterval(socialInterval);
  }, []);

  const placeTrade = (
    symbol: MarketSymbol,
    direction: Direction,
    amount: number,
    durationSeconds: number,
    currentPrice: number,
    payoutPercent: number = 85
  ): boolean => {
    if (amount <= 0 || amount > demoBalance) {
      return false;
    }

    // Deduct investment amount
    setDemoBalance((b) => Math.max(0, b - amount));

    const now = Date.now();
    const expectedProfit = (amount * payoutPercent) / 100;

    const newTrade: DemoTrade = {
      id: 'qx_' + Math.random().toString(36).substring(2, 9),
      symbol,
      direction,
      amount,
      entryPrice: currentPrice || 50000,
      payoutPercent,
      expectedProfit,
      status: 'OPEN',
      createdAt: now,
      expiresAt: now + durationSeconds * 1000,
      durationSeconds,
    };

    setActiveTrades((prev) => [newTrade, ...prev]);
    playSound('open');
    return true;
  };

  const resetBalance = (amount = 10000) => {
    setDemoBalance(amount);
  };

  const depositDemo = (amount: number) => {
    setDemoBalance((b) => b + amount);
  };

  const clearLastSettledTrade = () => {
    setLastSettledTrade(null);
  };

  // Calculations
  const totalProfit = closedTrades.reduce((acc, t) => acc + (t.actualProfit || 0), 0);
  const wonTrades = closedTrades.filter((t) => t.status === 'WON').length;
  const winRate = closedTrades.length > 0 ? (wonTrades / closedTrades.length) * 100 : 0;

  return (
    <DemoTradingContext.Provider
      value={{
        demoBalance,
        accountMode,
        setAccountMode,
        resetBalance,
        depositDemo,
        activeTrades,
        closedTrades,
        placeTrade,
        soundEnabled,
        setSoundEnabled,
        socialFeed,
        totalProfit,
        winRate,
        lastSettledTrade,
        clearLastSettledTrade,
      }}
    >
      {children}
    </DemoTradingContext.Provider>
  );
};

export const useDemoTrading = () => {
  const context = useContext(DemoTradingContext);
  if (!context) {
    throw new Error('useDemoTrading must be used within a DemoTradingProvider');
  }
  return context;
};
