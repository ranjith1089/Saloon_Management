/**
 * Terms of Service + Privacy Policy — Ship 6.
 * One file, two routes so both share the same layout. Copy is deliberate
 * boilerplate for the India-first SaaS, calibrated to the DPDPA (Digital
 * Personal Data Protection Act, 2023). Not legal advice — the salon
 * should have a lawyer review before going live.
 */
import { useParams } from 'react-router-dom';
import { usePageMeta } from '@/hooks/usePageMeta';

export default function Legal() {
  const { doc } = useParams<{ doc: 'terms' | 'privacy' }>();
  const isTerms = doc === 'terms';

  usePageMeta({
    title: `${isTerms ? 'Terms of Service' : 'Privacy Policy'} — Aveon Infotech`,
    description: isTerms
      ? 'The terms that govern your use of the Salon & SPA Management platform by Aveon Infotech Private Limited.'
      : 'How Aveon Infotech collects, uses, and protects the data you and your customers place in the Salon platform.',
  });

  return (
    <article className="container-x max-w-3xl py-16 prose prose-sm sm:prose-base">
      <div className="eyebrow">Legal</div>
      <h1 className="h-display text-3xl sm:text-5xl mt-2">
        {isTerms ? 'Terms of Service' : 'Privacy Policy'}
      </h1>
      <p className="text-charcoal/60 text-sm">Effective {new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}</p>

      {isTerms ? <TermsBody /> : <PrivacyBody />}

      <hr className="my-10 border-charcoal/10" />
      <p className="text-xs text-charcoal/50">
        Contact:{' '}
        <a href="mailto:contact@aveoninfotech.com" className="text-brand-600 underline">contact@aveoninfotech.com</a>
        {' · '}
        <a href="tel:+918754006483" className="text-brand-600 underline">+91 87540 06483</a>
      </p>
    </article>
  );
}

function TermsBody() {
  return (
    <div className="mt-6 space-y-6 text-charcoal/85 leading-relaxed">
      <section>
        <h2 className="h-display text-xl">1. About these terms</h2>
        <p>By creating an account or otherwise using the Salon &amp; SPA Management platform (the "Service") operated by <strong>Aveon Infotech Private Limited</strong> ("we", "us", "our"), you agree to be bound by these Terms. If you're using the Service on behalf of an organization, you confirm you have authority to bind that organization.</p>
      </section>
      <section>
        <h2 className="h-display text-xl">2. Your account</h2>
        <p>You're responsible for keeping your login credentials safe and for anything done under your account. Tell us immediately if you suspect unauthorised access. Each organization has an Owner user; the Owner is responsible for their team's actions on the Service.</p>
      </section>
      <section>
        <h2 className="h-display text-xl">3. Fees, trials, cancellation</h2>
        <ul className="list-disc pl-6 space-y-1">
          <li>Every new organization gets a 14-day free trial. No card required.</li>
          <li>After the trial, you must pick a paid plan to keep using the Service.</li>
          <li>Fees are billed monthly, per branch, in your local currency. Indian tenants are charged 18% GST additionally.</li>
          <li>You may cancel any time; the plan stays active until the end of the current billing cycle.</li>
          <li>Fees paid are non-refundable, except where required by law.</li>
        </ul>
      </section>
      <section>
        <h2 className="h-display text-xl">4. Acceptable use</h2>
        <p>You agree not to (a) use the Service for anything illegal, (b) send spam or unsolicited marketing via our WhatsApp integration, (c) attempt to gain unauthorised access to other organizations' data, or (d) reverse-engineer or resell the Service without our written permission.</p>
      </section>
      <section>
        <h2 className="h-display text-xl">5. Your data</h2>
        <p>You own the data you put into the Service. We only process it to run the Service for you (see Privacy Policy). You may download a machine-readable export at any time from Settings → Data &amp; Privacy, and delete your organization from the same place.</p>
      </section>
      <section>
        <h2 className="h-display text-xl">6. Availability &amp; support</h2>
        <p>We aim for high availability but do not guarantee uninterrupted service. Support is provided via WhatsApp and email during business hours (Mon–Sat, 10:00–20:00 IST).</p>
      </section>
      <section>
        <h2 className="h-display text-xl">7. Liability</h2>
        <p>To the fullest extent permitted by Indian law, our aggregate liability for any claim related to the Service is capped at the fees you paid in the 12 months preceding the claim. We are not liable for indirect, incidental, or consequential damages.</p>
      </section>
      <section>
        <h2 className="h-display text-xl">8. Termination</h2>
        <p>We may suspend or terminate accounts that violate these Terms or that are non-paying beyond the trial + grace period. On termination, your data is soft-deleted for 14 days, then permanently purged.</p>
      </section>
      <section>
        <h2 className="h-display text-xl">9. Governing law</h2>
        <p>These Terms are governed by the laws of India. Disputes will be resolved in the courts of Chennai, Tamil Nadu.</p>
      </section>
      <section>
        <h2 className="h-display text-xl">10. Changes</h2>
        <p>We may update these Terms occasionally. Material changes will be announced via email and the trial banner in the app. Continued use after the effective date constitutes acceptance.</p>
      </section>
    </div>
  );
}

