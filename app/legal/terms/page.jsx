import Link from 'next/link';
import LegalPage from '@/components/LegalPage';

export const metadata = {
  title: 'Terms of Service — GoatMaster',
  description: 'Terms for using the GoatMaster farm-management service.',
  openGraph: {
    title: 'Terms of Service — GoatMaster',
    description: 'Terms for using the GoatMaster farm-management service.',
    url: 'https://goatmaster-tau.vercel.app/legal/terms',
    siteName: 'GoatMaster',
    locale: 'en_GH',
    type: 'website',
  },
};

export default function TermsOfService() {
  return (
    <LegalPage title="Terms of Service" lastUpdated="October 26, 2026">
      <p>These Terms govern your use of GoatMaster, a web-based farm and herd-management service operated from Ghana. By creating an account or using the service, you agree to these Terms and the <Link href="/legal/privacy">Privacy Policy</Link>. If you do not agree, do not use the service.</p>

      <h2 id="service">The service</h2>
      <p>GoatMaster provides tools for maintaining farm and herd records. Depending on your plan and the features currently available, the service may include goat profiles, health and breeding records, events, inventory, reports, exports, and Smart Scan. Features can change, and some features are limited by plan or configuration.</p>
      <p>Smart Scan results are estimates. They may be incomplete or wrong and are not veterinary, agricultural, financial, or other professional advice. Review records and scan results before relying on them.</p>

      <h2 id="accounts">Accounts and eligibility</h2>
      <ul>
        <li>Provide a valid email address, username, and password. The current signup flow requires a password of at least 10 characters.</li>
        <li>You are responsible for keeping your password confidential and for activity under your account. Contact us promptly if you suspect unauthorized access.</li>
        <li>You must be legally able to enter into these Terms. If you are not, use the service only with the permission and supervision of a parent or legal guardian where permitted by law.</li>
        <li>Keep your account and farm information accurate and up to date.</li>
      </ul>

      <h2 id="content">Your content</h2>
      <p>You retain your rights to the farm information, notes, and images you submit. You give GoatMaster permission to host, store, display, and process that content as needed to provide the features you use, protect the service, and support your account. When you submit an image to Smart Scan, it is forwarded to the configured machine-learning service for processing as described in the <Link href="/legal/privacy">Privacy Policy</Link>.</p>
      <p>You are responsible for having the rights and permissions needed to submit content. Do not upload content that violates another person’s rights or applicable law.</p>

      <h2 id="acceptable-use">Acceptable use</h2>
      <p>Do not use GoatMaster to break the law, access another person’s account or data, disrupt the service, bypass security or plan limits, distribute harmful code, or interfere with other users. Do not probe the service for vulnerabilities without written authorization. We may restrict or suspend access when reasonably necessary to protect users, the service, or comply with law.</p>

      <h2 id="providers">Third-party services</h2>
      <p>GoatMaster relies on service providers for hosting, database, payment, optional analytics, and Smart Scan processing. The providers used for a particular feature or deployment are described in the <Link href="/legal/privacy">Privacy Policy</Link>. When you use a third-party checkout or service, that provider’s terms may also apply.</p>

      <h2 id="payments">Plans and payments</h2>
      <p>GoatMaster has a free plan and may offer paid plans. The current price, currency, billing interval, and plan details are shown in the app before checkout. Paid-plan checkout is handled through Paystack when configured. Any payment method offered depends on the checkout provider and your location.</p>
      <p>Do not submit payment unless the checkout page displays the plan and amount you intend to purchase. Questions about a charge, cancellation, or refund can be sent to <a href="mailto:samuel.hughes.23@outlook.com">samuel.hughes.23@outlook.com</a>. Any refund or cancellation rights required by law continue to apply.</p>

      <h2 id="availability">Availability and changes</h2>
      <p>We may update, suspend, or discontinue parts of the service. We will take reasonable steps to provide notice when appropriate, subject to security, legal, and operational needs. We do not promise uninterrupted or error-free access.</p>

      <h2 id="termination">Account closure and suspension</h2>
      <p>You may request account deletion through the account settings flow, which requires your current password. An organization owner must transfer ownership before deleting their account. Deletion removes the user account through the available deletion process; related records may remain where needed for service operation, security, legal obligations, payment records, or backups. Contact us if you need help with an account request.</p>
      <p>We may suspend or end access for material violations of these Terms, legal requirements, or where necessary to protect the service or its users. Where appropriate, we will provide notice and an opportunity to address the issue.</p>

      <h2 id="disclaimer">Disclaimers</h2>
      <p>GoatMaster is a record-keeping tool, not a substitute for professional veterinary, agricultural, or business advice. The service is provided as available. To the extent permitted by law, we disclaim implied warranties and do not guarantee that records, scan results, or service availability will meet every user’s needs.</p>

      <h2 id="liability">Limitation of liability</h2>
      <p>To the extent permitted by applicable law, GoatMaster will not be liable for indirect or consequential loss arising from use of the service, including loss of profits, records, or business opportunities. Nothing in these Terms excludes liability or consumer rights that cannot lawfully be excluded or limited. Keep copies of important farm records and review exports where available.</p>

      <h2 id="law">Governing law and disputes</h2>
      <p>These Terms are governed by the laws of Ghana, subject to mandatory consumer protections that apply to you. Contact us first so we can try to resolve a concern: <a href="mailto:samuel.hughes.23@outlook.com">samuel.hughes.23@outlook.com</a>. Any court proceedings are subject to applicable law and mandatory consumer rights.</p>

      <h2 id="changes">Changes to these Terms</h2>
      <p>We may revise these Terms as the service or legal requirements change. The date above indicates when this page was last revised. We will provide any notice or obtain any acceptance required by applicable law.</p>

      <h2 id="contact">Contact</h2>
      <p>For questions about these Terms, contact GoatMaster at <a href="mailto:samuel.hughes.23@outlook.com">samuel.hughes.23@outlook.com</a>. The service is operated from Accra, Ghana.</p>
    </LegalPage>
  );
}
