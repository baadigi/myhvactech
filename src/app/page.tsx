import Link from 'next/link'
import { Search, ClipboardList, CheckCircle, ShieldCheck, Star, MessageSquareDiff, Building2, BadgeCheck, Clock, Users } from 'lucide-react'
import SearchBar from '@/components/SearchBar'
import ContractorCard from '@/components/ContractorCard'
import ServiceCard from '@/components/ServiceCard'
import CityCard from '@/components/CityCard'
import { Button } from '@/components/ui/Button'
import { HVAC_SERVICES, US_STATES } from '@/lib/constants'
import { createAdminClient } from '@/lib/supabase/admin'
import type { Contractor, Service } from '@/lib/types'

// ——————————————————————————————————————————
// Static mock data for featured contractors
// ——————————————————————————————————————————
const MOCK_SERVICES: Service[] = [
  { id: 's1', name: 'Commercial AC Repair', slug: 'commercial-ac-repair', category: 'Repair', description: null, icon: null },
  { id: 's2', name: 'Rooftop Unit Service', slug: 'rooftop-unit-service', category: 'Maintenance', description: null, icon: null },
  { id: 's3', name: 'Preventive Maintenance', slug: 'preventive-maintenance-plans', category: 'Maintenance', description: null, icon: null },
  { id: 's4', name: 'Emergency HVAC Service', slug: 'emergency-hvac-service', category: 'Emergency', description: null, icon: null },
]

