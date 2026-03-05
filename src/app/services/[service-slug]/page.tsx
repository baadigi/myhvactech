import { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import {
  Thermometer, Wind, Wrench, Settings, Building2, Zap,
  CheckCircle, ChevronRight, Search, MapPin, HelpCircle
} from 'lucide-react'
import { HVAC_SERVICES, US_STATES, SITE_NAME } from '@/lib/constants'

// ─── Types ───────────────────────────────────────────────────────────────────

interface Props {
  params: Promise<{ 'service-slug': string }>
}

// ─── Service Content ──────────────────────────────────────────────────────────

const SERVICE_DESCRIPTIONS: Record<string, { full: string; what: string[] }> = {
  'commercial-ac-repair': {
    full: 'Commercial air conditioning repair requires specialized training and equipment far beyond residential service. Commercial systems — including rooftop packaged units, split systems, variable air volume (VAV) systems, and chilled water plants — operate continuously under heavy loads and serve hundreds of occupants. When they fail, the consequences range from employee discomfort to regulatory violations, food spoilage, or medical equipment failures.',
    what: ['Refrigerant leak detection and repair', 'Compressor diagnosis and replacement', 'Condenser and evaporator coil service', 'Electrical component testing and replacement', 'Controls and thermostat calibration', 'System performance testing and documentation'],
  },
  'commercial-ac-installation': {
    full: 'Commercial AC installation is a complex mechanical, electrical, and structural undertaking. Proper system design requires ACCA Manual N commercial load calculations to correctly size equipment for the building\'s heat load, occupancy patterns, and local climate. Undersized systems run continuously, wear prematurely, and fail to maintain temperature. Oversized systems short-cycle, waste energy, and fail to dehumidify properly.',
    what: ['Site survey and load calculation', 'Equipment selection and specification', 'Ductwork design and installation', 'Electrical service coordination', 'Permits, inspections, and commissioning', 'Training on controls and BAS integration'],
  },
  'rooftop-unit-service': {
    full: 'Rooftop packaged units (RTUs) are the workhorse of commercial HVAC, serving the majority of small and mid-size commercial buildings across the US. Regular service keeps them running efficiently, extends their 15–20 year lifespan, and prevents the emergency failures that disrupt business operations. Annual preventive maintenance is the single highest-ROI activity for commercial building operators.',
    what: ['Safety and structural inspection', 'Filter replacement and coil cleaning', 'Refrigerant pressure check', 'Electrical connection inspection', 'Economizer and damper service', 'Performance benchmarking and reporting'],
  },
  'emergency-hvac-service': {
    full: '24/7 commercial HVAC emergency service is critical for buildings where temperature failures create health, safety, or financial consequences. Data centers, hospitals, restaurants, food storage, and pharmaceutical facilities cannot tolerate extended equipment outages. Even standard office buildings face productivity loss, tenant complaints, and potential lease violations during HVAC failures.',
    what: ['24/7 dispatch with typical 1–4 hour response', 'Emergency diagnosis and temporary fix to restore function', 'Emergency parts sourcing', 'After-hours premium service documentation', 'Follow-up permanent repair scheduling', 'Incident report for insurance or facilities records'],
  },
}

const SERVICE_ICONS: Record<string, React.ReactNode> = {
  'commercial-ac-repair': <Thermometer size={28} />,
  'commercial-ac-installation': <Wind size={28} />,
  'commercial-heating-repair': <Wrench size={28} />,
  'commercial-heating-installation': <Settings size={28} />,
  'rooftop-unit-service': <Building2 size={28} />,
  'chiller-repair-maintenance': <Thermometer size={28} />,
  'boiler-service': <Settings size={28} />,
  'ductwork-installation-repair': <Wind size={28} />,
  'commercial-refrigeration': <Thermometer size={28} />,
  'preventive-maintenance-plans': <CheckCircle size={28} />,
  'emergency-hvac-service': <Zap size={28} />,
  'building-automation-systems': <Settings size={28} />,
  'indoor-air-quality': <Wind size={28} />,
  'energy-audits-retrofits': <CheckCircle size={28} />,
  'vrf-vrv-systems': <Settings size={28} />,
}

const TOP_CITIES = [
  { state: 'arizona', city: 'phoenix', label: 'Phoenix, AZ' },
  { state: 'texas', city: 'houston', label: 'Houston, TX' },
  { state: 'california', city: 'los-angeles', label: 'Los Angeles, CA' },
  { state: 'florida', city: 'miami', label: 'Miami, FL' },
  { state: 'illinois', city: 'chicago', label: 'Chicago, IL' },
  { state: 'new-york', city: 'new-york-city', label: 'New York, NY' },
  { state: 'georgia', city: 'atlanta', label: 'Atlanta, GA' },
  { state: 'north-carolina', city: 'charlotte', label: 'Charlotte, NC' },
]

// ─── Static Params ────────────────────────────────────────────────────────────

export async function generateStaticParams() {
  return HVAC_SERVICES.map((s) => ({ 'service-slug': s.slug }))
}

// ─── Metadata ─────────────────────────────────────────────────────────────────

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { 'service-slug': serviceSlug } = await params
  const service = HVAC_SERVICES.find((s) => s.slug === serviceSlug)
  if (!service) return { title: 'Not Found' }

  return {
    title: `${service.name} Contractors | ${SITE_NAME}`,
    description: `Find licensed ${service.name.toLowerCase()} contractors near you. Compare verified reviews, request free quotes, and hire certified commercial HVAC professionals.`,
    openGraph: {
      title: `${service.name} — Commercial HVAC Contractors`,
      description: `Find licensed ${service.name.toLowerCase()} contractors near you. Verified reviews, free quotes.`,
    },
  }
}

