import type { Metadata } from 'next'
import Link from 'next/link'
import { ChevronRight } from 'lucide-react'
import { SITE_URL } from '@/lib/constants'
import { FAQSchema, BreadcrumbSchema } from '@/components/SchemaOrg'
import ContractorChecklist from '@/components/ContractorChecklist'

const TITLE = 'How to Hire a Commercial HVAC Contractor (Checklist + Free RFP Template)'
const DESC =
  'A facility manager’s checklist for vetting commercial HVAC contractors — licensing, insurance, references, warranties — plus a free editable RFP template so every bid is apples-to-apples.'

export const metadata: Metadata = {
  title: TITLE,
  description: DESC,
  alternates: { canonical: `${SITE_URL}/resources/commercial-hvac-contractor-checklist` },
  openGraph: { title: TITLE, description: DESC, url: `${SITE_URL}/resources/commercial-hvac-contractor-checklist` },
}

const FAQ = [
  {
    q: 'How do I choose a commercial HVAC contractor?',
    a: 'Verify an active state license and adequate insurance (general liability and workers’ comp), confirm they have real commercial experience with your system type, ask for three references on similar properties, and require an itemized written proposal with a warranty on parts and labor. Get at least three bids using the same scope so they’re comparable.',
  },
  {
    q: 'What should I ask a commercial HVAC contractor before hiring?',
    a: 'Ask for their license number, certificate of insurance, commercial references, equipment make/model and efficiency ratings, written warranty terms, project timeline and payment schedule, and their emergency response time. Use an RFP so every contractor answers the same questions.',
  },
  {
    q: 'What is a commercial HVAC RFP?',
    a: 'An RFP (Request for Proposal) is a short document describing your building, the scope of work, and the requirements a contractor must meet. Sending the same RFP to multiple contractors makes bids apples-to-apples, which leads to better pricing and fewer surprise change orders.',
  },
  {
    q: 'How many bids should I get for a commercial HVAC project?',
    a: 'Get at least three written, itemized bids on the same scope. Don’t automatically pick the lowest — weigh equipment quality and efficiency, contractor qualifications and references, warranty, and timeline alongside price.',
  },
]

export default function ChecklistPage() {
  return (
    <main className="min-h-screen bg-neutral-50">
      <FAQSchema items={FAQ.map((f) => ({ question: f.q, answer: f.a }))} />
      <BreadcrumbSchema items={[
        { name: 'Home', url: SITE_URL },
        { name: 'Resources', url: `${SITE_URL}/resources` },
        { name: 'Contractor Checklist', url: `${SITE_URL}/resources/commercial-hvac-contractor-checklist` },
      ]} />

      <section className="bg-white border-b border-neutral-200 py-10 px-4">
        <div className="max-w-5xl mx-auto">
          <nav className="flex items-center gap-1.5 text-xs text-neutral-400 mb-4" aria-label="Breadcrumb">
            <Link href="/" className="hover:text-neutral-600">Home</Link>
            <ChevronRight size={12} aria-hidden="true" />
            <Link href="/resources" className="hover:text-neutral-600">Resources</Link>
            <ChevronRight size={12} aria-hidden="true" />
            <span className="text-neutral-700">Contractor Checklist</span>
          </nav>
          <h1 className="text-3xl md:text-4xl font-bold text-neutral-900 font-display mb-3">
            How to Hire a Commercial HVAC Contractor
          </h1>
          <p className="text-lg text-neutral-600 max-w-3xl leading-relaxed">
            A practical vetting checklist for property and facility managers — plus a free, editable RFP template so every bid is apples-to-apples.
          </p>
        </div>
      </section>

      <div className="max-w-5xl mx-auto px-4 py-10 space-y-12">
        <section><ContractorChecklist /></section>

        <section className="bg-white rounded-2xl border border-neutral-200 p-6 sm:p-8">
          <h2 className="text-xl font-semibold text-neutral-900 mb-3">How do I choose a commercial HVAC contractor?</h2>
          <p className="text-neutral-700 leading-relaxed">
            Verify an active state license and adequate insurance (general liability and workers’ comp), confirm real commercial experience with your system type, ask for three references on similar properties, and require an itemized written proposal with a warranty on parts and labor. Get at least three bids on the same scope — an RFP makes that easy.
          </p>
        </section>

        <section className="bg-white rounded-2xl border border-neutral-200 p-6 sm:p-8">
          <h2 className="text-xl font-semibold text-neutral-900 mb-4">Why commercial is different from residential</h2>
          <div className="space-y-4 text-neutral-700 leading-relaxed">
            <p><strong>Different equipment, different expertise.</strong> Rooftop units, chillers, VRF, and building-automation controls aren’t residential work. A contractor who’s great in homes may not be the right fit for a 40-ton rooftop replacement.</p>
            <p><strong>Downtime has a dollar cost.</strong> In commercial buildings, an outage affects tenants, customers, or operations — so emergency response time and a real maintenance agreement matter as much as install price.</p>
            <p><strong>Bids vary wildly without a scope.</strong> The single biggest source of surprise change orders is a vague scope. Send every contractor the same RFP and the bids become comparable.</p>
          </div>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-neutral-900 mb-5">Frequently Asked Questions</h2>
          <div className="space-y-4">
            {FAQ.map((item, i) => (
              <div key={i} className="bg-white border border-neutral-200 rounded-xl p-5">
                <h3 className="text-sm font-semibold text-neutral-900 mb-2">{item.q}</h3>
                <p className="text-sm text-neutral-600 leading-relaxed">{item.a}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="bg-primary-600 rounded-2xl p-8 text-white">
          <h2 className="text-xl font-bold mb-2">Skip the cold-calling</h2>
          <p className="text-primary-100 mb-5 max-w-2xl">Compare vetted commercial HVAC contractors and get quotes — we’ve already checked the basics.</p>
          <div className="flex flex-wrap gap-3 text-sm">
            <Link href="/search" className="bg-white text-primary-700 font-medium px-4 py-2.5 rounded-lg hover:bg-primary-50">Find contractors near you</Link>
            <Link href="/resources/commercial-hvac-cost-calculator" className="border border-primary-300 text-white font-medium px-4 py-2.5 rounded-lg hover:bg-primary-500">Estimate project cost</Link>
            <Link href="/resources" className="border border-primary-300 text-white font-medium px-4 py-2.5 rounded-lg hover:bg-primary-500">More tools</Link>
          </div>
        </section>
      </div>
    </main>
  )
}