const MOCK_CONTRACTORS: (Contractor & { services: Service[] })[] = [
  {
    id: '1',
    created_at: '2023-01-01',
    updated_at: '2024-01-01',
    owner_id: null,
    company_name: 'Arctic Air Commercial HVAC',
    slug: 'arctic-air-commercial-hvac',
    description: 'Full-service commercial HVAC contractor serving the Phoenix metro area for over 20 years. Specialists in large-scale RTU systems, chilled water plants, and multi-site preventive maintenance agreements.',
    short_description: 'Phoenix\'s top-rated commercial HVAC company. Specializing in rooftop units, chillers, and 24/7 emergency service for office buildings and retail.',
    logo_url: null,
    cover_image_url: null,
    website: 'https://arcticairphoenix.com',
    phone: '6025550100',
    email: 'info@arcticairphoenix.com',
    street_address: '4500 N 32nd St',
    city: 'Phoenix',
    state: 'AZ',
    zip_code: '85018',
    country: 'US',
    location: null,
    service_radius_miles: 60,
    year_established: 2003,
    license_number: 'ROC-123456',
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
    review_count: 143,
    profile_views: 2400,
    // Commercial fields
    years_commercial_experience: 20,
    commercial_verified: true,
    system_types: ['rtu', 'chilled_water', 'ahu', 'split_system'],
    brands_serviced: ['Carrier', 'Trane', 'Lennox', 'York'],
    tonnage_range_min: 5,
    tonnage_range_max: 500,
    building_types_served: ['office', 'retail', 'industrial', 'mixed_use'],
    emergency_response_minutes: 60,
    offers_24_7: true,
    sla_summary: '1-hour emergency response in Phoenix metro. 4-hour response for standard service calls. Guaranteed same-day for PM agreement customers.',
    multi_site_coverage: true,
    max_sites_supported: 25,
    offers_service_agreements: true,
    service_agreement_types: ['preventive_maintenance', 'full_service', 'emergency_only'],
    dispatch_crm: 'ServiceTitan',
    avg_quote_turnaround_hours: 4,
    uses_gps_tracking: true,
    num_technicians: 22,
    num_nate_certified: 16,
    metro_area: 'Phoenix-Mesa-Chandler, AZ',
    slot_tier: 'exclusive',
    services: [MOCK_SERVICES[0], MOCK_SERVICES[1], MOCK_SERVICES[2], MOCK_SERVICES[3]],
  },
  {
    id: '2',
    created_at: '2023-03-15',
    updated_at: '2024-02-01',
    owner_id: null,
    company_name: 'Metro Cooling Solutions',
    slug: 'metro-cooling-solutions',
    description: 'Commercial HVAC experts serving Dallas and Fort Worth businesses. Deep experience in chiller systems, VRF installations, and multi-building campus contracts for healthcare and education clients.',
    short_description: 'Dallas–Fort Worth commercial HVAC specialists. We handle everything from new system installations to complex chiller repairs for warehouses, hospitals, and office towers.',
    logo_url: null,
    cover_image_url: null,
    website: null,
    phone: '2145550187',
    email: null,
    street_address: '1200 Commerce St',
    city: 'Dallas',
    state: 'TX',
    zip_code: '75202',
    country: 'US',
    location: null,
    service_radius_miles: 80,
    year_established: 2009,
    license_number: 'TACLB-78901',
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
    review_count: 89,
    profile_views: 1820,
    // Commercial fields
    years_commercial_experience: 15,
    commercial_verified: true,
    system_types: ['vrf', 'chilled_water', 'boiler', 'cooling_tower', 'ahu'],
    brands_serviced: ['Daikin', 'Mitsubishi', 'Johnson Controls', 'Carrier', 'McQuay'],
    tonnage_range_min: 10,
    tonnage_range_max: 800,
    building_types_served: ['healthcare', 'education', 'industrial', 'office', 'government'],
    emergency_response_minutes: 90,
    offers_24_7: true,
    sla_summary: 'Guaranteed 90-minute emergency response across the DFW metro. 8-hour standard response window. Monthly PM visits for agreement customers.',
    multi_site_coverage: true,
    max_sites_supported: 15,
    offers_service_agreements: true,
    service_agreement_types: ['preventive_maintenance', 'full_service', 'parts_labor'],
    dispatch_crm: 'BuildOps',
    avg_quote_turnaround_hours: 6,
    uses_gps_tracking: true,
    num_technicians: 18,
    num_nate_certified: 12,
    metro_area: 'Dallas-Fort Worth-Arlington, TX',
    slot_tier: 'preferred',
    services: [MOCK_SERVICES[0], MOCK_SERVICES[2]],
  },
  {
    id: '3',
    created_at: '2022-06-01',
    updated_at: '2024-03-01',
    owner_id: null,
    company_name: 'Coastal Climate Systems',
    slug: 'coastal-climate-systems',
    description: 'Miami\'s trusted commercial HVAC company serving South Florida since 2001. Specialists in humid-climate system design and maintenance for hotels, medical facilities, and large commercial portfolios.',
    short_description: 'South Florida commercial HVAC experts with deep experience in humid-climate systems. Serving hotels, restaurants, medical facilities, and large commercial properties throughout Miami-Dade.',
    logo_url: null,
    cover_image_url: null,
    website: null,
    phone: '3055550234',
    email: null,
    street_address: '800 Brickell Ave',
    city: 'Miami',
    state: 'FL',
    zip_code: '33131',
    country: 'US',
    location: null,
    service_radius_miles: 50,
    year_established: 2001,
    license_number: 'CAC-1823456',
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
    avg_rating: 4.9,
    review_count: 207,
    profile_views: 3100,
    // Commercial fields
    years_commercial_experience: 23,
    commercial_verified: true,
    system_types: ['chilled_water', 'vrf', 'rtu', 'cooling_tower', 'ptac'],
    brands_serviced: ['Carrier', 'Trane', 'Daikin', 'Bosch', 'Rheem/Ruud'],
    tonnage_range_min: 5,
    tonnage_range_max: 600,
    building_types_served: ['hospitality', 'healthcare', 'restaurant', 'retail', 'multifamily', 'office'],
    emergency_response_minutes: 45,
    offers_24_7: true,
    sla_summary: '45-minute emergency response in Miami-Dade. Priority dispatch for hospitality and medical clients. Bi-annual PM visits included in all service agreements.',
    multi_site_coverage: true,
    max_sites_supported: 30,
    offers_service_agreements: true,
    service_agreement_types: ['preventive_maintenance', 'full_service', 'parts_labor', 'emergency_only'],
    dispatch_crm: 'ServiceTitan',
    avg_quote_turnaround_hours: 3,
    uses_gps_tracking: true,
    num_technicians: 31,
    num_nate_certified: 24,
    metro_area: 'Miami-Fort Lauderdale-Pompano Beach, FL',
    slot_tier: 'exclusive',
    services: [MOCK_SERVICES[0], MOCK_SERVICES[1], MOCK_SERVICES[3]],
  },
]

