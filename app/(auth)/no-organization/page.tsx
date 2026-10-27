import Link from 'next/link';
import { ArrowRight, Building2 } from 'lucide-react';
import AuthPageFrame from '@/components/auth/AuthPageFrame';

export default function NoOrganizationPage() {
  return <AuthPageFrame eyebrow="Farm workspace" headline="Your account needs a farm." description="Farm records are kept inside an organization so each farm’s workspace stays separate." details={['Create a farm workspace with a new account', 'Ask your farm administrator to add this account', 'Sign in with another account if needed']}>
    <div>
      <span className="grid size-12 place-items-center rounded-2xl bg-[#edf2e8] text-[#315c42]"><Building2 size={23} /></span>
      <h1 className="mt-5 font-serif text-4xl font-semibold tracking-tight text-[#1c2e25]">No farm is linked</h1>
      <p className="mt-3 text-base leading-7 text-[#657168]">This account is not connected to a farm organization yet. Create a farm account or ask your organization administrator for an invitation.</p>
      <div className="mt-8 grid gap-3">
        <Link className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-[#27563b] px-5 py-3 font-semibold text-white hover:bg-[#1e452f] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#477b55]/30" href="/signup">Create a farm account <ArrowRight size={17} /></Link>
        <Link className="inline-flex min-h-12 items-center justify-center rounded-xl border border-[#d9ddd2] px-5 py-3 font-semibold text-[#315c42] hover:bg-[#f4f6f0] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#477b55]/20" href="/login">Sign in with another account</Link>
      </div>
    </div>
  </AuthPageFrame>;
}
