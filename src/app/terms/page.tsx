import type { Metadata } from 'next'
import Link from 'next/link'
import { SITE_NAME, SITE_URL } from '@/lib/constants'
import { FileText, Mail } from 'lucide-react'

export const metadata: Metadata = {
  title: 'Terms of Service',
  description: `Terms of Service for ${SITE_NAME}. Read our terms and conditions for using the platform.`,
  alternates: { canonical: `${SITE_URL}/terms` },
}

const EFFECTIVE_DATE = 'March 6, 2026'
const LAST_UPDATED = 'March 6, 2026'
const CONTACT_EMAIL = 'legal@myhvac.tech'
const COMPANY_NAME = 'BaaDigi LLC'
const GOVERNING_STATE = 'California'

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <div className="bg-neutral-900 text-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="flex items-center gap-3 mb-4">
            <FileText className="w-8 h-8 text-sky-400" />
            <span className="text-sm font-medium text-sky-400 uppercase tracking-wider">Legal</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold tracking-tight">Terms of Service</h1>
          <p className="mt-3 text-neutral-400">
            Effective Date: {EFFECTIVE_DATE} &middot; Last Updated: {LAST_UPDATED}
          </p>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="prose prose-neutral max-w-none prose-headings:scroll-mt-20">

          {/* TOC */}
          <nav className="bg-neutral-50 border border-neutral-200 rounded-lg p-6 mb-10 not-prose">
            <h2 className="text-sm font-semibold text-neutral-500 uppercase tracking-wider mb-4">Table of Contents</h2>
            <ol className="grid sm:grid-cols-2 gap-x-8 gap-y-2 text-sm">
              {[
                ['#acceptance', 'Acceptance of Terms'],
                ['#eligibility', 'Eligibility'],
                ['#services', 'Description of Services'],
                ['#accounts', 'User Accounts'],
                ['#contractor-listings', 'Contractor Listings'],
                ['#user-conduct', 'User Conduct'],
                ['#content', 'User-Generated Content'],
                ['#intellectual-property', 'Intellectual Property'],
                ['#disclaimers', 'Disclaimers'],
                ['#limitation', 'Limitation of Liability'],
                ['#indemnification', 'Indemnification'],
                ['#disputes', 'Dispute Resolution'],
                ['#termination', 'Termination'],
                ['#advertising', 'Advertising'],
                ['#third-party-links', 'Third-Party Links'],
                ['#modifications', 'Modifications'],
                ['#governing-law', 'Governing Law'],
                ['#contact', 'Contact Information'],
              ].map(([href, label], i) => (
                <li key={href}>
                  <a href={href} className="text-sky-600 hover:text-sky-800 hover:underline">
                    {i + 1}. {label}
                  </a>
                </li>
              ))}
            </ol>
          </nav>

          {/* 1. Acceptance */}
          <h2 id="acceptance">1. Acceptance of Terms</h2>
          <p>
            Welcome to {SITE_NAME} (&ldquo;Site&rdquo;), operated by {COMPANY_NAME} (&ldquo;Company,&rdquo;
            &ldquo;we,&rdquo; &ldquo;us,&rdquo; or &ldquo;our&rdquo;). By accessing or using the Site at{' '}
            <strong>myhvac.tech</strong>, you (&ldquo;User,&rdquo; &ldquo;you,&rdquo; or &ldquo;your&rdquo;)
            agree to be bound by these Terms of Service (&ldquo;Terms&rdquo;).
          </p>
          <p>
            If you do not agree to these Terms, you must not access or use the Site. Your continued use of
            the Site following the posting of any changes constitutes acceptance of those changes.
          </p>

          {/* 2. Eligibility */}
          <h2 id="eligibility">2. Eligibility</h2>
          <p>You must meet the following requirements to use our Site:</p>
          <ul>
            <li>Be at least 18 years of age</li>
            <li>Be capable of entering into a legally binding agreement</li>
            <li>Not be prohibited from using the Site under any applicable law</li>
          </ul>
          <p>
            If you are using the Site on behalf of a business entity, you represent that you have the authority
            to bind that entity to these Terms.
          </p>

          {/* 3. Services */}
          <h2 id="services">3. Description of Services</h2>
          <p>
            {SITE_NAME} is a directory and marketplace platform connecting commercial property and facility
            managers with HVAC contractors. Our services include:
          </p>
          <ul>
            <li><strong>Contractor Directory:</strong> Searchable listings of commercial HVAC contractors filtered by building type, system type, tonnage range, service area, and service agreements</li>
            <li><strong>Quote Requests:</strong> A system for facility managers to request quotes from contractors</li>
            <li><strong>Lead Management:</strong> Tools for contractors to receive and manage inbound leads</li>
            <li><strong>Reviews &amp; Ratings:</strong> A review system for verified commercial HVAC projects</li>
            <li><strong>Blog &amp; Resources:</strong> Industry news, guides, and educational content</li>
            <li><strong>Contractor Profiles:</strong> Detailed profiles showcasing past projects, SLAs, multi-site coverage, emergency response capabilities, and certifications</li>
          </ul>
          <p>
            <strong>Important:</strong> {SITE_NAME} is a platform that facilitates connections between property/facility
            managers and HVAC contractors. We are not an HVAC contractor, we do not perform HVAC services, and
            we are not a party to any agreement between users and contractors.
          </p>

          {/* 4. Accounts */}
          <h2 id="accounts">4. User Accounts</h2>
          <p>Certain features of the Site require you to create an account. When creating an account, you agree to:</p>
          <ul>
            <li>Provide accurate, current, and complete information</li>
            <li>Maintain and promptly update your account information</li>
            <li>Maintain the security and confidentiality of your login credentials</li>
            <li>Accept responsibility for all activities under your account</li>
            <li>Notify us immediately of any unauthorized access or use of your account</li>
          </ul>
          <p>
            We reserve the right to suspend or terminate accounts that contain inaccurate information,
            violate these Terms, or are inactive for an extended period.
          </p>

          {/* 5. Contractor Listings */}
          <h2 id="contractor-listings">5. Contractor Listings</h2>
          <p>
            Contractors listed on {SITE_NAME} are independent businesses. By listing on our platform,
            contractors agree to:
          </p>
          <ul>
            <li>Provide accurate and up-to-date business information, including licenses, certifications, and insurance</li>
            <li>Represent their capabilities, service areas, and specialties truthfully</li>
            <li>Respond to quote requests and leads in a timely and professional manner</li>
            <li>Maintain all required state and local licenses and permits for commercial HVAC work</li>
            <li>Not misrepresent their qualifications, past projects, or service capabilities</li>
          </ul>
          <p>
            <strong>Verification:</strong> While we may verify certain information about listed contractors
            (such as business registration and licenses), we do not guarantee the accuracy, completeness,
            or quality of any contractor&rsquo;s work. Users should conduct their own due diligence before
            hiring any contractor.
          </p>

          {/* 6. User Conduct */}
          <h2 id="user-conduct">6. User Conduct</h2>
          <p>When using the Site, you agree NOT to:</p>
          <ul>
            <li>Provide false, misleading, or fraudulent information</li>
            <li>Impersonate another person or entity</li>
            <li>Use the Site for any illegal or unauthorized purpose</li>
            <li>Interfere with or disrupt the Site, servers, or networks</li>
            <li>Attempt to gain unauthorized access to any part of the Site</li>
            <li>Use automated tools (bots, scrapers, crawlers) to access or collect data from the Site without prior written consent</li>
            <li>Post spam, unsolicited advertising, or promotional materials</li>
            <li>Harass, threaten, or defame other users</li>
            <li>Upload viruses, malware, or other harmful code</li>
            <li>Manipulate reviews, ratings, or rankings</li>
            <li>Circumvent any security features of the Site</li>
          </ul>
          <p>
            Violation of these conduct rules may result in immediate suspension or termination of your account
            and access to the Site, without prior notice.
          </p>

          {/* 7. UGC */}
          <h2 id="content">7. User-Generated Content</h2>
          <p>
            You may submit content to the Site, including reviews, ratings, photos, project descriptions,
            and messages (&ldquo;User Content&rdquo;). By submitting User Content, you:
          </p>
          <ul>
            <li>Grant us a non-exclusive, worldwide, royalty-free, perpetual license to use, reproduce, modify, display, and distribute your User Content in connection with the Site and our business</li>
            <li>Represent that you own or have the rights to submit the content</li>
            <li>Represent that the content is truthful and does not violate any third-party rights</li>
            <li>Understand that we may moderate, edit, or remove User Content at our sole discretion</li>
          </ul>
          <p>
            We do not endorse or guarantee the accuracy of any User Content. Users are solely responsible
            for the content they submit.
          </p>

          {/* 8. IP */}
          <h2 id="intellectual-property">8. Intellectual Property</h2>
          <p>
            The Site and its original content (excluding User Content), features, and functionality are
            owned by {COMPANY_NAME} and are protected by United States and international copyright,
            trademark, patent, trade secret, and other intellectual property laws. This includes:
          </p>
          <ul>
            <li>The {SITE_NAME} name, logo, and branding</li>
            <li>Site design, layout, and user interface</li>
            <li>Original blog content, guides, and resources</li>
            <li>Software, algorithms, and underlying technology</li>
          </ul>
          <p>
            You may not reproduce, distribute, modify, create derivative works of, publicly display,
            or otherwise exploit any of our intellectual property without prior written consent.
          </p>

          {/* 9. Disclaimers */}
          <h2 id="disclaimers">9. Disclaimers</h2>
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-6 my-4 not-prose text-sm text-amber-900">
            <p className="font-bold mb-2">IMPORTANT — PLEASE READ CAREFULLY:</p>
            <p className="mb-2">
              THE SITE AND ALL SERVICES ARE PROVIDED ON AN &ldquo;AS IS&rdquo; AND &ldquo;AS AVAILABLE&rdquo;
              BASIS WITHOUT WARRANTIES OF ANY KIND, WHETHER EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO
              IMPLIED WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, AND NON-INFRINGEMENT.
            </p>
            <p className="mb-2">
              WE DO NOT WARRANT THAT: (A) THE SITE WILL BE UNINTERRUPTED, TIMELY, SECURE, OR ERROR-FREE;
              (B) THE RESULTS OBTAINED FROM THE SITE WILL BE ACCURATE OR RELIABLE; (C) ANY CONTRACTOR
              LISTED ON THE SITE IS LICENSED, INSURED, QUALIFIED, OR COMPETENT; OR (D) ANY DEFECTS IN THE
              SITE WILL BE CORRECTED.
            </p>
            <p>
              {SITE_NAME} IS A DIRECTORY AND MARKETPLACE PLATFORM. WE ARE NOT AN HVAC CONTRACTOR AND DO NOT
              PROVIDE HVAC SERVICES. WE DO NOT GUARANTEE THE QUALITY, SAFETY, LEGALITY, OR TIMELINESS OF
              SERVICES PROVIDED BY LISTED CONTRACTORS. ANY HIRING DECISIONS ARE MADE AT YOUR OWN RISK.
            </p>
          </div>

          {/* 10. Limitation */}
          <h2 id="limitation">10. Limitation of Liability</h2>
          <p>
            TO THE MAXIMUM EXTENT PERMITTED BY LAW, {COMPANY_NAME}, ITS OFFICERS, DIRECTORS, EMPLOYEES,
            AGENTS, AND AFFILIATES SHALL NOT BE LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL,
            OR PUNITIVE DAMAGES, INCLUDING BUT NOT LIMITED TO:
          </p>
          <ul>
            <li>Loss of profits, revenue, data, or business opportunities</li>
            <li>Personal injury or property damage arising from your use of contractor services found through the Site</li>
            <li>Any unauthorized access to or alteration of your transmissions or data</li>
            <li>Any interruption or cessation of the Site</li>
            <li>Any bugs, viruses, or other harmful code transmitted through the Site</li>
          </ul>
          <p>
            IN NO EVENT SHALL OUR TOTAL LIABILITY TO YOU FOR ALL CLAIMS EXCEED THE AMOUNT PAID BY YOU TO
            US IN THE TWELVE (12) MONTHS PRECEDING THE CLAIM, OR ONE HUNDRED DOLLARS ($100), WHICHEVER
            IS GREATER.
          </p>
          <p>
            Some states do not allow the exclusion or limitation of certain damages. If these laws apply to
            you, some or all of the above exclusions or limitations may not apply, and you may have additional
            rights.
          </p>

          {/* 11. Indemnification */}
          <h2 id="indemnification">11. Indemnification</h2>
          <p>
            You agree to indemnify, defend, and hold harmless {COMPANY_NAME}, its officers, directors,
            employees, agents, licensors, and suppliers from and against any claims, liabilities, damages,
            losses, costs, and expenses (including reasonable attorney&rsquo;s fees) arising out of or
            related to:
          </p>
          <ul>
            <li>Your use of the Site or services</li>
            <li>Your violation of these Terms</li>
            <li>Your violation of any rights of a third party</li>
            <li>Your User Content</li>
            <li>Any transaction or dispute between you and a contractor found through the Site</li>
          </ul>

          {/* 12. Disputes */}
          <h2 id="disputes">12. Dispute Resolution</h2>
          <h3>12.1 Informal Resolution</h3>
          <p>
            Before filing any formal legal claim, you agree to first contact us at{' '}
            <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a> and attempt to resolve the dispute
            informally for at least 30 days.
          </p>
          <h3>12.2 Arbitration</h3>
          <p>
            If informal resolution fails, any dispute, controversy, or claim arising out of or relating to
            these Terms shall be settled by binding arbitration administered by the American Arbitration
            Association (AAA) in accordance with its Commercial Arbitration Rules. The arbitration shall
            take place in {GOVERNING_STATE}, and the arbitrator&rsquo;s decision shall be final and binding.
          </p>
          <h3>12.3 Class Action Waiver</h3>
          <p>
            YOU AGREE THAT ANY DISPUTE RESOLUTION PROCEEDINGS WILL BE CONDUCTED ONLY ON AN INDIVIDUAL BASIS
            AND NOT IN A CLASS, CONSOLIDATED, OR REPRESENTATIVE ACTION. If this class action waiver is found
            to be unenforceable, then the entirety of this arbitration provision shall be null and void.
          </p>
          <h3>12.4 Exceptions</h3>
          <p>
            Notwithstanding the above, either party may seek injunctive or equitable relief in any court of
            competent jurisdiction to protect intellectual property rights.
          </p>

          {/* 13. Termination */}
          <h2 id="termination">13. Termination</h2>
          <p>
            We may terminate or suspend your account and access to the Site immediately, without prior notice
            or liability, for any reason, including without limitation if you breach these Terms.
          </p>
          <p>
            Upon termination: (a) your right to use the Site will immediately cease; (b) we may delete your
            account and data (subject to our data retention policy in our{' '}
            <Link href="/privacy" className="text-sky-600 hover:underline">Privacy Policy</Link>); and
            (c) all provisions of these Terms that by their nature should survive termination shall survive,
            including ownership, warranty disclaimers, indemnity, and limitations of liability.
          </p>

          {/* 14. Advertising */}
          <h2 id="advertising">14. Advertising</h2>
          <p>
            The Site may display advertisements provided by third parties, including Google AdSense. We are
            not responsible for the content, accuracy, or practices of any third-party advertisers. Your
            interactions with advertisers are solely between you and the advertiser.
          </p>
          <p>
            Advertising content is clearly distinguishable from editorial content. Paid or sponsored listings,
            if any, will be labeled accordingly.
          </p>

          {/* 15. Third-Party Links */}
          <h2 id="third-party-links">15. Third-Party Links</h2>
          <p>
            The Site may contain links to third-party websites or services that are not owned or controlled
            by us. We have no control over, and assume no responsibility for, the content, privacy policies,
            or practices of any third-party websites or services. We do not endorse any third-party websites
            and are not liable for any damage or loss caused by your use of such websites.
          </p>

          {/* 16. Modifications */}
          <h2 id="modifications">16. Modifications to These Terms</h2>
          <p>
            We reserve the right to modify these Terms at any time. Changes become effective upon posting on
            this page with an updated &ldquo;Last Updated&rdquo; date. For material changes, we will provide
            notice through the Site or by email to registered users.
          </p>
          <p>
            Your continued use of the Site after changes are posted constitutes acceptance of the revised Terms.
            If you do not agree to the revised Terms, you must stop using the Site.
          </p>

          {/* 17. Governing Law */}
          <h2 id="governing-law">17. Governing Law</h2>
          <p>
            These Terms shall be governed by and construed in accordance with the laws of the State of{' '}
            {GOVERNING_STATE}, without regard to its conflict of law provisions.
          </p>
          <p>
            To the extent that arbitration does not apply, you agree to submit to the personal and exclusive
            jurisdiction of the state and federal courts located in {GOVERNING_STATE} for the resolution of
            any disputes.
          </p>

          {/* 18. Severability & General */}
          <h2 id="general">18. General Provisions</h2>
          <ul>
            <li><strong>Severability:</strong> If any provision of these Terms is found to be unenforceable, the remaining provisions will remain in full force and effect.</li>
            <li><strong>Entire Agreement:</strong> These Terms, together with our Privacy Policy, constitute the entire agreement between you and {COMPANY_NAME} regarding the Site.</li>
            <li><strong>Waiver:</strong> Our failure to enforce any right or provision of these Terms will not be considered a waiver of that right or provision.</li>
            <li><strong>Assignment:</strong> You may not assign or transfer these Terms without our prior written consent. We may assign these Terms without restriction.</li>
            <li><strong>Force Majeure:</strong> We shall not be liable for any failure or delay in performing our obligations due to events beyond our reasonable control.</li>
          </ul>

          {/* 19. Contact */}
          <h2 id="contact">19. Contact Information</h2>
          <p>If you have questions about these Terms of Service, please contact us:</p>
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
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  )
}
