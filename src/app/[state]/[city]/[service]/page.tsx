import { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ChevronRight, Shield, Star, DollarSign, HelpCircle, Clock, CheckCircle, Search } from 'lucide-react'
import { US_STATES, HVAC_SERVICES, SITE_URL } from '@/lib/constants'
import { ServiceSchema, FAQSchema, BreadcrumbSchema } from '@/components/SchemaOrg'
import type { Contractor } from '@/lib/types'
import ContractorCard from '@/components/ContractorCard'
import { createAdminClient } from '@/lib/supabase/admin'

// ─── Types ───────────────────────────────────────────────────────────────────

interface Props {
  params: Promise<{ state: string; city: string; service: string }>
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function formatCityName(citySlug: string): string {
  return citySlug
    .split('-')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ')
}

function getStateObj(stateSlug: string) {
  return US_STATES.find(
    (s) => s.name.toLowerCase().replace(/\s+/g, '-') === stateSlug
  ) || null
}

function getServiceObj(serviceSlug: string) {
  return HVAC_SERVICES.find((s) => s.slug === serviceSlug) || null
}

// ─── Data Fetching ───────────────────────────────────────────────────────────

async function getContractorsForCityService(city: string, stateAbbr: string): Promise<Contractor[]> {
  const db = createAdminClient()

  // Fetch contractors in this city (service filtering would need a join on
  // contractor_services, but since not all contractors have services linked yet,
  // we show all city contractors on the service page — same as search behavior).
  const { data } = await db
    .from('contractors')
    .select('*')
    .ilike('city', city)
    .ilike('state', stateAbbr)
    .neq('subscription_status', 'cancelled')
    .order('is_verified', { ascending: false })
    .order('avg_rating', { ascending: false })
    .limit(20)

  return (data ?? []) as unknown as Contractor[]
}

// ─── Service Content ──────────────────────────────────────────────────────────

const SERVICE_DESCRIPTIONS: Record<string, string> = {
  'commercial-ac-repair': 'Commercial air conditioning repair requires specialized knowledge of large-capacity systems including split systems, packaged rooftop units, and chilled water plants. Qualified technicians diagnose refrigerant issues, failed compressors, electrical faults, and control system problems.',
  'commercial-ac-installation': 'Commercial AC installation involves site surveys, load calculations, equipment selection, and code-compliant installation. Proper sizing is critical — undersized systems run continuously and wear out prematurely, while oversized units cycle too frequently and fail to dehumidify.',
  'commercial-heating-repair': 'Commercial heating repair covers gas furnaces, heat pumps, boilers, and rooftop heating units. Technicians address burner issues, heat exchanger cracks, refrigerant problems in heat pumps, and controls failures.',
  'commercial-heating-installation': 'Commercial heating installation requires careful load calculations, ductwork design, and equipment selection. Options include gas furnaces, heat pumps, boilers, and radiant systems depending on building type and climate.',
  'rooftop-unit-service': 'Rooftop unit (RTU) service includes seasonal tune-ups, filter changes, coil cleaning, refrigerant checks, and electrical inspections. Well-maintained RTUs last 15–20 years and operate at peak efficiency.',
  'chiller-repair-maintenance': 'Chiller systems serve large commercial and industrial facilities. Maintenance includes vibration analysis, oil analysis, tube cleaning, refrigerant management, and controls calibration. Proper maintenance can extend chiller life by 10+ years.',
  'boiler-service': 'Commercial boiler service includes burner tune-ups, heat exchanger inspection, water treatment, safety device testing, and controls calibration. Annual service is required by most state regulations.',
  'ductwork-installation-repair': 'Commercial ductwork affects air distribution, energy efficiency, and indoor air quality. Leaky ducts can waste 20–30% of conditioned air. Repairs involve sealing, insulation, and balancing.',
  'commercial-refrigeration': 'Commercial refrigeration systems serve restaurants, grocery stores, and cold storage facilities. Service covers walk-in coolers, freezers, display cases, and ice machines.',
  'preventive-maintenance-plans': 'Preventive maintenance contracts keep commercial HVAC systems running reliably year-round. Regular PM visits typically reduce emergency breakdowns by 60–80% and extend equipment lifespan significantly.',
  'emergency-hvac-service': 'Commercial HVAC emergencies — complete system failures, refrigerant leaks, or critical building temperature events — require immediate response. 24/7 emergency service ensures minimal business disruption.',
  'building-automation-systems': 'Building automation systems (BAS) integrate HVAC, lighting, and other building systems for centralized control and monitoring. Modern BAS platforms enable remote management, predictive maintenance, and significant energy savings.',
  'indoor-air-quality': 'Commercial indoor air quality services include air testing, UV germicidal systems, enhanced filtration, air purifiers, and ventilation balancing. IAQ is critical for occupant health and regulatory compliance.',
  'energy-audits-retrofits': 'Energy audits identify inefficiencies in commercial HVAC systems and building envelope. Retrofits often include variable frequency drives, high-efficiency equipment, building automation, and improved controls.',
  'vrf-vrv-systems': 'Variable refrigerant flow (VRF/VRV) systems offer zoned cooling and heating with high efficiency. Installation requires specialized training and equipment. Popular for office buildings, hotels, and mixed-use developments.',
}

const WHAT_TO_EXPECT: Record<string, string[]> = {
  'commercial-ac-repair': ['Initial diagnosis and written estimate', 'Parts sourcing (usually same-day for common components)', 'Repair with warranty on labor and parts', 'System test and performance verification', 'Documentation for maintenance records'],
  'rooftop-unit-service': ['Safety inspection and general condition assessment', 'Filter replacement and coil cleaning', 'Refrigerant pressure check and top-off if needed', 'Electrical connection inspection and tightening', 'Lubrication of moving parts', 'Performance report with recommendations'],
  'emergency-hvac-service': ['Phone triage to assess urgency and dispatch appropriate crew', 'Arrival typically within 1–4 hours of initial call', 'Diagnosis and temporary fix to restore function if full repair requires parts', 'Upfront emergency service pricing (higher than standard rates)', 'Follow-up for permanent repair if temp fix was applied'],
}

function getWhatToExpect(serviceSlug: string): string[] {
  return WHAT_TO_EXPECT[serviceSlug] || [
    'Initial consultation and site assessment',
    'Written proposal with detailed scope of work',
    'Scheduled work with minimal building disruption',
    'Quality workmanship with warranty on labor',
    'Final walkthrough and documentation',
  ]
}

// ─── FAQ ─────────────────────────────────────────────────────────────────────

function getFAQ(serviceName: string, city: string, stateAbbr: string) {
  return [
    {
      q: `How much does ${serviceName.toLowerCase()} cost in ${city}, ${stateAbbr}?`,
      a: `${serviceName} costs in ${city} vary based on system size, building type, and scope. Request quotes from multiple contractors through My HVAC Tech to compare pricing. Always ask for itemized written estimates before authorizing any work.`,
    },
    {
      q: `How do I choose the best ${serviceName.toLowerCase()} contractor in ${city}?`,
      a: `Look for contractors with specific experience in commercial systems (not just residential). Verify their state license and insurance. Check reviews from similar commercial properties. Ask about their warranty on labor and parts, and their typical response time for follow-up issues.`,
    },
    {
      q: `How long does ${serviceName.toLowerCase()} typically take?`,
      a: `The timeline depends on system complexity and parts availability. Simple repairs often complete in 2–4 hours. Larger installations or replacements may take 1–5 days. Emergency service typically restores basic function within a few hours even if a full repair requires ordering parts.`,
    },
    {
      q: `Is ${serviceName.toLowerCase()} covered by building insurance?`,
      a: `Generally, sudden equipment failures may be covered by commercial property insurance, while gradual wear or maintenance-related issues are not. Contact your insurance provider and ask specifically about HVAC equipment breakdown coverage. Some policies offer equipment breakdown riders that cover repair and replacement costs.`,
    },
  ]
}

// ─── Static Params ────────────────────────────────────────────────────────────

export async function generateStaticParams() {
  return []
}

// ─── Metadata ─────────────────────────────────────────────────────────────────

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { state, city, service } = await params
  const cityName = formatCityName(city)
  const stateObj = getStateObj(state)
  const serviceObj = getServiceObj(service)

