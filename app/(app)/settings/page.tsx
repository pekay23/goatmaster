'use client';
import { useRouter } from 'next/navigation';
import { FormEvent, useEffect, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useSync } from '@/lib/context/SyncContext';
import { useTier } from '@/lib/context/TierContext';
import Link from 'next/link';

type Profile = { user: { username: string; email: string }; organization: { name: string; tier: string; subscription_status: string | null }; payments: Array<{ reference: string; amount: number; status: string; created_at: string }> };
type Plan = { id: string; name: string; price_cents: number };
async function json(url: string, init?: RequestInit) {
  const response = await fetch(url, init);
  const data = await response.json();
  if (!response.ok) throw new Error(data.error || 'Request failed');
  return data;
}
export default function SettingsPage() {
  const queryClient = useQueryClient();
  const router = useRouter();
  const { isOnline, isSyncing, pendingCount, lastSynced, triggerSync, error: syncError } = useSync();
  const { tier, features } = useTier();
  const [message, setMessage] = useState('');
  const [storage, setStorage] = useState<number | null>(null);
  const profile = useQuery<Profile>({ queryKey: ['settings'], queryFn: () => json('/api/app/settings') });
  const plans = useQuery<Plan[]>({ queryKey: ['plans'], queryFn: () => json('/api/public/tiers') });
  useEffect(() => { void navigator.storage?.estimate().then(estimate => setStorage(estimate.usage ?? null)); }, []);
  const save = useMutation({ mutationFn: (body: Record<string, string>) => json('/api/app/settings', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) }), onSuccess: () => { setMessage('Saved.'); void queryClient.invalidateQueries({ queryKey: ['settings'] }); } });
  const checkout = useMutation({ mutationFn: (plan: string) => json('/api/billing/initialize', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ tier: plan, interval: 'monthly' }) }), onSuccess: data => { const url = new URL(data.authorization_url); if (url.protocol === 'https:' && (url.hostname === 'checkout.paystack.com' || url.hostname.endsWith('.paystack.com'))) window.location.assign(url.href); else setMessage('Payment provider returned an invalid checkout link.'); } });
  function submit(event: FormEvent<HTMLFormElement>) { event.preventDefault(); setMessage(''); const values: Record<string, string> = {}; for (const [key, value] of new FormData(event.currentTarget)) if (typeof value === 'string') values[key] = value; save.mutate(values); }
  async function logout() { try { await json('/api/auth/logout', { method: 'POST' }); localStorage.removeItem('goatmaster-session-scope'); queryClient.clear(); router.replace('/login'); router.refresh(); } catch (error) { setMessage(error instanceof Error ? error.message : 'Sign out failed'); } }
  if (profile.isLoading) return <p role="status">Loading settings…</p>;
  if (profile.error || !profile.data) return <p role="alert">{profile.error?.message || 'Unable to load settings'}</p>;
  const input = 'mt-1 block w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-slate-900';
  const button = 'rounded-lg bg-green-800 px-4 py-2 font-semibold text-white disabled:opacity-50';
  const section = 'space-y-4 rounded-2xl border border-slate-200 bg-white p-5';
  return <div className="mx-auto max-w-3xl space-y-6"><h1 className="text-3xl font-semibold">Settings</h1><nav aria-label="Settings sections" className="flex flex-wrap gap-4 text-sm underline"><a href="#profile">Profile</a><a href="#password">Password</a><a href="#sync">Sync</a><a href="#billing">Billing</a></nav>{(message || save.error || checkout.error) && <p role="status" className="rounded-lg border p-3">{save.error?.message || checkout.error?.message || message}</p>}
  <section id="profile" className={section}><h2 className="text-xl font-semibold">Profile</h2><p>{profile.data.organization.name.replace(/(?:'s|’s)\s+Farm$/i, '')}</p><form onSubmit={submit} className="space-y-4"><label className="block">Name<input name="username" className={input} defaultValue={profile.data.user.username} required maxLength={100}/></label><label className="block">Email<input className={input} value={profile.data.user.email} readOnly type="email"/></label><button className={button} disabled={save.isPending}>Save profile</button></form></section>
  <section id="password" className={section}><h2 className="text-xl font-semibold">Change password</h2><p className="text-sm text-slate-600">Changing your password signs out your other sessions.</p><form onSubmit={submit} className="space-y-4"><label className="block">Current password<input className={input} name="currentPassword" type="password" autoComplete="current-password" required/></label><label className="block">New password<input className={input} name="newPassword" type="password" autoComplete="new-password" minLength={10} required/></label><button className={button} disabled={save.isPending}>Change password</button></form></section>
  <section id="sync" className={section}><h2 className="text-xl font-semibold">Sync and storage</h2><p>{isOnline ? 'Online' : 'Offline'} · {pendingCount} pending changes</p><p>Last synced: {lastSynced ? lastSynced.toLocaleString() : 'Never'}</p><p>Browser storage: {storage === null ? 'Not available in this browser' : (storage / 1048576).toFixed(2) + ' MB'}</p>{syncError && <p role="alert">{syncError}</p>}<button className={button} disabled={!isOnline || isSyncing || pendingCount === 0} onClick={() => void triggerSync()}>{isSyncing ? 'Syncing…' : 'Sync now'}</button></section>
  <section id="billing" className={section}><h2 className="text-xl font-semibold">Billing</h2><p className="capitalize">Current plan: {tier} · {profile.data.organization.subscription_status || 'No paid subscription'}</p><p>Goat limit: {features?.maxGoats === -1 ? 'Unlimited' : features?.maxGoats ?? 'Loading'}</p><div className="flex flex-wrap gap-3">{plans.data?.filter(plan => plan.price_cents > 0 && plan.id !== tier).map(plan => <button key={plan.id} className={button} disabled={checkout.isPending} onClick={() => checkout.mutate(plan.id)}>{plan.name} · GHS {(plan.price_cents / 100).toFixed(2)}/month</button>)}</div>{plans.error && <p role="alert">Unable to load plans.</p>}<Link className="font-semibold underline" href="/plans">Compare plans</Link><h3 className="font-semibold">Recent payments</h3>{profile.data.payments.length ? <ul className="space-y-2">{profile.data.payments.map(payment => <li key={payment.reference}>{new Date(payment.created_at).toLocaleDateString()} · GHS {(payment.amount / 100).toFixed(2)} · {payment.status}</li>)}</ul> : <p>No payment records.</p>}</section><button type="button" className="rounded-lg border border-slate-300 px-4 py-2" onClick={() => void logout()}>Sign out</button></div>;
}