// ——————————————————————————————————————————
// Testimonials from facility/property managers
// ——————————————————————————————————————————
const TESTIMONIALS = [
  {
    quote:
      'We manage 14 office buildings across the metro and needed contractors who understood multi-site SLAs — not someone who also fixes home AC units. My HVAC Tech connected us with a contractor that had the exact tonnage experience and response time commitments we required.',
    name: 'Sandra K.',
    title: 'Director of Facilities',
    company: 'Apex Property Group',
    buildingType: 'Office Portfolio — 14 buildings, 800,000 sq ft',
  },
  {
    quote:
      'After two bad experiences with generic listing sites that sent me residential contractors, I found My HVAC Tech. Every contractor here has verified commercial experience. The ability to filter by building type and system type saved me hours of vetting calls.',
    name: 'Marcus T.',
    title: 'Facility Manager',
    company: 'Meridian Health Systems',
    buildingType: 'Healthcare — 3 medical office buildings',
  },
  {
    quote:
      'We had a chiller go down at our distribution center on a Friday night. I submitted a request on My HVAC Tech, and had a qualified contractor on-site within the stated SLA window. The emergency response time data shown on contractor profiles is real — it matched exactly.',
    name: 'Priya R.',
    title: 'Regional Property Manager',
    company: 'Westfield Industrial Partners',
    buildingType: 'Industrial / Warehouse — 2.1M sq ft',
  },
]

// ——————————————————————————————————————————
// Homepage sections
// ——————————————————————————————————————————

const HOW_IT_WORKS = [
  {
    icon: <Building2 size={28} aria-hidden="true" />,
    step: '01',
    title: 'Describe Your Property',
    description:
      'Enter your building type, square footage, number of RTUs or system type, and what you need — repair, replacement, new install, or a service agreement.',
  },
  {
    icon: <ClipboardList size={28} aria-hidden="true" />,
    step: '02',
    title: 'Get Matched',
    description:
      'We route your request to 2–3 vetted contractors in your metro with verified experience in your building type, system, and tonnage range.',
  },
  {
    icon: <CheckCircle size={28} aria-hidden="true" />,
    step: '03',
    title: 'Compare & Hire',
    description:
      'Review verified portfolios, SLAs, and emergency response times side-by-side. Choose the contractor with the right credentials for your facility.',
  },
]

const TRUST_INDICATORS = [
  { icon: <ShieldCheck size={16} aria-hidden="true" />, label: 'Commercial-Only Focus' },
  { icon: <BadgeCheck size={16} aria-hidden="true" />, label: 'Verified SLAs & Response Times' },
  { icon: <Star size={16} aria-hidden="true" />, label: '100% Free for Property Managers' },
]

const NOT_ANGI_POINTS = [
  {
    icon: <BadgeCheck size={20} aria-hidden="true" />,
    text: 'We only list contractors with verified commercial experience',
  },
  {
    icon: <Search size={20} aria-hidden="true" />,
    text: 'Filter by building type, tonnage range, and system type — RTUs, VRF, chilled water, and more',
  },
  {
    icon: <Clock size={20} aria-hidden="true" />,
    text: 'See real SLAs, emergency response windows, and completed project portfolios',
  },
  {
    icon: <Users size={20} aria-hidden="true" />,
    text: 'No homeowner leads — every inquiry is from a property or facility manager',
  },
]

// Top cities are fetched dynamically from Supabase in the async HomePage component

