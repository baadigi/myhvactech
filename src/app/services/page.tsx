import { Metadata } from 'next'
import Link from 'next/link'
import {
  Thermometer, Wind, Wrench, Settings, Building2, Zap,
  CheckCircle, ChevronRight, Search
} from 'lucide-react'
import { HVAC_SERVICES, SITE_URL } from '@/lib/constants'

export const metadata: Metadata = {
  title: 'Commercial HVAC Services',
  description: 'Browse all commercial HVAC services. Find licensed contractors for AC repair, chiller maintenance, rooftop unit service, emergency HVAC, and more.',
  alternates: { canonical: `${SITE_URL}/services` },
  openGraph: {
    title: 'Commercial HVAC Services',
    description: 'Find licensed contractors for any commercial HVAC service.',
  },
}

const SERVICE_ICONS: Record<string, React.ReactNode> = {
  'commercial-ac-repair': <Thermometer size={22} />,
  'commercial-ac-installation': <Wind size={22} />,
  'commercial-heating-repair': <Wrench size={22} />,
  'commercial-heating-installation': <Settings size={22} />,
  'rooftop-unit-service': <Building2 size={22} />,
  'chiller-repair-maintenance': <Thermometer size={22} />,
  'boiler-service': <Settings size={22} />,
  'ductwork-installation-repair': <Wind size={22} />,
  'commercial-refrigeration': <Thermometer size={22} />,
  'preventive-maintenance-plans': <CheckCircle size={22} />,
  'emergency-hvac-service': <Zap size={22} />,
  'building-automation-systems': <Settings size={22} />,
  'indoor-air-quality': <Wind size={22} />,
  'energy-audits-retrofits': <CheckCircle size={22} />,
  'vrf-vrv-systems': <Settings size={22} />,
}

const SERVICE_DESCRIPTIONS: Record<string, string> = {
  'commercial-ac-repair': 'Expert diagnosis and repair of commercial cooling systems including rooftop units, split systems, and chilled water plants.',
  'commercial-ac-installation': 'New commercial AC system design, equipment selection, and code-compliant installation for any building size.',
  'commercial-heating-repair': 'Repair of commercial heating systems including furnaces, heat pumps, boilers, and rooftop heating units.',
  'commercial-heating-installation': 'New commercial heating system installation with professional load calculations and equipment sizing.',
  'rooftop-unit-service': 'Comprehensive maintenance, repair, and replacement of commercial packaged rooftop units (RTUs).',
  'chiller-repair-maintenance': 'Expert chiller plant service including repair, maintenance, oil analysis, and full-system commissioning.',
  'boiler-service': 'Commercial boiler maintenance, repair, and compliance inspections for steam and hot water systems.',
  'ductwork-installation-repair': 'New ductwork design, installation, sealing, and balancing for commercial buildings.',
  'commercial-refrigeration': 'Service and repair of commercial refrigeration including walk-in coolers, freezers, and display cases.',
  'preventive-maintenance-plans': 'Customized PM contracts that reduce breakdowns, extend equipment life, and ensure compliance.',
  'emergency-hvac-service': '24/7 emergency HVAC response for critical system failures and commercial building emergencies.',
  'building-automation-systems': 'BAS design, installation, integration, and programming for centralized building control.',
  'indoor-air-quality': 'Commercial IAQ testing, filtration upgrades, UV systems, and ventilation balancing.',
  'energy-audits-retrofits': 'Energy efficiency audits and HVAC retrofits that reduce utility costs and qualify for incentives.',
  'vrf-vrv-systems': 'Variable refrigerant flow system design, installation, and service for modern commercial buildings.',
}

const CATEGORY_CONFIG = {
  Installation: {
    color: 'bg-primary-100 text-primary-600',
    headerBg: 'bg-primary-600',
  },
  Repair: {
    color: 'bg-orange-100 text-orange-600',
    headerBg: 'bg-orange-500',
  },
  Maintenance: {
    color: 'bg-accent-100 text-accent-600',
    headerBg: 'bg-accent-600',
  },
  Emergency: {
    color: 'bg-red-100 text-red-600',
    headerBg: 'bg-red-600',
  },
}

