import LegalPage from '@/components/LegalPage';

export const metadata = {
  title: 'Terms of Service — Goat Master',
  description: 'Terms governing your use of Goat Master.',
};

export default function TermsOfService() {
  return (
    <LegalPage title="Terms of Service" lastUpdated="May 2, 2026">

      <div className="legal-toc">
        <h3>Contents</h3>
        <ol>
          <li><a href="#acceptance">Acceptance of Terms</a></li>
          <li><a href="#service">The Service</a></li>
          <li><a href="#eligibility">Eligibility & Account</a></li>
          <li><a href="#user-content">Your Content</a></li>
          <li><a href="#license">License We Grant You</a></li>
          <li><a href="#prohibited">Acceptable Use</a></li>
          <li><a href="#third-party">Third-Party Services</a></li>
          <li><a href="#payment">Payment & Subscriptions</a></li>
          <li><a href="#disclaimers">Disclaimers</a></li>
          <li><a href="#liability">Limitation of Liability</a></li>
          <li><a href="#indemnification">Indemnification</a></li>
          <li><a href="#termination">Termination</a></li>
          <li><a href="#disputes">Disputes & Governing Law</a></li>
          <li><a href="#changes">Changes to These Terms</a></li>
          <li><a href="#contact">Contact</a></li>
        </ol>
      </div>

      <h2 id="acceptance">1. Acceptance of Terms</h2>
      <p>
        Welcome to Goat Master. These Terms of Service ("Terms") form a legally binding agreement between you ("you", "your")
        and Goat Master ("we", "us", "our"). By creating an account, accessing, or using the Goat Master application
        (the "Service"), you agree to be bound by these Terms and our <a href="/legal/privacy">Privacy Policy</a>.
      </p>
      <p><strong>If you do not agree, do not use the Service.</strong></p>

      <h2 id="service">2. The Service</h2>
      <p>
        Goat Master is a digital herd-management application for goat farmers, hobbyists, and breeders. The Service includes:
      </p>
      <ul>
        <li>Goat profile management with photos, breed, sex, date of birth, ear tag, and notes</li>
        <li>Health log tracking with treatment history and follow-up reminders</li>
        <li>Breeding and kidding date tracking</li>
        <li>Camera-based AI scanning for individual goat identification and breed detection</li>
        <li>Bulk auto-discovery for enrolling multiple goats at once</li>
        <li>CSV and PDF export of farm records</li>
        <li>A reference library of goat breeds</li>
      </ul>
      <p>
        The Service is provided as a Progressive Web App and may be made available as a native iOS or Android application
        in the future. We reserve the right to modify, suspend, or discontinue any part of the Service at any time, with or without notice.
      </p>

      <h2 id="eligibility">3. Eligibility & Account</h2>
      <h3>3.1 Age Requirement</h3>
      <p>
        You must be at least <strong>13 years old</strong> to use the Service. If you are between 13 and 18, you may
        use the Service only with the involvement and consent of a parent or legal guardian. In the European Economic
        Area, the minimum age is <strong>16</strong> (or the lower age set by your country's national law, but never below 13).
      </p>

      <h3>3.2 Account Creation</h3>
      <ul>
        <li>You must provide a unique username and a password of at least 6 characters.</li>
        <li>You must provide accurate, complete, and current information.</li>
        <li>You may only create one account per person, except for legitimate testing purposes.</li>
      </ul>

      <h3>3.3 Account Security</h3>
      <ul>
        <li>You are responsible for keeping your password confidential.</li>
        <li>You are responsible for all activity that occurs under your account.</li>
        <li>Notify us immediately if you suspect unauthorised access.</li>
        <li>We are not liable for losses caused by your failure to keep credentials secure.</li>
      </ul>

      <h2 id="user-content">4. Your Content</h2>
      <p>
        "Your Content" means anything you create, upload, or store in the Service, including goat profiles, photos,
        health records, breeding records, ear tag numbers, and notes.
      </p>
      <p>
        <strong>You retain full ownership of Your Content.</strong> We do not claim any ownership of your goats, your photos, or your records.
      </p>

      <h3>4.1 License You Grant Us</h3>
      <p>
        To operate the Service for you, you grant us a worldwide, royalty-free, non-exclusive licence to host,
        store, transmit, display, and process Your Content, solely for the purposes of:
      </p>
      <ul>
        <li>Providing the Service to you</li>
        <li>Backing up your data</li>
        <li>Running on-device AI features (visual fingerprints, OCR)</li>
        <li>Generating reports you request (CSV, PDF)</li>
      </ul>
      <p>
        This licence ends when you delete the relevant content or your account. We do not use Your Content
        for advertising, do not sell it to third parties, and do not use it to train any AI models other than the on-device personal-recognition system that benefits you directly.
      </p>

      <h3>4.2 Content Responsibility</h3>
      <p>
        You are solely responsible for Your Content. You represent and warrant that:
      </p>
      <ul>
        <li>You own or have the necessary rights to the content you upload</li>
        <li>The content does not violate any law, third-party right, or these Terms</li>
        <li>The content does not contain malware or harmful code</li>
      </ul>

      <h2 id="license">5. License We Grant You</h2>
      <p>
        Subject to these Terms, we grant you a limited, non-exclusive, non-transferable, revocable licence to use the Service for your personal or business goat-management purposes.
      </p>
      <p>This licence does <strong>not</strong> permit you to:</p>
      <ul>
        <li>Copy, modify, or create derivative works of the Service</li>
        <li>Reverse-engineer, decompile, or attempt to extract source code</li>
        <li>Resell, sublicense, or redistribute the Service or any portion</li>
        <li>Remove copyright or proprietary notices</li>
        <li>Use the Service to compete with us or to scrape data</li>
      </ul>

      <h2 id="prohibited">6. Acceptable Use</h2>
      <p>You agree <strong>not</strong> to use the Service to:</p>
      <ul>
        <li>Violate any law or regulation</li>
        <li>Infringe anyone's intellectual property, privacy, or other rights</li>
        <li>Upload illegal, harmful, threatening, abusive, defamatory, or sexually explicit content</li>
        <li>Upload images depicting animal abuse or content the depicted person did not consent to</li>
        <li>Attempt to gain unauthorised access to other users' accounts or our systems</li>
        <li>Send spam, phishing attempts, or harassing messages</li>
        <li>Probe or scan the Service for vulnerabilities</li>
        <li>Use automated systems (bots, scrapers) to access the Service without our written consent</li>
        <li>Interfere with the Service or its underlying infrastructure</li>
        <li>Bypass rate limits, authentication, or other security measures</li>
        <li>Misrepresent your identity or affiliation</li>
      </ul>
      <p>We may suspend or terminate accounts that violate these rules, with or without notice.</p>

      <h2 id="third-party">7. Third-Party Services</h2>
      <p>
        The Service uses third-party providers to operate certain features. Their use of your data is governed by their own privacy policies:
      </p>
      <ul>
        <li><strong>Vercel</strong> — application hosting and analytics</li>
        <li><strong>Neon</strong> — managed database</li>
        <li><strong>Cloudinary</strong> — image storage and delivery</li>
      </ul>
      <p>
        We are not responsible for the privacy practices, content, or terms of these third parties beyond our contractual data processing agreements with them.
      </p>

      <h2 id="payment">8. Payment & Subscriptions</h2>
      <p>
        Goat Master is currently <strong>free to use</strong>. We may introduce paid tiers in the future. If we do:
      </p>
      <ul>
        <li>Existing free users will be given at least 30 days' notice before any feature becomes paid</li>
        <li>Pricing, billing terms, refund policies, and trial details will be presented before purchase</li>
        <li>App Store and Play Store purchases will be governed additionally by Apple's and Google's payment terms</li>
      </ul>

      <h2 id="disclaimers">9. Disclaimers</h2>
      <p>
        <strong>Goat Master is a record-keeping and herd-management tool, not a substitute for professional veterinary, agricultural, or business advice.</strong>
      </p>
      <p>
        Decisions about animal health, breeding, treatment, sale, or culling should be made in consultation with a
        qualified veterinarian or agricultural extension officer. The AI-based scanning and breed identification features provide best-effort guesses based on visual analysis and are not guaranteed to be accurate.
      </p>
      <p>
        THE SERVICE IS PROVIDED <strong>"AS IS"</strong> AND <strong>"AS AVAILABLE"</strong> WITHOUT WARRANTIES OF ANY KIND,
        EITHER EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO IMPLIED WARRANTIES OF MERCHANTABILITY, FITNESS FOR A
        PARTICULAR PURPOSE, AND NON-INFRINGEMENT. WE DO NOT WARRANT THAT THE SERVICE WILL BE UNINTERRUPTED, ERROR-FREE, SECURE, OR FREE OF VIRUSES.
      </p>

      <h2 id="liability">10. Limitation of Liability</h2>
      <p>
        TO THE MAXIMUM EXTENT PERMITTED BY LAW, GOAT MASTER, ITS OWNERS, EMPLOYEES, AND PROVIDERS SHALL NOT BE LIABLE FOR:
      </p>
      <ul>
        <li>Loss of profits, revenue, business, livestock, or goodwill</li>
        <li>Loss or corruption of data (please keep your own backups via the Reports export)</li>
        <li>Indirect, incidental, special, consequential, or punitive damages</li>
        <li>Decisions made based on AI predictions, breed identifications, or app data</li>
        <li>Animal health outcomes, including illness, injury, or death</li>
      </ul>
      <p>
        Our aggregate liability for any claim arising out of or relating to the Service shall not exceed
        <strong> the greater of (a) the amount you paid us in the 12 months before the event giving rise to the claim, or (b) USD $50</strong>.
      </p>
      <p>Some jurisdictions do not allow limitations on implied warranties or liability for consequential damages, so the above may not fully apply to you.</p>

      <h2 id="indemnification">11. Indemnification</h2>
      <p>
        You agree to indemnify and hold us harmless from any claims, damages, liabilities, and expenses (including
        reasonable legal fees) arising out of (a) Your Content, (b) your use of the Service, (c) your violation of these Terms, or (d) your violation of any law or third-party right.
      </p>

      <h2 id="termination">12. Termination</h2>
      <h3>12.1 By You</h3>
      <p>You may terminate your account at any time from Settings → Account → Delete Account. This immediately and permanently deletes your data.</p>

      <h3>12.2 By Us</h3>
      <p>We may suspend or terminate your account if:</p>
      <ul>
        <li>You materially violate these Terms</li>
        <li>You fail to pay fees (if applicable)</li>
        <li>We are required to do so by law</li>
        <li>The Service is discontinued</li>
      </ul>
      <p>We will give reasonable notice unless immediate termination is necessary to protect us or other users.</p>

      <h3>12.3 Effect of Termination</h3>
      <p>
        On termination, your access to the Service ends and your data may be deleted. Sections that by their
        nature should survive (sections 9, 10, 11, 13) will survive termination.
      </p>

      <h2 id="disputes">13. Disputes & Governing Law</h2>
      <h3>13.1 Governing Law</h3>
      <p>These Terms are governed by the laws of <strong>Ghana</strong>, without regard to its conflict of law rules.</p>

      <h3>13.2 Mandatory Consumer Rights</h3>
      <p>
        If you are a consumer in the European Union, the United Kingdom, or another jurisdiction with mandatory consumer
        protection laws, you also benefit from the mandatory provisions of your local law. Nothing in these Terms
        affects your statutory consumer rights.
      </p>

      <h3>13.3 Informal Resolution</h3>
      <p>
        Before filing a formal claim, you agree to try to resolve the dispute informally by contacting us at
        <a href="mailto:samuel.hughes.23@outlook.com"> samuel.hughes.23@outlook.com</a>. We'll attempt to respond within 30 days.
      </p>

      <h3>13.4 Jurisdiction</h3>
      <p>
        Any unresolved dispute shall be brought exclusively in the courts of Accra, Ghana, except where local
        consumer-protection law gives you the right to bring the case in your country of residence.
      </p>

      <h2 id="changes">14. Changes to These Terms</h2>
      <p>
        We may update these Terms from time to time. We will notify you of material changes at least 30 days before they take effect by:
      </p>
      <ul>
        <li>Updating the "Last updated" date</li>
        <li>Showing an in-app notice on your next sign-in</li>
        <li>For paid features, requesting your explicit re-acceptance</li>
      </ul>
      <p>If you do not agree to the changes, you may stop using the Service and delete your account before they take effect.</p>

      <h2 id="contact">15. Contact</h2>
      <p>For any question about these Terms:</p>
      <ul>
        <li><strong>Email:</strong> <a href="mailto:samuel.hughes.23@outlook.com">samuel.hughes.23@outlook.com</a></li>
        <li><strong>Phone:</strong> +233 55 441 6937</li>
        <li><strong>Address:</strong> Goat Master, Accra, Ghana</li>
      </ul>

      <p style={{ marginTop: 40, fontSize: 13, color: 'var(--text-sub)', textAlign: 'center' }}>
        © {new Date().getFullYear()} Goat Master. All rights reserved.
      </p>
    </LegalPage>
  );
}