  if (!stateObj || !serviceObj) return { title: 'Not Found' }

  // Noindex pages with fewer than 3 contractors to prevent thin content indexing
  const contractors = await getContractorsForCityService(cityName, stateObj.abbr)
  const shouldIndex = contractors.length >= 3

  return {
    title: `${serviceObj.name} in ${cityName}, ${stateObj.abbr}`,
    description: `Find the best ${serviceObj.name.toLowerCase()} contractors in ${cityName}, ${stateObj.abbr}. Compare verified reviews, pricing, and request free quotes from licensed professionals.`,
    alternates: { canonical: `${SITE_URL}/${state}/${city}/${service}` },
    ...(!shouldIndex && { robots: { index: false, follow: true } }),
    openGraph: {
      title: `${serviceObj.name} in ${cityName}, ${stateObj.abbr}`,
      description: `Top-rated ${serviceObj.name.toLowerCase()} contractors in ${cityName}. Verified reviews, free quotes.`,
    },
  }
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default async function CityServicePage({ params }: Props) {
  const { state, city, service } = await params
  const cityName = formatCityName(city)
  const stateObj = getStateObj(state)
  const serviceObj = getServiceObj(service)

  if (!stateObj || !serviceObj) notFound()

  const contractors = await getContractorsForCityService(cityName, stateObj.abbr)
  const whatToExpect = getWhatToExpect(service)
  const faq = getFAQ(serviceObj.name, cityName, stateObj.abbr)
  const serviceDescription = SERVICE_DESCRIPTIONS[service] || `${serviceObj.name} is an essential commercial building service. Licensed contractors provide expert diagnosis, repair, installation, and maintenance.`

  const relatedServices = HVAC_SERVICES
    .filter((s) => s.slug !== service && s.category === serviceObj.category)
    .slice(0, 4)

  return (
    <main className="min-h-screen bg-neutral-50">
      <ServiceSchema
        name={`${serviceObj.name} in ${cityName}, ${stateObj.abbr}`}
        description={serviceDescription}
        slug={service}
      />
      <FAQSchema items={faq.map(f => ({ question: f.q, answer: f.a }))} />
      <BreadcrumbSchema items={[
        { name: 'Home', url: SITE_URL },
        { name: stateObj.name, url: `${SITE_URL}/${state}` },
        { name: cityName, url: `${SITE_URL}/${state}/${city}` },
        { name: serviceObj.name, url: `${SITE_URL}/${state}/${city}/${service}` },
      ]} />

      {/* ── Hero ──────────────────────────────────────────────────────────── */}
      <section className="bg-white border-b border-neutral-200 py-12 px-4">
        <div className="max-w-5xl mx-auto">
          <nav className="flex flex-wrap items-center gap-1.5 text-xs text-neutral-400 mb-4" aria-label="Breadcrumb">
            <Link href="/" className="hover:text-neutral-600 transition-colors">Home</Link>
            <ChevronRight size={12} aria-hidden="true" />
            <Link href={`/${state}`} className="hover:text-neutral-600 transition-colors">{stateObj.name}</Link>
            <ChevronRight size={12} aria-hidden="true" />
            <Link href={`/${state}/${city}`} className="hover:text-neutral-600 transition-colors">{cityName}</Link>
            <ChevronRight size={12} aria-hidden="true" />
            <span className="text-neutral-700">{serviceObj.name}</span>
          </nav>
          <h1 className="text-3xl md:text-4xl font-bold text-neutral-900 font-display mb-4">
            {serviceObj.name} in {cityName}, {stateObj.abbr}
          </h1>
          <p className="text-lg text-neutral-600 max-w-3xl leading-relaxed">
            {serviceDescription}
          </p>
          <div className="flex flex-wrap gap-3 mt-5">
            <Link
              href={`/search?city=${cityName}&state=${stateObj.abbr}&service=${service}`}
              className="inline-flex items-center gap-2 bg-primary-500 text-white font-semibold text-sm px-6 py-3 rounded-lg hover:bg-primary-600 transition-colors"
            >
              <Search size={15} aria-hidden="true" />
              Find {serviceObj.name} Contractors
            </Link>
          </div>
        </div>
      </section>

      <div className="max-w-5xl mx-auto px-4 py-10">

        {/* ── Contractor Listings ──────────────────────────────────────── */}
        <section className="mb-12">
          <h2 className="text-xl font-semibold text-neutral-900 mb-5">
            Top {serviceObj.name} Contractors in {cityName}
          </h2>

          {contractors.length > 0 ? (
            <div className="space-y-3">
              {contractors.map((c) => (
                <ContractorCard key={c.id} contractor={c} />
              ))}
            </div>
          ) : (
            <div className="text-center py-12 bg-white border border-neutral-200 rounded-xl">
              <Search size={32} className="mx-auto text-neutral-300 mb-3" aria-hidden="true" />
              <p className="text-neutral-600 font-medium mb-1">No contractors listed in {cityName} yet</p>
              <p className="text-sm text-neutral-400 mb-4">
                We&apos;re expanding our coverage. Check back soon or search nearby cities.
              </p>
              <Link
                href={`/search?state=${stateObj.abbr}`}
                className="inline-flex items-center gap-2 bg-primary-500 text-white text-sm font-medium px-5 py-2.5 rounded-lg hover:bg-primary-600 transition-colors"
              >
                <Search size={14} aria-hidden="true" />
                Search all {stateObj.name} contractors
              </Link>
            </div>
          )}
        </section>

        {/* ── What to Expect ───────────────────────────────────────────── */}
        <section className="mb-12">
          <h2 className="text-xl font-semibold text-neutral-900 mb-5">
            What to Expect from {serviceObj.name}
          </h2>
          <div className="bg-white border border-neutral-200 rounded-xl divide-y divide-neutral-100 overflow-hidden">
            {whatToExpect.map((step, i) => (
              <div key={i} className="flex items-start gap-4 px-5 py-4">
                <div className="w-7 h-7 rounded-full bg-primary-100 text-primary-600 flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">
                  {i + 1}
                </div>
                <p className="text-sm text-neutral-700 leading-relaxed">{step}</p>
              </div>
            ))}
          </div>
        </section>

        {/* ── Pricing ─────────────────────────────────────────────────── */}
        <section className="mb-12">
          <h2 className="text-xl font-semibold text-neutral-900 mb-3">
            {serviceObj.name} Pricing in {cityName}
          </h2>
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-6">
            <div className="flex items-start gap-3">
              <DollarSign size={20} className="text-amber-600 mt-0.5 shrink-0" aria-hidden="true" />
              <div>
                <p className="text-sm font-semibold text-amber-900 mb-1">Pricing varies by contractor and project scope</p>
                <p className="text-sm text-amber-800 leading-relaxed">
                  Request quotes from multiple contractors to compare pricing. Factors that affect cost include system size, building type, equipment brand, warranty terms, and urgency. Always ask for an itemized written estimate before authorizing work.
                </p>
                <Link
                  href={`/search?city=${cityName}&state=${stateObj.abbr}&service=${service}`}
                  className="inline-flex items-center gap-1.5 mt-3 text-sm font-semibold text-amber-700 hover:text-amber-900 transition-colors"
                >
                  Get free quotes from {cityName} contractors
                  <ChevronRight size={13} aria-hidden="true" />
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* ── Related Services ─────────────────────────────────────────── */}
        {relatedServices.length > 0 && (
          <section className="mb-12">
            <h2 className="text-xl font-semibold text-neutral-900 mb-5">
              Related {serviceObj.category} Services in {cityName}
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {relatedServices.map((svc) => (
                <Link
                  key={svc.slug}
                  href={`/${state}/${city}/${svc.slug}`}
                  className="flex items-center gap-2 bg-white border border-neutral-200 rounded-xl px-4 py-3 text-sm text-neutral-700 hover:border-primary-300 hover:text-primary-700 hover:bg-primary-50 transition-all group"
                >
                  <ChevronRight size={13} className="text-neutral-300 group-hover:text-primary-500 shrink-0" aria-hidden="true" />
                  {svc.name} in {cityName}
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* ── FAQ ─────────────────────────────────────────────────────────── */}
        <section>
          <h2 className="text-xl font-semibold text-neutral-900 mb-5">
            Frequently Asked Questions — {serviceObj.name} in {cityName}
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
