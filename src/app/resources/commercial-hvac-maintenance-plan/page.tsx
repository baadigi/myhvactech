import type { Metadata } from 'next'
import Link from 'next/link'
import { ChevronRight } from 'lucide-react'
import { SITE_URL } from '@/lib/constants'
import { FAQSchema, BreadcrumbSchema } from '@/components/SchemaOrg'
import MaintenancePlanBuilder from '@/components/MaintenancePlanBuilder'

const TITLE = 'Commercial HVAC Preventive Maintenance Plan (Free Builder)'
const DESC =
  'Build a commercial HVAC preventive-maintenance plan in seconds — recommended tasks and visit cadence by building type and system — then get it quoted by vetted contractors.'

export const metadata: Metadata = {
  title: TITLE,
  description: DESC,
  alternates: { canonical: `${SITE_URL}/resources/commercial-hvac-maintenance-plan` },
  openGraph: { title: TITLE, description: DESC, url: `${SITE_URL}/resources/commercial-hvac-maintenance-plan` },
}

const FAQ = [
  {
    q: 'What does a commercial HVAC preventive maintenance plan include?',
    a: 'A typical plan includes filter changes and visual inspections (monthly–quarterly), electrical and safety-control checks plus condensate-drain service (semi-annual), and a deep coil cleaning, refrigerant check, and full tune-up (annual). Chillers, cooling towers, and boilers add system-specific tasks like tube cleaning, water treatment, and combustion analysis.',
  },
  {
    q: 'How often should commercial HVAC be serviced?',
    a: 'Most commercial buildings should have HVAC serviced at least twice a year (before cooling and heating seasons). Properties with many rooftop units or critical loads often move to quarterly or monthly visits to catch problems before they cause downtime.',
  },
  {
    q: 'How much does a commercial HVAC maintenance contract cost?',
    a: 'Preventive-maintenance agreements typically run about $120–$280 per ton of capacity per year, depending on system type, number of units, and visit frequency. The savings come from fewer emergency breakdowns and longer equipment life.',
  },
  {
    q: 'Is preventive maintenance worth it for commercial HVAC?',
    a: 'Yes. Preventive maintenance reduces emergency repairs and unplanned downtime, keeps equipment running efficiently (lower energy bills), and extends equipment life — usually paying for itself versus run-to-failure.',
  },
]

export default function MaintenancePlanPage() {
  return (
    <main className="min-h-screen bg-neutral-50">
      <FAQSchema items={FAQ.map((f) => ({ question: f.q, answer: f.a }))} />
      <BreadcrumbSchema items={[
        { name: 'Home', url: SITE_URL },
        { name: 'Resources', url: `${SITE_URL}/resources` },
        { name: 'Maintenance Plan', url: `${SITE_URL}/resources/commercial-hvac-maintenance-plan` },
      ]} />

      <section className="bg-white border-b border-neutral-200 py-10 px-4">
        <div className="max-w-5xl mx-auto">
          <nav className="flex items-center gap-1.5 text-xs text-neutral-400 mb-4" aria-label="Breadcrumb">
            <Link href="/" className="hover:text-neutral-600">Home</Link>
            <ChevronRight size={12} aria-hidden="true" />
            <Link href="/resources" className="hover:text-neutral-600">Resources</Link>
            <ChevronRight size={12} aria-hidden="true" />
            <span className="text-neutral-700">Maintenance Plan</span>
          </nav>
          <h1 className="text-3xl md:text-4xl font-bold text-neutral-900 font-display mb-3">
            Commercial HVAC Preventive Maintenance Plan Builder
          </h1>
          <p className="text-lg text-neutral-600 max-w-3xl leading-relaxed">
            Get a recommended preventive-maintenance schedule for your building&apos;s equipment — then have a vetted contractor quote and run it.
          </p>
        </div>
      </section>

      <div className="max-w-5xl mx-auto px-4 py-10 space-y-12">
        <section><MaintenancePlanBuilder /></section>

        <section className="bg-white rounded-2xl border border-neutral-200 p-6 sm:p-8">
          <h2 className="text-xl font-semibold text-neutral-900 mb-3">How often should commercial HVAC be serviced?</h2>
          <p className="text-neutral-700 leading-relaxed">
            At a minimum, twice a year — before cooling season and before heating season. Buildings with many rooftop units, critical cooling loads (healthcare, data centers, restaurants), or aging equipment usually move to quarterly or monthly visits. The goal is to catch small problems during a scheduled visit instead of paying for emergency repairs and downtime.
          </p>
        </section>

        <section className="bg-white rounded-2xl border border-neutral-200 p-6 sm:p-8">
          <h2 className="text-xl font-semibold text-neutral-900 mb-4">Why preventive maintenance pays off</h2>
          <div className="space-y-4 text-neutral-700 leading-relaxed">
            <p><strong>Fewer emergencies.</strong> Most commercial HVAC failures are preventable — clogged filters, dirty coils, loose electrical, low refrigerant. Catching them on a schedule avoids after-hours emergency rates and tenant complaints.</p>
            <p><strong>Lower energy bills.</strong> Clean coils and correct refrigerant charge keep systems running at rated efficiency. Neglected equipment quietly burns more energy every month.</p>
            <p><strong>Longer equipment life.</strong> Maintained rooftop units and chillers last years longer, deferring big capital replacements.</p>
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
          <h2 className="text-xl font-bold mb-2">Put it on a schedule</h2>
          <p className="text-primary-100 mb-5 max-w-2xl">Compare vetted commercial HVAC contractors who offer preventive-maintenance agreements.</p>
          <div className="flex flex-wrap gap-3 text-sm">
            <Link href="/search" className="bg-white text-primary-700 font-medium px-4 py-2.5 rounded-lg hover:bg-primary-50">Find contractors near you</Link>
            <Link href="/resources/commercial-hvac-cost-calculator" className="border border-primary-300 text-white font-medium px-4 py-2.5 rounded-lg hover:bg-primary-500">Estimate maintenance cost</Link>
            <Link href="/resources" className="border border-primary-300 text-white font-medium px-4 py-2.5 rounded-lg hover:bg-primary-500">More tools</Link>
          </div>
        </section>
      </div>
    </main>
  )
}
