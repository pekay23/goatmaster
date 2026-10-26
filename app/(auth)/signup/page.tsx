'use client';

import { FormEvent, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function SignupPage() {
  const router = useRouter();
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setError('');
    const form = new FormData(event.currentTarget);
    try {
      const response = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: form.get('email'), username: form.get('username'), password: form.get('password') }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || 'Unable to create account');
      if (result.data?.id && result.data?.organization_id) localStorage.setItem('goatmaster-session-scope', result.data.organization_id + ':' + result.data.id);
      const selected = new URLSearchParams(window.location.search).get('plan');
      router.push(selected && selected !== 'free' ? '/settings?tab=billing&plan=' + encodeURIComponent(selected) : '/dashboard');
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Unable to create account');
      setBusy(false);
    }
  }

  return <main className="mx-auto flex min-h-screen max-w-md flex-col justify-center px-6 py-12"><Link className="mb-8 text-sm text-slate-600 hover:underline" href="/">← GoatMaster</Link><h1 className="text-3xl font-semibold">Create your account</h1><p className="mt-2 text-slate-600">A private organization will be created for your farm.</p><form onSubmit={submit} className="mt-8 space-y-5"><label className="block text-sm font-medium">Farm or account name<input className="mt-1 block w-full rounded-lg border p-3" name="username" autoComplete="organization" required /></label><label className="block text-sm font-medium">Email<input className="mt-1 block w-full rounded-lg border p-3" type="email" name="email" autoComplete="email" required /></label><label className="block text-sm font-medium">Password<input className="mt-1 block w-full rounded-lg border p-3" type="password" name="password" autoComplete="new-password" minLength={10} required /><span className="mt-1 block text-xs text-slate-500">Use at least 10 characters.</span></label>{error && <p role="alert" className="text-sm text-red-700">{error}</p>}<button className="w-full rounded-lg bg-green-800 p-3 font-semibold text-white disabled:opacity-60" disabled={busy}>{busy ? 'Creating account…' : 'Create account'}</button></form><p className="mt-6 text-sm text-slate-600">Already registered? <Link className="underline" href="/login">Sign in</Link></p></main>;
}
