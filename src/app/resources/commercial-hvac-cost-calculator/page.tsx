import type { Metadata } from 'next'
import Link from 'next/link'
import { ChevronRight } from 'lucide-react'
import { SITE_URL } from '@/lib/constants'
import { FAQSchema, BreadcrumbSchema } from '@/components/SchemaOrg'
import JsonLd from '@/components/JsonLd'
import CostEstimator from '@/components/CostEstimator'

const TITLE = 'Commercial HVAC Cost Calculator (2026 Estimates)'
const DESC =
  'Free commercial HVAC cost calculator. Estimate replacement, new installation, repair, and maintenance costs by building type, square footage, and system — then get exact quotes from vetted contractors.'

export const metadata: Metadata = {
  title: TITLE,
  description: DESC,
  alternates: { canonical: `${SITE_URL}/resources/commercial-hvac-cost-calculator` },
  openGraph: { title: TITLE, description: DESC, url: `${SITE_URL}/resources/commercial-hvac-cost-calculator` },
}

const FAQ = [
  {
    q: 'How much does commercial HVAC cost?',
    a: 'Commercial HVAC replacement typically runs <strong>$2,000–$8,000 per ton of cooling installed</strong>, depending on system type — packaged rooftop units (RTUs) are cheapest, VRF and chiller plants the most expensive. For a typical office, that works out to roughly <strong>$15–$30 per square foot</strong>. Repairs usually run a few hundred to a few thousand dollars; preventive-maintenance contracts run about $120–$280 per ton per year.',
  },
  {
    q: 'How much does commercial HVAC cost per square foot?',
    a: 'For a new or replacement commercial HVAC system, budget roughly <strong>$15–$30 per square foot</strong> for a standard office or retail building. Denser, heat-heavy spaces (restaurants, data centers, healthcare) cost more per square foot because they need more cooling capacity (tons) per square foot.',
  },
  {
    q: 'How much does it cost to replace a commercial rooftop unit (RTU)?',
    a: 'A packaged rooftop unit installed runs about <strong>$2,000–$3,500 per ton</strong>. A common 5-ton RTU therefore lands around $10,000–$17,500 installed, including crane/rigging and tie-ins. Larger or higher-efficiency units cost more.',
  },
  {
    q: 'What does a commercial HVAC system cost by type?',
    a: 'Installed cost per ton: packaged RTU $2,000–$3,500, split systems $2,500–$4,000, heat pumps $3,000–$4,500, VRF/VRV $4,000–$6,500, and chilled-water/chiller plants $4,500–$8,000. The system that fits your building depends on size, layout, and zoning needs — a commercial contractor will size it for you.',
  },
  {
    q: 'Is this estimate a quote?',
    a: 'No. This calculator gives an industry-standard ballpark so you can budget and plan. Actual pricing depends on equipment selection, roof or mechanical-room access, ductwork condition, local labor rates, and permits. Use the form to get free, exact quotes from vetted commercial HVAC contractors in your area.',
  },
]

