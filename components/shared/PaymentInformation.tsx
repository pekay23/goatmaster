import { CreditCard, Mail, Phone, Smartphone } from 'lucide-react';
import { useId } from 'react';
import { cn } from '@/lib/utils';

export default function PaymentInformation({ variant = 'portal' }: { variant?: 'marketing' | 'portal' }) {
  const headingId = useId();
  const email = process.env.NEXT_PUBLIC_BILLING_SUPPORT_EMAIL?.trim();
  const phone = process.env.NEXT_PUBLIC_BILLING_SUPPORT_PHONE?.trim();
  const marketing = variant === 'marketing';

  return <aside className={cn('payment-panel', marketing ? 'payment-panel--marketing' : 'mt-8 rounded-2xl border border-slate-200 bg-white p-5 sm:p-6')} aria-labelledby={headingId}>
    <div className={cn('payment-panel-intro', marketing ? undefined : 'mb-5')}>
      <p className={cn('payment-panel-eyebrow', marketing ? undefined : 'mb-2 text-xs font-semibold text-green-900')}>Payment options</p>
      <h3 id={headingId} className={cn('payment-panel-title', marketing ? undefined : 'text-balance font-serif text-2xl text-slate-900')}>Know how you pay.<br/>Before you commit.</h3>
      <p className={cn('payment-panel-description', marketing ? undefined : 'mt-3 max-w-2xl text-pretty text-sm leading-6 text-slate-600')}>Paid plans use Paystack checkout. Review the amount and payment method before confirming your subscription.</p>
      <span className={cn('payment-panel-provider', marketing ? undefined : 'mt-4 inline-flex items-center gap-2 text-xs font-medium text-slate-600')}><span aria-hidden="true" className="payment-provider-mark"/>Checkout by Paystack</span>
    </div>
    <div className="payment-panel-details">
      <ul className={cn('payment-methods', marketing ? undefined : 'divide-y divide-slate-200')} aria-label="Payment methods and availability">
        <li className={cn('payment-method', marketing ? undefined : 'flex gap-4 py-4')}>
          <CreditCard className={cn('payment-method-icon', marketing ? undefined : 'size-6 shrink-0 text-green-900')} aria-hidden="true"/>
          <div><h4 className={cn('payment-method-title', marketing ? undefined : 'font-semibold text-slate-900')}>Debit &amp; credit cards</h4><p className={cn('payment-method-description', marketing ? undefined : 'mt-1 text-pretty text-sm leading-6 text-slate-600')}>For subscription payments and automatic renewals.</p><div className={cn('payment-method-brands', marketing ? undefined : 'mt-3 flex flex-wrap gap-2')}><span>Visa</span><span>Mastercard</span></div></div>
        </li>
        <li className={cn('payment-method', marketing ? undefined : 'flex gap-4 py-4')}>
          <Smartphone className={cn('payment-method-icon', marketing ? undefined : 'size-6 shrink-0 text-green-900')} aria-hidden="true"/>
          <div><h4 className={cn('payment-method-title', marketing ? undefined : 'font-semibold text-slate-900')}>Mobile Money</h4><p className={cn('payment-method-description', marketing ? undefined : 'mt-1 text-pretty text-sm leading-6 text-slate-600')}>MTN MoMo and Telecel Cash do not support automatic subscription renewals through Paystack.</p><p className={cn('payment-method-note', marketing ? undefined : 'mt-2 text-sm font-medium text-slate-700')}>{email || phone ? 'Contact us to ask about another payment arrangement.' : 'Currently unavailable for subscription checkout.'}</p></div>
        </li>
      </ul>
      {(email || phone) && <div className={cn('payment-panel-support', marketing ? undefined : 'mt-4 border-t border-slate-200 pt-4')}><p>Questions before upgrading?</p><div className={cn('payment-support-links', marketing ? undefined : 'mt-2 flex flex-wrap gap-x-5 gap-y-2')}>{email && <a className="inline-flex min-h-11 min-w-0 items-center gap-2 break-all underline underline-offset-4" href={'mailto:' + email}><Mail size={16} className="shrink-0" aria-hidden="true"/>{email}</a>}{phone && <a className="inline-flex min-h-11 items-center gap-2 underline underline-offset-4" href={'tel:' + phone}><Phone size={16} aria-hidden="true"/>{phone}</a>}</div></div>}
    </div>
  </aside>;
}
