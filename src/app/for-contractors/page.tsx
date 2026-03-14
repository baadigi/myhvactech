import { Metadata } from 'next'
import Link from 'next/link'
import {
  CheckCircle, Star, Shield,
  Bell, HelpCircle, ArrowRight, Building2,
  MapPin, Award, Filter, Clock, DollarSign,
  Users, Zap, Target
} from 'lucide-react'
import { SUBSCRIPTION_TIERS, SITE_URL } from '@/lib/constants'

export const metadata: Metadata = {
  title: 'Get Commercial HVAC Leads from Property Managers',
  description:
    'We route high-value quote requests from facility managers and property directors to vetted contractors. No residential leads. No tire-kickers. Claim your market slot.',
  alternates: { canonical: `${SITE_URL}/for-contractors` },
  openGraph: {
    title: 'Get Matched with Commercial Property Managers',
    description:
      'High-value leads from facility managers and property directors routed directly to verified commercial HVAC contractors.',
  },
}

const TESTIMONIALS = [
  {
    quote:
      "We closed a $120K chiller replacement from our second lead on this platform. The facility manager already knew her building specs and budget — we just had to show up and win the job.",
    name: 'Marcus Webb',
    company: 'Summit Mechanical Services',
    city: 'Dallas, TX',
    initials: 'MW',
  },
  {
    quote:
      "The leads are real facility managers, not homeowners calling about their AC. Every request includes building type, square footage, and a budget band. Our close rate is 40% higher than anything else we've tried.",
    name: 'Sandra Ortega',
    company: 'ProAir Mechanical',
    city: 'Atlanta, GA',
    initials: 'SO',
  },
  {
    quote:
      "Our Gold slot in the Phoenix metro pays for itself in one lead per quarter. We've won three multi-site service agreements this year that came directly through this platform.",
    name: 'Derek Thompson',
    company: 'ArcticAir Commercial HVAC',
    city: 'Phoenix, AZ',
    initials: 'DT',
  },
]

const HOW_IT_WORKS = [
  {
    step: '01',
    title: 'Complete Your Commercial Profile',
    desc: 'Add your commercial experience, system expertise, sample projects, and SLA commitments. The more detail you provide, the better we can match you to the right leads.',
    icon: <Building2 size={20} aria-hidden="true" />,
  },
  {
    step: '02',
    title: 'Get Commercially Verified',
    desc: 'We confirm your license, insurance, and commercial track record. Verified profiles receive 3x more leads and display a Commercially Verified badge on every listing.',
    icon: <Shield size={20} aria-hidden="true" />,
  },
  {
    step: '03',
    title: 'Receive Qualified Leads',
    desc: 'We route quote requests from property managers in your metro directly to you based on building type, system, and budget match. Each lead goes to a maximum of 3 contractors.',
    icon: <Bell size={20} aria-hidden="true" />,
  },
]

const LEAD_DIFFERENTIATORS = [
  {
    icon: <Building2 size={18} aria-hidden="true" />,
    title: 'Commercial Only',
    desc: 'Every request is from a property manager, facility director, or building owner — never a homeowner.',
  },
  {
    icon: <Filter size={18} aria-hidden="true" />,
    title: 'Pre-Qualified',
    desc: 'We capture building type, sq ft, number of units, budget range, and timing before routing the lead to you.',
  },
  {
    icon: <Target size={18} aria-hidden="true" />,
    title: 'Routed, Not Blasted',
    desc: 'Each lead goes to a maximum of 3 contractors. You are not competing against 20 bids.',
  },
  {
    icon: <DollarSign size={18} aria-hidden="true" />,
    title: 'Real Deal Sizes',
    desc: 'Average lead value is $28K. These are service agreements, equipment replacements, and multi-site contracts.',
  },
]