function PrivacyBody() {
  return (
    <div className="mt-6 space-y-6 text-charcoal/85 leading-relaxed">
      <section>
        <h2 className="h-display text-xl">1. Who we are</h2>
        <p><strong>Aveon Infotech Private Limited</strong>, based in Chennai, India, is the Data Fiduciary under India's Digital Personal Data Protection Act, 2023 (DPDPA). You can reach our team at <a href="mailto:contact@aveoninfotech.com" className="text-brand-600 underline">contact@aveoninfotech.com</a>.</p>
      </section>
      <section>
        <h2 className="h-display text-xl">2. What we collect</h2>
        <ul className="list-disc pl-6 space-y-1">
          <li><strong>Account data</strong> — email, name, phone, hashed password, role.</li>
          <li><strong>Salon operational data</strong> — branches, staff, services, bookings, sales, memberships, coupons.</li>
          <li><strong>Customer data</strong> your salon collects — name, phone, email, appointment history, preferences.</li>
          <li><strong>Usage data</strong> — API request logs, WhatsApp message counts (for quota).</li>
          <li><strong>Billing data</strong> — invoice history. Card / UPI details never touch our servers; they're handled by Razorpay.</li>
        </ul>
      </section>
      <section>
        <h2 className="h-display text-xl">3. Why we process it</h2>
        <ul className="list-disc pl-6 space-y-1">
          <li>To provide the Service you signed up for.</li>
          <li>To send transactional notifications (booking confirmations, receipts).</li>
          <li>To detect abuse and secure the platform.</li>
          <li>To bill you and comply with tax obligations.</li>
        </ul>
      </section>
      <section>
        <h2 className="h-display text-xl">4. Who we share it with</h2>
        <ul className="list-disc pl-6 space-y-1">
          <li><strong>Meta (WhatsApp Cloud API)</strong> — only the recipient phone + message body needed to deliver.</li>
          <li><strong>Cloudinary</strong> — staff and branding photos.</li>
          <li><strong>Razorpay</strong> — billing and subscription management.</li>
          <li><strong>Google Fonts</strong> — the public site.</li>
          <li>Government authorities when required by law.</li>
        </ul>
        <p>We do not sell your data. Ever.</p>
      </section>
      <section>
        <h2 className="h-display text-xl">5. Where the data lives</h2>
        <p>The primary database is hosted on Railway. Backups and application logs may be stored on the platforms above. All connections use TLS.</p>
      </section>
      <section>
        <h2 className="h-display text-xl">6. Retention</h2>
        <p>Active organizations retain data indefinitely. When an organization is deleted, data is soft-deleted for 14 days and then permanently purged. Invoice records may be retained longer for tax compliance.</p>
      </section>
      <section>
        <h2 className="h-display text-xl">7. Your rights under DPDPA</h2>
        <ul className="list-disc pl-6 space-y-1">
          <li>Access and download all your data (Settings → Data &amp; Privacy).</li>
          <li>Correct any information via the in-app editors.</li>
          <li>Withdraw consent and delete your account.</li>
          <li>Nominate a person to exercise these rights if you're incapacitated.</li>
          <li>Complain to the Data Protection Board of India.</li>
        </ul>
      </section>
      <section>
        <h2 className="h-display text-xl">8. Children</h2>
        <p>The Service is intended for business use by adults. Salon customers under 18 whose booking data is entered by a salon are the salon's responsibility to have consent from a parent or guardian.</p>
      </section>
      <section>
        <h2 className="h-display text-xl">9. Changes</h2>
        <p>Material changes to this policy will be announced via email and the app.</p>
      </section>
    </div>
  );
}
