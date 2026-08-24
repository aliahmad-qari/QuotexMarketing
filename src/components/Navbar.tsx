import React from 'react';
import {
  Activity,
  AlertTriangle,
  BookOpen,
  ChevronRight,
  DollarSign,
  Layers,
  Lock,
  LogOut,
  Plus,
  RefreshCw,
  Settings,
  Shield,
  ShieldCheck,
  Sparkles,
  User as UserIcon,
  Zap,
} from 'lucide-react';
import { ConnectionStatus, MarketMetadata, PageRoute } from '../types/market';
import { useAuth } from '../context/AuthContext';
import { useDemoTrading } from '../context/DemoTradingContext';

interface NavbarProps {
  currentPage: PageRoute;
  onNavigate: (page: PageRoute) => void;
  connectionStatus: ConnectionStatus;
  activeMetadata: MarketMetadata | null;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentPage,
  onNavigate,
  connectionStatus,
  activeMetadata,
}) => {
  const { user, isAuthenticated, isAdmin, openAuthModal, logout } = useAuth();
  const { demoBalance, resetBalance } = useDemoTrading();

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

  const navItems: { id: PageRoute; label: string; icon: React.ReactNode; badge?: string }[] = [
    { id: 'landing', label: 'Overview', icon: <Layers className="w-3.5 h-3.5" /> },
    { id: 'dashboard', label: 'Live Terminal', icon: <Activity className="w-3.5 h-3.5 text-cyan-400" /> },
    { id: 'performance', label: 'Track Record', icon: <Sparkles className="w-3.5 h-3.5 text-amber-400" /> },
    { id: 'methodology', label: 'Methodology', icon: <BookOpen className="w-3.5 h-3.5" /> },
    { id: 'risk-disclosure', label: 'Risk Disclosure', icon: <AlertTriangle className="w-3.5 h-3.5 text-rose-400" /> },
    { id: 'about', label: 'About', icon: <Shield className="w-3.5 h-3.5" /> },
    { id: 'admin', label: 'Admin', icon: <Settings className="w-3.5 h-3.5 text-purple-400" />, badge: isAdmin ? 'ADMIN' : undefined },
  ];

  return (
    <header className="sticky top-0 z-50 w-full bg-[#080B10]/95 backdrop-blur-md border-b border-slate-800/80 shadow-lg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Brand Logo - Quotex / Candle Lab style */}
          <div
            id="brand-logo"
            onClick={() => onNavigate('landing')}
            className="flex items-center space-x-2.5 cursor-pointer group"
          >
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-cyan-400 via-blue-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-cyan-500/20 group-hover:scale-105 transition-transform">
              <Zap className="w-4 h-4 text-slate-950 stroke-[3]" />
            </div>
            <div>
              <div className="flex items-center space-x-1.5 leading-none">
                <span className="font-black text-sm sm:text-base text-white tracking-tight">
                  CANDLE<span className="text-cyan-400">QX</span>
                </span>
                <span className="text-[9px] uppercase font-mono font-bold px-1.5 py-0.2 rounded bg-cyan-950 text-cyan-400 border border-cyan-800/50">
                  DEMO LAB
                </span>
              </div>
              <p className="text-[10px] text-slate-400 font-mono hidden sm:block">
                Real-Time Probability Engine
              </p>
            </div>
          </div>

          {/* Center Navigation Links */}
          <nav className="hidden md:flex items-center space-x-1 lg:space-x-1.5">
            {navItems.map((item) => (
              <button
                key={item.id}
                id={`nav-link-${item.id}`}
                onClick={() => onNavigate(item.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-mono font-semibold transition-all duration-150 flex items-center space-x-1.5 ${
                  currentPage === item.id
                    ? item.id === 'admin'
                      ? 'bg-purple-950/70 text-purple-300 border border-purple-500/40'
                      : 'bg-slate-800 text-cyan-300 border border-slate-700 shadow-sm'
                    : item.id === 'admin'
                    ? 'text-purple-400 hover:text-purple-200 hover:bg-purple-950/40'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-850/50'
                }`}
              >
                {item.icon}
                <span>{item.label}</span>
                {item.badge && (
                  <span className="text-[9px] px-1 py-0.2 rounded bg-purple-500/20 text-purple-300 border border-purple-500/30">
                    {item.badge}
                  </span>
                )}
              </button>
            ))}
          </nav>

          {/* Right Action & Status & Demo Balance & Auth */}
          <div className="flex items-center space-x-2 sm:space-x-3">
            {/* Live Feed Status */}
            <div className="hidden lg:block">{getStatusBadge()}</div>

            {/* Quotex-style Header Demo Balance Pill */}
            <div className="flex items-center bg-slate-900 border border-slate-750 rounded-xl px-2.5 py-1 font-mono text-xs shadow-inner">
              <div className="pr-2 border-r border-slate-800">
                <div className="text-[9px] text-slate-400 flex items-center space-x-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                  <span>Demo</span>
                </div>
                <div className="text-xs font-black text-emerald-400">
                  ${demoBalance.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </div>
              </div>
              <button
                onClick={() => resetBalance(10000)}
                className="pl-2 text-slate-400 hover:text-cyan-400 transition-colors p-0.5"
                title="Reset virtual balance to $10,000"
              >
                <RefreshCw className="w-3.5 h-3.5 text-cyan-400" />
              </button>
            </div>

            {/* Auth Session / Sign In Button */}
            {isAuthenticated ? (
              <div className="flex items-center space-x-1.5 bg-slate-900 border border-slate-800 rounded-xl p-1">
                <div
                  onClick={() => onNavigate(isAdmin ? 'admin' : 'performance')}
                  className="flex items-center space-x-1.5 px-2 py-0.5 cursor-pointer hover:opacity-80 transition-opacity"
                  title={`${user?.email} (${user?.role})`}
                >
                  <div
                    className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${
                      isAdmin
                        ? 'bg-purple-500/20 text-purple-300 border border-purple-500/40'
                        : 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                    }`}
                  >
                    {user?.name ? user.name.charAt(0).toUpperCase() : 'U'}
                  </div>
                  <span className="text-xs font-mono text-slate-200 hidden xl:inline-block max-w-[80px] truncate">
                    {user?.name}
                  </span>
                </div>
                <button
                  onClick={logout}
                  className="p-1 rounded text-slate-400 hover:text-rose-400 hover:bg-slate-800 transition-colors"
                  title="Sign Out"
                >
                  <LogOut className="w-3.5 h-3.5" />
                </button>
              </div>
            ) : (
              <button
                onClick={() => openAuthModal('login')}
                className="px-3 py-1.5 rounded-xl text-xs font-mono font-bold bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-200 flex items-center space-x-1.5 transition-all shadow-sm"
              >
                <Lock className="w-3 h-3 text-cyan-400" />
                <span className="hidden sm:inline">Sign In</span>
              </button>
            )}

            {/* Live Terminal Fast Action */}
            {currentPage !== 'dashboard' && (
              <button
                onClick={() => onNavigate('dashboard')}
                className="inline-flex items-center space-x-1.5 px-3.5 py-1.5 rounded-xl text-xs font-mono font-bold bg-[#00E676] hover:bg-[#00C853] text-slate-950 shadow-md shadow-emerald-500/20 transition-all"
              >
                <span>Live Terminal</span>
                <ChevronRight className="w-3.5 h-3.5 stroke-[3]" />
              </button>
            )}
          </div>
        </div>

        {/* Mobile Navigation Row */}
        <div className="flex md:hidden overflow-x-auto py-2 space-x-2 border-t border-slate-800/60 no-scrollbar">
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => onNavigate(item.id)}
              className={`px-2.5 py-1 rounded-lg text-xs font-mono whitespace-nowrap flex items-center space-x-1 ${
                currentPage === item.id
                  ? 'bg-slate-800 text-cyan-400 font-bold border border-slate-700'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {item.icon}
              <span>{item.label}</span>
            </button>
          ))}
        </div>
      </div>
    </header>
  );
};