const TIER_FEATURES = [
  {
    label: 'Leads per month',
    free: 'Up to 5',
    bronze: 'Up to 20',
    silver: 'Up to 50',
    gold: 'Unlimited',
  },
  {
    label: 'Market slot',
    free: 'Standard',
    bronze: 'Standard',
    silver: 'Preferred',
    gold: 'Priority / Exclusive',
  },
  { label: 'Listing visibility', free: 'Basic', bronze: 'Enhanced', silver: 'Priority', gold: 'Featured' },
  { label: 'Photos', free: 'Up to 3', bronze: 'Up to 10', silver: 'Up to 25', gold: 'Unlimited' },
  { label: 'Service areas', free: '1', bronze: '3', silver: '10', gold: 'Unlimited' },
  { label: 'Commercially Verified badge', free: false, bronze: false, silver: true, gold: true },
  { label: 'Respond to reviews', free: false, bronze: true, silver: true, gold: true },
  { label: 'Analytics dashboard', free: false, bronze: 'Basic', silver: 'Full', gold: 'Advanced + IP lookup' },
  { label: 'Lead notifications', free: 'Email', bronze: 'Email + SMS', silver: 'Real-time', gold: 'Real-time + CRM webhook' },
  { label: 'Booking calendar', free: false, bronze: false, silver: true, gold: true },
  { label: 'Quote auto-response', free: false, bronze: false, silver: false, gold: true },
]

const FAQ = [
  {
    q: 'How do market slots work?',
    a: 'Each metro area has a finite number of slots per tier. Standard slots (Free/Bronze) are included in the default rotation. Preferred slots (Silver) give your listing priority placement in search results for your metro. Exclusive/Priority slots (Gold) give you first-right-of-refusal on leads in your market, and in high-demand metros, Gold contractors can hold an exclusive slot that limits competing Gold contractors in the same geography.',
  },
  {
    q: 'What information do I get with each lead?',
    a: 'Each lead includes: building type (office, healthcare, retail, etc.), square footage, number of units or RTUs, budget band, project timing, and the property manager\'s contact information. This is collected from the requestor before the lead is routed to you — so you arrive at every quote conversation with full context.',
  },
  {
    q: 'What types of leads will I receive?',
    a: 'All leads are from commercial property managers, facility directors, or building owners. Lead types include equipment replacement (average $28K+), multi-site service agreements, emergency service calls, and energy retrofit projects. We do not route residential leads — our intake form does not accept single-family or homeowner requests.',
  },
  {
    q: 'How do I get the Commercially Verified badge?',
    a: 'Commercially Verified status is available on Silver and Gold plans. We confirm your state contractor license, insurance certificate, and review your commercial project history. Once verified, the badge displays on all your profile pages and search results, and you are eligible for 3x lead volume compared to unverified listings.',
  },
  {
    q: 'Is it really free to list my business?',
    a: 'Yes. A basic listing with your contact info, services, and one service area is completely free. You receive up to 5 leads per month on the Free plan. You only pay when you want enhanced features, priority placement, or a higher lead volume cap.',
  },
  {
    q: 'Can I cancel my subscription anytime?',
    a: 'Yes. Monthly plans can be cancelled at any time and you retain access through the end of the billing period. Annual plans are discounted but are non-refundable after 30 days.',
  },
]

function FeatureCell({ value }: { value: boolean | string }) {
  if (value === false) {
    return <span className="text-neutral-300">—</span>
  }
  if (value === true) {
    return <CheckCircle size={16} className="text-accent-500 mx-auto" aria-label="Included" />
  }
  return <span className="text-xs text-neutral-700 font-medium">{value}</span>
}