/** Fetch top cities by contractor count from Supabase */
async function getTopCities() {
  try {
    const db = createAdminClient()
    // Fetch city + state for all active contractors
    const { data, error } = await db
      .from('contractors')
      .select('city, state')
      .neq('subscription_status', 'cancelled')

    if (error || !data || data.length === 0) return []

    // Group by city+state and count
    const cityMap = new Map<string, { city: string; state: string; count: number }>()
    for (const row of data) {
      if (!row.city || !row.state) continue
      const key = `${row.city.trim()}|${row.state.trim()}`
      const existing = cityMap.get(key)
      if (existing) {
        existing.count++
      } else {
        cityMap.set(key, { city: row.city.trim(), state: row.state.trim(), count: 1 })
      }
    }

    // Sort by count descending, take top 8
    const sorted = [...cityMap.values()].sort((a, b) => b.count - a.count).slice(0, 8)

    // Map state abbreviation to full name
    return sorted.map(c => {
      const stateObj = US_STATES.find(s => s.abbr === c.state)
      return {
        city: c.city,
        state: stateObj?.name ?? c.state,
        stateAbbr: c.state,
        contractorCount: c.count,
      }
    })
  } catch (err) {
    console.error('Failed to fetch top cities:', err)
    return []
  }
}

/** Fetch featured contractors from Supabase */
async function getFeaturedContractors() {
  try {
    const db = createAdminClient()
    const { data, error } = await db
      .from('contractors')
      .select('*')
      .neq('subscription_status', 'cancelled')
      .order('review_count', { ascending: false })
      .limit(3)

    if (error || !data) return []
    return data as (Contractor & { services: Service[] })[]
  } catch (err) {
    console.error('Failed to fetch featured contractors:', err)
    return []
  }
}

