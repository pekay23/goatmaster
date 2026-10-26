'use client';

import { FormEvent, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
  const router = useRouter();
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setError('');
    const form = new FormData(event.currentTarget);
    const params = new URLSearchParams(window.location.search);
    const isAdmin = params.get('app') === 'admin';
    try {
      const response = await fetch(isAdmin ? '/api/admin/auth/login' : '/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: form.get('email'), password: form.get('password') }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || 'Unable to sign in');
      const requested = params.get('redirect');
      const fallback = isAdmin ? '/admin' : '/dashboard';
      const destination = requested?.startsWith('/') && !requested.startsWith('//') ? requested : fallback;
      if (result.data?.id && result.data?.organization_id) localStorage.setItem('goatmaster-session-scope', result.data.organization_id + ':' + result.data.id);
      router.push(destination);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Unable to sign in');
      setBusy(false);
    }
  }

  return <main className="mx-auto flex min-h-screen max-w-md flex-col justify-center px-6 py-12"><Link className="mb-8 text-sm text-slate-600 hover:underline" href="/">← GoatMaster</Link><h1 className="text-3xl font-semibold">Sign in</h1><p className="mt-2 text-slate-600">Access your herd records.</p><form onSubmit={submit} className="mt-8 space-y-5"><label className="block text-sm font-medium">Email<input className="mt-1 block w-full rounded-lg border p-3" type="email" name="email" autoComplete="email" required /></label><label className="block text-sm font-medium">Password<input className="mt-1 block w-full rounded-lg border p-3" type="password" name="password" autoComplete="current-password" required /></label>{error && <p role="alert" className="text-sm text-red-700">{error}</p>}<button className="w-full rounded-lg bg-green-800 p-3 font-semibold text-white disabled:opacity-60" disabled={busy}>{busy ? 'Signing in…' : 'Sign in'}</button></form><p className="mt-6 text-sm text-slate-600">New to GoatMaster? <Link className="underline" href="/signup">Create an account</Link></p></main>;
}
