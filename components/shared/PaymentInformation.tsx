export default function PaymentInformation() {
  const email = process.env.NEXT_PUBLIC_BILLING_SUPPORT_EMAIL?.trim();
  const phone = process.env.NEXT_PUBLIC_BILLING_SUPPORT_PHONE?.trim();

  return <aside className="mt-8 rounded-2xl border border-slate-200 bg-white p-5 sm:p-6" aria-labelledby="payment-information-title">
    <h2 id="payment-information-title" className="font-serif text-xl font-semibold text-slate-900">Payment options</h2>
    <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">Paid plans use Paystack checkout. The methods available depend on the merchant account and may include Mobile Money (such as MTN MoMo or Telecel Cash where enabled), bank cards (Visa or Mastercard where supported), bank transfer, or USSD. Paystack shows the available methods before payment.</p>
    <div className="mt-4 border-t border-slate-100 pt-4 text-sm text-slate-700">
      <p className="font-medium text-slate-900">Need help with another payment option?</p>
      {(email || phone) ? <div className="mt-2 flex flex-wrap gap-x-5 gap-y-2">{email && <a className="min-h-11 content-center text-green-900 underline underline-offset-4" href={'mailto:' + email}>{email}</a>}{phone && <a className="min-h-11 content-center text-green-900 underline underline-offset-4" href={'tel:' + phone}>{phone}</a>}</div> : <p className="mt-1 text-slate-600">Payment support contact details can be added when they are ready to publish.</p>}
    </div>
  </aside>;
}