export default async function HomePage() {
  const [topCities, featuredContractors] = await Promise.all([
    getTopCities(),
    getFeaturedContractors(),
  ])

  // Use live contractors if available, otherwise fall back to mocks
  const displayContractors = featuredContractors.length > 0
    ? featuredContractors
    : MOCK_CONTRACTORS

  const featuredServices = HVAC_SERVICES.slice(0, 6).map((s, i) => ({
    id: `svc-${i}`,
    name: s.name,
    slug: s.slug,
    category: s.category,
    description: null,
    icon: null,
  }))

  return (
    <>
      {/* ================================================
          HERO SECTION
      ================================================ */}
      <section
        className="relative bg-gradient-to-b from-primary-50 to-white pt-14 pb-16 sm:pt-20 sm:pb-20"
        aria-labelledby="hero-heading"
      >
        {/* Subtle grid pattern overlay */}
        <div
          className="absolute inset-0 opacity-40"
          style={{
            backgroundImage:
              'radial-gradient(circle, #cbd5e1 1px, transparent 1px)',
            backgroundSize: '28px 28px',
          }}
          aria-hidden="true"
        />

        <div className="relative max-w-4xl mx-auto px-4 sm:px-6 text-center">
          {/* Eyebrow */}
          <p className="inline-flex items-center gap-1.5 text-sm font-medium text-primary-600 bg-primary-50 border border-primary-100 rounded-full px-3 py-1 mb-5">
            <ShieldCheck size={14} aria-hidden="true" />
            The Commercial HVAC Marketplace
          </p>

          {/* Heading */}
          <h1
            id="hero-heading"
            className="text-4xl sm:text-5xl font-bold text-neutral-900 leading-tight tracking-tight mb-5"
            style={{ fontFamily: 'var(--font-plus-jakarta-sans, "Plus Jakarta Sans", sans-serif)' }}
          >
            Find Vetted{' '}
            <span className="text-primary-600">Commercial HVAC</span>{' '}
            Contractors for Your Facility
          </h1>

          {/* Subheading */}
          <p className="text-lg sm:text-xl text-neutral-600 mb-8 max-w-2xl mx-auto leading-relaxed">
            Purpose-built for property and facility managers — not Angi, not HomeAdvisor. Search by building type, system type, and service agreements. Every contractor is vetted for commercial experience, verified SLAs, and emergency response.
          </p>

          {/* Search bar */}
          <div className="max-w-3xl mx-auto mb-6">
            <SearchBar variant="hero" />
          </div>

          {/* Trust indicators */}
          <div className="flex flex-wrap items-center justify-center gap-5 text-sm text-neutral-500">
            {TRUST_INDICATORS.map((item) => (
              <span key={item.label} className="flex items-center gap-1.5 font-medium">
                <span className="text-primary-500">{item.icon}</span>
                {item.label}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* ================================================
          BRAND LOGOS MARQUEE
      ================================================ */}
      <section className="py-10 sm:py-12 bg-white border-b border-neutral-100" aria-label="Brands we service">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <p className="text-center text-xs font-semibold uppercase tracking-widest text-neutral-400 mb-6">
            Contractors experienced with all major brands
          </p>
          <div className="relative overflow-hidden">
            {/* Fade edges */}
            <div className="absolute left-0 top-0 bottom-0 w-16 sm:w-24 bg-gradient-to-r from-white to-transparent z-10 pointer-events-none" aria-hidden="true" />
            <div className="absolute right-0 top-0 bottom-0 w-16 sm:w-24 bg-gradient-to-l from-white to-transparent z-10 pointer-events-none" aria-hidden="true" />
            {/* Scrolling track */}
            <div className="flex animate-marquee whitespace-nowrap gap-12 sm:gap-16">
              {[
                'Carrier', 'Trane', 'Lennox', 'Daikin', 'York',
                'Mitsubishi Electric', 'Johnson Controls', 'Honeywell',
                'Bosch', 'Rheem', 'McQuay', 'Heil', 'Goodman', 'American Standard',
                'Carrier', 'Trane', 'Lennox', 'Daikin', 'York',
                'Mitsubishi Electric', 'Johnson Controls', 'Honeywell',
                'Bosch', 'Rheem', 'McQuay', 'Heil', 'Goodman', 'American Standard',
              ].map((brand, i) => (
                <span
                  key={`${brand}-${i}`}
                  className="inline-block text-sm sm:text-base font-semibold text-neutral-500 select-none"
                >
                  {brand}
                </span>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ================================================
          HOW IT WORKS
      ================================================ */}
      <section className="py-16 sm:py-20 bg-white" aria-labelledby="how-it-works-heading">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2
              id="how-it-works-heading"
              className="text-2xl sm:text-3xl font-bold text-neutral-900 mb-3"
              style={{ fontFamily: 'var(--font-plus-jakarta-sans, "Plus Jakarta Sans", sans-serif)' }}
            >
              How It Works
            </h2>
            <p className="text-neutral-500 text-base max-w-xl mx-auto">
              Get matched with the right commercial HVAC contractor in minutes, not days.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {HOW_IT_WORKS.map((item, idx) => (
              <div
                key={item.step}
                className="relative flex flex-col items-center text-center md:items-start md:text-left"
              >
                {/* Connector line (desktop) */}
                {idx < HOW_IT_WORKS.length - 1 && (
                  <div
                    className="hidden md:block absolute top-6 left-[calc(50%+28px)] right-0 h-px bg-neutral-200 -translate-y-0.5"
                    aria-hidden="true"
                  />
                )}

                <div className="relative flex items-center justify-center w-14 h-14 rounded-2xl bg-primary-50 text-primary-600 mb-4 shrink-0">
                  {item.icon}
                  <span className="absolute -top-2 -right-2 w-6 h-6 flex items-center justify-center rounded-full bg-primary-600 text-white text-xs font-bold leading-none">
                    {idx + 1}
                  </span>
                </div>

                <h3 className="text-lg font-semibold text-neutral-900 mb-2">{item.title}</h3>
                <p className="text-sm text-neutral-500 leading-relaxed max-w-xs md:max-w-none">
                  {item.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ================================================
          NOT ANGI — DIFFERENTIATION SECTION
      ================================================ */}
      <section className="py-16 sm:py-20 bg-neutral-900" aria-labelledby="not-angi-heading">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            {/* Left: Headline */}
            <div>
              <p className="inline-flex items-center gap-1.5 text-xs font-semibold tracking-widest uppercase text-primary-400 mb-4">
                Why My HVAC Tech
              </p>
              <h2
                id="not-angi-heading"
                className="text-2xl sm:text-3xl font-bold text-white mb-5 leading-snug"
                style={{ fontFamily: 'var(--font-plus-jakarta-sans, "Plus Jakarta Sans", sans-serif)' }}
              >
                Built for Commercial.{' '}
                <span className="text-primary-400">Not Residential.</span>
              </h2>
              <p className="text-neutral-400 text-base leading-relaxed mb-6">
                Angi and HomeAdvisor were built for homeowners. My HVAC Tech was built from the ground up for facility managers, property managers, and commercial real estate professionals who need contractors that can handle office towers, industrial facilities, healthcare campuses, and everything in between.
              </p>
              <Link
                href="/about"
                className="inline-flex items-center gap-1.5 text-sm font-medium text-primary-400 hover:text-primary-300 transition-colors"
              >
                Learn more about our vetting process →
              </Link>
            </div>

            {/* Right: Differentiators */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {NOT_ANGI_POINTS.map((point) => (
                <div
                  key={point.text}
                  className="flex items-start gap-3 bg-neutral-800 rounded-xl p-4 border border-neutral-700"
                >
                  <span className="mt-0.5 shrink-0 text-primary-400">{point.icon}</span>
                  <p className="text-sm text-neutral-200 leading-relaxed">{point.text}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ================================================
          FEATURED CONTRACTORS
      ================================================ */}
      <section className="py-16 sm:py-20 bg-neutral-50" aria-labelledby="featured-heading">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-8">
            <div>
              <h2
                id="featured-heading"
                className="text-2xl sm:text-3xl font-bold text-neutral-900 mb-2"
                style={{ fontFamily: 'var(--font-plus-jakarta-sans, "Plus Jakarta Sans", sans-serif)' }}
              >
                Featured Commercial HVAC Contractors
              </h2>
              <p className="text-neutral-500 text-base">
                Commercially verified — screened for experience, SLAs, and real project portfolios
              </p>
            </div>
            <Link
              href="/search"
              className="shrink-0 text-sm font-medium text-primary-600 hover:text-primary-700 hover:underline underline-offset-2 transition-colors"
            >
              View all contractors →
            </Link>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {displayContractors.map((contractor) => (
              <ContractorCard key={contractor.id} contractor={contractor} />
            ))}
          </div>

          <div className="mt-8 text-center">
            <Link
              href="/search"
              className="inline-flex items-center justify-center rounded-lg font-medium transition-colors duration-150 h-12 px-6 text-base border border-neutral-300 bg-white text-neutral-700 hover:bg-neutral-50"
            >
              View All Contractors
            </Link>
          </div>
        </div>
      </section>

      {/* ================================================
          FACILITY MANAGER TESTIMONIALS
      ================================================ */}
      <section className="py-16 sm:py-20 bg-white" aria-labelledby="testimonials-heading">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-10">
            <h2
              id="testimonials-heading"
              className="text-2xl sm:text-3xl font-bold text-neutral-900 mb-3"
              style={{ fontFamily: 'var(--font-plus-jakarta-sans, "Plus Jakarta Sans", sans-serif)' }}
            >
              What Facility Managers Are Saying
            </h2>
            <p className="text-neutral-500 text-base max-w-lg mx-auto">
              Trusted by property and facility managers at commercial buildings nationwide.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {TESTIMONIALS.map((t) => (
              <div
                key={t.name}
                className="flex flex-col bg-neutral-50 rounded-2xl border border-neutral-200 p-6 gap-5"
              >
                {/* Stars */}
                <div className="flex items-center gap-0.5">
                  {[...Array(5)].map((_, i) => (
                    <Star
                      key={i}
                      size={14}
                      className="fill-amber-400 text-amber-400"
                      aria-hidden="true"
                    />
                  ))}
                </div>

                {/* Quote */}
                <blockquote className="text-sm text-neutral-700 leading-relaxed flex-1">
                  &ldquo;{t.quote}&rdquo;
                </blockquote>

                {/* Attribution */}
                <div className="border-t border-neutral-200 pt-4">
                  <p className="text-sm font-semibold text-neutral-900">{t.name}</p>
                  <p className="text-xs text-neutral-500">{t.title}, {t.company}</p>
                  <p className="text-xs text-primary-600 font-medium mt-1">{t.buildingType}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ================================================
          BROWSE BY SERVICE
      ================================================ */}
      <section className="py-16 sm:py-20 bg-neutral-50" aria-labelledby="services-heading">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-10">
            <h2
              id="services-heading"
              className="text-2xl sm:text-3xl font-bold text-neutral-900 mb-3"
              style={{ fontFamily: 'var(--font-plus-jakarta-sans, "Plus Jakarta Sans", sans-serif)' }}
            >
              Browse by Commercial HVAC Service
            </h2>
            <p className="text-neutral-500 text-base max-w-lg mx-auto">
              Find contractors specialized in the exact commercial HVAC service you need — results filtered by building type and system experience.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {featuredServices.map((service) => (
              <ServiceCard key={service.id} service={service} />
            ))}
          </div>

          <div className="mt-8 text-center">
            <Link
              href="/services"
              className="inline-flex items-center gap-1.5 text-sm font-medium text-primary-600 hover:text-primary-700 hover:underline underline-offset-2 transition-colors"
            >
              View all HVAC services →
            </Link>
          </div>
        </div>
      </section>

      {/* ================================================
          TOP CITIES
      ================================================ */}
      <section className="py-16 sm:py-20 bg-white" aria-labelledby="cities-heading">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-10">
            <h2
              id="cities-heading"
              className="text-2xl sm:text-3xl font-bold text-neutral-900 mb-3"
              style={{ fontFamily: 'var(--font-plus-jakarta-sans, "Plus Jakarta Sans", sans-serif)' }}
            >
              Find Contractors By City
            </h2>
            <p className="text-neutral-500 text-base max-w-lg mx-auto">
              Browse verified commercial HVAC contractors in cities across the US.
            </p>
          </div>

          {topCities.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {topCities.map((city) => (
                <CityCard
                  key={`${city.city}-${city.stateAbbr}`}
                  city={city.city}
                  state={city.state}
                  stateAbbr={city.stateAbbr}
                  contractorCount={city.contractorCount}
                />
              ))}
            </div>
          ) : (
            <p className="text-center text-neutral-400 text-sm py-8">
              City listings will appear here as contractors are added.
            </p>
          )}
        </div>
      </section>

      {/* ================================================
          CTA SECTION — DUAL CTA
      ================================================ */}
      <section
        className="py-16 sm:py-20 bg-primary-600"
        aria-labelledby="cta-heading"
      >
        <div className="max-w-3xl mx-auto px-4 sm:px-6 text-center">
          <h2
            id="cta-heading"
            className="text-2xl sm:text-3xl font-bold text-white mb-4 leading-tight"
            style={{ fontFamily: 'var(--font-plus-jakarta-sans, "Plus Jakarta Sans", sans-serif)' }}
          >
            Ready to Find the Right Contractor for Your Facility?
          </h2>
          <p className="text-primary-100 text-base sm:text-lg mb-8 max-w-2xl mx-auto leading-relaxed">
            Describe your property and we&apos;ll match you with 2–3 vetted commercial HVAC contractors in your metro — at no cost to you.
          </p>

          {/* Primary CTA — Facility Managers */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mb-6">
            <Link
              href="/get-quotes"
              className="inline-flex items-center justify-center gap-2 px-8 py-3.5 rounded-lg bg-white text-primary-700 font-semibold text-base hover:bg-primary-50 transition-colors shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-primary-600"
            >
              Get Matched with Vetted Contractors — Free
            </Link>
          </div>

          {/* Secondary CTA — Contractors */}
          <div className="border-t border-primary-500 pt-6">
            <p className="text-primary-100 text-sm mb-3">
              Are you a commercial HVAC contractor?
            </p>
            <Link
              href="/for-contractors"
              className="inline-flex items-center gap-1.5 text-sm font-semibold text-white hover:text-primary-100 transition-colors underline underline-offset-2"
            >
              List your business and reach facility managers in your market →
            </Link>
          </div>

          <p className="mt-5 text-xs text-primary-200">
            No credit card required. Commercial-only inquiries. Free for property and facility managers.
          </p>
        </div>
      </section>
    </>
  )
}
