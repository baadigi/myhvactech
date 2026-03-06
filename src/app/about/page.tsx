import type { Metadata } from 'next'
import Link from 'next/link'
import { SITE_NAME, SITE_URL } from '@/lib/constants'
import {
  Building2,
  Shield,
  Search,
  Users,
  CheckCircle,
  ArrowRight,
  Target,
  Zap,
  BarChart3,
  Clock,
} from 'lucide-react'

export const metadata: Metadata = {
  title: 'About',
  description: `About ${SITE_NAME} — the commercial HVAC marketplace built for property and facility managers. Not residential. Not Angi. Commercial only.`,
  alternates: { canonical: `${SITE_URL}/about` },
}

const DIFFERENTIATORS = [
  {
    icon: Building2,
    title: 'Commercial Only',
    description:
      'Every contractor on our platform services commercial properties — offices, retail, industrial, healthcare, data centers, and multi-family. No residential. No handymen.',
  },
  {
    icon: Shield,
    title: 'Verified Credentials',
    description:
      'We verify licenses, insurance, and commercial experience. Browse past project portfolios, SLAs, and multi-site capabilities before you reach out.',
  },
  {
    icon: Target,
    title: 'Built for How You Buy',
    description:
      'Filter by building type, tonnage range, system (RTU, VRF, chilled water), and service agreement type. Our search matches how facility managers actually procure HVAC services.',
  },
  {
    icon: Zap,
    title: 'Emergency Response',
    description:
      'See which contractors offer guaranteed emergency response times, 24/7 availability, and after-hours service — critical when your RTU goes down at 2 AM.',
  },
  {
    icon: BarChart3,
    title: 'Real Proof, Not Promises',
    description:
      'Past project portfolios, multi-site coverage maps, equipment brand certifications, and actual SLA terms. The proof points that matter for commercial decisions.',
  },
  {
    icon: Clock,
    title: 'Service Agreements',
    description:
      'Compare preventive maintenance plans, full-service contracts, and emergency-only coverage side by side. Negotiate from a position of knowledge.',
  },
]

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-white">
      {/* Hero */}
      <section className="bg-neutral-900 text-white">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-20 sm:py-28">
          <p className="text-sm font-medium text-sky-400 uppercase tracking-wider mb-4">About {SITE_NAME}</p>
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight leading-tight max-w-3xl">
            The commercial HVAC marketplace built for property and facility managers.
          </h1>
          <p className="mt-6 text-lg text-neutral-300 max-w-2xl leading-relaxed">
            Not residential. Not Angi. Not HomeAdvisor. {SITE_NAME} exists for one reason: to help
            people who manage commercial buildings find, compare, and hire HVAC contractors who
            actually do commercial work.
          </p>
        </div>
      </section>

      {/* The Problem */}
      <section className="py-16 sm:py-20">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-start">
            <div>
              <h2 className="text-2xl sm:text-3xl font-bold text-neutral-900 tracking-tight">
                Why we built this
              </h2>
              <div className="mt-6 space-y-4 text-neutral-600 leading-relaxed">
                <p>
                  If you manage a commercial property, you already know the problem. You need an HVAC
                  contractor who can handle a 50-ton RTU on a retail building, not someone who installs
                  residential mini-splits.
                </p>
                <p>
                  General directories mix residential and commercial together. You waste time calling
                  contractors who don&rsquo;t do commercial, can&rsquo;t service your system type, or
                  don&rsquo;t cover your region.
                </p>
                <p>
                  {SITE_NAME} solves this by focusing exclusively on commercial HVAC. Every listing,
                  every filter, every data point is designed around how facility managers actually
                  evaluate and hire contractors.
                </p>
              </div>
            </div>
            <div className="bg-neutral-50 border border-neutral-200 rounded-xl p-8">
              <h3 className="text-sm font-semibold text-neutral-500 uppercase tracking-wider mb-6">
                {SITE_NAME} vs. General Directories
              </h3>
              <div className="space-y-4">
                {[
                  ['Filter by tonnage range', 'Search by "HVAC near me"'],
                  ['Past commercial projects', 'Star ratings only'],
                  ['SLA & response time data', 'No service level info'],
                  ['System-specific search (RTU, VRF, chiller)', 'Generic categories'],
                  ['Multi-site coverage info', 'Single location only'],
                  ['Service agreement comparison', 'Not available'],
                ].map(([us, them], i) => (
                  <div key={i} className="grid grid-cols-2 gap-4 text-sm">
                    <div className="flex items-start gap-2">
                      <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                      <span className="text-neutral-900 font-medium">{us}</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <span className="w-4 h-4 flex items-center justify-center text-neutral-300 mt-0.5 flex-shrink-0">&mdash;</span>
                      <span className="text-neutral-400">{them}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Differentiators Grid */}
      <section className="py-16 sm:py-20 bg-neutral-50 border-y border-neutral-200">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-2xl sm:text-3xl font-bold text-neutral-900 tracking-tight">
              What makes us different
            </h2>
            <p className="mt-3 text-neutral-600 max-w-xl mx-auto">
              Every feature is built around the needs of commercial property and facility managers.
            </p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {DIFFERENTIATORS.map((item) => (
              <div
                key={item.title}
                className="bg-white border border-neutral-200 rounded-xl p-6 hover:shadow-md transition-shadow"
              >
                <div className="w-10 h-10 rounded-lg bg-sky-50 flex items-center justify-center mb-4">
                  <item.icon className="w-5 h-5 text-sky-600" />
                </div>
                <h3 className="font-semibold text-neutral-900 mb-2">{item.title}</h3>
                <p className="text-sm text-neutral-600 leading-relaxed">{item.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Who We Serve */}
      <section className="py-16 sm:py-20">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl sm:text-3xl font-bold text-neutral-900 tracking-tight text-center mb-12">
            Who we serve
          </h2>
          <div className="grid sm:grid-cols-2 gap-8">
            {/* For Managers */}
            <div className="border border-neutral-200 rounded-xl p-8">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-lg bg-sky-100 flex items-center justify-center">
                  <Search className="w-5 h-5 text-sky-700" />
                </div>
                <h3 className="text-lg font-bold text-neutral-900">For Property &amp; Facility Managers</h3>
              </div>
              <ul className="space-y-3">
                {[
                  'Search contractors by building type, system, and tonnage',
                  'Compare service agreements side by side',
                  'View verified past commercial projects',
                  'Request quotes from multiple contractors at once',
                  'Check emergency response capabilities and SLAs',
                  'Find multi-site contractors for portfolio coverage',
                ].map((item) => (
                  <li key={item} className="flex items-start gap-2 text-sm text-neutral-700">
                    <CheckCircle className="w-4 h-4 text-sky-500 mt-0.5 flex-shrink-0" />
                    {item}
                  </li>
                ))}
              </ul>
              <div className="mt-6">
                <Link
                  href="/get-quotes"
                  className="inline-flex items-center gap-1.5 text-sm font-semibold text-sky-600 hover:text-sky-700 transition-colors"
                >
                  Get Quotes <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </div>

            {/* For Contractors */}
            <div className="border border-neutral-200 rounded-xl p-8">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-lg bg-amber-100 flex items-center justify-center">
                  <Users className="w-5 h-5 text-amber-700" />
                </div>
                <h3 className="text-lg font-bold text-neutral-900">For Commercial HVAC Contractors</h3>
              </div>
              <ul className="space-y-3">
                {[
                  'Get in front of facility managers actively looking for commercial HVAC',
                  'Showcase past projects, certifications, and equipment expertise',
                  'Receive qualified leads matched to your specialties',
                  'Highlight your SLAs, emergency response, and multi-site coverage',
                  'Stand out from residential-focused competitors',
                  'Build your reputation with verified commercial reviews',
                ].map((item) => (
                  <li key={item} className="flex items-start gap-2 text-sm text-neutral-700">
                    <CheckCircle className="w-4 h-4 text-amber-500 mt-0.5 flex-shrink-0" />
                    {item}
                  </li>
                ))}
              </ul>
              <div className="mt-6">
                <Link
                  href="/for-contractors"
                  className="inline-flex items-center gap-1.5 text-sm font-semibold text-amber-600 hover:text-amber-700 transition-colors"
                >
                  List Your Business <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Company Info */}
      <section className="py-16 sm:py-20 bg-neutral-50 border-t border-neutral-200">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-2xl font-bold text-neutral-900 tracking-tight mb-4">Built by BaaDigi</h2>
          <p className="text-neutral-600 leading-relaxed mb-8">
            {SITE_NAME} is built and operated by{' '}
            <a
              href="https://www.baadigi.com"
              target="_blank"
              rel="noopener noreferrer"
              className="text-sky-600 hover:underline font-medium"
            >
              BaaDigi
            </a>
            , a digital products company focused on building vertical marketplaces that serve specific
            industries. We believe the best tools are built for specific people solving specific problems
            &mdash; not generic platforms trying to be everything for everyone.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <Link
              href="/contact"
              className="inline-flex items-center gap-2 bg-neutral-900 text-white px-6 py-3 rounded-lg text-sm font-semibold hover:bg-neutral-800 transition-colors"
            >
              Get in Touch
            </Link>
            <Link
              href="/blog"
              className="inline-flex items-center gap-2 border border-neutral-300 text-neutral-700 px-6 py-3 rounded-lg text-sm font-semibold hover:bg-white transition-colors"
            >
              Read Our Blog
            </Link>
          </div>
        </div>
      </section>
    </div>
  )
}
