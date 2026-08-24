'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { FormEvent, useState } from 'react';
import { useAuth } from '../../providers/AuthProvider';

export default function LoginPage() {
  const { login } = useAuth();
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    setIsSubmitting(true);
    setError('');
    try {
      await login(email, password);
      const nextPath = new URLSearchParams(window.location.search).get('next');
      router.replace(nextPath || '/dashboard');
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="max-w-md mx-auto py-16 space-y-6">
      <div>
        <h1 className="text-3xl font-black text-white">Sign in</h1>
        <p className="text-sm text-slate-400 mt-2">Access the live research dashboard and account tools.</p>
      </div>
      <form onSubmit={onSubmit} className="bg-[#0E131F] border border-slate-800 rounded-xl p-5 space-y-4">
        <label className="block text-xs font-mono text-slate-300">
          Email
          <input className="mt-1 w-full rounded-lg bg-slate-950 border border-slate-800 px-3 py-2 text-sm text-white" value={email} onChange={(e) => setEmail(e.target.value)} type="email" required />
        </label>
        <label className="block text-xs font-mono text-slate-300">
          Password
          <input className="mt-1 w-full rounded-lg bg-slate-950 border border-slate-800 px-3 py-2 text-sm text-white" value={password} onChange={(e) => setPassword(e.target.value)} type="password" required />
        </label>
        {error && <p className="text-xs text-rose-400">{error}</p>}
        <button disabled={isSubmitting} className="w-full rounded-lg bg-cyan-500 px-4 py-2.5 font-bold text-slate-950 disabled:opacity-60">
          {isSubmitting ? 'Signing in...' : 'Sign in'}
        </button>
      </form>
      <div className="flex justify-between text-xs text-slate-400">
        <Link className="hover:text-cyan-300" href="/forgot-password">Forgot password?</Link>
        <Link className="hover:text-cyan-300" href="/register">Create account</Link>
      </div>
    </div>
  );
}
