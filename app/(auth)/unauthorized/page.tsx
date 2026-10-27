import Link from 'next/link';
import { ArrowLeft, LockKeyhole } from 'lucide-react';
import AuthPageFrame from '@/components/auth/AuthPageFrame';

export default function UnauthorizedPage() {
  return <AuthPageFrame eyebrow="Access check" headline="The right key for the right door." description="GoatMaster keeps tenant farm accounts and administrator access separate." details={['Farm accounts use the tenant sign-in', 'Administrator accounts use a separate sign-in', 'Your current account cannot open this page']}>
    <div>
      <span className="grid size-12 place-items-center rounded-2xl bg-[#f8eee5] text-[#986132]"><LockKeyhole size={23} /></span>
      <h1 className="mt-5 font-serif text-4xl font-semibold tracking-tight text-[#1c2e25]">You don’t have access</h1>
      <p className="mt-3 text-base leading-7 text-[#657168]">This page requires permissions that are not attached to your current account. If you’re an administrator, use the separate admin sign-in.</p>
      <div className="mt-8 grid gap-3">
        <Link className="inline-flex min-h-12 items-center justify-center rounded-xl bg-[#27563b] px-5 py-3 font-semibold text-white hover:bg-[#1e452f] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#477b55]/30" href="/admin-login">Go to administrator sign-in</Link>
        <Link className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl border border-[#d9ddd2] px-5 py-3 font-semibold text-[#315c42] hover:bg-[#f4f6f0] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#477b55]/20" href="/"><ArrowLeft size={16} /> Return to GoatMaster</Link>
      </div>
    </div>
  </AuthPageFrame>;
}
