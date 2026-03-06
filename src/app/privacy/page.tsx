import type { Metadata } from 'next'
import Link from 'next/link'
import { SITE_NAME, SITE_URL } from '@/lib/constants'
import { Shield, Mail, ExternalLink } from 'lucide-react'

export const metadata: Metadata = {
  title: 'Privacy Policy',
  description: `Privacy Policy for ${SITE_NAME}. Learn how we collect, use, and protect your personal information.`,
  alternates: { canonical: `${SITE_URL}/privacy` },
}

const EFFECTIVE_DATE = 'March 6, 2026'
const LAST_UPDATED = 'March 6, 2026'
const CONTACT_EMAIL = 'privacy@myhvac.tech'
const COMPANY_NAME = 'BaaDigi LLC'
const COMPANY_ADDRESS = 'United States'

export default function PrivacyPolicyPage() {
  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <div className="bg-neutral-900 text-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="flex items-center gap-3 mb-4">
            <Shield className="w-8 h-8 text-sky-400" />
            <span className="text-sm font-medium text-sky-400 uppercase tracking-wider">Legal</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold tracking-tight">Privacy Policy</h1>
          <p className="mt-3 text-neutral-400">
            Effective Date: {EFFECTIVE_DATE} &middot; Last Updated: {LAST_UPDATED}
          </p>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="prose prose-neutral max-w-none prose-headings:scroll-mt-20">

          {/* Table of Contents */}
          <nav className="bg-neutral-50 border border-neutral-200 rounded-lg p-6 mb-10 not-prose">
            <h2 className="text-sm font-semibold text-neutral-500 uppercase tracking-wider mb-4">Table of Contents</h2>
            <ol className="grid sm:grid-cols-2 gap-x-8 gap-y-2 text-sm">
              {[
                ['#introduction', 'Introduction'],
                ['#information-we-collect', 'Information We Collect'],
                ['#how-we-use', 'How We Use Your Information'],
                ['#cookies', 'Cookies & Tracking Technologies'],
                ['#advertising', 'Advertising (Google AdSense)'],
                ['#third-party', 'Third-Party Services'],
                ['#data-sharing', 'Data Sharing & Disclosure'],
                ['#data-retention', 'Data Retention'],
                ['#data-security', 'Data Security'],
                ['#your-rights', 'Your Privacy Rights'],
                ['#state-rights', 'State-by-State Privacy Rights'],
                ['#children', 'Children\u2019s Privacy'],
                ['#do-not-track', 'Do Not Track / Universal Opt-Out'],
                ['#international', 'International Users'],
                ['#changes', 'Changes to This Policy'],
                ['#contact', 'Contact Us'],
              ].map(([href, label], i) => (
                <li key={href}>
                  <a href={href} className="text-sky-600 hover:text-sky-800 hover:underline">
                    {i + 1}. {label}
                  </a>
                </li>
              ))}
            </ol>
          </nav>

          {/* 1. Introduction */}
          <h2 id="introduction">1. Introduction</h2>
          <p>
            {SITE_NAME} (&ldquo;we,&rdquo; &ldquo;us,&rdquo; or &ldquo;our&rdquo;) is operated by {COMPANY_NAME}.
            This Privacy Policy explains how we collect, use, disclose, and safeguard your personal information
            when you visit <strong>myhvac.tech</strong> (the &ldquo;Site&rdquo;), use our services, or interact
            with us in any way.
          </p>
          <p>
            We are a commercial HVAC contractor directory serving property managers, facility managers, and
            commercial HVAC contractors across the United States. By using our Site, you consent to the
            practices described in this Privacy Policy. If you do not agree, please do not use our Site.
          </p>

          {/* 2. Information We Collect */}
          <h2 id="information-we-collect">2. Information We Collect</h2>

          <h3>2.1 Information You Provide Directly</h3>
          <ul>
            <li><strong>Account Registration:</strong> Name, email address, phone number, company name, job title</li>
            <li><strong>Contractor Profiles:</strong> Business name, address, service areas, licenses, certifications, photos, project portfolios, service agreements, system specialties</li>
            <li><strong>Quote Requests:</strong> Building type, system type, tonnage range, project description, budget range, timeline, preferred contact method</li>
            <li><strong>Contact Forms:</strong> Name, email, phone, company name, message content</li>
            <li><strong>Reviews:</strong> Ratings, written feedback, project details</li>
            <li><strong>Blog Comments or Newsletter Sign-ups:</strong> Email address</li>
          </ul>

          <h3>2.2 Information Collected Automatically</h3>
          <ul>
            <li><strong>Device &amp; Browser Data:</strong> IP address, browser type and version, operating system, device type, screen resolution</li>
            <li><strong>Usage Data:</strong> Pages visited, time spent on pages, click patterns, search queries on our Site, referring URLs</li>
            <li><strong>Location Data:</strong> Approximate geographic location derived from your IP address (city/state level only &mdash; we do not collect precise geolocation)</li>
            <li><strong>Cookies &amp; Similar Technologies:</strong> See Section 4 below</li>
          </ul>

          <h3>2.3 Information from Third Parties</h3>
          <ul>
            <li><strong>Google Places API:</strong> Business information for contractor verification</li>
            <li><strong>Analytics Providers:</strong> Aggregated usage and traffic data</li>
            <li><strong>Advertising Partners:</strong> Ad interaction data (impressions, clicks)</li>
          </ul>

          {/* 3. How We Use Your Information */}
          <h2 id="how-we-use">3. How We Use Your Information</h2>
          <p>We use the information we collect for the following purposes:</p>
          <ul>
            <li><strong>Provide and Maintain Our Services:</strong> Connect property/facility managers with commercial HVAC contractors, process quote requests, manage accounts</li>
            <li><strong>Improve Our Site:</strong> Analyze usage patterns, optimize search results, enhance user experience</li>
            <li><strong>Communications:</strong> Respond to inquiries, send lead notifications to contractors, deliver service-related updates</li>
            <li><strong>Advertising:</strong> Display relevant advertisements through Google AdSense and similar services</li>
            <li><strong>Security &amp; Fraud Prevention:</strong> Detect and prevent unauthorized access, abuse, or fraudulent activity</li>
            <li><strong>Legal Compliance:</strong> Comply with applicable laws, regulations, and legal processes</li>
            <li><strong>Analytics:</strong> Measure Site performance, track traffic, and generate aggregate reports via Google Analytics 4</li>
          </ul>

          {/* 4. Cookies */}
          <h2 id="cookies">4. Cookies &amp; Tracking Technologies</h2>
          <p>We use the following cookies and tracking technologies:</p>

          <div className="overflow-x-auto not-prose mb-6">
            <table className="w-full text-sm border border-neutral-200 rounded-lg overflow-hidden">
              <thead className="bg-neutral-100">
                <tr>
                  <th className="px-4 py-3 text-left font-semibold text-neutral-700">Technology</th>
                  <th className="px-4 py-3 text-left font-semibold text-neutral-700">Provider</th>
                  <th className="px-4 py-3 text-left font-semibold text-neutral-700">Purpose</th>
                  <th className="px-4 py-3 text-left font-semibold text-neutral-700">Duration</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-200">
                <tr>
                  <td className="px-4 py-3">Google Analytics 4</td>
                  <td className="px-4 py-3">Google LLC</td>
                  <td className="px-4 py-3">Site analytics, traffic measurement</td>
                  <td className="px-4 py-3">Up to 2 years</td>
                </tr>
                <tr className="bg-neutral-50">
                  <td className="px-4 py-3">Google AdSense</td>
                  <td className="px-4 py-3">Google LLC</td>
                  <td className="px-4 py-3">Personalized advertising</td>
                  <td className="px-4 py-3">Varies</td>
                </tr>
                <tr>
                  <td className="px-4 py-3">Supabase Auth</td>
                  <td className="px-4 py-3">Supabase Inc.</td>
                  <td className="px-4 py-3">Authentication, session management</td>
                  <td className="px-4 py-3">Session / 7 days</td>
                </tr>
                <tr className="bg-neutral-50">
                  <td className="px-4 py-3">Essential Cookies</td>
                  <td className="px-4 py-3">First-party</td>
                  <td className="px-4 py-3">Site functionality, preferences</td>
                  <td className="px-4 py-3">Session / 1 year</td>
                </tr>
              </tbody>
            </table>
          </div>

          <p>
            You can manage cookie preferences through your browser settings. Note that disabling
            certain cookies may affect Site functionality.
          </p>
          <p>
            <strong>Google&rsquo;s Use of Cookies:</strong> Google uses cookies to serve ads based on your
            prior visits to our Site and other websites. You can opt out of personalized advertising by visiting{' '}
            <a href="https://www.google.com/settings/ads" target="_blank" rel="noopener noreferrer">
              Google&rsquo;s Ads Settings <ExternalLink className="inline w-3 h-3" />
            </a>{' '}
            or the{' '}
            <a href="https://optout.networkadvertising.org/" target="_blank" rel="noopener noreferrer">
              Network Advertising Initiative opt-out page <ExternalLink className="inline w-3 h-3" />
            </a>.
          </p>

          {/* 5. Advertising */}
          <h2 id="advertising">5. Advertising (Google AdSense)</h2>
          <p>
            We may use Google AdSense to display advertisements on our Site. Google AdSense uses cookies
            and similar technologies to serve ads based on your interests and browsing behavior. Third-party
            vendors, including Google, use cookies to serve ads based on your prior visits to our Site and
            other websites.
          </p>
          <p>Google and its partners may collect and use the following data for advertising purposes:</p>
          <ul>
            <li>Cookies and device identifiers</li>
            <li>IP address (for approximate location targeting)</li>
            <li>Browsing activity on our Site and across the web</li>
            <li>Interaction data with advertisements (views, clicks)</li>
          </ul>
          <p><strong>Your choices regarding advertising:</strong></p>
          <ul>
            <li>
              Opt out of personalized ads:{' '}
              <a href="https://www.google.com/settings/ads" target="_blank" rel="noopener noreferrer">
                Google Ads Settings
              </a>
            </li>
            <li>
              Opt out via industry tool:{' '}
              <a href="https://optout.aboutads.info/" target="_blank" rel="noopener noreferrer">
                Digital Advertising Alliance
              </a>
            </li>
            <li>
              NAI opt-out:{' '}
              <a href="https://optout.networkadvertising.org/" target="_blank" rel="noopener noreferrer">
                Network Advertising Initiative
              </a>
            </li>
          </ul>

          {/* 6. Third-Party Services */}
          <h2 id="third-party">6. Third-Party Services</h2>
          <p>Our Site uses the following third-party services that may collect data:</p>
          <div className="overflow-x-auto not-prose mb-6">
            <table className="w-full text-sm border border-neutral-200 rounded-lg overflow-hidden">
              <thead className="bg-neutral-100">
                <tr>
                  <th className="px-4 py-3 text-left font-semibold text-neutral-700">Service</th>
                  <th className="px-4 py-3 text-left font-semibold text-neutral-700">Purpose</th>
                  <th className="px-4 py-3 text-left font-semibold text-neutral-700">Privacy Policy</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-200">
                <tr>
                  <td className="px-4 py-3">Google Analytics 4</td>
                  <td className="px-4 py-3">Website analytics</td>
                  <td className="px-4 py-3">
                    <a href="https://policies.google.com/privacy" target="_blank" rel="noopener noreferrer" className="text-sky-600 hover:underline">
                      Google Privacy Policy
                    </a>
                  </td>
                </tr>
                <tr className="bg-neutral-50">
                  <td className="px-4 py-3">Google AdSense</td>
                  <td className="px-4 py-3">Display advertising</td>
                  <td className="px-4 py-3">
                    <a href="https://policies.google.com/technologies/ads" target="_blank" rel="noopener noreferrer" className="text-sky-600 hover:underline">
                      Google Ads Privacy
                    </a>
                  </td>
                </tr>
                <tr>
                  <td className="px-4 py-3">Supabase</td>
                  <td className="px-4 py-3">Database, authentication</td>
                  <td className="px-4 py-3">
                    <a href="https://supabase.com/privacy" target="_blank" rel="noopener noreferrer" className="text-sky-600 hover:underline">
                      Supabase Privacy Policy
                    </a>
                  </td>
                </tr>
                <tr className="bg-neutral-50">
                  <td className="px-4 py-3">Google Places API</td>
                  <td className="px-4 py-3">Business data verification</td>
                  <td className="px-4 py-3">
                    <a href="https://policies.google.com/privacy" target="_blank" rel="noopener noreferrer" className="text-sky-600 hover:underline">
                      Google Privacy Policy
                    </a>
                  </td>
                </tr>
                <tr>
                  <td className="px-4 py-3">Vercel</td>
                  <td className="px-4 py-3">Website hosting, CDN</td>
                  <td className="px-4 py-3">
                    <a href="https://vercel.com/legal/privacy-policy" target="_blank" rel="noopener noreferrer" className="text-sky-600 hover:underline">
                      Vercel Privacy Policy
                    </a>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* 7. Data Sharing */}
          <h2 id="data-sharing">7. Data Sharing &amp; Disclosure</h2>
          <p>We may share your personal information in the following circumstances:</p>
          <ul>
            <li><strong>With Contractors:</strong> When you submit a quote request or contact form, your inquiry details are shared with the relevant contractor(s) so they can respond to you</li>
            <li><strong>Service Providers:</strong> Third-party vendors who assist us in operating the Site (hosting, analytics, email delivery) under contractual data protection obligations</li>
            <li><strong>Advertising Partners:</strong> As described in Section 5, for the purpose of serving relevant advertisements</li>
            <li><strong>Legal Requirements:</strong> When required by law, subpoena, court order, or government request</li>
            <li><strong>Business Transfers:</strong> In connection with a merger, acquisition, or sale of assets</li>
            <li><strong>With Your Consent:</strong> When you explicitly authorize disclosure</li>
          </ul>
          <p>
            <strong>We do not sell your personal information</strong> as defined under the California Consumer
            Privacy Act (CCPA) or any other state privacy law. Sharing data with advertising partners for
            targeted advertising may constitute &ldquo;sharing&rdquo; under the CCPA &mdash; see Section 11
            for your opt-out rights.
          </p>

          {/* 8. Data Retention */}
          <h2 id="data-retention">8. Data Retention</h2>
          <ul>
            <li><strong>Account Data:</strong> Retained for the duration of your account plus 2 years after deletion, unless you request earlier deletion</li>
            <li><strong>Quote Requests &amp; Leads:</strong> Retained for 3 years for business record purposes</li>
            <li><strong>Analytics Data:</strong> Google Analytics data is retained for 14 months (GA4 default)</li>
            <li><strong>Advertising Data:</strong> Governed by Google&rsquo;s retention policies</li>
            <li><strong>Server Logs:</strong> Retained for 90 days</li>
          </ul>
          <p>
            You may request deletion of your data at any time by contacting us at{' '}
            <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>.
          </p>

          {/* 9. Data Security */}
          <h2 id="data-security">9. Data Security</h2>
          <p>
            We implement industry-standard security measures to protect your personal information, including:
          </p>
          <ul>
            <li>SSL/TLS encryption for all data in transit</li>
            <li>Encrypted database storage via Supabase (AES-256)</li>
            <li>Role-based access controls for administrative functions</li>
            <li>Regular security monitoring and updates</li>
          </ul>
          <p>
            While we strive to protect your information, no method of electronic storage or transmission
            is 100% secure. We cannot guarantee absolute security.
          </p>

          {/* 10. Your Rights */}
          <h2 id="your-rights">10. Your Privacy Rights</h2>
          <p>Depending on your location, you may have the following rights regarding your personal information:</p>
          <ul>
            <li><strong>Right to Know / Access:</strong> Request what personal information we have collected about you</li>
            <li><strong>Right to Correct:</strong> Request correction of inaccurate personal information</li>
            <li><strong>Right to Delete:</strong> Request deletion of your personal information (subject to legal exceptions)</li>
            <li><strong>Right to Data Portability:</strong> Receive your data in a structured, commonly used format</li>
            <li><strong>Right to Opt Out:</strong> Opt out of the sale or sharing of personal information, targeted advertising, and profiling</li>
            <li><strong>Right to Non-Discrimination:</strong> We will not discriminate against you for exercising your privacy rights</li>
          </ul>
          <p>
            To exercise any of these rights, contact us at{' '}
            <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>.
            We will respond within the timeframe required by your state&rsquo;s applicable law (typically 45 days).
          </p>

          {/* 11. State-by-State */}
          <h2 id="state-rights">11. State-by-State Privacy Rights</h2>
          <p>
            The following section provides additional disclosures required by individual state privacy laws.
            These rights apply to residents of each respective state.
          </p>

          {/* California */}
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-6 my-6 not-prose">
            <h3 className="text-lg font-bold text-amber-900 mb-3">California (CCPA / CPRA)</h3>
            <p className="text-sm text-amber-800 mb-3">
              <strong>Applies to:</strong> California residents. The California Consumer Privacy Act, as amended
              by the California Privacy Rights Act, provides the most comprehensive consumer privacy protections
              in the United States.
            </p>
            <p className="text-sm text-amber-800 font-semibold mb-2">Your California Rights:</p>
            <ul className="text-sm text-amber-800 space-y-1 list-disc pl-5 mb-3">
              <li>Right to know what personal information is collected, used, shared, or sold</li>
              <li>Right to delete personal information held by us and our service providers</li>
              <li>Right to opt out of the sale or sharing of personal information</li>
              <li>Right to correct inaccurate personal information</li>
              <li>Right to limit use and disclosure of sensitive personal information</li>
              <li>Right to non-discrimination for exercising your rights</li>
              <li>Right to data portability</li>
            </ul>
            <p className="text-sm text-amber-800 mb-2">
              <strong>Categories of Personal Information Collected (past 12 months):</strong> Identifiers
              (name, email, phone, IP address); commercial information (quote requests, service inquiries);
              internet/electronic activity (browsing history, search queries, ad interactions); geolocation
              data (approximate, city/state level); professional information (job title, company name).
            </p>
            <p className="text-sm text-amber-800 mb-2">
              <strong>Sale or Sharing:</strong> We do not &ldquo;sell&rdquo; personal information as traditionally
              defined. However, our use of Google AdSense and similar advertising technologies may constitute
              &ldquo;sharing&rdquo; under the CCPA for cross-context behavioral advertising purposes. You may
              opt out of this sharing.
            </p>
            <p className="text-sm text-amber-800 mb-2">
              <strong>Do Not Sell or Share My Personal Information:</strong> To opt out, email{' '}
              <a href={`mailto:${CONTACT_EMAIL}`} className="text-amber-700 underline">{CONTACT_EMAIL}</a>{' '}
              with the subject line &ldquo;Do Not Sell or Share.&rdquo; We also honor the Global Privacy Control
              (GPC) signal.
            </p>
            <p className="text-sm text-amber-800 mb-2">
              <strong>Sensitive Personal Information:</strong> We do not collect sensitive personal information
              as defined by the CPRA (e.g., Social Security numbers, financial account numbers, precise
              geolocation, racial/ethnic origin, biometric data).
            </p>
            <p className="text-sm text-amber-800 mb-2">
              <strong>Authorized Agents:</strong> You may designate an authorized agent to submit requests on
              your behalf. We may require verification of the agent&rsquo;s authority.
            </p>
            <p className="text-sm text-amber-800">
              <strong>Response Time:</strong> We will acknowledge your request within 10 business days and
              respond within 45 calendar days (extendable by 45 days with notice).
            </p>
          </div>

          {/* Colorado */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 my-6 not-prose">
            <h3 className="text-lg font-bold text-blue-900 mb-3">Colorado (CPA)</h3>
            <p className="text-sm text-blue-800 mb-3">
              <strong>Effective:</strong> July 1, 2023. The Colorado Privacy Act applies to entities conducting
              business in Colorado or targeting Colorado residents that process data of 100,000+ consumers
              or 25,000+ consumers if deriving revenue from data sales.
            </p>
            <p className="text-sm text-blue-800 font-semibold mb-2">Your Colorado Rights:</p>
            <ul className="text-sm text-blue-800 space-y-1 list-disc pl-5 mb-3">
              <li>Right to access, correct, and delete personal data</li>
              <li>Right to data portability</li>
              <li>Right to opt out of targeted advertising, sale of personal data, and profiling</li>
            </ul>
            <p className="text-sm text-blue-800 mb-2">
              <strong>Universal Opt-Out:</strong> As of January 2026, Colorado requires recognition of universal
              opt-out mechanisms (e.g., Global Privacy Control). We honor GPC signals from Colorado residents.
            </p>
            <p className="text-sm text-blue-800">
              <strong>Cure Period:</strong> Colorado&rsquo;s 60-day cure period expired December 31, 2025.
              Enforcement may proceed without a grace period. <strong>Response Time:</strong> 45 days.
            </p>
          </div>

          {/* Connecticut */}
          <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-6 my-6 not-prose">
            <h3 className="text-lg font-bold text-indigo-900 mb-3">Connecticut (CTDPA)</h3>
            <p className="text-sm text-indigo-800 mb-3">
              <strong>Effective:</strong> July 1, 2023 (amended mid-2026: threshold lowered from 100,000 to 35,000
              consumers). Applies to entities conducting business in Connecticut or targeting Connecticut residents.
            </p>
            <p className="text-sm text-indigo-800 font-semibold mb-2">Your Connecticut Rights:</p>
            <ul className="text-sm text-indigo-800 space-y-1 list-disc pl-5 mb-3">
              <li>Right to access, correct, and delete personal data</li>
              <li>Right to data portability</li>
              <li>Right to opt out of targeted advertising, data sales, and profiling</li>
            </ul>
            <p className="text-sm text-indigo-800 mb-2">
              <strong>Universal Opt-Out:</strong> Connecticut requires recognition of universal opt-out mechanisms
              (GPC) as of January 2026. We honor GPC signals.
            </p>
            <p className="text-sm text-indigo-800">
              <strong>Minors:</strong> Sale of personal data of minors and targeted advertising to children
              is prohibited regardless of consent. <strong>Response Time:</strong> 45 days.
            </p>
          </div>

          {/* Virginia */}
          <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-6 my-6 not-prose">
            <h3 className="text-lg font-bold text-emerald-900 mb-3">Virginia (VCDPA)</h3>
            <p className="text-sm text-emerald-800 mb-3">
              <strong>Effective:</strong> January 1, 2023. Applies to entities that conduct business in Virginia
              or target Virginia residents and process data of 100,000+ consumers, or 25,000+ consumers if
              deriving more than 50% of revenue from data sales.
            </p>
            <p className="text-sm text-emerald-800 font-semibold mb-2">Your Virginia Rights:</p>
            <ul className="text-sm text-emerald-800 space-y-1 list-disc pl-5 mb-3">
              <li>Right to access, correct, and delete personal data</li>
              <li>Right to data portability</li>
              <li>Right to opt out of targeted advertising, data sales, and profiling</li>
              <li>Right to appeal our decision regarding your request</li>
            </ul>
            <p className="text-sm text-emerald-800">
              <strong>Sensitive Data:</strong> Opt-in consent required for processing sensitive data.
              <strong> Response Time:</strong> 45 days. <strong>Appeal:</strong> If we deny your request,
              you may appeal within a reasonable time. We will respond to appeals within 60 days.
            </p>
          </div>

          {/* Texas */}
          <div className="bg-red-50 border border-red-200 rounded-lg p-6 my-6 not-prose">
            <h3 className="text-lg font-bold text-red-900 mb-3">Texas (TDPSA)</h3>
            <p className="text-sm text-red-800 mb-3">
              <strong>Effective:</strong> July 1, 2024. The Texas Data Privacy and Security Act applies to
              entities that conduct business in Texas or produce goods/services consumed by Texas residents,
              and are not classified as a small business under the SBA.
            </p>
            <p className="text-sm text-red-800 font-semibold mb-2">Your Texas Rights:</p>
            <ul className="text-sm text-red-800 space-y-1 list-disc pl-5 mb-3">
              <li>Right to access, correct, and delete personal data</li>
              <li>Right to data portability</li>
              <li>Right to opt out of targeted advertising, data sales, and profiling</li>
            </ul>
            <p className="text-sm text-red-800">
              <strong>Sensitive Data:</strong> Opt-in consent required.
              <strong> Cure Period:</strong> 30 days to cure violations.
              <strong> Response Time:</strong> 45 days.
            </p>
          </div>

          {/* Oregon */}
          <div className="bg-green-50 border border-green-200 rounded-lg p-6 my-6 not-prose">
            <h3 className="text-lg font-bold text-green-900 mb-3">Oregon (OCPA)</h3>
            <p className="text-sm text-green-800 mb-3">
              <strong>Effective:</strong> July 1, 2024 (amended January 1, 2026). Applies to entities conducting
              business in Oregon or targeting Oregon residents that process data of 100,000+ consumers, or
              25,000+ consumers if deriving 25%+ of revenue from data sales.
            </p>
            <p className="text-sm text-green-800 font-semibold mb-2">Your Oregon Rights:</p>
            <ul className="text-sm text-green-800 space-y-1 list-disc pl-5 mb-3">
              <li>Right to access, correct, and delete personal data</li>
              <li>Right to data portability</li>
              <li>Right to opt out of targeted advertising, data sales, and profiling</li>
              <li>Right to obtain a list of third parties to whom data has been disclosed</li>
            </ul>
            <p className="text-sm text-green-800 mb-2">
              <strong>2026 Amendments:</strong> Sale of precise geolocation data (within 1,750 feet) is
              prohibited. Sale of personal data of consumers under 16 is prohibited. Controllers must honor
              universal opt-out mechanisms.
            </p>
            <p className="text-sm text-green-800">
              <strong>Cure Period:</strong> Expired January 1, 2026.
              <strong> Response Time:</strong> 45 days.
            </p>
          </div>

          {/* Utah */}
          <div className="bg-orange-50 border border-orange-200 rounded-lg p-6 my-6 not-prose">
            <h3 className="text-lg font-bold text-orange-900 mb-3">Utah (UCPA)</h3>
            <p className="text-sm text-orange-800 mb-3">
              <strong>Effective:</strong> December 31, 2023 (amendments effective July 1, 2026). Applies to
              entities with annual revenue of $25M+ that conduct business in Utah or target Utah residents
              and process data of 100,000+ consumers, or 25,000+ consumers if deriving 50%+ of revenue from data sales.
            </p>
            <p className="text-sm text-orange-800 font-semibold mb-2">Your Utah Rights:</p>
            <ul className="text-sm text-orange-800 space-y-1 list-disc pl-5 mb-3">
              <li>Right to access and delete personal data</li>
              <li>Right to data portability</li>
              <li>Right to opt out of targeted advertising and data sales</li>
            </ul>
            <p className="text-sm text-orange-800">
              <strong>Note:</strong> Utah does not include a right to correct data or opt out of profiling.
              <strong> Response Time:</strong> 45 days.
            </p>
          </div>

          {/* Montana */}
          <div className="bg-stone-100 border border-stone-300 rounded-lg p-6 my-6 not-prose">
            <h3 className="text-lg font-bold text-stone-900 mb-3">Montana (MCDPA)</h3>
            <p className="text-sm text-stone-700 mb-3">
              <strong>Effective:</strong> October 1, 2024. Applies to entities conducting business in Montana
              or targeting Montana residents that process data of 50,000+ consumers, or 25,000+ consumers
              if deriving 25%+ of revenue from data sales.
            </p>
            <p className="text-sm text-stone-700 font-semibold mb-2">Your Montana Rights:</p>
            <ul className="text-sm text-stone-700 space-y-1 list-disc pl-5">
              <li>Right to access, correct, and delete personal data</li>
              <li>Right to data portability</li>
              <li>Right to opt out of targeted advertising, data sales, and profiling</li>
              <li>Sensitive data requires opt-in consent</li>
            </ul>
          </div>

          {/* Delaware, Iowa, Nebraska, New Hampshire, New Jersey, Minnesota */}
          <div className="bg-violet-50 border border-violet-200 rounded-lg p-6 my-6 not-prose">
            <h3 className="text-lg font-bold text-violet-900 mb-3">Delaware, Iowa, Nebraska, New Hampshire, New Jersey, Maryland, Minnesota</h3>
            <p className="text-sm text-violet-800 mb-3">
              These states have enacted comprehensive consumer privacy laws effective between 2024&ndash;2025,
              with rights substantially similar to Virginia&rsquo;s framework.
            </p>
            <p className="text-sm text-violet-800 font-semibold mb-2">Common Rights Include:</p>
            <ul className="text-sm text-violet-800 space-y-1 list-disc pl-5 mb-3">
              <li>Right to access, correct (except Iowa), and delete personal data</li>
              <li>Right to data portability</li>
              <li>Right to opt out of targeted advertising and data sales</li>
              <li>Sensitive data requires opt-in consent</li>
            </ul>
            <p className="text-sm text-violet-800">
              <strong>Note:</strong> Iowa does not include a right to correction. Delaware, Maryland, Minnesota,
              and New Jersey have additional protections for minors&rsquo; data. Response times are generally 45 days.
            </p>
          </div>

          {/* Tennessee, Florida */}
          <div className="bg-rose-50 border border-rose-200 rounded-lg p-6 my-6 not-prose">
            <h3 className="text-lg font-bold text-rose-900 mb-3">Tennessee &amp; Florida</h3>
            <p className="text-sm text-rose-800 mb-3">
              <strong>Tennessee (TIPA):</strong> Effective July 1, 2025. Follows the Virginia model with standard
              access, correction, deletion, portability, and opt-out rights. 60-day cure period.
            </p>
            <p className="text-sm text-rose-800">
              <strong>Florida (FDBR):</strong> Effective July 1, 2024. Narrower scope &mdash; applies to entities
              with global revenue exceeding $1 billion and meeting additional criteria. Includes standard consumer
              rights plus specific requirements around biometric data and children&rsquo;s privacy.
            </p>
          </div>

          {/* Indiana, Kentucky, Rhode Island (2026) */}
          <div className="bg-cyan-50 border border-cyan-200 rounded-lg p-6 my-6 not-prose">
            <h3 className="text-lg font-bold text-cyan-900 mb-3">Indiana, Kentucky &amp; Rhode Island (Effective January 1, 2026)</h3>
            <p className="text-sm text-cyan-800 mb-3">
              The newest state privacy laws, all effective January 1, 2026. They largely mirror the Virginia
              framework.
            </p>
            <p className="text-sm text-cyan-800 font-semibold mb-2">Common Rights Include:</p>
            <ul className="text-sm text-cyan-800 space-y-1 list-disc pl-5 mb-3">
              <li>Right to access, correct, and delete personal data</li>
              <li>Right to data portability</li>
              <li>Right to opt out of targeted advertising, data sales, and profiling</li>
              <li>Sensitive data requires opt-in consent</li>
            </ul>
            <p className="text-sm text-cyan-800 mb-2">
              <strong>Indiana &amp; Kentucky:</strong> Apply to entities processing data of 100,000+ consumers
              or deriving 50%+ of revenue from data sales of 25,000+ consumers. 30-day cure period.
            </p>
            <p className="text-sm text-cyan-800">
              <strong>Rhode Island:</strong> Lower thresholds &mdash; 35,000 consumers, or 10,000 consumers
              if 20%+ of revenue is from data sales. Requires standalone privacy notices on commercial websites
              operating in Rhode Island, regardless of threshold.
            </p>
          </div>

          {/* 12. Children */}
          <h2 id="children">12. Children&rsquo;s Privacy</h2>
          <p>
            Our Site and services are designed for commercial use by business professionals. We do not
            knowingly collect personal information from children under 13 years of age in accordance with
            the Children&rsquo;s Online Privacy Protection Act (COPPA).
          </p>
          <p>
            For users under 16: Under multiple state laws (including California, Oregon, Connecticut, Delaware,
            and Maryland), we do not sell personal data of consumers we know to be under 16, nor do we use
            such data for targeted advertising.
          </p>
          <p>
            If you believe we have inadvertently collected information from a child under 13, please contact
            us at <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a> and we will promptly delete it.
          </p>

          {/* 13. DNT */}
          <h2 id="do-not-track">13. Do Not Track / Universal Opt-Out Mechanisms</h2>
          <p>
            <strong>Do Not Track (DNT):</strong> Some browsers transmit a &ldquo;Do Not Track&rdquo; signal.
            There is no industry consensus on how to respond to DNT signals. We currently do not alter our
            data collection practices in response to DNT browser signals.
          </p>
          <p>
            <strong>Global Privacy Control (GPC):</strong> We honor the Global Privacy Control signal as
            required by the CCPA/CPRA (California), Colorado, Connecticut, Oregon, and other applicable
            state laws. When we detect a GPC signal, we treat it as a valid opt-out of the sale and sharing
            of personal information and targeted advertising for residents of applicable states.
          </p>

          {/* 14. International */}
          <h2 id="international">14. International Users</h2>
          <p>
            Our Site is intended for users within the United States. If you access the Site from outside the
            United States, please be aware that your information may be transferred to, stored, and processed
            in the United States where our servers are located. By using our Site, you consent to this transfer.
          </p>

          {/* 15. Changes */}
          <h2 id="changes">15. Changes to This Policy</h2>
          <p>
            We may update this Privacy Policy from time to time to reflect changes in our practices or applicable
            laws. We will update the &ldquo;Last Updated&rdquo; date at the top of this page. For material
            changes, we will provide notice through the Site or by email. We encourage you to review this
            page periodically.
          </p>
          <p>
            In accordance with the CCPA, this Privacy Policy is reviewed and updated at least once every
            12 months.
          </p>

          {/* 16. Contact */}
          <h2 id="contact">16. Contact Us</h2>
          <p>
            If you have questions about this Privacy Policy or wish to exercise your privacy rights, please
            contact us:
          </p>
          <div className="bg-neutral-50 border border-neutral-200 rounded-lg p-6 not-prose">
            <div className="flex items-start gap-3">
              <Mail className="w-5 h-5 text-neutral-500 mt-0.5 flex-shrink-0" />
              <div>
                <p className="font-semibold text-neutral-900">{COMPANY_NAME}</p>
                <p className="text-sm text-neutral-600 mt-1">
                  Email: <a href={`mailto:${CONTACT_EMAIL}`} className="text-sky-600 hover:underline">{CONTACT_EMAIL}</a>
                </p>
                <p className="text-sm text-neutral-600 mt-1">
                  Website: <a href="https://myhvac.tech" className="text-sky-600 hover:underline">myhvac.tech</a>
                </p>
                <p className="text-sm text-neutral-500 mt-3">
                  We will acknowledge your request within 10 business days and respond substantively
                  within the timeframe required by your state&rsquo;s applicable law (typically 45 days).
                </p>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  )
}
