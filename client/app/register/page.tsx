'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { FormEvent, useState } from 'react';
import { useAuth } from '../../providers/AuthProvider';

export default function RegisterPage() {
  const { register } = useAuth();
  const router = useRouter();
  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    setIsSubmitting(true);
    setError('');
    try {
      await register(email, password, displayName);
      router.replace('/dashboard');
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="max-w-md mx-auto py-16 space-y-6">
      <div>
        <h1 className="text-3xl font-black text-white">Create account</h1>
        <p className="text-sm text-slate-400 mt-2">New accounts are created with the standard user role.</p>
      </div>
      <form onSubmit={onSubmit} className="bg-[#0E131F] border border-slate-800 rounded-xl p-5 space-y-4">
        <label className="block text-xs font-mono text-slate-300">Display name<input className="mt-1 w-full rounded-lg bg-slate-950 border border-slate-800 px-3 py-2 text-sm text-white" value={displayName} onChange={(e) => setDisplayName(e.target.value)} required /></label>
        <label className="block text-xs font-mono text-slate-300">Email<input className="mt-1 w-full rounded-lg bg-slate-950 border border-slate-800 px-3 py-2 text-sm text-white" value={email} onChange={(e) => setEmail(e.target.value)} type="email" required /></label>
        <label className="block text-xs font-mono text-slate-300">Password<input className="mt-1 w-full rounded-lg bg-slate-950 border border-slate-800 px-3 py-2 text-sm text-white" value={password} onChange={(e) => setPassword(e.target.value)} type="password" required /></label>
        <p className="text-[11px] text-slate-500">Use at least 12 characters with uppercase, lowercase, number, and symbol.</p>
        {error && <p className="text-xs text-rose-400">{error}</p>}
        <button disabled={isSubmitting} className="w-full rounded-lg bg-cyan-500 px-4 py-2.5 font-bold text-slate-950 disabled:opacity-60">{isSubmitting ? 'Creating...' : 'Create account'}</button>
      </form>
      <Link className="text-xs text-slate-400 hover:text-cyan-300" href="/login">Already have an account?</Link>
    </div>
  );
}
