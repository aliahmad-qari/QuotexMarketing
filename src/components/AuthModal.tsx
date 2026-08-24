import React, { useState } from 'react';
import { CheckCircle2, KeyRound, Lock, LogIn, Shield, ShieldCheck, Sparkles, UserCheck, X } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export const AuthModal: React.FC = () => {
  const { isAuthModalOpen, closeAuthModal, authModalMode, login, quickLoginAs } = useAuth();
  const [mode, setMode] = useState<'login' | 'signup'>(authModalMode);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [role, setRole] = useState<'researcher' | 'admin'>('researcher');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  if (!isAuthModalOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!email || !email.includes('@')) {
      setError('Please enter a valid email address.');
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }

    setIsLoading(true);
    setTimeout(async () => {
      await login(email, role, name || undefined);
      setIsLoading(false);
    }, 400);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div
        className="relative w-full max-w-md bg-[#0D111A] border border-slate-800 rounded-2xl shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header Ribbon */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800/80 bg-slate-950/40">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-lg bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
              <Shield className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white font-mono uppercase tracking-wider">
                {mode === 'login' ? 'Researcher Portal Access' : 'Create Research Account'}
              </h3>
              <p className="text-[11px] text-slate-400">
                Deterministic Probability Lab & Analytics
              </p>
            </div>
          </div>
          <button
            onClick={closeAuthModal}
            className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Quick Demo Access Bar */}
        <div className="px-6 pt-5 pb-2">
          <div className="p-3.5 rounded-xl bg-slate-900/90 border border-cyan-500/20 space-y-2.5">
            <div className="flex items-center justify-between text-[11px] font-mono text-cyan-400 font-semibold uppercase tracking-wider">
              <span className="flex items-center space-x-1">
                <Sparkles className="w-3.5 h-3.5" />
                <span>Instant 1-Click Sandbox Logins</span>
              </span>
              <span className="text-[10px] text-slate-500">No password required</span>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => quickLoginAs('admin')}
                className="px-3 py-2 rounded-lg bg-purple-950/60 hover:bg-purple-900/60 border border-purple-500/40 text-purple-200 text-xs font-mono font-bold flex items-center justify-center space-x-1.5 transition-all"
              >
                <ShieldCheck className="w-3.5 h-3.5 text-purple-400" />
                <span>Admin Portal</span>
              </button>
              <button
                type="button"
                onClick={() => quickLoginAs('researcher')}
                className="px-3 py-2 rounded-lg bg-cyan-950/60 hover:bg-cyan-900/60 border border-cyan-500/40 text-cyan-200 text-xs font-mono font-bold flex items-center justify-center space-x-1.5 transition-all"
              >
                <UserCheck className="w-3.5 h-3.5 text-cyan-400" />
                <span>Researcher</span>
              </button>
            </div>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="px-6 py-4 space-y-4">
          {error && (
            <div className="p-2.5 rounded-lg bg-rose-950/50 border border-rose-500/40 text-rose-300 text-xs font-mono">
              {error}
            </div>
          )}

          {mode === 'signup' && (
            <div className="space-y-1">
              <label className="text-xs font-mono text-slate-400">Full Name</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Dr. Alan Turing"
                className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-800 text-white text-xs font-mono focus:outline-none focus:border-cyan-500"
              />
            </div>
          )}

          <div className="space-y-1">
            <label className="text-xs font-mono text-slate-400">Email Address</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="analyst@quantfirm.com"
              required
              className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-800 text-white text-xs font-mono focus:outline-none focus:border-cyan-500"
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-mono text-slate-400">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••••••"
              required
              className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-800 text-white text-xs font-mono focus:outline-none focus:border-cyan-500"
            />
          </div>

          {mode === 'signup' && (
            <div className="space-y-1">
              <label className="text-xs font-mono text-slate-400">Role Elevation</label>
              <select
                value={role}
                onChange={(e) => setRole(e.target.value as 'researcher' | 'admin')}
                className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-800 text-white text-xs font-mono focus:outline-none focus:border-cyan-500"
              >
                <option value="researcher">Quant Researcher (Read-only Lab & Metrics)</option>
                <option value="admin">System Administrator (Weights & Pipeline Config)</option>
              </select>
            </div>
          )}

          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs font-mono flex items-center justify-center space-x-2 shadow-lg shadow-cyan-500/20 transition-all disabled:opacity-50"
          >
            {isLoading ? (
              <span className="animate-pulse">Authenticating Session...</span>
            ) : (
              <>
                <LogIn className="w-4 h-4" />
                <span>{mode === 'login' ? 'Sign In to Workspace' : 'Create Account'}</span>
              </>
            )}
          </button>

          <div className="pt-2 text-center text-xs text-slate-500 font-mono">
            {mode === 'login' ? (
              <span>
                Need an elevated account?{' '}
                <button
                  type="button"
                  onClick={() => setMode('signup')}
                  className="text-cyan-400 hover:underline"
                >
                  Register here
                </button>
              </span>
            ) : (
              <span>
                Already registered?{' '}
                <button
                  type="button"
                  onClick={() => setMode('login')}
                  className="text-cyan-400 hover:underline"
                >
                  Sign in
                </button>
              </span>
            )}
          </div>
        </form>
      </div>
    </div>
  );
};