const CATEGORIES = ['Repair', 'Installation', 'Maintenance', 'Emergency'] as const

export default function ServicesPage() {
  return (
    <main className="min-h-screen bg-neutral-50">

      {/* ── Hero ──────────────────────────────────────────────────────────── */}
      <section className="bg-white border-b border-neutral-200 py-12 px-4">
        <div className="max-w-5xl mx-auto">
          <h1 className="text-3xl md:text-4xl font-bold text-neutral-900 font-display mb-4">
            Commercial HVAC Services
          </h1>
          <p className="text-lg text-neutral-600 max-w-3xl leading-relaxed">
            From emergency AC repair to full chiller plant installations, My HVAC Tech connects building owners, property managers, and facility directors with licensed commercial HVAC contractors for every service need.
          </p>
          <div className="mt-6">
            <Link
              href="/search"
              className="inline-flex items-center gap-2 bg-primary-500 text-white font-semibold text-sm px-6 py-3 rounded-lg hover:bg-primary-600 transition-colors"
            >
              <Search size={15} aria-hidden="true" />
              Find a Contractor Near You
            </Link>
          </div>
        </div>
      </section>

      <div className="max-w-5xl mx-auto px-4 py-10">

        {/* ── Services by Category ──────────────────────────────────────── */}
        {CATEGORIES.map((category) => {
          const services = HVAC_SERVICES.filter((s) => s.category === category)
          const config = CATEGORY_CONFIG[category]

          return (
            <section key={category} className="mb-12">
              <div className="flex items-center gap-3 mb-5">
                <div className={`w-2 h-6 rounded-full ${config.headerBg}`} aria-hidden="true" />
                <h2 className="text-xl font-semibold text-neutral-900">{category} Services</h2>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                {services.map((svc) => (
                  <Link
                    key={svc.slug}
                    href={`/services/${svc.slug}`}
                    className="group bg-white border border-neutral-200 rounded-xl p-5 hover:border-neutral-300 hover:shadow-md transition-all"
                  >
                    <div className={`w-11 h-11 rounded-xl flex items-center justify-center mb-3 transition-colors ${config.color}`}>
                      {SERVICE_ICONS[svc.slug] || <Settings size={22} />}
                    </div>
                    <h3 className="text-sm font-semibold text-neutral-900 group-hover:text-primary-600 mb-1.5 transition-colors">
                      {svc.name}
                    </h3>
                    <p className="text-xs text-neutral-500 leading-relaxed mb-3">
                      {SERVICE_DESCRIPTIONS[svc.slug] || `Professional ${svc.name.toLowerCase()} for commercial buildings.`}
                    </p>
                    <span className="inline-flex items-center gap-1 text-xs font-medium text-primary-600 group-hover:gap-2 transition-all">
                      Find contractors
                      <ChevronRight size={11} aria-hidden="true" />
                    </span>
                  </Link>
                ))}
              </div>
            </section>
          )
        })}

        {/* ── CTA Band ─────────────────────────────────────────────────── */}
        <section className="bg-neutral-900 rounded-2xl p-8 text-white text-center">
          <h2 className="text-xl font-bold mb-2">Not sure what service you need?</h2>
          <p className="text-neutral-400 text-sm mb-5">
            Search by city and describe your issue. Our contractor network will respond with recommendations and pricing.
          </p>
          <Link
            href="/search"
            className="inline-flex items-center gap-2 bg-white text-neutral-900 font-semibold text-sm px-6 py-3 rounded-lg hover:bg-neutral-100 transition-colors"
          >
            <Search size={15} aria-hidden="true" />
            Search Commercial HVAC Contractors
          </Link>
        </section>

      </div>
    </main>
  )
}
