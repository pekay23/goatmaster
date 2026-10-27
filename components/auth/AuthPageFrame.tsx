import Link from 'next/link';
import { ArrowUpRight, Sprout } from 'lucide-react';
import type { ReactNode } from 'react';

type AuthPageFrameProps = {
  children: ReactNode;
  eyebrow?: string;
  headline?: string;
  description?: string;
  details?: string[];
};

const defaultDetails = [
  'Keep herd profiles together',
  'Track health and breeding records',
  'Pick up your farm work where you left off',
];

export default function AuthPageFrame({
  children,
  eyebrow = 'Farm records, in one place',
  headline = 'Keep the herd in view.',
  description = 'A practical place for goat profiles, health notes, breeding records, and the work that happens between them.',
  details = defaultDetails,
}: AuthPageFrameProps) {
  return (
    <main className="min-h-dvh bg-[#f0efe6] px-3 py-4 text-[#1c2e25] sm:px-6 sm:py-6 lg:px-8 lg:py-8">
      <div className="mx-auto grid min-h-[min(780px,calc(100dvh-4rem))] max-w-6xl overflow-hidden rounded-[1.75rem] border border-[#d9ddd2] bg-[#fffefa] shadow-[0_18px_55px_rgba(31,49,38,0.09)] lg:grid-cols-[0.92fr_1.08fr]">
        <aside className="relative hidden flex-col justify-between overflow-hidden bg-[#17382b] p-10 text-[#f6f1e5] lg:flex xl:p-14">
          <svg aria-hidden="true" className="pointer-events-none absolute inset-0 h-full w-full opacity-[0.16]" viewBox="0 0 600 800" preserveAspectRatio="xMidYMid slice" fill="none">
            <path d="M-80 194C30 80 144 80 254 194s224 114 334 0M-80 230C30 116 144 116 254 230s224 114 334 0M-80 266C30 152 144 152 254 266s224 114 334 0M-80 302C30 188 144 188 254 302s224 114 334 0M-80 338C30 224 144 224 254 338s224 114 334 0" stroke="#d5bc76" strokeWidth="1.2" />
            <circle cx="476" cy="584" r="126" stroke="#d5bc76" />
            <circle cx="476" cy="584" r="94" stroke="#d5bc76" />
            <circle cx="476" cy="584" r="62" stroke="#d5bc76" />
          </svg>
          <Link href="/" className="relative z-10 inline-flex w-fit items-center gap-3 rounded-lg outline-none focus-visible:ring-2 focus-visible:ring-[#e1c77c] focus-visible:ring-offset-4 focus-visible:ring-offset-[#17382b]">
            <span className="grid size-11 place-items-center rounded-xl bg-[#e2c879] text-[#17382b]"><Sprout size={23} strokeWidth={2.2} /></span>
            <span className="text-lg font-semibold tracking-tight">GoatMaster</span>
          </Link>

          <div className="relative z-10 my-12 max-w-lg">
            <p className="mb-5 inline-flex items-center gap-2 text-xs font-semibold uppercase text-[#e5ce8b]">{eyebrow}</p>
            <p aria-hidden="true" className="max-w-md font-serif text-5xl leading-[1.06] tracking-tight xl:text-[3.65rem]">{headline}</p>
            <p className="mt-6 max-w-md text-base leading-7 text-[#e4e8dc]/80">{description}</p>
            <ul className="mt-9 space-y-4">
              {details.map(detail => <li key={detail} className="flex items-center gap-3 text-sm text-[#f1eee2]/90"><span className="grid size-6 place-items-center rounded-full border border-[#cbb879]/60 text-[#e3cc8a]">✓</span>{detail}</li>)}
            </ul>
          </div>

          <p className="relative z-10 text-xs text-[#e4e8dc]/60">A clearer notebook for the everyday work of a goat farm.</p>
        </aside>

        <section className="flex min-w-0 flex-col px-5 py-6 sm:px-10 sm:py-10 lg:px-12 xl:px-16">
          <div className="mb-9 flex items-center justify-between lg:mb-12">
            <Link href="/" className="inline-flex min-h-11 items-center gap-2 rounded-lg text-sm font-semibold text-[#315c42] outline-none hover:text-[#17382b] focus-visible:ring-2 focus-visible:ring-[#477b55] focus-visible:ring-offset-2 lg:invisible">
              <span className="grid size-9 place-items-center rounded-lg bg-[#e7eddf] text-[#315c42]"><Sprout size={19} /></span>GoatMaster
            </Link>
            <Link href="/" className="ml-auto inline-flex min-h-11 items-center gap-1 rounded-lg px-2 text-sm text-[#66746a] outline-none hover:text-[#17382b] focus-visible:ring-2 focus-visible:ring-[#477b55] focus-visible:ring-offset-2">Home <ArrowUpRight size={15} /></Link>
          </div>
          <div className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center pb-7">{children}</div>
          <footer className="flex flex-wrap items-center justify-between gap-3 border-t border-[#e7e8df] pt-5 text-xs text-[#68766b]">
            <span>GoatMaster · Ghana</span>
            <nav aria-label="Legal information" className="flex items-center gap-4">
              <Link className="min-h-11 content-center underline decoration-[#b6c1b2] underline-offset-4 hover:text-[#1c2e25]" href="/legal/privacy">Privacy</Link>
              <Link className="min-h-11 content-center underline decoration-[#b6c1b2] underline-offset-4 hover:text-[#1c2e25]" href="/legal/terms">Terms</Link>
            </nav>
          </footer>
        </section>
      </div>
    </main>
  );
}
