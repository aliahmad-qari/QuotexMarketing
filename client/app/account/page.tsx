'use client';

import { FormEvent, useState } from 'react';
import { ProtectedRoute } from '../../components/ProtectedRoute';
import { useAuth } from '../../providers/AuthProvider';

function AccountContent() {
  const { user, logout, changePassword } = useAuth();
  const [currentPassword, setCurrentPassword] = useState('');
  const [nextPassword, setNextPassword] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  async function onChangePassword(event: FormEvent) {
    event.preventDefault();
    setError('');
    setMessage('');
    try {
      await changePassword(currentPassword, nextPassword);
      setMessage('Password changed. Please sign in again.');
    } catch (err) {
      setError((err as Error).message);
    }
  }

  return (
    <div className="max-w-4xl mx-auto py-10 space-y-6">
      <div>
        <h1 className="text-3xl font-black text-white">Account</h1>
        <p className="text-sm text-slate-400 mt-2">Session and security controls for your profile.</p>
      </div>
      <div className="grid md:grid-cols-2 gap-5">
        <section className="bg-[#0E131F] border border-slate-800 rounded-xl p-5 space-y-3">
          <h2 className="font-mono text-sm font-bold text-slate-200 uppercase">Profile</h2>
          <div className="text-sm text-slate-300 space-y-2">
            <p><span className="text-slate-500">Name:</span> {user?.displayName}</p>
            <p><span className="text-slate-500">Email:</span> {user?.email}</p>
            <p><span className="text-slate-500">Role:</span> {user?.role}</p>
            <p><span className="text-slate-500">Status:</span> {user?.accountStatus}</p>
          </div>
          <button onClick={logout} className="rounded-lg border border-slate-700 px-3 py-2 text-xs font-mono text-slate-300 hover:text-white">Log out</button>
        </section>
        <section className="bg-[#0E131F] border border-slate-800 rounded-xl p-5 space-y-3">
          <h2 className="font-mono text-sm font-bold text-slate-200 uppercase">Change password</h2>
          <form onSubmit={onChangePassword} className="space-y-3">
            <input className="w-full rounded-lg bg-slate-950 border border-slate-800 px-3 py-2 text-sm text-white" placeholder="Current password" type="password" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} required />
            <input className="w-full rounded-lg bg-slate-950 border border-slate-800 px-3 py-2 text-sm text-white" placeholder="New password" type="password" value={nextPassword} onChange={(e) => setNextPassword(e.target.value)} required />
            {message && <p className="text-xs text-emerald-400">{message}</p>}
            {error && <p className="text-xs text-rose-400">{error}</p>}
            <button className="rounded-lg bg-cyan-500 px-4 py-2 text-sm font-bold text-slate-950">Update password</button>
          </form>
        </section>
      </div>
    </div>
  );
}

export default function AccountPage() {
  return (
    <ProtectedRoute>
      <AccountContent />
    </ProtectedRoute>
  );
}
