import type { Metadata } from 'next'
import Link from 'next/link'
import { Calculator, ClipboardCheck, CalendarCheck, ChevronRight, ArrowRight } from 'lucide-react'
import { SITE_URL } from '@/lib/constants'
import { BreadcrumbSchema, ItemListSchema } from '@/components/SchemaOrg'

const TITLE = 'Commercial HVAC Resources & Tools'
const DESC =
  'Free tools and guides for property and facility managers: estimate commercial HVAC costs, vet contractors, and plan maintenance — then get quotes from vetted pros.'

export const metadata: Metadata = {
  title: TITLE,
  description: DESC,
  alternates: { canonical: `${SITE_URL}/resources` },
  openGraph: { title: TITLE, description: DESC, url: `${SITE_URL}/resources` },
}

// Live tools. Add new tools here as they ship.
const TOOLS = [
  {
    href: '/resources/commercial-hvac-cost-calculator',
    title: 'Commercial HVAC Cost Calculator',
    blurb: 'Estimate replacement, install, repair, or maintenance costs by building type and size — then get exact quotes.',
    icon: Calculator,
    cta: 'Estimate my cost',
  },
  {
    href: '/resources/commercial-hvac-contractor-checklist',
    title: 'Contractor Vetting Checklist + RFP Template',
    blurb: 'Vet contractors the right way and download a free editable RFP template so every bid is apples-to-apples.',
    icon: ClipboardCheck,
    cta: 'Get the checklist',
  },
  {
    href: '/resources/commercial-hvac-maintenance-plan',
    title: 'Preventive Maintenance Plan Builder',
    blurb: 'Build a recommended PM schedule for your equipment, then have a vetted contractor quote and run it.',
    icon: CalendarCheck,
    cta: 'Build my plan',
  },
]

export default function ResourcesPage() {
  return (
    <main className="min-h-screen bg-neutral-50">
      <BreadcrumbSchema items={[
        { name: 'Home', url: SITE_URL },
        { name: 'Resources', url: `${SITE_URL}/resources` },
      ]} />
      <ItemListSchema items={TOOLS.map((t) => ({ name: t.title, url: `${SITE_URL}${t.href}` }))} />

      <section className="bg-white border-b border-neutral-200 py-12 px-4">
        <div className="max-w-5xl mx-auto">
          <nav className="flex items-center gap-1.5 text-xs text-neutral-400 mb-4" aria-label="Breadcrumb">
            <Link href="/" className="hover:text-neutral-600">Home</Link>
            <ChevronRight size={12} aria-hidden="true" />
            <span className="text-neutral-700">Resources</span>
          </nav>
          <h1 className="text-3xl md:text-4xl font-bold text-neutral-900 font-display mb-3">
            Commercial HVAC Resources &amp; Tools
          </h1>
          <p className="text-lg text-neutral-600 max-w-3xl leading-relaxed">
            Free, practical tools for property and facility managers — estimate costs, vet contractors, and plan maintenance with confidence. No fluff, no manuals; just what helps you make the call.
          </p>
        </div>
      </section>

      <div className="max-w-5xl mx-auto px-4 py-10">
        <div className="grid sm:grid-cols-2 gap-5">
          {TOOLS.map((t) => {
            const Icon = t.icon
            return (
              <Link
                key={t.href}
                href={t.href}
                className="group bg-white rounded-2xl border border-neutral-200 p-6 hover:border-primary-300 hover:shadow-md transition-all"
              >
                <div className="w-11 h-11 rounded-xl bg-primary-50 flex items-center justify-center mb-4">
                  <Icon size={20} className="text-primary-600" aria-hidden="true" />
                </div>
                <h2 className="text-lg font-semibold text-neutral-900 group-hover:text-primary-700 transition-colors">{t.title}</h2>
                <p className="text-sm text-neutral-600 mt-1.5 leading-relaxed">{t.blurb}</p>
                <span className="inline-flex items-center gap-1 text-sm text-primary-600 font-medium mt-4">
                  {t.cta} <ArrowRight size={14} className="group-hover:translate-x-0.5 transition-transform" aria-hidden="true" />
                </span>
              </Link>
            )
          })}
        </div>

        <section className="mt-12 bg-primary-600 rounded-2xl p-8 text-white">
          <h2 className="text-xl font-bold mb-2">Need a contractor now?</h2>
          <p className="text-primary-100 mb-5 max-w-2xl">Skip the research — compare vetted commercial HVAC contractors and get free quotes for your building.</p>
          <Link href="/search" className="inline-flex items-center gap-2 bg-white text-primary-700 font-medium px-5 py-2.5 rounded-lg hover:bg-primary-50">
            Find contractors near you <ArrowRight size={16} aria-hidden="true" />
          </Link>
        </section>
      </div>
    </main>
  )
}
