import LegalPage from '@/components/LegalPage';

export const metadata = {
  title: 'Privacy Policy — GoatMaster',
  description: 'How GoatMaster handles account, farm, scan, and payment information.',
  openGraph: {
    title: 'Privacy Policy — GoatMaster',
    description: 'How GoatMaster handles account, farm, scan, and payment information.',
    url: 'https://goatmaster-tau.vercel.app/legal/privacy',
    siteName: 'GoatMaster',
    locale: 'en_GH',
    type: 'website',
  },
};

export default function PrivacyPolicy() {
  return (
    <LegalPage title="Privacy Policy" lastUpdated="October 26, 2026">
      <p>
        This policy explains what information GoatMaster processes when you use the GoatMaster web application,
        why it is used, and how to contact us about it. The application is operated from Ghana. For privacy
        questions or requests, contact <a href="mailto:samuel.hughes.23@outlook.com">samuel.hughes.23@outlook.com</a>.
      </p>

      <h2 id="data-we-collect">Information processed</h2>
      <ul>
        <li><strong>Account details:</strong> email address, username, and a password hash. GoatMaster does not store your password in plain text. Email is used as your account identifier and for sign-in; account creation does not currently include an email verification step.</li>
        <li><strong>Farm and herd records:</strong> farm or organization name, goat profiles and photo references, ear tags, health and treatment records, breeding details, events, inventory, and information you enter in notes or other fields.</li>
        <li><strong>Scan information:</strong> when you use Smart Scan, the submitted image is sent from the app to the GoatMaster server and then to the configured machine-learning service. GoatMaster records scan time, result, match information, and confidence when available. The scan service must be configured for this feature to work.</li>
        <li><strong>Billing records:</strong> when you start a paid-plan checkout, GoatMaster records the payment reference, email, plan, amount, and payment status. Payment details are handled through Paystack checkout; GoatMaster does not receive or store your full card number or security code.</li>
        <li><strong>Security and diagnostic information:</strong> request and audit records may include IP address, user agent, account or organization identifiers, and actions taken in the service. IP addresses and user agents can therefore be retained in audit records, not only used for rate limiting.</li>
        <li><strong>Optional product analytics:</strong> if analytics is enabled for the deployment, the app initializes PostHog for page-view measurement. The app can also send named events or identify a user when those functions are called. Analytics availability and host depend on deployment configuration.</li>
      </ul>

      <h2 id="use">How information is used</h2>
      <p>GoatMaster uses this information to provide sign-in, farm records, plan entitlements, billing, Smart Scan, security controls, support, and service diagnostics. Analytics, if enabled, is used to understand product usage. GoatMaster does not sell personal information or use farm records for targeted advertising.</p>

      <h2 id="sharing">Service providers and sharing</h2>
      <p>Information is processed by providers needed to run features you use. The current project configuration identifies these providers and regions:</p>
      <ul>
        <li><strong>Vercel</strong> hosts the web application. Its server-side functions are configured for Washington, D.C., United States (region iad1). Requests may pass through Vercel’s global network.</li>
        <li><strong>Neon</strong> provides the PostgreSQL database. The database connection configured in the local production environment points to AWS us-east-1 in the United States. The database region should be confirmed against the current Vercel production connection setting.</li>
        <li><strong>Fly.io</strong> hosts the Smart Scan machine-learning service. Its deployment configuration sets the primary region to iad (Ashburn, Virginia, United States). The live machine placement could not be independently confirmed from the available account access.</li>
        <li><strong>Paystack</strong> handles paid-plan checkout and payment processing. Its processing location was not confirmed during this review.</li>
        <li><strong>PostHog</strong> is included for optional analytics and the local configuration points to its EU endpoint. It only runs when a public project key is configured; no such key is present in the Vercel production project settings checked for this review.</li>
      </ul>
      <p>GoatMaster may also disclose information when required by law, to protect the service and its users, or as part of a business transfer. Provider terms and privacy notices apply to the services they operate. These deployment regions are not all in the EU; some providers may process information elsewhere.</p>

      <h2 id="photos-and-scans">Photos, camera, and Smart Scan</h2>
      <p>The browser asks for camera access only when you choose to use the camera. A submitted Smart Scan image is sent to GoatMaster’s server and forwarded to the configured machine-learning service for processing; the image is not processed entirely on your device. GoatMaster stores scan history and may store photo URLs that you add to farm records. The application code does not establish Cloudinary as the photo-storage provider.</p>
      <p>Scan results are estimates for record keeping and should be reviewed. Do not submit an image unless you have the right to use it.</p>

      <h2 id="security">Security</h2>
      <p>GoatMaster uses password hashing, secure session cookies in production, access controls, and database row-level security. No online service can guarantee that information will always be secure. Do not share your password, and contact us if you believe your account has been accessed without permission.</p>

      <h2 id="retention">Retention and account deletion</h2>
      <p>Account and farm information is retained while needed to provide the service. You can request account deletion through the account settings flow, which requires your current password. An organization owner must transfer ownership before deleting their account. The deletion route removes the user account; some related records, payment records, audit records, or backups may remain where needed to operate the service, meet legal obligations, prevent abuse, or restore the system. The application does not promise immediate removal from all backups or third-party systems.</p>

      <h2 id="your-choices">Access, correction, and privacy requests</h2>
      <p>You can view and edit available farm and account information in the app. Report exports are available in the app where the relevant feature is enabled for your plan. To ask about, correct, or request deletion of personal information, email <a href="mailto:samuel.hughes.23@outlook.com">samuel.hughes.23@outlook.com</a>. We will respond in the time required by applicable law. You may also contact the Data Protection Commission in Ghana or another supervisory authority applicable to you.</p>

      <h2 id="children">Children</h2>
      <p>GoatMaster is a farm-management service and is not designed for children. If you believe a child has provided personal information, contact us so we can review the request and take appropriate action under applicable law.</p>

      <h2 id="transfers">International processing</h2>
      <p>Application functions and the configured Smart Scan service are in the eastern United States; the project’s local production database connection points to a United States region. Optional analytics is configured for an EU endpoint but is not enabled in the Vercel production project settings checked for this review. Paystack and provider support or operational systems may process information in other locations. Contact us if you need details about the providers used for your account.</p>

      <h2 id="changes">Changes to this policy</h2>
      <p>We may revise this policy as the service changes or legal requirements evolve. The date at the top indicates when this page was last revised. We will provide any notice or obtain any consent required by applicable law.</p>

      <h2 id="contact">Contact</h2>
      <p>For privacy questions and requests, contact GoatMaster at <a href="mailto:samuel.hughes.23@outlook.com">samuel.hughes.23@outlook.com</a>. The service is operated from Accra, Ghana.</p>
    </LegalPage>
  );
}
