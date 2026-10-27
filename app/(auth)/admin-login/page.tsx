'use client';
import { FormEvent, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import AuthPageFrame from '@/components/auth/AuthPageFrame';
export default function AdminLoginPage() {
 const router=useRouter(); const [error,setError]=useState(''); const [busy,setBusy]=useState(false);
 async function submit(event:FormEvent<HTMLFormElement>) { event.preventDefault(); setBusy(true); setError(''); const form=new FormData(event.currentTarget); try { const response=await fetch('/api/admin/auth/login',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({email:form.get('email'),password:form.get('password')})}); const result=await response.json(); if(!response.ok) throw new Error(result.error||'Unable to sign in'); const requested=new URLSearchParams(window.location.search).get('redirect'); router.replace(requested&&/^\/admin(?:\/|$)/.test(requested)?requested:'/admin'); } catch(cause) { setError(cause instanceof Error?cause.message:'Unable to sign in'); setBusy(false); } }
 return <AuthPageFrame eyebrow="GoatMaster administration" headline="A clearer view of farm operations." description="Restricted sign-in for people who manage GoatMaster accounts and plans." details={['Manage accounts and organizations', 'Review plans and billing settings', 'Use an administrator account'] }>
  <div>
   <p className="text-sm font-semibold text-[#47734f]">Administrator access</p>
   <h1 className="mt-2 font-serif text-4xl font-semibold tracking-tight text-[#1c2e25]">Sign in to admin</h1>
   <p className="mt-3 text-base leading-7 text-[#657168]">Use an account with administrator permissions.</p>
   <form onSubmit={submit} className="mt-8 space-y-5">
    <label className="block text-sm font-semibold text-[#32463a]">Email<input className="mt-2 min-h-12 w-full rounded-xl border border-[#d9ddd2] bg-white px-4 text-base outline-none transition-colors focus:border-[#477b55] focus:ring-4 focus:ring-[#477b55]/10" type="email" name="email" autoComplete="username" required /></label>
    <label className="block text-sm font-semibold text-[#32463a]">Password<input className="mt-2 min-h-12 w-full rounded-xl border border-[#d9ddd2] bg-white px-4 text-base outline-none transition-colors focus:border-[#477b55] focus:ring-4 focus:ring-[#477b55]/10" type="password" name="password" autoComplete="current-password" required /></label>
    {error && <p role="alert" className="rounded-xl border border-[#e7b7aa] bg-[#fff2ee] px-4 py-3 text-sm text-[#8f3425]">{error}</p>}
    <button className="min-h-12 w-full rounded-xl bg-[#27563b] px-5 py-3 font-semibold text-white transition-colors hover:bg-[#1e452f] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#477b55]/30 disabled:cursor-wait disabled:opacity-60" disabled={busy}>{busy ? 'Signing in…' : 'Sign in to admin'}</button>
   </form>
   <p className="mt-7 text-sm text-[#657168]">Tenant account? <Link className="font-semibold text-[#27563b] underline decoration-[#aac0a6] underline-offset-4 hover:text-[#17382b]" href="/login">Sign in to your farm</Link></p>
  </div>
 </AuthPageFrame>;
}
