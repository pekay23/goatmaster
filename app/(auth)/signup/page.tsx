'use client';

import { FormEvent, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import AuthPageFrame from '@/components/auth/AuthPageFrame';

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

  return <AuthPageFrame>
    <div>
      <p className="text-sm font-semibold text-[#47734f]">Set up your farm</p>
      <h1 className="mt-2 font-serif text-4xl font-semibold tracking-tight text-[#1c2e25]">Create an account</h1>
      <p className="mt-3 text-base leading-7 text-[#657168]">Your farm workspace is created when you sign up.</p>
      <form onSubmit={submit} className="mt-7 space-y-4">
        <label className="block text-sm font-semibold text-[#32463a]">Farm or account name
          <input className="mt-2 min-h-12 w-full rounded-xl border border-[#d9ddd2] bg-white px-4 text-base text-[#1c2e25] outline-none transition-colors placeholder:text-[#89958b] focus:border-[#477b55] focus:ring-4 focus:ring-[#477b55]/10" name="username" autoComplete="organization" required />
        </label>
        <label className="block text-sm font-semibold text-[#32463a]">Email
          <input className="mt-2 min-h-12 w-full rounded-xl border border-[#d9ddd2] bg-white px-4 text-base text-[#1c2e25] outline-none transition-colors placeholder:text-[#89958b] focus:border-[#477b55] focus:ring-4 focus:ring-[#477b55]/10" type="email" name="email" autoComplete="email" required />
        </label>
        <label className="block text-sm font-semibold text-[#32463a]">Password
          <input className="mt-2 min-h-12 w-full rounded-xl border border-[#d9ddd2] bg-white px-4 text-base text-[#1c2e25] outline-none transition-colors placeholder:text-[#89958b] focus:border-[#477b55] focus:ring-4 focus:ring-[#477b55]/10" type="password" name="password" autoComplete="new-password" minLength={10} required aria-describedby="password-hint" />
          <span id="password-hint" className="mt-1.5 block text-xs font-normal text-[#6b786d]">Use at least 10 characters.</span>
        </label>
        {error && <p role="alert" className="rounded-xl border border-[#e7b7aa] bg-[#fff2ee] px-4 py-3 text-sm text-[#8f3425]">{error}</p>}
        <button className="min-h-12 w-full rounded-xl bg-[#27563b] px-5 py-3 font-semibold text-white transition-colors hover:bg-[#1e452f] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#477b55]/30 disabled:cursor-wait disabled:opacity-60" disabled={busy}>{busy ? 'Creating account…' : 'Create account'}</button>
      </form>
      <p className="mt-6 text-sm text-[#657168]">Already registered? <Link className="font-semibold text-[#27563b] underline decoration-[#aac0a6] underline-offset-4 hover:text-[#17382b]" href="/login">Sign in</Link></p>
    </div>
  </AuthPageFrame>;
}