export default function ForContractorsPage() {
  const tiers = Object.entries(SUBSCRIPTION_TIERS) as [
    keyof typeof SUBSCRIPTION_TIERS,
    (typeof SUBSCRIPTION_TIERS)[keyof typeof SUBSCRIPTION_TIERS],
  ][]

  return (
    <main className="min-h-screen bg-white">

      {/* ── Hero ──────────────────────────────────────────────────────────── */}
      <section className="bg-gradient-to-br from-primary-900 via-primary-800 to-primary-700 py-20 px-4 text-white">
        <div className="max-w-5xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 bg-primary-700/60 border border-primary-500/40 rounded-full px-4 py-1.5 text-sm text-primary-200 mb-6">
            <Award size={14} aria-hidden="true" />
            For Commercial HVAC Contractors
          </div>
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold font-display mb-5 leading-tight">
            Get Matched with Commercial<br />Property Managers in Your Market
          </h1>
          <p className="text-lg md:text-xl text-primary-200 max-w-2xl mx-auto leading-relaxed mb-8">
            We route high-value quote requests from facility managers and property directors to vetted contractors. No residential leads. No tire-kickers.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link
              href="/for-contractors/claim"
              className="inline-flex items-center gap-2 bg-white text-primary-700 font-bold text-base px-8 py-4 rounded-xl hover:bg-primary-50 transition-colors shadow-lg"
            >
              Claim Your Market Slot
              <ArrowRight size={16} aria-hidden="true" />
            </Link>
            <Link
              href="#pricing"
              className="inline-flex items-center gap-2 bg-primary-600/60 border border-primary-500/50 text-white font-semibold text-base px-8 py-4 rounded-xl hover:bg-primary-600 transition-colors"
            >
              View Pricing
            </Link>
          </div>
        </div>
      </section>

      {/* ── Trust Stats ───────────────────────────────────────────────────── */}
      <section className="bg-neutral-900 py-10 px-4">
        <div className="max-w-4xl mx-auto">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-8 text-center">
            {[
              { stat: '$28,000', label: 'Avg Deal Size' },
              { stat: '4 hrs', label: 'Avg Quote Turnaround' },
              { stat: '100%', label: 'Commercial Leads' },
            ].map(({ stat, label }) => (
              <div key={label}>
                <div className="text-3xl font-bold text-white font-display">{stat}</div>
                <div className="text-sm text-neutral-400 mt-1">{label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── How It Works ─────────────────────────────────────────────────── */}
      <section className="py-16 px-4 bg-neutral-50">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-10">
            <h2 className="text-2xl md:text-3xl font-bold text-neutral-900 font-display">How It Works</h2>
            <p className="text-neutral-500 mt-2">Three steps to start receiving commercial property manager leads</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {HOW_IT_WORKS.map(({ step, title, desc, icon }) => (
              <div key={step} className="bg-white border border-neutral-200 rounded-2xl p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-xl bg-primary-100 text-primary-600 flex items-center justify-center shrink-0">
                    {icon}
                  </div>
                  <span className="text-2xl font-bold text-neutral-200 font-display">{step}</span>
                </div>
                <h3 className="text-base font-semibold text-neutral-900 mb-2">{title}</h3>
                <p className="text-sm text-neutral-500 leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── What Makes Our Leads Different ───────────────────────────────── */}
      <section className="py-16 px-4 bg-white">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-10">
            <h2 className="text-2xl md:text-3xl font-bold text-neutral-900 font-display">
              What Makes Our Leads Different
            </h2>
            <p className="text-neutral-500 mt-2 max-w-xl mx-auto">
              Every lead that comes through our platform is pre-screened, pre-qualified, and routed to a maximum of three contractors.
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {LEAD_DIFFERENTIATORS.map(({ icon, title, desc }) => (
              <div key={title} className="border border-neutral-200 rounded-2xl p-5 bg-neutral-50">
                <div className="w-9 h-9 rounded-lg bg-primary-100 text-primary-600 flex items-center justify-center mb-4">
                  {icon}
                </div>
                <h3 className="text-sm font-semibold text-neutral-900 mb-1.5">{title}</h3>
                <p className="text-xs text-neutral-500 leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>

          {/* Lead detail callout */}
          <div className="mt-10 bg-primary-50 border border-primary-200 rounded-2xl p-6 md:p-8">
            <div className="flex flex-col md:flex-row md:items-center gap-4">
              <div className="flex-1">
                <h3 className="text-sm font-bold text-primary-900 mb-1">Every lead includes:</h3>
                <div className="flex flex-wrap gap-2 mt-3">
                  {[
                    'Building type',
                    'Square footage',
                    '# of units / RTUs',
                    'Budget band',
                    'Project timing',
                    'Contact info',
                  ].map((item) => (
                    <span
                      key={item}
                      className="inline-flex items-center gap-1.5 bg-white border border-primary-200 text-primary-700 text-xs font-medium px-3 py-1 rounded-full"
                    >
                      <CheckCircle size={11} aria-hidden="true" />
                      {item}
                    </span>
                  ))}
                </div>
              </div>
              <div className="shrink-0">
                <Link
                  href="/for-contractors/claim"
                  className="inline-flex items-center gap-2 bg-primary-600 text-white font-semibold text-sm px-6 py-3 rounded-xl hover:bg-primary-700 transition-colors"
                >
                  Claim Your Slot
                  <ArrowRight size={14} aria-hidden="true" />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Pricing ─────────────────────────────────────────────────────── */}
      <section id="pricing" className="py-16 px-4 bg-neutral-50">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-10">
            <h2 className="text-2xl md:text-3xl font-bold text-neutral-900 font-display">Simple, Transparent Pricing</h2>
            <p className="text-neutral-500 mt-2">Start free. Upgrade to unlock more leads and market slot priority.</p>
          </div>

          {/* Tier Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
            {tiers.map(([key, tier]) => {
              const isGold = key === 'gold'
              const price = tier.price_monthly > 0 ? `$${(tier.price_monthly / 100).toFixed(0)}` : 'Free'
              const leadsLabel =
                tier.max_leads_month === -1
                  ? 'Unlimited leads/mo'
                  : `Up to ${tier.max_leads_month} leads/mo`
              return (
                <div
                  key={key}
                  className={`rounded-2xl border p-5 flex flex-col ${
                    isGold
                      ? 'border-primary-500 bg-primary-600 text-white shadow-xl ring-2 ring-primary-500'
                      : 'border-neutral-200 bg-white'
                  }`}
                >
                  {isGold && (
                    <div className="text-xs font-bold uppercase tracking-wide text-primary-200 mb-2">
                      Market Slot Priority
                    </div>
                  )}
                  <div className="mb-3">
                    <h3 className={`text-base font-bold mb-1 ${isGold ? 'text-white' : 'text-neutral-900'}`}>
                      {tier.name}
                    </h3>
                    <div className="flex items-baseline gap-1">
                      <span className={`text-3xl font-bold font-display ${isGold ? 'text-white' : 'text-neutral-900'}`}>
                        {price}
                      </span>
                      {tier.price_monthly > 0 && (
                        <span className={`text-sm ${isGold ? 'text-primary-200' : 'text-neutral-400'}`}>/mo</span>
                      )}
                    </div>
                    {tier.price_annual > 0 && (
                      <p className={`text-xs mt-0.5 ${isGold ? 'text-primary-200' : 'text-neutral-400'}`}>
                        ${(tier.price_annual / 100 / 12).toFixed(0)}/mo billed annually
                      </p>
                    )}
                  </div>
                  {/* Lead volume badge */}
                  <div
                    className={`text-xs font-semibold px-3 py-1 rounded-full mb-4 inline-block w-fit ${
                      isGold
                        ? 'bg-primary-500/60 text-primary-100'
                        : 'bg-primary-50 text-primary-700'
                    }`}
                  >
                    {leadsLabel}
                  </div>
                  <ul className="space-y-2 flex-1 mb-5">
                    {tier.features.map((feature) => (
                      <li key={feature} className="flex items-start gap-2">
                        <CheckCircle
                          size={14}
                          className={`mt-0.5 shrink-0 ${isGold ? 'text-primary-200' : 'text-accent-500'}`}
                          aria-hidden="true"
                        />
                        <span className={`text-xs leading-relaxed ${isGold ? 'text-primary-100' : 'text-neutral-600'}`}>
                          {feature}
                        </span>
                      </li>
                    ))}
                  </ul>
                  <Link
                    href={`/for-contractors/claim?tier=${key}`}
                    className={`w-full text-center px-4 py-2.5 rounded-xl text-sm font-semibold transition-colors ${
                      isGold
                        ? 'bg-white text-primary-700 hover:bg-primary-50'
                        : key === 'free'
                          ? 'bg-neutral-100 text-neutral-700 hover:bg-neutral-200'
                          : 'bg-primary-500 text-white hover:bg-primary-600'
                    }`}
                  >
                    {key === 'free' ? 'Get Listed Free' : 'Claim Your Slot'}
                  </Link>
                </div>
              )
            })}
          </div>

          {/* Feature Comparison Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-sm border border-neutral-200 rounded-xl overflow-hidden">
              <thead>
                <tr className="bg-neutral-50 border-b border-neutral-200">
                  <th className="text-left px-4 py-3 text-xs font-semibold text-neutral-500 uppercase tracking-wide w-1/3">
                    Feature
                  </th>
                  {tiers.map(([key, tier]) => (
                    <th key={key} className="text-center px-3 py-3 text-xs font-semibold text-neutral-700 uppercase tracking-wide">
                      {tier.name}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {TIER_FEATURES.map((row, i) => (
                  <tr key={row.label} className={`border-b border-neutral-100 ${i % 2 === 0 ? '' : 'bg-neutral-50'}`}>
                    <td className={`px-4 py-3 text-xs font-medium ${
                      row.label === 'Leads per month' || row.label === 'Market slot'
                        ? 'text-primary-700 font-semibold'
                        : 'text-neutral-700'
                    }`}>
                      {row.label}
                    </td>
                    {(['free', 'bronze', 'silver', 'gold'] as const).map((tier) => (
                      <td key={tier} className="px-3 py-3 text-center">
                        <FeatureCell value={row[tier]} />
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* ── Testimonials ─────────────────────────────────────────────────── */}
      <section className="py-16 px-4 bg-white">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-10">
            <h2 className="text-2xl md:text-3xl font-bold text-neutral-900 font-display">What Contractors Say</h2>
            <p className="text-neutral-500 mt-2">Results from commercial HVAC contractors using the platform</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {TESTIMONIALS.map(({ quote, name, company, city, initials }) => (
              <div key={name} className="bg-neutral-50 border border-neutral-200 rounded-2xl p-5">
                <div className="flex mb-3">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star key={i} size={13} className="text-warning fill-warning" aria-hidden="true" />
                  ))}
                </div>
                <p className="text-sm text-neutral-700 leading-relaxed mb-4">&ldquo;{quote}&rdquo;</p>
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-primary-600 flex items-center justify-center text-xs font-bold text-white shrink-0">
                    {initials}
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-neutral-900">{name}</p>
                    <p className="text-xs text-neutral-400">{company} · {city}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FAQ ─────────────────────────────────────────────────────────── */}
      <section className="py-16 px-4 bg-neutral-50">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-2xl md:text-3xl font-bold text-neutral-900 font-display text-center mb-10">
            Frequently Asked Questions
          </h2>
          <div className="space-y-4">
            {FAQ.map((item, i) => (
              <div key={i} className="border border-neutral-200 rounded-xl p-5 bg-white">
                <h3 className="text-sm font-semibold text-neutral-900 mb-2 flex items-start gap-2">
                  <HelpCircle size={15} className="text-neutral-400 mt-0.5 shrink-0" aria-hidden="true" />
                  {item.q}
                </h3>
                <p className="text-sm text-neutral-600 leading-relaxed pl-5">{item.a}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Final CTA ────────────────────────────────────────────────────── */}
      <section className="py-16 px-4 bg-primary-700">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-2xl md:text-3xl font-bold text-white font-display mb-3">
            Claim Your Market Slot Today
          </h2>
          <p className="text-primary-200 mb-6 text-base">
            Join vetted commercial HVAC contractors already receiving leads from property managers in your metro.
          </p>
          <Link
            href="/for-contractors/claim"
            className="inline-flex items-center gap-2 bg-white text-primary-700 font-bold text-base px-8 py-4 rounded-xl hover:bg-primary-50 transition-colors shadow-lg"
          >
            Claim Your Market Slot
            <ArrowRight size={16} aria-hidden="true" />
          </Link>
          <p className="text-primary-300 text-xs mt-4">Free listing available. No credit card required to get started.</p>
        </div>
      </section>

    </main>
  )
}