// ─── FAQ ─────────────────────────────────────────────────────────────────────

function getFAQ(serviceName: string, serviceSlug: string) {
  return [
    {
      q: `What qualifications should a commercial ${serviceName.toLowerCase()} contractor have?`,
      a: `Commercial HVAC contractors should hold a state contractor's license, carry general liability insurance ($1M+ per occurrence), and employ NATE-certified technicians. For refrigerant work, EPA Section 608 certification is federally required. For specialized equipment like chillers or BAS systems, look for manufacturer-specific certifications.`,
    },
    {
      q: `How do I get accurate pricing for ${serviceName.toLowerCase()}?`,
      a: `Request itemized written quotes from at least three contractors. Be specific about your system type, building square footage, and the scope of work. Avoid contractors who quote without a site visit for anything beyond simple repairs. Compare warranties on both labor and parts, not just the bottom-line price.`,
    },
    {
      q: `How long does ${serviceName.toLowerCase()} typically take?`,
      a: `The timeline depends heavily on system complexity, parts availability, and permit requirements. Simple repairs often complete same-day. Equipment replacements typically take 1–3 days. Complex installations or large-scale projects may require weeks of planning, coordination, and phased execution to avoid disrupting building occupants.`,
    },
    {
      q: `Can I schedule ${serviceName.toLowerCase()} outside business hours?`,
      a: `Many commercial HVAC contractors offer after-hours, weekend, and holiday scheduling — especially for facilities that can't tolerate business interruption. Plan for premium pricing during off-hours. For preventive work, scheduling during low-occupancy periods is often easier on building operations.`,
    },
  ]
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default async function ServicePage({ params }: Props) {
  const { 'service-slug': serviceSlug } = await params
  const service = HVAC_SERVICES.find((s) => s.slug === serviceSlug)
  if (!service) notFound()

  const content = SERVICE_DESCRIPTIONS[serviceSlug]
  const faq = getFAQ(service.name, serviceSlug)
  const relatedServices = HVAC_SERVICES
    .filter((s) => s.slug !== serviceSlug && s.category === service.category)
    .slice(0, 4)
  const otherCategoryServices = HVAC_SERVICES
    .filter((s) => s.slug !== serviceSlug && s.category !== service.category)
    .slice(0, 4)

  const categoryColor = {
    Repair: 'bg-orange-100 text-orange-600',
    Installation: 'bg-primary-100 text-primary-600',
    Maintenance: 'bg-accent-100 text-accent-600',
    Emergency: 'bg-red-100 text-red-600',
  }[service.category] || 'bg-neutral-100 text-neutral-600'

  return (
    <main className="min-h-screen bg-neutral-50">

      {/* ── Hero ──────────────────────────────────────────────────────────── */}
      <section className="bg-white border-b border-neutral-200 py-12 px-4">
        <div className="max-w-5xl mx-auto">
          <nav className="flex items-center gap-1.5 text-xs text-neutral-400 mb-4" aria-label="Breadcrumb">
            <Link href="/" className="hover:text-neutral-600 transition-colors">Home</Link>
            <ChevronRight size={12} aria-hidden="true" />
            <Link href="/services" className="hover:text-neutral-600 transition-colors">Services</Link>
            <ChevronRight size={12} aria-hidden="true" />
            <span className="text-neutral-700">{service.name}</span>
          </nav>

          <div className="flex items-start gap-5">
            <div className={`w-14 h-14 rounded-xl flex items-center justify-center shrink-0 ${categoryColor}`}>
              {SERVICE_ICONS[serviceSlug] || <Settings size={28} />}
            </div>
            <div>
              <div className="flex items-center gap-2 mb-2">
                <span className="text-xs font-semibold text-neutral-500 uppercase tracking-wide bg-neutral-100 px-2.5 py-0.5 rounded-full">
                  {service.category}
                </span>
              </div>
              <h1 className="text-3xl md:text-4xl font-bold text-neutral-900 font-display mb-3">
                {service.name}
              </h1>
              <p className="text-lg text-neutral-600 max-w-3xl leading-relaxed">
                {content?.full || `${service.name} is a critical commercial building service. Licensed contractors provide expert diagnosis, quality workmanship, and documented service records for all commercial systems.`}
              </p>
            </div>
          </div>

          <div className="mt-6 flex flex-wrap gap-3">
            <Link
              href={`/search?service=${serviceSlug}`}
              className="inline-flex items-center gap-2 bg-primary-500 text-white font-semibold text-sm px-6 py-3 rounded-lg hover:bg-primary-600 transition-colors"
            >
              <Search size={15} aria-hidden="true" />
              Find {service.name} Contractors
            </Link>
          </div>
        </div>
      </section>

      <div className="max-w-5xl mx-auto px-4 py-10">

        {/* ── What's Included ──────────────────────────────────────────── */}
        {content?.what && (
          <section className="mb-12">
            <h2 className="text-xl font-semibold text-neutral-900 mb-5">
              What&apos;s Typically Included
            </h2>
            <div className="bg-white border border-neutral-200 rounded-xl p-6">
              <ul className="space-y-2">
                {content.what.map((item, i) => (
                  <li key={i} className="flex items-start gap-3 text-sm text-neutral-700">
                    <CheckCircle size={15} className="text-accent-500 mt-0.5 shrink-0" aria-hidden="true" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          </section>
        )}

        {/* ── Find Contractors by City ─────────────────────────────────── */}
        <section className="mb-12">
          <h2 className="text-xl font-semibold text-neutral-900 mb-5">
            Find {service.name} Contractors by City
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
            {TOP_CITIES.map(({ state, city, label }) => (
              <Link
                key={`${state}/${city}`}
                href={`/${state}/${city}/${serviceSlug}`}
                className="flex items-center gap-2 bg-white border border-neutral-200 rounded-xl px-4 py-3 text-sm font-medium text-neutral-700 hover:border-primary-300 hover:text-primary-700 hover:bg-primary-50 transition-all group"
              >
                <MapPin size={12} className="text-neutral-400 group-hover:text-primary-500 shrink-0" aria-hidden="true" />
                {label}
              </Link>
            ))}
          </div>
          <p className="mt-3 text-sm text-neutral-500">
            Don&apos;t see your city?{' '}
            <Link href={`/search?service=${serviceSlug}`} className="text-primary-600 hover:text-primary-700 font-medium">
              Search by location
            </Link>
          </p>
        </section>

        {/* ── Related Services ─────────────────────────────────────────── */}
        <section className="mb-12">
          <h2 className="text-xl font-semibold text-neutral-900 mb-5">
            Related Services
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {[...relatedServices, ...otherCategoryServices].slice(0, 4).map((svc) => (
              <Link
                key={svc.slug}
                href={`/services/${svc.slug}`}
                className="flex items-center gap-2 bg-white border border-neutral-200 rounded-xl px-4 py-3.5 text-sm text-neutral-700 hover:border-primary-300 hover:text-primary-700 hover:bg-primary-50 transition-all group"
              >
                <ChevronRight size={13} className="text-neutral-300 group-hover:text-primary-500 shrink-0" aria-hidden="true" />
                {svc.name}
              </Link>
            ))}
          </div>
        </section>

        {/* ── FAQ ─────────────────────────────────────────────────────────── */}
        <section>
          <h2 className="text-xl font-semibold text-neutral-900 mb-5">
            Frequently Asked Questions — {service.name}
          </h2>
          <div className="space-y-4">
            {faq.map((item, i) => (
              <div key={i} className="bg-white border border-neutral-200 rounded-xl p-5">
                <h3 className="text-sm font-semibold text-neutral-900 mb-2 flex items-start gap-2">
                  <HelpCircle size={15} className="text-neutral-400 mt-0.5 shrink-0" aria-hidden="true" />
                  {item.q}
                </h3>
                <p className="text-sm text-neutral-600 leading-relaxed pl-5">{item.a}</p>
              </div>
            ))}
          </div>
        </section>

      </div>
    </main>
  )
}
