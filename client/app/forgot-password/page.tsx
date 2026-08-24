'use client';

import { FormEvent, useState } from 'react';
import { forgotPasswordRequest } from '../../services/authClient';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    setError('');
    try {
      const response = await forgotPasswordRequest(email);
      setMessage(response.data!.message);
    } catch (err) {
      setError((err as Error).message);
    }
  }

  return (
    <div className="max-w-md mx-auto py-16 space-y-6">
      <div>
        <h1 className="text-3xl font-black text-white">Reset password</h1>
        <p className="text-sm text-slate-400 mt-2">We will send reset instructions if the account exists.</p>
      </div>
      <form onSubmit={onSubmit} className="bg-[#0E131F] border border-slate-800 rounded-xl p-5 space-y-4">
        <label className="block text-xs font-mono text-slate-300">Email<input className="mt-1 w-full rounded-lg bg-slate-950 border border-slate-800 px-3 py-2 text-sm text-white" value={email} onChange={(e) => setEmail(e.target.value)} type="email" required /></label>
        {message && <p className="text-xs text-emerald-400">{message}</p>}
        {error && <p className="text-xs text-rose-400">{error}</p>}
        <button className="w-full rounded-lg bg-cyan-500 px-4 py-2.5 font-bold text-slate-950">Send reset link</button>
      </form>
    </div>
  );
}