export default function CostCalculatorPage() {
  const webApp = {
    '@context': 'https://schema.org',
    '@type': 'WebApplication',
    name: 'Commercial HVAC Cost Calculator',
    url: `${SITE_URL}/resources/commercial-hvac-cost-calculator`,
    applicationCategory: 'BusinessApplication',
    operatingSystem: 'Web',
    offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
    description: DESC,
  }

  return (
    <main className="min-h-screen bg-neutral-50">
      <JsonLd data={webApp} />
      <FAQSchema items={FAQ.map((f) => ({ question: f.q, answer: f.a }))} />
      <BreadcrumbSchema items={[
        { name: 'Home', url: SITE_URL },
        { name: 'Resources', url: `${SITE_URL}/resources` },
        { name: 'Cost Calculator', url: `${SITE_URL}/resources/commercial-hvac-cost-calculator` },
      ]} />

      {/* Hero */}
      <section className="bg-white border-b border-neutral-200 py-10 px-4">
        <div className="max-w-5xl mx-auto">
          <nav className="flex items-center gap-1.5 text-xs text-neutral-400 mb-4" aria-label="Breadcrumb">
            <Link href="/" className="hover:text-neutral-600">Home</Link>
            <ChevronRight size={12} aria-hidden="true" />
            <Link href="/resources" className="hover:text-neutral-600">Resources</Link>
            <ChevronRight size={12} aria-hidden="true" />
            <span className="text-neutral-700">Cost Calculator</span>
          </nav>
          <h1 className="text-3xl md:text-4xl font-bold text-neutral-900 font-display mb-3">
            Commercial HVAC Cost Calculator
          </h1>
          <p className="text-lg text-neutral-600 max-w-3xl leading-relaxed">
            Estimate replacement, installation, repair, or maintenance costs for your commercial property in seconds — then get exact quotes from vetted contractors. Built for property and facility managers, not technicians.
          </p>
        </div>
      </section>

      <div className="max-w-5xl mx-auto px-4 py-10 space-y-12">
        {/* The tool */}
        <section><CostEstimator /></section>

        {/* Snippet answer */}
        <section className="bg-white rounded-2xl border border-neutral-200 p-6 sm:p-8">
          <h2 className="text-xl font-semibold text-neutral-900 mb-3">How much does commercial HVAC cost?</h2>
          <p className="text-neutral-700 leading-relaxed">
            Commercial HVAC replacement typically runs <strong>$2,000–$8,000 per ton of cooling installed</strong>, which works out to roughly <strong>$15–$30 per square foot</strong> for a standard office or retail building. Packaged rooftop units (RTUs) sit at the low end; VRF systems and chilled-water plants at the high end. Repairs usually run from a few hundred to a few thousand dollars, and preventive-maintenance contracts run about <strong>$120–$280 per ton per year</strong>.
          </p>
        </section>

        {/* E-E-A-T body */}
        <section className="bg-white rounded-2xl border border-neutral-200 p-6 sm:p-8">
          <h2 className="text-xl font-semibold text-neutral-900 mb-4">What drives commercial HVAC cost</h2>
          <div className="space-y-4 text-neutral-700 leading-relaxed">
            <p><strong>Cooling load (tonnage).</strong> Cost scales with capacity. Commercial buildings need roughly one ton of cooling per 300–600 square feet depending on use — a warehouse needs far less per square foot than a restaurant kitchen or data center.</p>
            <p><strong>System type.</strong> Packaged rooftop units are the most cost-effective for most low-rise commercial buildings. VRF systems and chilled-water plants cost more up front but can be more efficient and flexible for larger or multi-zone properties.</p>
            <p><strong>Installation complexity.</strong> Roof access and crane/rigging, existing ductwork condition, electrical upgrades, controls integration, and permitting all move the final number. A straightforward like-for-like RTU swap is far cheaper than a system conversion.</p>
            <p><strong>Local labor and market.</strong> Labor rates, code requirements, and equipment availability vary by region — which is exactly why a real quote from a local contractor beats any calculator.</p>
          </div>
        </section>

        {/* FAQ */}
        <section>
          <h2 className="text-xl font-semibold text-neutral-900 mb-5">Frequently Asked Questions</h2>
          <div className="space-y-4">
            {FAQ.map((item, i) => (
              <div key={i} className="bg-white border border-neutral-200 rounded-xl p-5">
                <h3 className="text-sm font-semibold text-neutral-900 mb-2">{item.q}</h3>
                <p className="text-sm text-neutral-600 leading-relaxed" dangerouslySetInnerHTML={{ __html: item.a }} />
              </div>
            ))}
          </div>
        </section>

        {/* Internal links */}
        <section className="bg-primary-600 rounded-2xl p-8 text-white">
          <h2 className="text-xl font-bold mb-2">Ready for real numbers?</h2>
          <p className="text-primary-100 mb-5 max-w-2xl">Compare vetted commercial HVAC contractors and get free quotes for your building.</p>
          <div className="flex flex-wrap gap-3 text-sm">
            <Link href="/search" className="bg-white text-primary-700 font-medium px-4 py-2.5 rounded-lg hover:bg-primary-50">Find contractors near you</Link>
            <Link href="/services" className="border border-primary-300 text-white font-medium px-4 py-2.5 rounded-lg hover:bg-primary-500">Browse commercial HVAC services</Link>
            <Link href="/resources" className="border border-primary-300 text-white font-medium px-4 py-2.5 rounded-lg hover:bg-primary-500">More resources & tools</Link>
          </div>
        </section>
      </div>
    </main>
  )
}
