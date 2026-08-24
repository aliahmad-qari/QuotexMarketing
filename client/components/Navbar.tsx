'use client';

import Link from 'next/link';
import type React from 'react';
import { usePathname } from 'next/navigation';
import {
  Activity,
  AlertTriangle,
  BookOpen,
  ChevronRight,
  Layers,
  Shield,
  Sparkles,
  Zap,
} from 'lucide-react';
import { useMarketStream } from '../hooks/useMarketStream';
import { ConnectionStatus } from '../types/market';

type NavItem = { href: string; label: string; icon: React.ReactNode };

export function Navbar() {
  const pathname = usePathname();
  const { status: connectionStatus } = useMarketStream('BTCUSDT', '1m');

  const getStatusBadge = () => {
    switch (connectionStatus) {
      case 'connected':
        return (
          <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-full text-[10px] font-mono bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            <span>LIVE STREAM</span>
          </span>
        );
      case 'connecting':
      case 'reconnecting':
        return (
          <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-full text-[10px] font-mono bg-amber-500/10 text-amber-400 border border-amber-500/20">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
            <span className="uppercase">{connectionStatus}</span>
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-full text-[10px] font-mono bg-rose-500/10 text-rose-400 border border-rose-500/20">
            <span className="w-1.5 h-1.5 rounded-full bg-rose-400" />
            <span>OFFLINE</span>
          </span>
        );
    }
  };

  const navItems: NavItem[] = [
    { href: '/', label: 'Overview', icon: <Layers className="w-3.5 h-3.5" /> },
    { href: '/dashboard', label: 'Live Terminal', icon: <Activity className="w-3.5 h-3.5 text-cyan-400" /> },
    { href: '/performance', label: 'Track Record', icon: <Sparkles className="w-3.5 h-3.5 text-amber-400" /> },
    { href: '/methodology', label: 'Methodology', icon: <BookOpen className="w-3.5 h-3.5" /> },
    { href: '/risk-disclosure', label: 'Risk Disclosure', icon: <AlertTriangle className="w-3.5 h-3.5 text-rose-400" /> },
    { href: '/about', label: 'About', icon: <Shield className="w-3.5 h-3.5" /> },
  ];

  const isActive = (href: string) => (href === '/' ? pathname === '/' : pathname.startsWith(href));

  return (
    <header className="sticky top-0 z-50 w-full bg-[#080B10]/95 backdrop-blur-md border-b border-slate-800/80 shadow-lg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Brand */}
          <Link
            id="brand-logo"
            className="flex items-center space-x-2.5 cursor-pointer group"
            href="/"
          >
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-cyan-400 via-blue-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-cyan-500/20 group-hover:scale-105 transition-transform">
              <Zap className="w-4 h-4 text-slate-950 stroke-[3]" />
            </div>
            <div>
              <div className="flex items-center space-x-1.5 leading-none">
                <span className="font-black text-sm sm:text-base text-white tracking-tight">
                  CANDLE<span className="text-cyan-400">LAB</span>
                </span>
              </div>
              <p className="text-[10px] text-slate-400 font-mono hidden sm:block">
                Real-Time Probability Engine
              </p>
            </div>
          </Link>

          {/* Center Navigation */}
          <nav className="hidden md:flex items-center space-x-1 lg:space-x-1.5">
            {navItems.map((item) => (
              <Link
                key={item.href}
                id={`nav-link-${item.href === '/' ? 'overview' : item.href.slice(1)}`}
                href={item.href}
                className={`px-3 py-1.5 rounded-lg text-xs font-mono font-semibold transition-all duration-150 flex items-center space-x-1.5 ${
                  isActive(item.href)
                    ? 'bg-slate-800 text-cyan-300 border border-slate-700 shadow-sm'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-850/50'
                }`}
              >
                {item.icon}
                <span>{item.label}</span>
              </Link>
            ))}
          </nav>

          {/* Right: Status + Live Terminal CTA */}
          <div className="flex items-center space-x-2 sm:space-x-3">
            <div className="hidden lg:block">{getStatusBadge()}</div>

            {pathname !== '/dashboard' && (
              <Link
                href="/dashboard"
                className="inline-flex items-center space-x-1.5 px-3.5 py-1.5 rounded-xl text-xs font-mono font-bold bg-cyan-500 hover:bg-cyan-400 text-slate-950 shadow-md shadow-cyan-500/20 transition-all"
              >
                <span>Live Terminal</span>
                <ChevronRight className="w-3.5 h-3.5 stroke-[3]" />
              </Link>
            )}
          </div>
        </div>

        {/* Mobile Navigation Row */}
        <div className="flex md:hidden overflow-x-auto py-2 space-x-2 border-t border-slate-800/60 no-scrollbar">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`px-2.5 py-1 rounded-lg text-xs font-mono whitespace-nowrap flex items-center space-x-1 ${
                isActive(item.href)
                  ? 'bg-slate-800 text-cyan-400 font-bold border border-slate-700'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {item.icon}
              <span>{item.label}</span>
            </Link>
          ))}
        </div>
      </div>
    </header>
  );
}
