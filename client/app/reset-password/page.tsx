'use client';

import Link from 'next/link';
import { FormEvent, useEffect, useState } from 'react';
import { resetPasswordRequest } from '../../services/authClient';

export default function ResetPasswordPage() {
  const [token, setToken] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    setToken(new URLSearchParams(window.location.search).get('token') || '');
  }, []);

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    setError('');
    try {
      await resetPasswordRequest(token, password);
      setMessage('Password reset complete. You can sign in with the new password.');
    } catch (err) {
      setError((err as Error).message);
    }
  }

  return (
    <div className="max-w-md mx-auto py-16 space-y-6">
      <h1 className="text-3xl font-black text-white">Choose a new password</h1>
      <form onSubmit={onSubmit} className="bg-[#0E131F] border border-slate-800 rounded-xl p-5 space-y-4">
        <label className="block text-xs font-mono text-slate-300">Reset token<input className="mt-1 w-full rounded-lg bg-slate-950 border border-slate-800 px-3 py-2 text-sm text-white" value={token} onChange={(e) => setToken(e.target.value)} required /></label>
        <label className="block text-xs font-mono text-slate-300">New password<input className="mt-1 w-full rounded-lg bg-slate-950 border border-slate-800 px-3 py-2 text-sm text-white" value={password} onChange={(e) => setPassword(e.target.value)} type="password" required /></label>
        {message && <p className="text-xs text-emerald-400">{message} <Link href="/login" className="underline">Sign in</Link></p>}
        {error && <p className="text-xs text-rose-400">{error}</p>}
        <button className="w-full rounded-lg bg-cyan-500 px-4 py-2.5 font-bold text-slate-950">Reset password</button>
      </form>
    </div>
  );
}
