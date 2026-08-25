'use client';

import React from 'react';
import { ConnectionStatus } from '../types/market';
import { Wifi, WifiOff, RefreshCw, AlertTriangle } from 'lucide-react';

interface LiveStatusBarProps {
  status: ConnectionStatus;
  symbol: string;
  lastPrice: number | null;
  priceDecimals?: number;
  priceChangePercent?: number;
}

const STATUS_CONFIG: Record<
  ConnectionStatus,
  { label: string; color: string; dot: string; Icon: React.ElementType; pulse: boolean }
> = {
  connected:    { label: 'LIVE',         color: 'text-emerald-400', dot: 'bg-emerald-400', Icon: Wifi,          pulse: true  },
  connecting:   { label: 'CONNECTING',   color: 'text-amber-400',   dot: 'bg-amber-400',   Icon: RefreshCw,     pulse: true  },
  reconnecting: { label: 'RECONNECTING', color: 'text-amber-400',   dot: 'bg-amber-400',   Icon: RefreshCw,     pulse: true  },
  stale:        { label: 'STALE',        color: 'text-rose-400',    dot: 'bg-rose-400',    Icon: AlertTriangle, pulse: false },
  disconnected: { label: 'OFFLINE',      color: 'text-rose-400',    dot: 'bg-rose-400',    Icon: WifiOff,       pulse: false },
};

export const LiveStatusBar: React.FC<LiveStatusBarProps> = ({
  status,
  symbol,
  lastPrice,
  priceDecimals = 2,
  priceChangePercent = 0,
}) => {
  const cfg = STATUS_CONFIG[status] ?? STATUS_CONFIG.disconnected;
  const isUp = priceChangePercent >= 0;

  return (
    <div className="flex items-center justify-between px-3 py-1.5 bg-slate-950 border border-slate-800 rounded-lg text-xs font-mono">
      {/* Left: connection status */}
      <div className={`flex items-center space-x-1.5 ${cfg.color}`}>
        <span className={`w-2 h-2 rounded-full ${cfg.dot} ${cfg.pulse ? 'animate-pulse' : ''}`} />
        <cfg.Icon className="w-3 h-3" />
        <span className="font-bold tracking-wider">{cfg.label}</span>
        {status === 'connected' && (
          <span className="text-slate-500 font-normal">— Binance Spot WebSocket</span>
        )}
        {(status === 'connecting' || status === 'reconnecting') && (
          <span className="text-slate-500 font-normal">— waiting for server…</span>
        )}
        {status === 'disconnected' && (
          <span className="text-slate-500 font-normal">
            — check server &amp; NEXT_PUBLIC_WS_URL
          </span>
        )}
      </div>

      {/* Right: live price */}
      {lastPrice && lastPrice > 0 && (
        <div className="flex items-center space-x-2">
          <span className="text-slate-400">{symbol.replace('USDT', '')}/USDT</span>
          <span className="font-bold text-white">
            ${lastPrice.toLocaleString(undefined, {
              minimumFractionDigits: priceDecimals,
              maximumFractionDigits: priceDecimals,
            })}
          </span>
          <span className={`font-semibold ${isUp ? 'text-emerald-400' : 'text-rose-400'}`}>
            {isUp ? '+' : ''}{priceChangePercent.toFixed(2)}%
          </span>
        </div>
      )}
    </div>
  );
};
