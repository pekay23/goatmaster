import LegalPage from '@/components/LegalPage';

export const metadata = {
  title: 'Privacy Policy — Goat Master',
  description: 'How Goat Master collects, uses, and protects your data.',
};

export default function PrivacyPolicy() {
  return (
    <LegalPage title="Privacy Policy" lastUpdated="May 2, 2026">

      <div className="legal-toc">
        <h3>Contents</h3>
        <ol>
          <li><a href="#summary">Privacy at a Glance</a></li>
          <li><a href="#scope">Who This Policy Applies To</a></li>
          <li><a href="#data-we-collect">Data We Collect</a></li>
          <li><a href="#how-we-use">How We Use Your Data</a></li>
          <li><a href="#sharing">Data Sharing & Third Parties</a></li>
          <li><a href="#camera-photos">Camera, Photos & On-Device AI</a></li>
          <li><a href="#storage">Data Storage & Security</a></li>
          <li><a href="#retention">Retention & Deletion</a></li>
          <li><a href="#your-rights">Your Rights</a></li>
          <li><a href="#children">Children's Privacy</a></li>
          <li><a href="#international">International Data Transfers</a></li>
          <li><a href="#changes">Changes to This Policy</a></li>
          <li><a href="#contact">Contact</a></li>
        </ol>
      </div>

      <h2 id="summary">1. Privacy at a Glance</h2>
      <p>
        Goat Master is a farm management app that helps you track your goat herd. We take your privacy
        seriously and follow Apple App Store, Google Play Store, and GDPR guidelines. Here's the short version:
      </p>
      <ul>
        <li><strong>What we collect:</strong> a username and password, plus the goat data you create.</li>
        <li><strong>What we do with it:</strong> we store it so you can use the app across devices.</li>
        <li><strong>What we don't do:</strong> we don't sell your data, we don't show ads, and we don't track you across other apps or websites.</li>
        <li><strong>Where it lives:</strong> on secure servers (Vercel, Neon PostgreSQL, Cloudinary).</li>
        <li><strong>You're in control:</strong> you can export, edit, or permanently delete everything at any time from the Settings tab.</li>
      </ul>

      <h2 id="scope">2. Who This Policy Applies To</h2>
      <p>
        This Privacy Policy describes how Goat Master ("we", "us", "our") collects, uses, and protects
        information about you ("you", "your") when you use our application, available as a web application
        and (in the future) as a mobile app on the Apple App Store and Google Play Store. By creating an
        account or using the Service, you agree to this Policy.
      </p>

      <h2 id="data-we-collect">3. Data We Collect</h2>

      <h3>3.1 Account Information</h3>
      <ul>
        <li><strong>Username</strong> — chosen by you during signup. Used to log in and uniquely identify your account.</li>
        <li><strong>Password</strong> — never stored as plain text. Hashed with bcrypt (12 rounds) before being saved.</li>
      </ul>

      <h3>3.2 Goat & Farm Data (User-Generated Content)</h3>
      <p>Information you create within the app to manage your herd, including:</p>
      <ul>
        <li>Goat names, breeds, sexes, dates of birth, ear tag numbers, QR codes, notes</li>
        <li>Photos of goats (uploaded by you or captured via the in-app camera)</li>
        <li>Health records: treatment dates, treatments given, due dates for follow-up care, notes</li>
        <li>Breeding records: dam, sire, breeding date, expected and actual kidding dates</li>
        <li>Visual fingerprints (numerical embedding vectors) extracted on-device from goat photos to enable AI-powered re-identification</li>
        <li>Scan history: which goat was matched, when, and at what confidence</li>
      </ul>

      <h3>3.3 Technical & Usage Data</h3>
      <p>Collected automatically when you use the Service, used to keep the app running and to improve performance:</p>
      <ul>
        <li>IP address (used only for rate-limiting and abuse prevention; not stored long-term)</li>
        <li>Browser type and version, operating system, device type</li>
        <li>Pages visited, time of access, and basic interaction events (via Vercel Analytics — fully anonymised)</li>
        <li>Performance metrics like load time and API response time (via Vercel Speed Insights — fully anonymised)</li>
      </ul>
      <p>
        We do <strong>not</strong> collect: your real name, email address, phone number, location data, advertising IDs,
        contacts, calendar, microphone audio, or any data from other apps on your device — unless you explicitly enter such data into a goat profile yourself.
      </p>

      <h3>3.4 Permissions Requested</h3>
      <p>The app may ask for the following device permissions, and only when needed for the relevant feature:</p>
      <ul>
        <li><strong>Camera</strong> — to take photos of goats for profiles, scanning, and breed identification.
          You can deny this and instead upload photos from your gallery.</li>
        <li><strong>Photo Library</strong> — to select existing photos to attach to a goat profile.</li>
      </ul>
      <p>
        We do <strong>not</strong> request: location, contacts, microphone, calendar, Bluetooth, motion, health,
        notifications (yet), or any other permission. You can revoke any granted permission from your device settings at any time.
      </p>

      <h2 id="how-we-use">4. How We Use Your Data</h2>
      <ul>
        <li><strong>Provide the Service</strong> — let you log in, view your herd, save records, and recognise goats.</li>
        <li><strong>Authenticate you</strong> — verify your password and keep your session active.</li>
        <li><strong>Operate AI features</strong> — match the visual fingerprints of scanned goats against the ones you've enrolled.</li>
        <li><strong>Send timely reminders</strong> — surface upcoming health treatments due within 7 days (in-app only; no email or push notifications are sent currently).</li>
        <li><strong>Improve the Service</strong> — analyse anonymised usage data to find bugs, optimise performance, and prioritise new features.</li>
        <li><strong>Comply with the law</strong> — respond to lawful legal requests if required.</li>
      </ul>
      <p>
        We do <strong>not</strong> use your data for: targeted advertising, profile-based marketing, sale to third parties,
        training of third-party AI models, or any purpose unrelated to running the app.
      </p>

      <h2 id="sharing">5. Data Sharing & Third Parties</h2>
      <p>
        We share data only with the service providers that physically operate parts of the app. Each is bound
        by a data processing agreement and processes data only to provide their service.
      </p>
      <table>
        <thead>
          <tr><th>Service</th><th>Purpose</th><th>Data Shared</th></tr>
        </thead>
        <tbody>
          <tr><td>Vercel</td><td>App hosting, analytics, performance monitoring</td><td>App requests, anonymised usage</td></tr>
          <tr><td>Neon</td><td>Managed PostgreSQL database</td><td>All app data (encrypted at rest)</td></tr>
          <tr><td>Cloudinary</td><td>Image hosting & delivery</td><td>Photos uploaded by you</td></tr>
        </tbody>
      </table>
      <p>
        We do <strong>not</strong> share your data with advertisers, data brokers, or social media platforms.
      </p>

      <h2 id="camera-photos">6. Camera, Photos & On-Device AI</h2>
      <p>
        Goat Master uses your device camera (with your permission) to scan goats for identification and breed detection.
        Here's exactly what happens to a photo when you scan a goat:
      </p>
      <ol>
        <li>The camera frame is captured locally on your device.</li>
        <li>A pre-trained AI model (MobileNetV2) runs <strong>entirely on your device</strong> to extract a numerical "fingerprint" (1024 numbers) from the image. The model is downloaded once and cached.</li>
        <li>The fingerprint is compared against fingerprints stored in our database for your existing goats.</li>
        <li>The frame itself is sent to our server only when you save it as a profile photo or training photo. Otherwise, it stays on your device and is discarded.</li>
        <li>If you save a photo, it's uploaded to Cloudinary (encrypted in transit via HTTPS) and the URL is stored in your goat record.</li>
      </ol>
      <p>
        <strong>Optical Character Recognition (OCR)</strong> for ear tag numbers also runs entirely on-device using Tesseract.js — no images are sent for OCR processing.
      </p>

      <h2 id="storage">7. Data Storage & Security</h2>
      <p>We protect your data with industry-standard practices:</p>
      <ul>
        <li><strong>Encryption in transit:</strong> all communication uses HTTPS/TLS 1.3.</li>
        <li><strong>Encryption at rest:</strong> the database is encrypted at the disk level by Neon.</li>
        <li><strong>Password hashing:</strong> bcrypt with cost factor 12 — passwords are never stored or transmitted in clear text.</li>
        <li><strong>Authentication tokens:</strong> JSON Web Tokens stored as <code>httpOnly</code> cookies — invisible to JavaScript and resistant to XSS.</li>
        <li><strong>Multi-tenancy:</strong> every database query is scoped to your user ID. Other users cannot access your data.</li>
        <li><strong>Rate limiting:</strong> repeated failed login attempts from one IP are throttled.</li>
        <li><strong>Server location:</strong> data is stored in regional data centres operated by our service providers, generally in the EU or USA depending on the region nearest to you.</li>
      </ul>
      <p>
        While we use commercially reasonable measures, no internet-based service can guarantee absolute security.
        If we ever experience a breach affecting your data, we will notify you within 72 hours where practicable.
      </p>

      <h2 id="retention">8. Retention & Deletion</h2>
      <ul>
        <li><strong>While your account is active</strong>, we retain all your data so the app remains usable.</li>
        <li><strong>You can delete your account at any time</strong> from Settings → Account → Delete Account. This permanently and immediately removes your goats, photos, health logs, breeding logs, embeddings, and scan history.</li>
        <li><strong>Inactive accounts</strong> are not auto-deleted, but you can email us to remove them.</li>
        <li><strong>Backups</strong> are kept for up to 30 days for disaster recovery; deleted data is permanently removed from backups within 30 days.</li>
      </ul>

      <h2 id="your-rights">9. Your Rights</h2>
      <p>You have the right to:</p>
      <ul>
        <li><strong>Access</strong> — view all your data within the app (Profiles tab, Reports tab).</li>
        <li><strong>Export</strong> — download CSV or PDF reports of your herd, health, and breeding data from the Reports tab.</li>
        <li><strong>Rectify</strong> — edit any goat profile, log entry, or your own profile at any time.</li>
        <li><strong>Erase</strong> — permanently delete your account and all data via Settings.</li>
        <li><strong>Restrict processing</strong> — stop using the app at any time. Email us if you'd like us to suspend rather than delete your account.</li>
        <li><strong>Object</strong> — opt out of analytics by using a privacy-focused browser or extension. We honour browser DNT signals.</li>
        <li><strong>Lodge a complaint</strong> — if you believe we've violated your privacy rights, you can complain to your local data protection authority (e.g. the ICO in the UK, the CNIL in France, or the Data Protection Commission in Ghana).</li>
      </ul>

      <h2 id="children">10. Children's Privacy</h2>
      <p>
        Goat Master is not intended for children under <strong>13 years of age</strong> (or 16 in the European Economic Area, where local law sets a higher threshold). We do not knowingly collect data from children under these ages.
      </p>
      <p>
        If you believe a child has created an account, please contact us at the address below and we will delete the account promptly.
      </p>

      <h2 id="international">11. International Data Transfers</h2>
      <p>
        Our service providers may store and process data in countries different from yours. Where transfers
        happen, they are protected by Standard Contractual Clauses (SCCs) approved by the European
        Commission, or equivalent safeguards. By using the Service, you consent to your data being processed in these jurisdictions.
      </p>

      <h2 id="changes">12. Changes to This Policy</h2>
      <p>
        We may update this Privacy Policy from time to time. We will notify you of material changes by:
      </p>
      <ul>
        <li>Updating the "Last updated" date at the top of this page</li>
        <li>Showing an in-app notice on your next sign-in</li>
        <li>Where required by law, requesting your renewed consent</li>
      </ul>
      <p>Continued use of the Service after changes take effect means you accept the updated Policy.</p>

      <h2 id="contact">13. Contact</h2>
      <p>For privacy questions, data requests, or to exercise any of the rights listed above:</p>
      <ul>
        <li><strong>Email:</strong> <a href="mailto:samuel.hughes.23@outlook.com">samuel.hughes.23@outlook.com</a></li>
        <li><strong>Phone:</strong> +233 55 441 6937</li>
        <li><strong>Country:</strong> Ghana</li>
      </ul>
      <p>We respond to data requests within 30 days where required by law (e.g. GDPR, CCPA).</p>
    </LegalPage>
  );
}
