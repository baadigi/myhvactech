import { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { MapPin, ChevronRight, Shield, Star, Clock, CheckCircle, Search } from 'lucide-react'
import { US_STATES, HVAC_SERVICES, SITE_NAME, SITE_URL } from '@/lib/constants'
import { FAQSchema, BreadcrumbSchema } from '@/components/SchemaOrg'
import type { Contractor } from '@/lib/types'
import ContractorCard from '@/components/ContractorCard'

// ─── Types ───────────────────────────────────────────────────────────────────

interface Props {
  params: Promise<{ state: string; city: string }>
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

// ─── Mock Contractors ─────────────────────────────────────────────────────────

// Shared commercial field defaults for mock contractors
const MOCK_COMMERCIAL_DEFAULTS = {
  years_commercial_experience: 12 as number | null,
  commercial_verified: true,
  system_types: ['rtu', 'split_system'] as string[],
  brands_serviced: ['Carrier', 'Trane'] as string[],
  tonnage_range_min: 5 as number | null,
  tonnage_range_max: 200 as number | null,
  building_types_served: ['office', 'retail'] as string[],
  emergency_response_minutes: 90 as number | null,
  offers_24_7: true,
  sla_summary: null as string | null,
  multi_site_coverage: false,
  max_sites_supported: null as number | null,
  offers_service_agreements: true,
  service_agreement_types: ['preventive_maintenance'] as string[],
  dispatch_crm: null as string | null,
  avg_quote_turnaround_hours: 8 as number | null,
  uses_gps_tracking: false,
  num_technicians: null as number | null,
  num_nate_certified: null as number | null,
  metro_area: null as string | null,
  slot_tier: null as 'standard' | 'preferred' | 'exclusive' | null,
}

function getMockContractors(city: string, stateAbbr: string): Contractor[] {
  return [
    {
      ...MOCK_COMMERCIAL_DEFAULTS,
      id: 'city-c1',
      created_at: '2021-03-01T00:00:00Z',
      updated_at: '2024-01-01T00:00:00Z',
      owner_id: null,
      company_name: `${city} Commercial HVAC Pros`,
      slug: `${city.toLowerCase().replace(/\s+/g, '-')}-commercial-hvac-pros`,
      description: null,
      short_description: `${city}'s most trusted commercial HVAC company. Serving office buildings, retail, and industrial facilities since 2005.`,
      logo_url: null,
      cover_image_url: null,
      website: null,
      phone: '5555550311',
      email: null,
      street_address: '500 Business Park Dr',
      city,
      state: stateAbbr,
      zip_code: '00100',
      country: 'US',
      location: null,
      service_radius_miles: 50,
      year_established: 2005,
      license_number: null,
      insurance_verified: true,
      is_verified: true,
      is_claimed: true,
      is_featured: true,
      operating_hours: null,
      subscription_tier: 'gold',
      stripe_customer_id: null,
      stripe_subscription_id: null,
      subscription_status: 'active',
      meta_title: null,
      meta_description: null,
      avg_rating: 4.8,
      review_count: 76,
      profile_views: 3200,
      services: [
        { id: '1', name: 'Commercial AC Repair', slug: 'commercial-ac-repair', category: 'Repair', description: null, icon: null },
        { id: '2', name: 'Rooftop Unit (RTU) Service', slug: 'rooftop-unit-service', category: 'Maintenance', description: null, icon: null },
        { id: '3', name: 'Emergency HVAC Service', slug: 'emergency-hvac-service', category: 'Emergency', description: null, icon: null },
        { id: '4', name: 'Preventive Maintenance Plans', slug: 'preventive-maintenance-plans', category: 'Maintenance', description: null, icon: null },
      ],
    },
    {
      ...MOCK_COMMERCIAL_DEFAULTS,
      id: 'city-c2',
      created_at: '2018-08-01T00:00:00Z',
      updated_at: '2024-01-01T00:00:00Z',
      owner_id: null,
      company_name: `Metro Climate Solutions`,
      slug: `metro-climate-solutions-${city.toLowerCase().replace(/\s+/g, '-')}`,
      description: null,
      short_description: `Full-service commercial HVAC for ${city} area businesses. Specializing in chiller plants, BAS integration, and energy efficiency.`,
      logo_url: null,
      cover_image_url: null,
      website: null,
      phone: '5555550422',
      email: null,
      street_address: '1200 Industrial Way',
      city,
      state: stateAbbr,
      zip_code: '00101',
      country: 'US',
      location: null,
      service_radius_miles: 40,
      year_established: 2010,
      license_number: null,
      insurance_verified: true,
      is_verified: true,
      is_claimed: true,
      is_featured: false,
      operating_hours: null,
      subscription_tier: 'silver',
      stripe_customer_id: null,
      stripe_subscription_id: null,
      subscription_status: 'active',
      meta_title: null,
      meta_description: null,
      avg_rating: 4.6,
      review_count: 43,
      profile_views: 1800,
      services: [
        { id: '5', name: 'Chiller Repair & Maintenance', slug: 'chiller-repair-maintenance', category: 'Maintenance', description: null, icon: null },
        { id: '6', name: 'Building Automation Systems', slug: 'building-automation-systems', category: 'Installation', description: null, icon: null },
        { id: '7', name: 'Energy Audits & Retrofits', slug: 'energy-audits-retrofits', category: 'Maintenance', description: null, icon: null },
      ],
    },
    {
      ...MOCK_COMMERCIAL_DEFAULTS,
      commercial_verified: false,
      id: 'city-c3',
      created_at: '2016-05-01T00:00:00Z',
      updated_at: '2024-01-01T00:00:00Z',
      owner_id: null,
      company_name: `Allied Mechanical Services`,
      slug: `allied-mechanical-services-${city.toLowerCase().replace(/\s+/g, '-')}`,
      description: null,
      short_description: `Value-priced commercial HVAC with no compromises on quality. Great for small to mid-size commercial properties in ${city}.`,
      logo_url: null,
      cover_image_url: null,
      website: null,
      phone: '5555550533',
      email: null,
      street_address: '88 Commerce St',
      city,
      state: stateAbbr,
      zip_code: '00102',
      country: 'US',
      location: null,
      service_radius_miles: 30,
      year_established: 2016,
      license_number: null,
      insurance_verified: false,
      is_verified: false,
      is_claimed: true,
      is_featured: false,
      operating_hours: null,
      subscription_tier: 'bronze',
      stripe_customer_id: null,
      stripe_subscription_id: null,
      subscription_status: 'active',
      meta_title: null,
      meta_description: null,
      avg_rating: 4.2,
      review_count: 31,
      profile_views: 1100,
      services: [
        { id: '1', name: 'Commercial AC Repair', slug: 'commercial-ac-repair', category: 'Repair', description: null, icon: null },
        { id: '8', name: 'Commercial Heating Repair', slug: 'commercial-heating-repair', category: 'Repair', description: null, icon: null },
      ],
    },
  ]
}

// ─── Nearby Cities ────────────────────────────────────────────────────────────

const NEARBY_CITY_MAP: Record<string, string[]> = {
  'phoenix': ['scottsdale', 'tempe', 'mesa', 'chandler', 'gilbert'],
  'los-angeles': ['santa-monica', 'burbank', 'pasadena', 'long-beach', 'torrance'],
  'chicago': ['evanston', 'oak-park', 'cicero', 'berwyn', 'schaumburg'],
  'houston': ['sugar-land', 'pearland', 'pasadena', 'katy', 'the-woodlands'],
  'dallas': ['fort-worth', 'irving', 'plano', 'garland', 'arlington'],
  'miami': ['miami-beach', 'hialeah', 'coral-gables', 'doral', 'homestead'],
}

// ─── Static Params ────────────────────────────────────────────────────────────

export async function generateStaticParams() {
  return []
}

// ─── Metadata ─────────────────────────────────────────────────────────────────

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { state, city } = await params
  const cityName = formatCityName(city)
  const stateObj = getStateObj(state)
  const stateDisplay = stateObj?.abbr || state.toUpperCase()

  return {
    title: `Best Commercial HVAC Contractors in ${cityName}, ${stateDisplay} | ${SITE_NAME}`,
    description: `Find and compare the best commercial HVAC contractors in ${cityName}, ${stateDisplay}. Verified reviews, licensed professionals, free quotes for your commercial property.`,
    openGraph: {
      title: `Commercial HVAC Contractors in ${cityName}, ${stateDisplay}`,
      description: `Top-rated commercial HVAC companies in ${cityName}. Read reviews and get free quotes.`,
    },
  }
}

// ─── FAQ ─────────────────────────────────────────────────────────────────────

function getFAQ(city: string, stateAbbr: string) {
  return [
    {
      q: `How much does commercial HVAC service cost in ${city}?`,
      a: `Commercial HVAC costs in ${city} depend on the system type and scope of work. Routine service calls typically run $150–$400. Preventive maintenance contracts for a single rooftop unit average $200–$500/year. Full system replacements range from $8,000 for small packaged units to $100,000+ for large chiller plants.`,
    },
    {
      q: `How do I find a reliable commercial HVAC contractor in ${city}, ${stateAbbr}?`,
      a: `Start by verifying the contractor holds a current state license and carries adequate insurance. Check reviews from other commercial property managers on My HVAC Tech. Ask for references from similar properties (office, retail, industrial). Get at least three written quotes for any major project.`,
    },
    {
      q: `Do ${city} commercial HVAC contractors offer emergency service?`,
      a: `Yes, many commercial HVAC contractors in ${city} offer 24/7 emergency response. Response times vary — the best operators typically arrive within 2–4 hours for critical failures. Always confirm after-hours rates upfront, as emergency service typically carries a surcharge.`,
    },
    {
      q: `What's the best time of year to schedule HVAC maintenance in ${city}?`,
      a: `For cooling systems, schedule spring tune-ups in March–April before peak demand season. For heating systems, fall service in September–October ensures readiness. Scheduling preventive maintenance during off-peak periods gives you faster scheduling and sometimes lower rates.`,
    },
  ]
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default async function CityPage({ params }: Props) {
  const { state, city } = await params
  const cityName = formatCityName(city)
  const stateObj = getStateObj(state)
  if (!stateObj) notFound()

  const contractors = getMockContractors(cityName, stateObj.abbr)
  const faq = getFAQ(cityName, stateObj.abbr)
  const nearbyCities = NEARBY_CITY_MAP[city] || []

  return (
    <main className="min-h-screen bg-neutral-50">
      <FAQSchema questions={faq.map(f => ({ question: f.q, answer: f.a }))} />
      <BreadcrumbSchema items={[
        { name: 'Home', url: SITE_URL },
        { name: stateObj.name, url: `${SITE_URL}/${state}` },
        { name: cityName, url: `${SITE_URL}/${state}/${city}` },
      ]} />

      {/* ── Hero ──────────────────────────────────────────────────────────── */}
      <section className="bg-white border-b border-neutral-200 py-12 px-4">
        <div className="max-w-5xl mx-auto">
          <nav className="flex items-center gap-1.5 text-xs text-neutral-400 mb-4" aria-label="Breadcrumb">
            <Link href="/" className="hover:text-neutral-600 transition-colors">Home</Link>
            <ChevronRight size={12} aria-hidden="true" />
            <Link href={`/${state}`} className="hover:text-neutral-600 transition-colors">{stateObj.name}</Link>
            <ChevronRight size={12} aria-hidden="true" />
            <span className="text-neutral-700">{cityName}</span>
          </nav>
          <h1 className="text-3xl md:text-4xl font-bold text-neutral-900 font-display mb-4">
            Best Commercial HVAC Contractors in {cityName}, {stateObj.abbr}
          </h1>
          <p className="text-lg text-neutral-600 max-w-3xl leading-relaxed">
            Compare {cityName}'s top commercial HVAC companies. Read verified reviews from property managers and facility directors, request free quotes, and hire the right contractor for your building.
          </p>
          <div className="flex flex-wrap gap-3 mt-5 text-sm text-neutral-600">
            <span className="flex items-center gap-1.5">
              <Star size={14} className="text-warning" aria-hidden="true" />
              {contractors.length}+ verified contractors
            </span>
            <span className="flex items-center gap-1.5">
              <Shield size={14} className="text-accent-500" aria-hidden="true" />
              License checked
            </span>
            <span className="flex items-center gap-1.5">
              <Clock size={14} className="text-neutral-400" aria-hidden="true" />
              Free quotes in 2 hours
            </span>
          </div>
        </div>
      </section>

      <div className="max-w-5xl mx-auto px-4 py-10">

        {/* ── Contractor Listings ──────────────────────────────────────── */}
        <section className="mb-12">
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-xl font-semibold text-neutral-900">
              Commercial HVAC Contractors in {cityName}
            </h2>
            <Link
              href={`/search?city=${cityName}&state=${stateObj.abbr}`}
              className="text-sm text-primary-600 hover:text-primary-700 font-medium flex items-center gap-1"
            >
              View all <ChevronRight size={14} aria-hidden="true" />
            </Link>
          </div>
          <div className="space-y-3">
            {contractors.map((c) => (
              <ContractorCard key={c.id} contractor={c} />
            ))}
          </div>
        </section>

        {/* ── Services in City ─────────────────────────────────────────── */}
        <section className="mb-12">
          <h2 className="text-xl font-semibold text-neutral-900 mb-5">
            Commercial HVAC Services Available in {cityName}
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {HVAC_SERVICES.map((svc) => (
              <Link
                key={svc.slug}
                href={`/${state}/${city}/${svc.slug}`}
                className="flex items-center gap-2 bg-white border border-neutral-200 rounded-xl px-4 py-3 text-sm text-neutral-700 hover:border-primary-300 hover:text-primary-700 hover:bg-primary-50 transition-all group"
              >
                <ChevronRight size={12} className="text-neutral-300 group-hover:text-primary-500 shrink-0" aria-hidden="true" />
                <span className="leading-tight">{svc.name}</span>
              </Link>
            ))}
          </div>
        </section>

        {/* ── Why Choose My HVAC Tech ───────────────────────────────────── */}
        <section className="mb-12 bg-primary-600 rounded-2xl p-8 text-white">
          <h2 className="text-xl font-bold mb-6">Why Choose My HVAC Tech in {cityName}?</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            {[
              { icon: <CheckCircle size={18} aria-hidden="true" />, title: 'Verified Contractors Only', desc: 'We confirm licenses and insurance before any contractor is listed.' },
              { icon: <Star size={18} aria-hidden="true" />, title: 'Real Commercial Reviews', desc: 'Reviews from property managers, facility directors, and building owners — not homeowners.' },
              { icon: <Clock size={18} aria-hidden="true" />, title: 'Fast Quote Responses', desc: 'Most contractors respond to quote requests within 2 business hours.' },
              { icon: <Shield size={18} aria-hidden="true" />, title: 'Free to Use', desc: 'No cost to search, compare, or request quotes. Ever.' },
            ].map(({ icon, title, desc }) => (
              <div key={title} className="flex items-start gap-3">
                <div className="mt-0.5 text-primary-200 shrink-0">{icon}</div>
                <div>
                  <p className="font-semibold text-sm text-white">{title}</p>
                  <p className="text-sm text-primary-200 mt-0.5">{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ── Nearby Cities ────────────────────────────────────────────── */}
        {nearbyCities.length > 0 && (
          <section className="mb-12">
            <h2 className="text-xl font-semibold text-neutral-900 mb-4">
              Nearby Cities
            </h2>
            <div className="flex flex-wrap gap-2">
              {nearbyCities.map((nearbyCity) => (
                <Link
                  key={nearbyCity}
                  href={`/${state}/${nearbyCity}`}
                  className="px-4 py-2 bg-white border border-neutral-200 rounded-lg text-sm text-neutral-700 hover:border-primary-300 hover:text-primary-700 transition-colors"
                >
                  {formatCityName(nearbyCity)}, {stateObj.abbr}
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* ── FAQ ─────────────────────────────────────────────────────────── */}
        <section>
          <h2 className="text-xl font-semibold text-neutral-900 mb-5">
            Frequently Asked Questions — Commercial HVAC in {cityName}
          </h2>
          <div className="space-y-4">
            {faq.map((item, i) => (
              <div key={i} className="bg-white border border-neutral-200 rounded-xl p-5">
                <h3 className="text-sm font-semibold text-neutral-900 mb-2">{item.q}</h3>
                <p className="text-sm text-neutral-600 leading-relaxed">{item.a}</p>
              </div>
            ))}
          </div>
        </section>

      </div>
    </main>
  )
}
